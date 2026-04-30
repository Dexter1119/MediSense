////////////////////////////////////////////////////////////////////
//
// File Name : Landing.jsx
// Description : Public landing page for Disease Prediction System
// Author      : Pradhumnya Changdev Kalsait
// Date        : 17/01/26
//
////////////////////////////////////////////////////////////////////

import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Zap,
  BarChart3,
  ArrowRight,
  Activity,
  Brain,
  HeartPulse,
  Stethoscope,
  ChevronRight,
  FileBarChart2,
  Clock,
  Users,
} from "lucide-react";

const DISEASES = [
  {
    title: "Lung Disease",
    subtitle: "COPD Two-Stage Pipeline",
    desc: "Breath acoustics screening followed by GOLD severity grading using clinical parameters.",
    icon: <Activity size={22} />,
    gradient: "from-sky-500 to-indigo-600",
    lightBg: "bg-sky-50",
    lightText: "text-sky-600",
    border: "border-sky-200",
    tag: "2-Stage AI",
  },
  {
    title: "Kidney Disease",
    subtitle: "CKD Risk Classification",
    desc: "Stage-wise prediction of chronic kidney disease with feature importance analysis.",
    icon: <Brain size={22} />,
    gradient: "from-teal-500 to-emerald-600",
    lightBg: "bg-teal-50",
    lightText: "text-teal-600",
    border: "border-teal-200",
    tag: "ML Pipeline",
  },
  {
    title: "Heart Disease",
    subtitle: "Cardiovascular Risk Scoring",
    desc: "Risk stratification for cardiovascular events using clinical and demographic data.",
    icon: <HeartPulse size={22} />,
    gradient: "from-rose-500 to-pink-600",
    lightBg: "bg-rose-50",
    lightText: "text-rose-600",
    border: "border-rose-200",
    tag: "Deep Learning",
  },
  {
    title: "Liver Disease",
    subtitle: "Hepatic Damage Assessment",
    desc: "Assessment of liver damage severity, transplant necessity, and treatment urgency.",
    icon: <Stethoscope size={22} />,
    gradient: "from-amber-500 to-orange-600",
    lightBg: "bg-amber-50",
    lightText: "text-amber-600",
    border: "border-amber-200",
    tag: "Prediction",
  },
];

const FEATURES = [
  {
    icon: <Zap size={20} />,
    title: "Real-Time Predictions",
    desc: "Get instant AI-powered disease risk assessments with clinical-grade accuracy.",
  },
  {
    icon: <ShieldCheck size={20} />,
    title: "GOLD 2024 Compliant",
    desc: "Built on latest medical guidelines with validated clinical reference ranges.",
  },
  {
    icon: <BarChart3 size={20} />,
    title: "Detailed Reports",
    desc: "Download comprehensive PDF reports with parameters, probabilities, and interpretations.",
  },
  {
    icon: <FileBarChart2 size={20} />,
    title: "Feature Importance",
    desc: "Understand which clinical parameters most influence the prediction outcome.",
  },
  {
    icon: <Clock size={20} />,
    title: "Multi-Stage Analysis",
    desc: "Two-stage pipelines for sequential screening and severity assessment.",
  },
  {
    icon: <Users size={20} />,
    title: "Role-Based Access",
    desc: "Doctor and Admin portals with secure JWT authentication and authorization.",
  },
];

const TEAM = [
  { name: "Pradhumnya Kalsait", role: "ML & Lung Research" },
  { name: "Ankita Sawant", role: "ML & Kidney Research" },
  { name: "Onkar Bansode", role: "ML & Heart Research" },
  { name: "Ayush Mahadik", role: "ML & Liver Research" },
];

const STATS = [
  { value: "4", label: "Disease Modules" },
  { value: "20+", label: "Clinical Parameters" },
  { value: "95%", label: "Model Accuracy" },
  { value: "PDF", label: "Report Generation" },
];

