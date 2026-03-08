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
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-gray-50/30 to-gray-100/60">
      {/* ——— Premium background composition ——— */}
      <div
        className="pointer-events-none absolute -right-80 -top-52 h-[520px] w-[520px] rounded-full opacity-[0.06] blur-[100px]"
        style={{ background: "#e11d1d" }}
      />
      <div
        className="pointer-events-none absolute bottom-1/4 -left-40 h-[380px] w-[380px] rounded-full opacity-[0.04] blur-[80px]"
        style={{ background: "#e11d1d" }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.03] blur-[120px]"
        style={{ background: "#e11d1d" }}
      />
      {/* Soft radial behind content */}
      <div
        className="pointer-events-none absolute left-0 top-0 h-full w-[55%] bg-gradient-to-r from-white/40 via-transparent to-transparent"
        aria-hidden
      />
      {/* Very subtle pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #0f0f0f 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1600px] px-5 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24 xl:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 xl:gap-20">
          {/* ——— LEFT COLUMN ——— */}
          <div className="flex flex-col justify-center lg:max-w-[540px]">
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="flex flex-col"
            >
              {/* 1. Badge — czerwone tło, biały tekst, smuga */}
              <motion.div
                variants={staggerItem}
                className="inline-flex w-fit"
              >
                <span className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-white/20 bg-primary px-6 py-3 shadow-[0_4px 24px -8px rgba(225,29,29,0.5)]">
                  {/* Smuga — ciągła, elegancka */}
                  <motion.span
                    className="pointer-events-none absolute inset-0 w-[70%] bg-gradient-to-r from-transparent via-white/40 to-transparent blur-[1px]"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{
                      repeat: Infinity,
                      duration: 3.5,
                      ease: "easeInOut",
                      repeatDelay: 0.8,
                    }}
                    aria-hidden
                  />
                  <motion.span
                    className="pointer-events-none absolute inset-0 w-[50%] bg-gradient-to-r from-transparent via-white/25 to-transparent"
                    animate={{ x: ["-100%", "220%"] }}
                    transition={{
                      repeat: Infinity,
                      duration: 4.5,
                      ease: "easeInOut",
                      repeatDelay: 0.4,
                    }}
                    aria-hidden
                  />
                  <Award
                    className="relative h-6 w-6 shrink-0 text-white"
                    strokeWidth={2}
                  />
                  <span className="relative text-base font-semibold tracking-tight text-white sm:text-lg">
                    Lokalny lider serwisu elektroniki
                  </span>
                </span>
              </motion.div>

              {/* 2. Headline — refined, subtle red emphasis */}
              <motion.h1
                variants={staggerItem}
                className="mt-7 text-3xl font-bold leading-[1.2] tracking-tight text-dark sm:mt-8 sm:text-4xl sm:leading-[1.18] lg:text-[2.35rem] lg:leading-[1.22] xl:text-[2.6rem] xl:leading-[1.2]"
              >
                Profesjonalny serwis elektroniki,
                <br />
                któremu możesz{" "}
                <span className="text-primary">zaufać.</span>
              </motion.h1>

              {/* 3. Supporting paragraph */}
              <motion.p
                variants={staggerItem}
                className="mt-4 max-w-lg text-base leading-relaxed text-neutral sm:mt-5 sm:text-lg"
              >
                Telefony, laptopy, tablety, drukarki i nie tylko. Szybka
                diagnoza, uczciwa wycena i doświadczeni technicy. Dbamy o Twój
                sprzęt tak, jak o własny — dlatego stawiamy na profesjonalną
                obsługę i wysoką jakość każdej naprawy.
              </motion.p>

              {/* 4. Dynamic micro-text */}
              <motion.div
                variants={staggerItem}
                className="mt-4 min-h-[2.25rem] sm:mt-5"
              >
                <AnimatePresence mode="wait">
                  <motion.p
                    key={phraseIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{
                      duration: 0.4,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                    className="text-sm font-semibold text-primary sm:text-base"
                  >
                    {ROTATING_PHRASES[phraseIndex]}
                  </motion.p>
                </AnimatePresence>
              </motion.div>

              {/* 5. Benefits list — 2 columns, distinct icons */}
              <motion.ul
                variants={stagger}
                className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 sm:mt-8 sm:gap-x-8 sm:gap-y-5"
              >
                {BENEFITS.map(({ label, icon: Icon }) => (
                  <motion.li
                    key={label}
                    variants={staggerItem}
                    className="flex items-center gap-3"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary shadow-[0_2px 8px -2px rgba(225,29,29,0.2)]">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <span className="text-sm font-medium text-dark sm:text-base">
                      {label}
                    </span>
                  </motion.li>
                ))}
              </motion.ul>

              {/* 6. CTA row */}
              <motion.div
                variants={staggerItem}
                className="mt-9 flex flex-wrap items-center gap-5 sm:mt-11 sm:gap-6"
              >
                <PremiumButton
                  href="/zgloszenie"
                  variant="primary"
                  size="lg"
                  className="min-h-[50px] rounded-xl px-7 text-base font-semibold shadow-[0_6px 24px -6px rgba(225,29,29,0.4)] transition-all duration-300 hover:shadow-[0_10px 32px -8px rgba(225,29,29,0.45)] hover:-translate-y-0.5 sm:px-8"
                >
                  Zgłoś naprawę
                  <ChevronRight className="ml-2.5 h-5 w-5" />
                </PremiumButton>
                <PremiumButton
                  href="/kontakt"
                  variant="outline"
                  size="lg"
                  className="min-h-[50px] rounded-xl border-2 border-gray-300 bg-white px-7 text-base font-semibold text-dark transition-all duration-300 hover:border-dark/30 hover:bg-gray-50 sm:px-8"
                >
                  Kontakt
                  <ChevronRight className="ml-2.5 h-5 w-5" />
                </PremiumButton>
              </motion.div>
            </motion.div>
          </div>

          {/* ——— RIGHT COLUMN: image ——— */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: 0.12,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="relative flex justify-center lg:block"
          >
            <div className="relative w-full max-w-[560px] lg:max-w-none">
              {/* Layered glow behind image */}
              <div
                className="absolute -inset-8 rounded-[2rem] opacity-[0.08] blur-3xl"
                style={{ background: "#e11d1d" }}
              />
              <div
                className="absolute -inset-4 rounded-3xl opacity-[0.05] blur-2xl"
                style={{ background: "#0f0f0f" }}
              />
              {/* Image container — stronger shadow, frame feel */}
              <div className="relative h-[440px] w-full overflow-hidden rounded-3xl border border-white/60 bg-gray-100 shadow-[0_32px 64px -20px rgba(0,0,0,0.18),0_0_0_1px rgba(0,0,0,0.04)] sm:h-[540px] lg:h-[620px] xl:h-[700px]">
                <Image
                  src="/images/unnamed.webp"
                  alt="PRO-KOM — siedziba serwisu elektroniki"
                  fill
                  className="object-cover object-center"
                  style={{ objectPosition: "center 28%" }}
                  priority
                  sizes="(max-width: 1023px) 100vw, 55vw"
                />
                {/* Overlay — depth + vignette */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/5"
                  aria-hidden
                />
                {/* Slider — naprawiane urządzenia, jeden wiersz, animacja w lewo */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.35,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  className="absolute bottom-4 left-4 right-4 overflow-hidden rounded-2xl border border-white/40 bg-white/90 py-3 shadow-[0_16px 40px -12px rgba(0,0,0,0.15)] backdrop-blur-xl sm:bottom-5 sm:left-5 sm:right-5 sm:py-3.5"
                >
                  <div className="relative overflow-hidden">
                    {/* Gradienty na krawędziach */}
                    <div
                      className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-white/90 to-transparent sm:w-16"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-white/90 to-transparent sm:w-16"
                      aria-hidden
                    />
                    <motion.div
                      className="flex w-max flex-nowrap items-center gap-9 sm:gap-12"
                      animate={{ x: ["0%", "-50%"] }}
                      transition={{
                        duration: 32,
                        repeat: Infinity,
                        repeatType: "loop",
                        ease: "linear",
                      }}
                    >
                      {[1, 2].map((copy) => (
                        <div
                          key={copy}
                          className="flex flex-shrink-0 flex-nowrap items-center gap-9 sm:gap-12"
                        >
                          {HERO_DEVICES.map(({ label, icon: Icon }) => (
                            <span
                              key={`${copy}-${label}`}
                              className="flex flex-shrink-0 items-center gap-3 text-dark sm:gap-4"
                            >
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-12 sm:w-12">
                                <Icon
                                  className="h-6 w-6 sm:h-7 sm:w-7"
                                  strokeWidth={2}
                                />
                              </span>
                              <span className="whitespace-nowrap text-base font-medium sm:text-lg">
                                {label}
                              </span>
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
      </div>

    </section>
  );
}
