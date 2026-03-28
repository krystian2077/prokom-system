"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Unbounded, Plus_Jakarta_Sans } from "next/font/google";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";

const unbounded = Unbounded({ weight: ["700", "900"], subsets: ["latin"], variable: "--font-unbounded" });
const jakarta = Plus_Jakarta_Sans({ weight: ["400", "500", "600", "700"], subsets: ["latin"], style: ["normal", "italic"], variable: "--font-plus-jakarta" });

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
function IconCheckLarge() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
function IconPersonHeader() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconPhoneHeader() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}
function IconTruckHeader() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}
function IconPackageHeader() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
function IconCheckHeader() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function ZgloszeniePage() {
  const { token, user: authUser, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const formCardRef = useRef<HTMLDivElement>(null);
  const sidebarHowtoRef = useRef<HTMLDivElement>(null);
  const [howtoHighlight, setHowtoHighlight] = useState(false);
  const [goingBack, setGoingBack] = useState(false);
  const prefillDoneRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [currentStep, setCurrentStep] = useState(1);
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pref, setPref] = useState<"email" | "telefon" | "sms">("email");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");

  // Prefill z konta zalogowanego (user z AuthContext)
  useEffect(() => {
    if (authLoading || !authUser || authUser.role !== "client" || prefillDoneRef.current) return;
    setFname(authUser.first_name ?? "");
    setLname(authUser.last_name ?? "");
    setEmail(authUser.email ?? "");
    setPhone(authUser.phone ?? "");
    prefillDoneRef.current = true;
  }, [authUser, authLoading]);

  // Pełny profil z /clients/me/ (adres, preferowany kontakt)
  useEffect(() => {
    if (!token || authLoading) return;
    let cancelled = false;
    (async () => {
      try {
        const profile = await api.get<{
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          street?: string;
          city?: string;
          postal_code?: string;
          country?: string;
          preferred_contact?: string;
        }>("/clients/me/", token);
        if (cancelled || !profile) return;
        setFname((p) => profile.first_name ?? p);
        setLname((p) => profile.last_name ?? p);
        setEmail((p) => profile.email ?? p);
        setPhone((p) => profile.phone ?? p);
        setStreet((p) => profile.street ?? p);
        setCity((p) => profile.city ?? p);
        setZip((p) => profile.postal_code ?? p);
        if (profile.preferred_contact === "phone" || profile.preferred_contact === "telefon") setPref("telefon");
        else if (profile.preferred_contact === "sms") setPref("sms");
      } catch {
        // Dane z authUser już uzupełnione w pierwszym efekcie
      }
    })();
    return () => { cancelled = true; };
  }, [token, authLoading]);
  const [category, setCategory] = useState("");
  const [model, setModel] = useState("");
  const [problem, setProblem] = useState("");
  const [imei, setImei] = useState("");
  const [delivery, setDelivery] = useState<"osobiscie" | "kurier">("osobiscie");
  const [pickup, setPickup] = useState<"osobiscie" | "kurier">("osobiscie");
  const [hammer, setHammer] = useState("");
  const [wantsAccessories, setWantsAccessories] = useState(false);
  const [accessoryWishlist, setAccessoryWishlist] = useState("");
  const [notes, setNotes] = useState("");
  const [deviceTurnsOn, setDeviceTurnsOn] = useState<"" | "tak" | "nie">("");
  const [visualCondition, setVisualCondition] = useState("");
  const [howtoTab, setHowtoTab] = useState<"ios" | "android">("ios");
  const [howtoModalOpen, setHowtoModalOpen] = useState(false);
  const [refNumber, setRefNumber] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deliveryAddressConfirmed, setDeliveryAddressConfirmed] = useState(false);

  const barWidth = submitted ? "100%" : BAR_WIDTHS[currentStep - 1];

  const SERVICE_ADDRESS = {
    name: "PRO-KOM Tadeusz Wójciak",
    street: "ul. Orkana 16B",
    city: "34-700 Rabka-Zdrój",
    hours: "pon.–pt. 9:00–17:00, sob. 9:00–14:00",
    phone: "883 200 151",
    email: "serwisprokomrabka@gmail.com",
  };

  const isPhoneOrTablet = category === "Telefon" || category === "Tablet";

  const categoryToApi: Record<string, string> = {
    Telefon: "phone",
    Laptop: "laptop",
    Tablet: "tablet",
    Komputer: "desktop",
    Drukarka: "printer",
    Konsola: "console",
    Inne: "other",
  };

  useEffect(() => {
    if (!isPhoneOrTablet) setHammer("");
  }, [isPhoneOrTablet]);

  const accessorySuggestionsByCategory: Record<string, string> = {
    Laptop: "Zasilacz, Myszka, Torba, Zestaw do czyszczenia",
    Drukarka: "Toner, Tusz, Wlewki, Papier",
    Konsola: "brak",
    Inne: "brak",
    Komputer: "Sprężone powietrze, Zestaw do czyszczenia, Ipa",
    Telefon: "Kabel, ładowarka GaN, etui, powerbank — doradzimy przy odbiorze",
    Tablet: "Kabel, ładowarka GaN, etui, powerbank — doradzimy przy odbiorze",
  };
  const accessorySuggestionText = category ? (accessorySuggestionsByCategory[category] ?? "brak") : "";

  const goNext = (from: number) => {
    setGoingBack(false);
    if (from < 5) setCurrentStep(from + 1);
  };
  const goBack = (from: number) => {
    setGoingBack(true);
    if (from > 1) setCurrentStep(from - 1);
  };

  useEffect(() => {
    const el = document.getElementById("formCard");
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, [currentStep, submitted]);

  const openHowto = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setHowtoModalOpen(true);
      return;
    }
    sidebarHowtoRef.current?.scrollIntoView({ behavior: "smooth" });
    setHowtoHighlight(true);
    setTimeout(() => setHowtoHighlight(false), 2000);
  };

  useEffect(() => {
    if (!howtoModalOpen) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHowtoModalOpen(false);
    };
    document.addEventListener("keydown", onEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [howtoModalOpen]);

  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitLoading(true);
    const authToken = token ?? getStoredToken();
    const preferredContact = pref === "telefon" ? "phone" : pref === "sms" ? "sms" : "email";
    const deliveryMethod = delivery === "kurier" ? "courier" : "in_person";
    const returnMethod = pickup === "kurier" ? "courier" : "in_person";
    const apiCategory = categoryToApi[category] || "other";
    const payload = {
      client: {
        first_name: fname.trim(),
        last_name: lname.trim(),
        email: email.trim(),
        phone: phone.trim(),
        preferred_contact: preferredContact,
        street: [street, houseNumber].filter(Boolean).join(" ").trim(),
        city: city.trim(),
        postal_code: zip.trim(),
        country: "Polska",
      },
      device: {
        category: apiCategory,
        model_name: model.trim(),
        problem_description: (problem.trim() || "—").slice(0, 2000),
        serial_number: "",
        imei: imei.trim(),
        device_turns_on: deviceTurnsOn === "tak" ? true : deviceTurnsOn === "nie" ? false : null,
        visual_condition_description: visualCondition.trim().slice(0, 2000),
      },
      delivery_method: deliveryMethod,
      return_method: returnMethod,
      delivery_street: (delivery === "kurier" || pickup === "kurier") ? street.trim() : "",
      delivery_house_number: (delivery === "kurier" || pickup === "kurier") ? houseNumber.trim() : "",
      delivery_city: (delivery === "kurier" || pickup === "kurier") ? city.trim() : "",
      delivery_postal_code: (delivery === "kurier" || pickup === "kurier") ? zip.trim() : "",
      delivery_country: "Polska",
      hammer_glass_interest: hammer === "tak" ? "yes" : hammer === "nie" ? "no" : null,
      accessory_interest: [],
      accessory_choose_for_me: wantsAccessories || (accessoryWishlist.trim() !== ""),
      accessory_wishlist: accessoryWishlist.trim(),
      additional_notes: notes.trim().slice(0, 2000),
    };
    try {
      const res = await api.post<{ repair_number: string; message?: string }>(
        "/repairs/submit/",
        payload,
        authToken ?? undefined
      );
      setRefNumber(res.repair_number);
      setSubmitted(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Wystąpił błąd. Spróbuj ponownie.";
      setSubmitError(msg.length > 300 ? `${msg.slice(0, 300)}…` : msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const contactPreview = [fname.trim(), lname.trim()].filter(Boolean).length ? `${fname.trim()} ${lname.trim()} · ${email.trim() || "—"}` : null;
  const devicePreview = category && model ? `${category} — ${model}` : category || null;
  const problemPreview = problem.trim().length === 0 ? "" : problem.trim().slice(0, 58) + (problem.trim().length > 58 ? "…" : "");

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

  const stepLabels: Record<number, string> = {
    1: "Dalej — Urządzenie",
    2: "Dalej — Dostawa",
    3: "Dalej — Dodatki",
    4: "Dalej — Podsumowanie",
  };

  const inputBase =
    "w-full rounded-xl border border-zglf-border bg-zglf-field px-3.5 py-3 text-[14.5px] text-zglf-text placeholder:text-zglf-muted caret-zglf-red transition-all hover:border-zglf-border2 hover:bg-zglf-white focus:border-zglf-red focus:bg-zglf-white focus:outline-none focus:shadow-[0_0_0_4px_rgba(220,30,30,.08)] focus:-translate-y-px";
  const labelBase = "flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-zglf-text2";
  const labelRequired = "h-[5px] w-[5px] shrink-0 rounded-full bg-zglf-red";

  return (
    <div className={`zgloszenie-page min-h-screen ${unbounded.variable} ${jakarta.variable}`} style={{ fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif", color: "var(--ink)" }}>
      <div
        className="relative z-10 mx-auto grid min-h-screen max-w-[1340px] grid-cols-1 gap-7 px-6 pb-[60px] pt-10 lg:grid-cols-[1fr_340px] lg:items-start lg:gap-7 lg:px-7 max-[1000px]:px-5 max-[480px]:px-4 max-[480px]:pt-6 max-[480px]:pb-12"
        style={{ alignContent: "start" }}
      >
        {/* MAIN COLUMN */}
        <div className="min-w-0 max-[1000px]:max-w-full lg:col-start-1 lg:row-start-1">
          <div className="main-inner w-full">
            {/* Page heading */}
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--muted)", animation: "zgl-eyebrowIn .5s ease both" }}>
              <span className="h-0.5 w-5 shrink-0 rounded-full" style={{ background: "linear-gradient(90deg, #dc1e1e, transparent)" }} />
              FORMULARZ ZGŁOSZENIA NAPRAWY
            </p>
            <h1 className="mt-7 font-bold leading-[1.12] tracking-[-0.02em] max-[480px]:mt-6 max-[480px]:text-[24px] sm:text-[clamp(26px,3.4vw,44px)]" style={{ fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif", color: "var(--white)", animation: "zgl-fadeUp .55s .06s ease both" }}>
              Zgłoś naprawę <span style={{ color: "var(--red)" }}>online.</span>
            </h1>
            <p className="mt-6 max-w-[540px] pb-4 text-[14px] leading-[1.75] max-[480px]:mt-5 max-[480px]:pb-3" style={{ color: "var(--ink2)", animation: "zgl-fadeUp .55s .12s ease both" }}>
              Wypełnij formularz w 5 krokach...
            </p>

            {/* Zachęta do konta — tylko gdy niezalogowany */}
            {!token && (
              <div
                className="mb-8 mt-6 flex flex-col gap-4 rounded-xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:px-6 sm:py-4"
                style={{
                  borderColor: "rgba(220,30,30,.25)",
                  background: "rgba(220,30,30,.06)",
                  boxShadow: "0 0 0 1px rgba(220,30,30,.08)",
                  animation: "zgl-fadeUp .55s .14s ease both",
                }}
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--red)" }}>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: "var(--red)" }}>
                      <IconUser />
                    </span>
                    Załóż konto
                  </p>
                  <p className="mt-2 text-[13px] leading-[1.55]" style={{ color: "var(--ink2)" }}>
                    Przed złożeniem zgłoszenia załóż konto w panelu klienta — będziesz miał <strong style={{ color: "var(--ink)" }}>podgląd na przebieg naprawy</strong>, dostęp do wycen, historię zleceń, szybszy kontakt z serwisem i lepszą komunikację. Wszystko w jednym miejscu.
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  <Link
                    href="/client/login?returnUrl=%2Fzgloszenie"
                    className="inline-flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-[13px] font-bold text-white transition-all hover:-translate-y-0.5"
                    style={{
                      borderColor: "var(--red)",
                      background: "linear-gradient(135deg, #dc1e1e 0%, #b81818 100%)",
                      boxShadow: "0 3px 14px rgba(220,30,30,.35)",
                    }}
                  >
                    Zaloguj się
                  </Link>
                  <Link
                    href="/client/rejestracja?returnUrl=%2Fzgloszenie"
                    className="inline-flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-[13px] font-bold transition-all hover:-translate-y-0.5"
                    style={{
                      borderColor: "rgba(255,255,255,.25)",
                      background: "transparent",
                      color: "var(--white)",
                    }}
                  >
                    Zarejestruj się
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: ten sam wiersz co stepper — góra wyspy = góra paska postępu */}
        <aside
          className="zgl-scrollbar-hide hidden w-full min-w-0 lg:col-start-2 lg:row-start-2 lg:mt-8 lg:block lg:self-start"
          style={{ position: "sticky", top: 36, height: "calc(100vh - 60px)", overflowY: "auto" }}
        >
          <div id="sbIsland" className={`sb-island ${howtoHighlight ? "hl" : ""}`} ref={sidebarHowtoRef} style={howtoHighlight ? { boxShadow: "0 0 0 2px #dc1e1e, 0 0 30px rgba(220,30,30,.25), 0 8px 32px rgba(0,0,0,.5)", transition: "box-shadow .3s" } : undefined}>
            <div className="sb-hd flex items-center gap-2 border-b" style={{ padding: "13px 18px", borderColor: "rgba(255,255,255,.07)", background: "rgba(255,255,255,.02)", fontSize: "9.5px", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--muted)" }}>
              <span className="rounded-full" style={{ width: 5, height: 5, background: "var(--red)", boxShadow: "0 0 8px rgba(220,30,30,.3)", animation: "zgl-ringPulse 2s infinite" }} />
              Podgląd zgłoszenia
            </div>
            <div className="sb-bd" style={{ padding: "15px 18px" }}>
              <div className="space-y-3 text-[12.5px]" style={{ color: "var(--ink)" }}>
                <div
                  className="flex min-w-0 flex-col rounded-[10px] border p-3"
                  style={{ borderColor: "rgba(255,255,255,.08)", background: "linear-gradient(165deg, rgba(255,255,255,.04) 0%, rgba(255,255,255,.015) 100%)" }}
                >
                  <p className="mb-1.5 text-[9.5px] font-bold uppercase tracking-widest" style={{ color: "#4e5669" }}>
                    Kontakt
                  </p>
                  <p
                    className={`min-w-0 text-[12px] leading-snug break-words ${contactPreview ? "animate-fade-in" : "italic"}`}
                    style={{ color: contactPreview ? "#c8cbd4" : "#4e5669" }}
                  >
                    {contactPreview || "Nie wypełniono"}
                  </p>
                </div>
                <div
                  className="flex min-w-0 flex-col rounded-[10px] border p-3"
                  style={{ borderColor: "rgba(255,255,255,.08)", background: "linear-gradient(165deg, rgba(255,255,255,.04) 0%, rgba(255,255,255,.015) 100%)" }}
                >
                  <p className="mb-1.5 text-[9.5px] font-bold uppercase tracking-widest" style={{ color: "#4e5669" }}>
                    Urządzenie
                  </p>
                  <p
                    className={`min-w-0 text-[12px] leading-snug break-words ${devicePreview ? "animate-fade-in" : "italic"}`}
                    style={{ color: devicePreview ? "#c8cbd4" : "#4e5669" }}
                  >
                    {devicePreview || "Nie wybrano"}
                  </p>
                </div>
                <div
                  className="flex min-w-0 flex-col rounded-[10px] border p-3"
                  style={{ borderColor: "rgba(255,255,255,.08)", background: "linear-gradient(165deg, rgba(255,255,255,.035) 0%, rgba(255,255,255,.012) 100%)" }}
                >
                  <p className="mb-1.5 text-[9.5px] font-bold uppercase tracking-widest" style={{ color: "#4e5669" }}>
                    Problem
                  </p>
                  <p
                    className={`min-w-0 text-[12px] leading-relaxed break-words ${problemPreview ? "animate-fade-in" : "italic"}`}
                    style={{ color: problemPreview ? "var(--ink)" : "var(--muted)" }}
                  >
                    {problemPreview || "Nie opisano"}
                  </p>
                </div>
              </div>

            <div
              className={`mt-8 rounded-xl border transition-shadow duration-300 ${howtoHighlight ? "shadow-[0_0_0_2px_#dc1e1e,0_0_24px_rgba(220,30,30,.25)]" : ""}`}
              style={{ borderColor: "rgba(255,255,255,.06)" }}
            >
              <div className="border-b px-4 py-3 -mx-[18px] mb-4" style={{ borderColor: "rgba(255,255,255,.06)" }}>
                <span className="text-[9.5px] font-bold uppercase tracking-[0.15em]" style={{ color: "#c8cbd4" }}>Jak sprawdzić model telefonu?</span>
              </div>
              <div className="flex border-b -mx-[18px]" style={{ borderColor: "rgba(255,255,255,.06)" }}>
                <button type="button" onClick={() => setHowtoTab("ios")} className={`flex-1 px-4 py-2.5 text-[12px] font-semibold transition-colors mb-[-1px] ${howtoTab === "ios" ? "border-b-2 border-[#dc1e1e] text-white" : ""}`} style={{ color: howtoTab === "ios" ? "#fff" : "#4e5669" }}>
                  <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-black">iOS</span>
                </button>
                <button type="button" onClick={() => setHowtoTab("android")} className={`flex-1 px-4 py-2.5 text-[12px] font-semibold transition-colors mb-[-1px] ${howtoTab === "android" ? "border-b-2 border-[#dc1e1e] text-white" : ""}`} style={{ color: howtoTab === "android" ? "#fff" : "#4e5669" }}>
                  <span className="rounded bg-[#3ddc84] px-1.5 py-0.5 text-[10px] font-bold text-black">Android</span>
                </button>
              </div>
              <div className="space-y-3 p-4" style={{ color: "#8a93a2" }}>
                {howtoTab === "ios" ? (
                  <>
                    {["Otwórz **Ustawienia** — szara ikona z kołem zębatym na ekranie głównym", "Przewiń w dół i tap w **Ogólne**", "Tap w **Informacje** — pierwsza pozycja na liście", "Znajdź pole **Nazwa modelu** — np. iPhone 15 Pro Max", "Możesz też sprawdzić tył obudowy — model wygrawerowany pod logo Apple drobną czcionką"].map((t, i) => (
                      <div key={i} className="flex gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zglf-red-border bg-zglf-red-l/80 text-[9.5px] font-bold text-zglf-red">{i + 1}</span>
                        <p className="text-[12px] leading-[1.65]" style={{ color: "#8a93a2" }} dangerouslySetInnerHTML={{ __html: t.replace(/\*\*(.*?)\*\*/g, "<strong style='color:#c8cbd4'>$1</strong>") }} />
                      </div>
                    ))}
                    <div className="mt-3 rounded-[11px] border p-3" style={{ background: "#1a1d26", borderColor: "rgba(255,255,255,.1)" }}>
                      <p className="font-mono text-[15px] font-bold tracking-[0.06em]" style={{ color: "#dc1e1e", background: "rgba(220,30,30,.12)", border: "1px solid rgba(220,30,30,.25)", borderRadius: "7px", boxShadow: "0 0 8px rgba(220,30,30,.2)", padding: "6px 10px" }}>
                        *#06#
                      </p>
                      <p className="mt-2 text-[11px]" style={{ color: "#8a93a2" }}><strong style={{ color: "#c8cbd4" }}>Szybszy sposób:</strong> zadzwoń pod ten numer — natychmiast wyświetli się IMEI i pełna nazwa modelu.</p>
                    </div>
                  </>
                ) : (
                  <>
                    {["Otwórz **Ustawienia** — ikona koła zębatego", "Przewiń do końca listy, tap w **Informacje o telefonie** lub **O urządzeniu**", "Znajdź pole **Model** lub **Numer modelu** — np. Samsung Galaxy S24 Ultra", "**Samsung:** Ustawienia → **O telefonie** → **Informacje o oprogramowaniu**", "**Xiaomi / MIUI:** Ustawienia → **Mój telefon** — model widoczny na górze ekranu"].map((t, i) => (
                      <div key={i} className="flex gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zglf-red-border bg-zglf-red-l/80 text-[9.5px] font-bold text-zglf-red">{i + 1}</span>
                        <p className="text-[12px] leading-[1.65]" style={{ color: "#8a93a2" }} dangerouslySetInnerHTML={{ __html: t.replace(/\*\*(.*?)\*\*/g, "<strong style='color:#c8cbd4'>$1</strong>") }} />
                      </div>
                    ))}
                    <div className="mt-3 rounded-[11px] border p-3" style={{ background: "#1a1d26", borderColor: "rgba(255,255,255,.1)" }}>
                      <p className="font-mono text-[15px] font-bold tracking-[0.06em]" style={{ color: "#dc1e1e", background: "rgba(220,30,30,.12)", border: "1px solid rgba(220,30,30,.25)", borderRadius: "7px", boxShadow: "0 0 8px rgba(220,30,30,.2)", padding: "6px 10px" }}>
                        *#06#
                      </p>
                      <p className="mt-2 text-[11px]" style={{ color: "#8a93a2" }}><strong style={{ color: "#c8cbd4" }}>Działa na każdym Androidzie:</strong> zadzwoń pod ten numer — wyświetli IMEI i model. Działa też na tabletach.</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          </div>
        </aside>

        <div className="min-w-0 max-[1000px]:max-w-full lg:col-start-1 lg:row-start-2">
          <div className="main-inner w-full">
            {/* Stepper */}
            <div className="mt-8 max-[480px]:mt-6" style={{ animation: "zgl-fadeUp .55s .18s ease both" }}>
              <div className="relative mb-6 h-[3px] w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,.07)" }}>
                <div
                  className="relative h-full rounded-full transition-[width] duration-[.6s] ease-[cubic-bezier(.4,0,.2,1)]"
                  style={{
                    width: barWidth,
                    background: "linear-gradient(90deg, #b81818, #dc1e1e, #ff4848)",
                    boxShadow: "0 0 14px rgba(220,30,30,.6)",
                  }}
                >
                  <span className="absolute right-0 top-0 h-full w-7 bg-gradient-to-l from-white/30 to-transparent" aria-hidden />
                </div>
              </div>
              <div className="step-nodes relative flex justify-between">
                <span className="absolute left-[21px] right-[21px] top-5 z-0 h-px" style={{ background: "rgba(255,255,255,.07)" }} />
                {STEPS.map((s, i) => {
                  const state = nodeState(i + 1);
                  return (
                    <div key={s.id} className="relative z-10 flex flex-1 flex-col items-center gap-2">
                      <div
                        className={`relative flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full max-[480px]:h-9 max-[480px]:w-9 sm:h-[42px] sm:w-[42px] ${
                          state === "done"
                            ? "border-[var(--red)] bg-[var(--red)] text-white"
                            : state === "active"
                              ? "animate-[zgl-ringPulse_2.5s_1s_ease_infinite] border-[var(--red)] text-[var(--red)]"
                              : "border-[#2c3145] bg-[#141720] text-[var(--muted)]"
                        }`}
                        style={{
                          borderWidth: 1.5,
                          ...(state === "done" ? { boxShadow: "0 2px 12px rgba(220,30,30,.4)" } : {}),
                          ...(state === "active" ? { background: "rgba(220,30,30,.12)", borderColor: "#dc1e1e", boxShadow: "0 0 0 5px rgba(220,30,30,.12), 0 0 20px rgba(220,30,30,.2)" } : {}),
                        }}
                      >
                        {state === "done" ? <IconCheck /> : stepIcon(i + 1)}
                        {state === "active" && (
                          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-extrabold text-white" style={{ background: "var(--red)", border: "2px solid var(--island)" }}>
                            {i + 1}
                          </span>
                        )}
                      </div>
                      <span
                        className="text-[10px] font-semibold"
                        style={{
                          color: state === "active" ? "var(--red)" : state === "default" ? "var(--muted)" : "var(--ink)",
                          fontWeight: state === "active" ? 700 : undefined,
                        }}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form island */}
            <div id="formCard" ref={formCardRef} className="form-island relative mt-8">
              {submitted ? (
                <div className="px-8 py-14 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-zglf-red-border bg-gradient-to-br from-zglf-red-l to-zglf-red-l/60 text-zglf-red shadow-[0_0_0_10px_rgba(220,30,30,.05),0_8px_28px_rgba(220,30,30,.15)] animate-success-bounce">
                    <IconCheckLarge />
                  </div>
                  <h2 className="mt-6 font-unbounded text-[22px] font-black tracking-[-0.04em] text-white animate-fade-up" style={{ fontFamily: "var(--font-unbounded)", animationDelay: "0.15s" }}>
                    Zgłoszenie wysłane!
                  </h2>
                  <p className="mx-auto mt-3 max-w-[360px] text-[15px] leading-[1.6] text-white/90 animate-fade-up" style={{ animationDelay: "0.25s" }}>
                    Dziękujemy. Skontaktujemy się z Tobą w ciągu kilku godzin roboczych, by potwierdzić przyjęcie zlecenia i ustalić szczegóły.
                  </p>
                  <div className="mt-6 flex flex-col items-center gap-1.5 animate-fade-up" style={{ animationDelay: "0.35s" }}>
                    <span className="text-[13px] font-semibold text-white/90">Numer naprawy:</span>
                    <span className="text-[17px] font-extrabold text-zglf-red">{refNumber}</span>
                    <p className="mt-1 max-w-[320px] text-[12px] text-white/80">
                      Zapisz ten numer — jest ważny. Potwierdzenie z numerem naprawy wysłaliśmy także na Twój adres e-mail. Jeśli nie widzisz wiadomości, sprawdź folder spam / niechciane.
                    </p>
                  </div>
                  <div className="mt-8 flex flex-col items-center gap-3 animate-fade-up" style={{ animationDelay: "0.45s" }}>
                    {token && authUser?.role === "client" && (
                      <Link
                        href="/client/naprawy"
                        className="inline-flex items-center gap-2 rounded-xl border-2 border-[#dc1e1e] bg-[#dc1e1e] px-5 py-3.5 text-[14px] font-bold text-white shadow-[0_3px_14px_rgba(220,30,30,.4)] transition-all hover:bg-[#b81818] hover:border-[#b81818] hover:shadow-[0_4px_20px_rgba(220,30,30,.5)]"
                      >
                        Zobacz swoją naprawę w Panelu klienta
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                      </Link>
                    )}
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 text-[13px] font-bold text-zglf-muted transition-colors hover:text-zglf-text"
                    >
                      <IconChevronLeft />
                      Wróć do strony głównej
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {/* Step 1 */}
                  {currentStep === 1 && (
                    <div key="1" style={{ animation: goingBack ? "zgl-stepBwd .28s ease both" : "zgl-stepFwd .28s ease both" }}>
                      <div className="flex items-center gap-3.5 border-b px-7 py-5" style={{ background: "var(--island2)", borderColor: "rgba(255,255,255,.07)", padding: "22px 28px 18px" }}>
                        <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] text-[var(--red)]" style={{ background: "rgba(220,30,30,.1)", border: "1px solid rgba(220,30,30,.28)", boxShadow: "0 0 16px rgba(220,30,30,.12)" }}>
                          <IconPersonHeader />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-[15px] font-black tracking-[-0.03em] text-[var(--white)]" style={{ fontFamily: "var(--font-unbounded)" }}>Dane kontaktowe</h3>
                          <p className="mt-1 text-[12px]" style={{ color: "var(--muted)" }}>Podaj swoje dane — skontaktujemy się po diagnozie</p>
                        </div>
                        <span className="rounded-full px-2.5 py-1 text-[10px] font-extrabold text-[var(--red)]" style={{ background: "rgba(220,30,30,.1)", border: "1px solid rgba(220,30,30,.28)" }}>Krok 1 z 5</span>
                      </div>
                      <div className="space-y-4 px-7 py-6" style={{ background: "var(--island)", padding: "26px 28px" }}>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                          <div>
                            <label className="flabel mt-0">
                              <span className="flabel-req" /> Imię
                            </label>
                            <input type="text" className="fi mt-1.5" placeholder="Imię" value={fname} onChange={(e) => setFname(e.target.value)} />
                          </div>
                          <div>
                            <label className="flabel">
                              <span className="flabel-req" /> Nazwisko
                            </label>
                            <input type="text" className="fi mt-1.5" placeholder="Nazwisko" value={lname} onChange={(e) => setLname(e.target.value)} />
                          </div>
                          <div>
                            <label className="flabel">
                              <span className="flabel-req" /> E-mail
                            </label>
                            <input type="email" className="fi mt-1.5" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                          </div>
                          <div>
                            <label className="flabel">
                              <span className="flabel-req" /> Telefon
                            </label>
                            <input type="tel" className="fi mt-1.5" placeholder="np. 500 123 456" value={phone} onChange={(e) => setPhone(e.target.value)} />
                          </div>
                        </div>
                        <div>
                          <label className="flabel">Preferowany kontakt</label>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(["email", "telefon", "sms"] as const).map((p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setPref(p)}
                                className={`flex min-w-[120px] flex-1 items-center gap-[13px] rounded-[14px] border px-[15px] py-[13px] transition-all ${
                                  pref === p
                                    ? "-translate-y-px"
                                    : "hover:-translate-y-px"
                                }`}
                                style={
                                  pref === p
                                    ? { borderColor: "var(--red)", background: "rgba(220,30,30,.08)", boxShadow: "0 0 0 2px rgba(220,30,30,.25), 0 3px 12px rgba(220,30,30,.12)", color: "var(--white)" }
                                    : { borderColor: "var(--border)", background: "var(--island4)", color: "var(--ink)" }
                                }
                              >
                                <span
                                  className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2"
                                  style={pref === p ? { borderColor: "var(--red)", background: "var(--island)" } : { borderColor: "var(--border2)", background: "var(--island5)" }}
                                >
                                  {pref === p && <span className="h-2.5 w-2.5 rounded-full bg-[var(--red)]" style={{ animation: "zgl-dotBounce .35s ease" }} />}
                                </span>
                                <span className="text-[13.5px] font-bold" style={{ color: "inherit" }}>{p === "email" ? "✉️ E-mail" : p === "telefon" ? "📞 Telefon" : "💬 SMS"}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mt-[22px] mb-[18px] flex items-center gap-3">
                          <span className="h-px flex-1" style={{ background: "var(--border)" }} />
                          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>ADRES — WYMAGANY PRZY WYSYŁCE KURIERSKIEJ</span>
                          <span className="h-px flex-1" style={{ background: "var(--border)" }} />
                        </div>
                        <div>
                          <label className="flabel text-[var(--muted)] italic normal-case">
                            Ulica <span className="italic">(opcjonalnie)</span>
                          </label>
                          <input type="text" className="fi mt-1.5" placeholder="np. Mickiewicza" value={street} onChange={(e) => setStreet(e.target.value)} />
                        </div>
                        <div>
                          <label className="flabel text-[var(--muted)] italic normal-case">
                            Numer domu / lokalu <span className="italic">(opcjonalnie)</span>
                          </label>
                          <input type="text" className="fi mt-1.5" placeholder="np. 26, 12/5" value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                          <div>
                            <label className="flabel text-[var(--muted)] italic normal-case">Miasto (opcjonalnie)</label>
                            <input type="text" className="fi mt-1.5" placeholder="Miasto" value={city} onChange={(e) => setCity(e.target.value)} />
                          </div>
                          <div>
                            <label className="flabel text-[var(--muted)] italic normal-case">Kod pocztowy (opcjonalnie)</label>
                            <input type="text" className="fi mt-1.5" placeholder="00-000" value={zip} onChange={(e) => setZip(e.target.value)} />
                          </div>
                        </div>
                      </div>
                      <div className="card-ft">
                        <span className="text-[12px]" style={{ color: "var(--muted)" }}>Pola oznaczone ● są wymagane</span>
                        <button type="button" onClick={() => goNext(1)} className="inline-flex items-center gap-2 rounded-[12px] border-0 px-6 py-3 text-[13.5px] font-bold text-white transition-all hover:-translate-y-0.5 [&>svg]:transition-transform hover:[&>svg]:translate-x-[3px]" style={{ background: "linear-gradient(135deg, #dc1e1e 0%, #b81818 100%)", boxShadow: "0 4px 20px rgba(220,30,30,.4), 0 0 0 1px rgba(255,255,255,.08) inset" }}>
                          Dalej — Urządzenie
                          <IconChevronRight />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2 */}
                  {currentStep === 2 && (
                    <div key="2" style={{ animation: goingBack ? "zgl-stepBwd .28s ease both" : "zgl-stepFwd .28s ease both" }}>
                      <div className="flex items-center gap-3.5 border-b px-7 py-5" style={{ background: "var(--island2)", borderColor: "rgba(255,255,255,.07)", padding: "22px 28px 18px" }}>
                        <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] text-[var(--red)]" style={{ background: "rgba(220,30,30,.1)", border: "1px solid rgba(220,30,30,.28)", boxShadow: "0 0 16px rgba(220,30,30,.12)" }}>
                          <IconPhoneHeader />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-[15px] font-black tracking-[-0.03em] text-[var(--white)]" style={{ fontFamily: "var(--font-unbounded)" }}>Urządzenie</h3>
                          <p className="mt-1 text-[12px]" style={{ color: "var(--muted)" }}>Wybierz kategorię i opisz problem</p>
                        </div>
                        <span className="rounded-full px-2.5 py-1 text-[10px] font-extrabold text-[var(--red)]" style={{ background: "rgba(220,30,30,.1)", border: "1px solid rgba(220,30,30,.28)" }}>Krok 2 z 5</span>
                      </div>
                      <div className="space-y-4 px-7 py-6" style={{ background: "var(--island)", padding: "26px 28px" }}>
                        <div>
                          <label className="flabel">
                            <span className="flabel-req" /> Kategoria urządzenia
                          </label>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {["📱 Telefon", "💻 Laptop", "📟 Tablet", "🖥 Komputer", "🖨 Drukarka", "🎮 Konsola", "⚙️ Inne"].map((cat) => {
                              const val = cat.split(" ")[1] || cat;
                              return (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => setCategory(val)}
                                  className={`rounded-full border px-4 py-[9px] text-[13px] font-semibold transition-all ${category === val ? "-translate-y-px" : "hover:-translate-y-px"}`}
                                  style={category === val ? { borderColor: "var(--red)", background: "var(--red)", color: "var(--white)", boxShadow: "0 3px 12px rgba(220,30,30,.3)" } : { borderColor: "var(--border)", background: "var(--island4)", color: "var(--ink)" }}
                                >
                                  {cat}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <label className="flabel">
                            <span className="flabel-req" /> Model urządzenia
                          </label>
                          <input type="text" className="fi mt-1.5" placeholder="np. iPhone 15 Pro, Samsung Galaxy S24 Ultra" value={model} onChange={(e) => setModel(e.target.value)} />
                          {(category === "Telefon" || category === "Tablet") && (
                            <div className="mt-2 flex items-start gap-2 rounded-[10px] border px-[15px] py-3" style={{ borderColor: "rgba(220,30,30,.2)", background: "rgba(220,30,30,.06)" }}>
                              <span className="text-base">💡</span>
                              <p className="flex-1 text-[12.5px]" style={{ color: "var(--ink)" }}>
                                Nie wiesz jaki masz model?{" "}
                                <button type="button" onClick={openHowto} className="font-semibold text-[var(--red)] hover:underline">
                                  Zobacz instrukcję w panelu bocznym →
                                </button>
                              </p>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="flabel">
                            <span className="flabel-req" /> Opis problemu
                          </label>
                          <textarea className="fi fta mt-1.5" placeholder="Opisz dokładnie usterkę — co się dzieje z urządzeniem, kiedy się pojawiło, czy urządzenie wypadło lub zostało zalane..." value={problem} onChange={(e) => setProblem(e.target.value)} />
                        </div>
                        <div>
                          <label className="flabel text-[var(--muted)] italic normal-case">IMEI (opcjonalnie)</label>
                          <input type="text" className="fi mt-1.5" placeholder="15 cyfr · szybki sposób: zadzwoń pod *#06# na klawiaturze" value={imei} onChange={(e) => setImei(e.target.value)} />
                        </div>
                        <div>
                          <label className="flabel text-[var(--muted)] italic normal-case">Czy urządzenie się włącza?</label>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(["tak", "nie"] as const).map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setDeviceTurnsOn(deviceTurnsOn === opt ? "" : opt)}
                                className={`rounded-full border px-4 py-[9px] text-[13px] font-semibold transition-all ${deviceTurnsOn === opt ? "-translate-y-px" : "hover:-translate-y-px"}`}
                                style={deviceTurnsOn === opt ? { borderColor: "var(--red)", background: "var(--red)", color: "var(--white)", boxShadow: "0 3px 12px rgba(220,30,30,.3)" } : { borderColor: "var(--border)", background: "var(--island4)", color: "var(--ink)" }}
                              >
                                {opt === "tak" ? "Tak" : "Nie"}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="flabel text-[var(--muted)] italic normal-case">Opis stanu wizualnego (opcjonalnie)</label>
                          <textarea
                            className="fi fta mt-1.5 min-h-[80px]"
                            placeholder="Jeśli są rysy, pęknięcia, uszkodzenia obudowy lub ekranu — opisz to (np. pęknięta szybka, zarysowany tył, wgniecenie)."
                            value={visualCondition}
                            onChange={(e) => setVisualCondition(e.target.value)}
                            maxLength={2000}
                          />
                        </div>
                      </div>
                      <div className="card-ft">
                        <button type="button" onClick={() => goBack(2)} className="inline-flex items-center gap-[7px] text-[13px] font-semibold transition-all hover:gap-[10px]" style={{ color: "var(--muted)" }}>
                          <IconChevronLeft /> Wstecz
                        </button>
                        <button type="button" onClick={() => goNext(2)} className="inline-flex items-center gap-2 rounded-[12px] border-0 px-6 py-3 text-[13.5px] font-bold text-white transition-all hover:-translate-y-0.5 [&>svg]:transition-transform hover:[&>svg]:translate-x-[3px]" style={{ background: "linear-gradient(135deg, #dc1e1e 0%, #b81818 100%)", boxShadow: "0 4px 20px rgba(220,30,30,.4), 0 0 0 1px rgba(255,255,255,.08) inset" }}>
                          {stepLabels[2]}
                          <IconChevronRight />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3 */}
                  {currentStep === 3 && (
                    <div key="3" style={{ animation: goingBack ? "zgl-stepBwd .28s ease both" : "zgl-stepFwd .28s ease both" }}>
                      <div className="flex items-center gap-3.5 border-b px-7 py-5" style={{ background: "var(--island2)", borderColor: "rgba(255,255,255,.07)", padding: "22px 28px 18px" }}>
                        <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] text-[var(--red)]" style={{ background: "rgba(220,30,30,.1)", border: "1px solid rgba(220,30,30,.28)", boxShadow: "0 0 16px rgba(220,30,30,.12)" }}>
                          <IconTruckHeader />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-[15px] font-black tracking-[-0.03em] text-[var(--white)]" style={{ fontFamily: "var(--font-unbounded)" }}>Dostarczenie i zwrot</h3>
                          <p className="mt-1 text-[12px]" style={{ color: "var(--muted)" }}>Wybierz jak dostarczyć i jak odebrać sprzęt</p>
                        </div>
                        <span className="rounded-full px-2.5 py-1 text-[10px] font-extrabold text-[var(--red)]" style={{ background: "rgba(220,30,30,.1)", border: "1px solid rgba(220,30,30,.28)" }}>Krok 3 z 5</span>
                      </div>
                      <div className="space-y-6 px-7 py-6" style={{ background: "var(--island)", padding: "26px 28px" }}>
                        <div>
                          <label className="flabel">
                            <span className="flabel-req" /> Jak dostarczysz urządzenie?
                          </label>
                          <div className="mt-2 space-y-2">
                            {[
                              { v: "osobiscie" as const, title: "Osobiście w serwisie", desc: "ul. Orkana 16B, 34-700 Rabka-Zdrój · pon–pt 9:00–17:00, sob 9:00–14:00", emoji: "🚶" },
                              { v: "kurier" as const, title: "Wysyłka kurierska", desc: "Wyślij paczkę na nasz adres. Zwrot naprawionego sprzętu do Ciebie — za darmo.", emoji: "📦" },
                            ].map((opt) => (
                              <button
                                key={opt.v}
                                type="button"
                                onClick={() => setDelivery(opt.v)}
                                className={`flex w-full items-center gap-[13px] rounded-[14px] border px-[15px] py-[13px] text-left transition-all ${delivery === opt.v ? "-translate-y-px" : "hover:-translate-y-px"}`}
                                style={delivery === opt.v ? { borderColor: "var(--red)", background: "rgba(220,30,30,.08)", boxShadow: "0 0 0 2px rgba(220,30,30,.25), 0 3px 12px rgba(220,30,30,.12)", color: "var(--white)" } : { borderColor: "var(--border)", background: "var(--island4)", color: "var(--ink)" }}
                              >
                                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2" style={delivery === opt.v ? { borderColor: "var(--red)", background: "var(--island)" } : { borderColor: "var(--border2)", background: "var(--island5)" }}>
                                  {delivery === opt.v && <span className="h-2.5 w-2.5 rounded-full bg-[var(--red)]" style={{ animation: "zgl-dotBounce .35s ease" }} />}
                                </span>
                                <div className="flex-1">
                                  <p className="text-[13.5px] font-bold" style={{ color: "inherit" }}>{opt.title}</p>
                                  <p className="text-[11.5px]" style={{ color: "var(--ink2)" }}>{opt.desc}</p>
                                </div>
                                <span className="text-xl">{opt.emoji}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="flabel">
                            <span className="flabel-req" /> Jak chcesz odebrać urządzenie po naprawie?
                          </label>
                          <div className="mt-2 space-y-2">
                            {[
                              { v: "osobiscie" as const, title: "Odbiór osobisty", desc: "Powiadomimy Cię SMS-em lub e-mailem, gdy sprzęt będzie gotowy do odbioru", emoji: "🏪" },
                              { v: "kurier" as const, title: "Kurier do domu", desc: "Naprawiony sprzęt wyślemy kurierem pod wskazany adres — cała Polska", emoji: "🚚" },
                            ].map((opt) => (
                              <button
                                key={opt.v}
                                type="button"
                                onClick={() => setPickup(opt.v)}
                                className={`flex w-full items-center gap-[13px] rounded-[14px] border px-[15px] py-[13px] text-left transition-all ${pickup === opt.v ? "-translate-y-px" : "hover:-translate-y-px"}`}
                                style={pickup === opt.v ? { borderColor: "var(--red)", background: "rgba(220,30,30,.08)", boxShadow: "0 0 0 2px rgba(220,30,30,.25), 0 3px 12px rgba(220,30,30,.12)", color: "var(--white)" } : { borderColor: "var(--border)", background: "var(--island4)", color: "var(--ink)" }}
                              >
                                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2" style={pickup === opt.v ? { borderColor: "var(--red)", background: "var(--island)" } : { borderColor: "var(--border2)", background: "var(--island5)" }}>
                                  {pickup === opt.v && <span className="h-2.5 w-2.5 rounded-full bg-[var(--red)]" style={{ animation: "zgl-dotBounce .35s ease" }} />}
                                </span>
                                <div className="flex-1">
                                  <p className="text-[13.5px] font-bold" style={{ color: "inherit" }}>{opt.title}</p>
                                  <p className="text-[11.5px]" style={{ color: "var(--ink2)" }}>{opt.desc}</p>
                                </div>
                                <span className="text-xl">{opt.emoji}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        {delivery === "kurier" && (
                          <div className="rounded-xl border p-4" style={{ borderColor: "rgba(220,30,30,.25)", background: "rgba(220,30,30,.06)" }}>
                            <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "var(--red)" }}>Nasz adres do wysyłki</p>
                            <p className="mt-2 text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>{SERVICE_ADDRESS.name}</p>
                            <p className="mt-0.5 text-[13px]" style={{ color: "var(--ink2)" }}>{SERVICE_ADDRESS.street}<br />{SERVICE_ADDRESS.city}</p>
                            <p className="mt-1.5 text-[12px]" style={{ color: "var(--muted)" }}>{SERVICE_ADDRESS.hours}</p>
                            <p className="mt-0.5 text-[12px]" style={{ color: "var(--ink2)" }}>Tel. <a href={`tel:${SERVICE_ADDRESS.phone}`} className="font-semibold text-[var(--red)]">{SERVICE_ADDRESS.phone}</a></p>
                            <p className="mt-0.5 text-[12px]" style={{ color: "var(--ink2)" }}>E-mail: <a href={`mailto:${SERVICE_ADDRESS.email}`} className="font-semibold text-[var(--red)]">{SERVICE_ADDRESS.email}</a></p>
                            <p className="mt-3 text-[12px]" style={{ color: "var(--ink2)" }}>Wysyłkę paczki do nas opłacasz we własnym zakresie. Po naprawie odsyłamy Ci sprzęt za darmo — zwrot do domu jest po naszej stronie.</p>
                          </div>
                        )}
                        {pickup === "kurier" && (
                          <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--island2)" }}>
                            <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Adres do odbioru przesyłki po naprawie</p>
                            <p className="mt-1.5 text-[11.5px]" style={{ color: "var(--ink2)" }}>Dane z kroku „Kontakt”. Możesz je tutaj poprawić.</p>
                            <div className="mt-3 space-y-3">
                              <div>
                                <label className="flabel text-[var(--muted)] italic normal-case">Ulica</label>
                                <input type="text" className="fi mt-1" placeholder="Ulica" value={street} onChange={(e) => setStreet(e.target.value)} />
                              </div>
                              <div>
                                <label className="flabel text-[var(--muted)] italic normal-case">Numer domu / lokalu</label>
                                <input type="text" className="fi mt-1" placeholder="np. 26, 12/5" value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} />
                              </div>
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                  <label className="flabel text-[var(--muted)] italic normal-case">Miasto</label>
                                  <input type="text" className="fi mt-1" placeholder="Miasto" value={city} onChange={(e) => setCity(e.target.value)} />
                                </div>
                                <div>
                                  <label className="flabel text-[var(--muted)] italic normal-case">Kod pocztowy</label>
                                  <input type="text" className="fi mt-1" placeholder="00-000" value={zip} onChange={(e) => setZip(e.target.value)} />
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDeliveryAddressConfirmed(true)}
                              className="mt-4 inline-flex items-center gap-2 rounded-lg border-0 px-4 py-2.5 text-[13px] font-bold text-white transition-all hover:-translate-y-px disabled:opacity-70"
                              style={{ background: deliveryAddressConfirmed ? "var(--green)" : "var(--red)", boxShadow: "0 2px 10px rgba(220,30,30,.3)" }}
                            >
                              {deliveryAddressConfirmed ? "✓ Dane potwierdzone" : "Potwierdź dane do wysyłki"}
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="card-ft">
                        <button type="button" onClick={() => goBack(3)} className="inline-flex items-center gap-[7px] text-[13px] font-semibold transition-all hover:gap-[10px]" style={{ color: "var(--muted)" }}>
                          <IconChevronLeft /> Wstecz
                        </button>
                        <button type="button" onClick={() => goNext(3)} className="inline-flex items-center gap-2 rounded-[12px] border-0 px-6 py-3 text-[13.5px] font-bold text-white transition-all hover:-translate-y-0.5 [&>svg]:transition-transform hover:[&>svg]:translate-x-[3px]" style={{ background: "linear-gradient(135deg, #dc1e1e 0%, #b81818 100%)", boxShadow: "0 4px 20px rgba(220,30,30,.4), 0 0 0 1px rgba(255,255,255,.08) inset" }}>
                          {stepLabels[3]}
                          <IconChevronRight />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 4 */}
                  {currentStep === 4 && (
                    <div key="4" style={{ animation: goingBack ? "zgl-stepBwd .28s ease both" : "zgl-stepFwd .28s ease both" }}>
                      <div className="flex items-center gap-3.5 border-b px-7 py-5" style={{ background: "var(--island2)", borderColor: "rgba(255,255,255,.07)", padding: "22px 28px 18px" }}>
                        <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] text-[var(--red)]" style={{ background: "rgba(220,30,30,.1)", border: "1px solid rgba(220,30,30,.28)", boxShadow: "0 0 16px rgba(220,30,30,.12)" }}>
                          <IconPackageHeader />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-[15px] font-black tracking-[-0.03em] text-[var(--white)]" style={{ fontFamily: "var(--font-unbounded)" }}>Hammer Glass / akcesoria</h3>
                          <p className="mt-1 text-[12px]" style={{ color: "var(--muted)" }}>Opcjonalne dodatki do Twojego zlecenia</p>
                        </div>
                        <span className="rounded-full px-2.5 py-1 text-[10px] font-extrabold text-[var(--red)]" style={{ background: "rgba(220,30,30,.1)", border: "1px solid rgba(220,30,30,.28)" }}>Krok 4 z 5</span>
                      </div>
                      <div className="space-y-4 px-7 py-6" style={{ background: "var(--island)", padding: "26px 28px" }}>
                        <div className={!isPhoneOrTablet ? "opacity-60" : ""}>
                          <label className="flabel text-[var(--muted)] italic normal-case">
                            Zainteresowanie folią Hammer Glass (opcjonalnie)
                            {!isPhoneOrTablet && <span className="ml-1.5 text-[11px]">— dostępne dla Telefon, Tablet</span>}
                          </label>
                          <select
                            className="fi mt-1.5 appearance-none pr-9"
                            value={hammer}
                            onChange={(e) => setHammer(e.target.value)}
                            disabled={!isPhoneOrTablet}
                          >
                            <option value="">Wybierz opcję (opcjonalnie)</option>
                            <option value="tak">Tak — interesuje mnie folia ochronna Hammer Glass</option>
                            <option value="nie">Nie, dziękuję</option>
                          </select>
                        </div>
                        {isPhoneOrTablet && (
                          <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--island2)" }}>
                            <div className="flex flex-wrap items-center gap-2 border-b pb-3" style={{ borderColor: "var(--border)" }}>
                              <span className="rounded-full px-2.5 py-1 text-[9px] font-extrabold text-white" style={{ background: "var(--red)", boxShadow: "0 2px 6px rgba(220,30,30,.3)" }}>HAMMER GLASS CUT</span>
                              <span className="text-[13px] font-bold" style={{ color: "var(--ink)" }}>Folia precyzyjnie cięta na Twój model</span>
                            </div>
                            <p className="mt-3 text-[11.5px] leading-relaxed" style={{ color: "var(--ink2)" }}>
                              Wycinamy folię na miejscu przy użyciu plotera VersaBlade X Pro z dokładnością do 0,1 mm. Montaż ~5 min. Baza 10 000+ modeli. PZH+RoHS.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {["⚡ Montaż ~5 min", "📐 Precyzja 0,1 mm", "📱 10 000+ modeli", "✅ PZH · RoHS"].map((tag) => (
                                <span key={tag} className="rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition-colors hover:border-[var(--red)] hover:text-[var(--red)]" style={{ borderColor: "var(--border2)", background: "rgba(255,255,255,.04)", color: "var(--ink2)" }}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--island2)" }}>
                          <p className="text-[13px] font-bold" style={{ color: "var(--ink)" }}>Dobierz mi akcesoria</p>
                          {category && (
                            <p className="mt-1 text-[12px]" style={{ color: "var(--ink2)" }}>
                              {category === "Telefon" || category === "Tablet" ? "Dla telefonów / tabletów: " : `Dla ${category === "Komputer" ? "komputerów" : category === "Laptop" ? "laptopów" : category === "Drukarka" ? "drukarek" : category === "Konsola" ? "konsol" : "innych"}: `}
                              {accessorySuggestionText}
                            </p>
                          )}
                          {isPhoneOrTablet && (
                            <label className="mt-3 flex cursor-pointer items-start gap-3">
                              <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-[1.5px]`} style={wantsAccessories ? { borderColor: "var(--red)", background: "var(--red)", boxShadow: "0 2px 8px rgba(220,30,30,.3)" } : { borderColor: "var(--border2)", background: "var(--island5)" }}>
                                {wantsAccessories && (
                                  <span className="text-white [&>svg]:h-3 [&>svg]:w-3" style={{ animation: "zgl-dotBounce .35s ease" }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  </span>
                                )}
                              </span>
                              <input type="checkbox" className="sr-only" checked={wantsAccessories} onChange={(e) => setWantsAccessories(e.target.checked)} />
                              <span className="text-[12px]" style={{ color: "var(--ink2)" }}>Proszę doradzić przy odbiorze (telefon/tablet)</span>
                            </label>
                          )}
                          <div className="mt-3">
                            <label className="flabel text-[var(--muted)] italic normal-case">Co dobrać? (wpisz np. konkretne akcesoria)</label>
                            <input
                              type="text"
                              className="fi mt-1.5"
                              placeholder={category && accessorySuggestionText && accessorySuggestionText !== "brak" ? `np. ${accessorySuggestionText.split(", ")[0]?.trim() || "akcesoria"}` : "np. zasilacz, etui"}
                              value={accessoryWishlist}
                              onChange={(e) => setAccessoryWishlist(e.target.value)}
                              maxLength={1000}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="flabel text-[var(--muted)] italic normal-case">Dodatkowe uwagi (opcjonalnie)</label>
                          <textarea className="fi mt-1.5 min-h-[90px] resize-y leading-[1.7]" placeholder="Cokolwiek chcesz nam przekazać — np. hasło ekranu blokady, specyficzne zachowanie urządzenia, historia naprawy..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                        </div>
                      </div>
                      <div className="card-ft">
                        <button type="button" onClick={() => goBack(4)} className="inline-flex items-center gap-[7px] text-[13px] font-semibold transition-all hover:gap-[10px]" style={{ color: "var(--muted)" }}>
                          <IconChevronLeft /> Wstecz
                        </button>
                        <button type="button" onClick={() => goNext(4)} className="inline-flex items-center gap-2 rounded-[12px] border-0 px-6 py-3 text-[13.5px] font-bold text-white transition-all hover:-translate-y-0.5 [&>svg]:transition-transform hover:[&>svg]:translate-x-[3px]" style={{ background: "linear-gradient(135deg, #dc1e1e 0%, #b81818 100%)", boxShadow: "0 4px 20px rgba(220,30,30,.4), 0 0 0 1px rgba(255,255,255,.08) inset" }}>
                          {stepLabels[4]}
                          <IconChevronRight />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 5 */}
                  {currentStep === 5 && (
                    <div key="5" style={{ animation: goingBack ? "zgl-stepBwd .28s ease both" : "zgl-stepFwd .28s ease both" }}>
                      <div className="flex items-center gap-3.5 border-b px-7 py-5" style={{ background: "var(--island2)", borderColor: "rgba(255,255,255,.07)", padding: "22px 28px 18px" }}>
                        <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] text-[var(--red)]" style={{ background: "rgba(220,30,30,.1)", border: "1px solid rgba(220,30,30,.28)", boxShadow: "0 0 16px rgba(220,30,30,.12)" }}>
                          <IconCheckHeader />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-[15px] font-black tracking-[-0.03em] text-[var(--white)]" style={{ fontFamily: "var(--font-unbounded)" }}>Podsumowanie zgłoszenia</h3>
                          <p className="mt-1 text-[12px]" style={{ color: "var(--muted)" }}>Sprawdź dane i wyślij zlecenie</p>
                        </div>
                        <span className="rounded-full px-2.5 py-1 text-[10px] font-extrabold text-[var(--red)]" style={{ background: "rgba(220,30,30,.1)", border: "1px solid rgba(220,30,30,.28)" }}>Krok 5 z 5</span>
                      </div>
                      <div className="px-7 py-6" style={{ background: "var(--island)", padding: "26px 28px" }}>
                        <div className="space-y-0">
                          {[
                            { key: "Kontakt", val: [fname, lname].filter(Boolean).join(" ") ? `${[fname, lname].filter(Boolean).join(" ")} · ${email || "—"} · ${phone || "—"}` : "—" },
                            { key: "Urządzenie", val: category && model ? `${category} — ${model}` : "—" },
                            { key: "Problem", val: problem.trim() || "—" },
                            { key: "IMEI", val: imei.trim() || "—" },
                            { key: "Dostawa", val: delivery === "osobiscie" ? "Osobiście w serwisie" : "Wysyłka kurierska" },
                            { key: "Odbiór", val: pickup === "osobiscie" ? "Odbiór osobisty" : "Kurier do domu" },
                            { key: "Hammer Glass", val: hammer === "tak" ? "Tak — interesuje mnie folia" : hammer === "nie" ? "Nie" : "—" },
                            { key: "Akcesoria", val: accessoryWishlist.trim() ? accessoryWishlist.trim() : wantsAccessories ? "Proszę doradzić przy odbiorze" : "—" },
                            { key: "Uwagi", val: notes.trim() || "—" },
                            ...(deviceTurnsOn ? [{ key: "Czy urządzenie się włącza", val: deviceTurnsOn === "tak" ? "Tak" : "Nie" }] : []),
                            ...(visualCondition.trim() ? [{ key: "Stan wizualny", val: visualCondition.trim() }] : []),
                          ].map((row) => (
                            <div key={row.key} className="flex gap-4 border-b py-[13px] transition-colors hover:bg-[var(--faint)]" style={{ borderColor: "var(--border)" }}>
                              <span className="min-w-[92px] text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>{row.key}</span>
                              <span className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{row.val}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-5 rounded-xl border p-4 text-[12px]" style={{ borderColor: "rgba(220,30,30,.25)", background: "rgba(220,30,30,.06)", color: "var(--ink2)" }}>
                          📋 Sprawdź dane przed wysłaniem. Po wysłaniu skontaktujemy się z Tobą w celu potwierdzenia zlecenia lub po przeprowadzonej <strong style={{ color: "var(--ink)" }}>bezpłatnej diagnozie</strong> urządzenia.
                        </div>
                        {submitError && (
                          <div className="mt-4 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-[13px] text-red-200 whitespace-pre-line">
                            {submitError}
                          </div>
                        )}
                      </div>
                      <div className="card-ft">
                        <button type="button" onClick={() => goBack(5)} disabled={submitLoading} className="inline-flex items-center gap-[7px] text-[13px] font-semibold transition-all hover:gap-[10px] disabled:opacity-50" style={{ color: "var(--muted)" }}>
                          <IconChevronLeft /> Wstecz
                        </button>
                        <button type="button" onClick={handleSubmit} disabled={submitLoading} className="inline-flex items-center gap-2 rounded-[12px] border-0 px-6 py-3 text-[13.5px] font-bold text-white transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70 [&>svg]:transition-transform hover:[&>svg]:translate-x-[3px]" style={{ background: "linear-gradient(135deg, #dc1e1e 0%, #b81818 100%)", boxShadow: "0 4px 20px rgba(220,30,30,.4), 0 0 0 1px rgba(255,255,255,.08) inset" }}>
                          {submitLoading ? "Wysyłanie…" : "Wyślij zgłoszenie"}
                          {!submitLoading && <IconSend />}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Popup „Jak sprawdzić model” — tylko na mobile (lg: sidebar) */}
      {howtoModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          aria-modal="true"
          role="dialog"
          aria-labelledby="howto-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setHowtoModalOpen(false)}
            aria-hidden="true"
          />
          <div
            className="relative z-10 w-full max-h-[90vh] overflow-y-auto rounded-2xl border shadow-xl"
            style={{ background: "var(--island)", borderColor: "rgba(255,255,255,.1)", maxWidth: "420px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b px-4 py-3" style={{ background: "var(--island2)", borderColor: "rgba(255,255,255,.07)" }}>
              <span id="howto-modal-title" className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Jak sprawdzić model telefonu?</span>
              <button
                type="button"
                onClick={() => setHowtoModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/10"
                style={{ color: "var(--ink)" }}
                aria-label="Zamknij"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="flex border-b" style={{ borderColor: "rgba(255,255,255,.06)" }}>
              <button type="button" onClick={() => setHowtoTab("ios")} className={`flex-1 px-4 py-3 text-[13px] font-semibold transition-colors ${howtoTab === "ios" ? "border-b-2 border-[#dc1e1e] text-white" : ""}`} style={{ color: howtoTab === "ios" ? "#fff" : "var(--muted)" }}>
                <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-black">iOS</span>
              </button>
              <button type="button" onClick={() => setHowtoTab("android")} className={`flex-1 px-4 py-3 text-[13px] font-semibold transition-colors ${howtoTab === "android" ? "border-b-2 border-[#dc1e1e] text-white" : ""}`} style={{ color: howtoTab === "android" ? "#fff" : "var(--muted)" }}>
                <span className="rounded bg-[#3ddc84] px-1.5 py-0.5 text-[10px] font-bold text-black">Android</span>
              </button>
            </div>
            <div className="space-y-3 p-4" style={{ color: "#8a93a2" }}>
              {howtoTab === "ios" ? (
                <>
                  {["Otwórz **Ustawienia** — szara ikona z kołem zębatym na ekranie głównym", "Przewiń w dół i tap w **Ogólne**", "Tap w **Informacje** — pierwsza pozycja na liście", "Znajdź pole **Nazwa modelu** — np. iPhone 15 Pro Max", "Możesz też sprawdzić tył obudowy — model wygrawerowany pod logo Apple drobną czcionką"].map((t, i) => (
                    <div key={i} className="flex gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9.5px] font-bold" style={{ borderColor: "rgba(220,30,30,.28)", background: "rgba(220,30,30,.1)", color: "var(--red)" }}>{i + 1}</span>
                      <p className="text-[13px] leading-[1.65]" dangerouslySetInnerHTML={{ __html: t.replace(/\*\*(.*?)\*\*/g, "<strong style='color:#c8cbd4'>$1</strong>") }} />
                    </div>
                  ))}
                  <div className="mt-3 rounded-xl border p-3" style={{ background: "#1a1d26", borderColor: "rgba(255,255,255,.1)" }}>
                    <p className="font-mono text-[15px] font-bold tracking-wide" style={{ color: "#dc1e1e", background: "rgba(220,30,30,.12)", border: "1px solid rgba(220,30,30,.25)", borderRadius: "7px", boxShadow: "0 0 8px rgba(220,30,30,.2)", padding: "8px 12px" }}>*#06#</p>
                    <p className="mt-2 text-[12px]" style={{ color: "#8a93a2" }}><strong style={{ color: "#c8cbd4" }}>Szybszy sposób:</strong> zadzwoń pod ten numer — natychmiast wyświetli się IMEI i pełna nazwa modelu.</p>
                  </div>
                </>
              ) : (
                <>
                  {["Otwórz **Ustawienia** — ikona koła zębatego", "Przewiń do końca listy, tap w **Informacje o telefonie** lub **O urządzeniu**", "Znajdź pole **Model** lub **Numer modelu** — np. Samsung Galaxy S24 Ultra", "**Samsung:** Ustawienia → **O telefonie** → **Informacje o oprogramowaniu**", "**Xiaomi / MIUI:** Ustawienia → **Mój telefon** — model widoczny na górze ekranu"].map((t, i) => (
                    <div key={i} className="flex gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9.5px] font-bold" style={{ borderColor: "rgba(220,30,30,.28)", background: "rgba(220,30,30,.1)", color: "var(--red)" }}>{i + 1}</span>
                      <p className="text-[13px] leading-[1.65]" dangerouslySetInnerHTML={{ __html: t.replace(/\*\*(.*?)\*\*/g, "<strong style='color:#c8cbd4'>$1</strong>") }} />
                    </div>
                  ))}
                  <div className="mt-3 rounded-xl border p-3" style={{ background: "#1a1d26", borderColor: "rgba(255,255,255,.1)" }}>
                    <p className="font-mono text-[15px] font-bold tracking-wide" style={{ color: "#dc1e1e", background: "rgba(220,30,30,.12)", border: "1px solid rgba(220,30,30,.25)", borderRadius: "7px", boxShadow: "0 0 8px rgba(220,30,30,.2)", padding: "8px 12px" }}>*#06#</p>
                    <p className="mt-2 text-[12px]" style={{ color: "#8a93a2" }}><strong style={{ color: "#c8cbd4" }}>Działa na każdym Androidzie:</strong> zadzwoń pod ten numer — wyświetli IMEI i model. Działa też na tabletach.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
