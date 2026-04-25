"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { MapPin, Phone, Mail, Clock, PhoneCall, Navigation } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";

const CONTACT = {
  addressLine1: "ul. Orkana 16B",
  addressLine2: "34-700 Rabka-Zdrój",
  phone: "883 200 151",
  email: "sklep@pro-kom.eu",
  hoursWeek: "Poniedziałek – Piątek",
  hoursWeekValue: "9:00 – 17:00",
  hoursSat: "Sobota",
  hoursSatValue: "9:00 – 14:00",
  hoursSun: "Niedziela",
  hoursSunValue: "Zamknięte",
};

export function Contact() {
  return (
    <section className="bg-white py-12 sm:py-20 lg:py-24 max-lg:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 max-lg:px-5">
        {/* Nagłówek sekcji */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            Znajdź nas
          </p>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-dark xs:text-3xl sm:text-4xl lg:text-5xl max-lg:text-[26px] max-lg:leading-snug">
            Odwiedź nas lub <span className="text-primary">napisz —</span>
            <br />
            chętnie pomożemy.
          </h2>
          <p className="mt-4 max-w-md text-sm text-neutral sm:text-base max-lg:text-[14px]">
            Jesteśmy w centrum Rabki-Zdroju. Zapraszamy osobiście, telefonicznie
            lub mailowo.
          </p>
        </motion.div>

        {/* Grid 2x2 jak na projekcie */}
        <div className="mt-10 grid gap-6 lg:auto-rows-fr lg:grid-cols-2 max-lg:mt-8 max-lg:gap-4">
          {/* 1. Lewo-góra – karta z danymi kontaktowymi */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-3xl bg-white shadow-[0_22px_60px_rgba(15,23,42,0.12)] ring-1 ring-[#e4e4e7] max-lg:rounded-[20px] max-lg:shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] max-lg:ring-[#efefef]"
          >
            {/* Nagłówek karty */}
            <div className="flex items-center justify-between px-6 py-4 sm:px-7">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                  PRO-KOM SERWIS
                </p>
                <p className="mt-1 text-lg font-extrabold text-dark">
                  Dane kontaktowe
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Otwarte teraz
              </span>
            </div>

            <div className="border-t border-[#ededf1]" />

            {/* Wiersz: Adres */}
            <div className="flex items-start gap-4 px-6 py-5 sm:px-7 max-lg:items-center max-lg:gap-3.5 max-lg:px-4 max-lg:py-4 max-lg:mx-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary max-lg:h-11 max-lg:w-11">
                <MapPin className="h-4 w-4 max-lg:h-5 max-lg:w-5" aria-hidden />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral">
                  Adres
                </p>
                <p className="mt-1 font-semibold leading-snug max-lg:text-[15px]">
                  {CONTACT.addressLine1}
                  <br />
                  {CONTACT.addressLine2}
                </p>
              </div>
            </div>

            <div className="border-t border-[#ededf1]" />

            {/* Wiersz: Telefon */}
            <a
              href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}
              className="flex items-start gap-4 px-6 py-5 sm:px-7 max-lg:min-h-[56px] max-lg:items-center max-lg:gap-3.5 max-lg:rounded-2xl max-lg:mx-3 max-lg:px-4 max-lg:py-4 max-lg:active:bg-primary/5 max-lg:transition-colors"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary max-lg:h-11 max-lg:w-11">
                <Phone className="h-4 w-4 max-lg:h-5 max-lg:w-5" aria-hidden />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral">
                  Telefon
                </p>
                <p className="mt-1 text-lg font-extrabold text-dark max-lg:text-base">
                  {CONTACT.phone}
                </p>
              </div>
            </a>

            <div className="border-t border-[#ededf1]" />

            {/* Wiersz: E-mail */}
            <a
              href={`mailto:${CONTACT.email}`}
              className="flex items-start gap-4 px-6 py-5 sm:px-7 max-lg:min-h-[56px] max-lg:items-center max-lg:gap-3.5 max-lg:rounded-2xl max-lg:mx-3 max-lg:px-4 max-lg:py-4 max-lg:active:bg-primary/5 max-lg:transition-colors"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary max-lg:h-11 max-lg:w-11">
                <Mail className="h-4 w-4 max-lg:h-5 max-lg:w-5" aria-hidden />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral">
                  E-mail
                </p>
                <p className="mt-1 font-extrabold text-dark max-lg:text-[15px]">
                  {CONTACT.email}
                </p>
              </div>
            </a>

            <div className="border-t border-[#ededf1]" />

            {/* Wiersz: Godziny otwarcia */}
            <div className="flex items-start gap-4 px-6 py-5 sm:px-7 max-lg:gap-3.5 max-lg:px-4 max-lg:py-4 max-lg:mx-3">
              <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary max-lg:mt-0 max-lg:h-11 max-lg:w-11">
                <Clock className="h-4 w-4 max-lg:h-5 max-lg:w-5" aria-hidden />
              </span>
              <div className="flex w-full justify-between gap-6 text-sm max-lg:gap-3">
                <div className="text-neutral">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral">
                    Godziny otwarcia
                  </p>
                  <p className="mt-2">Poniedziałek – Piątek</p>
                  <p>Sobota</p>
                  <p>Niedziela</p>
                </div>
                <div className="text-right font-semibold">
                  <p className="mt-6">{CONTACT.hoursWeekValue}</p>
                  <p>{CONTACT.hoursSatValue}</p>
                  <p className="text-neutral">{CONTACT.hoursSunValue}</p>
                </div>
              </div>
            </div>

          </motion.div>

          {/* 2. Prawo-góra – zdjęcie / panel lokalizacji (ciemny) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-3xl bg-black shadow-[0_22px_60px_rgba(0,0,0,0.55)] max-lg:rounded-[20px] max-lg:shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)]"
          >
            <div className="relative h-full min-h-[260px] w-full max-lg:min-h-[200px]">
              <Image
                src="/images/unnamed.webp"
                alt="Siedziba PRO-KOM w Rabce-Zdroju"
                fill
                className="object-cover object-[50%_40%]"
                sizes="(max-width: 768px) 100vw, 560px"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between text-xs text-white">
                <div>
                  <p className="text-sm font-semibold">PRO-KOM Rabka-Zdrój</p>
                  <p className="text-[11px] text-white/80">
                    {CONTACT.addressLine1}, {CONTACT.addressLine2}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  Otwarte dziś
                </span>
              </div>
            </div>
          </motion.div>

          {/* 3. Lewo-dół – szeroka karta z mapą w stylu widgetu (mapa wypełnia cały obszar) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-[#f3f3f5] shadow-[0_18px_50px_rgba(15,23,42,0.12)] ring-1 ring-[#e4e4e7] max-lg:rounded-[20px] max-lg:shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] max-lg:ring-[#efefef]"
          >
            {/* Mapa jako tło wypełniające całą kartę */}
            <iframe
              title="Mapa PRO-KOM Rabka-Zdrój"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d322.10660969885374!2d19.962877138269412!3d49.61297248807983!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47160bcda4c9e4fd%3A0x0000000000000000!2sOrkana%2016B%2C%2034-700%20Rabka-Zdr%C3%B3j!5e0!3m2!1spl!2spl!4v1700000000000!5m2!1spl!2spl"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full min-h-[260px] w-full border-0 max-lg:min-h-[220px]"
            />

            {/* Górny pasek: nazwa miejsca + przycisk otwarcia (overlay na mapie) */}
            <div className="pointer-events-none absolute left-4 right-4 top-4 flex items-center justify-between gap-2 text-xs font-semibold text-neutral">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-[0_6px_16px_rgba(15,23,42,0.18)]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div className="leading-tight">
                  <span className="block text-xs font-semibold text-dark">
                    PRO-KOM Serwis
                  </span>
                  <span className="block text-[11px] font-normal text-neutral">
                    {CONTACT.addressLine1}, {CONTACT.addressLine2}
                  </span>
                </div>
              </div>
              <a
                href="https://www.google.com/maps/place/Orkana+16B,+34-700+Rabka-Zdr%C3%B3j"
                target="_blank"
                rel="noreferrer"
                className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-black px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
              >
                <span>Otwórz</span>
              </a>
            </div>

            {/* Dolne pastylki: status i opis lokalizacji (overlay na mapie) */}
            <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold text-neutral">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-[0_6px_16px_rgba(15,23,42,0.2)]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-neutral">
                  Otwarte · do {CONTACT.hoursWeekValue.split("–")[1]?.trim()}
                </span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-[0_6px_16px_rgba(15,23,42,0.2)]">
                <MapPin className="h-3 w-3 text-primary" aria-hidden />
                <span className="text-[11px] text-neutral">
                  Rabka-Zdrój, centrum
                </span>
              </span>
            </div>
          </motion.div>

          {/* 4. Prawo-dół – szybki kontakt (ciemna karta) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-3 rounded-3xl bg-[#0b0b0c] p-5 text-sm text-white shadow-[0_26px_70px_rgba(0,0,0,0.8)] sm:p-6 max-lg:rounded-[20px] max-lg:bg-white max-lg:text-dark max-lg:shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] max-lg:p-4"
          >
            {/* Nagłówek szybki kontakt + badge Otwarte */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70 max-lg:text-[11px] max-lg:text-neutral max-lg:tracking-[0.22em]">
                  Szybki kontakt
                </p>
                <p className="mt-2 text-[13px] text-white/70 max-lg:text-neutral max-lg:text-[13px]">
                  Jeden klik i jesteś z nami — wybierz formę, która jest dla
                  Ciebie najwygodniejsza.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-400 max-lg:bg-emerald-500/10 max-lg:text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 max-lg:bg-emerald-500" />
                Otwarte
              </span>
            </div>

            <div className="mt-3 border-t border-white/10 max-lg:border-[#efefef]" />

            {/* Wiersze: telefon, e-mail, nawigacja */}
            <div className="space-y-1.5 pt-1">
              <a
                href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-transparent px-2 py-2.5 text-sm text-white/90 transition-all duration-200 hover:border-primary hover:bg-white/5 max-lg:min-h-[52px] max-lg:rounded-2xl max-lg:border-[#f0f0f0] max-lg:bg-[#fafafa] max-lg:px-3 max-lg:py-3 max-lg:text-dark max-lg:active:bg-primary/5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/80 transition-colors duration-200 group-hover:bg-primary group-hover:text-white max-lg:h-10 max-lg:w-10 max-lg:bg-primary/8 max-lg:text-primary">
                    <Phone className="h-4 w-4 max-lg:h-[18px] max-lg:w-[18px]" aria-hidden />
                  </span>
                  <div className="flex flex-col">
                    <span className="font-semibold max-lg:text-dark">{CONTACT.phone}</span>
                    <span className="text-[11px] text-white/60 max-lg:text-neutral">
                      Zadzwoń do nas
                    </span>
                  </div>
                </div>
                <span className="text-lg text-white/40 transition-colors duration-200 group-hover:text-primary max-lg:text-neutral/40">+</span>
              </a>

              <a
                href={`mailto:${CONTACT.email}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-transparent px-2 py-2.5 text-sm text-white/90 transition-all duration-200 hover:border-primary hover:bg-white/5 max-lg:min-h-[52px] max-lg:rounded-2xl max-lg:border-[#f0f0f0] max-lg:bg-[#fafafa] max-lg:px-3 max-lg:py-3 max-lg:text-dark max-lg:active:bg-primary/5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/80 transition-colors duration-200 group-hover:bg-primary group-hover:text-white max-lg:h-10 max-lg:w-10 max-lg:bg-primary/8 max-lg:text-primary">
                    <Mail className="h-4 w-4 max-lg:h-[18px] max-lg:w-[18px]" aria-hidden />
                  </span>
                  <div className="flex flex-col">
                    <span className="font-semibold truncate max-lg:text-dark">
                      {CONTACT.email}
                    </span>
                    <span className="text-[11px] text-white/60 max-lg:text-neutral">
                      Napisz do nas
                    </span>
                  </div>
                </div>
                <span className="text-lg text-white/40 transition-colors duration-200 group-hover:text-primary max-lg:text-neutral/40">+</span>
              </a>

              <a
                href="https://www.google.com/maps/dir/?api=1&destination=Orkana+16B,+34-700+Rabka-Zdr%C3%B3j"
                className="group flex items-center justify-between gap-3 rounded-2xl border border-transparent px-2 py-2.5 text-sm text-white/90 transition-all duration-200 hover:border-primary hover:bg-white/5 max-lg:min-h-[52px] max-lg:rounded-2xl max-lg:border-[#f0f0f0] max-lg:bg-[#fafafa] max-lg:px-3 max-lg:py-3 max-lg:text-dark max-lg:active:bg-primary/5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/80 transition-colors duration-200 group-hover:bg-primary group-hover:text-white max-lg:h-10 max-lg:w-10 max-lg:bg-primary/8 max-lg:text-primary">
                    <Navigation className="h-4 w-4 max-lg:h-[18px] max-lg:w-[18px]" aria-hidden />
                  </span>
                  <div className="flex flex-col">
                    <span className="font-semibold max-lg:text-dark">Nawiguj do serwisu</span>
                    <span className="text-[11px] text-white/60 max-lg:text-neutral">
                      ul. Orkana 16B, Rabka-Zdrój
                    </span>
                  </div>
                </div>
                <span className="text-lg text-white/40 transition-colors duration-200 group-hover:text-primary max-lg:text-neutral/40">+</span>
              </a>
            </div>

            {/* Dolny kafelek: zgłoś naprawę online */}
            <div className="mt-3 rounded-2xl bg-gradient-to-r from-[#ff1f1f] via-[#ff3b30] to-[#ff6b3d] p-[1.5px] max-lg:mt-2 max-lg:rounded-[16px]">
              <a
                href="/zgloszenie"
                className="flex items-center justify-between gap-3 rounded-[14px] bg-gradient-to-r from-[#1f0202] via-[#250202] to-[#1a0202] px-4 py-3 text-sm text-white max-lg:min-h-[56px] max-lg:rounded-[14px] max-lg:bg-primary max-lg:from-primary max-lg:via-primary max-lg:to-[#c91818] max-lg:px-4 max-lg:py-3.5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600/20 text-red-300 max-lg:h-10 max-lg:w-10 max-lg:bg-white/15 max-lg:text-white">
                    <Navigation className="h-4 w-4 max-lg:h-5 max-lg:w-5" aria-hidden />
                  </span>
                  <div className="flex flex-col">
                    <span className="font-semibold">Zgłoś naprawę online</span>
                    <span className="text-[11px] text-red-200/90 max-lg:text-white/80">
                      Szybka wycena bez wychodzenia z domu
                    </span>
                  </div>
                </div>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-[0_4px_12px_rgba(0,0,0,0.45)] max-lg:bg-white/20 max-lg:shadow-none">
                  →
                </span>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
