////////////////////////////////////////////////////////////////////
//// File Name : Liver.jsx
//// Description : Liver disease prediction UI — Premium Medical Theme
////               Matching Kidney/Lung aesthetics and functionality
//// Updated     : Premium TooltipKit + Model Consensus Engine
////////////////////////////////////////////////////////////////////

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, HeartPulse, Brain, Info, CheckCircle2, 
  AlertTriangle, FileBarChart2, ChevronDown, ChevronUp, 
  Trophy, Loader2, ChevronRight, Download, Eye, FileText, Wind, ShieldAlert
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import Navbar from "../../components/Navbar";

/* ─────────────────────────────────────────────
   GLOBAL STYLES (Mint Medical Theme)
 ───────────────────────────────────────────── */
const GLOBAL_CSS = `
  :root {
    --lv-bg:        #f8fafc;
    --lv-surface:   #ffffff;
    --lv-accent:    #14b8a6; /* Teal */
    --lv-primary:   #4f46e5; /* Indigo */
    --lv-mint:      #10b981;
    --lv-border:    #e2e8f0;
    --lv-text:      #0f172a;
    --lv-muted:     #64748b;
  }

  .lv-root {
    background: var(--lv-bg);
    min-height: 100vh;
    padding-bottom: 80px;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .lv-container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .lv-header-banner {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    padding: 40px 0;
    margin-bottom: 40px;
    color: white;
    text-align: center;
    border-bottom: 4px solid var(--lv-accent);
  }

  .lv-logo {
    font-size: 2.2rem;
    font-weight: 800;
    letter-spacing: -1px;
    margin-bottom: 8px;
  }
  .lv-logo span { color: var(--lv-accent); }
  .lv-tagline {
    font-size: 0.75rem;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--lv-muted);
    opacity: 0.8;
  }

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
    strip: "bg-teal-500",
    dot: "bg-teal-500",
    label: "Supporting",
    tagBg: "bg-teal-50 text-teal-700 border-teal-200",
    headerBg: "bg-teal-50/50 border-teal-100",
    headerTxt: "text-teal-800",
  },
};

const FIELD_META = {
  alt: {
    label: "ALT (SGPT)",
    level: "critical",
    type: "number",
    min: 0, max: 1000, step: "any",
    unit: "U/L",
    tooltip: {
      why: "Alanine Aminotransferase — primary marker of hepatocellular injury.",
      normal: "7 – 56 U/L",
      alert: "> 100 (Inflammation)",
      ref: "Liver Panel"
    }
  },
  ast: {
    label: "AST (SGOT)",
    level: "critical",
    type: "number",
    min: 0, max: 1000, step: "any",
    unit: "U/L",
    tooltip: {
      why: "Aspartate Aminotransferase — elevated in cirrhosis and hepatitis.",
      normal: "10 – 40 U/L",
      alert: "> 80 (Hepatic stress)",
      ref: "Liver Panel"
    }
  },
  bil: {
    label: "Total Bilirubin",
    level: "critical",
    type: "number",
    min: 0, max: 50, step: "any",
    unit: "mg/dL",
    tooltip: {
      why: "Measures waste from RBC breakdown. High levels cause jaundice.",
      normal: "0.2 – 1.2 mg/dL",
      alert: "> 2.5 (Severe dysfunction)",
      ref: "Biliary Health"
    }
  },
  crea: {
    label: "Creatinine",
    level: "critical",
    type: "number",
    min: 0, max: 20, step: "any",
    unit: "mg/dL",
    tooltip: {
      why: "Marker for hepatorenal syndrome — a complication of liver failure.",
      normal: "0.6 – 1.2 mg/dL",
      alert: "> 1.5 (Renal impact)",
      ref: "HRS Monitoring"
    }
  },
  inr: {
    label: "INR",
    level: "critical",
    type: "number",
    min: 0, max: 10, step: "any",
    unit: "ratio",
    tooltip: {
      why: "Measures blood clotting time — vital for MELD/synthetic function.",
      normal: "0.8 – 1.1",
      alert: "> 1.5 (Clotting risk)",
      ref: "Synthetic Capacity"
    }
  },
  alb: {
    label: "Albumin",
    level: "key",
    type: "number",
    min: 0, max: 10, step: "any",
    unit: "g/dL",
    tooltip: {
      why: "Protein made by liver — low levels indicate chronic liver failure.",
      normal: "3.5 – 5.0 g/dL",
      alert: "< 3.0 (Synthetic failure)",
      ref: "Nutritional Status"
    }
  },
  alp: {
    label: "ALP",
    level: "key",
    type: "number",
    min: 0, max: 2000, step: "any",
    unit: "U/L",
    tooltip: {
      why: "Alkaline Phosphatase — elevated in biliary obstruction.",
      normal: "44 – 147 U/L",
      alert: "> 200 (Cholestasis)",
      ref: "Biliary Tree"
    }
  },
  direct_bilirubin: {
    label: "Direct Bilirubin",
    level: "key",
    type: "number",
    min: 0, max: 25, step: "any",
    unit: "mg/dL",
    tooltip: {
      why: "Conjugated bilirubin — helps differentiate cause of jaundice.",
      normal: "0 – 0.3 mg/dL",
      alert: "> 0.5 (Obstruction)",
      ref: "Liver Function"
    }
  },
  ggt: {
    label: "GGT",
    level: "key",
    type: "number",
    min: 0, max: 2000, step: "any",
    unit: "U/L",
    tooltip: {
      why: "Gamma-Glutamyl Transferase — sensitive marker of alcohol use.",
      normal: "9 – 48 U/L",
      alert: "> 60 (Toxic stress)",
      ref: "Hepatic Health"
    }
  },
  sodium: {
    label: "Sodium",
    level: "key",
    type: "number",
    min: 100, max: 180, step: "any",
    unit: "mEq/L",
    tooltip: {
      why: "Serum sodium level — critical for MELD-Na scoring in cirrhosis.",
      normal: "136 – 145 mEq/L",
      alert: "< 130 (High risk)",
      ref: "Fluid Balance"
    }
  },
  age: {
    label: "Age",
    level: "supporting",
    type: "number",
    min: 1, max: 120, step: "1",
    unit: "yrs",
    tooltip: {
      why: "Risk baseline increases with age due to fibrosis accumulation.",
      normal: "Any",
      alert: "> 65 (High baseline)",
      ref: "Demographics"
    }
  },
  gender: {
    label: "Sex",
    level: "supporting",
    type: "select",
    options: [{label: "Male", value: "1"}, {label: "Female", value: "0"}],
    tooltip: {
      why: "Biological sex impacts enzyme baseline and progression.",
      normal: "N/A",
      alert: "N/A",
      ref: "Clinical Factors"
    }
  },
  che: { label: "CHE", level: "supporting", type: "number", unit: "kU/L", tooltip: { why: "Cholinesterase — synthetic marker.", normal: "5.3 - 12.9", alert: "Low", ref: "SI Units" } },
  chol: { label: "Cholesterol", level: "supporting", type: "number", unit: "mg/dL", tooltip: { why: "Total cholesterol level.", normal: "< 200", alert: "Low/High", ref: "Lipids" } },
  prot: { label: "Total Protein", level: "supporting", type: "number", unit: "g/dL", tooltip: { why: "Sum of albumin & globulin.", normal: "6.0 - 8.3", alert: "< 6.0", ref: "Synthesis" } },
  ascites: {
    label: "Ascites",
    level: "supporting",
    type: "select",
    options: [{label: "None", value: "0"}, {label: "Mild", value: "1"}, {label: "Severe", value: "2"}],
    tooltip: { why: "Fluid in abdomen.", normal: "None", alert: "Present", ref: "Child-Pugh" }
  },
  encephalopathy: {
    label: "Enceph.",
    level: "supporting",
    type: "select",
    options: [{label: "None", value: "0"}, {label: "Grade 1-2", value: "1"}, {label: "Grade 3-4", value: "2"}],
    tooltip: { why: "Brain dysfunction.", normal: "None", alert: "Present", ref: "Child-Pugh" }
  },
};

const SECTIONS = [
  { id: "core", label: "Core Hepatic Panel", step: "01", fields: ["alt", "ast", "bil", "crea", "inr"], icon: Activity, color: "text-red-500" },
  { id: "biochemical", label: "Biochemical Markers", step: "02", fields: ["alb", "alp", "direct_bilirubin", "ggt", "sodium"], icon: Wind, color: "text-amber-500" },
  { id: "patient", label: "Patient & Synthetic", step: "03", fields: ["age", "gender", "che", "chol", "prot", "ascites", "encephalopathy"], icon: Brain, color: "text-teal-500" },
];

/* ═══════════════════════════════════════════════════
   PREMIUM HELPERS & COMPONENTS
 ═══════════════════════════════════════════════════ */
const Card = ({ children, className = "", accentColor = "bg-teal-500" }) => (
  <div className={`relative bg-white border border-slate-200 rounded-xl shadow-sm overflow-visible ${className}`}>
    <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentColor}`} />
    <div className="pt-5 px-6 pb-6">{children}</div>
  </div>
);

