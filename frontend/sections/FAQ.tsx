"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "Jak dlugo trwa naprawa?", a: "Zalezy od usterki. Prosta naprawa 1-3 dni, zlozona 5-7 dni. Po diagnozie podamy termin." },
  { q: "Czy jest gwarancja?", a: "Tak. Na naprawy udzielamy gwarancji - szczegoly przy wycenie." },
  { q: "Moge wyslac urzadzenie kurierem?", a: "Tak. Wysylka i odsylka mozliwa - szczegoly w formularzu." },
  { q: "Skad bede wiedzial jaka cena?", a: "Po diagnostyce dostaniesz wycene. Naprawa po akceptacji." },
  { q: "Co jesli nie da sie naprawic?", a: "Poinformujemy i zaproponujemy alternatywy." },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-3xl font-bold tracking-tight text-dark sm:text-4xl"
        >
          FAQ
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="mx-auto mt-4 text-center text-lg text-neutral"
        >
          Krotkie odpowiedzi na typowe pytania.
        </motion.p>
        <div className="mt-12 space-y-3">
          {faqs.map((item, i) => (
            <motion.div
              key={item.q}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 * i }}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-soft"
            >
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-4 text-left font-semibold text-dark"
              >
                {item.q}
                <ChevronDown
                  className={`h-5 w-5 text-neutral transition-transform ${open === i ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-100"
                  >
                    <p className="px-6 py-4 text-neutral">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
