import type { Metadata } from "next";
import { Archivo, Manrope } from "next/font/google";
import { TechShell } from "@/components/tech/TechShell";
import { ThemeBoot } from "@/components/tech/ThemeBoot";
import { line } from "@/config/prokom";
import { themeScript } from "@/lib/tech/theme";
import { ClientGate } from "./ClientGate";
// PRO-KOM Tech skin for the client account (docs/tech/WYJATKI.md, 15.11): the same
// scoped stylesheets as the public site (every rule under `.tech`) plus the account layer.
import "../(public)/tech.css";
import "../(public)/tech-theme.css";
import "../(public)/tech-motion.css";
import "../(public)/tech-nav.css";
import "../(public)/tech-rail.css";
import "./client-tech.css";
import "./client-tech-konto.css";

// Same faces as app/(public)/layout.tsx (SPEC §3); the fallback face lives in tech.css.
const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Archivo Tech Fallback", "Arial", "sans-serif"],
});
const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: { absolute: `Konto klienta | ${line.name}`, template: `%s | ${line.name}` },
  robots: { index: false, follow: true },
  icons: {
    icon: [
      { url: "/tech/pwa/favicon.svg", type: "image/svg+xml" },
      { url: "/tech/pwa/favicon.ico", sizes: "16x16 32x32 48x48" },
    ],
    apple: [{ url: "/tech/pwa/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const techClass = `tech ${archivo.variable} ${manrope.variable}`;
  return (
    <>
      {/* Public theme (data-tech-theme / pk-theme) — never touches data-theme of the staff panels. */}
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <ThemeBoot />
      {/* The whole account (sign-in and logged-in screens) lives in the Tech shell. */}
      <div className={techClass}>
        <TechShell>
          <ClientGate>{children}</ClientGate>
        </TechShell>
      </div>
    </>
  );
}
