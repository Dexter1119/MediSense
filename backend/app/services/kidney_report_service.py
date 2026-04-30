####################################################################
#
# File Name    : kidney_report_service.py
# Description  : MediSense Kidney — Clinical Report & PDF Generator
#                (ReportLab implementation with Purple/Indigo theme)
# Author       : Antigravity AI
# Date         : 29/04/26
#
####################################################################

import io
import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)

# ── Colour palette (Kidney Theme — Purple/Indigo) ─────────────────────
_DEEP_PURPLE = colors.HexColor("#2E1A47")
_PURPLE      = colors.HexColor("#6A0DAD")
_LIGHT_PURPLE = colors.HexColor("#F3E5F5")
_RED         = colors.HexColor("#C0392B")
_AMBER       = colors.HexColor("#E67E22")
_GREEN       = colors.HexColor("#27AE60")
_LIGHT_GREY  = colors.HexColor("#F5F5F5")
_MID_GREY    = colors.HexColor("#CCCCCC")
_DARK_GREY   = colors.HexColor("#555555")
_WHITE       = colors.white
_BLACK       = colors.black

_STATUS_COLORS = {
    "Normal":       _GREEN,
    "High":         _RED,
    "Low":          _AMBER,
    "Not Provided": _MID_GREY,
}

# ── Lab reference ranges ─────────────────────────────────────────────
LAB_META = {
    "gfr":              {"name": "GFR",                "unit": "mL/min", "low": 90,  "high": 120},
    "serum_creatinine": {"name": "Serum Creatinine",   "unit": "mg/dL",  "low": 0.6, "high": 1.2},
    "bun":              {"name": "BUN",                "unit": "mg/dL",  "low": 7,   "high": 20},
    "blood_pressure":   {"name": "Systolic BP",        "unit": "mmHg",   "low": 90,  "high": 120},
    "serum_calcium":    {"name": "Serum Calcium",      "unit": "mg/dL",  "low": 8.5, "high": 10.5},
    "oxalate_levels":   {"name": "Oxalate",            "unit": "mmol/L", "low": 0.1, "high": 0.5},
    "urine_ph":         {"name": "Urine pH",           "unit": "pH",      "low": 4.5, "high": 8.0},
    "c3_c4":            {"name": "C3/C4 Levels",       "unit": "mg/dL",  "low": 80,  "high": 160},
    "water_intake":     {"name": "Water Intake",       "unit": "L/day",  "low": 2.0, "high": 3.0},
}

CLINICAL_NOTES = {
    "No Kidney Disease": (
        "No immediate renal indicators detected. GFR and metabolic markers appear stable. "
        "Maintain adequate hydration and regular annual screenings."
    ),
    "CKD Stage 1": (
        "Early signs of kidney damage with normal or near-normal GFR (≥ 90 mL/min). "
        "Focus on blood pressure control, lifestyle modifications, and monitoring to prevent progression."
    ),
    "CKD Stage 2": (
        "Mild reduction in GFR (60–89 mL/min) with evidence of kidney damage. "
        "Dietary adjustments, regular monitoring, and risk-factor management are recommended."
    ),
    "CKD Stage 3": (
        "Moderate reduction in GFR. Indicates significant loss of kidney function. "
        "Consultation with a nephrologist and strict medication management are required."
    ),
    "CKD Stage 4": (
        "Severe reduction in GFR. High risk of progression to end-stage renal disease. "
        "Urgent nephrologist consultation and preparation for renal replacement therapy may be needed."
    ),
    "End Stage Renal Disease": (
        "Critical loss of kidney function. Kidney transplant evaluation or dialysis is typically required. "
        "Immediate ICU-level specialist care is indicated."
    )
}

def generate_report(input_data: dict, prediction: dict) -> dict:
    """Structures data for the PDF generator."""
    
    # 1. Build Lab Table
    lab_table = []
    for key, meta in LAB_META.items():
        val = input_data.get(key)
        status = "Normal"
        if val is not None:
            if val > meta["high"]: status = "High"
            elif val < meta["low"]:  status = "Low"
        else:
            status = "Not Provided"
        
        lab_table.append({
            "name": meta["name"],
            "value": val,
            "unit": meta["unit"],
            "low": meta["low"],
            "high": meta["high"],
            "status": status
        })

    disease = prediction.get("disease", "Unknown")

    return {
        "report_metadata": {
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "system": "MediSense Kidney — AI Diagnostic Pipeline v2.0",
        },
        "patient_information": {
            "age": input_data.get("age"),
            "gender": "Male" if input_data.get("gender") == 1 else "Female",
        },
        "laboratory_values": lab_table,
        "ai_diagnosis": {
            "primary_diagnosis": disease,
            "confidence": prediction.get("confidence"),
            "risk_level": prediction.get("criticality"),
        },
        "model_confidence": {
            "model_results": prediction.get("model_results", {}),
        },
        "clinical_interpretation": CLINICAL_NOTES.get(disease, "Clinical evaluation required."),
        "final_recommendation": prediction.get("decision"),
        "medical_disclaimer": (
            "This AI-generated report is a decision support tool and not a clinical diagnosis. "
            "Findings must be reviewed by a board-certified nephrologist."
        )
    }

