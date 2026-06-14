from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

# Auth Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Allergy Schemas
class AllergyCreate(BaseModel):
    allergen_name: str
    severity: str = "Medium" # Low, Medium, High

class AllergyOut(BaseModel):
    id: int
    user_id: int
    allergen_name: str
    severity: str
    
    class Config:
        from_attributes = True

# Reminder Schemas
class ReminderCreate(BaseModel):
    drug_name: str
    dosage: Optional[str] = None
    time_of_day: str # morning, afternoon, night
    days_of_week: Optional[str] = "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday"
    active: Optional[bool] = True

class ReminderUpdate(BaseModel):
    dosage: Optional[str] = None
    time_of_day: Optional[str] = None
    days_of_week: Optional[str] = None
    active: Optional[bool] = None

class ReminderOut(BaseModel):
    id: int
    user_id: int
    drug_name: str
    dosage: Optional[str] = None
    time_of_day: str
    days_of_week: str
    active: bool
    last_taken: Optional[datetime] = None

    class Config:
        from_attributes = True

# Medicine Check Schemas
class InteractionRequest(BaseModel):
    drugs: List[str]
    age_group: int = 1 # 0: Child, 1: Adult, 2: Elderly
    alcohol: bool = False

class InteractionDetail(BaseModel):
    drug_a: str
    drug_b: str
    risk_level: str # Low, Medium, High
    description: str
    precautions: str

class FoodInteractionDetail(BaseModel):
    drug: str
    foods_to_avoid: List[str]
    description: str
    precautions: str

class AlcoholInteractionDetail(BaseModel):
    drug: str
    risk_level: str
    description: str
    precautions: str

class DuplicateDetail(BaseModel):
    ingredient: str
    drugs: List[str]
    warning: str

class InteractionResponse(BaseModel):
    overall_risk: str # Low, Medium, High
    predicted_risk_score: float # Percentage or scalar from ML model
    interactions: List[InteractionDetail]
    duplicates: List[DuplicateDetail]
    allergy_alerts: List[str]
    food_interactions: List[FoodInteractionDetail]
    alcohol_interactions: List[AlcoholInteractionDetail]
    precautions: List[str]
    side_effects: Dict[str, Dict[str, List[str]]] # Map of drug -> {common, rare, serious, emergency}

# Chat Schemas
class ChatRequest(BaseModel):
    message: str
    voice_output: bool = False

class ChatResponse(BaseModel):
    response: str
    audio_base64: Optional[str] = None # Base64 audio string if voice_output is true

# History Schemas
class HistoryOut(BaseModel):
    id: int
    event_type: str
    details_json: str
    created_at: datetime

    class Config:
        from_attributes = True

class DashboardAnalytics(BaseModel):
    total_scans: int
    total_reminders: int
    adherence_rate: float
    risk_profile: Dict[str, int] # e.g. {"Low": 5, "Medium": 2, "High": 1}
    recent_events: List[Dict[str, Any]]

# Profile Schemas
class FamilyProfileCreate(BaseModel):
    relation: str # e.g. "Self", "Father", "Mother", "Spouse", "Child"
    full_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None

class FamilyProfileOut(BaseModel):
    id: int
    user_id: int
    relation: str
    full_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None

    class Config:
        from_attributes = True

# Digital Twin Schemas
class DigitalTwinOut(BaseModel):
    profile_id: int
    diseases: List[str]
    medical_history: Optional[str] = None
    sleep_pattern_avg: float
    activity_score: float
    health_score: int # Calculated dynamically: 0-100
    adherence_score: int # Calculated dynamically: 0-100
    insights: List[str] # AI generated list

    class Config:
        from_attributes = True

class DigitalTwinUpdate(BaseModel):
    diseases: Optional[List[str]] = None
    medical_history: Optional[str] = None
    sleep_pattern_avg: Optional[float] = None
    activity_score: Optional[float] = None

# Lab Report Schemas
class LabReportOut(BaseModel):
    id: int
    profile_id: int
    test_type: str
    test_date: str
    extracted_data: Dict[str, Any]
    summary: Optional[str] = None
    abnormalities_found: List[str]

    class Config:
        from_attributes = True

# Inventory Schemas
class InventoryCreate(BaseModel):
    drug_name: str
    current_stock: int
    daily_consumption: Optional[int] = 1
    refill_lead_days: Optional[int] = 3

class InventoryOut(BaseModel):
    id: int
    profile_id: int
    drug_name: str
    current_stock: int
    daily_consumption: int
    last_refill_date: Optional[str] = None
    refill_lead_days: int
    days_remaining: int # Calculated dynamically
    refill_date: Optional[str] = None # Predicted refill date

    class Config:
        from_attributes = True

# Wearable Schemas
class WearableLogCreate(BaseModel):
    steps: int
    avg_heart_rate: float
    sleep_hours: float

class WearableLogOut(BaseModel):
    log_date: str
    steps: int
    avg_heart_rate: float
    sleep_hours: float

    class Config:
        from_attributes = True

# Emergency Checker Schemas
class EmergencyRiskRequest(BaseModel):
    symptoms: str
    has_alcohol: Optional[bool] = False

class EmergencyRiskResponse(BaseModel):
    risk_level: str # "Low", "Moderate", "High", "Emergency"
    reasoning: str
    disclaimer: str

# Explainable AI & Sources Schema
class ExplainableDetail(BaseModel):
    risk_level: str
    reason: str
    source: str
    confidence: float # percentage, e.g., 91.0
    evidence: str
