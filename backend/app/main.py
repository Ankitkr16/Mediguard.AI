import os
import shutil
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import json

from backend.app.config import settings
from backend.app.database import Base, engine, get_db
from backend.app.models import User, AllergyProfile, Reminder, History, FamilyProfile, DigitalTwin, LabReport, Inventory, AdherenceLog, WearableLog
from backend.app.auth import verify_password, get_password_hash, create_access_token, get_current_user
from backend.app.schemas import (
    UserCreate, UserLogin, UserOut, Token,
    AllergyCreate, AllergyOut, ReminderCreate, ReminderUpdate, ReminderOut,
    InteractionRequest, InteractionResponse, InteractionDetail, DuplicateDetail,
    FoodInteractionDetail, AlcoholInteractionDetail, ChatRequest, ChatResponse,
    DashboardAnalytics, FamilyProfileCreate, FamilyProfileOut, DigitalTwinOut,
    DigitalTwinUpdate, LabReportOut, InventoryCreate, InventoryOut,
    WearableLogCreate, WearableLogOut, EmergencyRiskRequest, EmergencyRiskResponse
)
from backend.app.drug_data import DRUG_DATABASE, DRUG_INTERACTIONS
from backend.app.ocr import scan_medicine_strip, scan_prescription, scan_expiry_date
from backend.app.ml_model import classify_risk_ml
from backend.app.rag import generate_chatbot_response, text_to_speech_base64
from backend.app.pdf_gen import generate_pdf_report

# New Healthcare OS Services
from backend.app.ai_services import (
    analyze_lab_report_text, analyze_discharge_summary, evaluate_emergency_risk,
    analyze_insurance_coverage, research_treatment_guidelines
)
from backend.app.ml_pipeline import predict_adherence_probability
from backend.app.knowledge_graph import get_knowledge_graph_data

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="MediGuard AI - Smart Medicine Safety Assistant API",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- STARTUP EVENT ---
@app.on_event("startup")
def startup_populate():
    print("MediGuard AI FastAPI Backend is starting up...")

# --- AUTH ENDPOINTS ---

