####################################################################
#
# File Name    : lung_report_service.py
# Description  : MediSense Lung — Clinical COPD Report & PDF Generator
#                (ReportLab — Teal/Cyan theme)
#                Section order:
#                  1. Header
#                  2. Stage 1 — Breath Acoustics Screening
#                  3. Stage 2 — GOLD Severity Grading
#                  4. Clinical Parameters Analysis (all fields)
#                  5. Model Consensus — Stage 1
#                  6. Model Consensus — Stage 2
#                  7. Clinical Interpretation & Recommendation
# Author       : Antigravity AI
# Date         : 29/04/26
#
####################################################################

import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable,
)

# ── Colour palette (Lung Theme — Teal/Cyan) ───────────────────────────
_DEEP_TEAL  = colors.HexColor("#042f2e")
_TEAL       = colors.HexColor("#0D9488")
_LIGHT_TEAL = colors.HexColor("#E6F7F6")
_RED        = colors.HexColor("#C0392B")
_AMBER      = colors.HexColor("#E67E22")
_GREEN      = colors.HexColor("#27AE60")
_MID_GREY   = colors.HexColor("#CCCCCC")
_WHITE      = colors.white
_BLACK      = colors.black

_STATUS_COLORS = {
    "Normal":       _GREEN,
    "High":         _RED,
    "Low":          _AMBER,
    "Not Provided": _MID_GREY,
    "—":            _MID_GREY,
}

# ── GOLD Stage map ─────────────────────────────────────────────────────
GOLD_MAP = {
    1: ("GOLD 1 — Mild COPD",        "LOW",      "Lifestyle modification and bronchodilator therapy recommended."),
    2: ("GOLD 2 — Moderate COPD",    "MEDIUM",   "Pulmonary rehabilitation and long-acting bronchodilators advised."),
    3: ("GOLD 3 — Severe COPD",      "HIGH",     "Frequent monitoring, combination inhalers, and specialist referral required."),
    4: ("GOLD 4 — Very Severe COPD", "CRITICAL", "ICU-level care may be required. Lung transplant evaluation advised."),
}

# ── Stage 1 clinical interpretations ──────────────────────────────────
STAGE1_CLINICAL = {
    "COPD": (
        "Breath acoustics indicate a COPD pattern. "
        "Confirmatory spirometry (FEV\u2081/FVC < 0.70 post-bronchodilator) is strongly recommended. "
        "Proceed with Stage 2 severity assessment for GOLD staging."
    ),
    "SMOKERS": (
        "Active smoker breath pattern detected. "
        "Smoking is the #1 modifiable COPD risk factor — 15\u201320% of active smokers develop COPD. "
        "Cessation therapy and annual spirometry screening are recommended."
    ),
    "CONTROL": (
        "Normal breath acoustics detected — no COPD or smoking-related pattern identified. "
        "Continue routine health monitoring and maintain regular physical activity."
    ),
    "AIR": (
        "Ambient/environmental air sample detected — no biological respiratory pattern identified. "
        "Please upload a valid patient breath sample for clinical analysis."
    ),
}

# ── Numeric clinical parameters with reference ranges ──────────────────
#    (evaluated for Normal / High / Low status)
NUMERIC_PARAMS = {
    "Respiratory Rate":  {"name": "Respiratory Rate",  "unit": "br/min",  "low": 12,   "high": 20},
    "Oxygen Saturation": {"name": "SpO\u2082",              "unit": "%",       "low": 88,   "high": 100},
    "Heart Rate":        {"name": "Heart Rate",        "unit": "bpm",     "low": 60,   "high": 100},
    "Blood pressure":    {"name": "Systolic BP",       "unit": "mmHg",    "low": 90,   "high": 139},
    "Temperature":       {"name": "Body Temperature",  "unit": "\u00b0C",       "low": 36.1, "high": 37.2},
    "Age":               {"name": "Age",               "unit": "yrs",     "low": 18,   "high": 100},
    "BMI, kg/m2":        {"name": "BMI",               "unit": "kg/m\u00b2",    "low": 18.5, "high": 24.9},
    "Height/m":          {"name": "Height",            "unit": "m",       "low": 1.20, "high": 2.20},
    "Pack History":      {"name": "Pack-Year History", "unit": "pack-yrs","low": 0,    "high": 10},
    "mMRC":              {"name": "mMRC Dyspnea Scale","unit": "0\u20134",     "low": 0,    "high": 1},
}

