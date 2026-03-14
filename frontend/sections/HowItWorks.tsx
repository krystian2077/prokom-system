"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

const BADGE_LABEL = "• PROSTY PROCES";
const TITLE = "Jak to działa?";
const TITLE_RED = "działa?";
const SUBTITLE =
  "Od zgłoszenia do odbioru – przejrzyście, szybko, bez niespodzianek i ukrytych kosztów.";

const steps = [
  {
    label: "KROK 1",
    title: "Zgłoś naprawę",
    description:
      "Wypełnij formularz online lub zadzwoń do nas. Opisz usterkę, podaj model urządzenia — to dosłownie chwila.",
    badge: "⏱ Mniej niż minuta",
    emoji: "📋",
  },
  {
    label: "KROK 2",
    title: "Diagnostyka",
    description:
      "Przeprowadzamy pełną diagnostykę urządzenia. Dowiesz się co jest nie tak, zanim podejmiesz jakąkolwiek decyzję.",
    badge: "📅 Tego samego dnia",
    emoji: "🔍",
  },
  {
    label: "KROK 3",
    title: "Wycena",
    description:
      "Otrzymujesz szczegółową, przejrzystą wycenę zanim cokolwiek ruszymy. Żadnych ukrytych kosztów ani niespodzianek.",
    badge: "✅ Bezpłatna wycena",
    emoji: "💰",
  },
  {
    label: "KROK 4",
    title: "Kontakt & decyzja",
    description:
      "Kontaktujemy się z Tobą telefonicznie lub SMS-em. Potwierdzasz naprawę — albo rezygnujesz bez żadnych konsekwencji.",
    badge: "🤝 Decydujesz Ty",
    emoji: "📞",
  },
  {
    label: "KROK 5",
    title: "Naprawa",
    description:
      "Używamy wyłącznie sprawdzonych, wysokiej jakości części zamiennych lub oryginalnych. Każda naprawa jest dokładnie testowana przed wydaniem sprzętu.",
    badge: "⭐ Gwarancja na usługę",
    emoji: "🔧",
  },
  {
    label: "KROK 6",
    title: "Odbiór urządzenia",
    description:
      "Odbierasz w pełni sprawny sprzęt osobiście w serwisie lub wysyłamy kurierem.",
    badge: "🚚 Wysyłka kurierem na terenie całej Polski",
    emoji: "✅",
  },
];

