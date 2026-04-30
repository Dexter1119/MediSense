////////////////////////////////////////////////////////////////////
//// File Name : Heart.jsx
//// Description : Heart disease prediction UI — Premium Medical Theme
////               Matching Kidney/Lung aesthetics and functionality
//// Updated     : Premium TooltipKit + Model Consensus Engine
////////////////////////////////////////////////////////////////////

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, HeartPulse, Brain, Info, CheckCircle2, 
  AlertTriangle, FileBarChart2, ChevronDown, ChevronUp, 
  Trophy, Loader2, ChevronRight, Download, Eye, FileText, Heart, ShieldAlert
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import Navbar from "../../components/Navbar";

/* ─────────────────────────────────────────────
   GLOBAL STYLES
 ───────────────────────────────────────────── */
const GLOBAL_CSS = `
  :root {
    --h-bg:        #fcf8f8;
    --h-surface:   #ffffff;
    --h-accent:    #ef4444; /* Red */
    --h-primary:   #4f46e5; /* Indigo */
    --h-mint:      #10b981;
    --h-border:    #e2e8f0;
    --h-text:      #0f172a;
    --h-muted:     #64748b;
  }

  .ht-root {
    background: var(--h-bg);
    min-height: 100vh;
    padding-bottom: 80px;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .ht-container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .ht-header-banner {
    background: linear-gradient(135deg, #1e1b4b 0%, #450a0a 100%);
    padding: 40px 0;
    margin-bottom: 40px;
    color: white;
    text-align: center;
    border-bottom: 4px solid var(--h-accent);
  }

  .ht-logo {
    font-size: 2.2rem;
    font-weight: 800;
    letter-spacing: -1px;
    margin-bottom: 8px;
  }
  .ht-logo span { color: var(--h-accent); }
  .ht-tagline {
    font-size: 0.75rem;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: #94a3b8;
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
    strip: "bg-indigo-500",
    dot: "bg-indigo-500",
    label: "Supporting",
    tagBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    headerBg: "bg-indigo-50/50 border-indigo-100",
    headerTxt: "text-indigo-800",
  },
};

const FIELD_META = {
  systolic: {
    label: "Systolic BP",
    level: "critical",
    type: "number",
    min: 80, max: 220, step: "1",
    unit: "mmHg",
    tooltip: {
      why: "Peak pressure in arteries during heart contraction.",
      normal: "< 120 mmHg",
      alert: "> 140 (Hypertension)",
      ref: "AHA Guidelines"
    }
  },
  diastolic: {
    label: "Diastolic BP",
    level: "critical",
    type: "number",
    min: 50, max: 140, step: "1",
    unit: "mmHg",
    tooltip: {
      why: "Pressure in arteries when heart rests between beats.",
      normal: "< 80 mmHg",
      alert: "> 90 (Hypertension)",
      ref: "AHA Guidelines"
    }
  },
  cholesterol: {
    label: "Cholesterol",
    level: "critical",
    type: "select",
    options: [{label: "Normal", value: "1"}, {label: "Above Normal", value: "2"}, {label: "Well Above Normal", value: "3"}],
    tooltip: {
      why: "Serum cholesterol levels — high levels lead to plaque buildup.",
      normal: "Level 1",
      alert: "Level 3",
      ref: "Lipid Profile"
    }
  },
  age: {
    label: "Age",
    level: "critical",
    type: "number",
    min: 1, max: 120, step: "1",
    unit: "yrs",
    tooltip: {
      why: "Age is a non-modifiable primary driver of CVD risk.",
      normal: "< 45 yrs",
      alert: "> 65 yrs",
      ref: "Demographics"
    }
  },
  glucose: {
    label: "Glucose",
    level: "key",
    type: "select",
    options: [{label: "Normal", value: "1"}, {label: "Above Normal", value: "2"}, {label: "Well Above Normal", value: "3"}],
    tooltip: {
      why: "Blood sugar levels — diabetes is a major CVD risk factor.",
      normal: "Level 1",
      alert: "Level 3",
      ref: "Metabolic Panel"
    }
  },
  weight: {
    label: "Weight",
    level: "key",
    type: "number",
    min: 30, max: 300, step: "0.1",
    unit: "kg",
    tooltip: {
      why: "Body weight used to assess BMI and obesity-related strain.",
      normal: "BMI 18.5-25",
      alert: "BMI > 30",
      ref: "Anthropometrics"
    }
  },
  smoking: {
    label: "Smoking",
    level: "key",
    type: "select",
    options: [{label: "No", value: "0"}, {label: "Yes", value: "1"}],
    tooltip: {
      why: "Tobacco use damages artery linings and raises BP.",
      normal: "No",
      alert: "Yes",
      ref: "Life Habits"
    }
  },
  gender: {
    label: "Sex",
    level: "supporting",
    type: "select",
    options: [{label: "Male", value: "2"}, {label: "Female", value: "1"}],
    tooltip: {
      why: "Biological sex impacts baseline risk and hormone protection.",
      normal: "N/A",
      alert: "N/A",
      ref: "Clinical Baseline"
    }
  },
  height: {
    label: "Height",
    level: "supporting",
    type: "number",
    min: 100, max: 250, step: "1",
    unit: "cm",
    tooltip: {
      why: "Used with weight to calculate BMI.",
      normal: "N/A",
      alert: "N/A",
      ref: "Baseline"
    }
  },
  alcohol: {
    label: "Alcohol",
    level: "supporting",
    type: "select",
    options: [{label: "No", value: "0"}, {label: "Yes", value: "1"}],
    tooltip: {
      why: "Heavy alcohol use increases blood pressure and heart strain.",
      normal: "No",
      alert: "Yes",
      ref: "Life Habits"
    }
  },
  active: {
    label: "Activity",
    level: "supporting",
    type: "select",
    options: [{label: "Active", value: "1"}, {label: "Inactive", value: "0"}],
    tooltip: {
      why: "Physical activity strengthens the heart and reduces risk.",
      normal: "Active",
      alert: "Inactive",
      ref: "Lifestyle"
    }
  },
};

const SECTIONS = [
  { id: "vitals", label: "Cardiac Vitals", step: "01", fields: ["systolic", "diastolic", "cholesterol", "age"], icon: HeartPulse, color: "text-red-600" },
  { id: "metabolic", label: "Metabolic Risk", step: "02", fields: ["glucose", "weight", "smoking"], icon: Activity, color: "text-amber-600" },
  { id: "bio", label: "Bio & Lifestyle", step: "03", fields: ["gender", "height", "alcohol", "active"], icon: Brain, color: "text-indigo-600" },
];

/* ═══════════════════════════════════════════════════
   PREMIUM HELPERS & COMPONENTS
 ═══════════════════════════════════════════════════ */
const Card = ({ children, className = "", accentColor = "bg-red-500" }) => (
  <div className={`relative bg-white border border-slate-200 rounded-xl shadow-sm overflow-visible ${className}`}>
    <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentColor}`} />
    <div className="pt-5 px-6 pb-6">{children}</div>
  </div>
);

