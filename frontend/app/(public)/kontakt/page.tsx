"use client";

import React from "react";
import Link from "next/link";
import { useEffect, useState } from "react";

type OpeningStatus = {
  isOpen: boolean;
  label: string;
  until: string;
};

function computeOpeningStatus(date: Date): OpeningStatus {
  const day = date.getDay(); // 0 niedziela ... 6 sobota
  const hour = date.getHours() + date.getMinutes() / 60;

  const isWeekday = day >= 1 && day <= 5;
  const isSaturday = day === 6;

  if (isWeekday && hour >= 9 && hour < 17) {
    return {
      isOpen: true,
      label: "Teraz otwarte",
      until: "do 17:00",
    };
  }

  if (isSaturday && hour >= 9 && hour < 14) {
    return {
      isOpen: true,
      label: "Teraz otwarte",
      until: "do 14:00",
    };
  }

  // closed – find next opening slot
  const next = new Date(date);

  // helper to set to specific weekday and hour
  const setTo = (targetDay: number, hour: number) => {
    const diff =
      (targetDay - day + 7) % 7 || 7; /* if same day already passed, go next week */
    next.setDate(date.getDate() + diff);
    next.setHours(hour, 0, 0, 0);
  };

  if (isWeekday && hour < 9) {
    setTo(day, 9);
  } else if (isWeekday && hour >= 17) {
    // next day 9:00 (if Fri → Mon)
    if (day === 5) {
      setTo(1, 9);
    } else {
      setTo(day + 1, 9);
    }
  } else if (isSaturday && hour < 9) {
    setTo(6, 9);
  } else if (isSaturday && hour >= 14) {
    // next Monday
    setTo(1, 9);
  } else if (day === 0) {
    // Sunday → Monday
    setTo(1, 9);
  } else {
    setTo(1, 9);
  }

  const weekdayNames: Record<number, string> = {
    1: "Poniedziałek",
    2: "Wtorek",
    3: "Środa",
    4: "Czwartek",
    5: "Piątek",
    6: "Sobota",
    0: "Poniedziałek",
  };

  const nextDay = next.getDay();
  const nextHour = next.getHours();

  return {
    isOpen: false,
    label: "Zamknięte",
    until: `otwieramy ${weekdayNames[nextDay]} ${nextHour}:00`,
  };
}

