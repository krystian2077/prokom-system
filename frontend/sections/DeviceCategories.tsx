"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Info } from "lucide-react";

const PILL_LABEL = "ZGŁOŚ NAPRAWĘ ONLINE";
const TITLE_LINE1 = "Wybierz urządzenie";
const TITLE_LINE2 = "i rozpocznij naprawę";
const SUBTITLE =
  "Wybierz kategorię sprzętu — przeprowadzimy Cię przez szybki formularz. Wycena bezpłatnie, diagnoza nawet tego samego dnia.";
const FOOTER_NOTE = "Bezpłatna diagnoza przy każdym zgłoszeniu. Płacisz tylko za naprawę.";

const categories = [
  {
    label: "Telefony",
    href: "/zgloszenie?category=phone",
    image: "/images/repairs/telefon.jpg",
    imageAlt: "Telefon",
    highlight: true,
  },
  {
    label: "Tablety",
    href: "/zgloszenie?category=tablet",
    image: "/images/repairs/tablet2.jpg",
    imageAlt: "Tablet",
    highlight: false,
  },
  {
    label: "Laptopy",
    href: "/zgloszenie?category=laptop",
    image: "/images/repairs/laptop.jpg",
    imageAlt: "Laptop",
    highlight: false,
  },
  {
    label: "Komputery",
    href: "/zgloszenie?category=desktop",
    image: "/images/repairs/komputer.jpg",
    imageAlt: "Komputer stacjonarny",
    highlight: false,
  },
  {
    label: "Smartwatche",
    href: "/zgloszenie?category=smartwatch",
    image: "/images/repairs/smartwatch.jpg",
    imageAlt: "Smartwatch",
    highlight: false,
  },
  {
    label: "Drukarki",
    href: "/zgloszenie?category=printer",
    image: "/images/repairs/drukarka.jpg",
    imageAlt: "Drukarka",
    highlight: false,
  },
  {
    label: "Konsole",
    href: "/zgloszenie?category=console",
    image: "/images/repairs/konsola.jpg",
    imageAlt: "Konsola",
    highlight: false,
  },
  {
    label: "Inne",
    href: "/zgloszenie?category=other",
    image: "/images/repairs/inne.jpg",
    imageAlt: "Inne urządzenia",
    highlight: false,
  },
];

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const sectionPanelStyle = {
  background: "#ffffff",
  border: "2px solid rgba(220, 30, 30, 0.55)",
  borderRadius: "28px",
  boxShadow:
    "0 0 0 1px rgba(255,255,255,0.8) inset, 0 2px 8px rgba(220, 30, 30, 0.10), 0 8px 24px rgba(220, 30, 30, 0.12), 0 32px 80px rgba(180, 20, 20, 0.14), 0 80px 160px rgba(0,0,0,0.14), 0 140px 200px rgba(0,0,0,0.08)",
};

export function DeviceCategories() {
  return (
    <section className="devices-section bg-white py-[80px] px-12">
      <div
        className="devices-section-inner relative mx-auto max-w-[1200px] overflow-hidden rounded-[28px] pt-20 px-14 pb-[90px]"
        style={sectionPanelStyle}
      >
        {/* Czerwona linia na górze sekcji (::after) */}
        <div
          className="pointer-events-none absolute left-[5%] right-[5%] top-0 h-[3px] rounded-b-[4px]"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(220,30,30,0.85) 25%, rgba(220,30,30,0.85) 75%, transparent)",
          }}
          aria-hidden
        />
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="mb-6 flex justify-center">
              <Link
                href="/zgloszenie"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white shadow-sm transition-opacity hover:opacity-95"
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-red-900 ring-2 ring-white/80" aria-hidden />
                {PILL_LABEL}
              </Link>
            </div>
            <div className="text-center">
              <h2 className="text-4xl font-bold leading-tight tracking-tight text-dark sm:text-5xl lg:text-[3rem]">
                {TITLE_LINE1}
                <br />
                <span className="mt-3 block text-primary sm:mt-4">{TITLE_LINE2}</span>
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-neutral sm:text-lg">
                {SUBTITLE}
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="mt-20 grid gap-9 sm:mt-24 sm:grid-cols-2 sm:gap-10 lg:mt-28 lg:grid-cols-4"
          >
            {categories.map(({ label, href, image, imageAlt, highlight }) => (
              <motion.div key={href} variants={item}>
                <Link href={href} className="block h-full">
                  <motion.div
                    className="group relative flex h-full flex-col overflow-hidden rounded-[28px]"
                    style={{
                      background: "#fffafa",
                      border: "1px solid rgba(220, 30, 30, 0.12)",
                      boxShadow: "0 16px 48px -12px rgba(0,0,0,0.14), 0 8px 24px -8px rgba(0,0,0,0.08)",
                    }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    whileHover={{
                      y: -6,
                      backgroundColor: "#ffffff",
                      borderColor: "rgba(220, 30, 30, 0.45)",
                      boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
                      transition: { duration: 0.28, ease: [0.25, 0.1, 0.25, 1] },
                    }}
                  >
                    {/* Device media area — product spotlight */}
                    <div className="relative flex h-52 w-full shrink-0 items-center justify-center overflow-hidden border-b border-gray-200/80 sm:h-56">
                      <div
                        className="absolute inset-0"
                        style={{
                          background: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(255,255,255,0.9) 0%, rgba(241,245,249,0.6) 40%, rgba(226,232,240,0.4) 70%, transparent 100%)",
                        }}
                        aria-hidden
                      />
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                          background: "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(0,0,0,0.04), transparent 60%)",
                        }}
                        aria-hidden
                      />
                      <div
                        className="relative mx-auto flex h-[88%] w-[88%] max-w-[200px] items-center justify-center transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                        style={{ filter: "drop-shadow(0 20px 25px rgba(0,0,0,0.12))" }}
                      >
                        <Image
                          src={image}
                          alt={imageAlt}
                          fill
                          className="object-contain object-center p-3 transition-transform duration-300 ease-out group-hover:scale-[1.05]"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      </div>
                    </div>

                    <div className="relative flex flex-1 flex-col justify-end bg-white px-7 py-6 sm:px-8 sm:py-7">
                      <h3 className="text-lg font-bold text-dark sm:text-xl">
                        {label}
                      </h3>
                      <span className="mt-2.5 inline-flex items-center text-sm font-medium text-primary transition-all duration-200 group-hover:font-semibold group-hover:tracking-wide">
                        Przejdź do zgłoszenia
                        <ChevronRight className="ml-1 h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-2 group-hover:opacity-100 opacity-90" />
                      </span>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

        <p className="mt-12 flex items-center justify-center gap-2 text-sm text-neutral sm:mt-14">
          <Info className="h-4 w-4 shrink-0" aria-hidden />
          <span>{FOOTER_NOTE}</span>
        </p>
      </div>
    </section>
  );
}
