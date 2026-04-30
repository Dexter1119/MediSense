####################################################################
#
# File Name   : liver_service.py
# Description : All-in-one liver disease service for MediSense
#
#   Sections (in order):
#     1. ML Prediction  — 2-stage model pipeline
#     2. MELD Scoring   — MELD, MELD-Na, Child-Pugh
#     3. Report Builder — structured report dict
#     4. PDF Generator  — ReportLab PDF export (bytes)
#
#   Public API (called by liver_controller.py):
#     predict_liver_disease(input_data: dict) -> dict
#     generate_report(patient_data, prediction_result: dict) -> dict
#     generate_pdf_from_report(report: dict) -> bytes
#
####################################################################


# ====================================================================
# SECTION 1 — ML PREDICTION
# ====================================================================

import joblib
import numpy as np
import logging
import os
import pandas as pd

logger = logging.getLogger(__name__)

# -----------------------------------------------
# Model paths — relative to this file's location
# Structure: backend/ml_models/liver_models/
# -----------------------------------------------
_ML = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   "..", "..", "ml_models", "liver_models")

def _load(rel_path: str):
    """Load a .pkl model using a path relative to the liver_models directory."""
    full = os.path.normpath(os.path.join(_ML, rel_path))
    try:
        return joblib.load(full)
    except Exception as exc:
        logger.error("Failed to load model '%s': %s", full, exc)
        raise RuntimeError(f"Could not load model: {full}") from exc


# ── Primary voting classifiers & Scalers ─────────────────────────────
model1  = _load("cirhosis/VotingClfCirh.pkl")   # 4-class: 0=Normal,1=Hepatitis,2=Fibrosis,3=Cirrhosis
model2  = _load("yesno/yesnoClfCirh.pkl")       # binary:  0=Early Liver Disease, 1=Healthy
scaler1 = _load("scalers/scaler1.pkl")
scaler2 = _load("scalers/scaler_stage2.pkl")

# ── Sub-models for Model 1 (cirhosis dataset — 4-class) ───────────────
model1_sub = {
    "Logistic Regression": _load("cirhosis/LogisticCirh.pkl"),
    "Random Forest":       _load("cirhosis/RandomForestCirh.pkl"),
    "AdaBoost":            _load("cirhosis/AdaboostCirh.pkl"),
    "KNN":                 _load("cirhosis/KNNCirh.pkl"),
    "Decision Tree":       _load("cirhosis/DecisionTreeCirh.pkl"),
    "Gradient Boosting":   _load("cirhosis/GradientBoostCirh.pkl"),
}

# ── Sub-models for Model 2 (ILPD dataset — binary) ────────────────────
model2_sub = {
    "Logistic Regression": _load("yesno/LogisticRegression.pkl"),
    "Random Forest":       _load("yesno/RandomForestClassifier.pkl"),
    "XGBoost":             _load("yesno/XGBoost.pkl"),
    "KNN":                 _load("yesno/KNN.pkl"),
    "Decision Tree":       _load("yesno/DecisionTreeClassifier.pkl"),
    "Gradient Boosting":   _load("yesno/GradientBoostingClassifier.pkl"),
    "AdaBoost":            _load("yesno/Adaboost.pkl"),
}


# -----------------------------------------------
# Utility: Albumin / Globulin ratio
# -----------------------------------------------
def _calculate_ag_ratio(albumin: float, total_protein: float) -> float | None:
    """
    Globulin = Total Protein - Albumin.
    Returns None if globulin <= 0 (invalid input).
    Normal range: 1.0 – 2.0
    """
    globulin = total_protein - albumin
    if globulin <= 0:
        logger.warning("A/G ratio skipped: globulin <= 0 (alb=%.2f, prot=%.2f)",
                       albumin, total_protein)
        return None
    return round(albumin / globulin, 3)


