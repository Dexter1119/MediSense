////////////////////////////////////////////////////////////////////
//// File Name : Kidney.jsx
//// Description : Kidney disease prediction UI — Premium Medical Theme
////               Matching Lung Stage 2 aesthetics and functionality
//// Updated     : Premium TooltipKit + Model Consensus Engine
////////////////////////////////////////////////////////////////////

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, HeartPulse, Brain, Info, CheckCircle2, 
  AlertTriangle, FileBarChart2, ChevronDown, ChevronUp, 
  Trophy, Loader2, ChevronRight, Download, Eye, FileText
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import Navbar from "../../components/Navbar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ─────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────── */
const GLOBAL_CSS = `
  :root {
    --k-bg:        #f8fafc;
    --k-surface:   #ffffff;
    --k-accent:    #0ea5e9;
    --k-primary:   #6366f1;
    --k-mint:      #10b981;
    --k-border:    #e2e8f0;
    --k-text:      #0f172a;
    --k-muted:     #64748b;
  }

  .kd-root {
    background: var(--k-bg);
    min-height: 100vh;
    padding-bottom: 80px;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .kd-container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .kd-header-banner {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    padding: 40px 0;
    margin-bottom: 40px;
    color: white;
    text-align: center;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }

  .kd-logo {
    font-size: 2.2rem;
    font-weight: 800;
    letter-spacing: -1px;
    margin-bottom: 8px;
  }
  .kd-logo span { color: var(--k-mint); }
  .kd-tagline {
    font-size: 0.75rem;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--k-muted);
    opacity: 0.8;
  }

  /* Grid Layouts */
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
  
  @media (max-width: 900px) { .grid-3, .grid-4 { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 600px) { .grid-3, .grid-4 { grid-template-columns: 1fr; } }
`;

/* ═══════════════════════════════════════════════════
   FEATURE DATA & CONFIG
 ═══════════════════════════════════════════════════ */
const LEVEL_CFG = {
  critical: {
    strip: "bg-red-500",
    dot: "bg-red-500",
    label: "Critical",
    tagBg: "bg-red-50 text-red-700 border-red-200",
    headerBg: "bg-red-50/50 border-red-100",
    headerTxt: "text-red-800",
  },
  key: {
    strip: "bg-amber-500",
    dot: "bg-amber-500",
    label: "Key Factor",
    tagBg: "bg-amber-50 text-amber-700 border-amber-200",
    headerBg: "bg-amber-50/50 border-amber-100",
    headerTxt: "text-amber-800",
  },
  supporting: {
    strip: "bg-blue-500",
    dot: "bg-blue-500",
    label: "Supporting",
    tagBg: "bg-blue-50 text-blue-700 border-blue-200",
    headerBg: "bg-blue-50/50 border-blue-100",
    headerTxt: "text-blue-800",
  },
};

