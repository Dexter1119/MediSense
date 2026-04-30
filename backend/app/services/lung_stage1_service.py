import joblib
import pandas as pd
import numpy as np
from app.utils.enose_feature_extraction import extract_enose_features
from app.utils.tooltip_formatter import format_confidence_tooltip
from app.services.lung_multimodel_service import run_all_stage1_models

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODEL_PATH = BASE_DIR / "ml_models" / "lung_models" / "stage1_copd_ml" / "ExtraTrees.pkl"


stage1_model = joblib.load(MODEL_PATH)

label_map = {
    0: "COPD",
    1: "SMOKERS",
    2: "CONTROL",
    3: "AIR"
}

STAGE1_CONF_THRESHOLD = 0.60


def predict_stage1(file):

    df = pd.read_csv(file)

    features = extract_enose_features(df)

    prediction = stage1_model.predict(features)[0]
    probabilities = stage1_model.predict_proba(features)[0]

    confidence = float(np.max(probabilities))

    probability_breakdown = {
    label_map[i]: format_confidence_tooltip(
        label_map[i],
        float(probabilities[i])
    )
    for i in range(len(probabilities))
}

    # Run all trained models for confidence comparison
    model_confidences = run_all_stage1_models(features)

    return {
        "prediction": label_map[prediction],
        "confidence": confidence,
        "probabilities": probability_breakdown,
        "meets_threshold": confidence >= STAGE1_CONF_THRESHOLD,
        "model_confidences": model_confidences,
    }