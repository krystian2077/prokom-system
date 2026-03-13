import type { Config } from "tailwindcss";

/** PRO-KOM premium: primary #e11d1d, dark #0f0f0f, neutral #6b7280 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/(public)/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./sections/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        zgl: "860px",
      },
      colors: {
        primary: "#e11d1d",
        dark: "#0f0f0f",
        neutral: "#6b7280",
        prokom: {
          white: "#ffffff",
          black: "#0f0f0f",
          accent: "#e11d1d",
          gray: "#6b7280",
          success: "#16a34a",
          warning: "#ea580c",
          error: "#dc2626",
          info: "#2563eb",
        },
        zgl: {
          red: "#e02020",
          "red-h": "#c51a1a",
          "red-glow": "rgba(224,32,32,.25)",
          "red-l": "rgba(224,32,32,.10)",
          "red-border": "rgba(224,32,32,.30)",
          dark: "#0b0c10",
          dark2: "#11131a",
          card: "#171921",
          card2: "#1c1f28",
          card3: "#21252f",
          white: "#ffffff",
          ink: "#cdd0d8",
          ink2: "#9ba3b0",
          muted: "#5c6474",
          faint: "#2e323d",
          border: "rgba(255,255,255,.065)",
          border2: "rgba(255,255,255,.11)",
          "border-r": "rgba(224,32,32,.28)",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        syne: ["var(--font-syne)", "system-ui", "sans-serif"],
        unbounded: ["var(--font-unbounded)", "system-ui", "sans-serif"],
        "plus-jakarta": ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
        card: "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)",
      },
      borderRadius: {
        "zgl-card": "22px",
        "zgl-field": "12px",
        "zgl-pill": "9999px",
      },
      keyframes: {
        stepIn: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "none" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.2" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        ring: {
          "0%": { transform: "scale(0.8)", opacity: "0.55" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        scaleX: {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        lineGrow: {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
      },
      animation: {
        "step-in": "stepIn 0.28s ease both",
        float: "float 4s ease-in-out infinite",
        blink: "blink 1.6s infinite",
        fadeUp: "fadeUp 0.7s ease both",
        "fade-up": "fadeUp 0.55s ease both",
        "fade-up-d": "fadeUp 0.55s 0.12s ease both",
        ring: "ring 1.4s ease-out infinite",
        scaleX: "scaleX 0.8s ease both",
        "line-grow": "lineGrow 0.3s ease forwards",
      },
    },
  },
  plugins: [],
};

export default config;