function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden text-textprimary bg-white">

      {/* ═══════════════════════ NAVBAR ═══════════════════════ */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-teal-400 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-textprimary tracking-tight leading-tight">
                Medi<span className="text-primary">Sense</span>
              </span>
              <span className="text-[9px] font-bold tracking-[0.15em] uppercase leading-none">
                <span className="text-indigo-500">Predict</span>
                <span className="text-slate-300 mx-0.5">›</span>
                <span className="text-teal-500">Prevent</span>
                <span className="text-slate-300 mx-0.5">›</span>
                <span className="text-emerald-500">Cure</span>
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-textsecondary">
            <a href="#diseases" className="hover:text-primary transition-colors">Diseases</a>
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#team" className="hover:text-primary transition-colors">Team</a>
          </nav>

          <div className="flex gap-3 items-center">
            <Link
              to="/login"
              className="text-sm font-semibold text-textsecondary hover:text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/25 hover:from-indigo-700 hover:to-indigo-600 active:scale-[0.97] transition-all duration-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-teal-50/20" />
        <div className="absolute top-20 right-[10%] w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-[5%] w-72 h-72 bg-teal-200/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-24">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-semibold mb-8">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              AI-Powered Clinical Decision Support
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight text-slate-900 mb-6">
              Intelligent{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent">
                Disease Risk
              </span>
              <br />
              Prediction Platform
            </h1>

            {/* Tagline */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">
                Predict
              </span>
              <span className="text-teal-400 text-xl font-light">›</span>
              <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-teal-500 to-teal-400 bg-clip-text text-transparent">
                Prevent
              </span>
              <span className="text-teal-400 text-xl font-light">›</span>
              <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-400 bg-clip-text text-transparent">
                Cure
              </span>
            </div>

            <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto mb-10">
              MediSense is an intelligent medical decision-support system
              designed to assist clinicians in early detection, severity
              assessment, and treatment planning for critical diseases.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-base font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:from-indigo-700 hover:to-indigo-600 active:scale-[0.97] transition-all duration-300"
              >
                Access Platform
                <ArrowRight size={18} />
              </Link>

              <a
                href="#diseases"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-slate-200 text-slate-700 text-base font-semibold hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all duration-300"
              >
                Explore Modules
                <ChevronRight size={18} />
              </a>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((stat, idx) => (
              <div
                key={idx}
                className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl px-6 py-5 text-center shadow-sm"
              >
                <div className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ DISEASES ═══════════════════════ */}
      <section id="diseases" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-600 text-xs font-bold uppercase tracking-wider mb-4">
              Disease Modules
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
              Comprehensive Organ Analysis
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Advanced AI models trained on clinical datasets for early detection
              and severity assessment of critical organ diseases.
            </p>
          </div>

          {/* Disease Cards — 2x2 grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {DISEASES.map((disease, idx) => (
              <div
                key={idx}
                className="group relative bg-white rounded-2xl border border-slate-100 p-8 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start gap-5">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${disease.gradient} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                    {disease.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        {disease.title}
                      </h3>
                      <span className={`text-xs px-2.5 py-1 rounded-lg ${disease.lightBg} ${disease.lightText} ${disease.border} border font-semibold`}>
                        {disease.tag}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      {disease.subtitle}
                    </p>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {disease.desc}
                    </p>
                  </div>
                </div>

                {/* Arrow on hover */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <ChevronRight size={20} className="text-slate-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FEATURES ═══════════════════════ */}
      <section id="features" className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-4">
              Platform Features
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
              Built for Clinical Excellence
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Every feature is designed to support accurate diagnosis and
              streamline the clinical decision-making process.
            </p>
          </div>

          {/* Feature Grid — 3x2 */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-100 p-7 hover:shadow-lg hover:shadow-slate-200/40 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ CTA BANNER ═══════════════════════ */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-teal-400 px-12 py-16 text-center">
            {/* Decorative shapes */}
            <div className="absolute top-[-40%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-[-30%] left-[-5%] w-80 h-80 bg-teal-300/15 rounded-full blur-3xl" />

            <div className="relative z-10">
              {/* CTA Tagline pill */}
              <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-sm font-bold text-white mb-6 tracking-wide">
                <span className="text-indigo-200">Predict</span>
                <span className="text-white/40">›</span>
                <span className="text-teal-200">Prevent</span>
                <span className="text-white/40">›</span>
                <span className="text-emerald-200">Cure</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                Start Predicting Disease Risk Today
              </h2>
              <p className="text-indigo-100 text-lg max-w-xl mx-auto mb-8">
                Access the full platform — upload clinical data, run AI models,
                and generate diagnostic reports in minutes.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-indigo-600 text-base font-bold shadow-xl shadow-indigo-900/20 hover:shadow-2xl hover:bg-indigo-50 active:scale-[0.97] transition-all duration-300"
              >
                Get Started Free
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ TEAM ═══════════════════════ */}
      <section id="team" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-4">
              Engineering Team
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
              Meet the Builders
            </h2>
            <p className="text-slate-500">
              Computer Engineering students, guided by Prof R.P. Bagawade
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {TEAM.map((member, idx) => {
              const gradients = [
                "from-indigo-500 to-indigo-600",
                "from-teal-500 to-emerald-500",
                "from-rose-500 to-pink-500",
                "from-amber-500 to-orange-500",
              ];
              return (
                <div
                  key={idx}
                  className="group bg-white rounded-2xl border border-slate-100 p-7 text-center hover:shadow-lg hover:shadow-slate-200/40 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br ${gradients[idx]} flex items-center justify-center text-2xl font-bold text-white shadow-lg group-hover:scale-105 transition-transform duration-200`}>
                    {member.name.charAt(0)}
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">
                    {member.name}
                  </h4>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {member.role}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
      <footer className="relative bg-slate-900 text-slate-400 overflow-hidden">
        {/* Gradient top border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-teal-400 to-indigo-600" />

        {/* Decorative background glow */}
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-teal-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 pt-14 pb-8">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-white tracking-tight leading-tight">
                    Medi<span className="text-indigo-400">Sense</span>
                  </span>
                  <span className="text-[9px] font-bold tracking-[0.15em] uppercase leading-none mt-0.5">
                    <span className="text-indigo-400">Predict</span>
                    <span className="text-slate-600 mx-0.5">›</span>
                    <span className="text-teal-400">Prevent</span>
                    <span className="text-slate-600 mx-0.5">›</span>
                    <span className="text-emerald-400">Cure</span>
                  </span>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-3">
                An AI-driven clinical decision support and disease prediction
                decision support system. Final Year Engineering Project.
              </p>
              <p className="text-xs font-bold tracking-widest uppercase">
                <span className="text-indigo-400">Predict</span>
                <span className="text-slate-600 mx-1.5">›</span>
                <span className="text-teal-400">Prevent</span>
                <span className="text-slate-600 mx-1.5">›</span>
                <span className="text-emerald-400">Cure</span>
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                Platform
              </h5>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link to="/login" className="hover:text-white transition-colors duration-200 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-indigo-500" />
                    Login
                  </Link>
                </li>
                <li>
                  <a href="#diseases" className="hover:text-white transition-colors duration-200 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-teal-500" />
                    Disease Modules
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors duration-200 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-indigo-500" />
                    Features
                  </a>
                </li>
              </ul>
            </div>

            {/* Tech Stack */}
            <div>
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                Tech Stack
              </h5>
              <div className="flex flex-wrap gap-2">
                {["React", "Flask", "TensorFlow", "Tailwind", "scikit-learn", "jsPDF"].map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Project Info */}
            <div>
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                Project Guide
              </h5>
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                <p className="text-sm text-slate-300 font-medium mb-1">
                  Prof R.P. Bagawade
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Department of Computer Engineering
                </p>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-slate-500">
              © 2026 MediSense — All rights reserved
            </p>
            <p className="text-xs text-slate-600">
              Developed with ❤️ by Pradhumnya Changdev Kalsait & Team
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
