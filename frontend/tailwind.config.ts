import type { Config } from "tailwindcss";

/** PRO-KOM premium: primary #e11d1d, dark #0f0f0f, neutral #6b7280 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./sections/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
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
      },
      fontFamily: {
        sans: ["system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
        card: "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