# -----------------------------------------------
# Utility: Sub-model confidence scores
# -----------------------------------------------
def _get_submodel_probabilities(models_dict: dict, input_array: np.ndarray) -> dict:
    """
    Collects the highest class probability from each sub-model.
    """
    probs = {}
    for name, model in models_dict.items():
        try:
            proba = model.predict_proba(input_array)[0]
            probs[name] = round(float(max(proba)) * 100, 2)
        except AttributeError:
            logger.warning("Model '%s' does not support predict_proba.", name)
            probs[name] = None
        except Exception as exc:
            logger.error("Error from model '%s': %s", name, exc)
            probs[name] = None
    return probs


####################################################################
#
# Function  : predict_liver_disease
# Called by : liver_controller.py → predict_liver()
# Input     : dict with keys:
#               age, gender, alb, alp, alt, ast, bil,
#               direct_bilirubin, che, chol, crea, ggt, prot
#               (optional) inr, sodium, ascites, encephalopathy
# Output    : dict — prediction result
#
####################################################################
def predict_liver_disease(input_data: dict) -> dict:
    try:
        # ── Extract inputs ────────────────────────────────────────
        age        = float(input_data["age"])
        gender     = int(input_data["gender"])
        alb        = float(input_data["alb"])
        alp        = float(input_data["alp"])
        alt        = float(input_data["alt"])
        ast        = float(input_data["ast"])
        bil        = float(input_data["bil"])
        direct_bil = float(input_data["direct_bilirubin"])
        che        = float(input_data["che"])
        chol       = float(input_data["chol"])
        crea       = float(input_data["crea"])
        ggt        = float(input_data["ggt"])
        prot       = float(input_data["prot"])

        inr    = input_data.get("inr")
        sodium = input_data.get("sodium")

        # ── Unit conversions (for Stage 1 / Cirrhosis Model) ─────
        alb_gL    = alb  * 10.0
        prot_gL   = prot * 10.0
        bil_umol  = bil  * 17.1
        crea_umol = crea * 88.4
        chol_mmol = chol / 38.67

        # ── Stage 1 (12 features — Scaled DataFrame) ──────────────
        m1_input_df = pd.DataFrame([{
            "Age":  age,
            "Sex":  gender,
            "ALB":  alb_gL,
            "ALP":  alp,
            "ALT":  alt,
            "AST":  ast,
            "BIL":  bil_umol,
            "CHE":  che,
            "CHOL": chol_mmol,
            "CREA": crea_umol,
            "GGT":  ggt,
            "PROT": prot_gL,
        }])

        m1_scaled = scaler1.transform(m1_input_df)
        
        # Ensure we keep column names for models that might expect them
        m1_input_scaled_df = pd.DataFrame(m1_scaled, columns=m1_input_df.columns)

        pred1  = int(model1.predict(m1_input_scaled_df)[0])
        probs1 = _get_submodel_probabilities(model1_sub, m1_input_scaled_df)

        # Calculate average confidence for Stage 1
        conf1 = 0
        valid1 = [v for v in probs1.values() if v is not None]
        if valid1: conf1 = round(sum(valid1) / len(valid1), 2)

        # ── Base result ───────────────────────────────────────────
        result = {
            "primary_diagnosis":      None,
            "hard_voting_prediction": pred1,
            "confidence":             conf1,
            "model_results":          probs1,
            "model1_probabilities":   probs1,
            "secondary_model_used":   False,
            "model2_probabilities":   None,
            "recommendation":         None,
        }

        # ── Routing logic ─────────────────────────────────────────
        if pred1 == 0:
            result["secondary_model_used"] = True
            ag = _calculate_ag_ratio(alb, prot) or 0.0

            # Stage 2 (10 features — Scaled array/df)
            m2_input = np.array([[
                age, gender,
                bil, direct_bil,
                alp, alt, ast,
                prot, alb, ag
            ]], dtype=np.float64)

            m2_scaled = scaler2.transform(m2_input)

            pred2  = int(model2.predict(m2_scaled)[0])
            probs2 = _get_submodel_probabilities(model2_sub, m2_scaled)
            result["model2_probabilities"] = probs2
            result["model_results"] = probs2
            
            # Update confidence if Stage 2 is used
            valid2 = [v for v in probs2.values() if v is not None]
            if valid2: result["confidence"] = round(sum(valid2) / len(valid2), 2)

            if pred2 == 0:
                result["primary_diagnosis"] = "Early Liver Disease"
                result["recommendation"]    = (
                    "Lifestyle modification and close monitoring advised."
                )
            else:
                result["primary_diagnosis"] = "Healthy"
                result["recommendation"]    = (
                    "Routine health check-up recommended after 6 months."
                )

        elif pred1 == 1:
            result["primary_diagnosis"] = "Hepatitis"
            result["recommendation"]    = (
                "Hepatitis viral panel (HBsAg, Anti-HCV) and full liver function tests recommended."
            )

        elif pred1 == 2:
            result["primary_diagnosis"] = "Fibrosis"
            result["recommendation"]    = (
                "Hepatologist consultation advised. FibroScan or liver biopsy may be required."
            )

        elif pred1 == 3:
            result["primary_diagnosis"] = "Cirrhosis"
            if inr and bil and crea:
                result["recommendation"] = (
                    "Advanced cirrhosis detected. "
                    "Severity scoring (MELD, Child-Pugh) included in report."
                )
            else:
                result["recommendation"] = (
                    "Cirrhosis detected. "
                    "Provide INR, Bilirubin, and Creatinine for full MELD scoring."
                )

        else:
            logger.error("Unexpected prediction value from model1: %s", pred1)
            result["primary_diagnosis"] = "Indeterminate"
            result["recommendation"]    = (
                "Unable to classify. Please review input values and retry."
            )

        return result

    except Exception as exc:
        logger.error("Prediction failed: %s", exc)
        return {
            "primary_diagnosis":      "ERROR",
            "hard_voting_prediction": None,
            "model1_probabilities":   None,
            "secondary_model_used":   False,
            "model2_probabilities":   None,
            "recommendation":         "INVALID INPUT — check all fields.",
        }