# ── Categorical clinical parameters (display value label only) ─────────
CATEGORICAL_PARAMS = {
    "Gender":                   {"name": "Gender",                "map": {1: "Male",              0: "Female"}},
    "working place":            {"name": "Workplace Exposure",    "map": {1: "Industrial",         0: "Non-Industrial"}},
    "status of smoking":        {"name": "Smoking Status",        "map": {1: "Current Smoker",     0: "Non-Smoker / Ex-Smoker"}},
    "History of Heart Failure": {"name": "Hx of Heart Failure",  "map": {1: "Present",            0: "Absent"}},
    "Depression":               {"name": "Depression",            "map": {1: "Present",            0: "Absent"}},
    "Vaccination":              {"name": "Influenza Vaccination", "map": {1: "Vaccinated",         0: "Not Vaccinated"}},
    "Sputum":                   {"name": "Sputum Production",     "map": {1: "Present (Purulent)", 0: "Absent"}},
    "Dependent":                {"name": "Functional Dependence", "map": {1: "Dependent",          0: "Independent"}},
}


# ══════════════════════════════════════════════════════════════════════
#  DATA ASSEMBLER
# ══════════════════════════════════════════════════════════════════════

def generate_report(stage1: dict, stage2: dict | None, clinical_data: dict) -> dict:
    """Assemble structured data dict consumed by generate_pdf_from_report()."""

    # Stage 1
    s1_prediction = stage1.get("prediction", "Unknown")
    s1_confidence = stage1.get("confidence", 0)
    s1_models     = stage1.get("model_confidences", [])

    # Stage 2
    gold_stage    = stage2.get("gold_stage") if stage2 else None
    s2_confidence = stage2.get("confidence", 0) if stage2 else None
    s2_models     = stage2.get("model_confidences", []) if stage2 else []

    gold_label, gold_risk, gold_recommendation = GOLD_MAP.get(
        gold_stage,
        ("Not Assessed", "N/A", "Stage 2 assessment not performed."),
    ) if gold_stage else ("Not Assessed", "N/A", "Stage 2 assessment not performed.")

    # ── Numeric parameters table ──────────────────────────────────────
    numeric_rows = []
    for key, meta in NUMERIC_PARAMS.items():
        val = clinical_data.get(key)
        if val is not None:
            try:
                val = float(val)
                status = "Normal"
                if val > meta["high"]:  status = "High"
                elif val < meta["low"]: status = "Low"
            except (TypeError, ValueError):
                status = "Not Provided"
                val = None
        else:
            status = "Not Provided"
        numeric_rows.append({
            "name":   meta["name"],
            "value":  val,
            "unit":   meta["unit"],
            "low":    meta["low"],
            "high":   meta["high"],
            "status": status,
        })

    # ── Categorical parameters table ──────────────────────────────────
    categorical_rows = []
    for key, meta in CATEGORICAL_PARAMS.items():
        raw = clinical_data.get(key)
        if raw is not None:
            try:
                label = meta["map"].get(int(float(raw)), str(raw))
            except (TypeError, ValueError):
                label = str(raw)
        else:
            label = "Not Provided"
        categorical_rows.append({"name": meta["name"], "value": label})

    return {
        "report_metadata": {
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "system": "MediSense Lung — AI COPD Diagnostic Pipeline v2.0 (GOLD 2024)",
        },
        "stage1": {
            "prediction":    s1_prediction,
            "confidence":    f"{s1_confidence * 100:.2f}%",
            "clinical_note": STAGE1_CLINICAL.get(s1_prediction, "Clinical evaluation required."),
            "probabilities": stage1.get("probabilities", {}),  # class probability breakdown
            "model_results": s1_models,
        },
        "stage2": {
            "gold_label":     gold_label,
            "gold_risk":      gold_risk,
            "confidence":     f"{s2_confidence * 100:.2f}%" if s2_confidence is not None else "N/A",
            "recommendation": gold_recommendation,
            "model_results":  s2_models,
        } if gold_stage else None,
        "numeric_params":      numeric_rows,
        "categorical_params":  categorical_rows,
        "medical_disclaimer": (
            "This AI-generated report is a decision support tool and not a clinical diagnosis. "
            "Findings must be reviewed by a board-certified pulmonologist or respirologist."
        ),
    }


# ══════════════════════════════════════════════════════════════════════
#  STYLE BUILDER
# ══════════════════════════════════════════════════════════════════════

