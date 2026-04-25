"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Zap, Cable, Battery, Smartphone, Car, Shield, Headphones, Home } from "lucide-react";

const categories = [
  {
    href: "/akcesoria",
    label: "Ładowarki",
    icon: Zap,
    glow: "from-[#ffb4b4] to-[#ffe5e5]",
    iconBg: "bg-[#ffe5e5]",
    iconColor: "text-[#ff4545]",
  },
  {
    href: "/akcesoria",
    label: "Ładowarki GaN",
    icon: Zap,
    glow: "from-[#b8f8c9] to-[#e7ffe9]",
    iconBg: "bg-[#e7ffe9]",
    iconColor: "text-[#00b058]",
    badge: "NOWOŚĆ",
    badgeColor: "bg-[#00b058] text-white",
  },
  {
    href: "/akcesoria",
    label: "Kable",
    icon: Cable,
    glow: "from-[#c7ddff] to-[#e5f0ff]",
    iconBg: "bg-[#e5f0ff]",
    iconColor: "text-[#2563eb]",
  },
  {
    href: "/akcesoria",
    label: "Powerbanki",
    icon: Battery,
    glow: "from-[#ffd0f0] to-[#ffe6f5]",
    iconBg: "bg-[#ffe6f5]",
    iconColor: "text-[#db2777]",
  },
  {
    href: "/akcesoria",
    label: "Etui",
    icon: Smartphone,
    glow: "from-[#ffe3b3] to-[#fff3d9]",
    iconBg: "bg-[#fff3d9]",
    iconColor: "text-[#eab308]",
  },
  {
    href: "/akcesoria",
    label: "Uchwyty samochodowe",
    icon: Car,
    glow: "from-[#c6eaff] to-[#e5f7ff]",
    iconBg: "bg-[#e5f7ff]",
    iconColor: "text-[#0284c7]",
  },
  {
    href: "/hammer-glass",
    label: "Szkła i folie",
    icon: Shield,
    glow: "from-[#ffc2c2] to-[#ffe7e7]",
    iconBg: "bg-[#ffe7e7]",
    iconColor: "text-[#dc2626]",
    badge: "HAMMER GLASS",
    badgeColor: "bg-[#111827] text-white",
  },
  {
    href: "/akcesoria",
    label: "Słuchawki",
    icon: Headphones,
    glow: "from-[#c9cfff] to-[#e7e7ff]",
    iconBg: "bg-[#e7e7ff]",
    iconColor: "text-[#4f46e5]",
  },
];

export function Accessories() {
  return (
    <section className="bg-[#fbfbfc] py-12 sm:py-20 lg:py-24 max-lg:bg-white max-lg:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 max-lg:px-5">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full bg-[#fff0f0] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary max-lg:px-3 max-lg:py-1"
          >
            <Home className="h-3.5 w-3.5" aria-hidden />
            SKLEP STACJONARNY PRO-KOM
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-4 text-4xl font-extrabold tracking-tight text-dark sm:text-5xl max-lg:mt-3 max-lg:text-[28px] max-lg:leading-tight"
          >
            Akcesoria <span className="text-primary">GSM</span>
          </motion.h2>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="mx-auto mt-5 max-w-2xl text-center text-lg text-neutral max-lg:mt-3 max-lg:text-[15px]"
        >
          Ładowarki, kable, etui, powerbanki i inne akcesoria dostępne od ręki
          w naszym sklepie.
        </motion.p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-lg:mt-8 max-lg:-mx-5 max-lg:flex max-lg:gap-3 max-lg:overflow-x-auto max-lg:px-5 max-lg:pb-4 max-lg:snap-x max-lg:snap-mandatory accessories-mobile-scroll" style={{ WebkitOverflowScrolling: "touch" }}>
          {categories.map(
            (
              {
                href,
                label,
                icon: Icon,
                glow,
                iconBg,
                iconColor,
                badge,
                badgeColor,
              },
              i,
            ) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 * i }}
              className="max-lg:min-w-[140px] max-lg:flex-shrink-0 max-lg:snap-center"
            >
              <Link href={href}>
                <div className="group relative flex h-full flex-col items-center justify-center rounded-[28px] bg-white px-4 py-6 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition-transform duration-200 hover:-translate-y-1 max-lg:min-h-[140px] max-lg:rounded-[20px] max-lg:px-3 max-lg:py-5 max-lg:shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)]">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${glow} max-lg:h-14 max-lg:w-14 max-lg:rounded-xl`}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg} ${iconColor} max-lg:h-10 max-lg:w-10 max-lg:rounded-xl`}
                    >
                      <Icon className="h-6 w-6 max-lg:h-5 max-lg:w-5" />
                    </div>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-dark max-lg:mt-3 max-lg:text-[13px] max-lg:leading-tight">
                    {label}
                  </h3>
                  {badge && (
                    <span
                      className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${badgeColor} max-lg:mt-2 max-lg:px-2 max-lg:py-0.5 max-lg:text-[9px]`}
                    >
                      {badge}
                    </span>
                  )}
                </div>
              </Link>
            </motion.div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
