"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  Smartphone,
  Award,
  Zap,
  Package,
  Plus,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

const BADGE = "Dlaczego PRO-KOM";
const TITLE = "Profesjonalny serwis elektroniki";
const PARAGRAPH =
  "Od pękniętych ekranów po awarie baterii i problemy z wydajnością — zapewniamy szybką i niezawodną naprawę urządzeń, zaprojektowaną tak, aby Twoja technologia działała jak najlepiej. Nasi serwisanci stosują sprawdzone techniki, wysokiej jakości części i opcje napraw tego samego dnia, aby zapewnić niezawodne i długotrwałe rezultaty.";

const CARDS = [
  {
    title: "10 000+ naprawionych urządzeń",
    description:
      "Przez lata naprawiliśmy tysiące telefonów, laptopów i innych urządzeń elektronicznych.",
    icon: Smartphone,
    image: "iPhone XS Max Screen Repair at iRepair Eastbourne.jpg",
    imageAlt: "Naprawa ekranu smartfona w PRO-KOM",
    objectPosition: "center 40%",
  },
  {
    title: "20+ lat doświadczenia",
    description:
      "Wieloletnia praktyka w serwisie elektroniki pozwala nam skutecznie diagnozować i naprawiać różne sprzęty.",
    icon: Award,
    image: "pobrane.jpg",
    imageAlt: "Stanowisko serwisowe — diagnostyka i naprawa",
    objectPosition: "center 50%",
  },
  {
    title: "Szybka realizacja napraw",
    description:
      "Wiele napraw wykonujemy nawet tego samego dnia — bez długiego oczekiwania.",
    icon: Zap,
    image: "_PERCHÉ LA NOSTRA CONSULENZA È A PAGAMENTO_.jpg",
    imageAlt: "Zadowolony klient PRO-KOM",
    objectPosition: "center 30%",
  },
  {
    title: "Naprawiamy wiele typów urządzeń",
    description:
      "Telefony, laptopy, tablety, komputery stacjonarne i inne urządzenia elektroniczne.",
    icon: Package,
    image: "battle-smartphones-2024.jpg",
    imageAlt: "Różne modele smartfonów — naprawiamy wszystkie",
    objectPosition: "center 50%",
  },
];

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export function TrustStats() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-gray-50/40 to-white py-12 sm:py-20 lg:py-24 xl:py-28 max-lg:bg-none max-lg:bg-white">
      {/* Subtle decorative elements */}
      <div
        className="pointer-events-none absolute -right-64 top-1/4 h-96 w-96 rounded-full opacity-[0.04] blur-3xl max-lg:hidden"
        style={{ background: "#e11d1d" }}
      />
      <div
        className="pointer-events-none absolute -left-40 bottom-1/4 h-72 w-72 rounded-full opacity-[0.03] blur-3xl max-lg:hidden"
        style={{ background: "#e11d1d" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ——— TOP PART: badge + title + paragraph ——— */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="grid gap-8 lg:grid-cols-[0.45fr_0.55fr] lg:items-start lg:gap-12 xl:gap-16"
        >
          <div>
            <span className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-white/20 bg-primary px-6 py-3 shadow-[0_4px_24px_-8px_rgba(225,29,29,0.5)]">
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
              <HelpCircle className="relative h-5 w-5 shrink-0 text-white" strokeWidth={2} />
              <span className="relative text-sm font-semibold tracking-tight text-white sm:text-base">
                {BADGE}
              </span>
            </span>
            <h2 className="mt-6 text-2xl font-bold leading-tight tracking-tight text-dark xs:text-3xl sm:mt-9 sm:text-4xl lg:mt-10 lg:text-[2.25rem] lg:leading-[1.2] xl:text-[2.5rem] max-lg:tracking-[-0.035em]">
              {TITLE}
            </h2>
          </div>
          <p className="max-w-xl text-base leading-relaxed text-neutral sm:text-lg lg:max-w-none lg:pb-1 lg:mt-[4.5rem]">
            {PARAGRAPH}
          </p>
        </motion.div>

        {/* ——— BOTTOM PART: 4 premium cards ——— */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-14 grid gap-6 sm:mt-16 sm:gap-6 md:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-8"
        >
          {CARDS.map(({ title, description, icon: Icon, image, imageAlt, objectPosition = "center center" }) => (
            <motion.div
              key={title}
              variants={item}
              whileHover={{ y: -6 }}
              className="group flex flex-col overflow-hidden rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_4px 24px -8px rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_20px 48px -16px rgba(0,0,0,0.12)] sm:p-7 max-lg:border-0 max-lg:p-7 max-lg:rounded-[20px] max-lg:shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)]"
            >
              {/* Icon */}
              <div className="relative">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" strokeWidth={2} />
                </span>
                <span
                  className="absolute -right-1 -top-1 text-primary/20"
                  aria-hidden
                >
                  <Plus className="h-5 w-5" strokeWidth={2.5} />
                </span>
              </div>

              {/* Title & description */}
              <h3 className="mt-5 text-lg font-bold leading-snug text-dark sm:text-xl">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral sm:text-base">
                {description}
              </p>

              {/* Image at bottom */}
              <div
                className="relative mt-6 flex-1 overflow-hidden rounded-xl bg-gray-100 sm:mt-8"
                style={{
                  boxShadow:
                    "0 12px 32px -8px rgba(0,0,0,0.18), 0 10px 28px -6px rgba(225,29,29,0.45)",
                }}
              >
                <div className="aspect-[4/3] w-full min-h-[200px] sm:min-h-[240px]">
                  <Image
                    src={`/images/${encodeURIComponent(image)}`}
                    alt={imageAlt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ objectPosition }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"
                  aria-hidden
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