def _styles():
    return {
        "title": ParagraphStyle(
            name="title", fontSize=18, textColor=_WHITE, alignment=TA_CENTER,
            spaceAfter=2, fontName="Helvetica-Bold"
        ),
        "subtitle": ParagraphStyle(
            name="subtitle", fontSize=9,
            textColor=colors.HexColor("#B2DFDB"), alignment=TA_CENTER,
            spaceAfter=0, fontName="Helvetica"
        ),
        "section_heading": ParagraphStyle(
            name="section_heading", fontSize=11, textColor=_TEAL,
            fontName="Helvetica-Bold", spaceBefore=14, spaceAfter=6
        ),
        "sub_heading": ParagraphStyle(
            name="sub_heading", fontSize=9, textColor=_TEAL,
            fontName="Helvetica-Bold", spaceBefore=8, spaceAfter=4
        ),
        "body": ParagraphStyle(
            name="body", fontSize=9, leading=13, textColor=_BLACK
        ),
        "body_bold_white": ParagraphStyle(
            name="body_bold_white", fontSize=9, leading=13,
            textColor=_WHITE, fontName="Helvetica-Bold"
        ),
    }


# ── Helper: build a consensus model table ─────────────────────────────
def _model_table(model_list, S):
    """Return a Table flowable for model consensus. Returns None if empty."""
    valid = [m for m in model_list if not m.get("error") and m.get("confidence") is not None]
    if not valid:
        return None

    rows = [[
        Paragraph("<b>Sub-Model</b>",  S["body_bold_white"]),
        Paragraph("<b>Prediction</b>", S["body_bold_white"]),
        Paragraph("<b>Certainty</b>",  S["body_bold_white"]),
    ]]
    for m in valid:
        name_cell = ("★ " if m.get("is_primary") else "") + m.get("model_name", "—")
        conf_pct  = f"{m['confidence'] * 100:.1f}%" if m.get("confidence") is not None else "N/A"
        rows.append([
            Paragraph(name_cell, S["body"]),
            m.get("prediction", "—"),
            conf_pct,
        ])

    t = Table(rows, colWidths=[80*mm, 60*mm, 40*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), _DEEP_TEAL),
        ("TEXTCOLOR",  (0, 0), (-1, 0), _WHITE),
        ("GRID",       (0, 0), (-1, -1), 0.5, _MID_GREY),
        ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t


# ══════════════════════════════════════════════════════════════════════
#  PDF GENERATOR
# ══════════════════════════════════════════════════════════════════════

