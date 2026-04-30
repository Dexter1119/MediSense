####################################################################
#
# File Name :   lung_multimodel_service.py
# Description : Run ALL trained lung models for confidence comparison
# Author      : Pradhumnya Changdev Kalsait
# Date        : 28/04/26
#
####################################################################

import os
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from scipy.stats import skew, kurtosis
from sklearn.calibration import CalibratedClassifierCV
from sklearn.pipeline import Pipeline as SKPipeline

# ================= PATH SETUP =================
BASE_DIR = Path(__file__).resolve().parent.parent.parent

STAGE1_MODELS_DIR = (
    BASE_DIR / "ml_models" / "lung_models"
    / "stage1_copd_ml"
)

STAGE2_MODELS_DIR = (
    BASE_DIR / "ml_models" / "lung_models"
    / "stage2_copd_ml"
)

# ================= CONSTANTS =================
BEST_MODEL_S1 = "ExtraTrees"
BEST_MODEL_S2 = "GradientBoosting"

STAGE1_LABEL_MAP = {0: "COPD", 1: "SMOKERS", 2: "CONTROL", 3: "AIR"}

# Only the 14 primary models from the training script
STAGE2_PRIMARY = {
    "ExtraTrees", "RandomForest", "GradientBoosting", "BaggingDT",
    "AdaBoost", "DecisionTree", "LogisticRegression", "RBFSVM",
    "LinearSVM", "GaussianNB", "KNN", "VotingHard", "VotingSoft",
    "Stacking",
}

# Bagging.pkl and SVM.pkl are not from the training script and cause errors
STAGE1_BLACKLIST = {"Bagging", "SVM"}


# ================= LOAD MODELS AT STARTUP =================
def _load_models(directory, whitelist=None, blacklist=None):
    """Load all .pkl models from a directory, optionally filtering by name."""
    models = {}
    if not directory.exists():
        return models
    for f in sorted(directory.glob("*.pkl")):
        name = f.stem
        if whitelist and name not in whitelist:
            continue
        if blacklist and name in blacklist:
            continue
        try:
            models[name] = joblib.load(f)
        except Exception as e:
            print(f"[WARN] Could not load {f.name}: {e}")
    return models


print("[INFO] Loading Stage-1 lung models for comparison...")
stage1_models = _load_models(STAGE1_MODELS_DIR, blacklist=STAGE1_BLACKLIST)
print(f"[INFO] Loaded {len(stage1_models)} Stage-1 models: {list(stage1_models.keys())}")

print("[INFO] Loading Stage-2 lung models for comparison...")
stage2_models = _load_models(STAGE2_MODELS_DIR, whitelist=STAGE2_PRIMARY)
print(f"[INFO] Loaded {len(stage2_models)} Stage-2 models: {list(stage2_models.keys())}")


# ================= CALIBRATION =================
def _extract_sensor_features(signal):
    """9 statistical features per sensor (matches training pipeline)."""
    return [
        np.mean(signal), np.std(signal), np.min(signal), np.max(signal),
        np.median(signal), np.sqrt(np.mean(signal ** 2)), np.sum(signal ** 2),
        skew(signal), kurtosis(signal),
    ]


def _load_stage1_calibration_data():
    """Load Stage-1 e-nose training data and extract 72-dim feature vectors."""
    data_dir = STAGE1_MODELS_DIR.parent.parent / "data"
    label_map = {"COPD": 0, "SMOKERS": 1, "CONTROL": 2}

    X_list, y_list = [], []
    for label, code in label_map.items():
        path = data_dir / f"{label}.csv"
        if not path.exists():
            print(f"  [WARN] Missing calibration file: {path.name}")
            continue
        df = pd.read_csv(path)
        raw = df.values
        n_breaths = raw.shape[1] // 8
        for i in range(n_breaths):
            block = raw[:, i * 8 : (i + 1) * 8]
            features = []
            for s in range(8):
                features.extend(_extract_sensor_features(block[:, s]))
            X_list.append(features)
            y_list.append(code)

    if not X_list:
        return None, None
    return np.array(X_list), np.array(y_list)


def _load_stage2_calibration_data():
    """Load Stage-2 clinical training data (PatientCategorical.csv)."""
    path = STAGE2_MODELS_DIR.parent / "PatientCategorical.csv"
    if not path.exists():
        print(f"  [WARN] Missing calibration file: {path.name}")
        return None, None
    df = pd.read_csv(path)
    X = df.drop(["COPD GOLD", "FEV1"], axis=1)
    y = df["COPD GOLD"]
    return X, y


def _calibrate_models(models, X_cal, y_cal):
    """
    Wrap each fitted pipeline with Platt scaling (sigmoid calibration).
    For each model:
      1. Transform calibration data through preprocessing steps
      2. Wrap the classifier with CalibratedClassifierCV(cv='prefit')
      3. Rebuild the pipeline with the calibrated classifier
    """
    calibrated = {}
    for name, pipeline in models.items():
        try:
            # Transform calibration data through preprocessing (scaler, imputer)
            X_transformed = X_cal.copy() if hasattr(X_cal, "copy") else np.copy(X_cal)
            for step_name, step in pipeline.steps[:-1]:
                X_transformed = step.transform(X_transformed)

            # Extract the fitted classifier (last step)
            classifier = pipeline.steps[-1][1]

            # Apply Platt scaling
            cal_clf = CalibratedClassifierCV(
                classifier, cv="prefit", method="sigmoid"
            )
            cal_clf.fit(X_transformed, y_cal)

            # Rebuild pipeline: preprocessing → calibrated classifier
            new_steps = list(pipeline.steps[:-1]) + [("model", cal_clf)]
            calibrated[name] = SKPipeline(new_steps)

            print(f"  [OK] Calibrated: {name}")
        except Exception as e:
            print(f"  [SKIP] {name}: {e}")
            calibrated[name] = pipeline
    return calibrated