# ====================================================================
# SECTION 2 — MELD & CHILD-PUGH SCORING
# ====================================================================

import math

def calculate_meld(
    bilirubin:  float,
    inr:        float,
    creatinine: float,
    sodium:     float | None = None
) -> int | None:
    if None in (bilirubin, inr, creatinine):
        return None

    bilirubin  = max(bilirubin,  1.0)
    inr        = max(inr,        1.0)
    creatinine = min(max(creatinine, 1.0), 4.0)

    meld = (
        3.78  * math.log(bilirubin)  +
        11.2  * math.log(inr)        +
        9.57  * math.log(creatinine) +
        6.43
    )

    if sodium is not None:
        sodium = max(min(sodium, 137.0), 125.0)
        meld = meld + 1.32 * (137 - sodium) - (0.033 * meld * (137 - sodium))

    return round(meld)


def classify_meld(meld_score: int | None) -> dict | None:
    if meld_score is None:
        return None

    if meld_score < 10:
        return {
            "risk_level":          "Low",
            "transplant_required": False,
            "mortality_90day":     "< 2%",
            "description":         "Stable cirrhosis. Regular outpatient follow-up advised.",
        }
    elif meld_score < 15:
        return {
            "risk_level":          "Moderate",
            "transplant_required": False,
            "mortality_90day":     "~6%",
            "description":         "Clinically significant liver dysfunction. Close monitoring required.",
        }
    elif meld_score < 20:
        return {
            "risk_level":          "High",
            "transplant_required": True,
            "mortality_90day":     "~20%",
            "description":         "Transplant listing evaluation recommended.",
        }
    elif meld_score < 30:
        return {
            "risk_level":          "Very High",
            "transplant_required": True,
            "mortality_90day":     "~40%",
            "description":         "Urgent transplant evaluation required.",
        }
    else:
        return {
            "risk_level":          "Critical",
            "transplant_required": True,
            "mortality_90day":     "> 70%",
            "description":         "Critical liver failure.",
        }


