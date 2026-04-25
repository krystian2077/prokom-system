"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  ChevronRight,
  Zap,
  Receipt,
  Package,
  Users,
  Smartphone,
  Laptop,
  Printer,
  Tablet,
  Gamepad2,
  Watch,
  Monitor,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { PremiumButton } from "@/components/ui/PremiumButton";

const BENEFITS: { label: string; icon: LucideIcon }[] = [
  { label: "Szybka diagnoza", icon: Zap },
  { label: "Transparentna wycena", icon: Receipt },
  { label: "Wysokiej jakości części", icon: Package },
  { label: "Doświadczeni technicy", icon: Users },
];

const HERO_DEVICES: { label: string; icon: LucideIcon }[] = [
  { label: "Telefony", icon: Smartphone },
  { label: "Laptopy", icon: Laptop },
  { label: "Drukarki", icon: Printer },
  { label: "Tablety", icon: Tablet },
  { label: "Konsole", icon: Gamepad2 },
  { label: "Smartwatche", icon: Watch },
  { label: "Komputery stacjonarne", icon: Monitor },
];

const ROTATING_PHRASES = [
  "Naprawy telefonów, laptopów, tabletów i drukarek",
  "Serwis stacjonarny i zgłoszenia online",
  "Diagnostyka, wycena i profesjonalna naprawa",
  "Folie ochronne, szkła i akcesoria dostępne na miejscu",
  "Serwis dla klientów indywidualnych i firm",
];
const ROTATE_INTERVAL_MS = 4000;

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.08 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export function Hero() {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setPhraseIndex((i) => (i + 1) % ROTATING_PHRASES.length),
      ROTATE_INTERVAL_MS
    );
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-gray-50/30 to-gray-100/60 max-lg:bg-gradient-to-b max-lg:from-white max-lg:via-rose-50/30 max-lg:to-white">
      {/* ——— Premium background composition (desktop only) ——— */}
      <div className="contents max-lg:hidden" aria-hidden>
        <div className="pointer-events-none absolute -right-80 -top-52 h-[520px] w-[520px] rounded-full opacity-[0.06] blur-[100px]" style={{ background: "#e11d1d" }} />
        <div className="pointer-events-none absolute bottom-1/4 -left-40 h-[380px] w-[380px] rounded-full opacity-[0.04] blur-[80px]" style={{ background: "#e11d1d" }} />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.03] blur-[120px]" style={{ background: "#e11d1d" }} />
        <div className="pointer-events-none absolute left-0 top-0 h-full w-[55%] bg-gradient-to-r from-white/40 via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.015]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #0f0f0f 1px, transparent 0)`, backgroundSize: "32px 32px" }} />
      </div>

      {/* Subtle mobile glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-[300px] w-[300px] rounded-full opacity-[0.07] blur-[80px] lg:hidden" style={{ background: "#e11d1d" }} aria-hidden />

      <div className="relative mx-auto max-w-[1600px] px-5 py-6 sm:px-6 sm:py-16 lg:px-8 lg:py-24 xl:px-10">
        <div className="grid items-center gap-5 sm:gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 xl:gap-20">

          {/* ——— LEFT COLUMN ——— */}
          <div className="flex flex-col justify-center lg:max-w-[540px]">
            <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col">

              {/* Badge */}
              <motion.div variants={staggerItem} className="inline-flex w-fit">
                <span className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full border border-white/20 bg-primary px-5 py-2.5 shadow-[0_4px_24px_-8px_rgba(225,29,29,0.5)] sm:gap-3 sm:px-6 sm:py-3">
                  <motion.span className="pointer-events-none absolute inset-0 w-[70%] bg-gradient-to-r from-transparent via-white/40 to-transparent blur-[1px]" animate={{ x: ["-100%", "200%"] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", repeatDelay: 0.8 }} aria-hidden />
                  <Award className="relative h-5 w-5 shrink-0 text-white sm:h-6 sm:w-6" strokeWidth={2} />
                  <span className="relative text-[13px] font-semibold tracking-tight text-white sm:text-base lg:text-lg">
                    Lokalny lider serwisu elektroniki
                  </span>
                </span>
              </motion.div>

              {/* Headline — compact on mobile */}
              <motion.h1
                variants={staggerItem}
                className="mt-4 text-[26px] font-extrabold leading-[1.12] tracking-[-0.035em] text-dark xs:text-[30px] sm:mt-8 sm:text-4xl sm:leading-[1.18] lg:mt-6 lg:text-[2.35rem] lg:leading-[1.22] xl:text-[2.6rem] xl:leading-[1.2]"
              >
                Profesjonalny serwis
                <br className="sm:hidden" />{" "}elektroniki,
                <br />
                któremu możesz{" "}
                <span className="text-primary">zaufać.</span>
              </motion.h1>

              {/* Short paragraph on mobile, full on desktop */}
              <motion.p
                variants={staggerItem}
                className="mt-3 max-w-lg text-[15px] leading-[1.6] text-neutral sm:mt-5 sm:text-lg sm:leading-relaxed"
              >
                <span className="sm:hidden">Szybka diagnoza, uczciwa wycena, doświadczeni technicy. Telefony, laptopy, tablety i nie tylko.</span>
                <span className="hidden sm:inline">Telefony, laptopy, tablety, drukarki i nie tylko. Szybka
                diagnoza, uczciwa wycena i doświadczeni technicy. Dbamy o Twój
                sprzęt tak, jak o własny — dlatego stawiamy na profesjonalną
                obsługę i wysoką jakość każdej naprawy.</span>
              </motion.p>

              {/* CTA — immediately after text on mobile for above-fold impact */}
              <motion.div
                variants={staggerItem}
                className="mt-5 flex gap-3 sm:mt-11 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6 max-sm:flex-col"
              >
                <PremiumButton
                  href="/zgloszenie"
                  variant="primary"
                  size="lg"
                  className="min-h-[50px] w-full rounded-2xl px-6 py-3.5 text-[15px] font-bold shadow-[0_6px_24px_-6px_rgba(225,29,29,0.4)] transition-all duration-300 hover:shadow-[0_10px_32px_-8px_rgba(225,29,29,0.45)] hover:-translate-y-0.5 sm:min-h-[50px] sm:w-auto sm:rounded-xl sm:px-8 sm:text-base sm:font-semibold"
                >
                  Zgłoś naprawę
                  <ChevronRight className="ml-2 h-5 w-5" />
                </PremiumButton>
                <PremiumButton
                  href="/kontakt"
                  variant="outline"
                  size="lg"
                  className="min-h-[50px] w-full rounded-2xl border-2 border-gray-200 bg-white px-6 py-3.5 text-[15px] font-bold text-dark transition-all duration-300 hover:border-dark/30 hover:bg-gray-50 sm:min-h-[50px] sm:w-auto sm:rounded-xl sm:border-gray-300 sm:px-8 sm:text-base sm:font-semibold"
                >
                  Kontakt
                  <ChevronRight className="ml-2 h-5 w-5" />
                </PremiumButton>
              </motion.div>

              {/* Dynamic micro-text — hidden on small mobile to keep compact, visible sm+ */}
              <motion.div variants={staggerItem} className="mt-4 hidden min-h-[2.25rem] sm:block">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={phraseIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                    className="text-sm font-semibold text-primary sm:text-base"
                  >
                    {ROTATING_PHRASES[phraseIndex]}
                  </motion.p>
                </AnimatePresence>
              </motion.div>

              {/* Benefits — desktop only (mobile version is below the image grid) */}
              <motion.ul
                variants={stagger}
                className="mt-7 hidden grid-cols-2 gap-x-6 gap-y-4 sm:gap-x-8 sm:gap-y-5 lg:mt-8 lg:grid"
              >
                {BENEFITS.map(({ label, icon: Icon }) => (
                  <motion.li key={label} variants={staggerItem} className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary shadow-[0_2px_8px_-2px_rgba(225,29,29,0.2)]">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <span className="text-sm font-medium text-dark sm:text-base">{label}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          </div>

          {/* ——— RIGHT COLUMN: image ——— */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative flex justify-center max-lg:-order-none lg:block"
          >
            <div className="relative w-full max-w-[560px] lg:max-w-none">
              <div className="absolute -inset-8 rounded-[2rem] opacity-[0.08] blur-3xl max-lg:hidden" style={{ background: "#e11d1d" }} />
              <div className="absolute -inset-4 rounded-3xl opacity-[0.05] blur-2xl max-lg:hidden" style={{ background: "#0f0f0f" }} />
              <div className="relative h-[220px] w-full overflow-hidden rounded-[20px] border border-gray-100 bg-gray-100 shadow-[0_4px_16px_rgba(15,23,42,0.08),0_16px_32px_rgba(15,23,42,0.06)] sm:h-[540px] sm:rounded-3xl sm:border-white/60 sm:shadow-[0_24px_48px_-16px_rgba(0,0,0,0.18)] lg:h-[620px] xl:h-[700px]">
                <Image
                  src="/images/unnamed.webp"
                  alt="PRO-KOM — siedziba serwisu elektroniki"
                  fill
                  className="object-cover object-center"
                  style={{ objectPosition: "center 28%" }}
                  priority
                  sizes="(max-width: 1023px) 100vw, 55vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/5" aria-hidden />
                {/* Slider — desktop only (on mobile it renders below benefits) */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                  className="absolute bottom-5 left-5 right-5 hidden overflow-hidden rounded-2xl border border-white/40 bg-white/90 py-3.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.15)] backdrop-blur-xl sm:block"
                >
                  <div className="relative overflow-hidden">
                    <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-white/90 to-transparent" aria-hidden />
                    <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-white/90 to-transparent" aria-hidden />
                    <motion.div
                      className="flex w-max flex-nowrap items-center gap-12"
                      animate={{ x: ["0%", "-50%"] }}
                      transition={{ duration: 32, repeat: Infinity, repeatType: "loop", ease: "linear" }}
                    >
                      {[1, 2].map((copy) => (
                        <div key={copy} className="flex flex-shrink-0 flex-nowrap items-center gap-12">
                          {HERO_DEVICES.map(({ label, icon: Icon }) => (
                            <span key={`${copy}-${label}`} className="flex flex-shrink-0 items-center gap-4 text-dark">
                              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Icon className="h-7 w-7" strokeWidth={2} />
                              </span>
                              <span className="whitespace-nowrap text-lg font-medium">{label}</span>
                            </span>
                          ))}
                        </div>
                      ))}
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Benefits section visible on mobile below the image */}
        <div className="mt-6 grid grid-cols-2 gap-3 lg:hidden">
          {BENEFITS.map(({ label, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-[0_1px_4px_rgba(15,23,42,0.04),0_6px_16px_rgba(15,23,42,0.06)]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
              </span>
              <span className="text-[13px] font-semibold leading-tight text-dark">{label}</span>
            </div>
          ))}
        </div>

        {/* Device slider — mobile only, below benefits */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-5 overflow-hidden rounded-2xl border border-gray-100 bg-white py-3 shadow-[0_1px_4px_rgba(15,23,42,0.04),0_6px_16px_rgba(15,23,42,0.06)] sm:hidden"
        >
          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-white to-transparent" aria-hidden />
            <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-white to-transparent" aria-hidden />
            <motion.div
              className="flex w-max flex-nowrap items-center gap-6"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 28, repeat: Infinity, repeatType: "loop", ease: "linear" }}
            >
              {[1, 2].map((copy) => (
                <div key={copy} className="flex flex-shrink-0 flex-nowrap items-center gap-6">
                  {HERO_DEVICES.map(({ label, icon: Icon }) => (
                    <span key={`m-${copy}-${label}`} className="flex flex-shrink-0 items-center gap-2 text-dark">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" strokeWidth={2.2} />
                      </span>
                      <span className="whitespace-nowrap text-[13px] font-medium">{label}</span>
                    </span>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