const FieldInput = ({ name, value, onChange }) => {
  const meta = FIELD_META[name];
  const cfg  = LEVEL_CFG[meta.level];
  const isRequired = meta.level !== "supporting" || name === "age" || name === "gender";

  const inputCls = [
    "w-full py-2 px-3 text-sm rounded-lg border border-slate-200",
    "text-slate-800 placeholder-slate-400",
    "focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all bg-white",
    meta.level === "critical" ? "focus:ring-red-300" : meta.level === "key" ? "focus:ring-amber-300" : "focus:ring-teal-300",
  ].join(" ");

  return (
    <div className="relative group">
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg ${cfg.strip}`} />
      <div className={`pl-2.5 rounded-lg border ${meta.level === "critical" ? "border-red-100 bg-red-50/40" : meta.level === "key" ? "border-amber-100 bg-amber-50/40" : "border-teal-100 bg-teal-50/30"}`}>
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
            <input type="number" name={name} placeholder={meta.unit || ""} step={meta.step || "any"} required={isRequired} onChange={onChange} value={value} className={`${inputCls} border-0 bg-transparent focus:bg-white ${meta.unit ? "pr-14" : ""}`} />
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
          <div className="flex gap-2 text-[0.65rem]"><span className="text-slate-400 w-14 flex-shrink-0">Ref</span><span className="text-indigo-600 italic">{meta.tooltip.ref}</span></div>
        </div>
      </div>
    </div>
  );
};

const ModelConfidenceTable = ({ models, expanded, onToggle }) => {
  if (!models) return null;

  // Convert dictionary {"Model Name": Confidence} to array of objects
  const modelArray = Object.entries(models).map(([name, conf]) => ({
    model_name: name,
    confidence: conf,
    // For liver, we assume they agree if they are in this list (simplified)
    // or we could show prediction if we had it. For now, focus on confidence.
    prediction: conf >= 50 ? "Positive" : "Negative" 
  })).sort((a, b) => b.confidence - a.confidence);

  const avgConfidence = modelArray.length > 0 
    ? (modelArray.reduce((acc, curr) => acc + curr.confidence, 0) / modelArray.length).toFixed(2)
    : 0;

  return (
    <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
      <button onClick={onToggle} type="button" className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-100 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-teal-100 rounded-lg text-teal-600"><FileText size={14} /></div>
          <div className="text-left">
            <p className="text-[0.7rem] font-bold text-slate-800 uppercase tracking-tight">Model Consensus Analysis</p>
            <p className="text-[0.65rem] text-slate-500">Average System Confidence: {avgConfidence}%</p>
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
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-600 w-10 text-right">{m.confidence}%</span>
                    </div>
                  </div>
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${m.confidence}%` }} className="h-full rounded-full bg-teal-500" />
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
   MAIN LIVER COMPONENT
 ═══════════════════════════════════════════════════ */