def calculate_child_pugh(
    bilirubin:      float,
    albumin:        float,
    inr:            float,
    ascites:        int,
    encephalopathy: int
) -> dict | None:
    if None in (bilirubin, albumin, inr, ascites, encephalopathy):
        return None

    score = 0
    score += 1 if bilirubin < 2 else (2 if bilirubin <= 3 else 3)
    score += 1 if albumin > 3.5 else (2 if albumin >= 2.8 else 3)
    score += 1 if inr < 1.7     else (2 if inr <= 2.3 else 3)
    score += (int(ascites) + 1)
    score += (int(encephalopathy) + 1)

    if score <= 6:
        return {
            "score":          score,
            "classification": "Child-Pugh A",
            "severity":       "Well Compensated",
            "survival_1yr":   "~100%",
            "survival_2yr":   "~85%",
            "description":    "Well-compensated cirrhosis.",
        }
    elif score <= 9:
        return {
            "score":          score,
            "classification": "Child-Pugh B",
            "severity":       "Significant Compromise",
            "survival_1yr":   "~80%",
            "survival_2yr":   "~60%",
            "description":    "Significant functional compromise.",
        }
    else:
        return {
            "score":          score,
            "classification": "Child-Pugh C",
            "severity":       "Decompensated",
            "survival_1yr":   "~45%",
            "survival_2yr":   "~35%",
            "description":    "Decompensated cirrhosis. High transplant risk.",
        }


# ====================================================================
# SECTION 3 — REPORT BUILDER
# ====================================================================

from datetime import datetime

LAB_REFERENCE_RANGES = {
    "Albumin":          (3.5,  5.0,   "g/dL"),
    "ALP":              (44,   147,   "U/L"),
    "ALT":              (7,    56,    "U/L"),
    "AST":              (10,   40,    "U/L"),
    "Total Bilirubin":  (0.2,  1.2,   "mg/dL"),
    "Direct Bilirubin": (0.0,  0.3,   "mg/dL"),
    "Cholinesterase":   (5.3,  12.9,  "kU/L"),
    "Cholesterol":      (0,    200,   "mg/dL"),
    "Creatinine":       (0.6,  1.2,   "mg/dL"),
    "GGT":              (9,    48,    "U/L"),
    "Total Protein":    (6.0,  8.3,   "g/dL"),
    "INR":              (0.8,  1.1,   "ratio"),
    "Sodium":           (136,  145,   "mEq/L"),
}

CLINICAL_NOTES = {
    "Healthy": "No significant liver dysfunction detected. Normal biochemical parameters.",
    "Early Liver Disease": "Subclinical changes suggest early dysfunction. Lifestyle review advised.",
    "Hepatitis": "Pattern consistent with hepatic inflammation. Viral panel recommended.",
    "Fibrosis": "Biochemical pattern suggests progressive fibrosis. FibroScan advised.",
    "Cirrhosis": "Advanced chronic liver disease (Cirrhosis). Clinical management required.",
}

def _build_lab_table(patient_data) -> list[dict]:
    def _get(key):
        if isinstance(patient_data, dict): return patient_data.get(key)
        return getattr(patient_data, key, None)

    raw = {
        "Albumin":          _get("alb"),
        "ALP":              _get("alp"),
        "ALT":              _get("alt"),
        "AST":              _get("ast"),
        "Total Bilirubin":  _get("bil"),
        "Direct Bilirubin": _get("direct_bilirubin"),
        "Cholinesterase":   _get("che"),
        "Cholesterol":      _get("chol"),
        "Creatinine":       _get("crea"),
        "GGT":              _get("ggt"),
        "Total Protein":    _get("prot"),
        "INR":              _get("inr"),
        "Sodium":           _get("sodium"),
    }

    table = []
    for name, value in raw.items():
        low, high, unit = LAB_REFERENCE_RANGES[name]
        if value is None: status = "Not Provided"
        elif value < low: status = "Low"
        elif value > high: status = "High"
        else: status = "Normal"

        table.append({"name": name, "value": value, "unit": unit, "low": low, "high": high, "status": status})
    return table

