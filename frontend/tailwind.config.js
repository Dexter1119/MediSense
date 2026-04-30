////////////////////////////////////////////////////////////////////
//
// File Name : tailwind.config.js
// Description : Centralized Tailwind theme configuration
// Author      : Pradhumnya Changdev Kalsait
// Date        : 17/01/26
//
////////////////////////////////////////////////////////////////////

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ================= BRAND COLORS ================= */
        primary: {
          DEFAULT: "#4F46E5", // indigo-600
          dark: "#4338CA",    // indigo-700
          light: "#EEF2FF",   // indigo-50
        },

        secondary: {
          DEFAULT: "#14B8A6", // teal-500
          dark: "#0D9488",    // teal-600
          light: "#CCFBF1",   // teal-100
        },

        accent: {
          DEFAULT: "#5EEAD4", // teal-300 mint
          dark: "#2DD4BF",    // teal-400
          glow: "rgba(94, 234, 212, 0.15)",
        },

        /* ================= STATUS COLORS ================= */
        success: "#10B981",   // emerald-500
        warning: "#F59E0B",   // amber-500
        danger: "#EF4444",    // red-500
        info: "#06B6D4",      // cyan-500

        /* ================= BACKGROUND ================= */
        appbg: "#F0FDFA",     // teal-50 (mint white)
        cardbg: "#FFFFFF",
        cardborder: "#99F6E4", // teal-200

        /* ================= TEXT ================= */
        textprimary: "#1E293B",   // slate-800
        textsecondary: "#64748B", // slate-500
        textmuted: "#CBD5E1",     // slate-300
      },

      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },

      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(79,70,229,0.06)",
        "card-hover": "0 8px 30px rgba(79,70,229,0.12), 0 2px 8px rgba(0,0,0,0.04)",
        glow: "0 0 20px rgba(94,234,212,0.25)",
        "glow-indigo": "0 0 20px rgba(79,70,229,0.2)",
      },

      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },

      backgroundImage: {
        "mint-gradient": "linear-gradient(135deg, #F0FDFA 0%, #EEF2FF 100%)",
        "hero-glow": "radial-gradient(60% 50% at 50% 0%, rgba(79,70,229,0.08) 0%, rgba(94,234,212,0.05) 50%, transparent 100%)",
      },
    },
  },
  plugins: [],
};
