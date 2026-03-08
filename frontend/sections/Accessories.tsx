"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Zap, Cable, Battery, Smartphone, Car, Shield, Headphones } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";

const categories = [
  { href: "/akcesoria", label: "Ładowarki", icon: Zap },
  { href: "/akcesoria", label: "Ładowarki GaN", icon: Zap },
  { href: "/akcesoria", label: "Kable", icon: Cable },
  { href: "/akcesoria", label: "Powerbanki", icon: Battery },
  { href: "/akcesoria", label: "Etui", icon: Smartphone },
  { href: "/akcesoria", label: "Uchwyty samochodowe", icon: Car },
  { href: "/akcesoria", label: "Szkła i folie", icon: Shield },
  { href: "/akcesoria", label: "Słuchawki", icon: Headphones },
];

export function Accessories() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-3xl font-bold tracking-tight text-dark sm:text-4xl"
        >
          Akcesoria GSM
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral"
        >
          Ładowarki, kable, etui, powerbanki i inne akcesoria w jednym miejscu.
        </motion.p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(({ href, label, icon: Icon }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 * i }}
            >
              <Link href={href}>
                <PremiumCard className="h-full flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-3 font-semibold text-dark">{label}</h3>
                </PremiumCard>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
