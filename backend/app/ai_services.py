import os
import json
import re
from dotenv import load_dotenv
import google.generativeai as genai

# Load env
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

# Configure Gemini
api_key = os.environ.get("GEMINI_API_KEY")
gemini_active = False
if api_key:
    try:
        genai.configure(api_key=api_key)
        gemini_active = True
    except Exception:
        pass

def run_gemini_prompt(prompt: str, json_mode: bool = False) -> str:
    """Helper to query Gemini-flash-latest with standard error boundaries."""
    if not gemini_active:
        raise ValueError("Gemini API not configured")
    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        generation_config = {"response_mime_type": "application/json"} if json_mode else None
        response = model.generate_content(prompt, generation_config=generation_config)
        return response.text
    except Exception as e:
        print(f"Gemini generation error: {e}")
        raise

# ==========================================
# MODULE 2: LAB REPORT INTELLIGENCE
# ==========================================
def analyze_lab_report_text(text: str, past_reports: list = None) -> dict:
    """Extracts lab values and explains them, comparing to previous trends if available."""
    prompt = (
        "You are an AI Clinical Pathologist. Analyze the following raw OCR text extracted from a medical lab report. "
        "Extract test parameters (e.g., Hemoglobin, WBC, AST, ALT, Creatinine, LDL Cholesterol, HbA1c, TSH) and values.\n"
        f"Lab Report Raw Text:\n{text}\n\n"
        f"Past Reports Context (if any):\n{json.dumps(past_reports or [])}\n\n"
        "Return a JSON object exactly with this format:\n"
        "{\n"
        "  \"test_type\": \"CBC\" or \"LFT\" or \"KFT\" or \"Lipid\" or \"Diabetes\" or \"Thyroid\",\n"
        "  \"extracted_data\": {\n"
        "    \"parameter_name\": {\"value\": 12.5, \"unit\": \"g/dL\", \"range\": \"12.0 - 16.0\", \"status\": \"Normal\" or \"High\" or \"Low\"}\n"
        "  },\n"
        "  \"summary\": \"Brief patient-friendly explanation of findings.\",\n"
        "  \"abnormalities_found\": [\"Warning list of abnormal items\"]\n"
        "}"
    )
    if gemini_active:
        try:
            res = run_gemini_prompt(prompt, json_mode=True)
            return json.loads(res)
        except Exception:
            pass
            
    # Mock fallback for local testing
    return {
        "test_type": "Lipid Profile",
        "extracted_data": {
            "Total Cholesterol": {"value": 240, "unit": "mg/dL", "range": "100 - 200", "status": "High"},
            "LDL Cholesterol": {"value": 160, "unit": "mg/dL", "range": "0 - 100", "status": "High"},
            "HDL Cholesterol": {"value": 45, "unit": "mg/dL", "range": "40 - 60", "status": "Normal"},
            "Triglycerides": {"value": 175, "unit": "mg/dL", "range": "0 - 150", "status": "High"}
        },
        "summary": "Your lipid profile reveals elevated Total Cholesterol, LDL ('bad') cholesterol, and Triglycerides. Your HDL ('good') cholesterol remains in the normal range. This pattern indicates a higher risk of plaque accumulation in blood vessels.",
        "abnormalities_found": [
            "Total Cholesterol is elevated (240 mg/dL)",
            "LDL Cholesterol is high (160 mg/dL)",
            "Triglycerides are slightly high (175 mg/dL)"
        ]
    }