def _build_model_confidence(probabilities: dict | None) -> dict:
    if not probabilities: return {"scores": {}, "average": None, "agreement": "N/A"}
    valid = {k: v for k, v in probabilities.items() if v is not None}
    if not valid: return {"scores": {}, "average": None, "agreement": "N/A"}
    avg = round(sum(valid.values()) / len(valid), 1)
    agr = "High" if avg >= 85 else ("Moderate" if avg >= 70 else "Low")
    return {"scores": valid, "average": avg, "agreement": agr}

def generate_report(patient_data, prediction_result: dict) -> dict:
    def _get(key):
        if isinstance(patient_data, dict): return patient_data.get(key)
        return getattr(patient_data, key, None)

    disease          = prediction_result.get("primary_diagnosis")
    prediction_class = prediction_result.get("hard_voting_prediction")
    recommendation   = prediction_result.get("recommendation")
    secondary_used   = prediction_result.get("secondary_model_used", False)

    model1_probs = prediction_result.get("model1_probabilities")
    model2_probs = prediction_result.get("model2_probabilities")
    active_probs = model2_probs if secondary_used else model1_probs

    report = {
        "report_metadata": {
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "system":       "MediSense Liver — AI Diagnostic Pipeline v2.0",
        },
        "patient_information": {
            "age":    _get("age"),
            "gender": "Male" if _get("gender") == 1 else "Female",
        },
        "laboratory_values": _build_lab_table(patient_data),
        "ai_diagnosis": {
            "primary_diagnosis":    disease,
            "prediction_class":     prediction_class,
            "secondary_model_used": secondary_used,
            "pipeline_summary": (
                "Stage 1 (Cirrhosis Detection) → Stage 2 (Early Assessment)" if secondary_used else "Stage 1 (Cirrhosis Detection) — Final Diagnosis"
            ),
        },
        "model_confidence": {
            "model_results": active_probs, # For backward compatibility with simpler tables
            "active": _build_model_confidence(active_probs),
        },
        "clinical_interpretation": CLINICAL_NOTES.get(disease, "Evaluation required."),
        "severity_assessment": None,
        "final_recommendation": recommendation,
        "medical_disclaimer": "AI-generated tool. Results must be reviewed by a specialist.",
    }

    if prediction_class == 3:
        meld_score = calculate_meld(_get("bil"), _get("inr"), _get("crea"), _get("sodium"))
        meld_result = classify_meld(meld_score)
        child_pugh = calculate_child_pugh(_get("bil"), _get("alb"), _get("inr"), _get("ascites"), _get("encephalopathy"))
        report["severity_assessment"] = {
            "meld_score": meld_score, "meld": meld_result, "child_pugh": child_pugh,
            "transplant_required": (meld_result["transplant_required"] if meld_result else False),
        }

    return report


# ====================================================================
# SECTION 4 — PDF GENERATOR
# ====================================================================

import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether

_NAVY       = colors.HexColor("#1B3A5C")
_TEAL       = colors.HexColor("#1A7A8A")
_LIGHT_TEAL = colors.HexColor("#E8F4F6")
_RED        = colors.HexColor("#C0392B")
_AMBER      = colors.HexColor("#E67E22")
_GREEN      = colors.HexColor("#27AE60")
_LIGHT_GREY = colors.HexColor("#F5F5F5")
_MID_GREY   = colors.HexColor("#CCCCCC")
_DARK_GREY  = colors.HexColor("#555555")
_WHITE      = colors.white
_BLACK      = colors.black

_STATUS_COLORS = { "Normal": _GREEN, "High": _RED, "Low": _AMBER, "Not Provided": _MID_GREY }

def _build_pdf_styles() -> dict:
    return {
        "title": ParagraphStyle("title", fontSize=22, fontName="Helvetica-Bold", textColor=_WHITE, alignment=TA_CENTER, spaceAfter=4),
        "subtitle": ParagraphStyle("subtitle", fontSize=10, fontName="Helvetica", textColor=colors.HexColor("#CCE8ED"), alignment=TA_CENTER),
        "section_heading": ParagraphStyle("SectionHeading", fontSize=12, fontName="Helvetica-Bold", textColor=_NAVY, spaceBefore=10, spaceAfter=4),
        "body": ParagraphStyle("Body", fontSize=9, fontName="Helvetica", textColor=_DARK_GREY, leading=14),
        "body_bold": ParagraphStyle("BodyBold", fontSize=9, fontName="Helvetica-Bold", textColor=_BLACK, leading=14),
        "body_bold_white": ParagraphStyle("BodyBoldWhite", fontSize=9, fontName="Helvetica-Bold", textColor=_WHITE, leading=14),
        "disclaimer": ParagraphStyle("Disclaimer", fontSize=8, fontName="Helvetica-Oblique", textColor=_DARK_GREY),
    }

