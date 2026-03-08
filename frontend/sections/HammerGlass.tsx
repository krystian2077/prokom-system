"use client";

import { motion } from "framer-motion";
import { Shield, Sparkles } from "lucide-react";
import Image from "next/image";
import { PremiumButton } from "@/components/ui/PremiumButton";

const variants = [
  { name: "Clear", desc: "Krystaliczna przejrzystość" },
  { name: "Matte", desc: "Antyodciski, antypoślizg" },
  { name: "Privacy", desc: "Ochrona prywatności z boku" },
];

export function HammerGlass() {
  return (
    <section className="bg-gray-50/50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-dark sm:text-4xl">
              Hammer Glass — ochrona ekranu najwyższej jakości
            </h2>
            <p className="mt-6 text-lg text-neutral">
              Szkło hartowane i folie ochronne do smartfonów i tabletów. Wytrzymałość i łatwy montaż.
            </p>
            <ul className="mt-8 space-y-4">
              <li className="flex items-center gap-3 text-dark">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Shield className="h-4 w-4" />
                </span>
                <span className="font-medium">Ochrona przed zarysowaniami i uderzeniami</span>
              </li>
              <li className="flex items-center gap-3 text-dark">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Shield className="h-4 w-4" />
                </span>
                <span className="font-medium">Dopasowanie do wielu modeli</span>
              </li>
              <li className="flex items-center gap-3 text-dark">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Shield className="h-4 w-4" />
                </span>
                <span className="font-medium">Montaz w serwisie</span>
              </li>
            </ul>
            <div className="mt-10">
              <PremiumButton href="/hammer-glass" variant="primary" size="lg">
                Dopisz Hammer Glass do naprawy
              </PremiumButton>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative aspect-[3/4] max-h-[500px] overflow-hidden rounded-3xl bg-gray-100">
              <Image
                src="https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80"
                alt="Hammer Glass"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark/20 to-transparent" />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4">
              {variants.map((v, i) => (
                <motion.div
                  key={v.name}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-soft"
                >
                  <Sparkles className="mx-auto h-6 w-6 text-primary" />
                  <p className="mt-2 font-semibold text-dark">{v.name}</p>
                  <p className="text-xs text-neutral">{v.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
