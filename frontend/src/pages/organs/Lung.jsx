////////////////////////////////////////////////////////////////////
//
// File Name : Lung.jsx
// Description : COPD Two-Stage AI — Medical Dashboard
//               Premium header banner + Backend PDF report
////////////////////////////////////////////////////////////////////

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud, Loader2, Info, ChevronRight, ChevronDown, ChevronUp,
  Activity, Download, AlertTriangle, CheckCircle2,
  Wind, FileBarChart2, Stethoscope, Trophy, BarChart3,
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import Navbar from "../../components/Navbar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ─────────────────────────────────────────────
   GLOBAL STYLES — matches Kidney.jsx pattern
───────────────────────────────────────────── */
const GLOBAL_CSS = `
  :root {
    --l-bg:      #f0fdfa;
    --l-surface: #ffffff;
    --l-accent:  #06b6d4;
    --l-primary: #0d9488;
    --l-border:  #ccfbf1;
    --l-text:    #0f172a;
    --l-muted:   #64748b;
  }
  .ld-root {
    background: var(--l-bg);
    min-height: 100vh;
    padding-bottom: 80px;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .ld-container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 20px;
  }
  .ld-header-banner {
    background: linear-gradient(135deg, #042f2e 0%, #0d3349 100%);
    padding: 40px 0;
    margin-bottom: 40px;
    color: white;
    text-align: center;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  .ld-logo {
    font-size: 2.2rem;
    font-weight: 800;
    letter-spacing: -1px;
    margin-bottom: 8px;
  }
  .ld-logo span { color: #2dd4bf; }
  .ld-tagline {
    font-size: 0.75rem;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--l-muted);
    opacity: 0.8;
  }
`;


/* ═══════════════════════════════════════════════════════════════
   CLINICAL FIELD META  (GOLD 2024 + Kaggle dataset reference)
═══════════════════════════════════════════════════════════════ */
const FIELD_META = {
  "mMRC": {
    level: "critical",
    label: "mMRC Dyspnea Scale",
    type: "select",
    options: [
      { label: "0 — Breathless only with strenuous exercise", value: 0 },
      { label: "1 — Short of breath hurrying / slight incline", value: 1 },
      { label: "2 — Walks slower than peers / stops on flat", value: 2 },
      { label: "3 — Stops after ~100 m or few minutes walking", value: 3 },
      { label: "4 — Too breathless to leave house / dressing", value: 4 },
    ],
    tooltip: {
      why: "Primary dyspnea severity score. mMRC ≥ 2 = high symptom burden (GOLD Groups B/E).",
      normal: "0–1 (low burden)",
      alert: "≥ 2 = high burden; ≥ 3 = severe disability",
      ref: "GOLD 2024, Table 2.5",
    },
    range: "0 – 4",
  },
  "Respiratory Rate": {
    level: "critical",
    label: "Respiratory Rate",
    type: "number", min: 8, max: 60, step: 1, unit: "br/min",
    tooltip: {
      why: "Tachypnoea (> 30 br/min) is the primary marker of acute respiratory failure.",
      normal: "12–20 br/min",
      alert: "> 30 br/min = severe exacerbation → consider ICU / NIV",
      ref: "GOLD 2024, §5.3",
    },
    range: "12–20 br/min",
  },
  "Oxygen Saturation": {
    level: "critical",
    label: "SpO₂",
    type: "number", min: 70, max: 100, step: 0.5, unit: "%",
    tooltip: {
      why: "Guides O₂ therapy. COPD target 88–92 % to avoid hypercapnia.",
      normal: "88–92 % (COPD)  /  > 94 % general population",
      alert: "< 88 % = O₂ indicated;  < 85 % = acute respiratory failure",
      ref: "GOLD 2024, §5.3",
    },
    range: "88–92 % (COPD)",
  },
  "Temperature": {
    level: "key",
    label: "Body Temperature",
    type: "number", min: 35, max: 42, step: 0.1, unit: "°C",
    tooltip: {
      why: "Fever indicates infective exacerbation (bacterial / viral trigger).",
      normal: "36.1–37.2 °C",
      alert: "> 38.0 °C = suspected infection → antibiotic course",
      ref: "GOLD 2024, §5.1",
    },
    range: "36.1–37.2 °C",
  },
  "working place": {
    level: "key",
    label: "Workplace Exposure",
    type: "select",
    options: [
      { label: "Industrial / High Dust / Fumes", value: 1 },
      { label: "Non-Industrial", value: 0 },
    ],
    tooltip: {
      why: "Occupational dust, fumes & chemicals account for ~15 % of COPD cases.",
      normal: "Non-industrial",
      alert: "Industrial → accelerated FEV₁ decline",
      ref: "GOLD 2024, §1.3",
    },
    range: "Industrial / Non-Industrial",
  },
  "Heart Rate": {
    level: "key",
    label: "Heart Rate",
    type: "number", min: 30, max: 200, step: 1, unit: "bpm",
    tooltip: {
      why: "Tachycardia may reflect hypoxaemia, active infection, or cor pulmonale.",
      normal: "60–100 bpm",
      alert: "> 110 bpm at rest = cardiorespiratory stress",
      ref: "GOLD 2024, §5.1",
    },
    range: "60–100 bpm",
  },
  "Blood pressure": {
    level: "key",
    label: "Systolic BP",
    type: "number", min: 60, max: 220, step: 1, unit: "mmHg",
    tooltip: {
      why: "Hypertension is a leading COPD comorbidity; hypotension may signal sepsis.",
      normal: "90–139 mmHg",
      alert: "< 90 = circulatory collapse;  > 180 = hypertensive urgency",
      ref: "GOLD 2024, §5.6",
    },
    range: "90–139 mmHg",
  },
  "Age": {
    level: "supporting",
    label: "Age",
    type: "number", min: 18, max: 100, step: 1, unit: "yrs",
    tooltip: {
      why: "COPD risk rises after 40; most diagnoses after 50.",
      normal: "18–100",
      alert: "> 65 = higher exacerbation & mortality risk",
      ref: "GOLD 2024, §1.3",
    },
    range: "18–100 yrs",
  },
  "BMI, kg/m2": {
    level: "supporting",
    label: "BMI",
    type: "number", min: 10, max: 60, step: 0.1, unit: "kg/m²",
    tooltip: {
      why: "Low BMI (< 21) independently predicts worse outcomes and higher mortality.",
      normal: "18.5–24.9 kg/m²",
      alert: "< 21 = nutritional risk;  > 30 = reduced exercise capacity",
      ref: "GOLD 2024, §4.2",
    },
    range: "18.5–24.9 kg/m²",
  },
  "Pack History": {
    level: "supporting",
    label: "Pack-Year History",
    type: "number", min: 0, max: 200, step: 0.5, unit: "pack-yrs",
    tooltip: {
      why: "1 pack-year = 20 cigarettes/day × 1 year.  Cumulative tobacco exposure.",
      normal: "0",
      alert: "> 10 = significant risk;  > 30 = high COPD probability",
      ref: "GOLD 2024, §1.3",
    },
    range: "0 pack-yrs (ideal)",
  },
  "status of smoking": {
    level: "supporting",
    label: "Smoking Status",
    type: "select",
    options: [
      { label: "Current Smoker", value: 1 },
      { label: "Non-Smoker / Ex-Smoker", value: 0 },
    ],
    tooltip: {
      why: "Smoking is the #1 modifiable risk factor. Cessation slows FEV₁ decline.",
      normal: "Non-smoker",
      alert: "Active smoker ≈ 50 mL/yr additional FEV₁ loss",
      ref: "GOLD 2024, §3.1",
    },
    range: "Current / Non-Smoker",
  },
  "Gender": {
    level: "supporting",
    label: "Gender",
    type: "select",
    options: [{ label: "Male", value: 1 }, { label: "Female", value: 0 }],
    tooltip: {
      why: "Historically higher male prevalence; female rates rising due to biomass smoke.",
      normal: "—",
      alert: "Females may be under-diagnosed despite equal severity",
      ref: "GOLD 2024, §1.3",
    },
    range: "Male / Female",
  },
  "Depression": {
    level: "supporting",
    label: "Depression",
    type: "select",
    options: [{ label: "Yes", value: 1 }, { label: "No", value: 0 }],
    tooltip: {
      why: "Co-occurs in 25–42 % of COPD patients. Amplifies dyspnea, reduces adherence.",
      normal: "Absent",
      alert: "Present → screen with PHQ-9",
      ref: "GOLD 2024, §5.6",
    },
    range: "Yes / No",
  },
  "History of Heart Failure": {
    level: "supporting",
    label: "Hx of Heart Failure",
    type: "select",
    options: [{ label: "Yes", value: 1 }, { label: "No", value: 0 }],
    tooltip: {
      why: "Cardiac comorbidity worsens dyspnea and complicates COPD treatment.",
      normal: "Absent",
      alert: "Present → screen for cor pulmonale; consider diuretics",
      ref: "GOLD 2024, §5.6",
    },
    range: "Yes / No",
  },
  "Sputum": {
    level: "supporting",
    label: "Sputum Production",
    type: "select",
    options: [
      { label: "Yes (purulent / increased)", value: 1 },
      { label: "No", value: 0 },
    ],
    tooltip: {
      why: "Purulent sputum = Anthonisen Criterion 3 → antibiotic therapy indicated.",
      normal: "None or minimal",
      alert: "Purulent → 5–7 day antibiotic course",
      ref: "GOLD 2024, §5.2",
    },
    range: "Yes / No",
  },
  "Vaccination": {
    level: "supporting",
    label: "Influenza Vaccination",
    type: "select",
    options: [{ label: "Vaccinated", value: 1 }, { label: "Not Vaccinated", value: 0 }],
    tooltip: {
      why: "Influenza vaccination reduces serious illness and hospitalisation.",
      normal: "Vaccinated (Evidence B)",
      alert: "Unvaccinated → higher exacerbation & mortality risk",
      ref: "GOLD 2024, Table 3.2",
    },
    range: "Vaccinated / Not Vaccinated",
  },
  "Dependent": {
    level: "supporting",
    label: "Functional Dependence",
    type: "select",
    options: [
      { label: "Dependent (ADL assist needed)", value: 1 },
      { label: "Independent", value: 0 },
    ],
    tooltip: {
      why: "Functional dependence marks advanced disease and frailty syndrome.",
      normal: "Independent",
      alert: "Dependent → consider pulmonary rehab & social support",
      ref: "Dataset: functional assessment",
    },
    range: "Dependent / Independent",
  },
  "Height/m": {
    level: "supporting",
    label: "Height",
    type: "number", min: 1.2, max: 2.2, step: 0.01, unit: "m",
    tooltip: {
      why: "Anthropometric reference. Shorter stature correlates with reduced lung volumes.",
      normal: "1.50–1.90 m",
      alert: "—",
      ref: "Dataset: anthropometric variable",
    },
    range: "1.50–1.90 m",
  },
};