def _section_heading(text, styles):
    return KeepTogether([Paragraph(text.upper(), styles["section_heading"]), HRFlowable(width="100%", thickness=1, color=_TEAL, spaceAfter=6)])

def _two_col_table(l_label, l_val, r_label, r_val, styles):
    t = Table([[Paragraph(f"<b>{l_label}</b>", styles["body"]), Paragraph(str(l_val), styles["body"]), Paragraph(f"<b>{r_label}</b>", styles["body"]), Paragraph(str(r_val), styles["body"])]], colWidths=[38*mm, 52*mm, 38*mm, 52*mm])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
    return t

def _info_box(text, bg_color, text_color, styles):
    t = Table([[Paragraph(text, ParagraphStyle("InfoBox", fontSize=10, fontName="Helvetica-Bold", textColor=text_color, alignment=TA_CENTER))]], colWidths=[180*mm])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), bg_color), ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8)]))
    return t

def _pdf_build_header(report, styles, page_width):
    meta = report.get("report_metadata", {})
    t = Table([[Paragraph("MediSense Liver", styles["title"])], [Paragraph("Clinical Liver Disease Decision Support Report", styles["subtitle"])], [Paragraph(f"Generated: {meta.get('generated_at', '')}", styles["subtitle"])]], colWidths=[page_width])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), _NAVY), ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8)]))
    return t

def _pdf_lab_section(report, styles):
    story = [_section_heading("Laboratory Values", styles)]
    rows = [[Paragraph("<b>Parameter</b>", styles["body_bold_white"]), Paragraph("<b>Value</b>", styles["body_bold_white"]), Paragraph("<b>Unit</b>", styles["body_bold_white"]), Paragraph("<b>Reference Range</b>", styles["body_bold_white"]), Paragraph("<b>Status</b>", styles["body_bold_white"])]]
    for i, lab in enumerate(report.get("laboratory_values", []), start=1):
        rows.append([Paragraph(lab.get("name", ""), styles["body"]), Paragraph(str(lab.get("value", "—")), styles["body"]), Paragraph(lab.get("unit", ""), styles["body"]), Paragraph(f"{lab.get('low', '')} – {lab.get('high', '')}", styles["body"]), Paragraph(f"<b>{lab.get('status', '')}</b>", ParagraphStyle("StatusCell", fontSize=8, fontName="Helvetica-Bold", textColor=_STATUS_COLORS.get(lab.get("status"), _MID_GREY), alignment=TA_CENTER))])
    t = Table(rows, colWidths=[52*mm, 28*mm, 22*mm, 45*mm, 33*mm], repeatRows=1)
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), _NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), _WHITE), ("GRID", (0, 0), (-1, -1), 0.5, _MID_GREY), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
    story.append(t); story.append(Spacer(1, 4*mm))
    return story

def _pdf_confidence_section(report, styles):
    story = [_section_heading("Model Confidence", styles)]
    active = report.get("model_confidence", {}).get("active", {})
    story.append(Paragraph(f"<b>Average Confidence:</b> {active.get('average', '—')}%  |  <b>Agreement:</b> {active.get('agreement', '—')}", styles["body"]))
    scores = active.get("scores", {})
    if scores:
        rows = [[Paragraph("<b>AI Sub-Model</b>", styles["body_bold_white"]), Paragraph("<b>Confidence</b>", styles["body_bold_white"])]]
        for name, pct in scores.items(): rows.append([Paragraph(name, styles["body"]), Paragraph(f"{pct}%", styles["body"])])
        t = Table(rows, colWidths=[120*mm, 40*mm])
        t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), _NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), _WHITE), ("GRID", (0, 0), (-1, -1), 0.5, _MID_GREY), ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
        story.append(t)
    story.append(Spacer(1, 4*mm))
    return story

