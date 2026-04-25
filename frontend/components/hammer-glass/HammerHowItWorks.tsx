"use client";

import { motion } from "framer-motion";

export default function HammerHowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Wybierz folię",
      desc: "9 rodzajów — od entry po special i premium.",
    },
    {
      number: "2",
      title: "Podaj model",
      desc: "Baza 10 000+ urządzeń — telefony, tablety, zegarki.",
    },
    {
      number: "3",
      title: "Cięcie ~5 min",
      desc: "Cięcie na ploterze VersaBlade X Pro — około 1 minuty, precyzja 0,1 mm.",
    },
    {
      number: "4",
      title: "Aplikacja ~5 min",
      desc: "Sucho, bez bąbelków, perfekcyjnie do krawędzi ekranu.",
    },
    {
      number: "5",
      title: "Gotowe ✓",
      desc: "Certyfikat PZH + RoHS, gwarancja dopasowania.",
    },
  ];

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-20">
        <div className="text-center">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#dc1e1e] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white">
            <span className="h-1.5 w-1.5 animate-blink rounded-full bg-white" />
            Jak to działa
          </span>
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-[#0d0d0d] sm:text-5xl lg:text-[3rem]">
            Od wyboru do pełnej ochrony —
            <br />
            <span className="mt-3 block text-[#dc1e1e] sm:mt-4">
              w kilka minut
            </span>
          </h2>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-4 sm:grid-cols-5">
          {steps.map((step, idx) => (
            <motion.div
              key={step.number}
              className="group relative flex flex-col rounded-2xl border border-[rgba(0,0,0,0.07)] bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[rgba(220,30,30,0.18)] hover:shadow-[0_12px_32px_rgba(15,23,42,0.1)]"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1], delay: idx * 0.07 }}
            >
              <div className="mb-5 flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#ff4b4b] to-[#dc1e1e] font-syne text-[15px] font-bold text-white shadow-[0_4px_14px_rgba(220,30,30,0.4)] transition-shadow duration-300 group-hover:shadow-[0_6px_20px_rgba(220,30,30,0.55)]">
                  {step.number}
                </div>
              </div>
              <h3 className="mb-2 font-syne text-[14.5px] font-bold leading-snug text-[#0d0d0d]">
                {step.title}
              </h3>
              <p className="text-[12.5px] leading-[1.7] text-[#888]">
                {step.desc}
              </p>
              {idx < steps.length - 1 && (
                <div className="pointer-events-none absolute -right-2.5 top-9 hidden h-px w-5 bg-gradient-to-r from-[rgba(220,30,30,0.3)] to-[rgba(220,30,30,0.1)] sm:block" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