const FIELD_META = {
  gfr: {
    label: "GFR",
    level: "critical",
    type: "number",
    min: 0, max: 200, step: "any",
    unit: "mL/min",
    tooltip: {
      why: "Glomerular Filtration Rate — primary measure of kidney health.",
      normal: "91 – 120 mL/min",
      alert: "< 60 (Kidney Disease)",
      ref: "CKD Staging Guide"
    }
  },
  serum_creatinine: {
    label: "Creatinine",
    level: "critical",
    type: "number",
    min: 0, max: 20, step: "any",
    unit: "mg/dL",
    tooltip: {
      why: "Waste product; levels rise when kidney filtration fails.",
      normal: "0.6 – 1.2 mg/dL",
      alert: "> 1.5 (Impaired function)",
      ref: "Metabolic Panel"
    }
  },
  bun: {
    label: "BUN",
    level: "critical",
    type: "number",
    min: 0, max: 150, step: "any",
    unit: "mg/dL",
    tooltip: {
      why: "Blood Urea Nitrogen measures nitrogen waste in blood.",
      normal: "7 – 20 mg/dL",
      alert: "> 25 (High stress)",
      ref: "Renal Function"
    }
  },
  blood_pressure: {
    label: "Systolic BP",
    level: "critical",
    type: "number",
    min: 50, max: 250, step: "any",
    unit: "mmHg",
    tooltip: {
      why: "Hypertension damages small kidney blood vessels.",
      normal: "90 – 120 mmHg",
      alert: "> 140 (Hypertension)",
      ref: "AHA Guidelines"
    }
  },
  serum_calcium: {
    label: "Serum Calcium",
    level: "key",
    type: "number",
    min: 0, max: 20, step: "any",
    unit: "mg/dL",
    tooltip: {
      why: "Imbalances lead to kidney stones and bone mineral issues.",
      normal: "8.5 – 10.5 mg/dL",
      alert: "< 8.5 or > 10.5",
      ref: "Electrolyte Lab"
    }
  },
  oxalate_levels: {
    label: "Oxalate",
    level: "key",
    type: "number",
    min: 0, max: 10, step: "any",
    unit: "mmol/L",
    tooltip: {
      why: "Major constituent of common kidney stones.",
      normal: "0.1 – 0.5 mmol/L",
      alert: "> 0.5 (Stone Risk)",
      ref: "Urolithiasis Indicators"
    }
  },
  urine_ph: {
    label: "Urine pH",
    level: "key",
    type: "number",
    min: 0, max: 14, step: "any",
    unit: "pH",
    tooltip: {
      why: "Acidity determines susceptibility to different stone types.",
      normal: "4.5 – 8.0",
      alert: "< 5.0 (Acidic)",
      ref: "Urinalysis"
    }
  },
  c3_c4: {
    label: "C3/C4 Levels",
    level: "critical",
    type: "number",
    min: 0, max: 200, step: "any",
    unit: "mg/dL",
    tooltip: {
      why: "Immune markers; low levels suggest autoimmune nephritis.",
      normal: "C3: 80-160, C4: 16-48",
      alert: "Depleted levels",
      ref: "Immunology Lab"
    }
  },
  water_intake: {
    label: "Water Intake",
    level: "key",
    type: "number",
    min: 0, max: 10, step: "any",
    unit: "L/day",
    tooltip: {
      why: "Hydration directly impacts renal toxin clearance.",
      normal: "2.0 – 3.0 L/day",
      alert: "< 1.0 L (Risk)",
      ref: "Urology Standards"
    }
  },
  months: {
    label: "Duration",
    level: "supporting",
    type: "number",
    min: 0, max: 240, step: 1,
    unit: "mo",
    tooltip: {
      why: "Differentiates chronic from acute kidney issues.",
      normal: "N/A",
      alert: "> 3 months (Chronic)",
      ref: "KDIGO Criteria"
    }
  },
  age: {
    label: "Age",
    level: "supporting",
    type: "number",
    min: 0, max: 120, step: 1,
    unit: "yrs",
    tooltip: {
      why: "GFR naturally declines as a person ages.",
      normal: "N/A",
      alert: "> 60 (High Risk)",
      ref: "Geriatric Nephrology"
    }
  },
  ana: {
    label: "Anemia",
    level: "key",
    type: "select",
    options: [{label: "Yes", value: "yes"}, {label: "No", value: "no"}],
    tooltip: {
      why: "Kidney failure reduces EPO, leading to anemia.",
      normal: "No Anemia",
      alert: "Anemia Present",
      ref: "CBC Panel"
    }
  },
  hematuria: {
    label: "Hematuria",
    level: "key",
    type: "select",
    options: [{label: "Yes", value: "yes"}, {label: "No", value: "no"}],
    tooltip: {
      why: "Blood in urine suggests glomerular or tubular damage.",
      normal: "Negative",
      alert: "Positive",
      ref: "Urinalysis"
    }
  },
  painkiller_usage: {
    label: "NSAID Usage",
    level: "key",
    type: "select",
    options: [{label: "Yes", value: "yes"}, {label: "No", value: "no"}],
    tooltip: {
      why: "Frequent NSAID use is nephrotoxic (damages kidneys).",
      normal: "No/Rare",
      alert: "Frequent/Daily",
      ref: "Nephrotoxic Alerts"
    }
  },
  family_history: {
    label: "Family History",
    level: "supporting",
    type: "select",
    options: [{label: "Yes", value: "yes"}, {label: "No", value: "no"}],
    tooltip: {
      why: "Significant genetic risk for PKD and renal stones.",
      normal: "Negative",
      alert: "Positive",
      ref: "Genetic Risk"
    }
  },
  physical_activity: {
    label: "Activity",
    level: "supporting",
    type: "select",
    options: [{label: "Daily", value: "daily"}, {label: "Weekly", value: "weekly"}, {label: "Rarely", value: "rarely"}],
    tooltip: {
      why: "Exercise helps manage BP and metabolic kidney stress.",
      normal: "Active",
      alert: "Rarely",
      ref: "AHA Lifestyle"
    }
  },
  diet: {
    label: "Diet Type",
    level: "supporting",
    type: "select",
    options: [{label: "Balanced", value: "balanced"}, {label: "High Protein", value: "high protein"}, {label: "Low Salt", value: "low salt"}],
    tooltip: {
      why: "High protein/salt intake strains renal filtration.",
      normal: "Balanced",
      alert: "High Protein",
      ref: "Renal Diet"
    }
  },
  smoking: {
    label: "Smoking",
    level: "supporting",
    type: "select",
    options: [{label: "Yes", value: "yes"}, {label: "No", value: "no"}],
    tooltip: {
      why: "Accelerates vascular damage in the kidneys.",
      normal: "No",
      alert: "Yes",
      ref: "Tobacco Health"
    }
  },
  alcohol: {
    label: "Alcohol",
    level: "supporting",
    type: "select",
    options: [{label: "Never", value: "never"}, {label: "Occasionally", value: "occasionally"}, {label: "Daily", value: "daily"}],
    tooltip: {
      why: "Excessive intake causes hypertension and dehydration.",
      normal: "Never/Rare",
      alert: "Daily",
      ref: "Renal Nutrition"
    }
  },
  weight_changes: {
    label: "Weight Change",
    level: "supporting",
    type: "select",
    options: [{label: "Stable", value: "stable"}, {label: "Loss", value: "loss"}, {label: "Gain", value: "gain"}],
    tooltip: {
      why: "Sudden changes signal fluid retention or uremia.",
      normal: "Stable",
      alert: "Sudden Change",
      ref: "Uremic Markers"
    }
  },
  stress_level: {
    label: "Stress Level",
    level: "supporting",
    type: "select",
    options: [{label: "Low", value: "low"}, {label: "Moderate", value: "moderate"}, {label: "High", value: "high"}],
    tooltip: {
      why: "Chronic stress elevates BP, impacting renal health.",
      normal: "Low",
      alert: "High",
      ref: "Mental Health Link"
    }
  },
};

