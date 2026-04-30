####################################################################
#
# File Name :   lung_service.py
# Description : Stage-1 lung disease prediction using breath data (.txt)
# Author      : Pradhumnya Changdev Kalsait
# Date        : 18/01/26
#
####################################################################

import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import numpy as np
import joblib
from scipy.stats import skew, kurtosis

lung_blueprint = Blueprint("lung", __name__)

CLASS_MAP = {
    0: "COPD",
    1: "SMOKER",
    2: "CONTROL"
}

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
MODEL_PATH = os.path.join(
    BASE_DIR,
    "ml_models",
    "saved_models",
    "RandomForest.pkl"
)

lung_model = joblib.load(MODEL_PATH)

def extract_features(breath_signal: np.ndarray) -> np.ndarray:
    return np.array([
        np.mean(breath_signal),
        np.std(breath_signal),
        np.min(breath_signal),
        np.max(breath_signal),
        np.median(breath_signal),
        np.sqrt(np.mean(breath_signal ** 2)),
        np.sum(breath_signal ** 2),
        skew(breath_signal),
        kurtosis(breath_signal)
    ])

def predict_lung_disease(txt_file):
    raw_data = np.loadtxt(txt_file)

    if raw_data.ndim == 1:
        raw_data = raw_data.reshape(-1, 1)

    breaths = raw_data.T
    features = np.array([extract_features(b) for b in breaths])
    final_feature = np.mean(features, axis=0).reshape(1, -1)

    pred = int(lung_model.predict(final_feature)[0])
    prob = float(np.max(lung_model.predict_proba(final_feature)))

    return {
        "prediction": CLASS_MAP[pred],
        "confidence": f"{prob * 100:.2f}%",
        "stage2_required": CLASS_MAP[pred] == "COPD"
    }

@lung_blueprint.route("/predict", methods=["POST"])
@jwt_required()   # 🔥 THIS WAS MISSING
def predict():

    if "file" not in request.files:
        return jsonify({"error": "Breath file (.txt) missing"}), 400

    txt_file = request.files["file"]

    if txt_file.filename == "":
        return jsonify({"error": "Empty file uploaded"}), 400

    result = predict_lung_disease(txt_file)
    return jsonify(result), 200