/* ═══════════════════════════════════════════════════
   DEFAULT VALUES — Supporting fields with safe baselines
   (same pattern as Kidney.jsx DEFAULT_VALUES)
═══════════════════════════════════════════════════ */
const DEFAULT_VALUES = {
  "BMI, kg/m2": 22.0,   // mid-range healthy BMI (18.5–24.9)
  "Pack History": 0,      // zero tobacco exposure
  "status of smoking": 0,      // non-smoker / ex-smoker
  "Depression": 0,      // absent
  "History of Heart Failure": 0,      // absent
  "Sputum": 0,      // no purulent sputum
  "Vaccination": 1,      // vaccinated (optimistic baseline)
  "Dependent": 0,      // functionally independent
  "Height/m": 1.70,   // average adult height
};

/* Fields that are required even though they are "supporting" level */
const REQUIRED_SUPPORTING = new Set(["Age", "Gender"]);

/* ═══════════════════════════════════════════════════
   LEVEL → VISUAL CONFIG
═══════════════════════════════════════════════════ */
const LEVEL_CFG = {
  critical: {
    strip: "bg-red-500",
    ring: "ring-red-200 focus-within:ring-red-400",
    inputBg: "bg-red-50",
    dot: "bg-red-400",
    tagBg: "bg-red-50 text-red-700 border-red-200",
    headerTxt: "text-red-600",
    headerBg: "bg-red-50 border-red-100",
    label: "Critical",
  },
  key: {
    strip: "bg-amber-400",
    ring: "ring-amber-200 focus-within:ring-amber-400",
    inputBg: "bg-amber-50",
    dot: "bg-amber-400",
    tagBg: "bg-amber-50 text-amber-700 border-amber-200",
    headerTxt: "text-amber-700",
    headerBg: "bg-amber-50 border-amber-100",
    label: "Key",
  },
  supporting: {
    strip: "bg-blue-500",
    ring: "ring-blue-200 focus-within:ring-blue-400",
    inputBg: "bg-blue-50",
    dot: "bg-blue-400",
    tagBg: "bg-blue-50 text-blue-700 border-blue-100",
    headerTxt: "text-blue-700",
    headerBg: "bg-blue-50 border-blue-100",
    label: "Supporting",
  },
};

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
const safeParseFloat = (str) => {
  const t = String(str).trim();
  if (!t) return undefined;
  const n = parseFloat(t);
  return isNaN(n) ? undefined : n;
};

const fmt = (v) => {
  const n = Number(v);
  return isNaN(n) ? "—" : (n * 100).toFixed(1);
};

const riskOf = (confidence) => {
  const c = Number(confidence);
  if (c > 0.75) return {
    color: "text-red-600",
    barBg: "bg-red-500",
    badgeBg: "bg-red-50 text-red-700 border-red-200",
    strip: "bg-red-500",
    label: "High Risk",
    sub: "Immediate Clinical Attention Recommended",
  };
  if (c > 0.5) return {
    color: "text-amber-600",
    barBg: "bg-amber-400",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    strip: "bg-amber-400",
    label: "Moderate Risk",
    sub: "Medical Evaluation Suggested",
  };
  return {
    color: "text-emerald-600",
    barBg: "bg-emerald-500",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    strip: "bg-emerald-500",
    label: "Low Risk",
    sub: "Routine Monitoring Recommended",
  };
};