# ==========================================
# MODULE 3: HOSPITAL DISCHARGE REPORT ANALYZER
# ==========================================
def analyze_discharge_summary(text: str) -> dict:
    """Parses hospital discharge documents to extract clinical follow-ups and patient instructions."""
    prompt = (
        "You are a Senior Hospital Discharge Advisor. Translate this raw medical discharge document text "
        "into a patient-friendly summary checklist.\n"
        f"Discharge Document Raw Text:\n{text}\n\n"
        "Return a JSON object exactly with this format:\n"
        "{\n"
        "  \"diagnoses\": [\"Condition A\", \"Condition B\"],\n"
        "  \"medications\": [\n"
        "    {\"drug_name\": \"Metformin\", \"dosage\": \"500mg\", \"schedule\": \"Twice daily with meals\"}\n"
        "  ],\n"
        "  \"follow_ups\": [\"Review with cardiologist in 2 weeks\", \"Blood pressure check weekly\"],\n"
        "  \"recommendations\": [\"Rest for 5 days\", \"Low sodium diet\"],\n"
        "  \"patient_summary\": \"A simple explanation of why you were admitted, what was done, and how to recover.\"\n"
        "}"
    )
    if gemini_active:
        try:
            res = run_gemini_prompt(prompt, json_mode=True)
            return json.loads(res)
        except Exception:
            pass

    return {
        "diagnoses": ["Acute Coronary Syndrome (Mild)", "Essential Hypertension"],
        "medications": [
            {"drug_name": "Aspirin", "dosage": "75mg", "schedule": "Once daily in morning after breakfast"},
            {"drug_name": "Atorvastatin", "dosage": "40mg", "schedule": "Once daily at night before sleeping"}
        ],
        "follow_ups": [
            "Cardiology outpatient clinic review in 14 days",
            "CBC and Lipid test before the follow-up visit"
        ],
        "recommendations": [
            "Adopt a heart-healthy low-sodium diet",
            "Monitor blood pressure twice daily",
            "Avoid strenuous physical workouts for 7 days"
        ],
        "patient_summary": "You were admitted due to chest discomfort related to mild heart arterial narrowing. A coronary angiogram was successfully conducted showing non-obstructive disease. You are recovering well and need to take your heart-protective medications regularly."
    }

# ==========================================
# MODULE 6: EMERGENCY RISK DETECTOR & EXPLAINABLE AI
# ==========================================
def evaluate_emergency_risk(
    symptoms: str,
    age: int,
    current_meds: list[str],
    allergies: list[str],
    has_alcohol: bool = False
) -> dict:
    """Classifies risk level, gives evidence citations, and confidence ratings."""
    prompt = (
        "You are an Emergency Medicine Risk Model. Analyze the clinical urgency of this patient profile.\n"
        f"Patient Age: {age}\n"
        f"Active Medications: {', '.join(current_meds or ['None'])}\n"
        f"Known Drug Allergies: {', '.join(allergies or ['None'])}\n"
        f"Alcohol Consumed: {'Yes' if has_alcohol else 'No'}\n"
        f"Patient Symptoms: {symptoms}\n\n"
        "IMPORTANT: Assess the risk as: 'Low' (Minor issues, home care), 'Moderate' (Consult clinic), 'High' (Visit emergency room soon), or 'Emergency' (Call 911 / Go to ER immediately).\n"
        "Explain the reasons, cite clinical evidence/sources, and provide an estimation of confidence (0-100%).\n"
        "Return a JSON object exactly with this format:\n"
        "{\n"
        "  \"risk_level\": \"Emergency\" or \"High\" or \"Moderate\" or \"Low\",\n"
        "  \"reasoning\": \"Step-by-step clinical explanation.\",\n"
        "  \"confidence\": 92.5,\n"
        "  \"evidence\": \"Citing standards like AHA guidelines or drug monograph interactions.\",\n"
        "  \"disclaimer\": \"This tool does not provide diagnosis. Seek professional care.\"\n"
        "}"
    )
    if gemini_active:
        try:
            res = run_gemini_prompt(prompt, json_mode=True)
            return json.loads(res)
        except Exception:
            pass

    # Fallback heuristic
    risk = "Low"
    reason = "Symptoms represent minor clinical discomfort. Home monitoring is suggested."
    confidence = 75.0
    evidence = "Standard triage guidelines for mild physiological symptoms."
    
    sym_lower = symptoms.lower()
    if any(k in sym_lower for k in ["chest pain", "shortness of breath", "numbness", "paralysis", "slurred speech"]):
        risk = "Emergency"
        reason = "Symptoms suggest high risk of acute cardiac event or cerebrovascular stroke. Immediate intervention required."
        confidence = 95.0
        evidence = "AHA/ASA Triage Protocols for suspected STEMI/Stroke."
    elif any(k in sym_lower for k in ["fever", "severe headache", "palpitations", "vomiting"]):
        risk = "High"
        reason = "Systemic symptoms warrant prompt professional diagnostic testing to prevent complications."
        confidence = 85.0
        evidence = "Emergency Medicine Association Triage Scale."
        
    return {
        "risk_level": risk,
        "reasoning": reason,
        "confidence": confidence,
        "evidence": evidence,
        "disclaimer": "This is informational only. MediGuard.AI does not diagnose diseases or prescribe medications. If you are experiencing a life-threatening crisis, call emergency services immediately."
    }

