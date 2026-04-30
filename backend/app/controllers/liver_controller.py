from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required
from app.utils.jwt_utils import role_required
from app.utils.constants import UserRole
from app.services.liver_service import (
    predict_liver_disease,
    generate_report,
    generate_pdf_from_report
)

liver_blueprint = Blueprint("liver", __name__)


@liver_blueprint.route("/predict", methods=["POST"])
def predict_liver():

    try:
        input_data = request.get_json()

        if not input_data:
            return jsonify({"error": "No input data provided"}), 400

        # ONLY prediction
        prediction_result = predict_liver_disease(input_data)

        return jsonify(prediction_result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@liver_blueprint.route("/report", methods=["POST"])
def generate_report_pdf():

    try:
        input_data = request.get_json()

        # Step 1: prediction
        prediction = predict_liver_disease(input_data)

        # Step 2: report
        report = generate_report(input_data, prediction)

        # Step 3: PDF
        pdf = generate_pdf_from_report(report)

        return Response(pdf, mimetype='application/pdf')

    except Exception as e:
        return {"error": str(e)}, 500