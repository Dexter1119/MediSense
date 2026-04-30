####################################################################
#
# File Name    : heart_service.py
# Description  : MediSense Heart — Core prediction service (NO Flask here)
#                Pipeline: KNNImputer → StandardScaler → XGBClassifier
# Author       : Pradhumnya Changdev Kalsait
# Date         : 20/01/26
#
####################################################################

import os
import joblib
import numpy as np
import io
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

# ── Model directory ────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
MODEL_DIR = os.path.join(
    BASE_DIR,
    "ml_models",
    "models_heartcsv"
)


MODEL_FILE   = os.path.join(MODEL_DIR, "best_model.pkl")   # XGBClassifier
IMPUTER_FILE = os.path.join(MODEL_DIR, "imputer.pkl")      # KNNImputer
SCALER_FILE  = os.path.join(MODEL_DIR, "scaler.pkl")       # StandardScaler


# ── Load all three artifacts once at import time ───────────────────
def _load(path, label):
    try:
        with open(path, "rb") as f:
            obj = joblib.load(f)
        print(f"[heart_service] SUCCESS: {label} loaded -> {path}")
        return obj
    except FileNotFoundError:
        print(f"[heart_service] ERROR: {label} NOT found at: {path}")
        return None
    except Exception as e:
        print(f"[heart_service] ERROR: {label} failed to load: {e}")
        return None


_model   = _load(MODEL_FILE,   "best_model")
_imputer = _load(IMPUTER_FILE, "imputer")
_scaler  = _load(SCALER_FILE,  "scaler")

# ── Load sub-models for consensus engine ──────────────────────────
SUB_MODEL_DIR = os.path.join(MODEL_DIR, "individual_models")
_sub_models = {
    "XGBoost":            _model,  # Primary
    "Random Forest":      _load(os.path.join(SUB_MODEL_DIR, "random_forest.pkl"),      "RF"),
    "AdaBoost":           _load(os.path.join(SUB_MODEL_DIR, "adaboost.pkl"),           "Ada"),
    "Gradient Boosting":  _load(os.path.join(SUB_MODEL_DIR, "gradient_boosting.pkl"),  "GB"),
    "Logistic Reg.":      _load(os.path.join(SUB_MODEL_DIR, "logistic_regression.pkl"), "LR"),
    "Decision Tree":      _load(os.path.join(SUB_MODEL_DIR, "decision_tree.pkl"),       "DT"),
    "K-Nearest (KNN)":    _load(os.path.join(SUB_MODEL_DIR, "knn.pkl"),                 "KNN"),
    "Gaussian NB":        _load(os.path.join(SUB_MODEL_DIR, "gaussian_nb.pkl"),        "GNB"),
    "SVM (SVC)":          _load(os.path.join(SUB_MODEL_DIR, "svm.pkl"),                 "SVM"),
    "Hard Voting":        _load(os.path.join(SUB_MODEL_DIR, "hard_voting.pkl"),        "HV"),
    "Soft Voting":        _load(os.path.join(SUB_MODEL_DIR, "soft_voting.pkl"),        "SV"),
    "Stacking":           _load(os.path.join(SUB_MODEL_DIR, "stacking.pkl"),           "Stack"),
}


# ── Feature order MUST match your training data column order ───────
FEATURE_ORDER = [
    "Age",
    "Gender",
    "Height(cm)",
    "Weight(kg)",
    "Systolic_Blood_Pressure",
    "Diastolic_Blood_Pressure",
    "Cholesterol",
    "Glucose",
    "Smoking",
    "Alcohol",
    "Physical_Activity",
]


"""
################################################################
#
# Function Name : predict_heart_disease
# Description   : Runs the full inference pipeline:
#                   1. Build feature array from input dict
#                   2. KNNImputer  (handles missing / NaN values)
#                   3. StandardScaler (normalise)
#                   4. XGBClassifier.predict + predict_proba
#                   5. Map prediction to structured result dict
# Author        : Pradhumnya Changdev Kalsait
# Date          : 20/01/26
# Prototype     : dict predict_heart_disease(dict input_data)
#
################################################################
"""

