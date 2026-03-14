"use client";

import { motion } from "framer-motion";
import { Wrench, BadgeDollarSign, ShieldCheck, PhoneCall } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";

export function CTA() {
  return (
    <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        className="mx-auto flex max-w-6xl flex-col gap-6 rounded-2xl bg-gradient-to-r from-[#e31111] via-[#e91c24] to-[#f5381b] p-[1px] shadow-[0_24px_70px_rgba(185,28,28,0.55)] sm:rounded-[28px] sm:flex-row sm:items-center sm:justify-center sm:gap-10 lg:rounded-[32px]"
      >
        <div className="flex-1 rounded-2xl bg-gradient-to-r from-[rgba(255,255,255,0.1)] to-[rgba(255,255,255,0.02)] px-4 py-5 sm:rounded-[26px] sm:px-7 sm:py-7 lg:rounded-[30px] lg:px-8 lg:py-8">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur sm:h-12 sm:w-12 sm:rounded-2xl">
              <Wrench className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 className="text-left text-lg font-extrabold tracking-tight text-white xs:text-xl sm:text-2xl lg:text-3xl">
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

        {/* Przyciski */}
        <div className="flex flex-1 flex-col items-stretch justify-center gap-3 px-4 pb-5 sm:max-w-sm sm:px-0 sm:pb-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <PremiumButton
              href="/zgloszenie"
              variant="outline"
              size="lg"
              className="min-h-[48px] w-full justify-center rounded-full border-0 bg-white px-6 py-3.5 text-base font-semibold text-primary shadow-[0_10px_24px_rgba(0,0,0,0.25)] hover:bg-white/95 sm:min-h-[50px] sm:w-auto sm:px-8"
            >
              Zgłoś naprawę
            </PremiumButton>
            <PremiumButton
              href="/kontakt"
              variant="outline"
              size="lg"
              className="min-h-[48px] w-full justify-center border-white/70 text-white hover:bg-white/10 sm:w-auto"
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