def generate_pdf_from_report(report: dict) -> bytes:
    buffer = io.BytesIO(); margin = 15*mm
    doc = SimpleDocTemplate(buffer, pagesize=A4, leftMargin=margin, rightMargin=margin, topMargin=margin, bottomMargin=margin, title="MediSense Liver Report")
    page_width = A4[0] - 2*margin; styles = _build_pdf_styles(); story = []
    story.append(_pdf_build_header(report, styles, page_width)); story.append(Spacer(1, 5*mm))
    info = report.get("patient_information", {})
    story.append(_section_heading("Patient Information", styles)); story.append(_two_col_table("Age", info.get("age", "—"), "Gender", info.get("gender", "—"), styles))
    diag = report.get("ai_diagnosis", {})
    story.append(_section_heading("AI Diagnosis", styles)); story.append(_info_box(f"Diagnosis: {diag.get('primary_diagnosis', 'Unknown')}", _TEAL, _WHITE, styles))
    story.append(Spacer(1, 3*mm)); story.append(Paragraph(f"<b>Pipeline:</b> {diag.get('pipeline_summary', '—')}", styles["body"]))
    story += _pdf_lab_section(report, styles)
    story += _pdf_confidence_section(report, styles)
    # Clinical Interpretation removed from here, moved to end
    severity = report.get("severity_assessment")
    if severity:
        story.append(_section_heading("Severity Assessment (Cirrhosis)", styles))
        story.append(_info_box("TRANSPLANT EVALUATION RECOMMENDED" if severity.get("transplant_required") else "Medical Management Advised", _RED if severity.get("transplant_required") else _GREEN, _WHITE, styles))
        meld = severity.get("meld") or {}
        if severity.get("meld_score") is not None:
            story.append(Spacer(1, 4*mm)); story.append(Paragraph("<b>MELD Score Detail</b>", styles["body_bold"]))
            t = Table([["Score", str(severity.get("meld_score"))], ["Risk", meld.get("risk_level", "—")], ["Mortality", meld.get("mortality_90day", "—")]], colWidths=[40*mm, 140*mm])
            t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.5, _MID_GREY), ("BACKGROUND", (0,0), (0,-1), _LIGHT_TEAL)]))
            story.append(t)
        
        child_pugh = severity.get("child_pugh") or {}
        if child_pugh:
            story.append(Spacer(1, 4*mm))
            story.append(Paragraph("<b>Child-Pugh Score Detail</b>", styles["body_bold"]))
            cp_rows = [
                ["Score",           str(child_pugh.get("score", "—"))],
                ["Classification",  child_pugh.get("classification", "—")],
                ["Severity",        child_pugh.get("severity", "—")],
                ["1-Year Survival", child_pugh.get("survival_1yr", "—")],
                ["2-Year Survival", child_pugh.get("survival_2yr", "—")],
                ["Description",     child_pugh.get("description", "—")],
            ]
            t_cp = Table(cp_rows, colWidths=[40*mm, 140*mm])
            t_cp.setStyle(TableStyle([
                ("GRID", (0, 0), (-1, -1), 0.5, _MID_GREY),
                ("BACKGROUND", (0, 0), (0, -1), _LIGHT_TEAL),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
            ]))
            story.append(t_cp)
    story.append(_section_heading("Clinical Interpretation & Recommendation", styles))
    story.append(Paragraph(report.get("clinical_interpretation", ""), styles["body"]))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph(f"<b>Recommendation:</b> {report.get('final_recommendation', '')}", styles["body"]))
    story.append(Spacer(1, 10*mm)); story.append(HRFlowable(width="100%", thickness=0.5, color=_MID_GREY)); story.append(Paragraph(f"<i>Disclaimer: {report.get('medical_disclaimer', '')}</i>", styles["disclaimer"]))
    doc.build(story); return buffer.getvalue()