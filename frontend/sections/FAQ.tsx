"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, PhoneCall } from "lucide-react";

const faqs = [
  // 1. Proces naprawy
  {
    section: "Proces naprawy",
    q: "Jak wygląda proces naprawy?",
    a: "Po zgłoszeniu przeprowadzamy diagnostykę urządzenia i przygotowujemy dokładną wycenę. Dopiero po Twojej akceptacji rozpoczynamy naprawę. Na końcu testujemy sprzęt i informujemy Cię o odbiorze.",
  },
  {
    section: "Proces naprawy",
    q: "Jak długo trwa naprawa?",
    a: "Wiele napraw wykonujemy nawet tego samego dnia. Bardziej skomplikowane przypadki mogą potrwać od 1 do kilku dni — zawsze informujemy o czasie realizacji.",
  },
  {
    section: "Proces naprawy",
    q: "Czy mogę zrezygnować po diagnozie?",
    a: "Tak. Po otrzymaniu wyceny możesz zrezygnować z naprawy bez żadnych konsekwencji.",
  },
  {
    section: "Proces naprawy",
    q: "Czy naprawiacie urządzenia po zalaniu?",
    a: "Tak — im szybciej dostarczysz urządzenie, tym większa szansa na skuteczną naprawę. Zalecamy nie włączać sprzętu po kontakcie z cieczą.",
  },

  // 2. Cena i płatność
  {
    section: "Cena i płatność",
    q: "Skąd będę wiedzieć jaka jest cena naprawy?",
    a: "Po diagnostyce otrzymasz dokładną wycenę przed rozpoczęciem naprawy — bez ukrytych kosztów.",
  },
  {
    section: "Cena i płatność",
    q: "Czy diagnoza jest darmowa?",
    a: "Tak — w większości przypadków diagnoza jest bezpłatna. W bardziej złożonych przypadkach informujemy o ewentualnej opłacie z góry.",
  },
  {
    section: "Cena i płatność",
    q: "Czy naprawa się opłaca?",
    a: "Zawsze doradzamy uczciwie. Jeśli naprawa jest nieopłacalna — powiemy Ci to wprost i zaproponujemy alternatywę.",
  },
  {
    section: "Cena i płatność",
    q: "Jakie formy płatności akceptujecie?",
    a: "Gotówka, karta oraz przelew — wybierz najwygodniejszą opcję.",
  },

  // 3. Dane i bezpieczeństwo
  {
    section: "Dane i bezpieczeństwo",
    q: "Czy moje dane są bezpieczne?",
    a: "Tak. Dbamy o prywatność i bezpieczeństwo danych. Nie przeglądamy zawartości urządzeń bez potrzeby.",
  },
  {
    section: "Dane i bezpieczeństwo",
    q: "Czy moje dane zostaną usunięte?",
    a: "Nie — chyba że jest to konieczne do naprawy. W takim przypadku zawsze informujemy wcześniej. Zalecamy wykonanie kopii zapasowej.",
  },
  {
    section: "Dane i bezpieczeństwo",
    q: "Czy muszę zdjąć hasło / blokadę ekranu?",
    a: "W niektórych przypadkach tak — tylko jeśli jest to niezbędne do diagnozy. Informujemy o tym indywidualnie.",
  },

  // 4. Dostawa i odbiór
  {
    section: "Dostawa i odbiór",
    q: "Czy mogę wysłać urządzenie kurierem?",
    a: "Tak — przyjmujemy sprzęt wysyłkowo z całej Polski.",
  },
  {
    section: "Dostawa i odbiór",
    q: "Czy oferujecie odbiór i zwrot sprzętu?",
    a: "Tak — możemy zorganizować odbiór i odesłanie urządzenia po naprawie.",
  },
  {
    section: "Dostawa i odbiór",
    q: "Czy dostanę status naprawy?",
    a: "Tak — informujemy o statusie telefonicznie lub SMS-em.",
  },

  // 5. Techniczne i gwarancja
  {
    section: "Techniczne i gwarancja",
    q: "Czy używacie oryginalnych części?",
    a: "Korzystamy z oryginalnych części lub wysokiej jakości zamienników — zawsze informujemy przed naprawą.",
  },
  {
    section: "Techniczne i gwarancja",
    q: "Czy jest gwarancja na naprawę?",
    a: "Tak — udzielamy gwarancji na wykonane usługi oraz części.",
  },
  {
    section: "Techniczne i gwarancja",
    q: "Czy naprawa może pogorszyć stan urządzenia?",
    a: "Zawsze minimalizujemy ryzyko. W trudnych przypadkach informujemy wcześniej o możliwych komplikacjach.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const sectionsOrder = [
    "Proces naprawy",
    "Cena i płatność",
    "Dane i bezpieczeństwo",
    "Dostawa i odbiór",
    "Techniczne i gwarancja",
  ];
  const leftSections = sectionsOrder.slice(0, 2);
  const rightSections = sectionsOrder.slice(2);

  const renderSections = (labels: string[]) => (
    <div className="space-y-8">
      {labels.map((sectionLabel) => {
        const sectionIdx = sectionsOrder.indexOf(sectionLabel);
        const items = faqs.filter((f) => f.section === sectionLabel);
        if (!items.length) return null;
        const startIndex = faqs.findIndex((f) => f.section === sectionLabel);

        return (
          <div key={sectionLabel} className="space-y-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.26em] text-neutral">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
              {sectionLabel}
            </p>
            {items.map((item, localIndex) => {
              const globalIndex = startIndex + localIndex;
              const number = (globalIndex + 1).toString().padStart(2, "0");
              const isOpen = open === globalIndex;

              return (
                <motion.div
                  key={item.q}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.03 * (sectionIdx + localIndex) }}
                  className={`group relative overflow-hidden rounded-2xl border bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition-all duration-200 ${
                    isOpen
                      ? "border-[rgba(220,30,30,.35)] bg-[#fff5f5] shadow-[0_18px_45px_rgba(220,30,30,.10),0_10px_30px_rgba(15,23,42,0.06)]"
                      : "border-[#ededed] hover:-translate-y-0.5 hover:border-[rgba(220,30,30,.22)] hover:shadow-[0_14px_34px_rgba(15,23,42,0.07)]"
                  }`}
                >
                  <div
                    className="absolute left-0 top-0 h-[3px] w-full origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100"
                    style={{
                      transform: isOpen ? "scaleX(1)" : undefined,
                    }}
                    aria-hidden
                  />

                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : globalIndex)}
                    className="relative flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors sm:px-5 sm:py-4"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-xs font-semibold tracking-[0.22em] ${
                          isOpen ? "text-primary" : "text-neutral"
                        }`}
                      >
                        {number}
                      </span>
                      <p className="text-sm font-semibold sm:text-base text-dark">
                        {item.q}
                      </p>
                    </div>
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                        isOpen ? "border-[rgba(220,30,30,.25)] bg-white" : "border-[#e0e0e0]"
                      }`}
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          isOpen ? "rotate-180 text-primary" : "text-neutral"
                        }`}
                      />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-[#f1f1f1]"
                      >
                        <p className="px-5 py-4 text-[15px] leading-relaxed text-neutral sm:text-[16px]">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        );
      })}
    </div>
  );

  return (
    <section className="bg-[#fafafa] py-12 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)] lg:items-start">
          {/* Lewa kolumna – nagłówek + box CTA */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 rounded-full bg-[#fff0f0] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
              Często zadawane pytania
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-4 text-2xl font-extrabold tracking-tight text-dark xs:text-3xl sm:text-4xl lg:text-5xl"
              style={{ lineHeight: 1.25 }}
            >
              Masz pytania?{" "}
              <span className="text-primary">Mamy odpowiedzi.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="mt-4 max-w-md text-base text-neutral sm:text-lg"
            >
              Zebraliśmy najczęstsze pytania naszych klientów. Jeśli nie
              znajdziesz odpowiedzi — napisz lub zadzwoń, chętnie pomożemy.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-8 rounded-2xl bg-white p-5 text-sm text-dark shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:p-6"
              style={{
                border: "1px solid rgba(220, 30, 30, 0.14)",
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral">
                Nie znalazłeś odpowiedzi?
              </p>
              <p className="mt-2 text-sm text-neutral">
                Skontaktuj się z nami — odpowiemy szybko i bezpłatnie
                sprawdzimy, co dolega Twojemu urządzeniu.
              </p>
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(220,38,38,0.45)]"
              >
                <PhoneCall className="h-4 w-4" aria-hidden />
                Zadzwoń do nas
              </button>
            </motion.div>

            {/* Lewa kolumna – część pytań, żeby zapełnić pustą przestrzeń */}
            <div className="mt-10">{renderSections(leftSections)}</div>
          </div>

          {/* Prawa kolumna – akordeon FAQ w sekcjach */}
          <div className="space-y-8 lg:mt-10">
            {rightSections.map((sectionLabel, sectionIdx) => {
              const items = faqs.filter((f) => f.section === sectionLabel);
              if (!items.length) return null;
              const startIndex = faqs.findIndex(
                (f) => f.section === sectionLabel,
              );

              return (
                <div key={sectionLabel} className="space-y-3">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.26em] text-neutral">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                    {sectionLabel}
                  </p>
                  {items.map((item, localIndex) => {
                    const globalIndex = startIndex + localIndex;
                    const number = (globalIndex + 1).toString().padStart(2, "0");
                    const isOpen = open === globalIndex;
                    return (
                      <motion.div
                        key={item.q}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.03 * (sectionIdx + localIndex) }}
                        className={`group relative overflow-hidden rounded-2xl border bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition-all duration-200 ${
                          isOpen
                            ? "border-[rgba(220,30,30,.35)] bg-[#fff5f5] shadow-[0_18px_45px_rgba(220,30,30,0.10),0_10px_30px_rgba(15,23,42,0.06)]"
                            : "border-[#ededed] hover:-translate-y-0.5 hover:border-[rgba(220,30,30,.22)] hover:shadow-[0_14px_34px_rgba(15,23,42,0.07)]"
                        }`}
                      >
                        <div
                          className="absolute left-0 top-0 h-[3px] w-full origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100"
                          style={{
                            transform: isOpen ? "scaleX(1)" : undefined,
                          }}
                          aria-hidden
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setOpen(isOpen ? null : globalIndex)
                          }
                          className="relative flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors sm:px-5 sm:py-4"
                          aria-expanded={isOpen}
                        >
                          <div className="flex items-center gap-4">
                            <span
                              className={`text-xs font-semibold tracking-[0.22em] ${
                                isOpen ? "text-primary" : "text-neutral"
                              }`}
                            >
                              {number}
                            </span>
                            <p
                              className={`text-sm font-semibold sm:text-base ${
                                isOpen ? "text-dark" : "text-dark"
                              }`}
                            >
                              {item.q}
                            </p>
                          </div>
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                              isOpen ? "border-[rgba(220,30,30,.25)] bg-white" : "border-[#e0e0e0]"
                            }`}
                          >
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                isOpen ? "rotate-180 text-primary" : "text-neutral"
                              }`}
                            />
                          </span>
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="border-t border-[#f1f1f1]"
                            >
                              <p className="px-5 py-4 text-[15px] leading-relaxed text-neutral sm:text-[16px]">
                                {item.a}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
