"use client";

import { motion } from "framer-motion";
import { Wrench, BadgeDollarSign, ShieldCheck, PhoneCall } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";

export function CTA() {
  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        className="mx-auto flex max-w-6xl flex-col gap-6 rounded-[32px] bg-gradient-to-r from-[#e31111] via-[#e91c24] to-[#f5381b] p-[1px] shadow-[0_24px_70px_rgba(185,28,28,0.55)] sm:flex-row sm:items-center sm:justify-center sm:gap-10"
      >
        {/* Wewnętrzny jasny gradient + treść po lewej */}
        <div className="flex-1 rounded-[30px] bg-gradient-to-r from-[rgba(255,255,255,0.1)] to-[rgba(255,255,255,0.02)] px-5 py-6 sm:px-7 sm:py-7 lg:px-8 lg:py-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur">
              <Wrench className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h2 className="text-left text-xl font-extrabold tracking-tight text-white sm:text-2xl lg:text-3xl">
                Masz problem z urządzeniem?{" "}
                <span className="block text-white/95 sm:inline">
                  Zgłoś naprawę już dziś.
                </span>
              </h2>
              <p className="mt-2 text-sm text-white/90 sm:text-base">
                Szybka diagnostyka i wycena. Bez zobowiązań.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur">
                  <BadgeDollarSign className="h-3.5 w-3.5" aria-hidden />
                  Bezpłatna wycena
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1 backdrop-blur">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                  Gwarancja na naprawę
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Przyciski po prawej */}
        <div className="flex flex-1 flex-col items-stretch justify-center gap-3 px-5 pb-5 sm:max-w-sm sm:px-0 sm:pb-0">
          <div className="flex flex-wrap justify-center gap-3 sm:justify-center">
            <PremiumButton
              href="/zgloszenie"
              variant="outline"
              size="lg"
              className="flex-1 justify-center rounded-full border-0 bg-white px-8 text-primary shadow-[0_10px_24px_rgba(0,0,0,0.25)] hover:bg-white/95 sm:flex-none"
            >
              Zgłoś naprawę
            </PremiumButton>
            <PremiumButton
              href="/kontakt"
              variant="outline"
              size="lg"
              className="flex-1 justify-center border-white/70 text-white hover:bg-white/10"
            >
              <PhoneCall className="mr-2 h-4 w-4" aria-hidden />
              Kontakt
            </PremiumButton>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