const SECTIONS = [
  { id: "function", label: "Renal Function", step: "01", fields: ["gfr", "serum_creatinine", "bun", "c3_c4", "blood_pressure"], icon: HeartPulse, color: "text-red-500" },
  { id: "markers", label: "Clinical Markers", step: "02", fields: ["serum_calcium", "oxalate_levels", "urine_ph", "water_intake", "ana", "hematuria", "painkiller_usage"], icon: Activity, color: "text-amber-500" },
  { id: "lifestyle", label: "Lifestyle & Bio", step: "03", fields: ["age", "months", "family_history", "physical_activity", "diet", "smoking", "alcohol", "weight_changes", "stress_level"], icon: Brain, color: "text-blue-500" },
];

/* ═══════════════════════════════════════════════════
   PREMIUM HELPERS & COMPONENTS
 ═══════════════════════════════════════════════════ */
const fmt = (v) => {
  if (v === null || v === undefined) return "N/A";
  if (typeof v === "string") {
    const clean = v.replace("%", "");
    return isNaN(clean) ? v : parseFloat(clean).toFixed(1);
  }
  if (typeof v === "number") return (v * 100).toFixed(1);
  return v;
};

const Card = ({ children, className = "", accentColor = "bg-blue-500" }) => (
  <div className={`relative bg-white border border-slate-200 rounded-xl shadow-sm overflow-visible ${className}`}>
    <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentColor}`} />
    <div className="pt-5 px-6 pb-6">{children}</div>
  </div>
);

const FieldInput = ({ name, value, onChange }) => {
  const meta = FIELD_META[name];
  const cfg  = LEVEL_CFG[meta.level];
  const isRequired = meta.level !== "supporting";

  const inputCls = [
    "w-full py-2 px-3 text-sm rounded-lg border border-slate-200",
    "text-slate-800 placeholder-slate-400",
    "focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all bg-white",
    meta.level === "critical" ? "focus:ring-red-300" : meta.level === "key" ? "focus:ring-amber-300" : "focus:ring-blue-300",
  ].join(" ");

  return (
    <div className="relative group">
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg ${cfg.strip}`} />
      <div className={`pl-2.5 rounded-lg border ${meta.level === "critical" ? "border-red-100 bg-red-50/40" : meta.level === "key" ? "border-amber-100 bg-amber-50/40" : "border-blue-100 bg-blue-50/30"}`}>
        <div className="flex items-center justify-between px-1 pt-1.5 pb-0.5">
          <span className={`text-[0.6rem] font-bold uppercase tracking-tight ${cfg.headerTxt}`}>{meta.label}</span>
          <span className={`text-[0.55rem] px-1.5 py-0.5 rounded border font-bold ${cfg.tagBg}`}>{cfg.label}</span>
        </div>
        {meta.type === "select" ? (
          <select name={name} required={isRequired} onChange={onChange} value={value} className={`${inputCls} mb-1.5 border-0 bg-transparent focus:bg-white`}>
            <option value="" disabled>Select…</option>
            {meta.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : (
          <div className="relative mb-1.5">
            <input type="number" name={name} placeholder={`e.g. ${meta.min}`} min={meta.min} max={meta.max} step={meta.step} required={isRequired} onChange={onChange} value={value} className={`${inputCls} border-0 bg-transparent focus:bg-white ${meta.unit ? "pr-14" : ""}`} />
            {meta.unit && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[0.6rem] text-slate-400 font-mono pointer-events-none select-none">{meta.unit}</span>}
          </div>
        )}
      </div>
      {/* Tooltip */}
      <div className="absolute z-50 hidden group-hover:flex flex-col bg-white border border-slate-200 shadow-xl rounded-xl text-slate-700 p-4 top-full left-0 mt-1 w-72 pointer-events-none">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-slate-900 text-sm">{meta.label}</span>
          <span className={`text-[0.6rem] px-1.5 py-0.5 rounded border font-bold ${cfg.tagBg}`}>{cfg.label}</span>
        </div>
        <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-xl ${cfg.strip}`} />
        <p className="text-slate-600 leading-relaxed mb-3 text-[0.7rem]">{meta.tooltip.why}</p>
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex gap-2 text-[0.65rem]"><span className="text-slate-400 w-14 flex-shrink-0">Normal</span><span className="text-emerald-600 font-semibold">{meta.tooltip.normal}</span></div>
          <div className="flex gap-2 text-[0.65rem]"><span className="text-slate-400 w-14 flex-shrink-0">⚠ Alert</span><span className="text-red-600">{meta.tooltip.alert}</span></div>
          <div className="flex gap-2 text-[0.65rem]"><span className="text-slate-400 w-14 flex-shrink-0">Ref</span><span className="text-blue-600 italic">{meta.tooltip.ref}</span></div>
        </div>
      </div>
    </div>
  );
};

const ModelConfidenceTable = ({ models, expanded, onToggle }) => {
  if (!models) return null;
  const stageLabel = (stage) => {
    if (stage === null || stage === undefined) return "Error";
    if (stage === 0) return "No CKD";
    return `CKD Stage ${stage}`;
  };
  const modelArray = Object.entries(models)
    .filter(([, val]) => val.stage !== null && val.stage !== undefined)
    .map(([name, val]) => ({
      model_name: name,
      prediction: stageLabel(val.stage),
      confidence: val.confidence / 100,
      is_primary: false,
    })).sort((a, b) => b.confidence - a.confidence);
  if (modelArray.length > 0) modelArray[0].is_primary = true;

  const primaryModel = modelArray[0];
  const primaryPred = primaryModel?.prediction;
  const agreementCount = modelArray.filter(m => m.prediction === primaryPred).length;

  return (
    <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
      <button onClick={onToggle} type="button" className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-100 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600"><FileText size={14} /></div>
          <div className="text-left">
            <p className="text-[0.7rem] font-bold text-slate-800 uppercase tracking-tight">Model Confidence Analysis</p>
            <p className="text-[0.65rem] text-slate-500">{agreementCount} of {modelArray.length} models agree on {primaryPred}</p>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-t border-slate-200 bg-white">
            <div className="p-4 space-y-3">
              {modelArray.map(m => (
                <div key={m.model_name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-[0.7rem]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">{m.model_name}</span>
                      {m.is_primary && <Trophy size={10} className="text-amber-500" />}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-1.5 py-0.5 rounded text-[0.6rem] font-bold ${m.prediction === primaryPred ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-100"}`}>{m.prediction}</span>
                      <span className="font-mono font-bold text-slate-600 w-10 text-right">{fmt(m.confidence)}%</span>
                    </div>
                  </div>
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${m.confidence * 100}%` }} className={`h-full rounded-full ${m.prediction === primaryPred ? "bg-emerald-500" : "bg-slate-300"}`} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN KIDNEY COMPONENT
 ═══════════════════════════════════════════════════ */
const DEFAULT_VALUES = {
  physical_activity: "weekly", diet: "balanced", smoking: "no", alcohol: "occasionally", weight_changes: "stable", stress_level: "moderate",
  ana: "no", hematuria: "no", painkiller_usage: "no", family_history: "no",
};

function Kidney() {
  const [formData, setFormData] = useState({
    age: "", gfr: "", serum_creatinine: "", bun: "", serum_calcium: "", c3_c4: "", oxalate_levels: "", urine_ph: "", blood_pressure: "", water_intake: "", months: "",
    ana: "", hematuria: "", painkiller_usage: "", family_history: "", physical_activity: "", diet: "", smoking: "", alcohol: "", weight_changes: "", stress_level: ""
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModels, setShowModels] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const yesNoToBinary = (val, key) => (val || DEFAULT_VALUES[key]) === "yes" ? 1 : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const highFields = ["age", "gfr", "serum_creatinine", "bun", "serum_calcium", "oxalate_levels", "urine_ph", "blood_pressure", "months", "c3_c4", "water_intake"];
    const formattedHigh = {};
    highFields.forEach(f => {
      const val = formData[f];
      formattedHigh[f] = val === "" ? null : Number(val);
    });

    const payload = {
      ...formattedHigh,
      ana: yesNoToBinary(formData.ana, "ana"),
      hematuria: yesNoToBinary(formData.hematuria, "hematuria"),
      painkiller_usage: yesNoToBinary(formData.painkiller_usage, "painkiller_usage"),
      family_history: yesNoToBinary(formData.family_history, "family_history"),
      physical_activity: formData.physical_activity || DEFAULT_VALUES.physical_activity,
      diet: formData.diet || DEFAULT_VALUES.diet,
      smoking: formData.smoking || DEFAULT_VALUES.smoking,
      alcohol: formData.alcohol || DEFAULT_VALUES.alcohol,
      weight_changes: formData.weight_changes || DEFAULT_VALUES.weight_changes,
      stress_level: formData.stress_level || DEFAULT_VALUES.stress_level,
    };

    try {
      const res = await axiosInstance.post("/kidney/predict", payload);
      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert("Error processing kidney prediction.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const highFields = ["age", "gfr", "serum_creatinine", "bun", "serum_calcium", "oxalate_levels", "urine_ph", "blood_pressure", "months", "c3_c4", "water_intake"];
      const formattedHigh = {};
      highFields.forEach(f => {
        const val = formData[f];
        formattedHigh[f] = val === "" ? null : Number(val);
      });

      const payload = {
        ...formattedHigh,
        ana: yesNoToBinary(formData.ana, "ana"),
        hematuria: yesNoToBinary(formData.hematuria, "hematuria"),
        painkiller_usage: yesNoToBinary(formData.painkiller_usage, "painkiller_usage"),
        family_history: yesNoToBinary(formData.family_history, "family_history"),
        physical_activity: formData.physical_activity || DEFAULT_VALUES.physical_activity,
        diet: formData.diet || DEFAULT_VALUES.diet,
        smoking: formData.smoking || DEFAULT_VALUES.smoking,
        alcohol: formData.alcohol || DEFAULT_VALUES.alcohol,
        weight_changes: formData.weight_changes || DEFAULT_VALUES.weight_changes,
        stress_level: formData.stress_level || DEFAULT_VALUES.stress_level,
      };

      const response = await axiosInstance.post("/kidney/report", payload, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MediSense_Kidney_Report_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert("Failed to download kidney report.");
    }
  };


  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <Navbar />
      <div className="kd-root">
        <header className="kd-header-banner">
          <div className="kd-container">
            <motion.h1 initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="kd-logo">MEDISENSE <span>KIDNEY</span></motion.h1>
            <p className="kd-tagline">Predict &gt; Prevent &gt; Cure</p>
          </div>
        </header>
        <div className="kd-container">
          <form onSubmit={handleSubmit} className="space-y-8">
            {SECTIONS.map((sec, idx) => (
              <motion.div key={sec.id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: idx * 0.1 }} className="flex gap-0">
                <div className="hidden md:flex flex-col items-center mr-6">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-200 flex items-center justify-center font-mono font-bold text-xs text-slate-400">{sec.step}</div>
                  <div className="flex-1 w-0.5 bg-slate-100 my-2" />
                </div>
                <div className="flex-1">
                  <Card accentColor={sec.color.replace("text-", "bg-")}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`p-2 rounded-lg bg-white shadow-sm border border-slate-100 ${sec.color}`}><sec.icon size={20} /></div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{sec.label}</h3>
                        <p className="text-[0.65rem] text-slate-400">Section {sec.step} · Patient Data</p>
                      </div>
                    </div>
                    <div className="grid-4">
                      {sec.fields.map(f => <FieldInput key={f} name={f} value={formData[f]} onChange={handleChange} />)}
                    </div>
                  </Card>
                </div>
              </motion.div>
            ))}
            <div className="flex justify-center pt-4">
              <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full max-w-md py-4 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
                {loading ? <Loader2 className="animate-spin" /> : <ChevronRight size={18} />}
                {loading ? "Analysing Renal Patterns..." : "Generate Kidney Diagnostic Result"}
              </motion.button>
            </div>
          </form>

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="mt-12">
                <Card className="md:p-4" accentColor={result.criticality === "LOW" ? "bg-emerald-500" : "bg-red-500"}>
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                      <FileBarChart2 size={20} className="text-slate-400" />
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Diagnostic Report</span>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${result.criticality === "LOW" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}>{result.criticality} RISK</span>
                  </div>
                  <div className="grid-3 mb-12">
                    <div>
                      <p className="text-[0.7rem] text-slate-400 uppercase font-bold tracking-wider mb-2">Status</p>
                      <p className="text-3xl font-bold text-slate-800 tracking-tight">{result.disease}</p>
                    </div>
                    <div>
                      <p className="text-[0.7rem] text-slate-400 uppercase font-bold tracking-wider mb-2">Confidence</p>
                      <p className="text-3xl font-bold text-slate-800 tracking-tight">{result.confidence}</p>
                    </div>
                    <div>
                      <p className="text-[0.7rem] text-slate-400 uppercase font-bold tracking-wider mb-2">Decision</p>
                      <p className="text-lg font-bold text-indigo-600">{result.decision}</p>
                    </div>
                  </div>
                  <ModelConfidenceTable models={result.model_results} expanded={showModels} onToggle={() => setShowModels(!showModels)} />
                  <div className="mt-10 flex justify-end">
                    <button onClick={handleDownloadPDF} className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all"><Download size={16} />Export Medical Report</button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

export default Kidney;
