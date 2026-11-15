import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Archivo, Manrope } from "next/font/google";
import { TechShell } from "@/components/tech/TechShell";
import { SwRegister } from "@/components/tech/SwRegister";
import { ThemeBoot } from "@/components/tech/ThemeBoot";
import { line, servicePoints } from "@/config/prokom";
import { jsonLdString, siteJsonLd } from "@/lib/tech/jsonld";
import { publishedPoints } from "@/lib/tech/points";
import { MANIFEST_PATH, THEME_DARK, THEME_LIGHT } from "@/lib/tech/pwa";
import { themeScript } from "@/lib/tech/theme";
import { SITE_URL } from "@/lib/site-config";
import "./tech.css";
import "./tech-theme.css";
import "./tech-motion.css";
import "./tech-nav.css";
import "./tech-wizard.css";
import "./tech-pages.css";

// Public-site fonts only (SPEC §3). Panels keep DM Sans / Unbounded from the root layout.
// Fallback tuned to Archivo at font-stretch 108% (the default Arial fallback is ~20% narrower,
// so headings re-wrapped when the font arrived — CLS up to 0.14). Faces in tech.css.
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

const published = publishedPoints(servicePoints);
const cities = published.map((p) => p.city).join(" i ");
const defaultTitle = `Serwis telefonów i komputerów — ${cities} | ${line.name}`;
const description =
  published.length > 1
    ? `${line.name} — serwis telefonów, laptopów, tabletów, konsol i drukarek: ${cities}. Wycena przed naprawą, gwarancja i status naprawy online.`
    : `${line.name} — serwis telefonów, laptopów, tabletów, komputerów, konsol i drukarek w Rabce-Zdroju. Wycena przed naprawą, gwarancja i status naprawy online.`;

// Public defaults live here, not in the root layout: most panel pages inherit the root
// title, and the panels must stay unchanged (SPEC §2).
export const metadata: Metadata = {
  title: { default: defaultTitle, template: `%s | ${line.name}` },
  description,
  applicationName: line.name,
  authors: [{ name: line.name, url: SITE_URL }],
  creator: line.name,
  publisher: line.name,
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: SITE_URL,
    siteName: line.name,
    title: defaultTitle,
    description,
    images: [{ url: "/images/og-prokom.jpg", width: 1200, height: 630, alt: line.name }],
  },
  twitter: { card: "summary_large_image", title: defaultTitle, description },
  // PWA only on public pages (SPEC §12.2): manifest, iOS meta, apple-touch-icon.
  // Favicon and icons from the PRO-KOM TECH brand book (03_ikony/tech); panels keep app/icon.svg.
  manifest: MANIFEST_PATH,
  appleWebApp: { capable: true, title: line.name, statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: "/tech/pwa/favicon.svg", type: "image/svg+xml" },
      { url: "/tech/pwa/favicon.ico", sizes: "16x16 32x32 48x48" },
    ],
    apple: [{ url: "/tech/pwa/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_LIGHT },
    { media: "(prefers-color-scheme: dark)", color: THEME_DARK },
  ],
};

const umamiId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
// Served through the shared Nginx like prokom-web (SPEC §12.5).
const umamiSrc = process.env.NEXT_PUBLIC_UMAMI_SRC || "/_s/script.js";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* First element: sets data-tech-theme before anything paints (no flash). */}
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(siteJsonLd()) }} />
      {umamiId ? <script defer src={umamiSrc} data-website-id={umamiId} data-tech-umami="" /> : null}
      <ThemeBoot />
      <SwRegister />
      <div className={`tech ${archivo.variable} ${manrope.variable}`}>
        {/* Old pages render inside the new shell until TD2–TD5 rebuild them (ConditionalPublicLayout stays until TD6). */}
        <TechShell>{children}</TechShell>
      </div>
    </>
  );
}