@app.post(f"{settings.API_V1_STR}/auth/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists."
        )
    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post(f"{settings.API_V1_STR}/auth/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    access_token = create_access_token(subject=user.email)
    return {"access_token": access_token, "token_type": "bearer"}

@app.get(f"{settings.API_V1_STR}/auth/profile", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


# --- MEDICINE INTERACTION CHECKER ---

@app.post(f"{settings.API_V1_STR}/drugs/check", response_model=InteractionResponse)
def check_drug_safety(req: InteractionRequest, current_user: Optional[User] = Depends(get_current_user)):
    normalized_drugs = [d.strip().lower() for d in req.drugs if d.strip()]
    if not normalized_drugs:
        raise HTTPException(status_code=400, detail="Medication list cannot be empty.")

    # 1. Resolve brand names to active ingredients & collect monographs
    active_to_brand: Dict[str, List[str]] = {}
    med_monographs: Dict[str, Dict[str, Any]] = {}
    
    for input_drug in normalized_drugs:
        # Check if we have the drug in our database
        matched_key = None
        for db_key in DRUG_DATABASE.keys():
            if db_key in input_drug or input_drug in db_key:
                matched_key = db_key
                break
                
        if matched_key:
            details = DRUG_DATABASE[matched_key]
            med_monographs[matched_key] = details
            for ing in details["active_ingredients"]:
                if ing not in active_to_brand:
                    active_to_brand[ing] = []
                active_to_brand[ing].append(input_drug.capitalize())
        else:
            # Fallback mock monograph for unknown drugs to avoid blank results
            mock_name = input_drug.capitalize()
            med_monographs[input_drug] = {
                "active_ingredients": [input_drug],
                "category": "General Medication",
                "purpose": "Used as directed by a healthcare professional.",
                "side_effects": {
                    "common": ["Mild stomach upset", "Drowsiness"],
                    "rare": ["Skin rash"],
                    "serious": ["Allergic reaction"],
                    "emergency": ["Anaphylaxis"]
                },
                "food_interactions": ["No general food interactions documented."],
                "alcohol_interaction": {
                    "risk_level": "Medium",
                    "effects": "Alcohol may increase drowsiness or delay healing.",
                    "warnings": "Limit alcohol consumption."
                },
                "precautions": ["Follow doctor's instructions."]
            }
            active_to_brand[input_drug] = [mock_name]

    # 2. Detect duplicate active ingredients
    duplicates: List[DuplicateDetail] = []
    duplicate_count = 0
    for ingredient, brands in active_to_brand.items():
        if len(brands) > 1:
            duplicate_count += 1
            duplicates.append(DuplicateDetail(
                ingredient=ingredient,
                drugs=brands,
                warning=f"Alert: Accidental double-consumption risk! Multiple medicines contain the active ingredient '{ingredient}'."
            ))

    # 3. Detect pairwise drug-drug interactions
    interactions: List[InteractionDetail] = []
    has_high_risk = False
    has_med_risk = False
    
    # Check all pairs
    checked_pairs = set()
    resolved_keys = list(med_monographs.keys())
    
    for i in range(len(resolved_keys)):
        for j in range(i + 1, len(resolved_keys)):
            key_a, key_b = resolved_keys[i], resolved_keys[j]
            # Ensure unique check order
            pair_sorted = tuple(sorted([key_a, key_b]))
            if pair_sorted in checked_pairs:
                continue
            checked_pairs.add(pair_sorted)
            
            # Check interactions list
            # Match by active ingredients or keys
            int_info = None
            
            # Try to lookup using active ingredients combo
            ingredients_a = DRUG_DATABASE.get(key_a, {}).get("active_ingredients", [key_a])
            ingredients_b = DRUG_DATABASE.get(key_b, {}).get("active_ingredients", [key_b])
            
            for ing_a in ingredients_a:
                for ing_b in ingredients_b:
                    lookup_pair_1 = (ing_a, ing_b)
                    lookup_pair_2 = (ing_b, ing_a)
                    if lookup_pair_1 in DRUG_INTERACTIONS:
                        int_info = DRUG_INTERACTIONS[lookup_pair_1]
                        break
                    elif lookup_pair_2 in DRUG_INTERACTIONS:
                        int_info = DRUG_INTERACTIONS[lookup_pair_2]
                        break
            
            # Direct key lookup
            if not int_info:
                if (key_a, key_b) in DRUG_INTERACTIONS:
                    int_info = DRUG_INTERACTIONS[(key_a, key_b)]
                elif (key_b, key_a) in DRUG_INTERACTIONS:
                    int_info = DRUG_INTERACTIONS[(key_b, key_a)]

            if int_info:
                r_level = int_info["risk_level"]
                if r_level == "High":
                    has_high_risk = True
                elif r_level == "Medium":
                    has_med_risk = True
                    
                interactions.append(InteractionDetail(
                    drug_a=key_a.capitalize(),
                    drug_b=key_b.capitalize(),
                    risk_level=r_level,
                    description=int_info["description"],
                    precautions=int_info["precautions"]
                ))

    # 4. Check user allergies (if logged in)
    allergy_alerts: List[str] = []
    has_allergy_match = False
    
    if current_user:
        # Load db session
        db = next(get_db())
        user_allergies = db.query(AllergyProfile).filter(AllergyProfile.user_id == current_user.id).all()
        for allergy in user_allergies:
            allergen = allergy.allergen_name.lower()
            # Match allergy with active ingredients or drug names
            for drug_key, details in med_monographs.items():
                if allergen in drug_key or any(allergen in ing for ing in details["active_ingredients"]):
                    has_allergy_match = True
                    allergy_alerts.append(
                        f"🚨 RED ALERT: Potential allergy risk! Medicine '{drug_key.capitalize()}' "
                        f"matches your allergy profile for '{allergy.allergen_name}' (Severity: {allergy.severity})."
                    )

    # 5. Food & Alcohol interactions
    food_interactions: List[FoodInteractionDetail] = []
    alcohol_interactions: List[AlcoholInteractionDetail] = []
    precautions: List[str] = []
    side_effects: Dict[str, Dict[str, List[str]]] = {}
    total_side_effects_count = 0

    for drug_key, details in med_monographs.items():
        # Food
        food_interactions.append(FoodInteractionDetail(
            drug=drug_key.capitalize(),
            foods_to_avoid=details["food_interactions"],
            description="Recommended dietary restrictions.",
            precautions=f"Take care when consuming meals close to taking {drug_key.capitalize()}."
        ))
        
        # Alcohol
        alc = details["alcohol_interaction"]
        alcohol_interactions.append(AlcoholInteractionDetail(
            drug=drug_key.capitalize(),
            risk_level=alc["risk_level"],
            description=alc["effects"],
            precautions=alc["warnings"]
        ))
        
        # Precautions
        for prec in details["precautions"]:
            precautions.append(f"{drug_key.capitalize()}: {prec}")
            
        # Side Effects
        side_effects[drug_key.capitalize()] = details["side_effects"]
        total_side_effects_count += len(details["side_effects"]["common"]) + len(details["side_effects"]["serious"])

    # 6. ML Classifier Inference
    predicted_risk, risk_score = classify_risk_ml(
        num_medicines=len(normalized_drugs),
        has_high_risk_pair=1 if has_high_risk else 0,
        has_medium_risk_pair=1 if has_med_risk else 0,
        total_side_effects=total_side_effects_count,
        age_group=req.age_group,
        has_alcohol=1 if req.alcohol else 0,
        has_allergy_match=1 if has_allergy_match else 0,
        duplicate_ingredients_count=duplicate_count
    )
    
    # Save check event to user history if logged in
    if current_user:
        db = next(get_db())
        history_entry = History(
            user_id=current_user.id,
            event_type="interaction_check",
            details_json=json.dumps({
                "drugs": req.drugs,
                "overall_risk": predicted_risk,
                "risk_score": risk_score,
                "interactions_count": len(interactions),
                "duplicates_count": len(duplicates),
                "allergies_matched": len(allergy_alerts)
            })
        )
        db.add(history_entry)
        db.commit()

    return InteractionResponse(
        overall_risk=predicted_risk,
        predicted_risk_score=risk_score,
        interactions=interactions,
        duplicates=duplicates,
        allergy_alerts=allergy_alerts,
        food_interactions=food_interactions,
        alcohol_interactions=alcohol_interactions,
        precautions=list(set(precautions)),
        side_effects=side_effects
    )


# --- MEDICINE & PRESCRIPTION SCANNERS ---

@app.post(f"{settings.API_V1_STR}/drugs/scan")
def upload_medicine_strip(file: UploadFile = File(...), current_user: Optional[User] = Depends(get_current_user)):
    # Create file path
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Run strip scan
        scan_data = scan_medicine_strip(file_path)
        # Run expiry check on the same image
        expiry_data = scan_expiry_date(file_path)
        
        # Save to history if logged in
        if current_user:
            db = next(get_db())
            history_entry = History(
                user_id=current_user.id,
                event_type="strip_scan",
                details_json=json.dumps({
                    "filename": file.filename,
                    "detected_drugs": scan_data["detected_drugs"],
                    "expiry_status": expiry_data["status"],
                    "expiry_date": expiry_data["exp_date"]
                })
            )
            db.add(history_entry)
            db.commit()
            
        return {
            "success": True,
            "detected_drugs": scan_data["detected_drugs"],
            "expiry": expiry_data,
            "raw_text": scan_data["raw_text"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {e}")
    finally:
        # Clean up local file to save space
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass

@app.post(f"{settings.API_V1_STR}/drugs/prescription")
def upload_prescription(file: UploadFile = File(...), current_user: Optional[User] = Depends(get_current_user)):
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Run prescription scan
        scan_data = scan_prescription(file_path)
        
        if current_user:
            db = next(get_db())
            history_entry = History(
                user_id=current_user.id,
                event_type="prescription_scan",
                details_json=json.dumps({
                    "filename": file.filename,
                    "schedule": scan_data["schedule"]
                })
            )
            db.add(history_entry)
            db.commit()
            
        return {
            "success": True,
            "schedule": scan_data["schedule"],
            "raw_text": scan_data["raw_text"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing prescription: {e}")
    finally:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass


# --- ALLERGY MANAGEMENT ENDPOINTS ---

@app.post(f"{settings.API_V1_STR}/drugs/allergies", response_model=AllergyOut)
def add_allergy(allergy: AllergyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if duplicate allergy already exists
    dup = db.query(AllergyProfile).filter(
        AllergyProfile.user_id == current_user.id,
        AllergyProfile.allergen_name.ilike(allergy.allergen_name)
    ).first()
    if dup:
        raise HTTPException(status_code=400, detail="Allergy already configured in your profile.")
        
    new_allergy = AllergyProfile(
        user_id=current_user.id,
        allergen_name=allergy.allergen_name,
        severity=allergy.severity
    )
    db.add(new_allergy)
    db.commit()
    db.refresh(new_allergy)
    
    # Save check event to user history
    history_entry = History(
        user_id=current_user.id,
        event_type="allergy_add",
        details_json=json.dumps({"allergen": allergy.allergen_name, "severity": allergy.severity})
    )
    db.add(history_entry)
    db.commit()
    
    return new_allergy

@app.get(f"{settings.API_V1_STR}/drugs/allergies", response_model=List[AllergyOut])
def list_allergies(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(AllergyProfile).filter(AllergyProfile.user_id == current_user.id).all()

@app.delete(f"{settings.API_V1_STR}/drugs/allergies/{{allergy_id}}", status_code=status.HTTP_200_OK)
def remove_allergy(allergy_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    allergy = db.query(AllergyProfile).filter(
        AllergyProfile.id == allergy_id, 
        AllergyProfile.user_id == current_user.id
    ).first()
    if not allergy:
        raise HTTPException(status_code=404, detail="Allergy profile not found.")
    db.delete(allergy)
    db.commit()
    return {"detail": "Allergy profile successfully deleted."}


# --- MEDICINE REMINDER & SCHEDULE ENDPOINTS ---

@app.post(f"{settings.API_V1_STR}/drugs/reminders", response_model=ReminderOut)
def create_reminder(reminder: ReminderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_rem = Reminder(
        user_id=current_user.id,
        drug_name=reminder.drug_name,
        dosage=reminder.dosage,
        time_of_day=reminder.time_of_day,
        days_of_week=reminder.days_of_week,
        active=reminder.active
    )
    db.add(new_rem)
    db.commit()
    db.refresh(new_rem)
    return new_rem

@app.get(f"{settings.API_V1_STR}/drugs/reminders", response_model=List[ReminderOut])
def list_reminders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Reminder).filter(Reminder.user_id == current_user.id).all()

@app.put(f"{settings.API_V1_STR}/drugs/reminders/{{reminder_id}}", response_model=ReminderOut)
def update_reminder(reminder_id: int, update_data: ReminderUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rem = db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id).first()
    if not rem:
        raise HTTPException(status_code=404, detail="Reminder not found.")
        
    for key, val in update_data.dict(exclude_unset=True).items():
        setattr(rem, key, val)
        
    db.commit()
    db.refresh(rem)
    return rem

@app.post(f"{settings.API_V1_STR}/drugs/reminders/{{reminder_id}}/checkin", response_model=ReminderOut)
def checkin_reminder(reminder_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rem = db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id).first()
    if not rem:
        raise HTTPException(status_code=404, detail="Reminder not found.")
        
    from datetime import datetime
    rem.last_taken = datetime.utcnow()
    
    # Save take event to user history
    history_entry = History(
        user_id=current_user.id,
        event_type="medicine_take",
        details_json=json.dumps({"drug_name": rem.drug_name, "dosage": rem.dosage, "time_of_day": rem.time_of_day})
    )
    db.add(history_entry)
    db.commit()
    db.refresh(rem)
    return rem

@app.delete(f"{settings.API_V1_STR}/drugs/reminders/{{reminder_id}}")
def delete_reminder(reminder_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rem = db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id).first()
    if not rem:
        raise HTTPException(status_code=404, detail="Reminder not found.")
    db.delete(rem)
    db.commit()
    return {"detail": "Reminder successfully deleted."}


# --- HEALTH REPORT GENERATOR (PDF) ---

@app.get(f"{settings.API_V1_STR}/drugs/report")
def download_health_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Fetch user medications (reminders represent the medicines)
    reminders = db.query(Reminder).filter(Reminder.user_id == current_user.id).all()
    user_drugs = list(set([r.drug_name for r in reminders]))
    
    # 2. Fetch user allergies
    allergies = db.query(AllergyProfile).filter(AllergyProfile.user_id == current_user.id).all()
    
    # 3. Perform interaction checks
    medicines_list = []
    interactions_list = []
    duplicates_list = []
    allergies_list = [{"allergen_name": a.allergen_name, "severity": a.severity} for a in allergies]
    reminders_list = [
        {
            "drug_name": r.drug_name,
            "dosage": r.dosage,
            "time_of_day": r.time_of_day,
            "days_of_week": r.days_of_week
        } for r in reminders
    ]
    
    if user_drugs:
        # Re-use the checker function internally
        checker_req = InteractionRequest(drugs=user_drugs)
        try:
            check_res = check_drug_safety(checker_req, current_user=current_user)
            overall_risk = check_res.overall_risk
            risk_score = check_res.predicted_risk_score
            
            # Map values back
            interactions_list = [{"drug_a": i.drug_a, "drug_b": i.drug_b, "risk_level": i.risk_level, "description": i.description, "precautions": i.precautions} for i in check_res.interactions]
            duplicates_list = [{"ingredient": d.ingredient, "drugs": d.drugs, "warning": d.warning} for d in check_res.duplicates]
            
            # Reconstruct active medicine profiles with ingredients
            for drug in user_drugs:
                drug_norm = drug.lower()
                matched_key = None
                for key in DRUG_DATABASE.keys():
                    if key in drug_norm or drug_norm in key:
                        matched_key = key
                        break
                if matched_key:
                    medicines_list.append({
                        "name": drug.capitalize(),
                        "active_ingredients": DRUG_DATABASE[matched_key]["active_ingredients"],
                        "category": DRUG_DATABASE[matched_key]["category"]
                    })
                else:
                    medicines_list.append({
                        "name": drug.capitalize(),
                        "active_ingredients": [drug],
                        "category": "General Medicine"
                    })
        except Exception as e:
            print(f"Error checking safety for report: {e}")
            overall_risk = "Low"
            risk_score = 5.0
    else:
        overall_risk = "Low"
        risk_score = 0.0
        
    # Generate PDF
    pdf_buffer = generate_pdf_report(
        user_name=current_user.full_name,
        medicines=medicines_list,
        interactions=interactions_list,
        duplicates=duplicates_list,
        allergies=allergies_list,
        reminders=reminders_list,
        overall_risk=overall_risk,
        risk_score=risk_score
    )
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=MediGuard_AI_Health_Report.pdf"}
    )


# --- AI CHATBOT & VOICE ASSISTANT ---

@app.post(f"{settings.API_V1_STR}/assistant/chat", response_model=ChatResponse)
def chatbot_chat(req: ChatRequest, current_user: Optional[User] = Depends(get_current_user)):
    try:
        response_text = generate_chatbot_response(req.message)
        
        # Save to history if logged in
        if current_user:
            db = next(get_db())
            history_entry = History(
                user_id=current_user.id,
                event_type="chatbot_query",
                details_json=json.dumps({"query": req.message[:150], "response_length": len(response_text)})
            )
            db.add(history_entry)
            db.commit()
            
        audio_b64 = None
        if req.voice_output:
            audio_b64 = text_to_speech_base64(response_text)
            
        return ChatResponse(response=response_text, audio_base64=audio_b64)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating response: {e}")


# --- ANALYTICS DASHBOARD DATA ---

@app.get(f"{settings.API_V1_STR}/dashboard/analytics", response_model=DashboardAnalytics)
def get_dashboard_analytics(
    profile_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get active profile ID
    if not profile_id:
        default_prof = get_or_create_default_profile(db, current_user)
        profile_id = default_prof.id

    # 1. Total Scans
    scans_count = db.query(History).filter(
        History.user_id == current_user.id,
        History.event_type.in_(["strip_scan", "prescription_scan"])
    ).count()
    
    # 2. Total Reminders for this profile
    reminders = db.query(Reminder).filter(
        Reminder.user_id == current_user.id,
        Reminder.profile_id == profile_id
    ).all()
    reminders_count = len(reminders)
    
    # 3. Adherence rate for this profile's reminders
    reminder_ids = [r.id for r in reminders]
    take_events = 0
    if reminder_ids:
        take_events = db.query(AdherenceLog).filter(
            AdherenceLog.reminder_id.in_(reminder_ids),
            AdherenceLog.status == "Taken"
        ).count()
        
    adherence_rate = 100.0
    if reminders_count > 0:
        expected = reminders_count * 5  # arbitrary comparison scale
        adherence_rate = min(100.0, (take_events / expected) * 100.0) if expected > 0 else 100.0
    else:
        adherence_rate = 0.0
        
    # 4. Risk Profile: classify current reminders
    user_drugs = [r.drug_name for r in reminders]
    risk_profile = {"Low": 0, "Medium": 0, "High": 0}
    
    if user_drugs:
        checker_req = InteractionRequest(drugs=list(set(user_drugs)))
        try:
            res = check_drug_safety(checker_req, current_user=current_user)
            risk_profile[res.overall_risk] = 1
        except Exception as e:
            print(f"Error compiling dashboard risk profile: {e}")
            risk_profile["Low"] = 1
    else:
        risk_profile["Low"] = 1
        
    # 5. Recent events list
    recent_history = db.query(History).filter(
        History.user_id == current_user.id
    ).order_by(History.created_at.desc()).limit(10).all()
    
    recent_events = []
    for h in recent_history:
        try:
            metadata = json.loads(h.details_json)
        except:
            metadata = {}
        recent_events.append({
            "id": h.id,
            "event_type": h.event_type,
            "created_at": h.created_at.isoformat() + "Z",
            "metadata": metadata
        })
        
    return DashboardAnalytics(
        total_scans=scans_count,
        total_reminders=reminders_count,
        adherence_rate=round(adherence_rate, 1),
        risk_profile=risk_profile,
        recent_events=recent_events
    )

# Helper to auto-bootstrap a default profile for the user
def get_or_create_default_profile(db: Session, user: User) -> FamilyProfile:
    profile = db.query(FamilyProfile).filter(
        FamilyProfile.user_id == user.id,
        FamilyProfile.relation == "Self"
    ).first()
    
    if not profile:
        profile = FamilyProfile(
            user_id=user.id,
            relation="Self",
            full_name=user.full_name or "Me",
            age=30,
            gender="Male",
            weight=70.0,
            height=175.0
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        
        # Create default digital twin
        twin = DigitalTwin(
            profile_id=profile.id,
            diseases="[]",
            medical_history="No chronic conditions configured.",
            sleep_pattern_avg=7.5,
            activity_score=7000.0
        )
        db.add(twin)
        db.commit()
        
    return profile


# --- MODULE 7: FAMILY HEALTH HUB ---

@app.get(f"{settings.API_V1_STR}/profiles", response_model=List[FamilyProfileOut])
def list_family_profiles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    get_or_create_default_profile(db, current_user)
    return db.query(FamilyProfile).filter(FamilyProfile.user_id == current_user.id).all()


@app.post(f"{settings.API_V1_STR}/profiles", response_model=FamilyProfileOut)
def create_family_profile(req: FamilyProfileCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Create profile
    new_profile = FamilyProfile(
        user_id=current_user.id,
        relation=req.relation,
        full_name=req.full_name,
        age=req.age,
        gender=req.gender,
        weight=req.weight,
        height=req.height
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    
    # Initialize corresponding Digital Twin
    twin = DigitalTwin(
        profile_id=new_profile.id,
        diseases="[]",
        medical_history="",
        sleep_pattern_avg=7.0,
        activity_score=5000.0
    )
    db.add(twin)
    db.commit()
    
    return new_profile


@app.delete(f"{settings.API_V1_STR}/profiles/{{profile_id}}", status_code=status.HTTP_200_OK)
def delete_family_profile(profile_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = db.query(FamilyProfile).filter(
        FamilyProfile.id == profile_id,
        FamilyProfile.user_id == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
    if profile.relation == "Self":
        raise HTTPException(status_code=400, detail="Cannot delete your own self profile.")
    db.delete(profile)
    db.commit()
    return {"detail": "Family profile deleted."}


# --- MODULE 1: AI HEALTH DIGITAL TWIN ---

@app.get(f"{settings.API_V1_STR}/digital-twin/{{profile_id}}", response_model=DigitalTwinOut)
def get_digital_twin_metrics(profile_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = db.query(FamilyProfile).filter(
        FamilyProfile.id == profile_id,
        FamilyProfile.user_id == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
        
    twin = db.query(DigitalTwin).filter(DigitalTwin.profile_id == profile.id).first()
    if not twin:
        # Auto-create if missing
        twin = DigitalTwin(profile_id=profile.id)
        db.add(twin)
        db.commit()
        db.refresh(twin)
        
    # Calculate adherence score
    logs = db.query(AdherenceLog).join(Reminder).filter(Reminder.profile_id == profile.id).all()
    adherence_rate = 100.0
    if logs:
        taken = sum(1 for l in logs if l.status == "Taken")
        adherence_rate = (taken / len(logs)) * 100.0
    else:
        # Default fallback to user metrics
        adherence_rate = 80.0
        
    # Calculate Health Score
    diseases_list = json.loads(twin.diseases or "[]")
    health_score = 95
    health_score -= len(diseases_list) * 5
    if adherence_rate < 80:
        health_score -= 10
    if twin.sleep_pattern_avg < 6.0:
        health_score -= 8
        
    health_score = max(20, min(100, health_score))
    
    # Generate Adherence Prediction Insights using ML Model
    active_reminders_count = db.query(Reminder).filter(Reminder.profile_id == profile.id, Reminder.active == True).count()
    predicted_take_prob = predict_adherence_probability(
        age=profile.age or 35,
        num_medicines=active_reminders_count,
        sleep_hours=twin.sleep_pattern_avg,
        activity_score=twin.activity_score,
        time_of_day=1 # Afternoon test
    )
    
    # Generate insights list
    insights = [
        f"Based on your vitals, your predicted medication adherence score for the next dose is {predicted_take_prob}%.",
        f"Your daily sleep average ({twin.sleep_pattern_avg} hrs) is healthy." if twin.sleep_pattern_avg >= 7.0 else "Increasing average sleep duration will improve overall metabolic stability.",
        "Medication risk profiles are clear." if health_score > 80 else "Review potential drug interactions in details console."
    ]
    if predicted_take_prob < 75.0:
        insights.append("Warning: You are in the high-risk bracket of missing a medication reminder this week. Keep alerts active.")
        
    return DigitalTwinOut(
        profile_id=profile.id,
        diseases=diseases_list,
        medical_history=twin.medical_history,
        sleep_pattern_avg=twin.sleep_pattern_avg,
        activity_score=twin.activity_score,
        health_score=int(health_score),
        adherence_score=int(adherence_rate),
        insights=insights
    )


@app.post(f"{settings.API_V1_STR}/digital-twin/{{profile_id}}", response_model=DigitalTwinOut)
def update_digital_twin_metrics(profile_id: int, req: DigitalTwinUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = db.query(FamilyProfile).filter(
        FamilyProfile.id == profile_id,
        FamilyProfile.user_id == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
        
    twin = db.query(DigitalTwin).filter(DigitalTwin.profile_id == profile.id).first()
    if not twin:
        twin = DigitalTwin(profile_id=profile.id)
        db.add(twin)
        
    if req.diseases is not None:
        twin.diseases = json.dumps(req.diseases)
    if req.medical_history is not None:
        twin.medical_history = req.medical_history
    if req.sleep_pattern_avg is not None:
        twin.sleep_pattern_avg = req.sleep_pattern_avg
    if req.activity_score is not None:
        twin.activity_score = req.activity_score
        
    db.commit()
    db.refresh(twin)
    
    return get_digital_twin_metrics(profile_id, db, current_user)


# --- MODULE 2: LAB REPORT INTELLIGENCE ---

@app.post(f"{settings.API_V1_STR}/lab-reports/upload")
def upload_lab_report(
    profile_id: int = Form(...),
    ocr_text: str = Form(...),
    test_type: str = Form("CBC"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(FamilyProfile).filter(
        FamilyProfile.id == profile_id,
        FamilyProfile.user_id == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
        
    # Analyze raw text using AI
    try:
        report_analysis = analyze_lab_report_text(ocr_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI parsing error: {e}")
        
    # Save Report
    new_report = LabReport(
        profile_id=profile.id,
        test_type=report_analysis.get("test_type", test_type),
        test_date=datetime.utcnow().date(),
        extracted_data=json.dumps(report_analysis.get("extracted_data", {})),
        summary=report_analysis.get("summary", ""),
        abnormalities_found=json.dumps(report_analysis.get("abnormalities_found", []))
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    return {
        "id": new_report.id,
        "test_type": new_report.test_type,
        "extracted_data": report_analysis.get("extracted_data"),
        "summary": new_report.summary,
        "abnormalities_found": report_analysis.get("abnormalities_found")
    }


@app.get(f"{settings.API_V1_STR}/lab-reports/profile/{{profile_id}}")
def list_lab_reports(profile_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = db.query(FamilyProfile).filter(
        FamilyProfile.id == profile_id,
        FamilyProfile.user_id == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
        
    reports = db.query(LabReport).filter(LabReport.profile_id == profile.id).all()
    results = []
    for r in reports:
        results.append({
            "id": r.id,
            "test_type": r.test_type,
            "test_date": r.test_date.isoformat(),
            "extracted_data": json.loads(r.extracted_data),
            "summary": r.summary,
            "abnormalities_found": json.loads(r.abnormalities_found)
        })
    return results


# --- MODULE 4: MEDICINE INVENTORY PREDICTION ---

@app.get(f"{settings.API_V1_STR}/inventory/profile/{{profile_id}}", response_model=List[InventoryOut])
def get_inventory_predictions(profile_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = db.query(FamilyProfile).filter(
        FamilyProfile.id == profile_id,
        FamilyProfile.user_id == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
        
    items = db.query(Inventory).filter(Inventory.profile_id == profile.id).all()
    
    # Auto-add default inventory entries for reminders if they don't exist
    reminders = db.query(Reminder).filter(Reminder.profile_id == profile.id).all()
    existing_drugs = {i.drug_name.lower() for i in items}
    
    for r in reminders:
        drug_lower = r.drug_name.lower()
        if drug_lower not in existing_drugs:
            new_item = Inventory(
                profile_id=profile.id,
                drug_name=r.drug_name,
                current_stock=30,
                daily_consumption=1,
                refill_lead_days=3
            )
            db.add(new_item)
            db.commit()
            items.append(new_item)
            existing_drugs.add(drug_lower)
            
    out_list = []
    from datetime import timedelta
    for i in items:
        # Calculate days remaining
        days_rem = max(0, i.current_stock // i.daily_consumption) if i.daily_consumption > 0 else 999
        refill_date = datetime.utcnow().date() + timedelta(days=days_rem)
        
        out_list.append(InventoryOut(
            id=i.id,
            profile_id=i.profile_id,
            drug_name=i.drug_name,
            current_stock=i.current_stock,
            daily_consumption=i.daily_consumption,
            last_refill_date=i.last_refill_date.isoformat() if i.last_refill_date else None,
            refill_lead_days=i.refill_lead_days,
            days_remaining=days_rem,
            refill_date=refill_date.isoformat()
        ))
    return out_list


@app.post(f"{settings.API_V1_STR}/inventory/profile/{{profile_id}}", response_model=InventoryOut)
def add_or_update_inventory(profile_id: int, req: InventoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = db.query(FamilyProfile).filter(
        FamilyProfile.id == profile_id,
        FamilyProfile.user_id == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
        
    item = db.query(Inventory).filter(
        Inventory.profile_id == profile.id,
        Inventory.drug_name.ilike(req.drug_name)
    ).first()
    
    if item:
        item.current_stock += req.current_stock
        item.daily_consumption = req.daily_consumption
        item.refill_lead_days = req.refill_lead_days
        item.last_refill_date = datetime.utcnow().date()
    else:
        item = Inventory(
            profile_id=profile.id,
            drug_name=req.drug_name,
            current_stock=req.current_stock,
            daily_consumption=req.daily_consumption,
            refill_lead_days=req.refill_lead_days,
            last_refill_date=datetime.utcnow().date()
        )
        db.add(item)
        
    db.commit()
    db.refresh(item)
    
    # Format return
    from datetime import timedelta
    days_rem = max(0, item.current_stock // item.daily_consumption) if item.daily_consumption > 0 else 999
    ref_date = datetime.utcnow().date() + timedelta(days=days_rem)
    
    return InventoryOut(
        id=item.id,
        profile_id=item.profile_id,
        drug_name=item.drug_name,
        current_stock=item.current_stock,
        daily_consumption=item.daily_consumption,
        last_refill_date=item.last_refill_date.isoformat() if item.last_refill_date else None,
        refill_lead_days=item.refill_lead_days,
        days_remaining=days_rem,
        refill_date=ref_date.isoformat()
    )


@app.post(f"{settings.API_V1_STR}/inventory/refill/{{item_id}}")
def refill_inventory_item(item_id: int, quantity: int = 30, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(Inventory).filter(Inventory.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found.")
        
    item.current_stock += quantity
    item.last_refill_date = datetime.utcnow().date()
    db.commit()
    return {"message": f"Successfully refilled {item.drug_name} with {quantity} units. Current stock: {item.current_stock}."}


# --- MODULE 6: EMERGENCY RISK DETECTOR ---

@app.post(f"{settings.API_V1_STR}/emergency-risk/{{profile_id}}", response_model=EmergencyRiskResponse)
def check_emergency_symptoms(profile_id: int, req: EmergencyRiskRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = db.query(FamilyProfile).filter(
        FamilyProfile.id == profile_id,
        FamilyProfile.user_id == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
        
    reminders = db.query(Reminder).filter(Reminder.profile_id == profile.id, Reminder.active == True).all()
    meds = [r.drug_name for r in reminders]
    
    allergies = db.query(AllergyProfile).filter(AllergyProfile.profile_id == profile.id).all()
    allergen_names = [a.allergen_name for a in allergies]
    
    analysis = evaluate_emergency_risk(
        symptoms=req.symptoms,
        age=profile.age or 30,
        current_meds=meds,
        allergies=allergen_names,
        has_alcohol=req.has_alcohol
    )
    
    return EmergencyRiskResponse(
        risk_level=analysis.get("risk_level", "Low"),
        reasoning=analysis.get("reasoning", ""),
        disclaimer=analysis.get("disclaimer", "")
    )


# --- MODULE 8: SMART ADHERENCE ANALYTICS ---

@app.post(f"{settings.API_V1_STR}/adherence/log/{{reminder_id}}")
def log_reminder_adherence(reminder_id: int, status_log: str = "Taken", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found.")
        
    today = datetime.utcnow().date()
    
    # Prevent duplicate log for the same reminder on the same day
    existing = db.query(AdherenceLog).filter(
        AdherenceLog.reminder_id == reminder.id,
        AdherenceLog.log_date == today
    ).first()
    
    if existing:
        existing.status = status_log
        existing.log_time = datetime.utcnow().time()
    else:
        new_log = AdherenceLog(
            reminder_id=reminder.id,
            log_date=today,
            log_time=datetime.utcnow().time(),
            status=status_log
        )
        db.add(new_log)
        
    # Decrement inventory stock on "Taken"
    if status_log == "Taken":
        inv = db.query(Inventory).filter(
            Inventory.profile_id == reminder.profile_id,
            Inventory.drug_name.ilike(reminder.drug_name)
        ).first()
        if inv:
            inv.current_stock = max(0, inv.current_stock - 1)
            
    reminder.last_taken = datetime.utcnow()
    db.commit()
    
    return {"message": f"Successfully logged adherence status '{status_log}' for {reminder.drug_name}."}


@app.get(f"{settings.API_V1_STR}/adherence/heatmap/{{profile_id}}")
def get_adherence_heatmap_data(profile_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = db.query(FamilyProfile).filter(
        FamilyProfile.id == profile_id,
        FamilyProfile.user_id == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
        
    logs = db.query(AdherenceLog).join(Reminder).filter(Reminder.profile_id == profile.id).all()
    
    # Group logs by date
    days_data = {}
    streak = 0
    consecutive_days = sorted(list({l.log_date for l in logs if l.status == "Taken"}), reverse=True)
    
    # Calculate streak
    from datetime import timedelta
    current_check = datetime.utcnow().date()
    for d in consecutive_days:
        if d == current_check or d == current_check - timedelta(days=1):
            streak += 1
            current_check = d
        else:
            break
            
    for l in logs:
        date_str = l.log_date.isoformat()
        if date_str not in days_data:
            days_data[date_str] = {"taken": 0, "total": 0}
        days_data[date_str]["total"] += 1
        if l.status == "Taken":
            days_data[date_str]["taken"] += 1
            
    heatmap = []
    for date_str, stats_item in days_data.items():
        rate = (stats_item["taken"] / stats_item["total"]) * 100.0 if stats_item["total"] > 0 else 0
        heatmap.append({
            "date": date_str,
            "rate": round(rate, 1),
            "status": "Green" if rate >= 80 else "Orange" if rate >= 50 else "Red"
        })
        
    return {
        "streak": streak,
        "heatmap": heatmap
    }


# --- MODULE 9: WEARABLE INTEGRATION LAYER ---

@app.post(f"{settings.API_V1_STR}/wearables/sync/{{profile_id}}")
def sync_wearable_metrics(profile_id: int, req: WearableLogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = db.query(FamilyProfile).filter(
        FamilyProfile.id == profile_id,
        FamilyProfile.user_id == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
        
    today = datetime.utcnow().date()
    log = db.query(WearableLog).filter(
        WearableLog.profile_id == profile.id,
        WearableLog.log_date == today
    ).first()
    
    if log:
        log.steps = req.steps
        log.avg_heart_rate = req.avg_heart_rate
        log.sleep_hours = req.sleep_hours
    else:
        log = WearableLog(
            profile_id=profile.id,
            log_date=today,
            steps=req.steps,
            avg_heart_rate=req.avg_heart_rate,
            sleep_hours=req.sleep_hours
        )
        db.add(log)
        
    # Also update Digital Twin metrics average
    twin = db.query(DigitalTwin).filter(DigitalTwin.profile_id == profile.id).first()
    if twin:
        twin.sleep_pattern_avg = round((twin.sleep_pattern_avg * 4 + req.sleep_hours) / 5, 2)
        twin.activity_score = round((twin.activity_score * 4 + req.steps) / 5, 2)
        
    db.commit()
    return {"message": "Wearable fitness log synced successfully and digital twin updated."}


# --- MODULE 12: HEALTH KNOWLEDGE GRAPH ---

@app.get(f"{settings.API_V1_STR}/knowledge-graph/explore")
def get_graph_exploration(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reminders = db.query(Reminder).filter(Reminder.user_id == current_user.id).all()
    active_drugs = [r.drug_name for r in reminders]
    
    # Build Neo4j / Fallback interactive graph data
    graph_data = get_knowledge_graph_data(active_drugs=active_drugs)
    return graph_data


# --- MODULE 15: AI MEDICATION TIMELINE ---

@app.get(f"{settings.API_V1_STR}/timeline/{{profile_id}}")
def get_clinical_timeline(profile_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = db.query(FamilyProfile).filter(
        FamilyProfile.id == profile_id,
        FamilyProfile.user_id == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
        
    # Compile events from histories, lab_reports, and reminders
    events = []
    
    # 1. Reminders addition
    reminders = db.query(Reminder).filter(Reminder.profile_id == profile.id).all()
    for r in reminders:
        events.append({
            "date": r.last_taken.date().isoformat() if r.last_taken else datetime.utcnow().date().isoformat(),
            "type": "medication_started",
            "title": f"Started Medication: {r.drug_name}",
            "description": f"Scheduled dosage: {r.dosage or 'As directed'} ({r.time_of_day})"
        })
        
    # 2. Lab Reports
    labs = db.query(LabReport).filter(LabReport.profile_id == profile.id).all()
    for l in labs:
        events.append({
            "date": l.test_date.isoformat(),
            "type": "lab_report_uploaded",
            "title": f"Lab Report Uploaded: {l.test_type}",
            "description": f"Analyzed metrics: {l.summary[:120]}..."
        })
        
    # 3. Adverse checks from user histories
    histories = db.query(History).filter(History.user_id == current_user.id).all()
    for h in histories:
        if h.event_type == "interaction_check":
            try:
                meta = json.loads(h.details_json)
                drugs = meta.get("drugs", [])
                events.append({
                    "date": h.created_at.date().isoformat(),
                    "type": "safety_check",
                    "title": "Drug Interaction Check Conducted",
                    "description": f"Analyzed profile matching: {', '.join(drugs)}"
                })
            except:
                pass
                
    # Sort events chronologically desc
    events.sort(key=lambda x: x["date"], reverse=True)
    return events


# --- MODULE 17: HEALTH INSURANCE ASSISTANT ---

@app.post(f"{settings.API_V1_STR}/insurance/check")
def check_insurance_coverage_query(
    policy_text: str = Form(...),
    query: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    try:
        response = analyze_insurance_coverage(policy_text, query)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Insurance AI error: {e}")


# --- MODULE 14: MEDICAL RESEARCH ASSISTANT ---

@app.get(f"{settings.API_V1_STR}/research/advisor")
def get_clinical_research_advice(query: str, current_user: User = Depends(get_current_user)):
    try:
        response = research_treatment_guidelines(query)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Research Advisor error: {e}")


# --- MODULE 3: HOSPITAL DISCHARGE TRANSLATION ---

@app.post(f"{settings.API_V1_STR}/discharge/analyze")
def parse_hospital_discharge_form(
    ocr_text: str = Form(...),
    profile_id: int = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(FamilyProfile).filter(
        FamilyProfile.id == profile_id,
        FamilyProfile.user_id == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
        
    try:
        summary_res = analyze_discharge_summary(ocr_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Discharge AI translation error: {e}")
        
    # Auto-add extracted medications as active reminders
    for med in summary_res.get("medications", []):
        name = med.get("drug_name", "")
        dosage = med.get("dosage", "")
        sched = med.get("schedule", "morning").lower()
        time_tag = "morning"
        if "night" in sched or "evening" in sched:
            time_tag = "night"
        elif "noon" in sched or "afternoon" in sched:
            time_tag = "afternoon"
            
        # Check if already exists
        exist = db.query(Reminder).filter(
            Reminder.profile_id == profile.id,
            Reminder.drug_name.ilike(name)
        ).first()
        
        if not exist:
            new_r = Reminder(
                user_id=current_user.id,
                profile_id=profile.id,
                drug_name=name,
                dosage=dosage,
                time_of_day=time_tag,
                active=True
            )
            db.add(new_r)
            db.commit()
            
    return summary_res


# --- RUN ROOT CHECK ---
@app.get("/")
def read_root():
    return {"message": "MediGuard.AI Healthcare Operating System API is running successfully."}