/* GOLD-stage-based colour map — 1=green, 2=amber, 3=orange, 4=red */
const goldRisk = (goldStage) => {
  const map = {
    1: {
      color: "text-emerald-600",
      barBg: "bg-emerald-500",
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      strip: "bg-emerald-500",
      label: "GOLD 1 — Mild",
      sub: "Lifestyle Modification Recommended",
    },
    2: {
      color: "text-amber-600",
      barBg: "bg-amber-400",
      badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
      strip: "bg-amber-400",
      label: "GOLD 2 — Moderate",
      sub: "Pulmonary Rehabilitation Advised",
    },
    3: {
      color: "text-orange-600",
      barBg: "bg-orange-500",
      badgeBg: "bg-orange-50 text-orange-700 border-orange-200",
      strip: "bg-orange-500",
      label: "GOLD 3 — Severe",
      sub: "Specialist Referral Required",
    },
    4: {
      color: "text-red-600",
      barBg: "bg-red-500",
      badgeBg: "bg-red-50 text-red-700 border-red-200",
      strip: "bg-red-500",
      label: "GOLD 4 — Very Severe",
      sub: "Immediate Clinical Attention Required",
    },
  };
  return map[goldStage] || {
    color: "text-slate-600",
    barBg: "bg-slate-400",
    badgeBg: "bg-slate-50 text-slate-700 border-slate-200",
    strip: "bg-slate-400",
    label: "Unknown",
    sub: "Assessment Required",
  };
};

/* helper to get a readable label for select fields from numeric value */
const getSelectLabel = (fieldName, value) => {
  const meta = FIELD_META[fieldName];
  if (!meta || meta.type !== "select") return value !== undefined ? String(value) : "N/A";
  const found = meta.options?.find((o) => String(o.value) === String(value));
  return found ? found.label : (value !== undefined ? String(value) : "N/A");
};

/* ═══════════════════════════════════════════════════
   PDF GENERATION  (mirrors Kidney.jsx structure)
═══════════════════════════════════════════════════ */
function generatePDF(clinicalData, stage1Result, stage2Result) {
  const doc = new jsPDF();

  const primary = [13, 148, 136];   // teal-600 — lung theme
  const lightGray = [240, 240, 240];
  const dark = [40, 40, 40];

  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;

  // ── HEADER (reusable, called on every new page) ──
  const addHeader = () => {
    doc.setFillColor(...primary);
    doc.rect(0, 0, pageWidth, 25, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("MediSense Lung — Diagnostic Report", 14, 15);

    doc.setFontSize(9);
    doc.text("AI-Powered COPD Two-Stage Prediction System · GOLD 2024 · MediSense", 14, 21);

    doc.setTextColor(...dark);
  };

  // ── FOOTER ──
  const addFooter = () => {
    doc.setDrawColor(200);
    doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);

    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      "Disclaimer: This report is AI-generated and should not be considered a medical diagnosis.",
      14,
      pageHeight - 10
    );
    doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - 30, pageHeight - 5);
  };

  // ── PAGE 1 HEADER ──
  addHeader();

  // ── GENERAL INFORMATION ──
  let y = 35;

  doc.setFontSize(12);
  doc.setTextColor(...primary);
  doc.text("General Information", 14, y);
  doc.setDrawColor(...primary);
  doc.line(14, y + 2, pageWidth - 14, y + 2);

  doc.setTextColor(...dark);
  doc.setFontSize(10);

  y += 10;
  doc.text(`Date        : ${new Date().toLocaleDateString()}`, 14, y);
  y += 6;
  doc.text(`Report Type : COPD AI Two-Stage Prediction`, 14, y);
  y += 6;
  doc.text(`Pipeline    : Stage 1 (Breath Acoustics) → Stage 2 (Clinical Severity)`, 14, y);

  // ── STAGE 1 RESULT SUMMARY BOX ──
  y += 12;
  doc.setFontSize(12);
  doc.setTextColor(...primary);
  doc.text("Stage 1 — Breath Acoustics Screening", 14, y);
  doc.line(14, y + 2, pageWidth - 14, y + 2);

  y += 8;
  if (stage1Result) {
    doc.setDrawColor(...primary);
    doc.rect(14, y, pageWidth - 28, 28);

    doc.setFontSize(10);
    doc.setTextColor(...dark);
    doc.text(`Prediction  : ${stage1Result.prediction ?? "N/A"}`, 18, y + 8);
    doc.text(`Confidence  : ${fmt(stage1Result.confidence)}%`, 18, y + 15);

    if (stage1Result.probabilities) {
      const entries = Object.entries(stage1Result.probabilities);
      const probStr = entries.map(([k, v]) => `${k}: ${fmt(v.probability)}%`).join("   |   ");
      doc.setFontSize(10);
      doc.setTextColor(...dark);
      doc.text(`Probabilities : ${probStr}`, 18, y + 22);
    }

    y += 36;
  } else {
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text("Stage 1 result not available.", 18, y + 6);
    y += 18;
  }

  // ── CLINICAL PARAMETERS TABLE ──
  doc.setFontSize(12);
  doc.setTextColor(...primary);
  doc.text("Stage 2 — Clinical Parameters", 14, y);

  const grouped = {
    critical: Object.keys(FIELD_META).filter((k) => FIELD_META[k].level === "critical"),
    key: Object.keys(FIELD_META).filter((k) => FIELD_META[k].level === "key"),
    supporting: Object.keys(FIELD_META).filter((k) => FIELD_META[k].level === "supporting"),
  };

  // Build rows grouped by level with section separators
  const tableBody = [];

  const LEVEL_ROWS = [
    { key: "critical", header: "🔴 CRITICAL PARAMETERS", color: [239, 68, 68] },
    { key: "key", header: "🟡 KEY PARAMETERS", color: [245, 158, 11] },
    { key: "supporting", header: "🔵 SUPPORTING PARAMETERS", color: [59, 130, 246] },
  ];

  for (const { key, header, color } of LEVEL_ROWS) {
    tableBody.push([{ content: header, colSpan: 3, styles: { fillColor: color, textColor: 255, fontStyle: "bold", fontSize: 8 } }]);
    for (const fieldKey of grouped[key]) {
      const meta = FIELD_META[fieldKey];
      const rawVal = clinicalData[fieldKey];
      const displayed = meta.type === "select"
        ? getSelectLabel(fieldKey, rawVal)
        : (rawVal !== undefined && rawVal !== null ? String(rawVal) + (meta.unit ? ` ${meta.unit}` : "") : "N/A");

      tableBody.push([
        meta.label,
        displayed || "N/A",
        meta.range || "—",
      ]);
    }
  }

  autoTable(doc, {
    startY: y + 4,
    head: [["Parameter", "Observed Value", "Normal Range"]],
    body: tableBody,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: primary, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: lightGray },
    didDrawPage: () => { addHeader(); },
  });

  let finalY = doc.lastAutoTable.finalY + 10;

  // ── PAGE BREAK HELPER ──
  const checkPageBreak = (needed) => {
    if (finalY + needed > pageHeight - 20) {
      doc.addPage();
      addHeader();
      finalY = 35;
    }
  };

  // ── STAGE 2 PREDICTION SUMMARY BOX ──
  checkPageBreak(55);

  doc.setDrawColor(...primary);
  doc.rect(14, finalY, pageWidth - 28, 50);

  doc.setFontSize(12);
  doc.setTextColor(...primary);
  doc.text("Stage 2 — AI Severity Prediction Summary", 18, finalY + 9);

  doc.setFontSize(10);
  doc.setTextColor(...dark);

  if (stage2Result) {
    doc.text(`GOLD Stage   : GOLD ${stage2Result.gold_stage ?? "N/A"}`, 18, finalY + 18);
    doc.text(`Risk Level   : ${stage2Result.gold_stage
      ? (Number(stage2Result.gold_stage) >= 3 ? "High Risk" : Number(stage2Result.gold_stage) === 2 ? "Moderate Risk" : "Low Risk")
      : "N/A"}`, 18, finalY + 25);
    doc.text(`Confidence   : ${fmt(stage2Result.confidence)}%`, 18, finalY + 32);

    if (stage2Result.probabilities) {
      const entries = Object.entries(stage2Result.probabilities);
      const probStr = entries.map(([k, v]) => `${k}: ${fmt(v.probability)}%`).join("   |   ");
      doc.setFontSize(10);
      doc.setTextColor(...dark);
      doc.text(`Probabilities : ${probStr}`, 18, finalY + 41);
    }
  } else {
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text("Stage 2 result not available (COPD not detected in Stage 1).", 18, finalY + 22);
  }

  finalY += 60;

  // ── MODEL CONSENSUS TABLE (Stage 1 + Stage 2) ──
  const allModelConfs = [
    ...(stage1Result?.model_confidences || []).map((m) => ({ ...m, stage: "S1" })),
    ...(stage2Result?.model_confidences || []).map((m) => ({ ...m, stage: "S2" })),
  ];

  if (allModelConfs.length > 0) {
    checkPageBreak(50);
    doc.setFontSize(12);
    doc.setTextColor(...primary);
    doc.text("Model Confidence Consensus", 14, finalY);
    doc.line(14, finalY + 2, pageWidth - 14, finalY + 2);

    const consensusRows = allModelConfs.map((m) => [
      m.stage,
      (m.is_primary ? "\u2605 " : "") + m.model_name,
      m.error ? "Error" : m.prediction,
      m.confidence != null ? `${(m.confidence * 100).toFixed(1)}%` : "N/A",
    ]);

    autoTable(doc, {
      startY: finalY + 4,
      margin: { top: 35 },
      head: [["Stage", "Model", "Prediction", "Confidence"]],
      body: consensusRows,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: primary, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: lightGray },
      didDrawPage: () => { addHeader(); },
      didParseCell: (data) => {
        if (data.section === "body" && data.cell.raw && typeof data.cell.raw === "string" && data.cell.raw.startsWith("\u2605")) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = [67, 56, 202];
        }
      },
    });

    finalY = doc.lastAutoTable.finalY + 10;
  }

  // ── CLINICAL INTERPRETATION NOTES ──
  checkPageBreak(40);

  doc.setFontSize(11);
  doc.setTextColor(...primary);
  //doc.text("Clinical Interpretation Notes", 14, finalY);
  doc.line(14, finalY + 2, pageWidth - 14, finalY + 2);

  doc.setFontSize(9);
  doc.setTextColor(80);

  const notes = [
    "• mMRC ≥ 2 indicates high symptom burden — GOLD Groups B/E classification applies.",
    "• SpO₂ < 88% → supplemental oxygen therapy indicated (GOLD 2024, §5.3).",
    "• Respiratory Rate > 30 br/min → consider ICU evaluation / non-invasive ventilation.",
    "• Purulent sputum → Anthonisen criterion met → 5–7 day antibiotic course recommended.",
    "• Low BMI (< 21 kg/m²) independently predicts increased mortality in COPD.",
    "• Influenza vaccination reduces hospitalization risk (Evidence B, GOLD 2024).",
  ];

  finalY += 8;
  // for (const note of notes) {
  //   checkPageBreak(8);
  //   doc.text(note, 18, finalY);
  //   finalY += 7;
  // }

  // ── FOOTERS ON ALL PAGES ──
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter();
  }

  doc.save("MediSense_Lung_COPD_Report.pdf");
}

