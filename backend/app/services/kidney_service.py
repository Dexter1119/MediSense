####################################################################
#
# File Name :   kidney_service.py
# Description : Kidney disease prediction service using VotingClassifier
# Author      : Pradhumnya Changdev Kalsait
# Date        : 19/01/26  | Fixed: stage_map, feature order, df mutation
#
####################################################################

import os
import numpy as np
import pandas as pd
import joblib
from flask import Blueprint, request, jsonify

kidney_blueprint = Blueprint("kidney", __name__)

# ================================================================
# Model Loading
# ================================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "ml_models","kidney_model", "all_ckd_models.pkl")

models_dict = joblib.load(MODEL_PATH)

# ✅ FIX 1: Get feature order from the preprocessor's input columns,
#            not from pipeline.feature_names_in_ (which doesn't exist)
sample_model = list(models_dict.values())[0]
preprocessor = sample_model.named_steps["preprocessing"]
numerical_cols = list(preprocessor.transformers_[0][2])   # "num" transformer cols
categorical_cols = list(preprocessor.transformers_[1][2]) # "cat" transformer cols
FEATURE_ORDER = numerical_cols + categorical_cols

# ================================================================
# Stage Map — corrected to match dataset (stages 0–5)
# ================================================================

# ✅ FIX 2: Stage 0 = No CKD (125 rows in dataset confirm this).
#            Previous map started at 1, causing wrong outputs for stage 0
#            and wrong labels for all other stages.
STAGE_MAP = {
    0: ("No Kidney Disease",        "LOW",       "NO TRANSPLANT REQUIRED (Healthy)"),
    1: ("CKD Stage 1",              "LOW",       "Monitoring & Lifestyle Changes Recommended"),
    2: ("CKD Stage 2",              "MEDIUM",    "TREATMENT Required"),
    3: ("CKD Stage 3",              "HIGH",      "TREATMENT Required"),
    4: ("CKD Stage 4",              "VERY HIGH", "TREATMENT REQUIRED"),
    5: ("End Stage Renal Disease",  "CRITICAL",  "TRANSPLANT REQUIRED"),
}

# ================================================================
# Core Prediction Logic
# ================================================================

def predict_kidney_disease(input_data: dict) -> dict:
    """
    Multi-model inference with confidence aggregation.
    Returns the prediction of the highest-confidence model.
    """

    # ✅ FIX 3: Build a clean df once, outside the loop.
    #           Convert categorical cols to str here — not inside the loop —
    #           so df is never mutated between iterations.
    df = pd.DataFrame([input_data])
    df = df.reindex(columns=FEATURE_ORDER)

    for col in categorical_cols:
        df[col] = df[col].astype(str)

    all_results = {}
    best_conf = -1
    best_stage = None

    for name, model in models_dict.items():
        try:
            pred = int(model.predict(df)[0])

            if hasattr(model.named_steps["model"], "predict_proba"):
                prob = model.predict_proba(df)
                confidence = float(np.max(prob))
            else:
                confidence = 0.0  # SVC without probability=True fallback

            all_results[name] = {
                "stage": pred,
                "confidence": round(confidence * 100, 2),
            }

            if confidence > best_conf:
                best_conf = confidence
                best_stage = pred

        except Exception as e:
            print(f"[kidney_service] Error in model '{name}':", e)
            all_results[name] = {"stage": None, "confidence": 0.0, "error": str(e)}

    # ================================================================
    # Guard: if all models failed, return an error response
    # ================================================================
    if best_stage is None:
        return {
            "organ": "KIDNEY",
            "error": "All models failed to produce a prediction.",
            "model_results": all_results,
        }

    # ✅ FIX 4: Use .get() with a fallback so an unexpected stage label
    #           never causes a KeyError crash in production.
    disease, criticality, decision = STAGE_MAP.get(
        best_stage,
        (f"Unknown Stage ({best_stage})", "UNKNOWN", "Please consult a doctor"),
    )

    return {
        "organ": "KIDNEY",
        "disease": disease,
        "criticality": criticality,
        "decision": decision,
        "confidence": f"{best_conf * 100:.2f}%",
        "model_results": all_results,
    }