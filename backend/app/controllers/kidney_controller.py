####################################################################
#
# File Name :   kidney_controller.py
# Description : kidney prediction API endpoints
# Author      : Pradhumnya Changdev Kalsait
# Date        : 17/01/26
#
####################################################################

from flask import Blueprint, request, jsonify, Response, send_file
from flask_jwt_extended import jwt_required
from app.services.kidney_service import predict_kidney_disease
from app.services.kidney_report_service import (
    generate_report,
    generate_pdf_from_report
)

from app.utils.jwt_utils import role_required
from app.utils.constants import UserRole

kidney_blueprint = Blueprint("kidney", __name__)

"""
################################################################
#
# Function Name : predict_kidney
# Description   : API endpoint for kidney disease prediction
# Author        : Pradhumnya Changdev Kalsait
# Date          : 17/01/26
# Prototype     : Response predict_kidney(void)
# Input Output  : (0 input, 1 output)
#
################################################################
"""
@kidney_blueprint.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Empty input payload"}), 400

        result = predict_kidney_disease(data)
        return jsonify(result), 200

    except Exception as e:
        print("Kidney prediction error:", e)
        return jsonify({"error": str(e)}), 500


"""
################################################################
#
# Function Name : generate_kidney_report
# Description   : API endpoint for kidney PDF report generation
# Author        : Ankita Pandit Sawant / Antigravity AI
# Date          : 29/04/26
# Prototype     : Response generate_kidney_report(void)
# Input Output  : (1 input, 1 output)
#
################################################################
"""
@kidney_blueprint.route("/report", methods=["POST"])
def generate_kidney_report():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Empty input payload"}), 400

        # Step 1: Model Prediction
        prediction_result = predict_kidney_disease(data)

        if not prediction_result or "error" in prediction_result:
             return jsonify({"error": "Prediction failed"}), 500

        # Step 2: Assemble Report
        report = generate_report(data, prediction_result)

        # Step 3: Generate PDF
        pdf_bytes = generate_pdf_from_report(report)

        # Step 4: Return PDF
        return Response(
            pdf_bytes,
            mimetype='application/pdf',
            headers={'Content-Disposition': 'attachment;filename=MediSense_Kidney_Report.pdf'}
        )

    except Exception as e:
        print("Kidney report error:", e)
        return jsonify({"error": str(e)}), 500