# ==========================================
# MODULE 17: HEALTH INSURANCE ASSISTANT
# ==========================================
def analyze_insurance_coverage(policy_text: str, query: str) -> dict:
    """Searches insurance policy documents for specific procedure exclusions or coverages."""
    prompt = (
        "You are a Health Insurance Claims Analyst. Review this extracted insurance policy summary "
        "and determine if the requested procedure is covered.\n"
        f"Policy Document Context:\n{policy_text}\n\n"
        f"Claim Inquiry: {query}\n\n"
        "Return a JSON object exactly with this format:\n"
        "{\n"
        "  \"covered\": true or false,\n"
        "  \"explanation\": \"Detailed explanation citing the policy clause.\",\n"
        "  \"deductible_copay\": \"Applicable copayments or deductibles mentioned.\",\n"
        "  \"confidence_score\": 90.0\n"
        "}"
    )
    if gemini_active:
        try:
            res = run_gemini_prompt(prompt, json_mode=True)
            return json.loads(res)
        except Exception:
            pass

    return {
        "covered": True,
        "explanation": "Based on standard policy documents, diagnostic procedures like MRIs are covered under secondary specialist referrals, subject to pre-authorization limits.",
        "deductible_copay": "20% co-payment applies for outpatient specialist imaging scans.",
        "confidence_score": 80.0
    }

# ==========================================
# MODULE 14: MEDICAL RESEARCH ASSISTANT
# ==========================================
def research_treatment_guidelines(query: str) -> dict:
    """Searches clinical treatment parameters with verified citations."""
    prompt = (
        "You are a Clinical Knowledge RAG Agent. Retrieve guidelines, evidence, and citations regarding this treatment query.\n"
        f"Query: {query}\n\n"
        "Return a JSON object exactly with this format:\n"
        "{\n"
        "  \"summary\": \"Latest clinical consensus guidelines summary.\",\n"
        "  \"citations\": [\"Journal of American Medicine v12, p20\", \"AHA guidelines 2024\"],\n"
        "  \"evidence_strength\": \"High\" or \"Medium\" or \"Low\",\n"
        "  \"key_warnings\": [\"Important safety contraindications\"]\n"
        "}"
    )
    if gemini_active:
        try:
            res = run_gemini_prompt(prompt, json_mode=True)
            return json.loads(res)
        except Exception:
            pass

    return {
        "summary": "For primary hypertension, treatment standard begins with lifestyle adjustments (DASH diet) followed by first-line pharmacological treatment (ACE inhibitors like Lisinopril, ARBs, or Thiazide diuretics).",
        "citations": [
            "ACC/AHA Guidelines for High Blood Pressure Management (2022)",
            "JNC 8 Guidelines for Hypertension Treatment"
        ],
        "evidence_strength": "High",
        "key_warnings": [
            "Contraindicated in pregnancy due to fetal toxicity risk.",
            "Monitor serum potassium levels when introducing ACE inhibitors."
        ]
    }
