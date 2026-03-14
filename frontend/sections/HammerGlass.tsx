"use client";

import { motion } from "framer-motion";
import { Shield, Sparkles } from "lucide-react";
import Image from "next/image";
import { PremiumButton } from "@/components/ui/PremiumButton";

const VARIANTS = [
  {
    tier: "ENTRY",
    name: "Active Shield",
    accent: "from-[#5fe6ff] to-[#2ca4ff]",
    dotColor: "bg-cyan-400",
    dotCount: 3,
  },
  {
    tier: "MEDIUM",
    name: "Cristal Shield",
    accent: "from-[#82b4ff] to-[#4a7dff]",
    dotColor: "bg-sky-500",
    dotCount: 4,
  },
  {
    tier: "SPECIAL",
    name: "Private View",
    accent: "from-[#ff7676] to-[#ff2b4a]",
    dotColor: "bg-red-500",
    dotCount: 5,
  },
  {
    tier: "MEDIUM",
    name: "Matte Finish",
    accent: "from-[#c9b6ff] to-[#8f7bff]",
    dotColor: "bg-violet-500",
    dotCount: 4,
  },
  {
    tier: "PREMIUM",
    name: "Prime Protector",
    accent: "from-[#ffd27f] to-[#ff9b3d]",
    dotColor: "bg-amber-500",
    dotCount: 5,
  },
  {
    tier: "PREMIUM",
    name: "Cristal UV",
    accent: "from-[#ffb4e8] to-[#ff6ac5]",
    dotColor: "bg-pink-500",
    dotCount: 5,
  },
  {
    tier: "SPECIAL",
    name: "Watch Armour",
    accent: "from-[#c3c9d4] to-[#9198a7]",
    dotColor: "bg-slate-500",
    dotCount: 4,
  },
  {
    tier: "SPECIAL",
    name: "Tablet Armour",
    accent: "from-[#f0c27b] to-[#d38312]",
    dotColor: "bg-orange-600",
    dotCount: 4,
  },
  {
    tier: "ENTRY",
    name: "Active Shield Matte",
    accent: "from-[#9ff7e5] to-[#42d3c3]",
    dotColor: "bg-teal-400",
    dotCount: 3,
  },
];

const STATS = [
  { label: "MODELI", value: "10K+", helper: "Telefony, tablety, smartwatche" },
  { label: "FOLII", value: "9", helper: "Różne wykończenia i kolory" },
  { label: "MONTAŻ", value: "~5 min", helper: "Cięcie i aplikacja na miejscu" },
  { label: "PRECYZJA", value: "0.1 mm", helper: "Dopasowanie do krawędzi" },
];

export function HammerGlass() {
  return (
    <section className="bg-white py-12 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
          {/* Lewa kolumna – opis i liczby */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white sm:text-sm">
              <span
                className="h-1.5 w-1.5 rounded-full bg-white"
                aria-hidden
              />
              Dostępne w serwisie PRO-KOM
            </span>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.28em] text-neutral">
              HAMMER GLASS <span className="text-primary">CUT</span>
            </p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-dark sm:text-5xl">
              Folia ochronna wycinana{" "}
              <span className="text-primary">precyzyjnie na miejscu</span>
            </h2>
            <p className="mt-6 max-w-xl text-lg text-neutral" style={{ lineHeight: 1.7 }}>
              Ploter Hammer Glass CUT wycina folię perfekcyjnie dopasowaną do Twojego telefonu,
              tabletu lub smartwatcha — w naszym serwisie, w kilkadziesiąt sekund. Zero
              kompromisów, pełna ochrona.
            </p>

            <ul className="mt-8 space-y-4 text-sm sm:text-base">
              <li className="flex items-start gap-3">
                <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Shield className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-dark">
                    Baza 10 000+ modeli
                  </p>
                  <p className="text-neutral">
                    Telefony, tablety, smartwatche — perfekcyjne wycięcie dla każdego urządzenia.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-dark">9 rodzajów folii</p>
                  <p className="text-neutral">
                    Clear, Matte, Private View, UV, Prime i więcej — każda z certyfikatami PZH i RoHS.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Shield className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-dark">Montaż w ~5 minut</p>
                  <p className="text-neutral">
                    Cięcie i aplikacja na miejscu — sucho, bez bąbelków i bez oczekiwania.
                  </p>
                </div>
              </li>
            </ul>

            {/* Liczby – dolny panel */}
            <div className="mt-8 grid gap-3 rounded-2xl bg-[#fafafa] p-4 text-xs sm:grid-cols-4 sm:gap-4 sm:p-5 sm:text-sm">
              {STATS.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl bg-white/70 px-3 py-3 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:px-3.5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral">
                    {item.label}
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-dark sm:text-xl">
                    {item.value}
                  </p>
                  <p className="mt-1 text-[11px] text-neutral">
                    {item.helper}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <PremiumButton href="/hammer-glass" variant="primary" size="lg">
                Więcej o produkcie
              </PremiumButton>
            </div>
          </motion.div>

          {/* Prawa kolumna – wizualizacja + karty folii */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="relative"
          >
            {/* Główna karta wizualizacji – samo wideo na całą powierzchnię */}
            <div
              className="relative overflow-hidden rounded-3xl border border-[#e5e5e5] bg-black shadow-[0_18px_45px_rgba(0,0,0,0.45)]"
              style={{ minHeight: 260 }}
            >
              <video
                className="h-full w-full object-cover"
                src="/Hammer%20Glass%20Cut%20Ploter%20-%20PREZENTACJA.mp4"
                autoPlay
                loop
                muted
                playsInline
              />
            </div>

            {/* Karty rodzajów folii */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {VARIANTS.map((v, i) => (
                <motion.div
                  key={v.name}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.04 }}
                  className="group relative overflow-hidden rounded-2xl border border-neutral/20 bg-white shadow-[0_6px_20px_rgba(0,0,0,0.04)]"
                >
                  {/* Kolorowa linia u góry karty */}
                  <div
                    className={`h-[3px] w-full bg-gradient-to-r ${v.accent}`}
                    aria-hidden
                  />
                  <div className="px-3.5 py-3 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral">
                          {v.tier}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-dark">
                          {v.name}
                        </p>
                      </div>
                      <Sparkles
                        className="h-4 w-4 text-primary/80"
                        aria-hidden
                      />
                    </div>
                    {/* Kropki „poziomu” jak na wzorze */}
                    <div className="mt-3 flex gap-1.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <span
                          key={j}
                          className={`h-1.5 w-1.5 rounded-full ${
                            j < v.dotCount ? v.dotColor : "bg-neutral/25"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Dodatkowy kafelek – precyzyjne cięcie */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25 }}
              className="mt-4 overflow-hidden rounded-2xl border border-neutral/15 bg-white/95 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
            >
              <div className="h-[3px] w-full bg-gradient-to-r from-primary via-amber-400 to-emerald-400" />
              <motion.div
                initial={{ backgroundPositionX: "0%" }}
                animate={{ backgroundPositionX: "100%" }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                className="px-4 py-3 sm:px-5 sm:py-4"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 0% 0%, rgba(220,30,30,0.05), transparent 55%), radial-gradient(circle at 100% 100%, rgba(0,200,120,0.04), transparent 55%)",
                  backgroundSize: "160% 160%",
                }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral">
                  PRECYZJA CIĘCIA
                </p>
                <p className="mt-1 text-sm font-semibold text-dark sm:text-base">
                  Precyzyjne cięcie folii do&nbsp;
                  <span className="text-primary font-extrabold">0,1&nbsp;mm</span>{" "}
                  dopasowania do krawędzi urządzenia.
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
