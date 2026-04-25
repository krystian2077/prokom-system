"use client";

import { Shield, Phone, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const STATS = [
  { value: "10K+", label: "Modeli" },
  { value: "9", label: "Rodzajów" },
  { value: "~5 min", label: "Montaż" },
  { value: "0.1 mm", label: "Precyzja" },
];

const FILM_TYPES = [
  { name: "Prime Protector", tier: "PREMIUM", color: "#f59e0b", desc: "Samoregeneracja" },
  { name: "Cristal Shield", tier: "MEDIUM", color: "#38bdf8", desc: "UV ochrona" },
  { name: "Private View", tier: "SPECIAL", color: "#a78bfa", desc: "Prywatność" },
];

export default function HammerHero() {
  return (
    <section className="relative overflow-hidden bg-[#0a0b0e] text-white lg:min-h-[92vh]">
      {/* Background effects */}
      <div
        className="pointer-events-none absolute -left-[100px] -top-[100px] h-[500px] w-[500px] max-lg:h-[300px] max-lg:w-[300px] max-lg:-left-[60px] max-lg:-top-[60px]"
        style={{ background: "radial-gradient(ellipse at center, rgba(220,30,30,0.14) 0%, transparent 65%)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-[80px] -right-[80px] h-[400px] w-[400px] max-lg:h-[250px] max-lg:w-[250px]"
        style={{ background: "radial-gradient(ellipse at center, rgba(100,0,255,0.08) 0%, transparent 65%)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 10%, transparent 75%)",
        }}
        aria-hidden
      />

      {/* Animated accent particles */}
      <div className="pointer-events-none absolute top-20 right-10 h-2 w-2 rounded-full bg-red-500/60 lg:hidden" style={{ animation: "float 3s ease-in-out infinite" }} aria-hidden />
      <div className="pointer-events-none absolute top-40 left-8 h-1.5 w-1.5 rounded-full bg-violet-400/50 lg:hidden" style={{ animation: "float 4s ease-in-out 1s infinite" }} aria-hidden />
      <div className="pointer-events-none absolute bottom-32 right-6 h-1 w-1 rounded-full bg-sky-400/40 lg:hidden" style={{ animation: "float 3.5s ease-in-out 0.5s infinite" }} aria-hidden />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes shimmer-line { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes pulse-ring { 0%{box-shadow:0 0 0 0 rgba(220,30,30,.4)} 70%{box-shadow:0 0 0 12px rgba(220,30,30,0)} 100%{box-shadow:0 0 0 0 rgba(220,30,30,0)} }
      ` }} />

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 pb-10 pt-20 max-lg:pb-10 max-lg:pt-20 lg:grid lg:grid-cols-2 lg:gap-16 lg:px-20 lg:py-20 lg:min-h-[92vh]">
        {/* Left column */}
        <div className="flex flex-col justify-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex w-fit items-center gap-2.5 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-red-400"
          >
            <span className="h-2 w-2 rounded-full bg-red-500" style={{ animation: "pulse-ring 2s infinite" }} />
            Dostępne w PRO‑KOM
          </motion.div>

          {/* Tag */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-2 mt-5 max-lg:mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30"
          >
            HAMMER GLASS CUT
          </motion.p>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mb-5 max-lg:mb-4 text-[28px] font-extrabold leading-[1.1] tracking-[-0.03em] text-white sm:text-[42px] lg:text-[56px] lg:leading-[1.06] lg:tracking-[-0.04em]"
          >
            Folia ochronna
            <br />
            wycinana{" "}
            <span className="bg-gradient-to-r from-red-500 via-red-400 to-rose-400 bg-clip-text text-transparent">
              precyzyjnie
            </span>
            <br />
            na miejscu.
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mb-6 max-lg:mb-5 max-w-[420px] text-[14px] leading-[1.7] text-white/60 sm:text-[15px]"
          >
            Ploter Hammer Glass CUT wycina folię perfekcyjnie dopasowaną do Twojego urządzenia — w kilkadziesiąt sekund. Zero kompromisów, pełna ochrona do 0,1&nbsp;mm dokładności.
          </motion.p>

          {/* Stats — compact glass cards */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-6 max-lg:mb-5 grid grid-cols-4 gap-2"
          >
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center rounded-2xl border border-white/[0.06] bg-white/[0.03] px-2 py-3 backdrop-blur-sm">
                <span className="text-[18px] font-extrabold tracking-tight sm:text-[22px]">{s.value}</span>
                <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/35">{s.label}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3"
          >
            <Link
              href="#folie"
              className="flex min-h-[52px] items-center justify-center gap-2.5 rounded-2xl bg-red-600 px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_4px_24px_rgba(225,29,29,0.4)] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_8px_32px_rgba(225,29,29,0.5)] active:scale-[0.97] sm:inline-flex sm:w-auto lg:min-h-[44px] lg:rounded-xl lg:px-6 lg:py-3"
            >
              <Shield className="h-4 w-4" aria-hidden />
              Zobacz folie
            </Link>
            <Link
              href="tel:883200151"
              className="flex min-h-[52px] items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-[15px] font-bold text-white/80 backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:bg-white/10 active:scale-[0.97] sm:inline-flex sm:w-auto lg:min-h-[44px] lg:rounded-xl lg:py-3"
            >
              <Phone className="h-4 w-4" aria-hidden />
              Umów wizytę
            </Link>
          </motion.div>

          {/* Film type pills — mobile only */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="mt-6 flex gap-2.5 overflow-x-auto scrollbar-none lg:hidden"
          >
            {FILM_TYPES.map((f) => (
              <div key={f.name} className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 backdrop-blur-sm">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: f.color }} />
                <div>
                  <p className="text-[11px] font-semibold text-white/80">{f.name}</p>
                  <p className="text-[9px] font-medium text-white/35">{f.tier} · {f.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right column — phone mockup */}
        <div className="hidden items-center justify-center lg:flex lg:py-16">
          <div className="relative w-full max-w-[480px]">
            <div className="mx-auto w-[240px] animate-[float_4s_ease-in-out_infinite]">
              <div className="rounded-[36px] bg-gradient-to-br from-[#1a1d23] to-[#0d0e10] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_20px_60px_rgba(0,0,0,0.6),0_40px_100px_rgba(220,30,30,0.1)]">
                <div className="relative flex h-[470px] flex-col items-center justify-center gap-4 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1e2128] to-[#13151a]">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[rgba(220,30,30,0.06)] to-transparent" />
                  <div className="relative z-10 text-center">
                    <p className="font-syne text-[13px] font-black tracking-[0.08em] text-white">
                      HAMMER <span className="text-[#e11d1d]">GLASS</span>
                    </p>
                  </div>
                  <div className="relative z-10 flex items-center justify-center">
                    <div className="flex h-24 w-20 items-center justify-center rounded-t-xl rounded-b-[50%] border-2 border-[rgba(220,30,30,0.3)] bg-gradient-to-br from-[rgba(220,30,30,0.15)] to-[rgba(220,30,30,0.05)]">
                      <Shield className="h-9 w-9 text-[#e11d1d]" aria-hidden />
                    </div>
                  </div>
                  <p className="relative z-10 text-[10px] tracking-[0.06em] text-[#333]">
                    PRECYZYJNE CIĘCIE 0.1 MM
                  </p>
                </div>
              </div>
            </div>

            {/* Floating film cards — desktop */}
            <div className="pointer-events-none">
              <div className="absolute left-[-40px] top-[10%] animate-[float_3.5s_0.5s_ease-in-out_infinite] rounded-2xl border border-white/10 bg-[#13151a] px-3.5 py-2.5 text-[11px] text-white shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                <p className="mb-0.5 font-semibold text-[#ddd]">
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />
                  Prime Protector
                </p>
                <p className="text-[10px] font-medium text-[#555]">PREMIUM · Samoregeneracja</p>
              </div>
              <div className="absolute right-[-50px] top-[35%] animate-[float_4s_1s_ease-in-out_infinite] rounded-2xl border border-white/10 bg-[#13151a] px-3.5 py-2.5 text-[11px] text-white shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                <p className="mb-0.5 font-semibold text-[#ddd]">
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-sky-400" />
                  Cristal Shield
                </p>
                <p className="text-[10px] font-medium text-[#555]">MEDIUM · UV ochrona</p>
              </div>
              <div className="absolute bottom-[15%] left-[-30px] animate-[float_3.8s_0.2s_ease-in-out_infinite] rounded-2xl border border-white/10 bg-[#13151a] px-3.5 py-2.5 text-[11px] text-white shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                <p className="mb-0.5 font-semibold text-[#ddd]">
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-violet-400" />
                  Private View
                </p>
                <p className="text-[10px] font-medium text-[#555]">SPECIAL · Prywatność</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