def generate_pdf_from_report(report: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=15*mm, leftMargin=15*mm,
        topMargin=15*mm, bottomMargin=15*mm
    )
    S = _styles()
    story = []

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 1.  HEADER
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    hdr = [
        [Paragraph("MediSense Lung", S["title"])],
        [Paragraph("Clinical COPD Decision Support Report · GOLD 2024", S["subtitle"])],
        [Paragraph(f"Generated: {report['report_metadata']['generated_at']}", S["subtitle"])],
    ]
    t = Table(hdr, colWidths=[180*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), _DEEP_TEAL),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(t)
    story.append(Spacer(1, 6*mm))

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 2.  STAGE 1 — BREATH ACOUSTICS SCREENING
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    s1 = report["stage1"]
    story.append(Paragraph("STAGE 1 — BREATH ACOUSTICS SCREENING", S["section_heading"]))
    story.append(HRFlowable(width="100%", thickness=1, color=_TEAL, spaceAfter=4))

    s1_data = [
        [Paragraph("<b>Prediction:</b>",   S["body"]), Paragraph(s1["prediction"],    S["body"])],
        [Paragraph("<b>Confidence:</b>",   S["body"]), Paragraph(s1["confidence"],    S["body"])],
        [Paragraph("<b>Clinical Note:</b>",S["body"]), Paragraph(s1["clinical_note"], S["body"])],
    ]
    t = Table(s1_data, colWidths=[45*mm, 135*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), _LIGHT_TEAL),
        ("GRID",       (0, 0), (-1, -1), 0.5, _MID_GREY),
        ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
        ("PADDING",    (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 5*mm))

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 3.  STAGE 2 — GOLD SEVERITY GRADING  (if present)
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if report["stage2"]:
        s2 = report["stage2"]
        story.append(Paragraph("STAGE 2 — GOLD SEVERITY GRADING", S["section_heading"]))
        story.append(HRFlowable(width="100%", thickness=1, color=_TEAL, spaceAfter=4))

        s2_data = [
            [Paragraph("<b>GOLD Classification:</b>", S["body"]), Paragraph(s2["gold_label"],     S["body"])],
            [Paragraph("<b>Risk Level:</b>",           S["body"]), Paragraph(s2["gold_risk"],      S["body"])],
            [Paragraph("<b>System Confidence:</b>",    S["body"]), Paragraph(s2["confidence"],     S["body"])],
            [Paragraph("<b>Recommendation:</b>",       S["body"]), Paragraph(s2["recommendation"], S["body"])],
        ]
        t = Table(s2_data, colWidths=[50*mm, 130*mm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), _LIGHT_TEAL),
            ("GRID",       (0, 0), (-1, -1), 0.5, _MID_GREY),
            ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
            ("PADDING",    (0, 0), (-1, -1), 6),
        ]))
        story.append(t)
        story.append(Spacer(1, 5*mm))

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 4.  CLINICAL PARAMETERS ANALYSIS
    #     4a. Vital & Numeric Parameters (with Normal/High/Low)
    #     4b. Clinical & Categorical Parameters (value display)
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    story.append(Paragraph("CLINICAL PARAMETERS ANALYSIS", S["section_heading"]))
    story.append(HRFlowable(width="100%", thickness=1, color=_TEAL, spaceAfter=4))

    # ── 4a. Numeric / Vital signs ──────────────────────────────────
    story.append(Paragraph("Vital & Numeric Parameters", S["sub_heading"]))

    num_rows = [[
        Paragraph("<b>Parameter</b>",  S["body_bold_white"]),
        Paragraph("<b>Observed</b>",   S["body_bold_white"]),
        Paragraph("<b>Unit</b>",       S["body_bold_white"]),
        Paragraph("<b>Reference</b>",  S["body_bold_white"]),
        Paragraph("<b>Status</b>",     S["body_bold_white"]),
    ]]
    for item in report["numeric_params"]:
        sc = _STATUS_COLORS.get(item["status"], _MID_GREY)
        num_rows.append([
            item["name"],
            str(item["value"]) if item["value"] is not None else "—",
            item["unit"],
            f"{item['low']} – {item['high']}",
            Paragraph(
                f"<b>{item['status']}</b>",
                ParagraphStyle("sc", textColor=sc, fontSize=9, alignment=TA_CENTER)
            ),
        ])

    t = Table(num_rows, colWidths=[50*mm, 28*mm, 24*mm, 40*mm, 38*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0), _DEEP_TEAL),
        ("TEXTCOLOR",     (0, 0), (-1, 0), _WHITE),
        ("GRID",          (0, 0), (-1, -1), 0.5, _MID_GREY),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.HexColor("#F0FDFA"), _WHITE]),
    ]))
    story.append(t)
    story.append(Spacer(1, 4*mm))

    # ── 4b. Categorical / Clinical Parameters ──────────────────────
    story.append(Paragraph("Clinical & Lifestyle Parameters", S["sub_heading"]))

    cat_rows = [[
        Paragraph("<b>Parameter</b>",      S["body_bold_white"]),
        Paragraph("<b>Recorded Value</b>", S["body_bold_white"]),
    ]]
    for item in report["categorical_params"]:
        cat_rows.append([item["name"], item["value"]])

    t = Table(cat_rows, colWidths=[90*mm, 90*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0), _DEEP_TEAL),
        ("TEXTCOLOR",     (0, 0), (-1, 0), _WHITE),
        ("GRID",          (0, 0), (-1, -1), 0.5, _MID_GREY),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.HexColor("#F0FDFA"), _WHITE]),
    ]))
    story.append(t)
    story.append(Spacer(1, 6*mm))

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 5.  MODEL CONSENSUS — STAGE 1
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    s1_cons = _model_table(s1["model_results"], S)
    if s1_cons:
        story.append(Paragraph("MODEL CONSENSUS & ENSEMBLE VERIFICATION — STAGE 1", S["section_heading"]))
        story.append(HRFlowable(width="100%", thickness=1, color=_TEAL, spaceAfter=4))
        story.append(s1_cons)
        story.append(Spacer(1, 6*mm))

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 6.  MODEL CONSENSUS — STAGE 2  (if present)
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if report["stage2"]:
        s2_table = _model_table(report["stage2"]["model_results"], S)
        if s2_table:
            story.append(Paragraph("MODEL CONSENSUS & ENSEMBLE VERIFICATION — STAGE 2", S["section_heading"]))
            story.append(HRFlowable(width="100%", thickness=1, color=_TEAL, spaceAfter=4))
            story.append(s2_table)
            story.append(Spacer(1, 6*mm))

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 6.  CLINICAL INTERPRETATION & RECOMMENDATION
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    story.append(Paragraph("CLINICAL INTERPRETATION & RECOMMENDATION", S["section_heading"]))
    story.append(HRFlowable(width="100%", thickness=1, color=_TEAL, spaceAfter=4))
    story.append(Paragraph(s1["clinical_note"], S["body"]))
    if report["stage2"]:
        story.append(Spacer(1, 3*mm))
        story.append(Paragraph(
            f"<b>GOLD Recommendation:</b> {report['stage2']['recommendation']}",
            S["body"]
        ))

    # ── Disclaimer ────────────────────────────────────────────────────
    story.append(Spacer(1, 10*mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=_MID_GREY))
    story.append(Paragraph(
        f"<i>Disclaimer: {report['medical_disclaimer']}</i>", S["body"]
    ))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