const DEFAULT_VALUES = {
  che: 8.0, chol: 180, prot: 7.0, ascites: 0, encephalopathy: 0,
};

function Liver() {
  const [formData, setFormData] = useState({
    age: "", gender: "", alb: "", alp: "", alt: "", ast: "", bil: "", direct_bilirubin: "",
    che: "", chol: "", crea: "", ggt: "", prot: "", inr: "", sodium: "", ascites: "", encephalopathy: ""
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModels, setShowModels] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const payload = {
        age: parseFloat(formData.age),
        gender: parseInt(formData.gender),
        alt: parseFloat(formData.alt),
        ast: parseFloat(formData.ast),
        bil: parseFloat(formData.bil),
        crea: parseFloat(formData.crea),
        alb: parseFloat(formData.alb),
        alp: parseFloat(formData.alp),
        direct_bilirubin: parseFloat(formData.direct_bilirubin),
        ggt: parseFloat(formData.ggt),
        inr: formData.inr ? parseFloat(formData.inr) : null,
        sodium: formData.sodium ? parseFloat(formData.sodium) : null,
        che: formData.che !== "" ? parseFloat(formData.che) : DEFAULT_VALUES.che,
        chol: formData.chol !== "" ? parseFloat(formData.chol) : DEFAULT_VALUES.chol,
        prot: formData.prot !== "" ? parseFloat(formData.prot) : DEFAULT_VALUES.prot,
        ascites: formData.ascites !== "" ? parseInt(formData.ascites) : DEFAULT_VALUES.ascites,
        encephalopathy: formData.encephalopathy !== "" ? parseInt(formData.encephalopathy) : DEFAULT_VALUES.encephalopathy,
      };

      const res = await axiosInstance.post("/liver/predict", payload);
      setResult(res.data);
    } catch (err) {
      alert("Submission failed. Please check your data.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const payload = {
        age: parseFloat(formData.age),
        gender: parseInt(formData.gender),
        alt: parseFloat(formData.alt),
        ast: parseFloat(formData.ast),
        bil: parseFloat(formData.bil),
        crea: parseFloat(formData.crea),
        alb: parseFloat(formData.alb),
        alp: parseFloat(formData.alp),
        direct_bilirubin: parseFloat(formData.direct_bilirubin),
        ggt: parseFloat(formData.ggt),
        inr: formData.inr ? parseFloat(formData.inr) : null,
        sodium: formData.sodium ? parseFloat(formData.sodium) : null,
        che: formData.che !== "" ? parseFloat(formData.che) : DEFAULT_VALUES.che,
        chol: formData.chol !== "" ? parseFloat(formData.chol) : DEFAULT_VALUES.chol,
        prot: formData.prot !== "" ? parseFloat(formData.prot) : DEFAULT_VALUES.prot,
        ascites: formData.ascites !== "" ? parseInt(formData.ascites) : DEFAULT_VALUES.ascites,
        encephalopathy: formData.encephalopathy !== "" ? parseInt(formData.encephalopathy) : DEFAULT_VALUES.encephalopathy,
      };

      const response = await axiosInstance.post("/liver/report", payload, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MediSense_Liver_Report_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to download PDF.");
    }
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <Navbar />
      <div className="lv-root">
        <header className="lv-header-banner">
          <div className="lv-container">
            <motion.h1 initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="lv-logo">MEDISENSE <span>LIVER</span></motion.h1>
            <p className="lv-tagline">Predict &gt; Prevent &gt; Cure</p>
          </div>
        </header>

        <div className="lv-container">
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
                        <p className="text-[0.65rem] text-slate-400">Section {sec.step} · Patient Evaluation</p>
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
              <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full max-w-md py-4 rounded-xl bg-teal-600 text-white font-bold shadow-lg shadow-teal-200 flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
                {loading ? <Loader2 className="animate-spin" /> : <ChevronRight size={18} />}
                {loading ? "Calculating Hepatic Risk..." : "Generate Liver Diagnostic Result"}
              </motion.button>
            </div>
          </form>

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="mt-12">
                <Card className="md:p-4" accentColor={result.primary_diagnosis === "Healthy" ? "bg-emerald-500" : "bg-red-500"}>
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                      <FileBarChart2 size={20} className="text-slate-400" />
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Diagnostic Report</span>
                    </div>
                    <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 text-xs font-bold transition-colors">
                      <Download size={14} /> Download PDF
                    </button>
                  </div>

                  <div className="grid-3 mb-12">
                    <div>
                      <p className="text-[0.7rem] text-slate-400 uppercase font-bold tracking-wider mb-2">Status</p>
                      <p className="text-3xl font-bold text-slate-800 tracking-tight">{result.primary_diagnosis}</p>
                    </div>
                    <div>
                      <p className="text-[0.7rem] text-slate-400 uppercase font-bold tracking-wider mb-2">Confidence</p>
                      <p className="text-3xl font-bold text-slate-800 tracking-tight">{result.confidence}</p>
                    </div>
                    <div>
                      <p className="text-[0.7rem] text-slate-400 uppercase font-bold tracking-wider mb-2">Decision</p>
                      <p className="text-lg font-bold text-teal-600">{result.recommendation}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldAlert size={16} className="text-teal-600" />
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Clinical Insight</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed italic">
                      "The diagnostic pipeline suggests {result.primary_diagnosis}. 
                      {result.secondary_model_used ? " The analysis required a secondary evaluation stage for increased precision." : " The diagnosis was confirmed through high-consensus primary modeling."}"
                    </p>
                  </div>

                  <ModelConfidenceTable models={result.model_results} expanded={showModels} onToggle={() => setShowModels(!showModels)} />
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

export default Liver;