####################################################################
#
# File Name :   lung_controller.py
# Description : Lung prediction API endpoints
# Author      : Pradhumnya Changdev Kalsait
# Date        : 17/01/26  | 29/04/26 — added /report endpoint
#
####################################################################

from flask import Blueprint, request, jsonify, send_file, Response
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services.lung_stage1_service import predict_stage1
from app.services.lung_stage2_service import predict_stage2
from app.services.lung_pipeline_service import full_copd_pipeline

from app.services.lung_report_assembler import assemble_copd_report
from app.services.lung_pdf_generator import generate_copd_pdf
from app.services.lung_topography_service import process_topography

from app.services.lung_report_service import generate_report, generate_pdf_from_report

import json

# -------------------------------------------------
# Blueprint
lung_blueprint = Blueprint("lung", __name__)


"""
################################################################
# STAGE-1 ENDPOINT
################################################################
"""
@lung_blueprint.route("/stage1", methods=["POST"])
def stage1_predict():

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    breath_file = request.files["file"]

    try:
        result = predict_stage1(breath_file)
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


"""
################################################################
# STAGE-2 ENDPOINT
################################################################
"""
@lung_blueprint.route("/stage2", methods=["POST"])
def stage2_predict():

    data = request.json

    if not data:
        return jsonify({"error": "No clinical data provided"}), 400

    try:
        result = predict_stage2(data)
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


"""
################################################################
# FULL PIPELINE ENDPOINT (OPTIONAL)
################################################################
"""
@lung_blueprint.route("/predict", methods=["POST"])
def predict_full():

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    breath_file = request.files["file"]

    clinical_data = request.form.get("clinical_data")

    if clinical_data:
        clinical_data = json.loads(clinical_data)
    else:
        clinical_data = None

    try:
        result = full_copd_pipeline(breath_file, clinical_data)
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


"""
################################################################
# LEGACY PDF REPORT ENDPOINT (kept for backward compatibility)
################################################################
"""
@lung_blueprint.route("/report/pdf", methods=["POST"])
@jwt_required()
def generate_pdf():

    stage1 = request.json.get("stage1")
    stage2 = request.json.get("stage2")

    if not stage1:
        return jsonify({"error": "Stage1 data required"}), 400

    report_data = assemble_copd_report(stage1, stage2)

    pdf_buffer = generate_copd_pdf(report_data)

    return send_file(
        pdf_buffer,
        as_attachment=True,
        download_name="COPD_AI_Report.pdf",
        mimetype="application/pdf"
    )


"""
################################################################
# NEW — MEDISENSE-FORMAT PDF REPORT ENDPOINT
# Accepts: multipart/form-data with "file" + optional "clinical_data" (JSON string)
# OR:      application/json with {"stage1": {...}, "stage2": {...}, "clinical_data": {...}}
# Returns: PDF blob
################################################################
"""
@lung_blueprint.route("/report", methods=["POST"])
def generate_lung_report():
    try:
        # ── Detect if request carries a breath file (multipart) or pure JSON ──
        if "file" in request.files:
            # Full pipeline: run stage 1, optionally stage 2
            breath_file   = request.files["file"]
            clinical_raw  = request.form.get("clinical_data")
            clinical_data = json.loads(clinical_raw) if clinical_raw else {}

            stage1_result = predict_stage1(breath_file)
            stage2_result = None

            if stage1_result.get("prediction") == "COPD" and clinical_data:
                try:
                    stage2_result = predict_stage2(clinical_data)
                except Exception as e:
                    print(f"[lung_controller] Stage-2 skipped in report: {e}")

        else:
            # Pure JSON — frontend already has results, or sends clinical data
            body          = request.get_json(force=True) or {}
            stage1_result = body.get("stage1")
            stage2_result = body.get("stage2")
            clinical_data = body.get("clinical_data", {})

            if not stage1_result:
                return jsonify({"error": "stage1 result is required"}), 400

        # ── Assemble & render ─────────────────────────────────────────
        report    = generate_report(stage1_result, stage2_result, clinical_data)
        pdf_bytes = generate_pdf_from_report(report)

        return Response(
            pdf_bytes,
            mimetype="application/pdf",
            headers={
                "Content-Disposition": "attachment;filename=MediSense_Lung_COPD_Report.pdf"
            },
        )

    except Exception as e:
        print("[lung_controller] Report error:", e)
        return jsonify({"error": str(e)}), 500