def predict_heart_disease(input_data: dict) -> dict:
    """
    Parameters
    ----------
    input_data : dict
        Keys from FEATURE_ORDER, values castable to float.

    Returns
    -------
    dict  {organ, disease, criticality, decision}
    On error: {"disease": "Error", "decision": "<message>"}
    """

    # ── Guard: all three artifacts must be loaded ──────────────────
    if _model is None:
        return {"disease": "Error", "decision": f"Model file not found: {MODEL_FILE}"}
    if _imputer is None:
        return {"disease": "Error", "decision": f"Imputer file not found: {IMPUTER_FILE}"}
    if _scaler is None:
        return {"disease": "Error", "decision": f"Scaler file not found: {SCALER_FILE}"}
    
    print("data at service = ",input_data)

    try:
        # ── 1. Build (1 x 11) feature array ───────────────────────
        features = np.array(
            [[input_data[f] for f in FEATURE_ORDER]],
            dtype=float
        )

        # ── 2. Preprocessing (Impute & Scale) ─────────────────────
        # Note: XGBoost handles NaNs natively, but if the training used 
        # an imputer and scaler, we MUST apply them during inference.
        if _imputer:
            features = _imputer.transform(features)
        if _scaler:
            features = _scaler.transform(features)

        # ── 3. Consensus Engine — Run all sub-models ──────────────
        model_results = []
        for name, m in _sub_models.items():
            if m is None: continue
            try:
                m_pred = int(m.predict(features)[0])
                m_label = "Cardiovascular Disease" if m_pred == 1 else "No Cardiovascular Disease"
                
                m_conf = 0
                if hasattr(m, "predict_proba"):
                    m_proba = m.predict_proba(features)[0]
                    m_conf = round(float(max(m_proba)) * 100, 2)
                
                model_results.append({
                    "model_name": name,
                    "prediction": m_label,
                    "confidence": m_conf,
                    "is_primary": name == "XGBoost"
                })
            except Exception as e:
                print(f"[heart_service] ⚠ Sub-model {name} failed: {e}")

        # Sort by confidence
        model_results = sorted(model_results, key=lambda x: x["confidence"], reverse=True)

        # ── 4. Primary Prediction (XGBoost) ───────────────────────
        prediction   = int(_model.predict(features)[0])
        proba        = _model.predict_proba(features)[0]
        prob_disease = float(proba[1])
        confidence   = round(float(max(proba)) * 100, 2)

        # ── 5. Map to result dict ──────────────────────────────────
        if prediction == 0:
            res_obj = {
                "organ":       "Heart",
                "disease":     "No Cardiovascular Disease",
                "criticality": "Low Risk",
                "decision":    "LIFESTYLE: Maintain a heart-healthy lifestyle with regular annual check-ups",
            }
        else:
            # Disease present — grade criticality from probability
            if prob_disease < 0.55:
                criticality = "Moderate Risk"
                decision    = "CONSULT: Schedule a cardiovascular review with your GP soon"
            elif prob_disease < 0.70:
                criticality = "High Risk"
                decision    = "REFERRAL: Request a full cardiac evaluation from a cardiologist"
            elif prob_disease < 0.85:
                criticality = "Critical Risk"
                decision    = "URGENT: See a cardiologist immediately — do not delay"
            else:
                criticality = "Critical Risk"
                decision    = "EMERGENCY: Seek urgent specialist care without delay"

            res_obj = {
                "organ":       "Heart",
                "disease":     "Cardiovascular Disease",
                "criticality": criticality,
                "decision":    decision,
            }

        # ── 6. Final Unified Response ──────────────────────────────
        res_obj.update({
            "confidence":          f"{confidence}%",
            "prob_disease":        prob_disease * 100,
            "model_results":       model_results,
            "loaded_models_count": len([m for m in _sub_models.values() if m is not None])
        })
        
        return res_obj

    except KeyError as e:
        return {"disease": "Error", "decision": f"Missing feature in input: {e}"}
    except Exception as e:
        return {"disease": "Error", "decision": f"Prediction failed: {str(e)}"}

