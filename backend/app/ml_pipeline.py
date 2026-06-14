import os
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler

ml_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ml")
os.makedirs(ml_dir, exist_ok=True)

model_path = os.path.join(ml_dir, "adherence_model.pkl")
scaler_path = os.path.join(ml_dir, "adherence_scaler.pkl")

def train_adherence_model():
    """Generates synthetic patient records and trains a RandomForestClassifier to predict adherence."""
    np.random.seed(42)
    n_samples = 1000
    
    # Generate synthetic features
    age = np.random.randint(18, 85, n_samples)
    num_medicines = np.random.randint(1, 6, n_samples)
    sleep_hours = np.random.uniform(5.0, 9.0, n_samples)
    activity_score = np.random.uniform(2000, 12000, n_samples)
    time_of_day = np.random.randint(0, 3, n_samples) # 0: morning, 1: afternoon, 2: night
    
    # Target label: 1 (Adhered/Taken on time), 0 (Missed/Delayed)
    # Probability increases with sleep, lower age, lower number of medicines, and higher activity
    raw_score = (
        (sleep_hours / 8.0) * 3 +
        (activity_score / 10000.0) * 2 -
        (age / 50.0) * 1.5 -
        (num_medicines / 3.0) * 2 +
        np.random.normal(0, 1.0, n_samples)
    )
    
    # 1 for taken, 0 for missed
    adhered = (raw_score > 0.5).astype(int)
    
    # Create DataFrame
    df = pd.DataFrame({
        'age': age,
        'num_medicines': num_medicines,
        'sleep_hours': sleep_hours,
        'activity_score': activity_score,
        'time_of_day': time_of_day
    })
    
    # Scale features
    scaler = StandardScaler()
    x_scaled = scaler.fit_transform(df)
    
    # Fit RandomForest
    model = RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42)
    model.fit(x_scaled, adhered)
    
    # Save
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    with open(scaler_path, "wb") as f:
        pickle.dump(scaler, f)
        
    print("Machine Learning Adherence Model trained and saved successfully!")

# Ensure model files are built
if not os.path.exists(model_path) or not os.path.exists(scaler_path):
    try:
        train_adherence_model()
    except Exception as e:
        print(f"Failed to auto-train Adherence ML model: {e}")


def predict_adherence_probability(
    age: int,
    num_medicines: int,
    sleep_hours: float,
    activity_score: float,
    time_of_day: int
) -> float:
    """Predicts probability (0-100%) of a user taking their scheduled dose on time."""
    try:
        # Load model and scaler
        if os.path.exists(model_path) and os.path.exists(scaler_path):
            with open(model_path, "rb") as f:
                model = pickle.load(f)
            with open(scaler_path, "rb") as f:
                scaler = pickle.load(f)
                
            features_df = pd.DataFrame([{
                'age': age,
                'num_medicines': num_medicines,
                'sleep_hours': sleep_hours,
                'activity_score': activity_score,
                'time_of_day': time_of_day
            }])
            
            features_scaled = scaler.transform(features_df)
            prob_taken = model.predict_proba(features_scaled)[0][1] # Probability of class 1
            return round(float(prob_taken * 100.0), 2)
            
    except Exception as e:
        print(f"ML Adherence prediction failed: {e}. Falling back to default risk calculation.")
        
    # Heuristic fallback if model loading/inference fails
    base_prob = 85.0
    if num_medicines > 3:
        base_prob -= 10.0
    if age > 65:
        base_prob -= 5.0
    if sleep_hours < 6.0:
        base_prob -= 8.0
    if activity_score < 4000:
        base_prob -= 7.0
        
    return max(5.0, min(98.0, base_prob))
