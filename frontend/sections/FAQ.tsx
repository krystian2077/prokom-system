"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, PhoneCall } from "lucide-react";

const faqs = [
  { section: "Naprawa i czas realizacji", q: "Jak długo trwa naprawa?", a: "Standardowo proste naprawy (np. wymiana baterii, gniazda ładowania) realizujemy w 1–3 dni robocze. Bardziej złożone usterki lub naprawy płyt głównych mogą potrwać 5–7 dni. Po diagnozie zawsze podajemy orientacyjny termin zakończenia." },
  { section: "Naprawa i czas realizacji", q: "Co jeśli nie da się naprawić urządzenia?", a: "Jeśli po pełnej diagnostyce okaże się, że naprawa jest nieopłacalna lub niemożliwa, informujemy Cię o tym i przedstawiamy alternatywy (np. odzysk danych, wymianę sprzętu). Za samą diagnozę możesz ponieść jedynie symboliczny koszt zgodnie z cennikiem." },
  { section: "Naprawa i czas realizacji", q: "Czy naprawiacie wszystkie marki telefonów?", a: "Tak, serwisujemy większość popularnych marek smartfonów, tabletów, laptopów i innych urządzeń. Jeśli masz nietypowy model, skontaktuj się z nami — sprawdzimy dostępność części." },
  { section: "Cena i płatność", q: "Skąd będę wiedział jaka jest cena naprawy?", a: "Najpierw wykonujemy diagnostykę, a następnie przedstawiamy Ci jasną i szczegółową wycenę. Naprawę rozpoczynamy dopiero po Twojej akceptacji kosztów." },
  { section: "Cena i płatność", q: "Jakie formy płatności akceptujecie?", a: "W serwisie możesz zapłacić gotówką, kartą płatniczą lub BLIKiem. W przypadku wysyłki możliwa jest również płatność przedpłacona przelewem." },
  { section: "Gwarancja i wysyłka", q: "Czy jest gwarancja na naprawę?", a: "Tak, na wykonywane przez nas naprawy udzielamy gwarancji. Jej długość zależy od rodzaju usługi oraz użytych części — szczegóły podajemy przy wycenie." },
  { section: "Gwarancja i wysyłka", q: "Mogę wysłać urządzenie kurierem?", a: "Oczywiście. Możesz dostarczyć urządzenie osobiście lub wysłać je kurierem. Po naprawie odeślemy je pod wskazany adres, odpowiednio zabezpieczone." },
  { section: "Gwarancja i wysyłka", q: "Czy moje dane są bezpieczne podczas naprawy?", a: "Tak, dbamy o prywatność i bezpieczeństwo danych. Nie usuwamy ich bez Twojej zgody, a dostęp do urządzeń mają wyłącznie technicy prowadzący naprawę." },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const sectionsOrder = ["Naprawa i czas realizacji", "Cena i płatność", "Gwarancja i wysyłka"];

  return (
    <section className="bg-white py-20 sm:py-24">
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
              className="mt-4 text-4xl font-extrabold tracking-tight text-dark sm:text-5xl"
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
              className="mt-8 rounded-2xl bg-[#f5f5f7] p-5 text-sm text-dark shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:p-6"
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
          </div>

          {/* Prawa kolumna – akordeon FAQ w sekcjach */}
          <div className="space-y-8">
            {sectionsOrder.map((sectionLabel, sectionIdx) => {
              const items = faqs.filter((f) => f.section === sectionLabel);
              if (!items.length) return null;
              const startIndex = faqs.findIndex(
                (f) => f.section === sectionLabel,
              );

              return (
                <div key={sectionLabel} className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-neutral">
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
                        className="overflow-hidden rounded-2xl border border-[#ededed] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpen(isOpen ? null : globalIndex)
                          }
                          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5 sm:py-4"
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-semibold tracking-[0.22em] text-neutral">
                              {number}
                            </span>
                            <p className="text-sm font-semibold text-dark sm:text-base">
                              {item.q}
                            </p>
                          </div>
                          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e0e0e0]">
                            <ChevronDown
                              className={`h-4 w-4 text-neutral transition-transform ${
                                isOpen ? "rotate-180" : ""
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
                              <p className="px-5 py-4 text-sm text-neutral sm:text-base">
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
