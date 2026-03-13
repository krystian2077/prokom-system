"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Unbounded, Plus_Jakarta_Sans } from "next/font/google";

const unbounded = Unbounded({ weight: ["700", "900"], subsets: ["latin"], variable: "--font-unbounded" });
const plusJakarta = Plus_Jakarta_Sans({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-plus-jakarta" });

const BAR_WIDTHS = ["10%", "28%", "52%", "74%", "100%"];
const STEPS = [
  { id: 1, label: "Kontakt" },
  { id: 2, label: "Urządzenie" },
  { id: 3, label: "Dostawa" },
  { id: 4, label: "Dodatki" },
  { id: 5, label: "Podsumowanie" },
];

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}
function IconTruck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}
function IconPackage() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconChevronLeft() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function IconChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
function IconSend() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
function IconPerson() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function ZgloszeniePage() {
  const formCardRef = useRef<HTMLDivElement>(null);
  const sidebarHowtoRef = useRef<HTMLDivElement>(null);
  const [howtoHighlight, setHowtoHighlight] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pref, setPref] = useState<"email" | "telefon" | "sms">("email");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [category, setCategory] = useState("");
  const [model, setModel] = useState("");
  const [problem, setProblem] = useState("");
  const [imei, setImei] = useState("");
  const [delivery, setDelivery] = useState<"osobiscie" | "kurier">("osobiscie");
  const [pickup, setPickup] = useState<"osobiscie" | "kurier">("osobiscie");
  const [hammer, setHammer] = useState("");
  const [wantsAccessories, setWantsAccessories] = useState(false);
  const [notes, setNotes] = useState("");
  const [howtoTab, setHowtoTab] = useState<"ios" | "android">("ios");
  const [refNumber, setRefNumber] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const barWidth = submitted ? "100%" : BAR_WIDTHS[currentStep - 1];

  const goNext = (from: number) => {
    if (from < 5) setCurrentStep(from + 1);
    setTimeout(() => formCardRef.current && window.scrollTo({ top: formCardRef.current.offsetTop - 70, behavior: "smooth" }), 50);
  };
  const goBack = (from: number) => {
    if (from > 1) setCurrentStep(from - 1);
    setTimeout(() => formCardRef.current && window.scrollTo({ top: formCardRef.current.offsetTop - 70, behavior: "smooth" }), 50);
  };

  const openHowto = () => {
    sidebarHowtoRef.current?.scrollIntoView({ behavior: "smooth" });
    setHowtoHighlight(true);
    setTimeout(() => setHowtoHighlight(false), 1800);
  };

  const handleSubmit = () => {
    const ref = "PK-" + Math.floor(10000 + Math.random() * 90000);
    setRefNumber(ref);
    setSubmitted(true);
  };

  const contactPreview = [fname.trim(), lname.trim()].filter(Boolean).length ? `${fname.trim()} ${lname.trim()} · ${email.trim() || "—"}` : null;
  const devicePreview = category && model ? `${category} — ${model}` : category || null;
  const problemPreview = problem.trim().slice(0, 55) + (problem.length > 55 ? "…" : "");

  const stepIcon = (i: number) => {
    if (i === 1) return <IconUser />;
    if (i === 2) return <IconPhone />;
    if (i === 3) return <IconTruck />;
    if (i === 4) return <IconPackage />;
    return <IconCheck />;
  };

  const nodeState = (i: number) => {
    if (submitted) return "done";
    if (i < currentStep) return "done";
    if (i === currentStep) return "active";
    return "default";
  };

  return (
    <div className={`min-h-screen bg-zgl-dark font-plus-jakarta text-zgl-ink ${unbounded.variable} ${plusJakarta.variable}`}>

      {/* TOPBAR */}
      <header
        className="sticky top-0 z-[200] flex h-[58px] items-center justify-between border-b border-zgl-border px-6 backdrop-blur-[20px]"
        style={{ background: "rgba(11,12,16,0.92)" }}
      >
        <span className="font-unbounded text-[13.5px] font-black tracking-tight text-zgl-white">
          PRO<span className="text-zgl-red">–</span>KOM
        </span>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-[13px] font-semibold text-zgl-muted transition-colors hover:border-zgl-border2 hover:text-zgl-ink"
        >
          <IconChevronLeft />
          Strona główna
        </Link>
      </header>

      <div className="grid min-h-[calc(100vh-58px)] grid-cols-1 zgl:grid-cols-[1fr_300px]">
        {/* MAIN COLUMN */}
        <div className="border-r border-zgl-border px-5 py-10 md:px-12 md:py-12 lg:px-[48px] lg:pb-20 lg:pt-12">
          {/* Page heading */}
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zgl-muted">
            <span className="h-[2px] w-[18px] bg-zgl-red" />
            SERWIS PRO-KOM · RABKA-ZDRÓJ
          </p>
          <h1 className="mt-3 font-unbounded text-[22px] font-black leading-[0.9] tracking-[-0.05em] text-zgl-white sm:text-[28px] lg:text-[clamp(22px,3.2vw,34px)]">
            Zgłoś naprawę
            <span className="text-zgl-red"> online.</span>
          </h1>
          <p className="mt-3 max-w-[480px] text-[13.5px] text-zgl-ink2">
            Wypełnij formularz w 5 krokach. Po wysłaniu skontaktujemy się z Tobą w celu potwierdzenia zlecenia lub po bezpłatnej diagnozie urządzenia.
          </p>

          {/* Stepper bar */}
          <div className="mt-8 h-[2.5px] w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-zgl-red transition-[width] duration-[.55s] ease-[cubic-bezier(.4,0,.2,1)]"
              style={{ width: barWidth, boxShadow: "0 0 14px rgba(224,32,32,.55)" }}
            />
          </div>
          <div className="mt-4 flex justify-between">
            {STEPS.map((s, i) => {
              const state = nodeState(i + 1);
              return (
                <div key={s.id} className="flex flex-col items-center gap-2">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all duration-300 sm:h-[42px] sm:w-[42px] ${
                      state === "done"
                        ? "border-zgl-red bg-zgl-red text-white"
                        : state === "active"
                          ? "border-zgl-red bg-zgl-red-l text-zgl-red shadow-[0_0_0_5px_rgba(224,32,32,.13),0_0_18px_rgba(224,32,32,.2)]"
                          : "border-zgl-faint bg-zgl-dark2 text-zgl-muted"
                    }`}
                  >
                    {state === "done" ? <IconCheck /> : stepIcon(i + 1)}
                  </div>
                  <span
                    className={`text-[10px] font-semibold sm:text-[10px] ${state === "default" ? "text-zgl-muted" : "text-zgl-ink"}`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Form card */}
          <div ref={formCardRef} className="mt-10 overflow-hidden rounded-zgl-card border border-zgl-border bg-zgl-card shadow-[0_8px_40px_rgba(0,0,0,.4),0_2px_8px_rgba(0,0,0,.3)]">
            {submitted ? (
              <div className="animate-step-in px-6 py-14 text-center md:px-8 md:py-14">
                <div className="mx-auto flex h-[76px] w-[76px] items-center justify-center rounded-full border-2 border-zgl-red-border bg-zgl-red-l shadow-[0_0_0_8px_rgba(224,32,32,.06)]">
                  <span className="text-zgl-red">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                </div>
                <h2 className="mt-6 font-unbounded text-[22px] font-black tracking-[-0.04em] text-zgl-white">Zgłoszenie wysłane!</h2>
                <p className="mx-auto mt-3 max-w-[320px] text-[14px] text-zgl-ink2">
                  Dziękujemy. Skontaktujemy się z Tobą w ciągu kilku godzin roboczych, by potwierdzić przyjęcie sprzętu i ustalić szczegóły.
                </p>
                <div className="mt-6 inline-block rounded-[10px] border border-zgl-border2 bg-zgl-card2 px-6 py-3">
                  <span className="text-[13px] font-bold text-zgl-white">Numer ref: </span>
                  <span className="text-[13px] font-bold text-zgl-red">{refNumber}</span>
                </div>
                <Link
                  href="/"
                  className="mt-8 inline-flex items-center gap-2 text-[13px] font-bold text-zgl-muted transition-colors hover:text-zgl-ink"
                >
                  <IconChevronLeft />
                  Wróć do strony głównej
                </Link>
              </div>
            ) : (
              <>
                {/* Step 1 */}
                <div className={currentStep !== 1 ? "hidden" : "animate-step-in"} style={{ animation: currentStep === 1 ? "stepIn 0.28s ease both" : undefined }}>
                  <div className="card-hd flex items-center gap-[14px] border-b border-zgl-border px-6 py-5 pt-6 md:px-7">
                    <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] border border-zgl-red-border bg-zgl-red-l text-zgl-red">
                      <IconPerson />
                    </div>
                    <h3 className="font-unbounded text-[15px] font-black tracking-[-0.03em] text-zgl-white">Dane kontaktowe</h3>
                  </div>
                  <div className="card-body space-y-4 px-6 py-6 md:px-7">
                    <div className="frow grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-[14px]">
                      <div>
                        <label className="flabel mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zgl-ink2">Imię</label>
                        <input type="text" className="fi w-full rounded-zgl-field border border-zgl-faint bg-zgl-dark2 px-3.5 py-3 text-[14px] text-zgl-white placeholder:text-zgl-muted focus:border-zgl-red focus:bg-zgl-card2 focus:outline-none focus:shadow-[0_0_0_3px_rgba(224,32,32,.14)]" placeholder="Imię" value={fname} onChange={(e) => setFname(e.target.value)} style={{ caretColor: "#e02020" }} />
                      </div>
                      <div>
                        <label className="flabel mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zgl-ink2">Nazwisko</label>
                        <input type="text" className="fi w-full rounded-zgl-field border border-zgl-faint bg-zgl-dark2 px-3.5 py-3 text-[14px] text-zgl-white placeholder:text-zgl-muted focus:border-zgl-red focus:bg-zgl-card2 focus:outline-none focus:shadow-[0_0_0_3px_rgba(224,32,32,.14)]" placeholder="Nazwisko" value={lname} onChange={(e) => setLname(e.target.value)} style={{ caretColor: "#e02020" }} />
                      </div>
                      <div>
                        <label className="flabel mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zgl-ink2">E-mail</label>
                        <input type="email" className="fi w-full rounded-zgl-field border border-zgl-faint bg-zgl-dark2 px-3.5 py-3 text-[14px] text-zgl-white placeholder:text-zgl-muted focus:border-zgl-red focus:bg-zgl-card2 focus:outline-none focus:shadow-[0_0_0_3px_rgba(224,32,32,.14)]" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ caretColor: "#e02020" }} />
                      </div>
                      <div>
                        <label className="flabel mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zgl-ink2">Telefon</label>
                        <input type="tel" className="fi w-full rounded-zgl-field border border-zgl-faint bg-zgl-dark2 px-3.5 py-3 text-[14px] text-zgl-white placeholder:text-zgl-muted focus:border-zgl-red focus:bg-zgl-card2 focus:outline-none focus:shadow-[0_0_0_3px_rgba(224,32,32,.14)]" placeholder="np. 500 123 456" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ caretColor: "#e02020" }} />
                      </div>
                    </div>
                    <p className="flabel text-[11px] font-bold uppercase tracking-widest text-zgl-ink2">Preferowany kontakt</p>
                    <div className="flex flex-wrap gap-2">
                      {(["email", "telefon", "sms"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPref(p)}
                          className={`oi flex items-center gap-3 rounded-[13px] border px-4 py-3 transition-all ${
                            pref === p
                              ? "border-zgl-red bg-zgl-red/10 shadow-[0_0_0_3px_rgba(224,32,32,.1)]"
                              : "border-zgl-faint bg-zgl-dark2 hover:border-zgl-border2 hover:bg-zgl-card2"
                          }`}
                        >
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${pref === p ? "border-zgl-red" : "border-zgl-faint"}`}>
                            {pref === p && <span className="h-2.5 w-2.5 rounded-full bg-zgl-red" />}
                          </span>
                          <span className="text-[13.5px] font-bold text-zgl-white">{p === "email" ? "✉️ E-mail" : p === "telefon" ? "📞 Telefon" : "💬 SMS"}</span>
                        </button>
                      ))}
                    </div>
                    <div className="field-section mt-6 border-t border-zgl-border pt-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zgl-muted">Adres</p>
                      <p className="mt-1 text-[11px] text-zgl-muted">wymagany tylko przy wysyłce kurierskiej</p>
                      <input type="text" className="fi mt-3 w-full rounded-zgl-field border border-zgl-faint bg-zgl-dark2 px-3.5 py-3 text-[14px] text-zgl-white placeholder:text-zgl-muted focus:border-zgl-red focus:bg-zgl-card2 focus:outline-none focus:shadow-[0_0_0_3px_rgba(224,32,32,.14)]" placeholder="Ulica i numer (opcjonalnie)" value={street} onChange={(e) => setStreet(e.target.value)} style={{ caretColor: "#e02020" }} />
                      <div className="frow mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <input type="text" className="fi w-full rounded-zgl-field border border-zgl-faint bg-zgl-dark2 px-3.5 py-3 text-[14px] text-zgl-white placeholder:text-zgl-muted focus:border-zgl-red focus:bg-zgl-card2 focus:outline-none focus:shadow-[0_0_0_3px_rgba(224,32,32,.14)]" placeholder="Miasto (opcjonalnie)" value={city} onChange={(e) => setCity(e.target.value)} style={{ caretColor: "#e02020" }} />
                        <input type="text" className="fi w-full rounded-zgl-field border border-zgl-faint bg-zgl-dark2 px-3.5 py-3 text-[14px] text-zgl-white placeholder:text-zgl-muted focus:border-zgl-red focus:bg-zgl-card2 focus:outline-none focus:shadow-[0_0_0_3px_rgba(224,32,32,.14)]" placeholder="Kod pocztowy (opcjonalnie)" value={zip} onChange={(e) => setZip(e.target.value)} style={{ caretColor: "#e02020" }} />
                      </div>
                    </div>
                  </div>
                  <div className="card-ft flex justify-end border-t border-zgl-border bg-black/15 px-6 py-4 md:px-7">
                    <button type="button" onClick={() => goNext(1)} className="btn-next inline-flex items-center gap-2 rounded-zgl-field border-none bg-zgl-red px-6 py-3 text-[13.5px] font-bold text-white shadow-[0_4px_20px_rgba(224,32,32,.35)] transition-all hover:bg-zgl-red-h hover:shadow-[0_8px_28px_rgba(224,32,32,.5)] active:translate-y-0 hover:-translate-y-px">
                      Dalej <IconChevronRight />
                    </button>
                  </div>
                </div>

                {/* Step 2 */}
                <div className={currentStep !== 2 ? "hidden" : "animate-step-in"}>
                  <div className="card-hd flex items-center gap-[14px] border-b border-zgl-border px-6 py-5 pt-6 md:px-7">
                    <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] border border-zgl-red-border bg-zgl-red-l text-zgl-red">
                      <IconPhone />
                    </div>
                    <h3 className="font-unbounded text-[15px] font-black tracking-[-0.03em] text-zgl-white">Urządzenie</h3>
                  </div>
                  <div className="card-body space-y-4 px-6 py-6 md:px-7">
                    <p className="flabel text-[11px] font-bold uppercase tracking-widest text-zgl-ink2">Kategoria urządzenia</p>
                    <div className="flex flex-wrap gap-2">
                      {["📱 Telefon", "💻 Laptop", "📟 Tablet", "🖥 Komputer", "🖨 Drukarka", "🎮 Konsola", "⚙️ Inne"].map((cat) => {
                        const val = cat.split(" ")[1] || cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setCategory(val)}
                            className={`cpill rounded-zgl-pill px-4 py-2 text-[12.5px] font-semibold transition-all ${
                              category === val ? "border border-zgl-red bg-zgl-red-l text-zgl-white shadow-[0_0_0_3px_rgba(224,32,32,.1)]" : "border border-zgl-faint bg-zgl-dark2 text-zgl-ink2 hover:border-zgl-border2 hover:bg-zgl-card2 hover:text-zgl-ink"
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                    <div>
                      <label className="flabel mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zgl-ink2">Model urządzenia</label>
                      <input type="text" className="fi w-full rounded-zgl-field border border-zgl-faint bg-zgl-dark2 px-3.5 py-3 text-[14px] text-zgl-white placeholder:text-zgl-muted focus:border-zgl-red focus:bg-zgl-card2 focus:outline-none focus:shadow-[0_0_0_3px_rgba(224,32,32,.14)]" placeholder="np. iPhone 15, Samsung Galaxy S24" value={model} onChange={(e) => setModel(e.target.value)} style={{ caretColor: "#e02020" }} />
                      {(category === "Telefon" || category === "Tablet") && (
                        <p className="fi-tip mt-2 text-[12px] text-zgl-ink2">
                          Nie wiesz jaki masz model?{" "}
                          <button type="button" onClick={openHowto} className="font-semibold text-zgl-red underline hover:no-underline">
                            Zobacz instrukcję w panelu po prawej →
                          </button>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="flabel mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zgl-ink2">Opis problemu</label>
                      <textarea className="fta fi min-h-[100px] w-full resize-y rounded-zgl-field border border-zgl-faint bg-zgl-dark2 px-3.5 py-3 text-[14px] leading-[1.68] text-zgl-white placeholder:text-zgl-muted focus:border-zgl-red focus:bg-zgl-card2 focus:outline-none focus:shadow-[0_0_0_3px_rgba(224,32,32,.14)]" placeholder="Opisz usterkę — co się dzieje z urządzeniem, kiedy się pojawiło, czy urządzenie wypadło, zostało zalane..." value={problem} onChange={(e) => setProblem(e.target.value)} style={{ caretColor: "#e02020" }} />
                    </div>
                    <div>
                      <label className="flabel mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zgl-ink2">
                        IMEI <span className="font-normal italic lowercase not-italic text-zgl-muted">(opcjonalnie)</span>
                      </label>
                      <input type="text" className="fi w-full rounded-zgl-field border border-zgl-faint bg-zgl-dark2 px-3.5 py-3 text-[14px] text-zgl-white placeholder:text-zgl-muted focus:border-zgl-red focus:bg-zgl-card2 focus:outline-none focus:shadow-[0_0_0_3px_rgba(224,32,32,.14)]" placeholder="15 cyfr — wpisz *#06# na klawiaturze telefonu" value={imei} onChange={(e) => setImei(e.target.value)} style={{ caretColor: "#e02020" }} />
                    </div>
                  </div>
                  <div className="card-ft flex justify-between border-t border-zgl-border bg-black/15 px-6 py-4 md:px-7">
                    <button type="button" onClick={() => goBack(2)} className="btn-back inline-flex items-center gap-2 text-[13px] font-semibold text-zgl-muted hover:text-zgl-ink">
                      <IconChevronLeft /> Wstecz
                    </button>
                    <button type="button" onClick={() => goNext(2)} className="btn-next inline-flex items-center gap-2 rounded-zgl-field border-none bg-zgl-red px-6 py-3 text-[13.5px] font-bold text-white shadow-[0_4px_20px_rgba(224,32,32,.35)] transition-all hover:bg-zgl-red-h hover:shadow-[0_8px_28px_rgba(224,32,32,.5)] active:translate-y-0 hover:-translate-y-px">
                      Dalej <IconChevronRight />
                    </button>
                  </div>
                </div>

                {/* Step 3 */}
                <div className={currentStep !== 3 ? "hidden" : "animate-step-in"}>
                  <div className="card-hd flex items-center gap-[14px] border-b border-zgl-border px-6 py-5 pt-6 md:px-7">
                    <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] border border-zgl-red-border bg-zgl-red-l text-zgl-red">
                      <IconTruck />
                    </div>
                    <h3 className="font-unbounded text-[15px] font-black tracking-[-0.03em] text-zgl-white">Dostarczenie i zwrot</h3>
                  </div>
                  <div className="card-body space-y-4 px-6 py-6 md:px-7">
                    <p className="flabel text-[11px] font-bold uppercase tracking-widest text-zgl-ink2">Jak dostarczysz urządzenie?</p>
                    <div className="space-y-2">
                      <button type="button" onClick={() => setDelivery("osobiscie")} className={`oi flex w-full items-center gap-3 rounded-[13px] border px-4 py-3.5 text-left transition-all ${delivery === "osobiscie" ? "border-zgl-red bg-zgl-red/5 shadow-[0_0_0_3px_rgba(224,32,32,.1)]" : "border-zgl-faint bg-zgl-dark2 hover:border-zgl-border2 hover:bg-zgl-card2"}`}>
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-zgl-faint">{delivery === "osobiscie" && <span className="h-2.5 w-2.5 rounded-full bg-zgl-red" />}</span>
                        <div className="flex-1">
                          <p className="text-[13.5px] font-bold text-zgl-white">🚶 Osobiście w serwisie</p>
                          <p className="text-[11.5px] text-zgl-muted">ul. Orkana 16B, 34-700 Rabka-Zdrój · pon–pt 9:00–17:00, sob 9:00–14:00</p>
                        </div>
                      </button>
                      <button type="button" onClick={() => setDelivery("kurier")} className={`oi flex w-full items-center gap-3 rounded-[13px] border px-4 py-3.5 text-left transition-all ${delivery === "kurier" ? "border-zgl-red bg-zgl-red/5 shadow-[0_0_0_3px_rgba(224,32,32,.1)]" : "border-zgl-faint bg-zgl-dark2 hover:border-zgl-border2 hover:bg-zgl-card2"}`}>
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-zgl-faint">{delivery === "kurier" && <span className="h-2.5 w-2.5 rounded-full bg-zgl-red" />}</span>
                        <div className="flex-1">
                          <p className="text-[13.5px] font-bold text-zgl-white">📦 Wysyłka kurierska</p>
                          <p className="text-[11.5px] text-zgl-muted">Prześlemy gotową etykietę na Twój e-mail — spakuj sprzęt i nadaj paczkę</p>
                        </div>
                      </button>
                    </div>
                    <div className="field-section mt-6 border-t border-zgl-border pt-5">
                      <p className="flabel text-[11px] font-bold uppercase tracking-widest text-zgl-ink2">Jak chcesz odebrać urządzenie?</p>
                      <div className="mt-3 space-y-2">
                        <button type="button" onClick={() => setPickup("osobiscie")} className={`oi flex w-full items-center gap-3 rounded-[13px] border px-4 py-3.5 text-left transition-all ${pickup === "osobiscie" ? "border-zgl-red bg-zgl-red/5 shadow-[0_0_0_3px_rgba(224,32,32,.1)]" : "border-zgl-faint bg-zgl-dark2 hover:border-zgl-border2 hover:bg-zgl-card2"}`}>
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-zgl-faint">{pickup === "osobiscie" && <span className="h-2.5 w-2.5 rounded-full bg-zgl-red" />}</span>
                          <div className="flex-1">
                            <p className="text-[13.5px] font-bold text-zgl-white">🏪 Odbiór osobisty</p>
                            <p className="text-[11.5px] text-zgl-muted">Powiadomimy Cię SMS-em lub e-mailem, gdy sprzęt będzie gotowy do odbioru</p>
                          </div>
                        </button>
                        <button type="button" onClick={() => setPickup("kurier")} className={`oi flex w-full items-center gap-3 rounded-[13px] border px-4 py-3.5 text-left transition-all ${pickup === "kurier" ? "border-zgl-red bg-zgl-red/5 shadow-[0_0_0_3px_rgba(224,32,32,.1)]" : "border-zgl-faint bg-zgl-dark2 hover:border-zgl-border2 hover:bg-zgl-card2"}`}>
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-zgl-faint">{pickup === "kurier" && <span className="h-2.5 w-2.5 rounded-full bg-zgl-red" />}</span>
                          <div className="flex-1">
                            <p className="text-[13.5px] font-bold text-zgl-white">🚚 Kurier do domu</p>
                            <p className="text-[11.5px] text-zgl-muted">Naprawiony sprzęt wyślemy kurierem pod wskazany adres — cała Polska</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="card-ft flex justify-between border-t border-zgl-border bg-black/15 px-6 py-4 md:px-7">
                    <button type="button" onClick={() => goBack(3)} className="btn-back inline-flex items-center gap-2 text-[13px] font-semibold text-zgl-muted hover:text-zgl-ink">
                      <IconChevronLeft /> Wstecz
                    </button>
                    <button type="button" onClick={() => goNext(3)} className="btn-next inline-flex items-center gap-2 rounded-zgl-field border-none bg-zgl-red px-6 py-3 text-[13.5px] font-bold text-white shadow-[0_4px_20px_rgba(224,32,32,.35)] transition-all hover:bg-zgl-red-h hover:shadow-[0_8px_28px_rgba(224,32,32,.5)] active:translate-y-0 hover:-translate-y-px">
                      Dalej <IconChevronRight />
                    </button>
                  </div>
                </div>

                {/* Step 4 */}
                <div className={currentStep !== 4 ? "hidden" : "animate-step-in"}>
                  <div className="card-hd flex items-center gap-[14px] border-b border-zgl-border px-6 py-5 pt-6 md:px-7">
                    <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] border border-zgl-red-border bg-zgl-red-l text-zgl-red">
                      <IconPackage />
                    </div>
                    <h3 className="font-unbounded text-[15px] font-black tracking-[-0.03em] text-zgl-white">Hammer Glass / akcesoria</h3>
                  </div>
                  <div className="card-body space-y-4 px-6 py-6 md:px-7">
                    <div>
                      <label className="flabel mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zgl-ink2">
                        Zainteresowanie folią Hammer Glass <span className="font-normal italic lowercase not-italic text-zgl-muted">(opcjonalnie)</span>
                      </label>
                      <select className="fs fi w-full appearance-none rounded-zgl-field border border-zgl-faint bg-zgl-dark2 px-3.5 py-3 pr-10 text-[14px] text-zgl-white focus:border-zgl-red focus:bg-zgl-card2 focus:outline-none focus:shadow-[0_0_0_3px_rgba(224,32,32,.14)]" value={hammer} onChange={(e) => setHammer(e.target.value)} style={{ caretColor: "#e02020" }}>
                        <option value="">Wybierz opcję (opcjonalnie)</option>
                        <option value="tak">Tak — interesuje mnie folia ochronna Hammer Glass</option>
                        <option value="nie">Nie, dziękuję</option>
                      </select>
                    </div>
                    <div className="rounded-[11px] border border-zgl-border bg-zgl-card2 p-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-zgl-pill bg-zgl-red px-2.5 py-1 text-[9px] font-extrabold text-white">HAMMER GLASS CUT</span>
                        <span className="text-[13px] font-bold text-zgl-white">Folia precyzyjnie cięta na Twój model</span>
                      </div>
                      <p className="mt-2 text-[11.5px] leading-relaxed text-zgl-muted">
                        Wycinamy folię na miejscu przy użyciu plotera VersaBlade X Pro z dokładnością do 0,1 mm. Montaż trwa ok. 5 minut. Baza ponad 10 000 modeli telefonów i tabletów. Folie posiadają certyfikaty PZH i RoHS.
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {["⚡ Montaż ~5 min", "📐 Precyzja 0,1 mm", "📱 10 000+ modeli", "✅ PZH · RoHS"].map((tag) => (
                          <span key={tag} className="rounded-zgl-pill border border-zgl-border2 bg-white/5 px-2.5 py-1 text-[10.5px] font-semibold text-zgl-ink2">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <label className="chi flex cursor-pointer items-start gap-3 rounded-[13px] border border-zgl-faint bg-zgl-dark2 p-3.5 transition-all hover:border-zgl-border2 hover:bg-zgl-card2">
                      <span className={`mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border-2 ${wantsAccessories ? "border-zgl-red bg-zgl-red" : "border-zgl-faint bg-transparent"}`}>
                        {wantsAccessories && (
                          <span className="text-white [&>svg]:h-3 [&>svg]:w-3">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          </span>
                        )}
                      </span>
                      <input type="checkbox" className="sr-only" checked={wantsAccessories} onChange={(e) => setWantsAccessories(e.target.checked)} />
                      <div>
                        <p className="text-[13.5px] font-bold text-zgl-white">Dobierz mi akcesoria przy odbiorze</p>
                        <p className="mt-0.5 text-[11.5px] text-zgl-muted">Kabel, ładowarka GaN, etui, powerbank — doradzimy co pasuje do Twojego urządzenia i trybu życia</p>
                      </div>
                    </label>
                    <div>
                      <label className="flabel mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zgl-ink2">
                        Dodatkowe uwagi <span className="font-normal italic lowercase not-italic text-zgl-muted">(opcjonalnie)</span>
                      </label>
                      <textarea className="fta fi min-h-[80px] w-full resize-y rounded-zgl-field border border-zgl-faint bg-zgl-dark2 px-3.5 py-3 text-[14px] text-zgl-white placeholder:text-zgl-muted focus:border-zgl-red focus:bg-zgl-card2 focus:outline-none focus:shadow-[0_0_0_3px_rgba(224,32,32,.14)]" placeholder="Cokolwiek chcesz nam przekazać — np. hasło ekranu blokady, specyficzne zachowanie urządzenia..." value={notes} onChange={(e) => setNotes(e.target.value)} style={{ caretColor: "#e02020" }} />
                    </div>
                  </div>
                  <div className="card-ft flex justify-between border-t border-zgl-border bg-black/15 px-6 py-4 md:px-7">
                    <button type="button" onClick={() => goBack(4)} className="btn-back inline-flex items-center gap-2 text-[13px] font-semibold text-zgl-muted hover:text-zgl-ink">
                      <IconChevronLeft /> Wstecz
                    </button>
                    <button type="button" onClick={() => goNext(4)} className="btn-next inline-flex items-center gap-2 rounded-zgl-field border-none bg-zgl-red px-6 py-3 text-[13.5px] font-bold text-white shadow-[0_4px_20px_rgba(224,32,32,.35)] transition-all hover:bg-zgl-red-h hover:shadow-[0_8px_28px_rgba(224,32,32,.5)] active:translate-y-0 hover:-translate-y-px">
                      Dalej <IconChevronRight />
                    </button>
                  </div>
                </div>

                {/* Step 5 — Podsumowanie */}
                <div className={currentStep !== 5 ? "hidden" : "animate-step-in"}>
                  <div className="card-hd flex items-center gap-[14px] border-b border-zgl-border px-6 py-5 pt-6 md:px-7">
                    <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] border border-zgl-red-border bg-zgl-red-l text-zgl-red">
                      <IconCheck />
                    </div>
                    <h3 className="font-unbounded text-[15px] font-black tracking-[-0.03em] text-zgl-white">Podsumowanie zgłoszenia</h3>
                  </div>
                  <div className="card-body px-6 py-6 md:px-7">
                    <div className="space-y-0">
                      {[
                        { key: "Kontakt", val: [fname, lname].filter(Boolean).join(" ") ? `${[fname, lname].filter(Boolean).join(" ")} · ${email || "—"} · ${phone || "—"}` : "—" },
                        { key: "Urządzenie", val: category && model ? `${category} — ${model}` : "—" },
                        { key: "Problem", val: problem.trim() || "—" },
                        { key: "IMEI", val: imei.trim() || "—" },
                        { key: "Dostawa", val: delivery === "osobiscie" ? "Osobiście w serwisie" : "Wysyłka kurierska" },
                        { key: "Odbiór", val: pickup === "osobiscie" ? "Odbiór osobisty" : "Kurier do domu" },
                        { key: "Hammer Glass", val: hammer === "tak" ? "Tak — interesuje mnie folia" : hammer === "nie" ? "Nie" : "—" },
                        { key: "Akcesoria", val: wantsAccessories ? "Proszę doradzić przy odbiorze" : "—" },
                        { key: "Uwagi", val: notes.trim() || "—" },
                      ].map((row) => (
                        <div key={row.key} className="flex flex-wrap gap-4 border-b border-zgl-border py-3 first:pt-0">
                          <span className="min-w-[90px] text-[10px] font-bold uppercase tracking-[0.12em] text-zgl-muted">{row.key}</span>
                          <span className="text-[13.5px] font-medium text-zgl-white">{row.val}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 rounded-[11px] border border-zgl-red/20 bg-zgl-red/5 p-4 text-[12px] text-zgl-ink2">
                      📋 Sprawdź dane przed wysłaniem. Po wysłaniu skontaktujemy się z Tobą w celu potwierdzenia zlecenia lub po przeprowadzonej bezpłatnej diagnozie urządzenia.
                    </div>
                  </div>
                  <div className="card-ft flex justify-between border-t border-zgl-border bg-black/15 px-6 py-4 md:px-7">
                    <button type="button" onClick={() => goBack(5)} className="btn-back inline-flex items-center gap-2 text-[13px] font-semibold text-zgl-muted hover:text-zgl-ink">
                      <IconChevronLeft /> Wstecz
                    </button>
                    <button type="button" onClick={handleSubmit} className="btn-submit inline-flex items-center gap-2 rounded-zgl-field border-none bg-zgl-red px-6 py-3 text-[13.5px] font-bold text-white shadow-[0_4px_20px_rgba(224,32,32,.35)] transition-all hover:bg-zgl-red-h hover:shadow-[0_8px_28px_rgba(224,32,32,.5)] active:translate-y-0 hover:-translate-y-px">
                      Wyślij zgłoszenie <IconSend />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <aside className="hidden border-l border-zgl-border zgl:block">
          <div className="sticky top-[58px] zgl-scrollbar-hide h-[calc(100vh-58px)] overflow-y-auto bg-zgl-dark px-5 py-6">
            {/* Podgląd zgłoszenia */}
            <div className="sb-hd mb-4 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-zgl-red shadow-[0_0_6px_rgba(224,32,32,.5)]" />
              <span className="text-[9.5px] font-bold uppercase tracking-[0.15em] text-zgl-muted">Podgląd zgłoszenia</span>
            </div>
            <div className="space-y-3 text-[12.5px]">
              <div>
                <p className="text-[9.5px] font-bold uppercase tracking-widest text-zgl-muted">Kontakt</p>
                <p className={contactPreview ? "text-zgl-ink" : "italic text-zgl-muted"}>{contactPreview || "Nie wypełniono"}</p>
              </div>
              <div>
                <p className="text-[9.5px] font-bold uppercase tracking-widest text-zgl-muted">Urządzenie</p>
                <p className={devicePreview ? "text-zgl-ink" : "italic text-zgl-muted"}>{devicePreview || "Nie wybrano"}</p>
              </div>
              <div>
                <p className="text-[9.5px] font-bold uppercase tracking-widest text-zgl-muted">Problem</p>
                <p className={problemPreview ? "text-zgl-ink" : "italic text-zgl-muted"}>{problemPreview || "Nie opisano"}</p>
              </div>
            </div>

            {/* Jak sprawdzić model */}
            <div ref={sidebarHowtoRef} className={`mt-8 rounded-xl border transition-shadow duration-300 ${howtoHighlight ? "border-zgl-red shadow-[0_0_0_2px_var(--tw-shadow-color),0_0_24px_rgba(224,32,32,.3)]" : "border-zgl-border"}`} style={howtoHighlight ? { boxShadow: "0 0 0 2px #e02020, 0 0 24px rgba(224,32,32,.3)" } : undefined}>
              <div className="sb-hd border-b border-zgl-border px-4 py-3">
                <span className="text-[9.5px] font-bold uppercase tracking-[0.15em] text-zgl-muted">Jak sprawdzić model telefonu?</span>
              </div>
              <div className="flex border-b border-zgl-border">
                <button type="button" onClick={() => setHowtoTab("ios")} className={`flex-1 px-4 py-2.5 text-[12px] font-semibold transition-colors ${howtoTab === "ios" ? "border-b-2 border-zgl-red text-zgl-white" : "text-zgl-muted"}`}>
                  <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-black">iOS</span>
                </button>
                <button type="button" onClick={() => setHowtoTab("android")} className={`flex-1 px-4 py-2.5 text-[12px] font-semibold transition-colors ${howtoTab === "android" ? "border-b-2 border-zgl-red text-zgl-white" : "text-zgl-muted"}`}>
                  <span className="rounded bg-[#3ddc84] px-1.5 py-0.5 text-[10px] font-bold text-black">Android</span>
                </button>
              </div>
              <div className="space-y-3 p-4">
                {howtoTab === "ios" ? (
                  <>
                    {["Otwórz **Ustawienia** — szara ikona z kołem zębatym na ekranie głównym", "Przewiń w dół i tap w **Ogólne**", "Tap w **Informacje** — pierwsza pozycja na liście", "Znajdź pole **Nazwa modelu** — np. iPhone 15 Pro Max", "Możesz też sprawdzić tył obudowy — model wygrawerowany jest drobną czcionką pod logo Apple"].map((t, i) => (
                      <div key={i} className="flex gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zgl-red-border bg-zgl-red-l text-[9.5px] font-bold text-zgl-red">{i + 1}</span>
                        <p className="text-[12px] leading-[1.65] text-zgl-ink2" dangerouslySetInnerHTML={{ __html: t.replace(/\*\*(.*?)\*\*/g, "<strong class='text-zgl-ink'>$1</strong>") }} />
                      </div>
                    ))}
                    <div className="mt-3 rounded-lg border border-zgl-red-border bg-zgl-red/10 p-3">
                      <p className="font-mono text-sm font-bold text-zgl-red">*#06#</p>
                      <p className="mt-1 text-[11px] text-zgl-ink2"><strong className="text-zgl-ink">Szybszy sposób:</strong> zadzwoń pod ten numer — natychmiast wyświetli się IMEI i pełna nazwa modelu urządzenia.</p>
                    </div>
                  </>
                ) : (
                  <>
                    {["Otwórz **Ustawienia** — ikona koła zębatego", "Przewiń do końca listy i tap w **Informacje o telefonie** lub **O urządzeniu**", "Znajdź pole **Model** lub **Numer modelu** — np. Samsung Galaxy S24 Ultra", "**Samsung:** Ustawienia → **O telefonie** → **Informacje o oprogramowaniu**", "**Xiaomi / MIUI:** Ustawienia → **Mój telefon** — model widoczny od razu na górze"].map((t, i) => (
                      <div key={i} className="flex gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zgl-red-border bg-zgl-red-l text-[9.5px] font-bold text-zgl-red">{i + 1}</span>
                        <p className="text-[12px] leading-[1.65] text-zgl-ink2" dangerouslySetInnerHTML={{ __html: t.replace(/\*\*(.*?)\*\*/g, "<strong class='text-zgl-ink'>$1</strong>") }} />
                      </div>
                    ))}
                    <div className="mt-3 rounded-lg border border-zgl-red-border bg-zgl-red/10 p-3">
                      <p className="font-mono text-sm font-bold text-zgl-red">*#06#</p>
                      <p className="mt-1 text-[11px] text-zgl-ink2"><strong className="text-zgl-ink">Działa na każdym Androidzie:</strong> zadzwoń pod ten numer — wyświetli się IMEI i model. Działa też na tabletach.</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Masz pytanie? */}
            <div className="sb-hd mt-8">
              <span className="text-[9.5px] font-bold uppercase tracking-[0.15em] text-zgl-muted">Masz pytanie?</span>
            </div>
            <div className="mt-3 space-y-0 border-t border-zgl-border">
              <a href="tel:883200151" className="flex items-center gap-3 border-b border-zgl-border py-2 text-[12px] text-zgl-ink2 transition-colors hover:text-zgl-white">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zgl-border2 bg-zgl-card2 text-[15px]">📞</span>
                883 200 151
              </a>
              <a href="mailto:sklep@pro-kom.eu" className="flex items-center gap-3 border-b border-zgl-border py-2 text-[12px] text-zgl-ink2 transition-colors hover:text-zgl-white">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zgl-border2 bg-zgl-card2 text-[15px]">✉️</span>
                sklep@pro-kom.eu
              </a>
              <div className="flex items-center gap-3 py-2 text-[12px] text-zgl-ink2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zgl-border2 bg-zgl-card2 text-[15px]">🕐</span>
                Pon–Pt 9:00–17:00 / Sobota 9:00–14:00
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
