####################################################################
#
# File Name    : heart_controller.py
# Description  : MediSense Heart — /predict endpoint (Flask Blueprint)
# Author       : Pradhumnya Changdev Kalsait
# Date         : 20/01/26
#
####################################################################

from flask import Blueprint, request, jsonify, Response
from app.services.heart_service import (
    predict_heart_disease,
    generate_report,
    generate_pdf_from_report
)

heart_blueprint = Blueprint("heart_blueprint", __name__)


"""
################################################################
#
# Function Name : predict_heart
# Description   : MediSense Heart — Heart disease prediction REST API
# Author        : Pradhumnya Changdev Kalsait
# Date          : 20/01/26
# Prototype     : dict predict_heart(void)
# Input Output  : (1 input, 1 output)
#
################################################################
"""

# ── Required fields ────────────────────────────────────────────────
REQUIRED_FIELDS = [
    "Age", "Gender", "Height(cm)", "Weight(kg)",
    "Systolic_Blood_Pressure", "Diastolic_Blood_Pressure",
    "Cholesterol", "Glucose", "Smoking", "Alcohol", "Physical_Activity",
]


@heart_blueprint.route("/predict", methods=["POST"])
def predict_heart():

    body = request.get_json(force=True)
    if body is None:
        return jsonify({"success": False, "error": "Invalid or empty JSON body"}), 400

    # ── Validate presence ──────────────────────────────────────────
    missing = [f for f in REQUIRED_FIELDS if f not in body]
    if missing:
        return jsonify({"success": False, "error": f"Missing fields: {missing}"}), 400

    # ── Build + type-check input dict ──────────────────────────────
    input_data = {}
    for field in REQUIRED_FIELDS:
        try:
            input_data[field] = float(body[field])
        except (ValueError, TypeError):
            return jsonify({"success": False, "error": f"Invalid value for '{field}'"}), 400

    # ── Call heart_service ─────────────────────────────────────────
    result = predict_heart_disease(input_data)

    if result.get("disease") == "Error":
        return jsonify({
            "success": False,
            "error": result.get("decision", "Prediction failed")
        }), 500

    criticality = result.get("criticality", "").strip()   # e.g. "High Risk"

    # ── Deriving dynamic probabilities from model ──────────────────
    prob_disease = result.get("prob_disease", 50.0)
    confidence   = result.get("confidence", "50.0%").replace("%", "")

    # ── Split "ACTION: recommendation text" ────────────────────────
    decision_raw = result.get("decision", "")
    if ":" in decision_raw:
        action_part, _, rec_part = decision_raw.partition(":")
        medical_action = action_part.strip().title()
        recommendation = rec_part.strip().capitalize()
    else:
        medical_action = decision_raw.strip().title()
        recommendation = ""

    return jsonify({
        "success": True,
        "result": {
            "organ":          result.get("organ", "Heart"),
            "disease_type":   result.get("disease", "Unknown"),
            "risk_level":     criticality,
            "prediction":     1 if "NO CARDIOVASCULAR" not in result.get("disease", "").upper() else 0,
            "probabilities": {
                "Disease":    round(prob_disease, 1),
                "No Disease": round(100.0 - prob_disease, 1),
            },
            "confidence":     confidence,
            "medical_action": medical_action,
            "recommendation": recommendation,
            "presence":       "Present" if "NO CARDIOVASCULAR" not in result.get("disease", "").upper() else "Absent",
            
            # Consensus Engine Data
            "model_results":  result.get("model_results", []),
            "diagnostics": {
                "loaded_models": result.get("loaded_models_count", 0)
            },

            "model_info": {
                "model_name":     "XGBoost (Consensus Engine)",
                "model_accuracy": 0.88,
            },
        }
    }), 200

@heart_blueprint.route("/report", methods=["POST"])
def generate_heart_report():
    try:
        body = request.get_json(force=True)
        if not body:
            return jsonify({"success": False, "error": "No input data"}), 400

        # 1. Prediction
        input_data = {f: float(body[f]) for f in REQUIRED_FIELDS}
        prediction = predict_heart_disease(input_data)
        
        if prediction.get("disease") == "Error":
            return jsonify({"success": False, "error": "Prediction failed"}), 500

        # 2. Report
        report = generate_report(input_data, prediction)

        # 3. PDF
        pdf_bytes = generate_pdf_from_report(report)

        return Response(
            pdf_bytes,
            mimetype='application/pdf',
            headers={'Content-Disposition': 'attachment;filename=MediSense_Heart_Report.pdf'}
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500