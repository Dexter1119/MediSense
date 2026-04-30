import joblib
import pandas as pd
import numpy as np
import json
from pathlib import Path  
from app.utils.tooltip_formatter import format_confidence_tooltip
from app.services.lung_multimodel_service import run_all_stage2_models

# ================= PATH SETUP =================
BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODEL_PATH = BASE_DIR / "ml_models" / "lung_models" / "stage2_copd_ml" / "GradientBoosting.pkl"
FEATURE_PATH = BASE_DIR / "ml_models" / "stage2_features.json"

# ================= LOAD MODEL =================
stage2_model = joblib.load(MODEL_PATH)

with open(FEATURE_PATH, "r") as f:
    required_features = json.load(f)

STAGE2_CONF_THRESHOLD = 0.50


def predict_stage2(input_data: dict):

    ordered_data = {f: input_data[f] for f in required_features}
    df = pd.DataFrame([ordered_data])

    prediction = stage2_model.predict(df)[0]
    probabilities = stage2_model.predict_proba(df)[0]

    confidence = float(np.max(probabilities))

    probability_breakdown = {
    f"GOLD_{i+1}": format_confidence_tooltip(
        f"GOLD_{i+1}",
        float(probabilities[i])
    )
    for i in range(len(probabilities))
}

    # Run all trained models for confidence comparison
    model_confidences = run_all_stage2_models(df)

    return {
        "gold_stage": int(prediction),
        "confidence": confidence,
        "probabilities": probability_breakdown,
        "meets_threshold": confidence >= STAGE2_CONF_THRESHOLD,
        "model_confidences": model_confidences,
    }