# ── Apply calibration at startup ──
print("[INFO] Calibrating Stage-1 models (Platt scaling)...")
_s1_X, _s1_y = _load_stage1_calibration_data()
if _s1_X is not None and len(_s1_X) > 0:
    stage1_models = _calibrate_models(stage1_models, _s1_X, _s1_y)
    del _s1_X, _s1_y

print("[INFO] Calibrating Stage-2 models (Platt scaling)...")
_s2_X, _s2_y = _load_stage2_calibration_data()
if _s2_X is not None and len(_s2_X) > 0:
    stage2_models = _calibrate_models(stage2_models, _s2_X, _s2_y)
    del _s2_X, _s2_y

print("[INFO] Calibration complete.")

# ================= PROBABILITY HELPER =================
def _safe_softmax(x):
    """Numerically stable softmax."""
    e = np.exp(x - np.max(x))
    return e / e.sum()


def _get_probabilities(pipeline, X):
    """
    Try predict_proba → decision_function + softmax → vote proportions → None.
    Handles LinearSVC, VotingHard, and other edge cases gracefully.
    """
    # 1. Standard predict_proba (works for most models)
    try:
        return pipeline.predict_proba(X)[0]
    except (AttributeError, Exception):
        pass

    # 2. decision_function + softmax (works for LinearSVC, SVM)
    try:
        decision = pipeline.decision_function(X)
        if decision.ndim == 1:
            decision = decision.reshape(1, -1)
        return _safe_softmax(decision[0])
    except (AttributeError, Exception):
        pass

    # 3. VotingClassifier with voting="hard" — compute vote proportions
    #    from its fitted sub-estimators as pseudo-probabilities
    try:
        model = pipeline.steps[-1][1]  # last step = the classifier
        if hasattr(model, "estimators_") and getattr(model, "voting", None) == "hard":
            # Transform X through all preprocessing steps (scaler, imputer, etc.)
            X_transformed = X
            for _, step in pipeline.steps[:-1]:
                X_transformed = step.transform(X_transformed)

            n_classes = len(model.classes_)
            votes = np.zeros(n_classes)
            for est in model.estimators_:
                pred = est.predict(X_transformed)[0]
                idx = np.where(model.classes_ == pred)[0]
                if len(idx) > 0:
                    votes[idx[0]] += 1

            return votes / votes.sum() if votes.sum() > 0 else None
    except Exception:
        pass

    return None


# ================= STAGE 1 MULTI-MODEL =================
def run_all_stage1_models(features):
    """
    Run all Stage-1 models on the same extracted features.
    Returns a list sorted by: primary first, then confidence descending.
    """
    results = []

    for name, pipeline in stage1_models.items():
        try:
            pred = int(pipeline.predict(features)[0])
            probs = _get_probabilities(pipeline, features)
            confidence = float(np.max(probs)) if probs is not None else None

            entry = {
                "model_name": name,
                "prediction": STAGE1_LABEL_MAP.get(pred, str(pred)),
                "confidence": confidence,
                "is_primary": name == BEST_MODEL_S1,
            }

            if probs is not None:
                entry["class_probabilities"] = {
                    STAGE1_LABEL_MAP[i]: round(float(probs[i]), 4)
                    for i in range(len(probs))
                }

            results.append(entry)

        except Exception as e:
            results.append({
                "model_name": name,
                "prediction": "Error",
                "confidence": None,
                "is_primary": name == BEST_MODEL_S1,
                "error": str(e),
            })

    # Sort: primary (ExtraTrees) first, then by confidence descending
    results.sort(key=lambda x: (
        not x.get("is_primary", False),
        -(x.get("confidence") or 0),
    ))

    return results


# ================= STAGE 2 MULTI-MODEL =================
def run_all_stage2_models(df):
    """
    Run all Stage-2 models on the same clinical DataFrame.
    Returns a list sorted by: primary first, then confidence descending.
    """
    results = []

    for name, pipeline in stage2_models.items():
        try:
            pred = int(pipeline.predict(df)[0])
            probs = _get_probabilities(pipeline, df)
            confidence = float(np.max(probs)) if probs is not None else None

            entry = {
                "model_name": name,
                "prediction": f"GOLD {pred}",
                "gold_stage": pred,
                "confidence": confidence,
                "is_primary": name == BEST_MODEL_S2,
            }

            if probs is not None:
                entry["class_probabilities"] = {
                    f"GOLD_{i+1}": round(float(probs[i]), 4)
                    for i in range(len(probs))
                }

            results.append(entry)

        except Exception as e:
            results.append({
                "model_name": name,
                "prediction": "Error",
                "gold_stage": None,
                "confidence": None,
                "is_primary": name == BEST_MODEL_S2,
                "error": str(e),
            })

    # Sort: primary (ExtraTrees) first, then by confidence descending
    results.sort(key=lambda x: (
        not x.get("is_primary", False),
        -(x.get("confidence") or 0),
    ))

    return results