# ====================================================================
# SECTION 4 — CLINICAL REPORT & PDF GENERATOR (MediSense Standard)
# ====================================================================

LAB_META = {
    "Age":                      {"name": "Patient Age",              "unit": "years", "low": 18,  "high": 65},
    "Systolic_Blood_Pressure":  {"name": "Systolic BP",              "unit": "mmHg",  "low": 90,  "high": 120},
    "Diastolic_Blood_Pressure": {"name": "Diastolic BP",             "unit": "mmHg",  "low": 60,  "high": 80},
    "Cholesterol":              {"name": "Total Cholesterol",        "unit": "Level", "low": 1,   "high": 1},
    "Glucose":                  {"name": "Fasting Glucose",          "unit": "Level", "low": 1,   "high": 1},
    "Height(cm)":               {"name": "Patient Height",           "unit": "cm",    "low": 140, "high": 220},
    "Weight(kg)":               {"name": "Patient Weight",           "unit": "kg",    "low": 45,  "high": 100},
}

CLINICAL_NOTES = {
    "Cardiovascular Disease": (
        "Positive screening for CVD. Indicators suggest potential atherosclerosis, "
        "hypertension-related strain, or lipid-driven vascular risk. Urgent "
        "cardiologist consultation and ECG/Echocardiogram are indicated."
    ),
    "No Cardiovascular Disease": (
        "No immediate cardiovascular indicators detected by the AI pipeline. "
        "Clinical values appear within manageable ranges. Maintain regular "
        "annual screenings and heart-healthy lifestyle habits."
    )
}

_NAVY       = colors.HexColor("#1B3A5C")
_TEAL       = colors.HexColor("#1A7A8A")
_LIGHT_TEAL = colors.HexColor("#E8F4F6")
_RED        = colors.HexColor("#C0392B")
_AMBER      = colors.HexColor("#E67E22")
_GREEN      = colors.HexColor("#27AE60")
_LIGHT_GREY = colors.HexColor("#F5F5F5")
_MID_GREY   = colors.HexColor("#CCCCCC")
_WHITE      = colors.white