const FieldInput = ({ name, value, onChange }) => {
  const meta = FIELD_META[name];
  const cfg  = LEVEL_CFG[meta.level];
  const isRequired = true;

  const inputCls = [
    "w-full py-2 px-3 text-sm rounded-lg border border-slate-200",
    "text-slate-800 placeholder-slate-400",
    "focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all bg-white",
    meta.level === "critical" ? "focus:ring-red-300" : meta.level === "key" ? "focus:ring-amber-300" : "focus:ring-indigo-300",
  ].join(" ");

  return (
    <div className="relative group">
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg ${cfg.strip}`} />
      <div className={`pl-2.5 rounded-lg border ${meta.level === "critical" ? "border-red-100 bg-red-50/40" : meta.level === "key" ? "border-amber-100 bg-amber-50/40" : "border-indigo-100 bg-indigo-50/30"}`}>
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
          <div className="flex gap-2 text-[0.65rem]"><span className="text-slate-400 w-14 flex-shrink-0">Ref</span><span className="text-red-600 italic">{meta.tooltip.ref}</span></div>
        </div>
      </div>
    </div>
  );
};

const ModelConfidenceTable = ({ models, expanded, onToggle }) => {
  if (!models || models.length === 0) return null;
  const agreementCount = models.filter(m => m.prediction === models[0].prediction).length;

  return (
    <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
      <button onClick={onToggle} type="button" className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-100 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-red-100 rounded-lg text-red-600"><FileText size={14} /></div>
          <div className="text-left">
            <p className="text-[0.7rem] font-bold text-slate-800 uppercase tracking-tight">Model Consensus Engine</p>
            <p className="text-[0.65rem] text-slate-500">
              {agreementCount} of {models.length} AI sub-models agree on result
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-t border-slate-200 bg-white">
            <div className="p-4 space-y-3">
              {models.map(m => (
                <div key={m.model_name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-[0.7rem]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">{m.model_name}</span>
                      {m.is_primary && <Trophy size={10} className="text-amber-500" />}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-1.5 py-0.5 rounded text-[0.6rem] font-bold ${m.prediction === models[0].prediction ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-100"}`}>{m.prediction}</span>
                      <span className="font-mono font-bold text-slate-600 w-10 text-right">{m.confidence}%</span>
                    </div>
                  </div>
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${m.confidence}%` }} className={`h-full rounded-full ${m.prediction === models[0].prediction ? "bg-red-500" : "bg-slate-300"}`} />
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
   MAIN HEART COMPONENT
 ═══════════════════════════════════════════════════ */
const INITIAL_FORM = { age:"",gender:"",height:"",weight:"",systolic:"",diastolic:"",cholesterol:"",glucose:"",smoking:"",alcohol:"",active:"" };

function HeartApp() {
  const [formData, setFormData] = useState(INITIAL_FORM);
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
        Age: parseFloat(formData.age),
        Gender: parseFloat(formData.gender),
        "Height(cm)": parseFloat(formData.height),
        "Weight(kg)": parseFloat(formData.weight),
        Systolic_Blood_Pressure: parseFloat(formData.systolic),
        Diastolic_Blood_Pressure: parseFloat(formData.diastolic),
        Cholesterol: parseFloat(formData.cholesterol),
        Glucose: parseFloat(formData.glucose),
        Smoking: parseFloat(formData.smoking),
        Alcohol: parseFloat(formData.alcohol),
        Physical_Activity: parseFloat(formData.active),
      };

      const res = await axiosInstance.post("/heart/predict", payload);
      setResult(res.data.result);
      setShowModels(true); // Auto-expand consensus table on result
    } catch (err) {
      alert("Submission failed. Ensure all fields are filled.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!result) return;
    try {
      const payload = {
        Age: parseFloat(formData.age),
        Gender: parseFloat(formData.gender),
        "Height(cm)": parseFloat(formData.height),
        "Weight(kg)": parseFloat(formData.weight),
        Systolic_Blood_Pressure: parseFloat(formData.systolic),
        Diastolic_Blood_Pressure: parseFloat(formData.diastolic),
        Cholesterol: parseFloat(formData.cholesterol),
        Glucose: parseFloat(formData.glucose),
        Smoking: parseFloat(formData.smoking),
        Alcohol: parseFloat(formData.alcohol),
        Physical_Activity: parseFloat(formData.active),
      };

      const response = await axiosInstance.post("/heart/report", payload, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MediSense_Heart_Report_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to download clinical PDF report.");
    }
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <Navbar />
      <div className="ht-root">
        <header className="ht-header-banner">
          <div className="ht-container">
            <motion.h1 initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="ht-logo">MEDISENSE <span>HEART</span></motion.h1>
            <p className="ht-tagline">Predict &gt; Prevent &gt; Cure</p>
          </div>
        </header>

        <div className="ht-container">
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
                        <p className="text-[0.65rem] text-slate-400">Section {sec.step} · Clinical Data</p>
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
              <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full max-w-md py-4 rounded-xl bg-red-600 text-white font-bold shadow-lg shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
                {loading ? <Loader2 className="animate-spin" /> : <ChevronRight size={18} />}
                {loading ? "Analysing Cardiac Patterns..." : "Generate Heart Diagnostic Result"}
              </motion.button>
            </div>
          </form>

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="mt-12">
                <Card className="md:p-4" accentColor={result.prediction === 0 ? "bg-emerald-500" : "bg-red-500"}>
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
                      <p className="text-3xl font-bold text-slate-800 tracking-tight">{result.disease_type}</p>
                    </div>
                    <div>
                      <p className="text-[0.7rem] text-slate-400 uppercase font-bold tracking-wider mb-2">Confidence</p>
                      <p className="text-3xl font-bold text-slate-800 tracking-tight">{result.confidence}%</p>
                    </div>
                    <div>
                      <p className="text-[0.7rem] text-slate-400 uppercase font-bold tracking-wider mb-2">Risk Level</p>
                      <p className={`text-lg font-bold ${result.prediction === 0 ? "text-emerald-600" : "text-red-600"}`}>{result.risk_level}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldAlert size={16} className="text-red-600" />
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Clinical Action Plan</h4>
                    </div>
                    <div className="result-decision">
                      <strong className="block text-xs uppercase text-red-600 mb-1">{result.medical_action}</strong>
                      <p className="text-sm text-slate-600 leading-relaxed italic">{result.recommendation}</p>
                    </div>
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

export default HeartApp;