export default function KontaktPage() {
  const [status, setStatus] = useState<OpeningStatus | null>(null);
  const [today, setToday] = useState<number | null>(null);

  useEffect(() => {
    const now = new Date();
    setStatus(computeOpeningStatus(now));
    setToday(now.getDay());
  }, []);

  const isWeekdayToday = today !== null && today >= 1 && today <= 5;
  const isSaturdayToday = today === 6;

  return (
    <div role="main" className="min-h-[100vh] w-full font-sans bg-[#f4f4f5] max-lg:bg-white">
      {/* SEKCJA 1 — Dark Hero (white on mobile) */}
      <section className="relative overflow-hidden bg-[#0d0e10] py-16 sm:py-20 max-lg:bg-white max-lg:py-6 max-lg:pb-2">
        {/* red glow - desktop only */}
        <div
          className="pointer-events-none absolute -right-20 -top-28 h-[600px] w-[600px] max-lg:hidden"
          style={{
            background:
              "radial-gradient(ellipse, rgba(220,30,30,.09), transparent 65%)",
          }}
          aria-hidden
        />
        {/* subtle grid - desktop only */}
        <div
          className="pointer-events-none absolute inset-0 max-lg:hidden"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.025) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
            maskImage:
              "radial-gradient(circle at 100% 0%, black, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(circle at 100% 0%, black, transparent 70%)",
          }}
          aria-hidden
        />

        <div className="relative mx-auto flex max-w-[1240px] flex-col gap-14 px-6 py-8 sm:px-10 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-20 xl:px-0 max-lg:gap-5 max-lg:px-5 max-lg:py-0">
          {/* Left column */}
          <div className="space-y-8 max-lg:space-y-4">
            <p className="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#4b5563] max-lg:text-[10px] max-lg:text-slate-400">
              PRO-KOM{" "}
              <span className="text-[#dc1e1e]">/ Kontakt</span>
            </p>
            <h1
              className="font-bold leading-[1.05] tracking-tight text-white max-lg:!text-[28px] max-lg:text-slate-900"
              style={{ fontSize: "clamp(32px,4.8vw,60px)" }}
            >
              Skontaktuj
              <br />
              się z{" "}
              <span className="text-[#dc1e1e]">nami.</span>
            </h1>
            <p className="max-w-[440px] font-sans text-[16px] leading-[1.75] text-[#9ca3af] max-lg:text-[14px] max-lg:leading-[1.7] max-lg:text-slate-500">
              Serwis elektroniki w Rabce-Zdroju. Naprawiamy telefony, laptopy i
              tablety — szybko, z gwarancją.
            </p>
          </div>

          {/* Right column */}
          <div className="flex flex-col items-stretch gap-4 sm:items-end max-lg:gap-3">
            {/* Status pill */}
            <div className="inline-flex min-w-0 max-w-full flex-wrap items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 font-sans text-[13px] sm:flex-nowrap max-lg:self-start max-lg:border-slate-200 max-lg:bg-slate-50 max-lg:px-4 max-lg:py-2">
              <div className="relative h-2.5 w-2.5 flex-shrink-0">
                <span
                  className={`absolute inset-0 rounded-full ${
                    status?.isOpen ? "bg-emerald-500" : "bg-[#6b7280]"
                  }`}
                />
                {status?.isOpen && (
                  <span className="absolute inset-0 rounded-full bg-emerald-500 opacity-60 animate-ring" />
                )}
              </div>
              <span className="font-semibold text-white max-lg:text-slate-900">
                {status ? status.label : "Sprawdzamy godziny"}
              </span>
              {status?.until && (
                <span className="text-[#9ca3af] max-lg:text-slate-500">
                  <span className="mx-1.5 text-white/40 max-lg:text-slate-300">·</span>
                  {status.until}
                </span>
              )}
            </div>

            {/* Contact pills - tappable action cards on mobile */}
            <div className="flex flex-col gap-3 sm:w-[280px] max-lg:w-full max-lg:gap-2.5">
              <Link
                href="tel:883200151"
                className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-[#13151a] px-5 py-4 font-sans transition-all duration-200 hover:-translate-x-1 hover:border-[rgba(220,30,30,.35)] hover:bg-[rgba(220,30,30,.08)] max-lg:min-h-[68px] max-lg:rounded-[20px] max-lg:border-slate-100 max-lg:bg-white max-lg:px-5 max-lg:py-4 max-lg:shadow-[0_2px_12px_rgba(15,23,42,0.06),0_12px_32px_rgba(15,23,42,0.10)] max-lg:hover:translate-x-0 max-lg:active:scale-[0.98]"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(220,30,30,.12)] text-[#dc1e1e] transition-all duration-200 group-hover:bg-[#dc1e1e] group-hover:text-white group-hover:scale-105 max-lg:h-[52px] max-lg:w-[52px] max-lg:rounded-2xl max-lg:bg-red-50 max-lg:shadow-[0_2px_8px_rgba(220,30,30,0.10)]">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path
                      d="M6.5 4.5A2 2 0 0 1 8.4 3h2.2c.9 0 1.6.6 1.8 1.4l.5 2.3a2 2 0 0 1-.6 1.9l-1 1a10.5 10.5 0 0 0 4.3 4.3l1-1a2 2 0 0 1 1.9-.6l2.3.5c.8.2 1.4.9 1.4 1.8v2.2a2 2 0 0 1-1.5 1.9c-2.1.5-6.6.4-10.6-3.6S3 8.6 3.5 6.5A2 2 0 0 1 5.4 5l1.1-.5Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af] max-lg:text-slate-400">
                    Telefon
                  </p>
                  <p className="mt-0.5 text-[15px] font-bold tracking-tight text-white max-lg:text-slate-900">
                    883 200 151
                  </p>
                </div>
              </Link>

              <Link
                href="mailto:sklep@pro-kom.eu"
                className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-[#13151a] px-5 py-4 font-sans transition-all duration-200 hover:-translate-x-1 hover:border-[rgba(220,30,30,.35)] hover:bg-[rgba(220,30,30,.08)] max-lg:min-h-[68px] max-lg:rounded-[20px] max-lg:border-slate-100 max-lg:bg-white max-lg:px-5 max-lg:py-4 max-lg:shadow-[0_2px_12px_rgba(15,23,42,0.06),0_12px_32px_rgba(15,23,42,0.10)] max-lg:hover:translate-x-0 max-lg:active:scale-[0.98]"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(220,30,30,.12)] text-[#dc1e1e] transition-all duration-200 group-hover:bg-[#dc1e1e] group-hover:text-white group-hover:scale-105 max-lg:h-[52px] max-lg:w-[52px] max-lg:rounded-2xl max-lg:bg-red-50 max-lg:shadow-[0_2px_8px_rgba(220,30,30,0.10)]">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path
                      d="M4 5h16a1 1 0 0 1 .8 1.6l-7.6 9.5a1 1 0 0 1-1.6 0L3.2 6.6A1 1 0 0 1 4 5Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af] max-lg:text-slate-400">
                    E-mail
                  </p>
                  <p className="mt-0.5 text-[15px] font-bold tracking-tight text-white break-all max-lg:text-slate-900">
                    sklep@pro-kom.eu
                  </p>
                </div>
              </Link>

              <Link
                href="https://www.google.com/maps/dir/?api=1&destination=Orkana+16B,+34-700+Rabka-Zdr%C3%B3j"
                target="_blank"
                className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-[#13151a] px-5 py-4 font-sans transition-all duration-200 hover:-translate-x-1 hover:border-[rgba(220,30,30,.35)] hover:bg-[rgba(220,30,30,.08)] max-lg:min-h-[68px] max-lg:rounded-[20px] max-lg:border-slate-100 max-lg:bg-white max-lg:px-5 max-lg:py-4 max-lg:shadow-[0_2px_12px_rgba(15,23,42,0.06),0_12px_32px_rgba(15,23,42,0.10)] max-lg:hover:translate-x-0 max-lg:active:scale-[0.98]"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(220,30,30,.12)] text-[#dc1e1e] transition-all duration-200 group-hover:bg-[#dc1e1e] group-hover:text-white group-hover:scale-105 max-lg:h-[52px] max-lg:w-[52px] max-lg:rounded-2xl max-lg:bg-red-50 max-lg:shadow-[0_2px_8px_rgba(220,30,30,0.10)]">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path
                      d="M12 3a6 6 0 0 0-6 6c0 4.1 4.7 9.3 5.4 10a1 1 0 0 0 1.2 0C13.3 18.3 18 13.1 18 9a6 6 0 0 0-6-6Zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af] max-lg:text-slate-400">
                    Adres
                  </p>
                  <p className="mt-0.5 text-[15px] font-bold tracking-tight text-white max-lg:text-slate-900">
                    ul. Orkana 16B, Rabka-Zdrój
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SEKCJA 2 — Dane kontaktowe */}
      <section className="bg-[#f0f0f0] py-12 sm:py-16 max-lg:bg-white max-lg:py-6">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-10 max-lg:px-5">
        {/* Tag + cards are desktop/tablet only (mobile already has cards in hero) */}
        <div className="flex justify-center max-lg:hidden">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#dc1e1e] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white max-lg:bg-red-50 max-lg:text-[#dc1e1e]">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-blink max-lg:bg-[#dc1e1e]" />
            Dane kontaktowe
          </span>
        </div>

        {/* Cards */}
        <div className="mt-8 grid gap-4 md:grid-cols-3 max-lg:hidden">
          <Link
            href="tel:883200151"
            className="group relative flex flex-col rounded-[22px] border border-[#eaeaea] bg-white px-[26px] py-[24px] shadow-[0_2px_8px_rgba(0,0,0,.05),0_6px_24px_rgba(0,0,0,.06)] transition-transform duration-200 hover:-translate-y-[6px] hover:border-[rgba(220,30,30,.2)] max-lg:flex-row max-lg:items-center max-lg:gap-4 max-lg:rounded-[20px] max-lg:border-slate-100 max-lg:px-5 max-lg:py-5 max-lg:shadow-[0_2px_12px_rgba(15,23,42,0.06),0_12px_32px_rgba(15,23,42,0.10)] max-lg:active:scale-[0.98]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-[#dc1e1e] opacity-80 transition-transform duration-300 group-hover:scale-x-100 max-lg:hidden" />
            <div className="flex h-[50px] w-[50px] items-center justify-center rounded-[14px] border border-[rgba(220,30,30,.15)] bg-[#fff0f0] text-[#dc1e1e] transition-all duration-200 group-hover:bg-[#dc1e1e] group-hover:text-white group-hover:-rotate-3 group-hover:scale-[1.06] max-lg:h-14 max-lg:w-14 max-lg:flex-shrink-0 max-lg:rounded-2xl max-lg:border-0 max-lg:bg-red-50 max-lg:shadow-[0_2px_8px_rgba(220,30,30,0.10)]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M6.5 4.5A2 2 0 0 1 8.4 3h2.2c.9 0 1.6.6 1.8 1.4l.5 2.3a2 2 0 0 1-.6 1.9l-1 1a10.5 10.5 0 0 0 4.3 4.3l1-1a2 2 0 0 1 1.9-.6l2.3.5c.8.2 1.4.9 1.4 1.8v2.2a2 2 0 0 1-1.5 1.9c-2.1.5-6.6.4-10.6-3.6S3 8.6 3.5 6.5A2 2 0 0 1 5.4 5l1.1-.5Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div className="max-lg:min-w-0 max-lg:flex-1">
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#bbbbbb] max-lg:mt-0 max-lg:text-slate-400">
                Telefon
              </p>
              <p
                className="mt-1 font-bold text-[#0d0d0d] tracking-tight max-lg:!text-[16px]"
                style={{ fontSize: "clamp(15px,1.7vw,21px)" }}
              >
                883 200 151
              </p>
              <p className="mt-2 text-[13px] text-[#777] max-lg:mt-0.5 max-lg:text-[12px] max-lg:text-slate-400">
                Odpowiadamy od ręki podczas godzin otwarcia.
              </p>
            </div>
          </Link>

          <Link
            href="mailto:sklep@pro-kom.eu"
            className="group relative flex flex-col rounded-[22px] border border-[#eaeaea] bg-white px-[26px] py-[24px] shadow-[0_2px_8px_rgba(0,0,0,.05),0_6px_24px_rgba(0,0,0,.06)] transition-transform duration-200 hover:-translate-y-[6px] hover:border-[rgba(220,30,30,.2)] max-lg:flex-row max-lg:items-center max-lg:gap-4 max-lg:rounded-[20px] max-lg:border-slate-100 max-lg:px-5 max-lg:py-5 max-lg:shadow-[0_2px_12px_rgba(15,23,42,0.06),0_12px_32px_rgba(15,23,42,0.10)] max-lg:active:scale-[0.98]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-[#dc1e1e] opacity-80 transition-transform duration-300 group-hover:scale-x-100 max-lg:hidden" />
            <div className="flex h-[50px] w-[50px] items-center justify-center rounded-[14px] border border-[rgba(220,30,30,.15)] bg-[#fff0f0] text-[#dc1e1e] transition-all duration-200 group-hover:bg-[#dc1e1e] group-hover:text-white group-hover:-rotate-3 group-hover:scale-[1.06] max-lg:h-14 max-lg:w-14 max-lg:flex-shrink-0 max-lg:rounded-2xl max-lg:border-0 max-lg:bg-red-50 max-lg:shadow-[0_2px_8px_rgba(220,30,30,0.10)]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M4 5h16a1 1 0 0 1 .8 1.6l-7.6 9.5a1 1 0 0 1-1.6 0L3.2 6.6A1 1 0 0 1 4 5Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div className="max-lg:min-w-0 max-lg:flex-1">
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#bbbbbb] max-lg:mt-0 max-lg:text-slate-400">
                E-mail
              </p>
              <p
                className="mt-1 font-bold text-[#0d0d0d] tracking-tight max-lg:!text-[16px]"
                style={{ fontSize: "clamp(15px,1.7vw,21px)" }}
              >
                sklep@pro-kom.eu
              </p>
              <p className="mt-2 text-[13px] text-[#777] max-lg:mt-0.5 max-lg:text-[12px] max-lg:text-slate-400">
                Odpisujemy tego samego dnia roboczego.
              </p>
            </div>
          </Link>

          <Link
            href="https://www.google.com/maps/dir/?api=1&destination=Orkana+16B,+34-700+Rabka-Zdr%C3%B3j"
            target="_blank"
            className="group relative flex flex-col rounded-[22px] border border-[#eaeaea] bg-white px-[26px] py-[24px] shadow-[0_2px_8px_rgba(0,0,0,.05),0_6px_24px_rgba(0,0,0,.06)] transition-transform duration-200 hover:-translate-y-[6px] hover:border-[rgba(220,30,30,.2)] max-lg:flex-row max-lg:items-center max-lg:gap-4 max-lg:rounded-[20px] max-lg:border-slate-100 max-lg:px-5 max-lg:py-5 max-lg:shadow-[0_2px_12px_rgba(15,23,42,0.06),0_12px_32px_rgba(15,23,42,0.10)] max-lg:active:scale-[0.98]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-[#dc1e1e] opacity-80 transition-transform duration-300 group-hover:scale-x-100 max-lg:hidden" />
            <div className="flex h-[50px] w-[50px] items-center justify-center rounded-[14px] border border-[rgba(220,30,30,.15)] bg-[#fff0f0] text-[#dc1e1e] transition-all duration-200 group-hover:bg-[#dc1e1e] group-hover:text-white group-hover:-rotate-3 group-hover:scale-[1.06] max-lg:h-14 max-lg:w-14 max-lg:flex-shrink-0 max-lg:rounded-2xl max-lg:border-0 max-lg:bg-red-50 max-lg:shadow-[0_2px_8px_rgba(220,30,30,0.10)]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M12 3a6 6 0 0 0-6 6c0 4.1 4.7 9.3 5.4 10a1 1 0 0 0 1.2 0C13.3 18.3 18 13.1 18 9a6 6 0 0 0-6-6Zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div className="max-lg:min-w-0 max-lg:flex-1">
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#bbbbbb] max-lg:mt-0 max-lg:text-slate-400">
                Adres
              </p>
              <p
                className="mt-1 font-bold text-[#0d0d0d] tracking-tight max-lg:!text-[16px]"
                style={{ fontSize: "clamp(15px,1.7vw,21px)" }}
              >
                ul. Orkana 16B<span className="max-lg:hidden"><br /></span><span className="lg:hidden">, </span>Rabka-Zdrój
              </p>
              <p className="mt-2 text-[13px] text-[#777] max-lg:mt-0.5 max-lg:text-[12px] max-lg:text-slate-400">
                34-700 · woj. małopolskie · bezpłatny parking
              </p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[rgba(34,197,94,.08)] px-3 py-1 text-[11px] font-medium text-[#16a34a] max-lg:mt-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                {status?.isOpen ? "Teraz otwarte" : "Sprawdź godziny"}
              </div>
            </div>
          </Link>
        </div>

        {/* Map card */}
        <div className="mt-6 max-lg:mt-5">
          <div className="overflow-hidden rounded-[22px] border border-[#eaeaea] bg-white shadow-[0_2px_8px_rgba(0,0,0,.05),0_6px_24px_rgba(0,0,0,.06)] transition-transform duration-200 hover:-translate-y-[4px] hover:border-[rgba(220,30,30,.18)] max-lg:rounded-[20px] max-lg:border-slate-100 max-lg:shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)]">
            <div className="relative h-[280px] w-full max-lg:h-[200px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d653.16!2d19.96589!3d49.60698!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x473d720e7cc73ad1%3A0x3d4e85e90a93c9a8!2sul.%20Orkana%2016B%2C%2034-700%20Rabka-Zdr%C3%B3j!5e0!3m2!1spl!2spl!4v1700000000000"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full border-0"
                style={{
                  filter: "grayscale(.08) contrast(1.02)",
                }}
              />
            </div>
            <div className="flex items-center justify-between border-t border-[#eaeaea] px-[22px] py-4 text-[13px] max-lg:flex-col max-lg:items-start max-lg:gap-3 max-lg:px-4 max-lg:py-3">
              <div className="max-lg:text-[12px]">
                <span className="text-[11px] font-bold text-[#0d0d0d] tracking-tight">
                  ul. Orkana 16B
                </span>
                <span className="ml-2 text-[#777]">
                  34-700 Rabka-Zdrój
                </span>
              </div>
              <div className="flex gap-2 max-lg:w-full max-lg:gap-2.5">
                <Link
                  href="https://www.google.com/maps/place/ul.+Orkana+16B,+34-700+Rabka-Zdr%C3%B3j"
                  target="_blank"
                  className="rounded-full border border-[#eaeaea] px-4 py-1.5 text-[12px] font-medium text-[#6b7280] max-lg:flex-1 max-lg:min-h-[44px] max-lg:flex max-lg:items-center max-lg:justify-center max-lg:rounded-[12px] max-lg:text-[13px]"
                >
                  Mapy
                </Link>
                <Link
                  href="https://www.google.com/maps/dir/?api=1&destination=Orkana+16B,+34-700+Rabka-Zdr%C3%B3j"
                  target="_blank"
                  className="rounded-full bg-[#dc1e1e] px-4 py-1.5 text-[12px] font-semibold text-white shadow-[0_3px_12px_rgba(220,30,30,.28)] max-lg:flex-1 max-lg:min-h-[44px] max-lg:flex max-lg:items-center max-lg:justify-center max-lg:rounded-[12px] max-lg:text-[13px]"
                >
                  Nawiguj
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      </section>

      {/* SEKCJA 3 — Godziny otwarcia */}
      <section className="relative overflow-hidden bg-[#0d0e10] px-4 py-14 sm:px-8 lg:px-10 max-lg:bg-white max-lg:px-5 max-lg:py-8">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-[400px] w-[400px] max-lg:hidden"
          style={{
            background:
              "radial-gradient(ellipse, rgba(220,30,30,.07), transparent 65%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-[1240px]">
          <div className="mb-9 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center max-lg:mb-5">
            <h2
              className="font-bold tracking-tight text-white max-lg:!text-[20px] max-lg:text-slate-900"
              style={{ fontSize: "clamp(18px,2.2vw,26px)" }}
            >
              Godziny otwarcia
            </h2>
            <div className="inline-flex items-center gap-3 rounded-full border border-[rgba(34,197,94,.2)] bg-[rgba(34,197,94,.08)] px-4 py-2 text-[12px] max-lg:border-green-100 max-lg:bg-green-50">
              <span className="h-2 w-2 rounded-full bg-[#22c55e] animate-ring" />
              <span className="font-semibold text-[#4ade80] max-lg:text-green-700">
                {status?.isOpen ? "Teraz otwarte" : "Zamknięte"}
              </span>
              <span className="text-green-400 max-lg:text-green-600">
                {status?.isOpen ? `· czynne ${status.until}` : status?.until}
              </span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3 max-lg:grid-cols-1 max-lg:gap-2.5">
            {/* Pon–Pt */}
            <div
              className={`relative rounded-[18px] border px-7 pb-6 pt-7 transition-all duration-200 ${
                isWeekdayToday
                  ? "border-[rgba(220,30,30,.3)] bg-[rgba(220,30,30,.05)]"
                  : "border-[rgba(255,255,255,.06)] bg-[#13151a]"
              } hover:-translate-y-[3px] hover:border-[rgba(255,255,255,.1)] hover:bg-[#1a1d23] max-lg:rounded-[20px] max-lg:px-5 max-lg:pb-4 max-lg:pt-5 ${
                isWeekdayToday
                  ? "max-lg:border-red-100 max-lg:bg-red-50/50"
                  : "max-lg:border-slate-100 max-lg:bg-white"
              } max-lg:shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] max-lg:hover:translate-y-0`}
            >
              <div
                className={`pointer-events-none absolute inset-x-0 top-0 h-[3px] origin-left max-lg:hidden ${
                  isWeekdayToday
                    ? "bg-[linear-gradient(90deg,#dc1e1e,rgba(220,30,30,.3),transparent)] animate-scaleX"
                    : "bg-[rgba(255,255,255,.04)]"
                }`}
              />
              <div className="flex items-center gap-2">
                <p
                  className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${
                    isWeekdayToday
                      ? "text-[rgba(220,30,30,.7)] max-lg:text-[#dc1e1e]"
                      : "text-[#9ca3af] max-lg:text-slate-400"
                  }`}
                >
                  Poniedziałek – Piątek
                </p>
                {isWeekdayToday && (
                  <span className="rounded-full bg-[#fee2e2] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#b91c1c]">
                    Dziś
                  </span>
                )}
              </div>
              <p
                className="mt-3 font-bold text-white tracking-tight max-lg:mt-1.5 max-lg:!text-[24px] max-lg:text-slate-900"
                style={{ fontSize: "clamp(22px,2.8vw,36px)" }}
              >
                9:00 – 17:00
              </p>
              <p className="mt-2 text-[12px] text-[#9ca3af] max-lg:mt-1 max-lg:text-slate-400">5 dni roboczych</p>
            </div>

            {/* Sobota */}
            <div
              className={`relative rounded-[18px] border px-7 pb-6 pt-7 transition-all duration-200 ${
                isSaturdayToday
                  ? "border-[rgba(220,30,30,.3)] bg-[rgba(220,30,30,.05)]"
                  : "border-[rgba(255,255,255,.06)] bg-[#13151a]"
              } hover:-translate-y-[3px] hover:border-[rgba(255,255,255,.1)] hover:bg-[#1a1d23] max-lg:rounded-[20px] max-lg:px-5 max-lg:pb-4 max-lg:pt-5 ${
                isSaturdayToday
                  ? "max-lg:border-red-100 max-lg:bg-red-50/50"
                  : "max-lg:border-slate-100 max-lg:bg-white"
              } max-lg:shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] max-lg:hover:translate-y-0`}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-[rgba(255,255,255,.04)] max-lg:hidden" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af] max-lg:text-slate-400">
                Sobota
              </p>
              <p
                className="mt-3 font-bold text-white tracking-tight max-lg:mt-1.5 max-lg:!text-[24px] max-lg:text-slate-900"
                style={{ fontSize: "clamp(22px,2.8vw,36px)" }}
              >
                9:00 – 14:00
              </p>
              <p className="mt-2 text-[12px] text-[#9ca3af] max-lg:mt-1 max-lg:text-slate-400">
                skrócone godziny
              </p>
            </div>

            {/* Niedziela */}
            <div className="relative rounded-[18px] border border-[rgba(255,255,255,.06)] bg-[#13151a] px-7 pb-6 pt-7 opacity-60 transition-all duration-200 hover:-translate-y-[3px] hover:border-[rgba(255,255,255,.1)] hover:bg-[#1a1d23] max-lg:rounded-[20px] max-lg:border-slate-100 max-lg:bg-slate-50 max-lg:px-5 max-lg:pb-4 max-lg:pt-5 max-lg:opacity-100 max-lg:hover:translate-y-0">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-[rgba(255,255,255,.04)] max-lg:hidden" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af] max-lg:text-slate-400">
                Niedziela
              </p>
              <p className="mt-3 text-[20px] text-white/40 max-lg:mt-1.5 max-lg:text-slate-300">Zamknięte</p>
              <p className="mt-2 text-[12px] text-[#9ca3af] max-lg:mt-1 max-lg:text-slate-400">dzień wolny</p>
            </div>
          </div>
        </div>
      </section>

      {/* SEKCJA 4 — CTA + statystyki */}
      <section className="relative overflow-hidden bg-[#0d0e10] px-4 pb-16 pt-0 sm:px-8 lg:px-10 max-lg:bg-white max-lg:px-5 max-lg:pb-28 max-lg:pt-0">
        <div
          className="pointer-events-none absolute -bottom-24 -left-20 h-[500px] w-[500px] max-lg:hidden"
          style={{
            background:
              "radial-gradient(ellipse, rgba(220,30,30,.07), transparent 65%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-[1240px] pt-14 max-lg:pt-6">
          {/* CTA banner */}
          <div className="relative overflow-hidden rounded-[22px] border border-[rgba(255,255,255,.07)] bg-[#13151a] px-6 py-8 sm:px-10 sm:py-11 lg:flex lg:items-center lg:justify-between lg:gap-10 max-lg:rounded-[20px] max-lg:border-slate-100 max-lg:bg-white max-lg:px-5 max-lg:py-6 max-lg:shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] origin-left bg-[linear-gradient(90deg,#dc1e1e,rgba(220,30,30,.2),transparent)] animate-scaleX max-lg:hidden" />
            <div className="max-w-xl space-y-3 max-lg:space-y-2">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af] max-lg:text-slate-400">
                Bezpłatna wycena · bez zobowiązań
              </p>
              <h2
                className="font-bold leading-tight tracking-tight text-white max-lg:!text-[20px] max-lg:text-slate-900"
                style={{ fontSize: "clamp(20px,2.8vw,34px)" }}
              >
                Zepsute urządzenie?
                <br />
                <span className="text-[#dc1e1e]">Zgłoś naprawę online.</span>
              </h2>
              <p className="text-[14px] text-[#9ca3af] max-lg:text-[13px] max-lg:text-slate-500">
                Wypełnij formularz w mniej niż minutę. Oddzwonimy i ustalimy
                szczegóły — bez opłat za diagnostykę.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center lg:mt-0 lg:flex-col lg:items-end max-lg:mt-4 max-lg:gap-2.5">
              <Link
                href="/zgloszenie"
                className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#dc1e1e] px-7 py-3 text-[13px] font-bold text-white shadow-[0_4px_18px_rgba(220,30,30,.35),0_8px_32px_rgba(220,30,30,.2)] transition-transform duration-150 hover:-translate-y-[2px] max-lg:min-h-[48px] max-lg:w-full max-lg:text-[14px]"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    d="M12 2a9 9 0 0 0-9 9v3.5A3.5 3.5 0 0 0 6.5 18h1.3a1 1 0 0 0 .9-.6l.7-1.7a1 1 0 0 1 .9-.6h3.3a1 1 0 0 1 .9.6l.7 1.7a1 1 0 0 0 .9.6h1.3a3.5 3.5 0 0 0 3.5-3.5V11A9 9 0 0 0 12 2Zm0 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"
                    fill="currentColor"
                  />
                </svg>
                Zgłoś naprawę
              </Link>
              <Link
                href="tel:883200151"
                className="inline-flex items-center justify-center gap-1.5 rounded-[14px] border border-[rgba(255,255,255,.08)] px-6 py-2.5 text-[13px] font-semibold text-[#555] transition-colors duration-150 hover:border-[rgba(255,255,255,.18)] hover:text-[#aaa] max-lg:min-h-[48px] max-lg:w-full max-lg:border-slate-200 max-lg:text-slate-600 max-lg:text-[14px]"
              >
                Lub zadzwoń: 883 200 151
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 max-lg:mt-6 max-lg:grid-cols-2 max-lg:gap-2.5">
            {[
              {
                value: (
                  <>
                    10<em className="text-[#dc1e1e]">+</em>
                  </>
                ),
                label: "lat doświadczenia w serwisie elektroniki",
              },
              {
                value: (
                  <>
                    <em className="text-[#dc1e1e]">~</em>1h
                  </>
                ),
                label: "średni czas naprawy ekranu lub baterii",
              },
              {
                value: (
                  <>
                    100<em className="text-[#dc1e1e]">%</em>
                  </>
                ),
                label: "bezpłatna diagnostyka i wycena",
              },
              {
                value: (
                  <>
                    6<em className="text-[#dc1e1e]">dni</em>
                  </>
                ),
                label: "w tygodniu do Twojej dyspozycji",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[18px] border border-[rgba(255,255,255,.06)] bg-[#13151a] px-[22px] py-6 text-left text-[13px] transition-all duration-200 hover:-translate-y-[3px] hover:border-[rgba(220,30,30,.2)] hover:bg-[#1a1d23] max-lg:rounded-[20px] max-lg:border-slate-100 max-lg:bg-white max-lg:px-4 max-lg:py-4 max-lg:shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] max-lg:hover:translate-y-0"
              >
                <div
                  className="font-bold tracking-tight text-white max-lg:!text-[26px] max-lg:text-slate-900"
                  style={{ fontSize: "clamp(24px,3vw,38px)" }}
                >
                  {item.value}
                </div>
                <p className="mt-2 text-[13px] text-[#9ca3af] max-lg:mt-1 max-lg:text-[11px] max-lg:text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
