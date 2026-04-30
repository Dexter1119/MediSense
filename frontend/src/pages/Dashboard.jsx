////////////////////////////////////////////////////////////////////
 //
 // File Name : Dashboard.jsx
 // Description : Doctor dashboard with animated organ selection (Redesigned)
 // Author      : Pradhumnya Changdev Kalsait
 // Date        : 17/01/26
 //
 ////////////////////////////////////////////////////////////////////

import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  Activity,
  HeartPulse,
  Droplets,
  Stethoscope,
  Users,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
} from "lucide-react";

function Dashboard() {
  const navigate = useNavigate();
  const { userRole } = useContext(AuthContext);

  function handleOrganSelection(organName) {
    navigate(`/organ/${organName}`);
  }

  /* ================= ORGAN CONFIG ================= */
  const organs = [
    {
      key: "lung",
      title: "Lung",
      subtitle: "COPD Two-Stage Pipeline",
      desc: "Respiratory disease severity analysis using breath acoustics screening followed by GOLD severity grading.",
      icon: <Activity size={28} />,
      gradient: "from-sky-400 to-indigo-500",
      glowColor: "shadow-sky-500/20",
      lightBg: "bg-sky-50",
      lightText: "text-sky-600",
      border: "border-sky-200",
      tag: "2-Stage AI",
      hoverGlow: "group-hover:shadow-sky-500/25",
    },
    {
      key: "heart",
      title: "Heart",
      subtitle: "Cardiovascular Risk Scoring",
      desc: "Risk stratification for cardiovascular events using clinical and demographic data analysis.",
      icon: <HeartPulse size={28} />,
      gradient: "from-rose-400 to-pink-500",
      glowColor: "shadow-rose-500/20",
      lightBg: "bg-rose-50",
      lightText: "text-rose-600",
      border: "border-rose-200",
      tag: "Machine Learning",
      hoverGlow: "group-hover:shadow-rose-500/25",
    },
    {
      key: "kidney",
      title: "Kidney",
      subtitle: "CKD Risk Classification",
      desc: "Stage-wise prediction of chronic kidney disease with feature importance analysis.",
      icon: <Droplets size={28} />,
      gradient: "from-teal-400 to-emerald-500",
      glowColor: "shadow-teal-500/20",
      lightBg: "bg-teal-50",
      lightText: "text-teal-600",
      border: "border-teal-200",
      tag: "ML Pipeline",
      hoverGlow: "group-hover:shadow-teal-500/25",
    },
    {
      key: "liver",
      title: "Liver",
      subtitle: "Hepatic Damage Assessment",
      desc: "Assessment of liver damage severity, transplant necessity, and treatment urgency scoring.",
      icon: <Stethoscope size={28} />,
      gradient: "from-amber-400 to-orange-500",
      glowColor: "shadow-amber-500/20",
      lightBg: "bg-amber-50",
      lightText: "text-amber-600",
      border: "border-amber-200",
      tag: "Prediction",
      hoverGlow: "group-hover:shadow-amber-500/25",
    },
  ];

  /* ================= STATS ================= */
  const stats = [
    {
      label: "Patients Today",
      value: "42",
      change: "+12%",
      icon: <Users size={20} />,
      gradient: "from-indigo-500 to-indigo-600",
      lightBg: "bg-indigo-50",
      textColor: "text-indigo-600",
      borderAccent: "border-t-indigo-500",
    },
    {
      label: "Predictions Done",
      value: "168",
      change: "+8%",
      icon: <BarChart3 size={20} />,
      gradient: "from-teal-500 to-emerald-500",
      lightBg: "bg-teal-50",
      textColor: "text-teal-600",
      borderAccent: "border-t-teal-500",
    },
    {
      label: "Model Accuracy",
      value: "94.6%",
      change: "Stable",
      icon: <ShieldCheck size={20} />,
      gradient: "from-violet-500 to-purple-500",
      lightBg: "bg-violet-50",
      textColor: "text-violet-600",
      borderAccent: "border-t-violet-500",
    },
    {
      label: "Critical Alerts",
      value: "7",
      change: "-3",
      icon: <AlertTriangle size={20} />,
      gradient: "from-rose-500 to-red-500",
      lightBg: "bg-rose-50",
      textColor: "text-rose-600",
      borderAccent: "border-t-rose-500",
    },
  ];

  return (
    <>
      <Navbar />

      <div className="relative min-h-screen overflow-hidden bg-appbg">

        {/* ═══════════════════════ BACKGROUND ═══════════════════════ */}
        <div className="absolute inset-0 z-0 bg-hero-glow" />
        <div className="absolute top-20 right-[-5%] w-96 h-96 bg-indigo-200/15 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-10 left-[-5%] w-80 h-80 bg-teal-200/15 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-[40%] left-[50%] w-64 h-64 bg-violet-200/10 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: "3s" }} />

        {/* Morphing blob */}
        <div className="absolute top-[15%] right-[10%] w-48 h-48 bg-gradient-to-br from-indigo-200/10 to-teal-200/10 animate-morph-blob" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

          {/* ═══════════════════════ WELCOME HEADER ═══════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            {/* Top row: badge + time */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-teal-50 border border-indigo-100 text-sm font-semibold text-indigo-600 mb-4">
                  <Sparkles size={14} />
                  AI Clinical Decision Support
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-textprimary leading-[1.1]">
                  Welcome to{" "}
                  <span className="bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent">
                    Dashboard
                  </span>
                </h1>
                {/* Tagline */}
                <div className="mt-3 mb-1 flex items-center gap-2">
                  <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">Predict</span>
                  <span className="text-teal-400 text-sm">›</span>
                  <span className="text-sm font-bold bg-gradient-to-r from-teal-500 to-teal-400 bg-clip-text text-transparent">Prevent</span>
                  <span className="text-teal-400 text-sm">›</span>
                  <span className="text-sm font-bold bg-gradient-to-r from-emerald-500 to-emerald-400 bg-clip-text text-transparent">Cure</span>
                </div>
                <p className="mt-1 text-textsecondary text-lg max-w-xl">
                  Select an organ module below to begin AI-powered disease risk prediction and clinical analysis.
                </p>
              </div>

              {/* Quick info card */}
              <div className="flex-shrink-0">
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-card p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center text-white">
                      <Clock size={16} />
                    </div>
                    <span className="text-sm font-semibold text-textprimary">Quick Status</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-textsecondary">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    All models operational
                  </div>
                  {userRole && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        userRole === "ADMIN" ? "bg-amber-400" : "bg-emerald-400"
                      }`} />
                      {userRole}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ═══════════════════════ STATS PANEL ═══════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12"
          >
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className={`relative bg-white/70 backdrop-blur-xl rounded-2xl p-5 shadow-card border border-white/60 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 overflow-hidden border-t-[3px] ${stat.borderAccent}`}
              >
                {/* Subtle background glow */}
                <div className={`absolute top-0 right-0 w-24 h-24 ${stat.lightBg} rounded-full blur-2xl opacity-50`} />

                <div className="relative flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${stat.gradient} shadow-sm`}>
                    {stat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-textsecondary font-medium truncate">
                      {stat.label}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className={`text-2xl font-extrabold ${stat.textColor}`}>
                        {stat.value}
                      </p>
                      <span className="text-xs font-semibold text-emerald-500 flex items-center gap-0.5">
                        <TrendingUp size={12} />
                        {stat.change}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* ═══════════════════════ SECTION LABEL ═══════════════════════ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-600 text-xs font-bold uppercase tracking-wider">
              Organ Modules
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-teal-200/50 to-transparent" />
          </motion.div>

          {/* ═══════════════════════ ORGAN CARDS ═══════════════════════ */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.12, delayChildren: 0.35 },
              },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {organs.map((organ) => (
              <motion.div
                key={organ.key}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  show: { opacity: 1, y: 0 },
                }}
                whileHover={{ scale: 1.03, y: -6 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleOrganSelection(organ.key)}
                className={`group cursor-pointer relative bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 overflow-hidden shadow-card hover:shadow-xl ${organ.hoverGlow} transition-all duration-300`}
              >
                {/* Top gradient accent line */}
                <div className={`h-1 bg-gradient-to-r ${organ.gradient}`} />

                <div className="p-6">
                  {/* Icon + Tag row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${organ.gradient} shadow-lg ${organ.glowColor} group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                      {organ.icon}
                    </div>
                    <span className={`text-[11px] px-2.5 py-1 rounded-lg ${organ.lightBg} ${organ.lightText} ${organ.border} border font-bold uppercase tracking-wider`}>
                      {organ.tag}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-textprimary mb-1 group-hover:text-indigo-600 transition-colors duration-200">
                    {organ.title}
                  </h3>

                  {/* Subtitle */}
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    {organ.subtitle}
                  </p>

                  {/* Description */}
                  <p className="text-sm text-textsecondary leading-relaxed mb-5">
                    {organ.desc}
                  </p>

                  {/* CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-sm font-semibold text-primary flex items-center gap-1.5 group-hover:gap-2.5 transition-all duration-300">
                      Start Prediction
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                    <div className={`w-8 h-8 rounded-lg ${organ.lightBg} flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100`}>
                      <ArrowRight size={14} className={organ.lightText} />
                    </div>
                  </div>
                </div>

                {/* Hover overlay glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${organ.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none`} />
              </motion.div>
            ))}
          </motion.div>

          {/* ═══════════════════════ QUICK TIPS SECTION ═══════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-12"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-teal-400 p-8 md:p-10">
              {/* Decorative blurs */}
              <div className="absolute top-[-30%] right-[-10%] w-72 h-72 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-[-20%] left-[-5%] w-56 h-56 bg-teal-300/15 rounded-full blur-3xl" />

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-extrabold text-white mb-2">
                    Ready for Clinical Analysis?
                  </h3>
                  <p className="text-indigo-100 max-w-lg">
                    Select any organ module above to input clinical parameters and get instant AI-powered disease risk assessments with downloadable PDF reports.
                  </p>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <button
                    onClick={() => handleOrganSelection("lung")}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-600 font-bold shadow-lg shadow-indigo-900/20 hover:shadow-xl hover:bg-indigo-50 active:scale-[0.97] transition-all duration-300"
                  >
                    Quick Start
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ═══════════════════════ FOOTER ═══════════════════════ */}
        <div className="relative z-10 mt-8 pb-8 text-center text-sm text-textsecondary">
          MediSense © 2026 · <span className="font-semibold"><span className="text-indigo-400">Predict</span> › <span className="text-teal-400">Prevent</span> › <span className="text-emerald-400">Cure</span></span>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