/* ═══════════════════════════════════════════════════
   STAGE 1 STANDALONE PDF  — per-class clinical advice
═══════════════════════════════════════════════════ */
const STAGE1_ADVICE = {
  COPD: {
    title: "COPD Signal Detected",
    risk: "High",
    color: [239, 68, 68],
    notes: [
      "• COPD pattern identified via breath acoustics analysis.",
      "• Proceed to Stage 2 Clinical Severity Assessment for GOLD staging.",
      "• Recommend confirmatory spirometry (FEV₁/FVC < 0.70 post-bronchodilator).",
      "• Assess exacerbation history and symptom burden (mMRC / CAT score).",
      "• If confirmed, initiate bronchodilator therapy per GOLD 2024 guidelines.",
      "• Annual influenza and pneumococcal vaccination recommended.",
    ],
  },
  SMOKERS: {
    title: "Active Smoker Pattern Detected",
    risk: "Moderate — At Risk for COPD",
    color: [245, 158, 11],
    notes: [
      "• Breath acoustics indicate active smoking pattern.",
      "• Smoking is the #1 modifiable risk factor for COPD (GOLD 2024, §1.3).",
      "• Active smokers lose ~50 mL/yr additional FEV₁ vs non-smokers.",
      "• 15–20% of smokers develop clinically significant COPD.",
      "• Smoking cessation is the single most effective intervention to slow disease.",
      "• Recommend: annual spirometry screening for early COPD detection.",
      "• Consider nicotine replacement therapy (NRT), varenicline, or bupropion.",
      "• Counsel on second-hand smoke risks to household members.",
    ],
  },
  CONTROL: {
    title: "Normal Breath Pattern — No COPD Indicators",
    risk: "Low",
    color: [16, 185, 129],
    notes: [
      "• Breath acoustics are within normal healthy range.",
      "• No COPD or smoking-related patterns detected.",
      "• Continue routine health monitoring and annual check-ups.",
      "• Maintain regular physical activity (≥ 150 min/week moderate exercise).",
      "• Avoid occupational dust, fumes, and indoor biomass smoke exposure.",
      "• Influenza vaccination recommended for general population health.",
    ],
  },
  AIR: {
    title: "Ambient Air / Reference Sample Detected",
    risk: "N/A — Non-Biological Sample",
    color: [100, 116, 139],
    notes: [
      "• The uploaded sample appears to be ambient/environmental air.",
      "• No biological respiratory pattern was identified.",
      "• This classification serves as a baseline/reference reading.",
      "• Please upload a patient breath sample for clinical analysis.",
      "• Ensure proper e-nose sampling protocol is followed.",
    ],
  },
};

