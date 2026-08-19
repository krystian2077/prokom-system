"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { API_V1 } from "@/lib/api";

const OFFERTA_IMG = "/images/ofertapng";

/* Ikony kategorii — kolorowe inline SVG */
function CatIconPhone({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none">
      <rect x="10" y="4" width="20" height="32" rx="4" fill="#1a1a2e" stroke="#6366f1" strokeWidth="1.5" />
      <rect x="12" y="8" width="16" height="22" rx="2" fill="url(#phone-screen)" />
      <circle cx="20" cy="34" r="2" fill="#6366f1" />
      <defs>
        <linearGradient id="phone-screen" x1="12" y1="8" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818cf8" stopOpacity="0.4" />
          <stop offset="0.5" stopColor="#a78bfa" stopOpacity="0.3" />
          <stop offset="1" stopColor="#6366f1" stopOpacity="0.2" />
        </linearGradient>
      </defs>
    </svg>
  );
}
function CatIconTablet({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none">
      <rect x="6" y="4" width="28" height="32" rx="3" fill="#1e293b" stroke="#f87171" strokeWidth="1.5" />
      <rect x="8" y="8" width="24" height="22" rx="2" fill="url(#tablet-screen)" />
      <circle cx="20" cy="34" r="1.5" fill="#f87171" />
      <defs>
        <linearGradient id="tablet-screen" x1="8" y1="8" x2="32" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22c55e" stopOpacity="0.5" />
          <stop offset="1" stopColor="#16a34a" stopOpacity="0.3" />
        </linearGradient>
      </defs>
    </svg>
  );
}
function CatIconLaptopOpen({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none">
      <path d="M4 12h32v14a2 2 0 01-2 2H6a2 2 0 01-2-2V12z" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="6" y="14" width="28" height="10" rx="1" fill="url(#laptop-screen)" />
      <path d="M2 26h36v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2z" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.5" />
      <defs>
        <linearGradient id="laptop-screen" x1="6" y1="14" x2="34" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60a5fa" stopOpacity="0.5" />
          <stop offset="1" stopColor="#3b82f6" stopOpacity="0.3" />
        </linearGradient>
      </defs>
    </svg>
  );
}
function CatIconLaptopClosed({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none">
      <rect x="4" y="10" width="32" height="22" rx="2" fill="#1e3a5f" stroke="#0ea5e9" strokeWidth="1.5" />
      <path d="M2 30h36v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2z" fill="#0c4a6e" stroke="#0ea5e9" strokeWidth="1.5" />
      <rect x="8" y="14" width="24" height="2" rx="0.5" fill="#0ea5e9" fillOpacity="0.5" />
    </svg>
  );
}
function CatIconController({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none">
      <path d="M8 12h24a3 3 0 013 3v10a3 3 0 01-3 3H8a3 3 0 01-3-3V15a3 3 0 013-3z" fill="#312e81" stroke="#8b5cf6" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="14" cy="20" r="3" fill="#a78bfa" />
      <circle cx="26" cy="18" r="1.5" fill="#c4b5fd" />
      <circle cx="26" cy="22" r="1.5" fill="#c4b5fd" />
      <rect x="22" y="19" width="2" height="2" rx="0.5" fill="#c4b5fd" />
      <path d="M12 28h4v2h-4zM24 28h4v2h-4z" fill="#8b5cf6" />
    </svg>
  );
}
function CatIconTower({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none">
      <rect x="14" y="4" width="12" height="6" rx="1.5" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.5" />
      <rect x="16" y="12" width="8" height="3" rx="0.5" fill="#3b82f6" fillOpacity="0.6" />
      <rect x="14" y="18" width="12" height="18" rx="2" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.5" />
      <circle cx="20" cy="24" r="2" fill="#60a5fa" fillOpacity="0.8" />
      <rect x="18" y="28" width="4" height="4" rx="0.5" fill="#3b82f6" fillOpacity="0.4" />
    </svg>
  );
}
function CatIconPrinter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none">
      <rect x="10" y="6" width="20" height="10" rx="2" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
      <path d="M8 16v12a2 2 0 002 2h20a2 2 0 002-2V16" stroke="#64748b" strokeWidth="1.5" fill="none" />
      <rect x="10" y="22" width="20" height="10" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
      <rect x="14" y="8" width="4" height="2" rx="0.5" fill="#22c55e" />
      <circle cx="20" cy="27" r="1.5" fill="#64748b" />
    </svg>
  );
}
function CatIconMonitor({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none">
      <rect x="4" y="6" width="32" height="20" rx="2" fill="#0f172a" stroke="#0ea5e9" strokeWidth="1.5" />
      <rect x="6" y="8" width="28" height="14" rx="1" fill="url(#monitor-screen)" />
      <path d="M10 30h20v2a2 2 0 01-2 2H12a2 2 0 01-2-2v-2z" fill="#0c4a6e" stroke="#0ea5e9" strokeWidth="1.5" />
      <line x1="20" y1="24" x2="20" y2="30" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="monitor-screen" x1="6" y1="8" x2="34" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#06b6d4" stopOpacity="0.4" />
          <stop offset="0.5" stopColor="#8b5cf6" stopOpacity="0.3" />
          <stop offset="1" stopColor="#0ea5e9" stopOpacity="0.4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

type BrandTab = "samsung" | "iphone" | "xiaomi";

export function OfertaContent() {
  const [brand, setBrand] = useState<BrandTab>("samsung");
  const [formSent, setFormSent] = useState(false);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [interestOpen, setInterestOpen] = useState(false);
  const [interestValue, setInterestValue] = useState("");

  const INTEREST_OPTIONS = ["Smartfon Samsung", "Smartfon iPhone", "Smartfon Xiaomi", "Tablet iPad", "Tablet Samsung", "Laptop poleasingowy", "Laptop biznesowy", "Laptop gamingowy", "Komputer poleasingowy", "Komputer biznesowy", "Komputer gamingowy", "Drukarka", "Inne"];

  return (
    <div className="oferta-page min-h-screen font-[family-name:var(--font-plus-jakarta)]" style={{ maxWidth: "100vw", overflowX: "hidden" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .oferta-page { --red: #dc1e1e; --red-h: #b81818; --red-l: rgba(220,30,30,.08); --red-border: rgba(220,30,30,.22);
          --dark: #09090d; --dark2: #11131b; --dark3: #181b25; --bg: #f2f2f0; --bg2: #ebebea; --white: #ffffff;
          --text: #0f0f0f; --text2: #444444; --muted: #888888; --faint: #cccccc; --border: #e2e2e0; --border2: #cccccc;
          --ease: cubic-bezier(.25,.8,.25,1); --spring: cubic-bezier(.34,1.56,.64,1); }
        @keyframes fadeUp { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:none} }
        @keyframes scaleIn { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes ringPulse { 0%{box-shadow:0 0 0 0 rgba(220,30,30,.4)} 70%{box-shadow:0 0 0 14px rgba(220,30,30,0)} 100%{box-shadow:0 0 0 0 rgba(220,30,30,0)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes rgbPulse { 0%{background:rgba(220,30,30,.6);box-shadow:0 0 8px rgba(220,30,30,.5)} 33%{background:rgba(100,0,255,.6);box-shadow:0 0 8px rgba(100,0,255,.5)} 66%{background:rgba(0,180,255,.6);box-shadow:0 0 8px rgba(0,180,255,.5)} 100%{background:rgba(220,30,30,.6);box-shadow:0 0 8px rgba(220,30,30,.5)} }
      ` }} />

      {/* 1. HERO */}
      <section
        className="oferta-hero relative overflow-hidden bg-[#09090d] pt-[62px] min-h-[96vh] max-lg:min-h-0 flex flex-col"
        style={{ paddingTop: 62 }}
      >
        {/* Background effects — visible on both mobile and desktop */}
        <div
          className="absolute -top-20 right-0 w-[500px] h-[500px] max-lg:w-[280px] max-lg:h-[280px] max-lg:-top-10 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(220,30,30,.12), transparent 65%)" }}
        />
        <div
          className="absolute -bottom-20 left-0 w-[400px] h-[400px] max-lg:w-[200px] max-lg:h-[200px] max-lg:-bottom-10 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(100,0,255,.08), transparent 65%)" }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.015) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse 100% 80% at 60% 40%, black 15%, transparent 80%)",
          }}
        />
        {/* Animated floating accent dots — mobile only */}
        <div className="absolute top-24 right-8 h-2 w-2 rounded-full lg:hidden" style={{ background: "#e11d1d", animation: "float 3s ease-in-out infinite", opacity: 0.6 }} />
        <div className="absolute top-44 left-6 h-1.5 w-1.5 rounded-full lg:hidden" style={{ background: "#8b5cf6", animation: "float 4s ease-in-out infinite 1s", opacity: 0.5 }} />
        <div className="absolute bottom-28 right-12 h-1 w-1 rounded-full lg:hidden" style={{ background: "#3b82f6", animation: "float 3.5s ease-in-out infinite 0.5s", opacity: 0.4 }} />

        <div className="oferta-hero-inner mx-auto w-full max-w-[1300px] flex-1 grid lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-[60px] items-center px-5 py-10 max-lg:justify-items-center max-lg:py-8 sm:px-8 sm:py-20 lg:px-[52px] lg:pt-20 lg:pb-16">
          <div className="flex w-full flex-col gap-3 max-lg:mx-auto max-lg:max-w-[360px] max-lg:items-center max-lg:text-center lg:gap-6" style={{ animation: "fadeUp .7s ease both" }}>
            <div className="flex items-center gap-2 max-lg:flex-wrap max-lg:justify-center">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[var(--red)] shrink-0"
                style={{ animation: "ringPulse 2s infinite" }}
              />
              <span className="text-center text-[10px] uppercase tracking-[0.22em] text-[#9ca3af] max-lg:text-[9px] max-lg:tracking-[0.16em]">Sklep i sprzęt — Rabka-Zdrój</span>
            </div>
            <h1 className="font-[family-name:var(--font-dm-sans)] font-extrabold leading-[1.08] tracking-[-0.055em] text-white lg:text-left" style={{ fontSize: "clamp(32px, 8vw, 88px)" }}>
              Najlepszy
              <br />
              <span className="bg-gradient-to-r from-red-500 via-red-400 to-rose-500 bg-clip-text text-transparent">sprzęt.</span>
              <span className="block mt-1">Blisko Ciebie.</span>
            </h1>
            <p className="text-[15px] text-[#8892a6] max-lg:max-w-[34ch] max-lg:text-[#9ca3af] leading-[1.7] max-w-full lg:max-w-[440px] lg:text-left">
              Najnowsze smartfony, tablety, laptopy i komputery poleasingowe. Certyfikowany partner Amso. Sprzęt gamingowy i biznesowy — wszystko pod jednym dachem.
            </p>
            <div className="hero-ctas mt-3 flex flex-col gap-2.5 max-lg:w-full max-lg:items-center sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 lg:mt-0">
              <Link href="#formularz" className="btn-primary inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[#e11d1d] px-8 py-3 text-[14px] font-bold text-white shadow-[0_4px_24px_rgba(225,29,29,0.45)] transition-all active:scale-[0.97] hover:bg-[#b81818] max-lg:max-w-[320px] sm:w-auto sm:px-7 sm:text-[15px] lg:min-h-[44px] lg:rounded-xl lg:px-5 lg:py-3">
                Zapytaj o ofertę →
              </Link>
              <Link href="#kategorie" className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-8 py-3 text-[14px] font-bold text-white/90 backdrop-blur-sm transition-all active:scale-[0.97] hover:border-[#e11d1d] hover:bg-white/10 max-lg:max-w-[320px] sm:w-auto sm:px-7 sm:text-[15px] lg:min-h-[44px] lg:rounded-xl lg:px-5 lg:py-3">
                Zobacz asortyment
              </Link>
            </div>

            {/* Mobile product showcase */}
            <div className="mt-6 flex w-full gap-3 overflow-x-auto pb-2 scrollbar-none lg:hidden" style={{ animation: "fadeUp .7s .4s ease both" }}>
              {[
                { img: "s26ultra.png", name: "Galaxy S26 Ultra", tag: "Nowość" },
                { img: "AppleWhite Phone17.png", name: "iPhone 17", tag: "Nowość" },
                { img: "lenovolegion.png", name: "Legion Gaming", tag: "Gaming" },
                { img: "dell-amso.png", name: "Dell Poleasingowy", tag: "Amso" },
              ].map((d) => (
                <Link key={d.name} href="#kategorie" className="group relative flex h-[140px] w-[120px] shrink-0 flex-col items-center justify-end overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-2 backdrop-blur-sm transition-all active:scale-95">
                  <div className="relative mb-1 h-[80px] w-[70px]" style={{ animation: "float 4s ease-in-out infinite" }}>
                    <Image src={`${OFFERTA_IMG}/${encodeURIComponent(d.img)}`} alt={d.name} fill className="object-contain" sizes="70px" />
                  </div>
                  <span className="mb-0.5 rounded-full bg-white/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white/60">{d.tag}</span>
                  <span className="text-[10px] font-semibold leading-tight text-white/80">{d.name}</span>
                </Link>
              ))}
            </div>
          </div>
          <div
            className="hero-right hidden lg:grid gap-4 w-full mx-auto"
            style={{
              animation: "scaleIn .7s .1s ease both",
              gridTemplateColumns: "minmax(260px, 1fr) minmax(260px, 1fr)",
              gridTemplateRows: "1fr 1fr",
              minHeight: 520,
              maxWidth: 720,
            }}
          >
            <Link href="#smartfony" className="hs-cell relative min-h-[250px] rounded-tl-[24px] overflow-hidden bg-gradient-to-br from-[#1a1a4a] to-[#2d2d7a] group hover:scale-[1.02] hover:z-[2] transition-transform duration-300">
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="relative w-[180px] h-[240px]" style={{ animation: "float 4s ease infinite" }}>
                  <Image src={`${OFFERTA_IMG}/s26ultra.png`} alt="Samsung Galaxy S26 Ultra" fill className="object-contain object-center" sizes="180px" />
                </div>
              </div>
              <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white z-10 backdrop-blur-sm">Nowość 2026</span>
              <span className="absolute bottom-3 left-3 right-3 rounded-lg bg-black/30 px-3 py-2 text-[12px] font-medium text-white z-10 backdrop-blur-sm" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8), 0 0 1px rgba(0,0,0,0.5)" }}>Samsung Galaxy S26 Ultra</span>
            </Link>
            <Link href="#smartfony" className="hs-cell relative min-h-[250px] rounded-tr-[24px] overflow-hidden bg-gradient-to-br from-[#2a2a5a] to-[#1a1a3a] group hover:scale-[1.02] hover:z-[2] transition-transform duration-300">
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="relative w-[180px] h-[240px]" style={{ animation: "float 4.2s .2s ease infinite" }}>
                  <Image
                    src={`${OFFERTA_IMG}/${encodeURIComponent("AppleWhite Phone17.png")}`}
                    alt="iPhone 17"
                    fill
                    className="object-contain object-center"
                    sizes="180px"
                  />
                </div>
              </div>
              <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white z-10 backdrop-blur-sm">Nowość 2026</span>
              <span className="absolute bottom-3 left-3 right-3 rounded-lg bg-black/30 px-3 py-2 text-[12px] font-medium text-white z-10 backdrop-blur-sm" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8), 0 0 1px rgba(0,0,0,0.5)" }}>iPhone 17</span>
            </Link>
            <Link href="#biznesowe" className="hs-cell relative min-h-[250px] rounded-bl-[24px] overflow-hidden bg-gradient-to-br from-[#0f1a2e] to-[#162840] group hover:scale-[1.02] hover:z-[2] transition-transform duration-300">
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="relative w-[180px] h-[240px]" style={{ animation: "float 4.5s .1s ease infinite" }}>
                  <Image src={`${OFFERTA_IMG}/thinkcenterlenovoB.png`} alt="Lenovo ThinkCentre" fill className="object-contain object-center" sizes="180px" />
                </div>
              </div>
              <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white z-10 backdrop-blur-sm">Komputery biznesowe</span>
              <span className="absolute bottom-3 left-3 right-3 rounded-lg bg-black/30 px-3 py-2 text-[12px] font-medium text-white z-10 backdrop-blur-sm" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8), 0 0 1px rgba(0,0,0,0.5)" }}>ThinkCentre</span>
            </Link>
            <Link href="#laptopy-gamingowe" className="hs-cell relative min-h-[250px] rounded-br-[24px] overflow-hidden bg-gradient-to-br from-[#0a1628] to-[#0f2040] group hover:scale-[1.02] hover:z-[2] transition-transform duration-300">
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="relative w-[180px] h-[240px]" style={{ animation: "float 4.2s ease infinite" }}>
                  <Image src={`${OFFERTA_IMG}/asustufgaming.png`} alt="ASUS TUF Gaming" fill className="object-contain object-center" sizes="180px" />
                </div>
              </div>
              <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white z-10 backdrop-blur-sm">Laptopy gamingowe</span>
              <span className="absolute bottom-3 left-3 right-3 rounded-lg bg-black/30 px-3 py-2 text-[12px] font-medium text-white z-10 backdrop-blur-sm" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8), 0 0 1px rgba(0,0,0,0.5)" }}>ASUS TUF Gaming</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. KATEGORIE */}
      <section id="kategorie" className="bg-white border-b border-[var(--border)] section-padding py-14 lg:py-20 px-5 sm:px-8 lg:px-[52px]">
        <div className="mx-auto max-w-[1300px]">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-16 mb-10 lg:mb-14">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-0.5 w-8 rounded-full bg-[var(--red)] shrink-0" />
                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">Cały asortyment</p>
              </div>
              <h2 className="font-[family-name:var(--font-unbounded)] font-bold text-2xl sm:text-3xl lg:text-4xl text-[var(--text)]">
                Co znajdziesz <span style={{ color: "var(--red)" }}>u nas.</span>
              </h2>
            </div>
            <p className="text-[var(--text2)] text-base leading-relaxed">
              Szeroki wybór elektroniki nowej i poleasingowej. Doradzimy, dopasujemy, pomożemy wybrać.
            </p>
          </div>
          <div className="cat-grid grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { href: "#smartfony", name: "Smartfony", sub: "Samsung · iPhone · Xiaomi", iconBg: "bg-[#f3e8ff]", Icon: CatIconPhone },
              { href: "#tablety", name: "Tablety", sub: "iPad · Galaxy Tab", iconBg: "bg-[#fef2f2]", Icon: CatIconTablet },
              { href: "#poleasing", name: "Laptopy poleasingowe", sub: "Dell · Lenovo · HP", iconBg: "bg-[#eff6ff]", Icon: CatIconLaptopOpen },
              { href: "#laptopy-biz", name: "Laptopy biznesowe", sub: "EliteBook · ThinkPad · Latitude", iconBg: "bg-[#eff6ff]", Icon: CatIconLaptopClosed },
              { href: "#laptopy-gamingowe", name: "Laptopy gamingowe", sub: "ASUS · MSI · Lenovo", iconBg: "bg-[#f3e8ff]", Icon: CatIconController },
              { href: "#biznesowe", name: "Komputery biznesowe", sub: "OptiPlex · ThinkCentre · All-in-One", iconBg: "bg-[#eff6ff]", Icon: CatIconTower },
              { href: "#drukarki", name: "Drukarki", sub: "Do domu i biura", iconBg: "bg-[#eff6ff]", Icon: CatIconPrinter },
              { href: "#gaming", name: "Gaming PC", sub: "Składaki na zamówienie", iconBg: "bg-[#eff6ff]", Icon: CatIconMonitor },
            ].map((c) => (
              <Link
                key={c.href + c.name}
                href={c.href}
                className="cat-card relative block rounded-[20px] lg:rounded-[18px] min-h-[44px] p-5 sm:p-5 border border-slate-100 lg:border-[var(--border)] bg-white lg:bg-[var(--bg)] shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] lg:shadow-none hover:-translate-y-1 hover:border-[var(--red-border)] transition-all duration-300"
              >
                <span className={`inline-flex items-center justify-center w-11 h-11 lg:w-12 lg:h-12 rounded-xl mb-3 ${c.iconBg}`}>
                  <c.Icon className="w-7 h-7 lg:w-8 lg:h-8 shrink-0" />
                </span>
                <span className="font-[family-name:var(--font-unbounded)] font-bold text-[13px] lg:text-base text-[var(--text)] block">{c.name}</span>
                <span className="text-[12px] lg:text-[13px] text-[var(--muted)]">{c.sub}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SMARTFONY */}
      <section id="smartfony" className="bg-white lg:bg-[var(--bg)] border-b border-[var(--border)] section-padding py-14 lg:py-20 px-5 sm:px-8 lg:px-[52px]">
        <div className="mx-auto max-w-[1300px]">
          <div className="sm-head grid lg:grid-cols-2 gap-8 lg:gap-[52px] mb-10 lg:mb-14">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)] mb-2">Nowości 2025</p>
              <h2 className="font-[family-name:var(--font-unbounded)] font-bold text-2xl sm:text-3xl lg:text-4xl text-[var(--text)] mb-4">
                Najnowsze <span style={{ color: "var(--red)" }}>smartfony.</span>
              </h2>
              <p className="text-[var(--text2)] text-base leading-relaxed mb-6">
                Samsung Galaxy S26, iPhone 17, Xiaomi i Redmi — sprawdź dostępność i zapytaj o cenę. Wszystkie modele z gwarancją.
              </p>
              <div className="brand-tabs flex rounded-2xl lg:rounded-[14px] border border-slate-100 lg:border-[var(--border)] bg-white p-1 gap-0 w-fit shadow-[0_2px_8px_rgba(15,23,42,0.06)] lg:shadow-none">
                {(["samsung", "iphone", "xiaomi"] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBrand(b)}
                    className={`min-h-[44px] px-5 lg:px-4 py-2.5 rounded-xl lg:rounded-[11px] text-sm font-semibold transition-all ${
                      brand === b ? "bg-[var(--text)] text-white shadow-[0_2px_10px_rgba(0,0,0,.15)]" : "text-[var(--text2)] hover:bg-[var(--bg2)]"
                    }`}
                  >
                    {b === "samsung" ? "Samsung" : b === "iphone" ? "iPhone" : "Xiaomi"}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-[20px] lg:rounded-[18px] border border-slate-100 lg:border-[var(--border)] p-5 lg:p-6 shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] lg:shadow-none">
              <p className="font-[family-name:var(--font-unbounded)] font-bold text-[var(--text)] mb-4">Dlaczego warto kupić u nas</p>
              <ul className="space-y-3">
                {["Gwarancja i serwis w jednym miejscu", "Doradztwo bez wciskania", "Faktury VAT", "Partner Amso — pewny sprzęt"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 min-h-[44px]">
                    <span className="w-2 h-2 rounded-full bg-[var(--red)] shrink-0" />
                    <span className="text-[var(--text2)] text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="#formularz" className="mt-4 inline-block min-h-[44px] leading-[44px] text-[15px] font-semibold text-[var(--red)] hover:underline">
                Zapytaj o cenę →
              </Link>
            </div>
          </div>

          {/* Samsung panel — zdjęcia z ofertapng */}
          {brand === "samsung" && (
            <div className="phone-panels-grid grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
              {[
                { img: "s26ultra.png", brand: "Samsung Galaxy", name: "S26 Ultra", desc: "6.9\" AMOLED · S Pen · 200 MP · 5000 mAh", badge: "✦ Nowość 2026" },
                { img: "s26+.png", brand: "Samsung Galaxy", name: "S26+", desc: "6.7\" Dynamic AMOLED · 50 MP · 4900 mAh", badge: "✦ Nowość 2026" },
                { img: "s26.png", brand: "Samsung Galaxy", name: "S26", desc: "6.2\" AMOLED · 50 MP · 4000 mAh", badge: "✦ Nowość 2026" },
                { img: "a56.png", brand: "Samsung Galaxy", name: "A56", desc: "6.6\" Super AMOLED · 50 MP · 5000 mAh" },
                { img: "a36.png", brand: "Samsung Galaxy", name: "A36", desc: "6.6\" AMOLED · 50 MP · 5000 mAh" },
                { img: "a26.png", brand: "Samsung Galaxy", name: "A26", desc: "6.5\" AMOLED · 50 MP · 5000 mAh" },
                { img: "a16.png", brand: "Samsung Galaxy", name: "A16", desc: "6.7\" · 50 MP · 5000 mAh · Budżetowy hit" },
                { img: "A17.png", brand: "Samsung Galaxy", name: "A17", desc: "6.6\" · 50 MP · 5000 mAh" },
              ].map((p) => (
                <div key={p.name} className="product-card rounded-[20px] border border-slate-100 lg:border-[var(--border)] bg-white overflow-hidden shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] lg:shadow-none hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(0,0,0,.1)] transition-all duration-300">
                  <div className="pc-img min-h-[200px] lg:min-h-[280px] py-4 lg:py-6 relative bg-gradient-to-br from-[#090912] via-[#14143a] to-[#1e1e5a] flex items-center justify-center">
                    <div className="relative w-[100px] h-[160px] lg:w-[140px] lg:h-[220px] flex-shrink-0 px-1" style={{ animation: "float 4s ease infinite" }}>
                      <Image src={`${OFFERTA_IMG}/${p.img}`} alt={p.name} fill className="object-contain object-center" sizes="160px" priority={false} />
                    </div>
                  </div>
                  <div className="pc-body p-3 lg:p-4">
                    <p className="pc-brand text-[9px] lg:text-[9.5px] uppercase tracking-wider text-[var(--muted)]">{p.brand}</p>
                    <p className="font-[family-name:var(--font-unbounded)] font-black text-[12px] lg:text-[13px] text-[var(--text)]">{p.name}</p>
                    <p className="text-[10.5px] lg:text-[11.5px] text-[var(--muted)] mt-0.5 line-clamp-2">{p.desc}</p>
                    {p.badge && (
                      <span className="inline-block mt-2 rounded-full bg-[var(--red-l)] text-[var(--red)] border border-[var(--red-border)] px-2 lg:px-2.5 py-0.5 lg:py-1 text-[8px] lg:text-[9px] font-medium">
                        {p.badge}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {brand === "iphone" && (
            <div className="phone-panels-grid grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
              {[
                { img: "iPhone17 ProMax.png", name: "iPhone 17 Pro Max", desc: "6.9\" ProMotion · A19 Pro · Camera Control · Titanium", badge: "✦ Flagship" },
                { img: "AppleiPhone17Pro.png", name: "iPhone 17 Pro", desc: "6.3\" ProMotion · A19 Pro · 48 MP · Titanium", badge: "✦ Nowość 2025" },
                { img: "AppleWhite Phone17.png", name: "iPhone 17", desc: "6.1\" · A18 · 48 MP · Dynamic Island" },
              ].map((p) => (
                <div key={p.name} className="product-card rounded-[20px] border border-slate-100 lg:border-[var(--border)] bg-white overflow-hidden shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] lg:shadow-none hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(0,0,0,.1)] transition-all duration-300">
                  <div className="pc-img min-h-[220px] lg:min-h-[320px] py-5 lg:py-8 relative bg-gradient-to-br from-[#0a0a0f] via-[#14141c] to-[#1a1a28] flex items-center justify-center">
                    <div className="relative w-[110px] h-[180px] lg:w-[160px] lg:h-[260px] flex-shrink-0" style={{ animation: "float 4.2s ease infinite" }}>
                      <Image src={`${OFFERTA_IMG}/${encodeURIComponent(p.img)}`} alt={p.name} fill className="object-contain object-center" sizes="200px" priority={false} />
                    </div>
                  </div>
                  <div className="pc-body p-3 lg:p-4">
                    <p className="pc-brand text-[9px] lg:text-[9.5px] uppercase tracking-wider text-[var(--muted)]">Apple</p>
                    <p className="font-[family-name:var(--font-unbounded)] font-black text-[12px] lg:text-[13px] text-[var(--text)]">{p.name}</p>
                    <p className="text-[10.5px] lg:text-[11.5px] text-[var(--muted)] mt-0.5 line-clamp-2">{p.desc}</p>
                    {p.badge && (
                      <span className="inline-block mt-2 rounded-full bg-[var(--red-l)] text-[var(--red)] border border-[var(--red-border)] px-2 lg:px-2.5 py-0.5 lg:py-1 text-[8px] lg:text-[9px] font-medium">{p.badge}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {brand === "xiaomi" && (
            <div className="phone-panels-grid grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
              {[
                { img: "xiaomi17ultra.png", brand: "Xiaomi", name: "17 Ultra", desc: "6.73\" AMOLED · Snapdragon 8 Elite · 50 MP Leica", badge: "✦ Flagship" },
                { img: "xiaomi17.png", brand: "Xiaomi", name: "15 Pro", desc: "6.36\" AMOLED · Snapdragon 8 Elite · 50 MP" },
                { img: "redminote15proplus.png", brand: "Redmi", name: "Note 15 Pro+", desc: "6.67\" AMOLED · 200 MP · 5500 mAh · 45W", badge: "✦ Bestseller" },
                { img: "redminote15pro.png", brand: "Redmi", name: "Note 15 Pro", desc: "6.67\" AMOLED · 200 MP · 5500 mAh" },
                { img: "redminote15.png", brand: "Redmi", name: "Note 15", desc: "6.88\" · 108 MP · 5160 mAh · Świetna cena" },
                { img: "redmi15.png", brand: "Redmi", name: "15", desc: "6.88\" · 108 MP · 5160 mAh" },
                { img: "redmi15c..png", brand: "Redmi", name: "15C", desc: "Ekran 6.74\" · 50 MP · 5000 mAh" },
                { img: "redmia5.png", brand: "Redmi", name: "A5", desc: "Budżetowy · 50 MP · 5000 mAh" },
              ].map((p) => (
                <div key={p.name} className="product-card rounded-[20px] border border-slate-100 lg:border-[var(--border)] bg-white overflow-hidden shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] lg:shadow-none hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(0,0,0,.1)] transition-all duration-300">
                  <div className="pc-img min-h-[200px] lg:min-h-[280px] py-4 lg:py-6 relative bg-gradient-to-br from-[#140808] via-[#240e0e] to-[#341414] flex items-center justify-center">
                    <div className="relative w-[100px] h-[160px] lg:w-[130px] lg:h-[220px] flex-shrink-0 px-1" style={{ animation: "float 4.5s ease infinite" }}>
                      <Image src={`${OFFERTA_IMG}/${p.img}`} alt={p.name} fill className="object-contain object-center" sizes="150px" priority={false} />
                    </div>
                  </div>
                  <div className="pc-body p-3 lg:p-4">
                    <p className="pc-brand text-[9px] lg:text-[9.5px] uppercase tracking-wider text-[var(--muted)]">{p.brand}</p>
                    <p className="font-[family-name:var(--font-unbounded)] font-black text-[12px] lg:text-[13px] text-[var(--text)]">{p.name}</p>
                    <p className="text-[10.5px] lg:text-[11.5px] text-[var(--muted)] mt-0.5 line-clamp-2">{p.desc}</p>
                    {p.badge && (
                      <span className="inline-block mt-2 rounded-full bg-[var(--red-l)] text-[var(--red)] border border-[var(--red-border)] px-2 lg:px-2.5 py-0.5 lg:py-1 text-[8px] lg:text-[9px] font-medium">{p.badge}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-center mt-10 text-[var(--text2)]">
            Nie widzisz modelu który szukasz?{" "}
            <Link href="#formularz" className="font-semibold text-[var(--red)] hover:underline">
              Zapytaj — pomożemy znaleźć
            </Link>{" "}
            →
          </p>
        </div>
      </section>

      {/* 4. TABLETY */}
      <section id="tablety" className="relative overflow-hidden bg-white lg:bg-[#09090d] section-padding py-14 lg:py-20 px-5 sm:px-8 lg:px-[52px]">
        <div className="absolute inset-0 pointer-events-none opacity-80 hidden lg:block" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.01) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="mx-auto max-w-[1300px] relative">
          <div className="text-center mb-10 lg:mb-14">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 lg:text-[#525b6e] mb-2">iPad · Galaxy Tab</p>
            <h2 className="font-[family-name:var(--font-unbounded)] font-bold text-2xl sm:text-3xl lg:text-4xl text-slate-900 lg:text-white mb-4">
              Tablety dla pracy <span style={{ color: "var(--red)" }}>i rozrywki.</span>
            </h2>
            <p className="text-slate-500 lg:text-[#9ca3af] max-w-[560px] mx-auto">Od kompaktowego iPad mini po Galaxy Tab S10 Ultra. Przeglądaj, pracuj, twórz.</p>
          </div>
          <div className="tablets-grid grid lg:grid-cols-2 gap-4 lg:gap-5 mt-10 lg:mt-14">
            <Link href="#formularz" className="tablet-brand-card block rounded-[20px] lg:rounded-[22px] border border-slate-100 lg:border-white/10 bg-white lg:bg-white/[0.025] p-0 overflow-hidden shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] lg:shadow-none hover:border-[rgba(220,30,30,.25)] hover:-translate-y-0.5 transition-all duration-300">
              <div className="tbc-hero min-h-[200px] lg:min-h-[280px] py-4 lg:py-6 relative bg-gradient-to-br from-[#101828] via-[#182440] to-[#203060] flex items-center justify-center">
                <div className="relative w-[140px] h-[180px] lg:w-[180px] lg:h-[220px] flex-shrink-0" style={{ animation: "float 5s ease infinite" }}>
                  <Image src={`${OFFERTA_IMG}/ipad.png`} alt="iPad" fill className="object-contain object-center" sizes="200px" />
                </div>
              </div>
              <div className="tbc-body p-5 lg:p-6">
                <p className="text-[9.5px] uppercase tracking-wider text-[var(--muted)]">Apple</p>
                <p className="font-[family-name:var(--font-unbounded)] font-black text-base lg:text-lg text-slate-900 lg:text-white mt-1">iPad</p>
                <p className="text-[12px] text-slate-400 lg:text-[#525b6e] mt-2">iPad mini 7 · iPad 10. gen · iPad Air M3 · iPad Pro M4</p>
                <p className="text-slate-500 lg:text-[var(--text2)] text-sm mt-3">Od kompaktowego mini po profesjonalne Pro z chipem M4. iPadOS, Apple Pencil, Magic Keyboard.</p>
              </div>
            </Link>
            <Link href="#formularz" className="tablet-brand-card block rounded-[20px] lg:rounded-[22px] border border-slate-100 lg:border-white/10 bg-white lg:bg-white/[0.025] p-0 overflow-hidden shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] lg:shadow-none hover:border-[rgba(220,30,30,.25)] hover:-translate-y-0.5 transition-all duration-300">
              <div className="tbc-hero min-h-[200px] lg:min-h-[280px] py-4 lg:py-6 relative bg-gradient-to-br from-[#0a0a1e] via-[#141430] to-[#1e1e48] flex items-center justify-center">
                <div className="relative w-[140px] h-[180px] lg:w-[180px] lg:h-[220px] flex-shrink-0" style={{ animation: "float 5s .5s ease infinite" }}>
                  <Image src={`${OFFERTA_IMG}/galaxyTab.png`} alt="Samsung Galaxy Tab" fill className="object-contain object-center" sizes="200px" />
                </div>
              </div>
              <div className="tbc-body p-5 lg:p-6">
                <p className="text-[9.5px] uppercase tracking-wider text-[var(--muted)]">Samsung</p>
                <p className="font-[family-name:var(--font-unbounded)] font-black text-base lg:text-lg text-slate-900 lg:text-white mt-1">Galaxy Tab</p>
                <p className="text-[12px] text-slate-400 lg:text-[#525b6e] mt-2">Tab A9 · Tab A9+ · Tab S10 FE · Tab S10+ · Tab S10 Ultra</p>
                <p className="text-slate-500 lg:text-[var(--text2)] text-sm mt-3">Szeroka gama tabletów Samsunga — od budżetowego A9 po profesjonalne S10 Ultra z S Pen.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. LAPTOPY POLEASINGOWE */}
      <section id="poleasing" className="bg-white border-b border-[var(--border)] section-padding py-14 lg:py-20 px-5 sm:px-8 lg:px-[52px]">
        <div className="mx-auto max-w-[1300px]">
          <div className="poleasing-grid grid lg:grid-cols-2 gap-10 lg:gap-16 mt-10 lg:mt-14">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)] mb-2">Partner Amso · Certyfikowany sprzęt</p>
              <h2 className="font-[family-name:var(--font-unbounded)] font-bold text-2xl sm:text-3xl lg:text-4xl text-[var(--text)] mb-4">
                Laptopy <span style={{ color: "var(--red)" }}>poleasingowe.</span>
              </h2>
              <p className="text-[var(--text2)] text-base leading-relaxed mb-6">
                Dell Latitude, Lenovo ThinkPad, HP EliteBook — sprzęt z korporacji po pełnej diagnostyce i certyfikowanym czyszczeniu danych. Oszczędność do 60%.
              </p>
              <div className="amso-badge inline-flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-5 py-3.5 mb-8">
                <span className="font-[family-name:var(--font-unbounded)] font-black text-[var(--red)]">AMSO</span>
                <span className="w-px h-5 bg-[var(--border)]" />
                <span className="text-[13px] text-[var(--text2)]">Certyfikowany partner · Lider sprzętu poleasingowego w Polsce</span>
              </div>
              <ul className="space-y-3">
                {[
                  { emoji: "🔒", title: "Certyfikat czystości danych", desc: "Profesjonalne czyszczenie danych zgodne z normami NIST/DoD" },
                  { emoji: "✅", title: "Pełna diagnostyka techniczna", desc: "Bateria, klawiatura, ekran, porty — każdy laptop sprawdzony" },
                  { emoji: "📄", title: "Legalne oprogramowanie", desc: "Windows z legalną licencją OEM lub bez systemu — do wyboru" },
                  { emoji: "💰", title: "Oszczędność do 60%", desc: "Ten sam sprzęt co w korpo — o ułamek ceny nowego" },
                ].map((item) => (
                  <li key={item.title} className="pp-item flex items-start gap-3 rounded-[20px] lg:rounded-[14px] border border-slate-100 lg:border-[var(--border)] bg-white lg:bg-[var(--bg)] p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)] lg:shadow-none hover:border-[var(--red-border)] hover:bg-[var(--red-l)] transition-colors">
                    <span className="w-10 h-10 lg:w-9 lg:h-9 rounded-xl lg:rounded-lg bg-slate-50 lg:bg-white flex items-center justify-center text-lg shrink-0">{item.emoji}</span>
                    <div>
                      <p className="font-semibold text-[var(--text)] text-sm">{item.title}</p>
                      <p className="text-[13px] text-[var(--text2)]">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3 lg:gap-4">
              {[
                { img: "dell-amso.png", name: "Dell Latitude", models: "Latitude 5000 / 7000 · i5/i7 · 8–16 GB RAM", desc: "Niezawodne laptopy enterprise. Militarne testy wytrzymałości, długa bateria." },
                { img: "lenovo-amso.png", name: "Lenovo ThinkPad", models: "ThinkPad T-series / X-series · i5/i7/Ryzen", desc: "Legenda wśród laptopów biznesowych. Kultowa klawiatura, trwała konstrukcja." },
                { img: "hp-amso.png", name: "HP EliteBook", models: "EliteBook 840 / 850 · i5/i7", desc: "Aluminiowe laptopy HP. Jasne ekrany IPS, szybkie SSD, czytnik linii papilarnych." },
              ].map((item) => (
                <Link key={item.name} href="#formularz" className="pol-card flex gap-4 rounded-[20px] lg:rounded-[18px] border border-slate-100 lg:border-[var(--border)] bg-white lg:bg-[var(--bg)] p-4 lg:p-5 shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] lg:shadow-none hover:border-[var(--red-border)] hover:-translate-y-0.5 transition-all min-h-[44px]">
                  <div className="relative w-[100px] h-[80px] lg:w-[140px] lg:h-[96px] shrink-0 rounded-xl overflow-hidden bg-slate-50 lg:bg-[var(--bg2)]">
                    <Image src={`${OFFERTA_IMG}/${item.img}`} alt={item.name} fill className="object-contain object-center" sizes="160px" />
                  </div>
                  <div>
                    <p className="font-[family-name:var(--font-unbounded)] font-black text-sm text-[var(--text)]">{item.name}</p>
                    <p className="text-[11px] lg:text-[12px] text-[var(--muted)] mt-0.5">{item.models}</p>
                    <p className="text-[12px] lg:text-[13px] text-[var(--text2)] mt-1.5 lg:mt-2">{item.desc}</p>
                  </div>
                </Link>
              ))}
              <Link href="#formularz" className="btn-primary mt-2 w-fit min-h-[44px] flex items-center">Zapytaj o dostępność →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. LAPTOPY BIZNESOWE */}
      <section id="laptopy-biz" className="relative overflow-hidden bg-white lg:bg-[#11131b] border-t border-slate-100 lg:border-white/5 border-b border-slate-100 lg:border-white/5 section-padding py-14 lg:py-20 px-5 sm:px-8 lg:px-[52px]">
        <div className="absolute inset-0 pointer-events-none opacity-80 hidden lg:block" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.012) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
        <div className="absolute top-1/2 -right-16 w-[400px] h-[400px] rounded-full pointer-events-none -translate-y-1/2 hidden lg:block" style={{ background: "radial-gradient(ellipse, rgba(220,30,30,.06), transparent 65%)" }} />
        <div className="mx-auto max-w-[1300px] relative">
          <div className="lb-head flex flex-wrap justify-between items-start gap-6 mb-10 lg:mb-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 lg:text-[#525b6e] mb-2">Nowe · Biznesowe</p>
              <h2 className="font-[family-name:var(--font-unbounded)] font-bold text-2xl sm:text-3xl lg:text-4xl text-slate-900 lg:text-white mb-4">
                Laptopy <span style={{ color: "var(--red)" }}>biznesowe.</span>
              </h2>
              <p className="text-slate-500 lg:text-[#9ca3af] max-w-[480px]">
                Dell, Lenovo, HP — nowe laptopy klasy biznesowej z gwarancją producenta.
              </p>
            </div>
            <Link href="#formularz" className="btn-primary shrink-0 min-h-[44px]">Zapytaj o ofertę →</Link>
          </div>
          <div className="lb-grid grid md:grid-cols-3 gap-4 lg:gap-5">
            {[
              {
                img: "asusexpertbooklaptopbiznesowy.png",
                brand: "Asus",
                desc: "Lekkie i wytrzymałe konstrukcje do codziennej pracy. Dopasujemy konfigurację pod Twój zespół i budżet.",
              },
              {
                img: "lenovoyhinkbook.png",
                brand: "Lenovo",
                desc: "Ergonomia, niezawodność i świetna klawiatura. Konfigurujemy sprzęt tak, by działał stabilnie każdego dnia.",
              },
              {
                img: "delllaptop.png",
                brand: "Dell",
                desc: "Biznesowe rozwiązania dla działów IT: prosta obsługa i szeroka kompatybilność. Wybierz wariant pod firmę.",
              },
            ].map((item) => (
              <Link key={item.brand} href="#formularz" className="lb-card block rounded-[20px] lg:rounded-[22px] border border-slate-100 lg:border-white/10 bg-white lg:bg-white/[0.025] overflow-hidden shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] lg:shadow-none hover:border-[rgba(220,30,30,.22)] hover:-translate-y-1 hover:shadow-[0_16px_44px_rgba(0,0,0,.35)] transition-all duration-300">
                <div className="lb-visual min-h-[200px] lg:min-h-[280px] py-6 lg:py-8 relative bg-gradient-to-br from-[#060e1a] via-[#0c1c32] to-[#122640] flex items-center justify-center">
                  <div className="relative w-[200px] h-[130px] lg:w-[240px] lg:h-[160px] flex-shrink-0" style={{ animation: "float 4.5s ease infinite" }}>
                    <Image src={`${OFFERTA_IMG}/${item.img}`} alt={`${item.brand} laptop`} fill className="object-contain object-center" sizes="280px" />
                  </div>
                </div>
                <div className="lb-body p-4 lg:p-5">
                  <p className="text-[9.5px] uppercase tracking-wider text-[var(--muted)]">{item.brand}</p>
                  <p className="font-[family-name:var(--font-unbounded)] font-black text-sm lg:text-base text-slate-900 lg:text-white mt-1">{item.brand} biznesowe</p>
                  <p className="text-[12px] lg:text-[13px] text-slate-500 lg:text-[#525b6e] mt-2">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 lg:mt-8 flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center gap-4 rounded-2xl border border-[#e11d1d]/15 lg:border-[rgba(220,30,30,.18)] bg-[#e11d1d]/[0.04] lg:bg-[rgba(220,30,30,.07)] p-5 sm:p-6">
            <div>
              <p className="font-bold text-slate-900 lg:text-white">Nie wiesz który model wybrać?</p>
              <p className="text-[13px] text-slate-500 lg:text-[#9ca6ba] mt-1">Zadzwoń lub napisz — doradzimy bez wciskania.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="#formularz" className="btn-primary min-h-[44px]">Zapytaj o ofertę</Link>
              <a href="tel:883200151" className="btn-ghost min-h-[44px] border-slate-200 lg:border-white/20 text-slate-700 lg:!text-white hover:border-[var(--red-border)] hover:!text-white">883 200 151</a>
            </div>
          </div>
        </div>
      </section>

      {/* 6b. LAPTOPY GAMINGOWE */}
      <section id="laptopy-gamingowe" className="relative overflow-hidden bg-white lg:bg-[#1a1a1a] border-t border-slate-100 lg:border-white/5 border-b border-slate-100 lg:border-white/5 section-padding py-14 lg:py-20 px-5 sm:px-8 lg:px-[52px]">
        <div className="mx-auto max-w-[1300px] relative">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-10 lg:mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-0.5 w-8 rounded-full bg-[var(--red)] shrink-0" />
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 lg:text-[#8b92a7]">Nowe gaming</p>
              </div>
              <h2 className="font-[family-name:var(--font-unbounded)] font-bold text-2xl sm:text-3xl lg:text-4xl text-slate-900 lg:text-white mb-4">
                Laptopy <span style={{ color: "var(--red)" }}>gamingowe.</span>
              </h2>
              <p className="text-slate-500 lg:text-[#9ca3b8] text-base leading-relaxed max-w-[560px]">
                Topowe laptopy gamingowe z kartami RTX, wysokowydajnymi ekranami i procesorami Intel/AMD. Grasz gdzie chcesz — bez kompromisów w wydajności.
              </p>
            </div>
            <Link href="#formularz" className="btn-primary shrink-0 inline-flex items-center gap-2 min-h-[44px]">
              Zapytaj o ofertę
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-4 lg:gap-6">
            {[
              {
                img: "asustufgaming.png",
                brand: "ASUS",
                name: "ROG / TUF Gaming",
                tags: ["ROG Strix G16", "TUF Gaming A15", "ROG Zephyrus G14"],
                desc: "ROG Strix — dla hardcore'owych graczy. TUF Gaming — najlepszy stosunek ceny do wydajności. Zephyrus — ultramobilny, spełnia mocą.",
                specs: [
                  { label: "GPU", value: "RTX 4060-4090" },
                  { label: "Ekran", value: "144-240 Hz" },
                  { label: "CPU", value: "Intel i7/i9, Ryzen 9" },
                  { label: "RAM", value: "16-32 GB DDR5" },
                ],
                gradient: "from-[#1e1a3e] via-[#2a2050] to-[#1a1435]",
              },
              {
                img: "msikatanajpg.png",
                brand: "MSI",
                name: "Raider / Katana / Thin",
                tags: ["MSI Raider GE78", "MSI Katana 15", "MSI GF63"],
                desc: "Raider — flagowy z pełnowymiarową RTX. Katana — najlepszy stosunek ceny do wydajności. Thin — lekki laptop dla graczy o ograniczonym budżecie.",
                specs: [
                  { label: "GPU", value: "RTX 4060-4080" },
                  { label: "Ekran", value: "144-360 Hz" },
                  { label: "CPU", value: "Intel Core Ultra" },
                  { label: "RAM", value: "16-32 GB DDR5" },
                ],
                gradient: "from-[#2e1818] via-[#3a2020] to-[#1a1010]",
              },
              {
                img: "lenovolegion.png",
                brand: "Lenovo",
                name: "Legion 5 / 7 / Pro",
                tags: ["Legion 5 Gen 9", "Legion 7 Gen 9", "Legion Pro 7i"],
                desc: "Legion 5 — budżetowy wybór graczy. Legion 7 — OLED/IPS 240Hz. Legion Pro — absolutny top. Pełna moc z Legion Coldfront.",
                specs: [
                  { label: "GPU", value: "RTX 4050-4090" },
                  { label: "Ekran", value: "165-240 Hz / OLED" },
                  { label: "CPU", value: "Intel, AMD Ryzen" },
                  { label: "Chłodzenie", value: "Legion Coldfront" },
                ],
                gradient: "from-[#0f1a2e] via-[#152540] to-[#0a1220]",
              },
            ].map((card) => (
              <div
                key={card.brand}
                className="rounded-[20px] lg:rounded-[22px] border border-slate-100 lg:border-white/10 bg-white lg:bg-[#252530] overflow-hidden shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] lg:shadow-none hover:border-[rgba(220,30,30,.22)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`min-h-[200px] lg:min-h-[260px] py-6 lg:py-8 relative bg-gradient-to-br ${card.gradient} flex items-center justify-center p-4 lg:p-6`}>
                  <div className="relative w-[200px] h-[130px] lg:w-[240px] lg:h-[160px] flex-shrink-0" style={{ animation: "float 4.5s ease infinite" }}>
                    <Image src={`${OFFERTA_IMG}/${card.img}`} alt={card.name} fill className="object-contain object-center" sizes="280px" />
                  </div>
                </div>
                <div className="p-4 lg:p-5 lg:p-6">
                  <p className="text-[9.5px] uppercase tracking-wider text-slate-400 lg:text-[#8b92a7]">{card.brand}</p>
                  <p className="font-[family-name:var(--font-unbounded)] font-bold text-base lg:text-lg text-slate-900 lg:text-white mt-1">{card.name}</p>
                  <div className="flex flex-wrap gap-1.5 lg:gap-2 mt-2 lg:mt-3">
                    {card.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 lg:bg-white/10 px-2.5 lg:px-3 py-1 text-[10px] lg:text-[11px] font-medium text-slate-600 lg:text-white/90">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-[12px] lg:text-[13px] text-slate-500 lg:text-[#9ca3b8] leading-relaxed mt-3 lg:mt-4">{card.desc}</p>
                  <div className="grid grid-cols-2 gap-2 mt-3 lg:mt-4">
                    {card.specs.map((s) => (
                      <div key={s.label} className="rounded-xl bg-slate-50 lg:bg-white/5 border border-slate-100 lg:border-white/10 px-3 py-2.5">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 lg:text-[#8b92a7]">{s.label}</p>
                        <p className="text-[12px] lg:text-[13px] font-semibold text-slate-900 lg:text-white mt-0.5">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 lg:mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-[#e11d1d]/15 lg:border-[rgba(220,30,30,.18)] bg-[#e11d1d]/[0.04] lg:bg-[rgba(220,30,30,.07)] p-5 sm:p-6">
            <div>
              <p className="font-bold text-slate-900 lg:text-white">Nie wiesz który laptop gamingowy wybrać?</p>
              <p className="text-[13px] text-slate-500 lg:text-[#9ca3b8] mt-1">
                Potrzebujesz czegoś więcej? Bezpłatnie doradzimy, który model daje najlepszy FPS za złotówkę.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="#formularz" className="btn-primary inline-flex items-center gap-2 min-h-[44px]">
                Zapytaj o wycenę
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <a href="tel:883200151" className="flex items-center gap-2 min-h-[44px] text-slate-700 lg:text-white hover:text-[var(--red)] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                883 200 151
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 7. KOMPUTERY BIZNESOWE */}
      <section id="biznesowe" className="relative overflow-hidden bg-white lg:bg-[#09090d] border-t border-slate-100 lg:border-white/5 section-padding py-14 lg:py-20 px-5 sm:px-8 lg:px-[52px]">
        <div className="absolute inset-0 pointer-events-none opacity-60 hidden lg:block" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.01) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="mx-auto max-w-[1300px] relative">
          <div className="biz-head flex flex-wrap justify-between items-start gap-6 mb-10 lg:mb-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 lg:text-[#8b95ab] mb-2">Nowe · Biznesowe</p>
              <h2 className="font-[family-name:var(--font-unbounded)] font-bold text-2xl sm:text-3xl lg:text-4xl text-slate-900 lg:text-white mb-4">
                Komputery <span style={{ color: "var(--red)" }}>biznesowe.</span>
              </h2>
              <p className="text-slate-500 lg:text-[#aeb8ca] max-w-[480px]">Stacjonarne Dell i Lenovo: kompakty, wieże oraz All-in-One — dobierzemy format pod Twoje biurko i budżet.</p>
            </div>
            <Link href="#formularz" className="btn-primary shrink-0 min-h-[44px]">Zapytaj o ofertę →</Link>
          </div>
          <div className="biz-grid grid md:grid-cols-3 gap-4 lg:gap-5">
            {[
              {
                img: "delloptiplex.png",
                brand: "Dell",
                name: "OptiPlex",
                models: "Serie 3000/5000 · Micro / SFF / MT · procesory i5 / i7",
                desc: "Sprawdzone biurowe stacjonarne Dell: od dyskretnego Micro (często za monitorem) po pełnowymiarowe wieże. Cicha praca, stabilna platforma, łatwy serwis.",
              },
              {
                img: "thinkcenterlenovoB.png",
                brand: "Lenovo",
                name: "ThinkCentre",
                models: "Seria M · Tiny / Small / Tower · Intel lub Ryzen",
                desc: "ThinkCentre daje wybór formatu: oszczędne Tiny, kompakt Small albo rozbudowywalna wieża. Ciche, wydajne pod codzienną pracę w firmie.",
              },
              {
                img: "lenovo-aio.png",
                brand: "Lenovo",
                name: "All-in-One",
                models: "ThinkCentre neo · IdeaCentre · ekran i komputer w jednym",
                desc: "All-in-One to porządek na biurku: jeden przewód zamiast plątaniny, wąskie ramki i nowoczesny wygląd. Świetne do recepcji, open space i mniejszych gabinetów.",
                visualBox: "w-[200px] h-[150px] sm:w-[260px] sm:h-[195px]",
                imgSizes: "280px",
              },
            ].map((item) => (
              <Link key={item.name} href="#formularz" className="biz-card block rounded-[20px] lg:rounded-[22px] border border-slate-100 lg:border-white/10 bg-white lg:bg-white/[0.02] overflow-hidden shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] lg:shadow-none hover:border-[rgba(220,30,30,.22)] hover:-translate-y-1 transition-all duration-300">
                <div className="biz-visual min-h-[200px] lg:min-h-[260px] py-6 lg:py-8 relative bg-gradient-to-br from-[#060c18] via-[#0e1a30] to-[#162848] flex items-center justify-center">
                  <div
                    className={`relative flex-shrink-0 ${"visualBox" in item && item.visualBox ? item.visualBox : "w-[120px] h-[180px]"}`}
                    style={{ animation: "float 4.5s ease infinite" }}
                  >
                    <Image
                      src={`${OFFERTA_IMG}/${item.img}`}
                      alt={`${item.brand} ${item.name}`}
                      fill
                      className="object-contain object-center"
                      sizes={"imgSizes" in item && item.imgSizes ? item.imgSizes : "160px"}
                    />
                  </div>
                </div>
                <div className="p-4 lg:p-5">
                  <p className="text-[9.5px] uppercase tracking-wider text-slate-400 lg:text-[#8b95ab]">{item.brand}</p>
                  <p className="font-[family-name:var(--font-unbounded)] font-black text-sm lg:text-base text-slate-900 lg:text-white mt-1">{item.name}</p>
                  <p className="text-[11px] lg:text-[12px] text-slate-400 lg:text-[#9ca6ba] mt-2 leading-snug">{item.models}</p>
                  <p className="text-[12px] lg:text-[13px] text-slate-500 lg:text-[#c8cedd] mt-2 leading-relaxed">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 lg:mt-8 flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center gap-4 rounded-2xl border border-[#e11d1d]/15 lg:border-[rgba(220,30,30,.18)] bg-[#e11d1d]/[0.04] lg:bg-[rgba(220,30,30,.07)] p-5 sm:p-6">
            <div>
              <p className="font-bold text-slate-900 lg:text-white">Nie wiesz który model wybrać?</p>
              <p className="text-[13px] text-slate-500 lg:text-[#9ca6ba] mt-1">Zadzwoń lub napisz — doradzimy bez wciskania.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="#formularz" className="btn-primary min-h-[44px]">Zapytaj o ofertę</Link>
              <a href="tel:883200151" className="btn-ghost min-h-[44px] border-slate-200 lg:border-white/20 text-slate-700 lg:!text-white hover:border-[var(--red-border)] hover:!text-white">883 200 151</a>
            </div>
          </div>
        </div>
      </section>

      {/* 8. DRUKARKI */}
      <section id="drukarki" className="bg-white border-b border-[var(--border)] section-padding py-14 lg:py-20 px-5 sm:px-8 lg:px-[52px]">
        <div className="mx-auto max-w-[1300px]">
          <div className="druk-layout grid lg:grid-cols-2 gap-10 lg:gap-[72px]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)] mb-2">Do domu i biura</p>
              <h2 className="font-[family-name:var(--font-unbounded)] font-bold text-2xl sm:text-3xl lg:text-4xl text-[var(--text)] mb-4">
                Drukarki <span style={{ color: "var(--red)" }}>dla każdego.</span>
              </h2>
              <p className="text-[var(--text2)] text-base leading-relaxed mb-8">
                Laserowe i atramentowe — do domu, biura i szkoły. Serwis, tonery i atramenty w jednym miejscu.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  { emoji: "🖨", title: "Drukarki do domu", desc: "Kompaktowe, ciche, tanie w eksploatacji. Do okazjonalnego drukowania." },
                  { emoji: "🏢", title: "Drukarki do biura", desc: "Laserowe i wielofunkcyjne z szybkim drukiem, skanerem i kopiarką." },
                  { emoji: "🔧", title: "Serwis i materiały", desc: "Serwisujemy, resetujemy liczniki, dostarczamy tonery i atramenty." },
                ].map((item) => (
                  <li key={item.title} className="pp-item flex items-start gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--bg)] p-4 hover:border-[var(--red-border)] hover:bg-[var(--red-l)] transition-colors">
                    <span className="text-lg shrink-0">{item.emoji}</span>
                    <div>
                      <p className="font-semibold text-[var(--text)] text-sm">{item.title}</p>
                      <p className="text-[13px] text-[var(--text2)]">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link href="#formularz" className="btn-primary">Zapytaj o drukarkę →</Link>
            </div>
            <div className="druk-brands-grid grid grid-cols-2 gap-4">
              {[
                { name: "Brother", desc: "Laserowe i atramentowe, świetna jakość druku, tanie tonery. Do biur i szkół." },
                { name: "Epson", desc: "EcoTank — napełniane zbiorniki zamiast kartridży. Świetna ekonomika." },
                { name: "Canon", desc: "Doskonała jakość zdjęć. PIXMA i MAXIFY." },
                { name: "HP", desc: "Popularność i dostępność materiałów. LaserJet i OfficeJet." },
                { name: "Kyocera", desc: "Profesjonalne drukarki A3/A4. Niski koszt wydruku, bębny do setek tysięcy stron.", full: true },
              ].map((item) => (
                <div key={item.name} className={`rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 hover:border-[var(--red-border)] hover:-translate-y-0.5 transition-all ${item.full ? "col-span-2" : ""}`}>
                  <p className="font-[family-name:var(--font-unbounded)] font-black text-[15px] text-[var(--text)]">{item.name}</p>
                  <p className="text-[13px] text-[var(--text2)] mt-2">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 9. GAMING */}
      <section id="gaming" className="relative overflow-hidden bg-white lg:bg-[#09090d] border-t border-slate-100 lg:border-white/5 section-padding py-14 lg:py-20 px-5 sm:px-8 lg:px-[52px]">
        <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none hidden lg:block" style={{ background: "radial-gradient(circle, rgba(150,0,255,.06), transparent 60%)" }} />
        <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none hidden lg:block" style={{ background: "radial-gradient(circle, rgba(220,30,30,.05), transparent 60%)" }} />
        <div className="mx-auto max-w-[1300px] relative">
          <div className="gam-layout grid lg:grid-cols-2 gap-10 lg:gap-[72px] items-center">
            <div>
              <div className="gam-pc-mock w-full max-w-[280px] lg:max-w-[320px] h-[320px] lg:h-[380px] mx-auto rounded-[20px] lg:rounded-2xl border-2 border-[rgba(180,0,255,.25)] flex flex-col items-center justify-center p-6" style={{ background: "linear-gradient(145deg, rgba(150,0,255,.12), rgba(80,0,160,.06))", boxShadow: "0 0 80px rgba(150,0,255,.22), 0 24px 60px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.06)", animation: "float 4s ease infinite" }}>
                <div className="relative w-full h-[300px] rounded-xl overflow-hidden bg-black/20">
                  <Image src={`${OFFERTA_IMG}/gamimgkomputer.png`} alt="Komputer gamingowy" fill className="object-contain object-center" sizes="340px" priority />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-6">
                {[
                  { label: "Procesor", value: "Intel, AMD" },
                  { label: "Karta graficzna", value: "NVIDIA, Radeon" },
                  { label: "RAM", value: "16–64 GB DDR5" },
                  { label: "Budżet od", value: "3 500 zł", red: true },
                ].map((s) => (
                  <div key={s.label} className="gam-spec rounded-[16px] lg:rounded-[13px] border border-slate-100 lg:border-white/10 bg-slate-50 lg:bg-white/[0.03] p-3 lg:p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)] lg:shadow-none hover:border-[rgba(220,30,30,.2)] transition-colors">
                    <p className="text-[11px] text-slate-400 lg:text-[var(--muted)]">{s.label}</p>
                    <p className={`text-sm font-semibold mt-1 ${s.red ? "text-[var(--red)]" : "text-slate-900 lg:text-white"}`}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 lg:text-[#525b6e] mb-2">Na zamówienie</p>
              <h2 className="font-[family-name:var(--font-unbounded)] font-bold text-2xl sm:text-3xl lg:text-4xl text-slate-900 lg:text-white mb-4">
                Komputer gamingowy <span style={{ color: "var(--red)" }}>pod Ciebie.</span>
              </h2>
              <p className="text-slate-500 lg:text-[#9ca3b8] mb-6 lg:mb-8">Składamy zestawy pod Twoją grę i budżet. Zero wciskania — tylko sensowna konfiguracja.</p>
              <div className="space-y-4">
                {[
                  { num: "01", title: "Przyjdź i powiedz nam w co grasz lub do czego używasz komputera", desc: "Counter-Strike, Cyberpunk, Fortnite, Praca kreatywna, Programowanie, AI — każdy program ma inne wymagania." },
                  { num: "02", title: "Ustalamy budżet i konfigurację", desc: "Pokażemy kilka opcji, wyjaśnimy różnice. Zero wciskania." },
                  { num: "03", title: "Zamawiamy części i składamy", desc: "Profesjonalny montaż, testy stabilności. Odbierasz gotowy komputer." },
                ].map((step) => (
                  <div key={step.num} className="gam-step flex gap-4 rounded-[20px] lg:rounded-[14px] border border-slate-100 lg:border-white/[0.055] bg-white lg:bg-white/[0.02] p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)] lg:shadow-none hover:border-[rgba(220,30,30,.18)] transition-colors">
                    <span className="font-[family-name:var(--font-unbounded)] font-black text-xl text-[var(--red)] shrink-0">{step.num}</span>
                    <div>
                      <p className="font-semibold text-slate-900 lg:text-white">{step.title}</p>
                      <p className="text-[13px] text-slate-500 lg:text-[#b4b8c4] mt-1">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link href="#formularz" className="btn-primary">Skonfiguruj zestaw</Link>
                <a href="tel:883200151" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/50 bg-white/10 px-5 py-3 text-base font-semibold text-white hover:border-white hover:bg-white/20 transition-all">
                  Zadzwoń po poradę
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. DLACZEGO MY */}
      <section className="relative overflow-hidden bg-white lg:bg-[#09090d] section-padding py-14 lg:py-20 px-5 sm:px-8 lg:px-[52px]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none hidden lg:block" style={{ background: "radial-gradient(circle, rgba(220,30,30,.06), transparent 55%)" }} />
        <div className="mx-auto max-w-[1300px] relative">
          <div className="text-center mb-10 lg:mb-14">
            <h2 className="font-[family-name:var(--font-unbounded)] font-bold text-2xl sm:text-3xl lg:text-4xl text-slate-900 lg:text-white mb-4">
              Dlaczego warto <span style={{ color: "var(--red)" }}>kupić u nas.</span>
            </h2>
            <p className="text-slate-500 lg:text-[#9ca3af] max-w-[560px] mx-auto">Sklep stacjonarny, doradztwo bez wciskania, gwarancja i serwis w jednym miejscu.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mt-10 lg:mt-14">
            {[
              { emoji: "🏪", title: "Sklep stacjonarny — przyjdź do nas", desc: "Masz nas na miejscu w Rabce-Zdrój. Możesz przyjść, zadać pytania i porozmawiać ze specjalistą. Żadnego anonimowego sklepu w chmurze." },
              { emoji: "📱", title: "Szeroki asortyment — nowe i poleasingowe", desc: "Smartfony, laptopy, komputery, drukarki, gaming. Sprzęt nowy i certyfikowany poleasingowy w jednym miejscu." },
              { emoji: "🛡️", title: "Gwarancja i serwis w jednym miejscu", desc: "Kupujesz u nas — serwisujemy u nas. Coś się stało? Wiesz gdzie przyjść." },
              { emoji: "🤝", title: "Partner Amso — pewny sprzęt poleasingowy", desc: "Dostęp do certyfikowanego sprzętu klasy biznesowej z gwarancją." },
              { emoji: "📦", title: "Odbiór i wysyłka kurierem", desc: "Odbiór osobisty w Rabce-Zdrój lub wysyłka kurierem do całej Polski. Szybka dostawa i bezpieczne paczkowanie." },
              { emoji: "💳", title: "Faktury VAT i elastyczne płatności", desc: "Faktury dla firm i osób prywatnych. Zapytaj o raty." },
            ].map((item) => (
              <div key={item.title} className="wy-card relative rounded-[20px] lg:rounded-[18px] bg-white lg:bg-white/[0.025] border border-slate-100 lg:border-transparent p-5 lg:p-6 lg:p-7 shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] lg:shadow-none hover:-translate-y-1">
                <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl lg:rounded-[14px] bg-[#e11d1d]/[0.06] lg:bg-[rgba(220,30,30,.08)] border border-[#e11d1d]/15 lg:border-[rgba(220,30,30,.22)] flex items-center justify-center text-xl lg:text-2xl mb-3 lg:mb-4">{item.emoji}</div>
                <p className="font-[family-name:var(--font-unbounded)] font-bold text-[12px] lg:text-sm text-slate-900 lg:text-white">{item.title}</p>
                <p className="text-[12px] lg:text-[13px] text-slate-500 lg:text-[#b4b8c4] mt-1.5 lg:mt-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. FORMULARZ */}
      <section id="formularz" className="relative overflow-hidden bg-white lg:bg-[#09090d] section-padding py-14 lg:py-20 px-5 sm:px-8 lg:px-[52px]">
        <div className="cf-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none hidden lg:block" style={{ background: "radial-gradient(circle, rgba(220,30,30,.08), transparent 60%)" }} />
        <div className="mx-auto max-w-[1300px] relative">
          <div className="text-center mb-10 lg:mb-14">
            <h2 className="font-[family-name:var(--font-unbounded)] font-bold text-2xl sm:text-3xl lg:text-4xl text-slate-900 lg:text-white mb-4">
              Dobierzemy <span style={{ color: "var(--red)" }}>najlepsze rozwiązanie.</span>
            </h2>
            <p className="text-slate-500 lg:text-[#9ca3af] max-w-[560px] mx-auto">Opowiedz czego szukasz — odezwiemy się z konkretną ofertą.</p>
          </div>
          <div className="cf-layout grid lg:grid-cols-2 gap-10 lg:gap-[72px] mt-10 lg:mt-14">
            <div className="space-y-4">
              <a href="tel:883200151" className="cf-way flex items-center gap-4 rounded-[20px] lg:rounded-2xl border border-slate-100 lg:border-white/10 bg-white lg:bg-white/[0.03] p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)] lg:shadow-none hover:border-[rgba(220,30,30,.22)] hover:translate-x-1 transition-all min-h-[44px]">
                <span className="w-11 h-11 rounded-xl bg-[#e11d1d]/[0.06] lg:bg-[var(--red-l)] flex items-center justify-center text-xl">📞</span>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 lg:text-[var(--muted)]">Zadzwoń</p>
                  <p className="font-semibold text-slate-900 lg:text-white">883 200 151</p>
                  <p className="text-[13px] text-slate-400 lg:text-[#525b6e]">Pon–Pt 9:00–17:00 · Sob 9:00–14:00</p>
                </div>
              </a>
              <a href="mailto:sklep@pro-kom.eu" className="cf-way flex items-center gap-4 rounded-[20px] lg:rounded-2xl border border-slate-100 lg:border-white/10 bg-white lg:bg-white/[0.03] p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)] lg:shadow-none hover:border-[rgba(220,30,30,.22)] hover:translate-x-1 transition-all min-h-[44px]">
                <span className="w-11 h-11 rounded-xl bg-[#e11d1d]/[0.06] lg:bg-[var(--red-l)] flex items-center justify-center text-xl">✉️</span>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 lg:text-[var(--muted)]">Napisz e-mail</p>
                  <p className="font-semibold text-slate-900 lg:text-white">sklep@pro-kom.eu</p>
                  <p className="text-[13px] text-slate-400 lg:text-[#525b6e]">Odpiszemy w ciągu 24 godzin</p>
                </div>
              </a>
              <div className="cf-way flex items-center gap-4 rounded-[20px] lg:rounded-2xl border border-slate-100 lg:border-white/10 bg-white lg:bg-white/[0.03] p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)] lg:shadow-none min-h-[44px]">
                <span className="w-11 h-11 rounded-xl bg-[#e11d1d]/[0.06] lg:bg-[var(--red-l)] flex items-center justify-center text-xl">🏪</span>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 lg:text-[var(--muted)]">Odwiedź sklep</p>
                  <p className="font-semibold text-slate-900 lg:text-white">ul. Orkana 16B, Rabka-Zdrój</p>
                  <p className="text-[13px] text-slate-400 lg:text-[#525b6e]">Przyjdź, obejrzyj, przetestuj</p>
                </div>
              </div>
              <div className="cf-hours rounded-[20px] lg:rounded-xl border border-slate-100 lg:border-white/10 bg-white lg:bg-white/[0.04] p-5 mt-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)] lg:shadow-[0_0_24px_rgba(220,30,30,.06)]">
                <p className="text-[11px] uppercase tracking-widest text-slate-400 lg:text-[#8b92a7] mb-3 font-semibold">Godziny otwarcia</p>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-baseline gap-4">
                    <span className="text-[13px] font-medium text-slate-900 lg:text-white">Pon–Pt</span>
                    <span className="text-[13px] text-slate-500 lg:text-[#b4b8c4] tabular-nums">9:00 – 17:00</span>
                  </div>
                  <div className="flex justify-between items-baseline gap-4">
                    <span className="text-[13px] font-medium text-slate-900 lg:text-white">Sobota</span>
                    <span className="text-[13px] text-slate-500 lg:text-[#b4b8c4] tabular-nums">9:00 – 14:00</span>
                  </div>
                  <div className="flex justify-between items-baseline gap-4 border-t border-slate-100 lg:border-white/5 pt-2.5 mt-2.5">
                    <span className="text-[13px] font-medium text-slate-900 lg:text-white">Niedziela</span>
                    <span className="text-[13px] text-slate-400 lg:text-[#8b92a7]">Zamknięte</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="cf-form rounded-[20px] lg:rounded-[22px] border border-slate-100 lg:border-white/10 bg-white lg:bg-white/[0.03] overflow-hidden shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] lg:shadow-none">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setFormError("");
                  setFormLoading(true);
                  const fd = new FormData(e.currentTarget);
                  try {
                    const res = await fetch(`${API_V1}/communications/inquiry/`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        first_name: fd.get("first_name"),
                        last_name: fd.get("last_name"),
                        phone: fd.get("phone"),
                        email: fd.get("email"),
                        interest: interestValue,
                        message: fd.get("message"),
                      }),
                    });
                    if (res.ok) {
                      setFormSent(true);
                    } else {
                      const data = await res.json().catch(() => ({}));
                      setFormError(data.detail || "Wystąpił błąd. Spróbuj ponownie.");
                    }
                  } catch {
                    setFormError("Brak połączenia. Spróbuj ponownie.");
                  } finally {
                    setFormLoading(false);
                  }
                }}
                className="p-6 sm:p-8"
              >
                <div className="grid grid-cols-2 gap-3 lg:gap-4 mb-3 lg:mb-4">
                  <input type="text" name="first_name" placeholder="Imię" className="w-full min-h-[44px] rounded-2xl lg:rounded-[11px] border border-slate-200 lg:border-[#2c3145] bg-slate-50 lg:bg-[#1c2030] px-4 py-3 text-slate-900 lg:text-white placeholder:text-slate-400 lg:placeholder:text-[#525b6e] focus:border-[var(--red)] focus:outline-none focus:ring-2 focus:ring-[rgba(220,30,30,.14)]" required />
                  <input type="text" name="last_name" placeholder="Nazwisko" className="w-full min-h-[44px] rounded-2xl lg:rounded-[11px] border border-slate-200 lg:border-[#2c3145] bg-slate-50 lg:bg-[#1c2030] px-4 py-3 text-slate-900 lg:text-white placeholder:text-slate-400 lg:placeholder:text-[#525b6e] focus:border-[var(--red)] focus:outline-none focus:ring-2 focus:ring-[rgba(220,30,30,.14)]" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 mb-3 lg:mb-4">
                  <input type="tel" name="phone" placeholder="Telefon" className="w-full min-h-[44px] rounded-2xl lg:rounded-[11px] border border-slate-200 lg:border-[#2c3145] bg-slate-50 lg:bg-[#1c2030] px-4 py-3 text-slate-900 lg:text-white placeholder:text-slate-400 lg:placeholder:text-[#525b6e] focus:border-[var(--red)] focus:outline-none focus:ring-2 focus:ring-[rgba(220,30,30,.14)]" />
                  <input type="email" name="email" placeholder="E-mail *" className="w-full min-h-[44px] rounded-2xl lg:rounded-[11px] border border-slate-200 lg:border-[#2c3145] bg-slate-50 lg:bg-[#1c2030] px-4 py-3 text-slate-900 lg:text-white placeholder:text-slate-400 lg:placeholder:text-[#525b6e] focus:border-[var(--red)] focus:outline-none focus:ring-2 focus:ring-[rgba(220,30,30,.14)]" required />
                </div>
                <div className="relative mb-4">
                  <input type="hidden" name="interest" value={interestValue} readOnly required />
                  <button
                    type="button"
                    onClick={() => setInterestOpen((o) => !o)}
                    onBlur={() => setTimeout(() => setInterestOpen(false), 180)}
                    className="cf-select-trigger w-full min-h-[48px] rounded-2xl border border-slate-200 lg:border-[#2c3145] bg-slate-50 lg:bg-[#1c2030] px-5 py-4 text-left text-[16px] text-slate-900 lg:text-white transition-all duration-300 hover:border-slate-300 lg:hover:border-[#3a4055] hover:bg-slate-100 lg:hover:bg-[#232838] hover:shadow-[0_0_24px_rgba(220,30,30,.08)] focus:border-[var(--red)] focus:outline-none focus:ring-2 focus:ring-[rgba(220,30,30,.25)] focus:ring-offset-2 focus:ring-offset-white lg:focus:ring-offset-[#0d0f14] flex items-center justify-between gap-3"
                  >
                    <span className={interestValue ? "" : "text-slate-400 lg:text-[#6b7280]"}>{interestValue || "Co Cię interesuje?"}</span>
                    <span className={`shrink-0 transition-transform duration-300 ${interestOpen ? "rotate-180" : ""}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                    </span>
                  </button>
                  <div className={`cf-select-dropdown absolute left-0 right-0 top-full z-50 mt-2 max-h-[280px] overflow-y-auto rounded-2xl border border-[#2c3145] bg-[#1a1e2e] shadow-[0_12px 40px_rgba(0,0,0,.4),0_0_20px_rgba(220,30,30,.06)] transition-all duration-300 ${interestOpen ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 -translate-y-2"}`}>
                    {INTEREST_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { setInterestValue(opt); setInterestOpen(false); }}
                        className="cf-select-option w-full px-5 py-3.5 text-left text-[15px] text-white transition-all duration-200 hover:bg-[rgba(220,30,30,.12)] hover:pl-6"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea name="message" placeholder="Twoje pytanie" rows={4} className="w-full min-h-[100px] rounded-2xl lg:rounded-[11px] border border-slate-200 lg:border-[#2c3145] bg-slate-50 lg:bg-[#1c2030] px-4 py-3 text-slate-900 lg:text-white placeholder:text-slate-400 lg:placeholder:text-[#525b6e] focus:border-[var(--red)] focus:outline-none focus:ring-2 focus:ring-[rgba(220,30,30,.14)] mb-3 lg:mb-4 resize-y" required />
                {formError && <p className="text-[13px] text-red-400 mb-3">{formError}</p>}
                <button
                  type="submit"
                  disabled={formLoading || formSent}
                  className={`cf-submit w-full min-h-[48px] py-3.5 rounded-2xl lg:rounded-[13px] font-semibold text-white transition-colors disabled:opacity-70 ${formSent ? "bg-[#16a34a]" : ""}`}
                  style={formSent ? {} : { background: "linear-gradient(135deg, #dc1e1e, #b81818)" }}
                >
                  {formSent ? "✓ Wysłano! Odezwiemy się wkrótce" : formLoading ? "Wysyłanie..." : "Wyślij zapytanie"}
                </button>
                <p className="text-[12px] text-slate-400 lg:text-[#525b6e] mt-3">Nie spamujemy. Odpowiadamy zazwyczaj w ciągu kilku godzin.</p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 13. FOOTER CTA */}
      <section className="relative bg-white lg:bg-[#09090d] border-t border-slate-100 lg:border-white/[0.035] section-padding py-14 lg:py-20 px-5 sm:px-8 lg:px-[52px] text-center">
        <div className="absolute inset-0 pointer-events-none hidden lg:block" style={{ background: "radial-gradient(circle at 50% 50%, rgba(220,30,30,.05), transparent 50%)" }} />
        <div className="mx-auto max-w-[640px] relative">
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 lg:text-[#525b6e] mb-2">ul. Orkana 16B · Rabka-Zdrój · Zapraszamy</p>
          <h2 className="font-[family-name:var(--font-unbounded)] font-black text-slate-900 lg:text-white mb-4" style={{ fontSize: "clamp(32px, 5vw, 70px)" }}>
            Odwiedź nas. <em className="italic" style={{ color: "var(--red)" }}>Czekamy.</em>
          </h2>
          <p className="text-slate-500 lg:text-[#9ca3af] mb-8">Sklep stacjonarny otwarty od poniedziałku do soboty. Przyjdź, obejrzyj sprzęt, porozmawiaj ze specjalistą.</p>
          <div className="fct-btns flex flex-col sm:flex-row flex-wrap justify-center gap-3 lg:gap-4">
            <a href="tel:883200151" className="btn-primary min-h-[48px] rounded-2xl lg:rounded-xl">Zadzwoń: 883 200 151</a>
            <Link href="#formularz" className="inline-flex items-center justify-center gap-2 min-h-[48px] rounded-2xl lg:rounded-xl border-2 border-slate-200 lg:border-white/50 bg-white lg:bg-white/10 px-5 py-3 text-base font-semibold text-slate-700 lg:text-white shadow-[0_2px_8px_rgba(15,23,42,0.06)] lg:shadow-none hover:border-white hover:bg-white/20 transition-all">
              Formularz zapytania →
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
