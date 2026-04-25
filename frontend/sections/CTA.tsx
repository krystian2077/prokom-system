"use client";

import { motion } from "framer-motion";
import { Wrench, BadgeDollarSign, ShieldCheck, PhoneCall } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";

export function CTA() {
  return (
    <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8 max-lg:px-5 max-lg:py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        className="mx-auto flex max-w-6xl flex-col gap-6 rounded-2xl bg-gradient-to-r from-[#e31111] via-[#e91c24] to-[#f5381b] p-[1px] shadow-[0_24px_70px_rgba(185,28,28,0.55)] sm:rounded-[28px] sm:flex-row sm:items-center sm:justify-center sm:gap-10 lg:rounded-[32px] max-lg:rounded-[20px] max-lg:shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(185,28,28,0.18)]"
      >
        <div className="flex-1 rounded-2xl bg-gradient-to-r from-[rgba(255,255,255,0.1)] to-[rgba(255,255,255,0.02)] px-4 py-5 sm:rounded-[26px] sm:px-7 sm:py-7 lg:rounded-[30px] lg:px-8 lg:py-8 max-lg:rounded-[19px] max-lg:px-5 max-lg:py-6">
          <div className="flex items-start gap-3 sm:gap-4 max-lg:flex-col max-lg:items-center max-lg:text-center max-lg:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur sm:h-12 sm:w-12 sm:rounded-2xl max-lg:h-14 max-lg:w-14 max-lg:rounded-2xl max-lg:bg-white/15">
              <Wrench className="h-5 w-5 sm:h-6 sm:w-6 max-lg:h-7 max-lg:w-7" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 className="text-left text-lg font-extrabold tracking-tight text-white xs:text-xl sm:text-2xl lg:text-3xl max-lg:text-center max-lg:text-[22px] max-lg:leading-snug">
                Masz problem z urządzeniem?{" "}
                <span className="block text-white/95 sm:inline">
                  Zgłoś naprawę już dziś.
                </span>
              </h2>
              <p className="mt-2 text-sm text-white/90 sm:text-base max-lg:text-[15px]">
                Szybka diagnostyka i wycena. Bez zobowiązań.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90 max-lg:mt-3 max-lg:justify-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur max-lg:py-1.5">
                  <BadgeDollarSign className="h-3.5 w-3.5" aria-hidden />
                  Bezpłatna wycena
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1 backdrop-blur max-lg:py-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                  Gwarancja na naprawę
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Przyciski */}
        <div className="flex flex-1 flex-col items-stretch justify-center gap-3 px-4 pb-5 sm:max-w-sm sm:px-0 sm:pb-0 max-lg:px-5 max-lg:pb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center max-lg:gap-2.5">
            <PremiumButton
              href="/zgloszenie"
              variant="outline"
              size="lg"
              className="min-h-[48px] w-full justify-center rounded-full border-0 bg-white px-6 py-3.5 text-base font-semibold text-primary shadow-[0_10px_24px_rgba(0,0,0,0.25)] hover:bg-white/95 sm:min-h-[50px] sm:w-auto sm:px-8 max-lg:min-h-[52px] max-lg:rounded-2xl max-lg:text-[16px] max-lg:font-bold max-lg:shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
            >
              Zgłoś naprawę
            </PremiumButton>
            <PremiumButton
              href="/kontakt"
              variant="outline"
              size="lg"
              className="min-h-[48px] w-full justify-center border-white/70 text-white hover:bg-white/10 sm:w-auto max-lg:min-h-[48px] max-lg:rounded-2xl max-lg:border-white/40 max-lg:text-[15px]"
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
