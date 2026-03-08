"use client";

import { motion } from "framer-motion";
import { PremiumButton } from "@/components/ui/PremiumButton";

export function CTA() {
  return (
    <section className="bg-primary py-16">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
        >
          Masz problem z urządzeniem? Zgłoś naprawę już dziś.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="mx-auto mt-4 max-w-xl text-lg text-white/90"
        >
          Szybka diagnostyka i wycena. Bez zobowiązań.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          <PremiumButton href="/zgloszenie" variant="secondary" size="lg" className="bg-white text-primary hover:bg-gray-100">
            Zgłoś naprawę
          </PremiumButton>
          <PremiumButton href="/kontakt" variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
            Kontakt
          </PremiumButton>
        </motion.div>
      </div>
    </section>
  );
}