function StepCardContent({
  step,
}: {
  step: (typeof steps)[number];
}) {
  return (
    <div className="relative">
      <span
        className="text-xs font-semibold uppercase tracking-widest text-primary"
        style={{ letterSpacing: "0.12em" }}
      >
        {step.label}
      </span>
      <h3 className="mt-2 text-lg font-extrabold text-dark sm:text-xl lg:text-2xl" style={{ fontWeight: 800 }}>
        {step.title}
      </h3>
      <p className="mt-3 text-sm text-neutral sm:text-base" style={{ lineHeight: 1.7 }}>
        {step.description}
      </p>
      <span
        className="mt-4 inline-block rounded-full border px-3 py-1.5 text-sm font-medium text-primary"
        style={{
          background: "#fff5f5",
          border: "1px solid rgba(220,30,30,.15)",
        }}
      >
        {step.badge}
      </span>
    </div>
  );
}

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const [lineHeight, setLineHeight] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const stepsEl = stepsRef.current;
    if (!section || !stepsEl) return;

    const updateLine = () => {
      const viewportHeight = window.innerHeight;
      const scrollY = window.scrollY;
      const sectionTop = section.getBoundingClientRect().top + scrollY;
      const sectionHeight = section.offsetHeight;
      const stepsHeight = stepsEl.offsetHeight;
      const start = sectionTop - viewportHeight;
      const end = sectionTop + sectionHeight;
      const rawProgress = Math.max(0, Math.min(1, (scrollY - start) / (end - start)));
      // Gdy użytkownik jest przy końcu (dół kroków wchodzi w viewport), linia ma być w 100%
      const bottomVisible = scrollY >= sectionTop + stepsHeight - viewportHeight * 0.5;
      const progress = bottomVisible ? 1 : rawProgress;
      setLineHeight(progress * 100);
    };

    updateLine();
    window.addEventListener("scroll", updateLine, { passive: true });
    return () => window.removeEventListener("scroll", updateLine);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full bg-white py-12 sm:py-16 lg:py-[90px]"
      style={{ background: "#ffffff" }}
    >
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6">
        {/* Header */}
        <div className="text-center">
          <span className="inline-block rounded bg-primary px-4 py-1.5 text-sm font-semibold uppercase tracking-wider text-white sm:text-base">
            {BADGE_LABEL}
          </span>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-dark xs:text-3xl sm:text-4xl lg:text-5xl">
            Jak to{" "}
            <span className="text-primary">{TITLE_RED}</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-neutral sm:text-base" style={{ lineHeight: 1.6 }}>
            {SUBTITLE}
          </p>
        </div>

        {/* Timeline — na mobile jedna kolumna (karta pod kropką), od md dwie kolumny */}
        <div className="relative mt-10 sm:mt-16">
          <div
            ref={lineRef}
            className="absolute left-1/2 top-0 hidden w-0.5 -translate-x-1/2 bg-primary transition-all duration-500 ease-out md:block"
            style={{ height: `${lineHeight}%`, minHeight: 0 }}
          />

          <div ref={stepsRef} className="space-y-8 sm:space-y-12 lg:space-y-16">
            {steps.map((step, i) => {
              const isLeft = i % 2 === 0;
              const cardClass = "group/card relative w-full max-w-[460px] overflow-hidden rounded-2xl border-[1.5px] border-[#eaeaea] bg-white py-5 px-4 transition-all duration-300 sm:py-6 sm:px-6 lg:py-[26px] lg:px-[28px] lg:rounded-[20px]";
              const cardStyle = { boxShadow: "0 2px 6px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.07)" };
              const cardHover = { y: -5, borderColor: "rgba(220,30,30,0.22)", boxShadow: "0 8px 24px rgba(220,30,30,0.12), 0 4px 12px rgba(0,0,0,0.06)", transition: { duration: 0.28, ease: [0.25, 0.1, 0.25, 1] } };
              return (
                <div key={step.label} className="relative flex min-h-0 flex-col items-center md:min-h-[200px] md:flex-row md:items-center">
                  {/* Desktop: lewa połowa */}
                  <div className="hidden min-w-0 flex-1 items-center justify-end pr-[30px] md:flex">
                    {isLeft && (
                      <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                        className={cardClass}
                        style={cardStyle}
                        whileHover={cardHover}
                      >
                        <div className="absolute left-0 top-0 h-[3px] w-full origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover/card:scale-x-100" aria-hidden />
                        <StepCardContent step={step} />
                      </motion.div>
                    )}
                  </div>

                  {/* Kropka — na mobile nad kartą, na desktop na środku */}
                  <div className="relative z-10 flex shrink-0 md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2">
                    <TimelineDot emoji={step.emoji} />
                  </div>

                  {/* Mobile: karta zawsze pod kropką; Desktop: prawa połowa */}
                  <div className="flex w-full flex-1 flex-col items-center pt-4 md:min-w-0 md:items-start md:justify-start md:pl-[30px] md:pt-0">
                    {(isLeft && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                        className={`w-full ${cardClass} md:hidden`}
                        style={cardStyle}
                        whileHover={cardHover}
                      >
                        <div className="absolute left-0 top-0 h-[3px] w-full origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover/card:scale-x-100" aria-hidden />
                        <StepCardContent step={step} />
                      </motion.div>
                    )) || (
                      <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                        className={`w-full ${cardClass} md:max-w-[460px]`}
                        style={cardStyle}
                        whileHover={cardHover}
                      >
                        <div className="absolute left-0 top-0 h-[3px] w-full origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover/card:scale-x-100" aria-hidden />
                        <StepCardContent step={step} />
                      </motion.div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 flex justify-center sm:mt-16">
          <Link
            href="/zgloszenie"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-white shadow-lg transition-opacity hover:opacity-95 sm:px-8 sm:py-4 sm:text-lg"
            style={{ boxShadow: "0 4px 14px rgba(220,30,30,0.35)" }}
          >
            <span aria-hidden>📋</span>
            Zgłoś naprawę teraz
          </Link>
        </div>
      </div>
    </section>
  );
}

function TimelineDot({ emoji }: { emoji: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      className="relative z-10 flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-2xl"
      initial={false}
      animate={{
        scale: isInView ? 1.1 : 1,
        borderColor: isInView ? "#dc1e1e" : "#e5e7eb",
        boxShadow: isInView ? "0 0 0 6px rgba(220,30,30,0.1)" : "none",
      }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {emoji}
    </motion.div>
  );
}