def generate_report(input_data: dict, prediction: dict) -> dict:
    """Structures data for the PDF generator."""
    
    # 1. Build Lab Table
    lab_table = []
    for key, meta in LAB_META.items():
        val = input_data.get(key)
        status = "Normal"
        if val is not None:
            if val > meta["high"]: status = "Elevated"
            if val < meta["low"]:  status = "Low"
        
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
            "system": "MediSense Heart — AI Diagnostic Pipeline v2.0",
        },
        "patient_information": {
            "age": input_data.get("Age"),
            "gender": "Male" if input_data.get("Gender") == 2 else "Female",
        },
        "laboratory_values": lab_table,
        "ai_diagnosis": {
            "primary_diagnosis": disease,
            "confidence": prediction.get("confidence"),
            "risk_level": prediction.get("criticality"),
        },
        "model_confidence": {
            "model_results": prediction.get("model_results", []),
        },
        "clinical_interpretation": CLINICAL_NOTES.get(disease, "Evaluation required."),
        "final_recommendation": prediction.get("decision"),
        "medical_disclaimer": (
            "This AI-generated report is a decision support tool and not a clinical diagnosis. "
            "Findings must be reviewed by a board-certified cardiologist."
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
            name="subtitle", fontSize=9, textColor=_WHITE, alignment=TA_CENTER,
            spaceAfter=0, fontName="Helvetica"
        ),
        "section_heading": ParagraphStyle(
            name="section_heading", fontSize=11, textColor=_TEAL, fontName="Helvetica-Bold",
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
        [Paragraph("MediSense Heart", styles["title"])],
        [Paragraph("Clinical Cardiovascular Decision Support Report", styles["subtitle"])],
        [Paragraph(f"Generated: {report['report_metadata']['generated_at']}", styles["subtitle"])]
    ]
    t = Table(header_data, colWidths=[180*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), _NAVY),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(t)
    story.append(Spacer(1, 6*mm))

    # 2. Result Summary
    story.append(Paragraph("AI DIAGNOSTIC SUMMARY", styles["section_heading"]))
    story.append(HRFlowable(width="100%", thickness=1, color=_TEAL, spaceAfter=4))
    
    diag = report["ai_diagnosis"]
    is_high = diag["risk_level"] != "Low Risk"
    
    summary_data = [
        [Paragraph("<b>Condition Status:</b>", styles["body"]), Paragraph(diag["primary_diagnosis"], styles["body"])],
        [Paragraph("<b>Risk Classification:</b>", styles["body"]), Paragraph(diag["risk_level"], styles["body"])],
        [Paragraph("<b>System Confidence:</b>", styles["body"]), Paragraph(diag["confidence"], styles["body"])]
    ]
    t = Table(summary_data, colWidths=[50*mm, 130*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), _LIGHT_TEAL),
        ("GRID", (0, 0), (-1, -1), 0.5, _MID_GREY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 6*mm))

    # 3. Lab Values
    story.append(Paragraph("CLINICAL LABORATORY ANALYSIS", styles["section_heading"]))
    story.append(HRFlowable(width="100%", thickness=1, color=_TEAL, spaceAfter=4))
    
    rows = [[Paragraph("<b>Parameter</b>", styles["body_bold_white"]), 
             Paragraph("<b>Observed</b>", styles["body_bold_white"]), 
             Paragraph("<b>Unit</b>", styles["body_bold_white"]), 
             Paragraph("<b>Reference</b>", styles["body_bold_white"]), 
             Paragraph("<b>Status</b>", styles["body_bold_white"])]]
    
    for item in report["laboratory_values"]:
        status_color = _RED if item["status"] != "Normal" else _GREEN
        rows.append([
            item["name"],
            str(item["value"]),
            item["unit"],
            f"{item['low']} - {item['high']}",
            Paragraph(f"<b>{item['status']}</b>", ParagraphStyle("stat_colored", textColor=status_color, fontSize=9, alignment=TA_CENTER))
        ])

    t = Table(rows, colWidths=[50*mm, 30*mm, 30*mm, 40*mm, 30*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), _NAVY),
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
    story.append(HRFlowable(width="100%", thickness=1, color=_TEAL, spaceAfter=4))
    
    models = report["model_confidence"]["model_results"]
    if models:
        c_rows = [[Paragraph("<b>Sub-Model</b>", styles["body_bold_white"]), 
                   Paragraph("<b>Prediction</b>", styles["body_bold_white"]), 
                   Paragraph("<b>Certainty</b>", styles["body_bold_white"])]]
        for m in models:
            name = f"<b>{m['model_name']}</b> (Primary)" if m.get("is_primary") else m["model_name"]
            c_rows.append([Paragraph(name, styles["body"]), m["prediction"], f"{m['confidence']}%"])
        
        t = Table(c_rows, colWidths=[80*mm, 60*mm, 40*mm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), _NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), _WHITE),
            ("GRID", (0, 0), (-1, -1), 0.5, _MID_GREY),
            ("PADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(t)
    
    story.append(Spacer(1, 6*mm))

    # 5. Clinical Interpretation & Recommendation
    story.append(Paragraph("CLINICAL INTERPRETATION & RECOMMENDATION", styles["section_heading"]))
    story.append(HRFlowable(width="100%", thickness=1, color=_TEAL, spaceAfter=4))
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