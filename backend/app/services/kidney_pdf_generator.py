####################################################################
#
# File Name :   kidney_pdf_generator.py
# Description : Advanced Kidney Clinical PDF Generator
# Author      : Pradhumnya Changdev Kalsait
# Date        : 30/03/26
#
####################################################################

from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
)
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from io import BytesIO


def generate_kidney_pdf(report_data):

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []

    styles = getSampleStyleSheet()

    # ================= HEADER =================
    elements.append(Paragraph("<b>AI Medical Diagnostic System</b>", styles["Title"]))
    elements.append(Paragraph("Kidney Disease Clinical Report", styles["Heading2"]))
    elements.append(Spacer(1, 0.2 * inch))

    elements.append(
        Paragraph(f"Generated: {report_data['generated_at']}", styles["Normal"])
    )

    elements.append(Spacer(1, 0.3 * inch))

    # ================= PATIENT INFO =================
    if report_data["patient"]:
        patient = report_data["patient"]

        patient_table = Table([
            ["Name", patient.get("name", "-")],
            ["Age", patient.get("age", "-")],
            ["Gender", patient.get("gender", "-")],
            ["Patient ID", patient.get("id", "-")]
        ])

        patient_table.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('BACKGROUND', (0,0), (0,-1), colors.lightgrey)
        ]))

        elements.append(Paragraph("<b>Patient Information</b>", styles["Heading3"]))
        elements.append(Spacer(1, 0.2 * inch))
        elements.append(patient_table)
        elements.append(Spacer(1, 0.3 * inch))

    # ================= PREDICTION =================
    elements.append(Paragraph("<b>Prediction Summary</b>", styles["Heading2"]))

    elements.append(
        Paragraph(
            f"Result: {report_data['prediction']} | Confidence: {round(report_data['confidence']*100,2)}%",
            styles["Normal"]
        )
    )

    elements.append(Spacer(1, 0.3 * inch))

    # ================= PROBABILITY TABLE =================
    if report_data["probabilities"]:
        prob_data = [["Class", "Probability (%)"]]

        for label, data in report_data["probabilities"].items():
            prob_data.append([label, round(data["probability"] * 100, 2)])

        prob_table = Table(prob_data)

        prob_table.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('BACKGROUND', (0,0), (-1,0), colors.lightblue)
        ]))

        elements.append(Paragraph("<b>Probability Analysis</b>", styles["Heading3"]))
        elements.append(Spacer(1, 0.2 * inch))
        elements.append(prob_table)
        elements.append(Spacer(1, 0.3 * inch))

    # ================= FEATURES =================
    if report_data["features"]:
        feature_data = [["Feature", "Value"]]

        for key, value in report_data["features"].items():
            feature_data.append([key, value])

        feature_table = Table(feature_data)

        feature_table.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('BACKGROUND', (0,0), (-1,0), colors.lightgrey)
        ]))

        elements.append(Paragraph("<b>Input Feature Summary</b>", styles["Heading3"]))
        elements.append(Spacer(1, 0.2 * inch))
        elements.append(feature_table)
        elements.append(Spacer(1, 0.3 * inch))

    # ================= CLINICAL NOTE =================
    elements.append(Paragraph("<b>Clinical Interpretation</b>", styles["Heading2"]))
    elements.append(
        Paragraph(report_data["clinical_note"], styles["Normal"])
    )

    elements.append(Spacer(1, 0.5 * inch))

    # ================= FOOTER =================
    elements.append(
        Paragraph(
            "Disclaimer: This is an AI-generated report. Please consult a certified medical professional.",
            styles["Normal"]
        )
    )

    doc.build(elements)
    buffer.seek(0)

    return buffer