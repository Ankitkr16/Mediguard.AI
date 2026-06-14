import os
import pickle
import numpy as np
import pandas as pd

# Load model and scaler
model_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ml", "best_model.pkl")
scaler_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ml", "scaler.pkl")

model = None
scaler = None

if os.path.exists(model_path) and os.path.exists(scaler_path):
    try:
        with open(model_path, "rb") as f:
            model = pickle.load(f)
        with open(scaler_path, "rb") as f:
            scaler = pickle.load(f)
        print("ML model and scaler loaded successfully.")
    except Exception as e:
        print(f"Error loading ML model: {e}. Falling back to rule-based risk classification.")
else:
    print("Warning: ML model files not found. Using rule-based fallback.")

def classify_risk_ml(
    num_medicines: int,
    has_high_risk_pair: int,
    has_medium_risk_pair: int,
    total_side_effects: int,
    age_group: int,
    has_alcohol: int,
    has_allergy_match: int,
    duplicate_ingredients_count: int
) -> tuple[str, float]:
    """
    Predicts the risk level ('Low', 'Medium', 'High') and provides a numerical risk score (0 to 100%).
    Uses the trained ML model if available, else falls back to rule-based calculation.
    """
    
    # 1. Prepare features
    features_df = pd.DataFrame([{
        'num_medicines': num_medicines,
        'has_high_risk_pair': has_high_risk_pair,
        'has_medium_risk_pair': has_medium_risk_pair,
        'total_side_effects': total_side_effects,
        'age_group': age_group,
        'has_alcohol': has_alcohol,
        'has_allergy_match': has_allergy_match,
        'duplicate_ingredients_count': duplicate_ingredients_count
    }])
    
    # 2. Predict using ML Model
    if model is not None and scaler is not None:
        try:
            # Scale features
            features_scaled = scaler.transform(features_df)
            
            # Predict probabilities
            probs = model.predict_proba(features_scaled)[0] # e.g. [P_low, P_med, P_high]
            
            # Get predicted class
            pred_class = int(np.argmax(probs))
            
            # Map class to label
            class_labels = {0: "Low", 1: "Medium", 2: "High"}
            risk_label = class_labels[pred_class]
            
            # Risk score calculation: weighted average of probability of risk
            # Low: weight 10, Medium: weight 50, High: weight 95
            risk_score = (probs[0] * 5 + probs[1] * 50 + probs[2] * 95)
            
            return risk_label, round(float(risk_score), 2)
            
        except Exception as e:
            print(f"ML Inference error: {e}. Using rule-based fallback.")
            
    # 3. Rule-based fallback (mirrors the training logic)
    score = 0
    if has_high_risk_pair:
        score += 6
    if has_medium_risk_pair:
        score += 3
    if has_allergy_match:
        score += 5
    if duplicate_ingredients_count > 0:
        score += 4 * duplicate_ingredients_count
    if num_medicines >= 4:
        score += 2
    if age_group == 2:  # Elderly
        score += 1
    if has_alcohol and (has_high_risk_pair or has_medium_risk_pair):
        score += 2
        
    score += total_side_effects * 0.25
    
    # Normalize score to percentage (capped at 100)
    risk_percentage = min(100.0, max(5.0, (score / 15.0) * 100.0))
    
    if score >= 8.5:
        risk_label = "High"
    elif score >= 3.5:
        risk_label = "Medium"
    else:
        risk_label = "Low"
        
    return risk_label, round(risk_percentage, 2)
