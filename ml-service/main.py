"""
Hospital Queue ML Service - FastAPI
====================================
Serves ML predictions for:
  - Wait time estimation
  - No-show probability
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import joblib
import numpy as np
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Hospital Queue ML Service",
    description="AI predictions for hospital queue management",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════
# Load Models at Startup
# ═══════════════════════════════════════
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')
models = {}

@app.on_event("startup")
async def load_models():
    global models
    try:
        wait_path = os.path.join(MODELS_DIR, 'wait_time_model.pkl')
        no_show_path = os.path.join(MODELS_DIR, 'no_show_model.pkl')

        if os.path.exists(wait_path):
            models['wait_time'] = joblib.load(wait_path)
            logger.info(f"✅ Wait time model loaded (MAE: {models['wait_time']['mae']:.2f} min)")
        else:
            logger.warning("⚠️  Wait time model not found. Run: python scripts/train.py")

        if os.path.exists(no_show_path):
            models['no_show'] = joblib.load(no_show_path)
            logger.info(f"✅ No-show model loaded (AUC: {models['no_show']['auc']:.4f})")
        else:
            logger.warning("⚠️  No-show model not found. Run: python scripts/train.py")

    except Exception as e:
        logger.error(f"❌ Model loading failed: {e}")


# ═══════════════════════════════════════
# Schemas
# ═══════════════════════════════════════

class WaitTimePredictRequest(BaseModel):
    queue_length: int = Field(..., ge=0, le=100, description="Current patients in queue")
    avg_consultation_time: int = Field(10, ge=1, le=60, description="Doctor avg consultation minutes")
    hour_of_day: int = Field(..., ge=0, le=23)
    emergency_count: int = Field(0, ge=0, le=20)
    day_of_week: int = Field(..., ge=0, le=6, description="0=Monday, 6=Sunday")


class WaitTimePredictResponse(BaseModel):
    predicted_wait_minutes: int
    confidence_lower: int
    confidence_upper: int
    model_mae: float


class NoShowPredictRequest(BaseModel):
    age: int = Field(..., ge=0, le=120)
    distance_km: float = Field(5.0, ge=0)
    appointment_hour: int = Field(10, ge=0, le=23)
    days_since_registered: int = Field(0, ge=0)
    previous_no_shows: int = Field(0, ge=0)
    is_emergency: bool = False
    insurance_type: int = Field(1, ge=0, le=2)


class NoShowPredictResponse(BaseModel):
    no_show_probability: float
    risk_level: str
    recommendation: str


# ═══════════════════════════════════════
# Endpoints
# ═══════════════════════════════════════

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "models_loaded": list(models.keys()),
        "wait_time_mae": models.get('wait_time', {}).get('mae'),
        "no_show_auc": models.get('no_show', {}).get('auc'),
    }


@app.post("/predict/wait-time", response_model=WaitTimePredictResponse)
async def predict_wait_time(request: WaitTimePredictRequest):
    if 'wait_time' not in models:
        raise HTTPException(status_code=503, detail="Wait time model not loaded. Run training script first.")

    model_data = models['wait_time']
    model = model_data['model']
    features = model_data['features']

    X = np.array([[
        request.queue_length,
        request.avg_consultation_time,
        request.hour_of_day,
        request.emergency_count,
        request.day_of_week,
    ]])

    prediction = model.predict(X)[0]
    mae = model_data['mae']

    return WaitTimePredictResponse(
        predicted_wait_minutes=max(0, int(round(prediction))),
        confidence_lower=max(0, int(round(prediction - mae))),
        confidence_upper=int(round(prediction + mae)),
        model_mae=round(mae, 2),
    )


@app.post("/predict/no-show", response_model=NoShowPredictResponse)
async def predict_no_show(request: NoShowPredictRequest):
    if 'no_show' not in models:
        raise HTTPException(status_code=503, detail="No-show model not loaded. Run training script first.")

    model_data = models['no_show']
    pipeline = model_data['model']

    X = np.array([[
        request.age,
        request.distance_km,
        request.appointment_hour,
        request.days_since_registered,
        request.previous_no_shows,
        int(request.is_emergency),
        request.insurance_type,
    ]])

    prob = pipeline.predict_proba(X)[0][1]

    if prob < 0.2:
        risk_level = "low"
        recommendation = "Proceed normally"
    elif prob < 0.5:
        risk_level = "medium"
        recommendation = "Send reminder 2 hours before appointment"
    else:
        risk_level = "high"
        recommendation = "Call patient and confirm. Consider overbooking slot."

    return NoShowPredictResponse(
        no_show_probability=round(float(prob), 4),
        risk_level=risk_level,
        recommendation=recommendation,
    )


@app.get("/model-info")
async def model_info():
    info = {}
    if 'wait_time' in models:
        info['wait_time'] = {
            'type': 'RandomForestRegressor',
            'features': models['wait_time']['features'],
            'mae_minutes': round(models['wait_time']['mae'], 2),
            'r2_score': round(models['wait_time']['r2'], 4),
        }
    if 'no_show' in models:
        info['no_show'] = {
            'type': 'LogisticRegression Pipeline',
            'features': models['no_show']['features'],
            'auc_roc': round(models['no_show']['auc'], 4),
        }
    return info