function generateStage1PDF(stage1Result) {
  const doc = new jsPDF();

  const prediction = stage1Result.prediction || "CONTROL";
  const advice = STAGE1_ADVICE[prediction] || STAGE1_ADVICE.CONTROL;

  const primary = advice.color;
  const lightGray = [240, 240, 240];
  const dark = [40, 40, 40];

  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;

  // ── HEADER ──
  const addHeader = () => {
    doc.setFillColor(...primary);
    doc.rect(0, 0, pageWidth, 25, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("MediSense Lung — Stage 1 Screening Report", 14, 15);
    doc.setFontSize(9);
    doc.text("AI-Powered Breath Acoustics Analysis · MediSense", 14, 21);
    doc.setTextColor(...dark);
  };

  // ── FOOTER ──
  const addFooter = () => {
    doc.setDrawColor(200);
    doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      "Disclaimer: This report is AI-generated and should not be considered a medical diagnosis.",
      14, pageHeight - 10
    );
    doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - 30, pageHeight - 5);
  };

  addHeader();

  // ── GENERAL INFORMATION ──
  let y = 35;
  doc.setFontSize(12);
  doc.setTextColor(...primary);
  doc.text("General Information", 14, y);
  doc.setDrawColor(...primary);
  doc.line(14, y + 2, pageWidth - 14, y + 2);

  doc.setTextColor(...dark);
  doc.setFontSize(10);
  y += 10;
  doc.text(`Date        : ${new Date().toLocaleDateString()}`, 14, y);
  y += 6;
  doc.text(`Report Type : Breath Acoustics Screening (Stage 1 Only)`, 14, y);
  y += 6;
  doc.text(`Pipeline    : E-Nose Feature Extraction → ExtraTrees Classification`, 14, y);

  // ── PREDICTION SUMMARY BOX ──
  y += 14;
  doc.setFontSize(12);
  doc.setTextColor(...primary);
  doc.text("AI Screening Result", 14, y);
  doc.line(14, y + 2, pageWidth - 14, y + 2);

  y += 8;
  doc.setDrawColor(...primary);
  doc.rect(14, y, pageWidth - 28, 32);

  doc.setFontSize(11);
  doc.setTextColor(...dark);
  doc.text(`Classification : ${prediction}`, 18, y + 9);
  doc.text(`Confidence     : ${fmt(stage1Result.confidence)}%`, 18, y + 17);
  doc.text(`Risk Level     : ${advice.risk}`, 18, y + 25);

  y += 40;

  // ── PROBABILITY BREAKDOWN TABLE ──
  if (stage1Result.probabilities) {
    doc.setFontSize(12);
    doc.setTextColor(...primary);
    doc.text("Class Probability Breakdown", 14, y);

    const probRows = Object.entries(stage1Result.probabilities).map(([k, v]) => [
      k,
      `${(Number(v.probability) * 100).toFixed(2)}%`,
      v.tooltip || "—",
    ]);

    autoTable(doc, {
      startY: y + 4,
      head: [["Class", "Probability", "Interpretation"]],
      body: probRows,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: primary, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: lightGray },
      didDrawPage: () => { addHeader(); },
    });

    y = doc.lastAutoTable.finalY + 12;
  }

  // ── PAGE BREAK CHECK ──
  const checkPageBreak = (needed) => {
    if (y + needed > pageHeight - 20) {
      doc.addPage();
      addHeader();
      y = 35;
    }
  };

  // ── CLINICAL ADVICE ──
  checkPageBreak(60);

  doc.setFontSize(12);
  doc.setTextColor(...primary);
  doc.text(`Clinical Interpretation — ${advice.title}`, 14, y);
  doc.setDrawColor(...primary);
  doc.line(14, y + 2, pageWidth - 14, y + 2);

  y += 10;
  doc.setFontSize(9);
  doc.setTextColor(...dark);

  for (const note of advice.notes) {
    checkPageBreak(8);
    doc.text(note, 18, y);
    y += 7;
  }

  // ── MODEL CONSENSUS TABLE ──
  if (stage1Result.model_confidences && stage1Result.model_confidences.length > 0) {
    y += 8;
    checkPageBreak(50);

    doc.setFontSize(12);
    doc.setTextColor(...primary);
    doc.text("Model Confidence Consensus", 14, y);
    doc.setDrawColor(...primary);
    doc.line(14, y + 2, pageWidth - 14, y + 2);

    const consensusRows = stage1Result.model_confidences.map((m) => [
      (m.is_primary ? "\u2605 " : "") + m.model_name,
      m.error ? "Error" : m.prediction,
      m.confidence != null ? `${(m.confidence * 100).toFixed(1)}%` : "N/A",
    ]);

    autoTable(doc, {
      startY: y + 4,
      margin: { top: 35 },
      head: [["Model", "Prediction", "Confidence"]],
      body: consensusRows,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: primary, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: lightGray },
      didDrawPage: () => { addHeader(); },
      didParseCell: (data) => {
        if (data.section === "body" && data.cell.raw && typeof data.cell.raw === "string" && data.cell.raw.startsWith("\u2605")) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = [67, 56, 202];
        }
      },
    });

    y = doc.lastAutoTable.finalY + 10;
  }

  // ── FOOTERS ──
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter();
  }

  doc.save(`MediSense_Lung_Stage1_${prediction}_Report.pdf`);
}

/* ═══════════════════════════════════════════════════
   FIELD INPUT COMPONENT
═══════════════════════════════════════════════════ */
const FieldInput = ({ name, onChange }) => {
  const meta = FIELD_META[name];
  const cfg = LEVEL_CFG[meta.level];
  const isRequired = meta.level !== "supporting" || REQUIRED_SUPPORTING.has(name);
  const hasDefault = name in DEFAULT_VALUES;

  const inputCls = [
    "w-full py-2 px-3 text-sm rounded-lg border border-slate-200",
    "text-slate-800 placeholder-slate-400",
    "focus:outline-none focus:ring-2 focus:ring-offset-0",
    meta.level === "critical" ? "focus:ring-red-300"
      : meta.level === "key" ? "focus:ring-amber-300"
        : "focus:ring-blue-300",
    "transition-all bg-white",
  ].join(" ");

  return (
    <div className="relative group">
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg ${cfg.strip}`} />

      <div className={`pl-2.5 rounded-lg border ${meta.level === "critical" ? "border-red-100 bg-red-50/40"
          : meta.level === "key" ? "border-amber-100 bg-amber-50/40"
            : "border-blue-100 bg-blue-50/30"
        }`}>
        <div className="flex items-center justify-between px-1 pt-1.5 pb-0.5">
          <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.headerTxt}`}>
            {meta.label}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${hasDefault ? "bg-emerald-50 text-emerald-700 border-emerald-200" : cfg.tagBg}`}>
            {hasDefault ? "Optional" : cfg.label}
          </span>
        </div>

        {meta.type === "select" ? (
          <select name={name} required={isRequired} onChange={onChange} defaultValue=""
            className={`${inputCls} mb-1.5 border-0 bg-transparent focus:bg-white`}>
            <option value="" disabled>Select…</option>
            {meta.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : (
          <div className="relative mb-1.5">
            <input
              type="number" name={name} placeholder={`e.g. ${meta.min}`}
              min={meta.min} max={meta.max} step={meta.step}
              required={isRequired} onChange={onChange}
              className={`${inputCls} border-0 bg-transparent focus:bg-white ${meta.unit ? "pr-14" : ""}`}
            />
            {meta.unit && (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400
                               font-mono pointer-events-none select-none">
                {meta.unit}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tooltip */}
      <div className="absolute z-50 hidden group-hover:flex flex-col
                      bg-white border border-slate-200 shadow-xl rounded-xl
                      text-slate-700 text-xs p-4 top-full left-0 mt-1 w-72 pointer-events-none">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-slate-900 text-sm">{meta.label}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded border font-semibold ${cfg.tagBg}`}>
            {cfg.label}
          </span>
        </div>
        <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-xl ${cfg.strip}`} />
        <p className="text-slate-600 leading-relaxed mb-3 text-xs">{meta.tooltip.why}</p>
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex gap-2 text-xs">
            <span className="text-slate-400 w-14 flex-shrink-0">Normal</span>
            <span className="text-emerald-600 font-semibold">{meta.tooltip.normal}</span>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="text-slate-400 w-14 flex-shrink-0">⚠ Alert</span>
            <span className="text-red-600">{meta.tooltip.alert}</span>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="text-slate-400 w-14 flex-shrink-0">Ref</span>
            <span className="text-blue-600 italic">{meta.tooltip.ref}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   TOPOLOGY-STYLE CARD
═══════════════════════════════════════════════════ */
const Card = ({ children, className = "", accentColor = "bg-teal-500" }) => (
  <div className={`relative bg-white border border-slate-200 rounded-xl shadow-sm overflow-visible ${className}`}>
    <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentColor}`} />
    <div className="pt-5 px-6 pb-6">{children}</div>
  </div>
);

