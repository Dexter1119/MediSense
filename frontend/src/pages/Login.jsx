////////////////////////////////////////////////////////////////////
//
// File Name : Login.jsx
// Description : Authentication page with Sign In / Sign Up (Redesigned)
// Author      : Pradhumnya Changdev Kalsait
// Date        : 17/01/26
//
////////////////////////////////////////////////////////////////////

import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { AuthContext } from "../context/AuthContext";
import {
  Activity,
  HeartPulse,
  Brain,
  Stethoscope,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

function Login() {
  const [isSignIn, setIsSignIn] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      if (!isSignIn && password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const endpoint = isSignIn ? "/auth/login" : "/auth/register";

      const response = await axiosInstance.post(endpoint, {
        email,
        password,
      });

      if (isSignIn) {
        const token =
          response.data.access_token ||
          response.data.token ||
          response.data.accessToken;

        if (!token) {
          throw new Error("JWT token missing");
        }

        login(token);
        navigate("/dashboard");
      } else {
        setIsSignIn(true);
      }
    } catch (error) {
      setErrorMessage(
        error.message || "Authentication failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-appbg">

      {/* ═══════════════════════ LEFT PANEL — ANIMATED BRANDING ═══════════════════════ */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">

        {/* Animated gradient background */}
        <div
          className="absolute inset-0 animate-gradient-drift"
          style={{
            background: "linear-gradient(135deg, #4F46E5 0%, #4338CA 25%, #14B8A6 50%, #4F46E5 75%, #5EEAD4 100%)",
            backgroundSize: "200% 200%",
          }}
        />

        {/* Floating orbs */}
        <div className="absolute top-[10%] left-[15%] w-40 h-40 bg-white/10 rounded-full blur-2xl animate-float-slow" />
        <div className="absolute top-[55%] right-[10%] w-56 h-56 bg-teal-300/15 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-[15%] left-[25%] w-32 h-32 bg-indigo-300/20 rounded-full blur-2xl animate-float-slow" style={{ animationDelay: "2s" }} />
        <div className="absolute top-[30%] right-[30%] w-24 h-24 bg-white/8 rounded-full blur-xl animate-float-delayed" style={{ animationDelay: "1s" }} />

        {/* Morphing blob decoration */}
        <div
          className="absolute top-[20%] right-[8%] w-72 h-72 bg-gradient-to-br from-white/10 to-teal-200/10 animate-morph-blob"
        />

        {/* Spinning ring */}
        <div className="absolute bottom-[20%] right-[15%] w-48 h-48 border-2 border-white/10 rounded-full animate-spin-slow" />
        <div className="absolute bottom-[23%] right-[18%] w-36 h-36 border border-white/8 rounded-full animate-spin-slow" style={{ animationDirection: "reverse" }} />

        {/* Geometric shapes */}
        <div className="absolute top-[40%] left-[8%] w-20 h-20 border-2 border-white/15 rounded-2xl rotate-12 animate-pulse-ring" />
        <div className="absolute top-[15%] right-[25%] w-14 h-14 bg-white/8 rounded-xl rotate-45 animate-float-delayed" style={{ animationDelay: "3s" }} />
        <div className="absolute bottom-[35%] left-[50%] w-10 h-10 border-2 border-white/12 rounded-full animate-pulse-ring" style={{ animationDelay: "2s" }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white w-full">

          {/* Logo */}
          <div className="animate-stagger-1">
            <Link to="/" className="inline-flex items-center gap-3 mb-12 group">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold tracking-tight leading-tight">
                  Medi<span className="text-teal-200">Sense</span>
                </span>
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase leading-none mt-0.5">
                  <span className="text-indigo-200">Predict</span>
                  <span className="text-white/30 mx-0.5">›</span>
                  <span className="text-teal-200">Prevent</span>
                  <span className="text-white/30 mx-0.5">›</span>
                  <span className="text-emerald-200">Cure</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Heading */}
          <div className="animate-stagger-2">
            <h2 className="text-5xl font-extrabold leading-[1.1] mb-6">
              AI-Powered
              <br />
              <span className="bg-gradient-to-r from-teal-200 to-emerald-200 bg-clip-text text-transparent">
                Disease Risk
              </span>
              <br />
              Prediction
            </h2>
          </div>

          {/* Tagline pill */}
          <div className="animate-stagger-3 mb-6">
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-sm font-bold tracking-wide">
              <span className="text-indigo-200">Predict</span>
              <span className="text-white/30">›</span>
              <span className="text-teal-200">Prevent</span>
              <span className="text-white/30">›</span>
              <span className="text-emerald-200">Cure</span>
            </div>
          </div>

          {/* Description */}
          <div className="animate-stagger-3">
            <p className="text-white/75 text-lg leading-relaxed max-w-md mb-10">
              An intelligent clinical decision-support platform for early
              detection, severity assessment, and treatment planning.
            </p>
          </div>

          {/* Organ pills */}
          <div className="flex flex-wrap gap-3 animate-stagger-4">
            {[
              { icon: <Activity size={16} />, label: "Lung", color: "from-sky-400/30 to-sky-500/20" },
              { icon: <HeartPulse size={16} />, label: "Heart", color: "from-rose-400/30 to-rose-500/20" },
              { icon: <Brain size={16} />, label: "Kidney", color: "from-emerald-400/30 to-emerald-500/20" },
              { icon: <Stethoscope size={16} />, label: "Liver", color: "from-amber-400/30 to-amber-500/20" },
            ].map((organ, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r ${organ.color} backdrop-blur-md rounded-2xl text-sm font-semibold border border-white/15 hover:border-white/30 hover:scale-105 transition-all duration-300`}
              >
                {organ.icon}
                {organ.label}
              </span>
            ))}
          </div>

          {/* Trust badge */}
          <div className="mt-14 animate-stagger-5">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2.5">
                {["P", "A", "O", "A"].map((initial, idx) => (
                  <div
                    key={idx}
                    className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm border-2 border-white/25 flex items-center justify-center text-xs font-bold text-white shadow-sm"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-white/90 text-sm font-semibold">C.E. Engineering Team</p>
                <p className="text-white/50 text-xs">Guided by Prof R.P. Bagawade</p>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-10 grid grid-cols-3 gap-4 animate-stagger-6">
            {[
              { value: "4", label: "Modules" },
              { value: "95%", label: "Accuracy" },
              { value: "20+", label: "Parameters" },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-white/8 backdrop-blur-sm rounded-2xl px-4 py-3.5 text-center border border-white/10"
              >
                <div className="text-xl font-extrabold text-teal-200">{stat.value}</div>
                <div className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════ RIGHT PANEL — FORM ═══════════════════════ */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 relative">

        {/* Background decorative blurs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-100/40 to-teal-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-teal-100/30 to-indigo-100/20 rounded-full blur-3xl" />

        <div className="relative w-full max-w-[440px]">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8 animate-stagger-1">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-teal-400 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-2xl font-bold text-textprimary tracking-tight leading-tight">
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
          </div>

          {/* ═══════════ GLASSMORPHISM CARD ═══════════ */}
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-xl shadow-indigo-500/5 border border-white/80 p-8 sm:p-10">

            {/* ═══════════ ANIMATED TABS ═══════════ */}
            <div className="relative bg-slate-100/80 rounded-2xl p-1.5 mb-8 animate-stagger-1">
              {/* Sliding indicator */}
              <div
                className="absolute top-1.5 h-[calc(100%-12px)] w-[calc(50%-6px)] bg-white rounded-xl shadow-lg shadow-indigo-500/10 transition-all duration-500 ease-out"
                style={{
                  left: isSignIn ? "6px" : "calc(50% + 0px)",
                }}
              />
              <div className="relative flex">
                <button
                  onClick={() => setIsSignIn(true)}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors duration-300 z-10 ${
                    isSignIn ? "text-primary" : "text-textsecondary hover:text-textprimary"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsSignIn(false)}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors duration-300 z-10 ${
                    !isSignIn ? "text-primary" : "text-textsecondary hover:text-textprimary"
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* ═══════════ FORM ═══════════ */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Heading */}
              <div className="animate-stagger-2">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-teal-500/10 border border-indigo-100 flex items-center justify-center">
                    {isSignIn ? (
                      <ShieldCheck size={20} className="text-primary" />
                    ) : (
                      <ArrowRight size={20} className="text-secondary" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-textprimary">
                      {isSignIn ? "Welcome Back" : "Get Started"}
                    </h2>
                  </div>
                </div>
                <p className="mt-2 text-textsecondary text-sm">
                  {isSignIn
                    ? "Sign in to access your MediSense dashboard"
                    : "Create your account to start using MediSense"}
                </p>
              </div>

              {/* Error message */}
              {errorMessage && (
                <div className="flex items-center gap-2.5 bg-red-50 text-red-600 border border-red-200 px-4 py-3 rounded-xl text-sm font-medium animate-shake">
                  <span className="flex-shrink-0">⚠️</span>
                  {errorMessage}
                </div>
              )}

              {/* Email field */}
              <div className="animate-stagger-3 group">
                <label className="block text-sm font-semibold text-textprimary mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors duration-200">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-slate-200 bg-white/80 text-textprimary placeholder:text-textmuted focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all duration-300"
                    placeholder="doctor@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="animate-stagger-4 group">
                <label className="block text-sm font-semibold text-textprimary mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors duration-200">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-slate-200 bg-white/80 text-textprimary placeholder:text-textmuted focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all duration-300"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Confirm Password (sign up only) */}
              {!isSignIn && (
                <div className="animate-slide-up group">
                  <label className="block text-sm font-semibold text-textprimary mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors duration-200">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-slate-200 bg-white/80 text-textprimary placeholder:text-textmuted focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all duration-300"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Submit button with shimmer */}
              <div className="animate-stagger-5">
                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-teal-500 text-white font-semibold text-base tracking-wide shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group"
                >
                  {/* Shimmer overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />

                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {isSignIn ? "Sign In" : "Create Account"}
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
                      </>
                    )}
                  </span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative py-2 animate-stagger-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-white/70 text-sm text-textsecondary rounded-full">
                    {isSignIn ? "New to MediSense?" : "Already have an account?"}
                  </span>
                </div>
              </div>

              {/* Toggle link */}
              <div className="animate-stagger-6">
                <button
                  type="button"
                  onClick={() => setIsSignIn(!isSignIn)}
                  className="w-full py-3 rounded-xl border-2 border-slate-200 text-textsecondary font-semibold text-sm hover:border-primary hover:text-primary hover:bg-primary-light/30 active:scale-[0.98] transition-all duration-300"
                >
                  {isSignIn ? "Create a new account" : "Sign in instead"}
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-textmuted animate-stagger-6">
            © 2026 MediSense · <span className="font-semibold"><span className="text-indigo-400">Predict</span> › <span className="text-teal-400">Prevent</span> › <span className="text-emerald-400">Cure</span></span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