def generate_pdf_from_report(report: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=15*mm, leftMargin=15*mm,
        topMargin=15*mm, bottomMargin=15*mm
    )

    styles = {
        "title": ParagraphStyle(
            name="title", fontSize=18, textColor=_WHITE, alignment=TA_CENTER,
            spaceAfter=2, fontName="Helvetica-Bold"
        ),
        "subtitle": ParagraphStyle(
            name="subtitle", fontSize=9, textColor=colors.HexColor("#D1C4E9"), alignment=TA_CENTER,
            spaceAfter=0, fontName="Helvetica"
        ),
        "section_heading": ParagraphStyle(
            name="section_heading", fontSize=11, textColor=_PURPLE, fontName="Helvetica-Bold",
            spaceBefore=12, spaceAfter=6, borderPadding=0
        ),
        "body": ParagraphStyle(
            name="body", fontSize=9, leading=13, textColor=colors.black
        ),
        "body_bold": ParagraphStyle(
            name="body_bold", fontSize=9, leading=13, textColor=colors.black, fontName="Helvetica-Bold"
        ),
        "body_bold_white": ParagraphStyle(
            name="body_bold_white", fontSize=9, leading=13, textColor=colors.white, fontName="Helvetica-Bold"
        ),
        "stat": ParagraphStyle(
            name="stat", fontSize=9, alignment=TA_CENTER
        )
    }

    story = []
    
    # 1. Header
    header_data = [
        [Paragraph("MediSense Kidney", styles["title"])],
        [Paragraph("Clinical Renal Decision Support Report", styles["subtitle"])],
        [Paragraph(f"Generated: {report['report_metadata']['generated_at']}", styles["subtitle"])]
    ]
    t = Table(header_data, colWidths=[180*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), _DEEP_PURPLE),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(t)
    story.append(Spacer(1, 6*mm))

    # 2. Result Summary
    story.append(Paragraph("AI DIAGNOSTIC SUMMARY", styles["section_heading"]))
    story.append(HRFlowable(width="100%", thickness=1, color=_PURPLE, spaceAfter=4))
    
    diag = report["ai_diagnosis"]
    
    summary_data = [
        [Paragraph("<b>Condition Status:</b>", styles["body"]), Paragraph(diag["primary_diagnosis"], styles["body"])],
        [Paragraph("<b>Risk Classification:</b>", styles["body"]), Paragraph(diag["risk_level"], styles["body"])],
        [Paragraph("<b>System Confidence:</b>", styles["body"]), Paragraph(diag["confidence"], styles["body"])]
    ]
    t = Table(summary_data, colWidths=[50*mm, 130*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), _LIGHT_PURPLE),
        ("GRID", (0, 0), (-1, -1), 0.5, _MID_GREY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 6*mm))

    # 3. Lab Values
    story.append(Paragraph("CLINICAL RENAL LABORATORY ANALYSIS", styles["section_heading"]))
    story.append(HRFlowable(width="100%", thickness=1, color=_PURPLE, spaceAfter=4))
    
    rows = [[Paragraph("<b>Parameter</b>", styles["body_bold_white"]), 
             Paragraph("<b>Observed</b>", styles["body_bold_white"]), 
             Paragraph("<b>Unit</b>", styles["body_bold_white"]), 
             Paragraph("<b>Reference</b>", styles["body_bold_white"]), 
             Paragraph("<b>Status</b>", styles["body_bold_white"])]]
    
    for item in report["laboratory_values"]:
        status_color = _STATUS_COLORS.get(item["status"], _MID_GREY)
        rows.append([
            item["name"],
            str(item["value"]) if item["value"] is not None else "—",
            item["unit"],
            f"{item['low']} - {item['high']}",
            Paragraph(f"<b>{item['status']}</b>", ParagraphStyle("stat_colored", textColor=status_color, fontSize=9, alignment=TA_CENTER))
        ])

    t = Table(rows, colWidths=[50*mm, 30*mm, 30*mm, 40*mm, 30*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), _DEEP_PURPLE),
        ("TEXTCOLOR", (0, 0), (-1, 0), _WHITE),
        ("GRID", (0, 0), (-1, -1), 0.5, _MID_GREY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t)
    story.append(Spacer(1, 6*mm))

    # 4. Consensus Section
    story.append(Paragraph("MODEL CONSENSUS & ENSEMBLE VERIFICATION", styles["section_heading"]))
    story.append(HRFlowable(width="100%", thickness=1, color=_PURPLE, spaceAfter=4))
    
    models = report["model_confidence"]["model_results"]
    if models:
        c_rows = [[Paragraph("<b>Sub-Model</b>", styles["body_bold_white"]), 
                   Paragraph("<b>Prediction</b>", styles["body_bold_white"]), 
                   Paragraph("<b>Certainty</b>", styles["body_bold_white"])]]
        
        # models is a dict {name: {stage: X, confidence: Y, error?: str}}
        for name, val in models.items():
            stage = val.get('stage')
            if stage is None:
                stage_label = "Error"
            elif stage == 0:
                stage_label = "No CKD"
            else:
                stage_label = f"CKD Stage {stage}"
            c_rows.append([Paragraph(name, styles["body"]), stage_label, f"{val['confidence']}%"])
        
        t = Table(c_rows, colWidths=[80*mm, 60*mm, 40*mm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), _DEEP_PURPLE),
            ("TEXTCOLOR", (0, 0), (-1, 0), _WHITE),
            ("GRID", (0, 0), (-1, -1), 0.5, _MID_GREY),
            ("PADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(t)
    
    story.append(Spacer(1, 6*mm))

    # 5. Clinical Interpretation & Recommendation
    story.append(Paragraph("CLINICAL INTERPRETATION & RECOMMENDATION", styles["section_heading"]))
    story.append(HRFlowable(width="100%", thickness=1, color=_PURPLE, spaceAfter=4))
    story.append(Paragraph(report["clinical_interpretation"], styles["body"]))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(f"<b>Recommendation:</b> {report['final_recommendation']}", styles["body"]))
    
    story.append(Spacer(1, 10*mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=_MID_GREY))
    story.append(Paragraph(f"<i>Disclaimer: {report['medical_disclaimer']}</i>", styles["body"]))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