const LayerLabel = ({ step, color = "text-slate-400", children }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 ${color.replace("text-", "border-")}
                     flex items-center justify-center font-bold text-xs font-mono ${color}`}>
      {step}
    </div>
    <div className="flex flex-col">{children}</div>
  </div>
);

const GroupHeader = ({ level, label, count }) => {
  const cfg = LEVEL_CFG[level];
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border mb-3 ${cfg.headerBg}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      <span className={`text-xs font-bold uppercase tracking-wide ${cfg.headerTxt}`}>{label}</span>
      {count && (
        <span className={`ml-auto text-xs px-1.5 py-0.5 rounded border font-medium ${cfg.tagBg}`}>
          {count} fields
        </span>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   MODEL CONFIDENCE TABLE COMPONENT
═══════════════════════════════════════════════════ */
const ModelConfidenceTable = ({ models, expanded, onToggle, stageName = "Stage 1" }) => {
  if (!models || models.length === 0) return null;

  const primaryModel = models.find((m) => m.is_primary);
  const primaryPred = primaryModel?.prediction;
  const validModels = models.filter((m) => !m.error);
  const agreementCount = validModels.filter((m) => m.prediction === primaryPred).length;

  const predColor = (pred) => {
    if (!pred || pred === "Error") return "text-slate-400 bg-slate-50 border-slate-200";
    if (pred === "COPD" || pred.includes("3") || pred.includes("4"))
      return "text-red-700 bg-red-50 border-red-200";
    if (pred === "SMOKERS" || pred.includes("2"))
      return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-emerald-700 bg-emerald-50 border-emerald-200";
  };

  const barColor = (confidence, pred, isPrimary) => {
    if (!confidence) return "bg-slate-300";
    if (isPrimary) return "bg-indigo-500";
    if (pred === primaryPred) return "bg-teal-500";
    return "bg-slate-400";
  };

  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5
                   bg-gradient-to-r from-indigo-50 via-slate-50 to-teal-50
                   border border-slate-200 rounded-xl hover:shadow-sm transition-all group"
      >
        <div className="flex items-center gap-2.5">
          <BarChart3 size={15} className="text-indigo-500" />
          <span className="text-sm font-bold text-slate-800">
            Model Confidence Comparison
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200">
            {validModels.length} models
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold border
                          bg-teal-50 text-teal-700 border-teal-200">
            {agreementCount}/{validModels.length} agree
          </span>
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""
              }`}
          />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            key="model-table"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-1.5">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-1.5 text-xs text-slate-400
                              uppercase tracking-wide font-semibold">
                <div className="col-span-4">Model</div>
                <div className="col-span-2 text-center">Prediction</div>
                <div className="col-span-6">Confidence</div>
              </div>

              {/* Rows */}
              {models.map((m, idx) => {
                const conf = m.confidence != null ? (m.confidence * 100) : null;
                return (
                  <motion.div
                    key={m.model_name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.2 }}
                    className={`grid grid-cols-12 gap-2 items-center px-3 py-2 rounded-lg border transition-all ${m.is_primary
                        ? "bg-indigo-50/70 border-indigo-200 shadow-sm"
                        : m.prediction === primaryPred
                          ? "bg-teal-50/40 border-teal-100"
                          : m.error
                            ? "bg-red-50/30 border-red-100"
                            : "bg-white border-slate-100 hover:bg-slate-50"
                      }`}
                  >
                    {/* Model Name */}
                    <div className="col-span-4 flex items-center gap-1.5 min-w-0">
                      {m.is_primary && (
                        <Trophy size={12} className="text-indigo-500 flex-shrink-0" />
                      )}
                      <span className={`text-xs font-semibold truncate ${m.is_primary ? "text-indigo-700" : "text-slate-700"
                        }`}>
                        {m.model_name}
                      </span>
                      {m.is_primary && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100
                                         text-indigo-600 font-bold border border-indigo-200
                                         flex-shrink-0 leading-none">
                          BEST
                        </span>
                      )}
                    </div>

                    {/* Prediction Badge */}
                    <div className="col-span-2 flex justify-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border
                                        font-bold leading-tight ${predColor(m.prediction)}`}>
                        {m.error ? "ERR" : m.prediction}
                      </span>
                    </div>

                    {/* Confidence Bar */}
                    <div className="col-span-6 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <motion.div
                          className={`h-2 rounded-full ${barColor(m.confidence, m.prediction, m.is_primary)}`}
                          initial={{ width: 0 }}
                          animate={{ width: conf != null ? `${conf}%` : "0%" }}
                          transition={{ duration: 0.6, delay: idx * 0.03, ease: "easeOut" }}
                        />
                      </div>
                      <span className={`text-xs font-mono font-bold w-12 text-right ${m.is_primary ? "text-indigo-600"
                          : conf != null && conf > 75 ? "text-slate-800"
                            : "text-slate-500"
                        }`}>
                        {conf != null ? `${conf.toFixed(1)}%` : "N/A"}
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              {/* Summary Footer */}
              <div className="flex items-center justify-between px-3 pt-2 mt-1
                              border-t border-slate-100 text-xs text-slate-400">
                <span>
                  ★ Primary model: <span className="font-semibold text-indigo-600">ExtraTrees</span>
                </span>
                <span className="italic">
                  {agreementCount === validModels.length
                    ? "All models unanimous ✓"
                    : `${validModels.length - agreementCount} model(s) disagree`}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
const Lungs = () => {
  const [breathFile, setBreathFile] = useState(null);
  const [clinicalData, setClinicalData] = useState({});
  const [stage1Result, setStage1Result] = useState(null);
  const [stage2Result, setStage2Result] = useState(null);
  const [showStage2, setShowStage2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showS1Models, setShowS1Models] = useState(false);
  const [showS2Models, setShowS2Models] = useState(false);

  /* ── Validation ── */
  const validateClinical = () => {
    const requiredFields = Object.keys(FIELD_META).filter(
      (name) => FIELD_META[name].level !== "supporting" || REQUIRED_SUPPORTING.has(name)
    );
    for (const name of requiredFields) {
      const v = clinicalData[name];
      if (v === undefined || v === null || (typeof v === "number" && isNaN(v))) {
        alert(`Please fill in: ${FIELD_META[name].label}`);
        return false;
      }
    }
    if (clinicalData["Oxygen Saturation"] < 70 || clinicalData["Oxygen Saturation"] > 100) {
      alert("SpO₂ must be 70–100 %");
      return false;
    }
    if (clinicalData["mMRC"] < 0 || clinicalData["mMRC"] > 4) {
      alert("mMRC must be 0–4");
      return false;
    }
    return true;
  };

  /* ── Stage 1 ── */
  const handleStage1Submit = async (e) => {
    e.preventDefault();
    if (!breathFile) return alert("Please upload a breath CSV file.");
    setLoading(true);
    setStage1Result(null);
    setStage2Result(null);
    setShowStage2(false);
    try {
      const fd = new FormData();
      fd.append("file", breathFile);
      const res = await axiosInstance.post("/lung/stage1", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStage1Result(res.data);
      if (res.data.prediction === "COPD") setShowStage2(true);
    } catch {
      alert("Stage-1 Prediction Failed. Check the CSV and try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Stage 2 ── */
  const handleClinicalChange = (e) => {
    const parsed = safeParseFloat(e.target.value);
    setClinicalData((prev) => ({ ...prev, [e.target.name]: parsed }));
  };

  const handleStage2Submit = async (e) => {
    e.preventDefault();
    if (!validateClinical()) return;
    setLoading(true);
    try {
      const payload = { ...DEFAULT_VALUES, ...clinicalData };
      const res = await axiosInstance.post("/lung/stage2", payload, {
        headers: { "Content-Type": "application/json" },
      });
      setStage2Result(res.data);
    } catch {
      alert("Stage-2 Prediction Failed.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Backend PDF download — matches Kidney.jsx pattern ── */
  const handleDownloadPDF = async () => {
    try {
      const payload = {
        stage1:        stage1Result,
        stage2:        stage2Result,
        clinical_data: { ...DEFAULT_VALUES, ...clinicalData },
      };
      const response = await axiosInstance.post("/lung/report", payload, {
        responseType: "blob",
      });
      const url  = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `MediSense_Lung_COPD_Report_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert("Failed to download lung report.");
    }
  };

  const risk = stage2Result ? goldRisk(stage2Result.gold_stage) : null;

  const grouped = {
    critical: Object.keys(FIELD_META).filter((k) => FIELD_META[k].level === "critical"),
    key: Object.keys(FIELD_META).filter((k) => FIELD_META[k].level === "key"),
    supporting: Object.keys(FIELD_META).filter((k) => FIELD_META[k].level === "supporting"),
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <Navbar />
      <div className="ld-root">
        <header className="ld-header-banner">
          <div className="ld-container">
            <motion.h1 initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="ld-logo">
              MEDISENSE <span>LUNG</span>
            </motion.h1>
            <p className="ld-tagline">Predict &gt; Prevent &gt; Cure</p>
          </div>
        </header>

        <main className="ld-container space-y-5">


          {/* ── STAGE 1 ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card accentColor="bg-blue-500">
              <LayerLabel step="01" color="text-blue-500">
                <span className="font-sans font-bold text-slate-900 text-sm leading-tight">
                  Breath Acoustics Screening
                </span>
                <span className="text-xs text-slate-400 mt-0.5">
                  Upload a CSV of breath-sound features to detect COPD presence
                </span>
              </LayerLabel>

              <form onSubmit={handleStage1Submit}>
                <label
                  className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed
                               rounded-xl p-8 cursor-pointer select-none transition-all
                    ${dragOver
                      ? "border-blue-400 bg-blue-50"
                      : breathFile
                        ? "border-teal-400 bg-teal-50"
                        : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 bg-slate-50"
                    }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault(); setDragOver(false);
                    const f = e.dataTransfer.files[0]; if (f) setBreathFile(f);
                  }}
                >
                  {breathFile ? (
                    <>
                      <CheckCircle2 size={28} className="text-teal-500" />
                      <p className="text-teal-700 font-semibold text-sm">{breathFile.name}</p>
                      <p className="text-slate-400 text-xs">{(breathFile.size / 1024).toFixed(1)} KB — click to replace</p>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={28} className="text-slate-400" />
                      <p className="text-slate-600 text-sm font-semibold">Drop CSV here or click to browse</p>
                      <p className="text-slate-400 text-xs">Accepts .csv breath-sound feature files</p>
                    </>
                  )}
                  <input type="file" accept=".csv" className="hidden"
                    onChange={(e) => setBreathFile(e.target.files[0])} required />
                </label>

                <div className="mt-4 flex justify-end">
                  <button type="submit" disabled={loading}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700
                               disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5
                               rounded-lg transition-all">
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                    Run Stage 1
                  </button>
                </div>
              </form>
            </Card>
          </motion.div>

          {/* Stage 1 Result */}
          <AnimatePresence>
            {stage1Result && (
              <motion.div key="s1r" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card accentColor={
                  stage1Result.prediction === "COPD" ? "bg-red-500"
                    : stage1Result.prediction === "SMOKERS" ? "bg-amber-500"
                      : stage1Result.prediction === "AIR" ? "bg-slate-400"
                        : "bg-emerald-500"
                }>
                  <div className="flex items-center gap-2 mb-4">
                    <FileBarChart2 size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
                      Stage 1 Result
                    </span>
                  </div>

                  <div className="flex flex-wrap items-start gap-6 mb-5">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Prediction</p>
                      <p className={`font-sans text-2xl font-bold tracking-tight ${stage1Result.prediction === "COPD" ? "text-red-600"
                          : stage1Result.prediction === "SMOKERS" ? "text-amber-600"
                            : stage1Result.prediction === "AIR" ? "text-slate-500"
                              : "text-emerald-600"
                        }`}>
                        {stage1Result.prediction}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Confidence</p>
                      <p className="font-sans text-2xl font-bold text-slate-800">
                        {fmt(stage1Result.confidence)}
                        <span className="text-sm text-slate-400 font-normal ml-0.5">%</span>
                      </p>
                    </div>
                  </div>

                  {stage1Result.probabilities && (
                    <div className="space-y-2.5 mb-4">
                      {Object.entries(stage1Result.probabilities).map(([label, value]) => (
                        <div key={label}>
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>{label}</span>
                            <span className="font-mono font-semibold">{fmt(value.probability)}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <motion.div
                              className="h-1.5 rounded-full bg-blue-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${Number(value.probability) * 100}%` }}
                              transition={{ duration: 0.7, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Model Confidence Comparison — Stage 1 */}
                  <ModelConfidenceTable
                    models={stage1Result.model_confidences}
                    expanded={showS1Models}
                    onToggle={() => setShowS1Models((p) => !p)}
                    stageName="Stage 1"
                  />

                  {/* Classification-specific clinical advice */}
                  {stage1Result.prediction === "COPD" && (
                    <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50
                                    border border-red-200 rounded-lg px-3 py-2.5 mb-3">
                      <AlertTriangle size={12} className="flex-shrink-0 mt-0.5 text-red-500" />
                      <span>COPD signal detected — complete Stage 2 severity assessment below for GOLD staging.</span>
                    </div>
                  )}

                  {stage1Result.prediction === "SMOKERS" && (
                    <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50
                                    border border-amber-200 rounded-lg px-3 py-2.5 mb-3">
                      <AlertTriangle size={12} className="flex-shrink-0 mt-0.5 text-amber-500" />
                      <div>
                        <span className="font-semibold">Active smoker pattern detected.</span>
                        <span> Smoking is the #1 risk factor for COPD — 15–20% of smokers develop COPD.
                          Cessation slows FEV₁ decline and reduces progression risk.
                          Annual spirometry screening recommended.</span>
                      </div>
                    </div>
                  )}

                  {stage1Result.prediction === "CONTROL" && (
                    <div className="flex items-start gap-2 text-xs text-emerald-700 bg-emerald-50
                                    border border-emerald-200 rounded-lg px-3 py-2.5 mb-3">
                      <CheckCircle2 size={12} className="flex-shrink-0 mt-0.5 text-emerald-500" />
                      <span>Normal breath pattern — no COPD or smoking indicators detected. Continue routine health monitoring.</span>
                    </div>
                  )}

                  {stage1Result.prediction === "AIR" && (
                    <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50
                                    border border-slate-200 rounded-lg px-3 py-2.5 mb-3">
                      <Info size={12} className="flex-shrink-0 mt-0.5 text-slate-400" />
                      <span>Ambient air / reference sample detected. Please upload a patient breath sample for clinical analysis.</span>
                    </div>
                  )}

                  {/* Stage 1 PDF Download */}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-400 italic">
                      Screening via breath acoustics · {new Date().toLocaleDateString("en-IN")}
                    </span>
                    <button
                      onClick={() => generateStage1PDF(stage1Result)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "8px",
                        border: "none",
                        background: stage1Result.prediction === "COPD" ? "#dc2626"
                          : stage1Result.prediction === "SMOKERS" ? "#d97706"
                            : stage1Result.prediction === "AIR" ? "#64748b"
                              : "#059669",
                        color: "#fff",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.8rem",
                      }}
                    >
                      <Download size={13} />
                      Download Stage 1 Report
                    </button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── STAGE 2 FORM ── */}
          <AnimatePresence>
            {showStage2 && (
              <motion.div key="s2form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card accentColor="bg-gradient-to-r from-blue-500 via-amber-400 to-red-500">
                  <LayerLabel step="02" color="text-teal-600">
                    <span className="font-syne font-bold text-slate-900 text-sm leading-tight">
                      Clinical Severity Assessment
                    </span>
                    <span className="text-xs text-slate-400 mt-0.5">
                      All fields required · Hover any field for GOLD 2024 clinical reference
                    </span>
                  </LayerLabel>

                  {/* Legend */}
                  <div className="flex flex-wrap items-center gap-2 mb-5 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    {(["critical", "key", "supporting"]).map((lv) => (
                      <div key={lv} className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${LEVEL_CFG[lv].dot}`} />
                        <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${LEVEL_CFG[lv].tagBg}`}>
                          {LEVEL_CFG[lv].label}
                        </span>
                      </div>
                    ))}
                    <span className="text-xs text-slate-400 italic ml-auto hidden sm:block">
                      Hover any field for clinical reference
                    </span>
                  </div>

                  <form onSubmit={handleStage2Submit}>
                    {/* Critical */}
                    <GroupHeader level="critical" label="Critical Parameters — High Impact on Prediction"
                      count={grouped.critical.length} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                      {grouped.critical.map((name) => (
                        <FieldInput key={name} name={name} onChange={handleClinicalChange} />
                      ))}
                    </div>

                    {/* Key */}
                    <GroupHeader level="key" label="Key Parameters — Medium Impact"
                      count={grouped.key.length} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                      {grouped.key.map((name) => (
                        <FieldInput key={name} name={name} onChange={handleClinicalChange} />
                      ))}
                    </div>

                    {/* Supporting */}
                    <GroupHeader level="supporting" label="Supporting Parameters — Demographic & Lifestyle"
                      count={grouped.supporting.length} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                      {grouped.supporting.map((name) => (
                        <FieldInput key={name} name={name} onChange={handleClinicalChange} />
                      ))}
                    </div>

                    <div className="flex justify-end">
                      <button type="submit" disabled={loading}
                        className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700
                                   disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5
                                   rounded-lg transition-all">
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
                        Run Stage 2
                      </button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── STAGE 2 RESULT ── */}
          <AnimatePresence>
            {stage2Result && risk && (
              <motion.div key="s2r" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card accentColor={risk.strip}>
                  <div className="flex items-center gap-2 mb-5">
                    <Stethoscope size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
                      Stage 2 — Severity Result
                    </span>
                  </div>

                  {/* GOLD badge + confidence */}
                  <div className="flex flex-wrap items-start gap-6 mb-6">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">GOLD Stage</p>
                      <div className={`font-sans text-4xl font-extrabold tracking-tight leading-none ${risk.color}`}>
                        GOLD {stage2Result.gold_stage}
                      </div>
                      <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg border text-xs font-semibold ${risk.badgeBg}`}>
                        {risk.label}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{risk.sub}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Confidence</p>
                      <p className={`font-sans text-4xl font-extrabold leading-none ${risk.color}`}>
                        {fmt(stage2Result.confidence)}
                        <span className="text-lg text-slate-400 font-normal ml-0.5">%</span>
                      </p>
                    </div>
                  </div>

                  {/* Probability bars */}
                  {stage2Result.probabilities && (
                    <div className="mb-6">
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-3 font-semibold">
                        Class Probabilities
                      </p>
                      <div className="space-y-2.5">
                        {Object.entries(stage2Result.probabilities).map(([label, value]) => {
                          const pct = Number(value.probability) * 100;
                          const r = riskOf(value.probability);
                          return (
                            <div key={label} className="bg-slate-50 rounded-lg border border-slate-200 px-3 py-2.5">
                              <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-slate-600 font-semibold">{label}</span>
                                <span className={`font-mono font-bold ${r.color}`}>
                                  {isNaN(pct) ? "—" : pct.toFixed(1)}%
                                </span>
                              </div>
                              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <motion.div
                                  className={`h-1.5 rounded-full ${r.barBg}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: isNaN(pct) ? "0%" : `${pct}%` }}
                                  transition={{ duration: 0.7, ease: "easeOut" }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Model Confidence Comparison — Stage 2 */}
                  <ModelConfidenceTable
                    models={stage2Result.model_confidences}
                    expanded={showS2Models}
                    onToggle={() => setShowS2Models((p) => !p)}
                    stageName="Stage 2"
                  />

                  {/* PDF download button */}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <span className="text-xs text-slate-400 italic">
                      Report generated via COPD AI · {new Date().toLocaleDateString("en-IN")}
                    </span>
                    <button
                      onClick={handleDownloadPDF}
                      className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all"
                    >
                      <Download size={16} />Export Medical Report
                    </button>
                  </div>

                </Card>
              </motion.div>
            )}
          </AnimatePresence>

        </main>
      </div>
    </>
  );
};

export default Lungs;
