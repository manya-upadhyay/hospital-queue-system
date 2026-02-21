"""
Hospital Queue Management - ML Training Script
=================================================
Trains two models:
  1. Wait Time Predictor (Random Forest Regressor)
  2. No-Show Predictor (Logistic Regression)

Run: python scripts/train.py
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, r2_score, classification_report, roc_auc_score
import joblib
import os
import json

MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

# ═══════════════════════════════════════
# 1. GENERATE SYNTHETIC TRAINING DATA
# ═══════════════════════════════════════

def generate_wait_time_data(n=10000, seed=42):
    """Generate realistic synthetic wait time training data"""
    np.random.seed(seed)

    # Features
    queue_length = np.random.randint(0, 30, n)
    avg_consultation_time = np.random.randint(5, 25, n)
    hour_of_day = np.random.randint(0, 24, n)
    emergency_count = np.random.randint(0, 5, n)
    day_of_week = np.random.randint(0, 7, n)

    # Peak hour multiplier (morning rush 9-11, afternoon 2-4)
    is_peak = ((hour_of_day >= 9) & (hour_of_day <= 11)) | ((hour_of_day >= 14) & (hour_of_day <= 16))
    peak_multiplier = np.where(is_peak, 1.4, 1.0)

    # Weekend factor
    is_weekend = (day_of_week >= 5).astype(float)
    weekend_factor = 1 - (is_weekend * 0.3)  # 30% less on weekends

    # Emergency disruption
    emergency_delay = emergency_count * 8  # each emergency adds ~8 min

    # Wait time formula (realistic)
    base_wait = queue_length * avg_consultation_time * peak_multiplier * weekend_factor
    noise = np.random.normal(0, 5, n)
    wait_time = np.clip(base_wait + emergency_delay + noise, 0, 300)  # max 5 hours

    df = pd.DataFrame({
        'queue_length': queue_length,
        'avg_consultation_time': avg_consultation_time,
        'hour_of_day': hour_of_day,
        'emergency_count': emergency_count,
        'day_of_week': day_of_week,
        'wait_time_minutes': wait_time,
    })
    return df


def generate_no_show_data(n=5000, seed=42):
    """Generate synthetic no-show prediction training data"""
    np.random.seed(seed + 1)

    age = np.random.randint(1, 90, n)
    distance_km = np.random.exponential(10, n)
    appointment_hour = np.random.randint(7, 20, n)
    days_since_registered = np.random.randint(0, 30, n)
    previous_no_shows = np.random.randint(0, 5, n)
    is_emergency = np.random.binomial(1, 0.1, n)
    insurance_type = np.random.randint(0, 3, n)  # 0=none, 1=basic, 2=premium

    # No-show probability logic
    base_prob = 0.15
    prob = (
        base_prob
        + (previous_no_shows * 0.08)
        + (distance_km > 20) * 0.1
        + (days_since_registered > 14) * 0.15
        - (is_emergency * 0.12)
        - (insurance_type == 2) * 0.05
        + (age < 25) * 0.05
        + (appointment_hour < 9) * 0.08
    )
    prob = np.clip(prob, 0.01, 0.99)
    no_show = np.random.binomial(1, prob, n)

    df = pd.DataFrame({
        'age': age,
        'distance_km': np.clip(distance_km, 0, 100),
        'appointment_hour': appointment_hour,
        'days_since_registered': days_since_registered,
        'previous_no_shows': previous_no_shows,
        'is_emergency': is_emergency,
        'insurance_type': insurance_type,
        'no_show': no_show,
    })
    return df


# ═══════════════════════════════════════
# 2. TRAIN WAIT TIME MODEL
# ═══════════════════════════════════════

def train_wait_time_model():
    print("\n📊 Training Wait Time Prediction Model...")
    df = generate_wait_time_data(n=15000)

    features = ['queue_length', 'avg_consultation_time', 'hour_of_day', 'emergency_count', 'day_of_week']
    X = df[features]
    y = df['wait_time_minutes']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        n_jobs=-1,
        random_state=42,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"  ✅ MAE: {mae:.2f} minutes")
    print(f"  ✅ R²:  {r2:.4f}")

    # Feature importances
    importances = dict(zip(features, model.feature_importances_))
    print(f"  📌 Feature importances: {json.dumps({k: round(v,3) for k,v in importances.items()}, indent=2)}")

    # Save model + feature names
    model_path = os.path.join(MODELS_DIR, 'wait_time_model.pkl')
    joblib.dump({'model': model, 'features': features, 'mae': mae, 'r2': r2}, model_path)
    print(f"  💾 Saved to {model_path}")
    return model


# ═══════════════════════════════════════
# 3. TRAIN NO-SHOW MODEL
# ═══════════════════════════════════════

def train_no_show_model():
    print("\n📊 Training No-Show Prediction Model...")
    df = generate_no_show_data(n=8000)

    features = ['age', 'distance_km', 'appointment_hour', 'days_since_registered',
                'previous_no_shows', 'is_emergency', 'insurance_type']
    X = df[features]
    y = df['no_show']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', LogisticRegression(max_iter=500, C=0.5, random_state=42)),
    ])
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, y_prob)

    print(f"  ✅ AUC-ROC: {auc:.4f}")
    print(f"  {classification_report(y_test, y_pred)}")

    model_path = os.path.join(MODELS_DIR, 'no_show_model.pkl')
    joblib.dump({'model': pipeline, 'features': features, 'auc': auc}, model_path)
    print(f"  💾 Saved to {model_path}")
    return pipeline


if __name__ == '__main__':
    print("🏥 Hospital Queue ML - Training Pipeline")
    print("=" * 50)
    train_wait_time_model()
    train_no_show_model()
    print("\n✅ All models trained and saved successfully!")
