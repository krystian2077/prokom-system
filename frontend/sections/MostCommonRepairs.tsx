"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const BADGE_LABEL = "Serwis PRO-KOM";
const SUBTITLE =
  "Sprawdź jakie usterki naprawiamy najczęściej — wybierz swoje urządzenie.";
const CTA_TITLE = "Nie widzisz swojej usterki?";
const CTA_SUBTITLE =
  "Zgłoś naprawę — sprawdzimy problem i przygotujemy wycenę bezpłatnie.";
const CTA_BUTTON = "Zgłoś naprawę — to nic nie kosztuje";
const BRANDS_HEADING = "Serwisujemy urządzenia marek";
const DEVICE_NOTE = "Części oryginalne i wysokiej jakości zamienniki";

/** Mapowanie nazw marek na pliki w /images/logo/ */
const LOGO_FILES: Record<string, string> = {
  Apple: "Apple.jpg",
  Samsung: "samsung3.jpg",
  Xiaomi: "xiaomi.jpg",
  Motorola: "motorola.jpg",
  realme: "realme.jpg",
  Huawei: "huawei.jpg",
  Dell: "Dell jpg.jpg",
  Lenovo: "lenovo.jpg",
  HP: "hp.jpg",
  ASUS: "asus.jpg",
  Acer: "Acer.jpg",
  MSI: "MSI.jpg",
  Brother: "Brother.jpg",
  Epson: "epson.jpg",
  Canon: "Canon.jpg",
  Kyocera: "Kyocera.jpg",
  Xerox: "Xerox.jpg",
  Microsoft: "microsoft.jpg",
  PlayStation: "PlayStation.jpg",
  Xbox: "xbox.jpg",
  Nintendo: "Nintendo.jpg",
  Gigabyte: "gigabyte.jpg",
};

/** Zdjęcia urządzeń z /public/images/urzadzenia/ — po kategoriach (slider) */
const DEVICE_IMAGES: Record<string, string[]> = {
  telefony: [
    "/images/urzadzenia/iphone.jpg",
    "/images/urzadzenia/samsung.jpg",
    "/images/urzadzenia/motorola.jpg",
    "/images/urzadzenia/xiaomi.jpg",
  ],
  laptopy: [
    "/images/urzadzenia/dell.jpg",
    "/images/urzadzenia/hp.jpg",
    "/images/urzadzenia/macbook.jpg",
    "/images/urzadzenia/lenovo.jpg",
  ],
  tablety: [
    "/images/urzadzenia/ipadjpg.jpg",
    "/images/urzadzenia/galaxy-tab.jpg",
    "/images/urzadzenia/lenovo-tablet.jpg",
    "/images/urzadzenia/tablet-microsoft.jpg",
  ],
  komputery: [
    "/images/urzadzenia/dell-komputeri.jpg",
    "/images/urzadzenia/asus-komputer.jpg",
    "/images/urzadzenia/lenovo-komputer.jpg",
    "/images/urzadzenia/msi-komputer.jpg",
  ],
  drukarki: [
    "/images/urzadzenia/brotherjpg.jpg",
    "/images/urzadzenia/canon.jpg",
    "/images/urzadzenia/epson.jpg",
    "/images/urzadzenia/hp-drukarka.jpg",
  ],
  konsole: [
    "/images/urzadzenia/playstation.jpg",
    "/images/urzadzenia/xbox.jpg",
    "/images/urzadzenia/nintendojpg.jpg",
  ],
};

type RepairItem = {
  icon: string;
  name: string;
  desc: string;
  tag: string;
  popular?: boolean;
};

type Category = {
  id: string;
  label: string;
  emoji: string;
  deviceName: string;
  deviceDescription: string;
  repairs: RepairItem[];
  brands: string[];
};

const CATEGORIES: Category[] = [
  {
    id: "telefony",
    label: "Telefony",
    emoji: "📱",
    deviceName: "Telefon",
    deviceDescription:
      "Serwisujemy smartfony wszystkich popularnych producentów. Naprawiamy najczęstsze usterki — od ekranów po problemy z ładowaniem.",
    repairs: [
      {
        icon: "📱",
        name: "Wymiana wyświetlacza",
        desc: "Pęknięty ekran, brak obrazu lub niedziałający dotyk — wymieniamy wyświetlacz na wysokiej jakości część przywracając pełną funkcjonalność telefonu.",
        tag: "Naprawa w 1h",
        popular: true,
      },
      {
        icon: "🔋",
        name: "Wymiana baterii",
        desc: "Telefon szybko się rozładowuje, nagrzewa lub sam się wyłącza — wymieniamy baterię przywracając stabilny czas pracy urządzenia.",
        tag: "Nowa bateria",
      },
      {
        icon: "⚡",
        name: "Naprawa portu ładowania",
        desc: "Telefon nie ładuje się lub kabel nie łączy stabilnie — naprawiamy port USB-C lub Lightning przywracając prawidłowe ładowanie.",
        tag: "USB-C / Lightning",
      },
      {
        icon: "📷",
        name: "Naprawa aparatu",
        desc: "Zdjęcia są rozmazane, kamera nie uruchamia się lub nie działa autofocus — naprawiamy lub wymieniamy moduł aparatu.",
        tag: "Moduł aparatu",
      },
      {
        icon: "🔊",
        name: "Naprawa głośnika / mikrofonu",
        desc: "Cichy dźwięk, brak audio lub problemy podczas rozmów — naprawiamy głośnik, mikrofon lub moduł audio telefonu.",
        tag: "Audio / mikrofon",
      },
      {
        icon: "💧",
        name: "Naprawa po zalaniu",
        desc: "Telefon miał kontakt z wodą lub inną cieczą — wykonujemy czyszczenie elektroniki oraz diagnostykę uszkodzonych podzespołów.",
        tag: "Pilna naprawa",
      },
    ],
    brands: ["Apple", "Samsung", "Xiaomi", "Motorola", "realme", "Huawei"],
  },
  {
    id: "laptopy",
    label: "Laptopy",
    emoji: "💻",
    deviceName: "Laptop",
    deviceDescription:
      "Naprawiamy laptopy wszystkich marek. Wymiana matryc, klawiatur, portów i naprawa po zalaniu.",
    repairs: [
      {
        icon: "🖥️",
        name: "Wymiana matrycy",
        desc: "Pęknięty ekran, linie na wyświetlaczu lub brak obrazu — wymieniamy matrycę laptopa przywracając pełną jakość obrazu.",
        tag: "Nowa matryca",
      },
      {
        icon: "🔋",
        name: "Wymiana baterii",
        desc: "Laptop działa tylko na zasilaczu lub szybko się rozładowuje — instalujemy nową baterię przywracając mobilność urządzenia.",
        tag: "Nowa bateria",
        popular: true,
      },
      {
        icon: "❄️",
        name: "Czyszczenie układu chłodzenia",
        desc: "Laptop przegrzewa się, głośno pracuje lub spowalnia — czyścimy układ chłodzenia i wymieniamy pastę termiczną.",
        tag: "Cisza i chłód",
      },
      {
        icon: "⚡",
        name: "Naprawa gniazda zasilania",
        desc: "Laptop nie ładuje się lub zasilanie przerywa podczas pracy — naprawiamy lub wymieniamy gniazdo zasilania.",
        tag: "Gniazdo DC",
      },
      {
        icon: "⌨️",
        name: "Wymiana klawiatury",
        desc: "Nie działają klawisze, klawiatura została zalana lub reaguje nieprawidłowo — wymieniamy klawiaturę na nową.",
        tag: "Nowa klawiatura",
      },
      {
        icon: "🖥️",
        name: "Naprawa płyty głównej",
        desc: "Laptop nie uruchamia się, restartuje się lub nie wykrywa podzespołów — diagnozujemy i naprawiamy płytę główną.",
        tag: "Diagnostyka",
      },
    ],
    brands: ["Dell", "Lenovo", "HP", "ASUS", "Acer", "Apple", "MSI"],
  },
  {
    id: "tablety",
    label: "Tablety",
    emoji: "📟",
    deviceName: "Tablet",
    deviceDescription:
      "Serwisujemy tablety iPad, Samsung, Lenovo i innych marek. Wymiana wyświetlaczy, baterii i portów.",
    repairs: [
      {
        icon: "📱",
        name: "Wymiana wyświetlacza",
        desc: "Pęknięty ekran lub brak reakcji na dotyk — wymieniamy wyświetlacz tabletu przywracając wygodę użytkowania.",
        tag: "Nowy ekran",
        popular: true,
      },
      {
        icon: "🔋",
        name: "Wymiana baterii",
        desc: "Tablet szybko się rozładowuje lub nie uruchamia się bez ładowarki — instalujemy nową baterię.",
        tag: "Nowa bateria",
      },
      {
        icon: "⚡",
        name: "Naprawa portu ładowania",
        desc: "Tablet nie ładuje się lub kabel nie trzyma się stabilnie — naprawiamy port ładowania przywracając prawidłowe zasilanie.",
        tag: "Port ładowania",
      },
      {
        icon: "🔘",
        name: "Naprawa przycisków",
        desc: "Przycisk zasilania lub regulacji głośności nie działa poprawnie — naprawiamy moduł przycisków tabletu.",
        tag: "Przyciski",
      },
      {
        icon: "📷",
        name: "Naprawa aparatu",
        desc: "Tablet nie robi zdjęć lub kamera działa nieprawidłowo — naprawiamy lub wymieniamy moduł aparatu.",
        tag: "Kamera",
      },
      {
        icon: "💧",
        name: "Naprawa po zalaniu",
        desc: "Tablet miał kontakt z wodą lub inną cieczą — wykonujemy czyszczenie elektroniki i pełną diagnostykę.",
        tag: "Czyszczenie",
      },
    ],
    brands: ["Apple", "Samsung", "Lenovo", "Xiaomi", "Huawei", "Microsoft"],
  },
  {
    id: "komputery",
    label: "Komputery",
    emoji: "🖥️",
    deviceName: "Komputer",
    deviceDescription:
      "Serwis komputerów stacjonarnych — wymiana podzespołów, czyszczenie, diagnostyka i naprawa zasilaczy.",
    repairs: [
      {
        icon: "⚡",
        name: "Naprawa zasilacza",
        desc: "Komputer nie uruchamia się lub wyłącza podczas pracy — diagnozujemy i naprawiamy zasilacz komputera.",
        tag: "Zasilanie",
      },
      {
        icon: "💾",
        name: "Wymiana dysku SSD / HDD",
        desc: "Komputer działa wolno lub system często się zawiesza — instalujemy szybki dysk SSD poprawiając wydajność.",
        tag: "Szybszy komputer",
        popular: true,
      },
      {
        icon: "🖥️",
        name: "Naprawa płyty głównej",
        desc: "Komputer nie startuje lub nie wykrywa podzespołów — diagnozujemy płytę główną i naprawiamy uszkodzone elementy.",
        tag: "Diagnostyka",
      },
      {
        icon: "❄️",
        name: "Czyszczenie komputera",
        desc: "Kurz wewnątrz obudowy powoduje przegrzewanie podzespołów — wykonujemy dokładne czyszczenie komputera.",
        tag: "Konserwacja",
      },
      {
        icon: "🎮",
        name: "Wymiana karty graficznej",
        desc: "Problemy z obrazem lub niska wydajność w aplikacjach — instalujemy nową kartę graficzną.",
        tag: "GPU",
      },
      {
        icon: "🧠",
        name: "Rozbudowa pamięci RAM",
        desc: "Komputer działa wolno podczas pracy wielu programów — zwiększamy pamięć RAM poprawiając płynność systemu.",
        tag: "Więcej RAM",
      },
    ],
    brands: ["Lenovo", "HP", "Dell", "MSI", "Gigabyte", "ASUS"],
  },
  {
    id: "drukarki",
    label: "Drukarki",
    emoji: "🖨️",
    deviceName: "Drukarki",
    deviceDescription:
      "Serwis drukarek atramentowych i laserowych. Czyszczenie, wymiana rolek, bębnów i naprawa mechanizmów.",
    repairs: [
      {
        icon: "🖨️",
        name: "Naprawa podajnika papieru",
        desc: "Drukarka zacina papier lub nie pobiera arkuszy — naprawiamy mechanizm podajnika oraz zużyte rolki.",
        tag: "Zacięcia papieru",
        popular: true,
      },
      {
        icon: "🖋️",
        name: "Naprawa głowicy drukującej",
        desc: "Na wydruku pojawiają się braki kolorów lub linie — czyścimy lub wymieniamy głowicę drukującą.",
        tag: "Pełne kolory",
      },
      {
        icon: "⚡",
        name: "Naprawa zasilacza",
        desc: "Drukarka nie włącza się lub przerywa pracę — diagnozujemy i naprawiamy układ zasilania urządzenia.",
        tag: "Diagnostyka",
      },
      {
        icon: "✨",
        name: "Czyszczenie i konserwacja drukarki",
        desc: "Spadek jakości druku lub zabrudzenia mechanizmu — wykonujemy czyszczenie i konserwację drukarki.",
        tag: "Konserwacja",
      },
      {
        icon: "🖨️",
        name: "Naprawa mechanizmu drukującego",
        desc: "Drukarka hałasuje lub zatrzymuje się podczas pracy — naprawiamy mechanizm drukujący urządzenia.",
        tag: "Mechanizm",
      },
      {
        icon: "📄",
        name: "Wymiana rolek pobierających papier",
        desc: "Drukarka pobiera kilka kartek naraz lub nie pobiera papieru — wymieniamy zużyte rolki.",
        tag: "Rolki papieru",
      },
    ],
    brands: ["Brother", "Epson", "Canon", "HP", "Kyocera", "Xerox"],
  },
  {
    id: "konsole",
    label: "Konsole",
    emoji: "🎮",
    deviceName: "Konsole",
    deviceDescription:
      "Serwis konsol PlayStation, Xbox i Nintendo — wymiana wentylatorów, pasty, naprawa napędów i portów.",
    repairs: [
      {
        icon: "💨",
        name: "Czyszczenie i konserwacja konsoli",
        desc: "Konsola przegrzewa się lub głośno pracuje — czyścimy układ chłodzenia i wymieniamy pastę termiczną.",
        tag: "Czyszczenie",
        popular: true,
      },
      {
        icon: "📡",
        name: "Naprawa portu HDMI",
        desc: "Na telewizorze nie pojawia się obraz z konsoli — naprawiamy lub wymieniamy port HDMI.",
        tag: "HDMI",
      },
      {
        icon: "⚡",
        name: "Naprawa zasilania",
        desc: "Konsola nie uruchamia się lub wyłącza podczas gry — diagnozujemy i naprawiamy układ zasilania.",
        tag: "Zasilanie",
      },
      {
        icon: "💿",
        name: "Naprawa napędu",
        desc: "Konsola nie czyta płyt lub nie wysuwa nośnika — naprawiamy lub wymieniamy napęd.",
        tag: "Napęd",
      },
      {
        icon: "💾",
        name: "Wymiana dysku",
        desc: "Konsola ma za mało miejsca na gry lub dysk jest uszkodzony — instalujemy nowy dysk.",
        tag: "Nowy dysk",
      },
      {
        icon: "❄️",
        name: "Naprawa przegrzewania",
        desc: "Konsola wyłącza się podczas gry lub mocno się nagrzewa — naprawiamy układ chłodzenia.",
        tag: "Chłodzenie",
      },
    ],
    brands: ["PlayStation", "Xbox", "Nintendo"],
  },
];

const TAB_LIST = [
  { id: "telefony", emoji: "📱", label: "Telefony" },
  { id: "laptopy", emoji: "💻", label: "Laptopy" },
  { id: "tablety", emoji: "📟", label: "Tablety" },
  { id: "komputery", emoji: "🖥️", label: "Komputery" },
  { id: "drukarki", emoji: "🖨️", label: "Drukarki" },
  { id: "konsole", emoji: "🎮", label: "Konsole" },
];

const SLIDER_INTERVAL_MS = 2500;

const LARGE_LOGO_BRANDS = new Set([
  "Motorola",
  "ASUS",
  "Microsoft",
  "Gigabyte",
  "Epson",
  "PlayStation",
  "HP",
]);
const EXTRA_LARGE_LOGO_BRANDS = new Set(["Samsung"]);

const LOGO_CELL_HEIGHT = "h-[88px]"; // jedna wysokość dla wszystkich — loga na równym poziomie

function BrandLogoCell({ name }: { name: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  const logoFile = LOGO_FILES[name];
  const logoSrc = logoFile
    ? `/images/logo/${encodeURIComponent(logoFile)}`
    : null;
  const isExtraLarge = EXTRA_LARGE_LOGO_BRANDS.has(name);
  const isLarge = LARGE_LOGO_BRANDS.has(name);
  const logoClass = isExtraLarge
    ? "h-14 w-40 sm:h-16 sm:w-44"
    : isLarge
      ? "h-12 w-32 sm:h-14 sm:w-36"
      : "h-10 w-24 sm:h-12 sm:w-28";
  return (
    <div
      className={`flex ${LOGO_CELL_HEIGHT} shrink-0 items-center justify-center rounded-xl border border-[#eee] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(220,30,30,.18)] hover:shadow-[0_4px_14px_rgba(0,0,0,.07)]`}
      title={name}
    >
      {logoSrc && !imgFailed ? (
        <div className={`relative object-contain ${logoClass}`}>
          <Image
            src={logoSrc}
            alt={name}
            fill
            className="object-contain"
            sizes={isExtraLarge ? "208px" : isLarge ? "160px" : "112px"}
            onError={() => setImgFailed(true)}
          />
        </div>
      ) : (
        <span className="text-xs font-medium text-[#999]">{name}</span>
      )}
    </div>
  );
}

export function MostCommonRepairs() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const category = CATEGORIES[activeIndex];
  const images = DEVICE_IMAGES[category.id] ?? [];
  const hasImages = images.length > 0;

  // Pozycja czerwonej pill — mierz przycisk aktywny względem wrappera
  useEffect(() => {
    const update = () => {
      const btn = btnRefs.current[activeIndex];
      const wrapper = wrapperRef.current;
      if (!btn || !wrapper) return;
      const w = wrapper.getBoundingClientRect();
      const b = btn.getBoundingClientRect();
      setPillStyle({
        left: b.left - w.left,
        width: b.width,
      });
    };
    update();
    const t = setTimeout(update, 50);
    window.addEventListener("resize", update);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", update);
    };
  }, [activeIndex]);

  // Reset slider on category change
  useEffect(() => {
    setSlideIndex(0);
  }, [activeIndex]);

  // Auto-play slider
  useEffect(() => {
    if (!hasImages || images.length <= 1) return;
    const t = setInterval(() => {
      setSlideIndex((i) => (i + 1) % images.length);
    }, SLIDER_INTERVAL_MS);
    return () => clearInterval(t);
  }, [activeIndex, hasImages, images.length]);

  return (
    <section className="w-full bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        {/* Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dc1e1e] px-4 py-1.5 text-sm font-semibold uppercase tracking-wider text-white">
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-white"
              aria-hidden
            />
            {BADGE_LABEL}
          </span>
          <h2 className="font-syne mt-4 text-5xl font-extrabold tracking-tight text-[#0f0f0f] sm:text-6xl">
            Najczęstsze <em className="not-italic text-[#dc1e1e]">naprawy</em>
          </h2>
          <p
            className="mx-auto mt-6 max-w-2xl text-lg text-[#666] sm:text-xl"
            style={{ lineHeight: 1.75 }}
          >
            {SUBTITLE}
          </p>
        </div>

        {/* Segmented control (iOS-style) */}
        <div className="mt-10 flex justify-center">
          <div
            ref={wrapperRef}
            className="relative inline-flex items-center gap-2 rounded-full p-2"
            style={{
              background: "#f4f4f4",
              borderRadius: "100px",
              boxShadow: "inset 0 1px 4px rgba(0,0,0,.09)",
            }}
          >
            {/* Sliding pill — pokazuj tylko gdy mamy poprawne wymiary */}
            {pillStyle.width > 0 && (
              <div
                className="absolute top-2 h-[calc(100%-16px)] rounded-full bg-[#dc1e1e] transition-all duration-300"
                style={{
                  left: pillStyle.left + 4,
                  width: pillStyle.width - 8,
                  boxShadow: "0 4px 14px rgba(220,30,30,.35)",
                  transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            )}
            {TAB_LIST.map((tab, i) => (
              <button
                key={tab.id}
                ref={(el) => {
                  btnRefs.current[i] = el;
                }}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`relative z-10 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-colors sm:px-6 sm:py-3.5 sm:text-base ${
                  activeIndex === i
                    ? "text-white"
                    : "text-[#999] hover:text-[#555]"
                }`}
              >
                <span className="text-lg" aria-hidden>
                  {tab.emoji}
                </span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main: left grid + right panel */}
        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_0.55fr]">
          {/* Left – Repair cards */}
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={category.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="grid gap-[14px] sm:grid-cols-2"
                style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
              >
                {category.repairs.map((repair, i) => (
                  <motion.div
                    key={repair.name}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: i * 0.07,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                    className="group relative overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white transition-all duration-300 hover:-translate-y-1.5 hover:border-[rgba(220,30,30,.2)] hover:shadow-[0_10px_28px_rgba(0,0,0,.09),0_0_28px_rgba(220,30,30,.09)]"
                    style={{
                      boxShadow: "0 1px 3px rgba(0,0,0,.06)",
                    }}
                  >
                    <div
                      className="absolute left-0 top-0 h-[3px] w-full origin-left scale-x-0 bg-[#dc1e1e] transition-transform duration-300 group-hover:scale-x-100"
                      aria-hidden
                    />
                    {repair.popular && (
                      <span
                        className="absolute right-[14px] top-[14px] rounded-full bg-[#dc1e1e] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                      >
                        Najpopularniejsza
                      </span>
                    )}
                    <div className="p-5 sm:p-6">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-[13px] bg-[#fff0f0] text-[22px] transition-all duration-300 group-hover:rotate-[-5deg] group-hover:scale-105 group-hover:bg-[#dc1e1e]"
                        style={{ fontSize: "22px" }}
                      >
                        {repair.icon}
                      </div>
                      <h3
                        className="font-syne mt-3.5 text-base font-extrabold text-[#0f0f0f] sm:text-lg"
                      >
                        {repair.name}
                      </h3>
                      <p
                        className="mt-2 line-clamp-3 text-sm text-[#666] sm:text-base"
                        style={{ lineHeight: 1.65 }}
                      >
                        {repair.desc}
                      </p>
                      <span
                        className="mt-4 inline-block rounded-full border px-3 py-1.5 text-xs font-semibold text-[#dc1e1e]"
                        style={{
                          background: "#fff5f5",
                          border: "1px solid rgba(220,30,30,.13)",
                        }}
                      >
                        {repair.tag}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
            <div
              className="mt-6 flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-base font-bold text-[#333] sm:text-lg"
              style={{
                background: "linear-gradient(135deg, #fff8f8 0%, #fff0f0 100%)",
                borderColor: "rgba(220,30,30,.25)",
                boxShadow: "0 2px 12px rgba(220,30,30,.08)",
              }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-lg font-bold text-green-600" aria-hidden>✓</span>
              {DEVICE_NOTE}
            </div>
          </div>

          {/* Right – Device panel */}
          <div className="flex min-w-0 flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={category.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="sticky top-20 flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border border-[#e8e8e8] p-6 sm:p-8"
                style={{
                  background: "linear-gradient(160deg, #fafafa, #f4f4f4)",
                  borderWidth: "1.5px",
                }}
              >
                <div
                  className="absolute left-0 top-0 h-[3px] w-full bg-[#dc1e1e]"
                  style={{
                    background:
                      "linear-gradient(90deg, #dc1e1e, rgba(220,30,30,.7))",
                  }}
                  aria-hidden
                />
                {/* Slider zdjęć urządzeń — większy, czystszy wygląd */}
                <div
                  className="relative overflow-hidden rounded-2xl border border-[#eee] bg-[#fafafa] px-6 py-8 sm:px-8 sm:py-10"
                  style={{
                    boxShadow: "0 1px 0 rgba(255,255,255,.8) inset, 0 4px 24px rgba(0,0,0,.06)",
                  }}
                >
                  {hasImages ? (
                    <>
                      <div className="relative h-[220px] sm:h-[260px]">
                        {images.map((src, i) => (
                          <div
                            key={src}
                            className="absolute inset-0 flex items-center justify-center transition-all duration-[450ms]"
                            style={{
                              opacity: slideIndex === i ? 1 : 0,
                              transform:
                                slideIndex === i
                                  ? "scale(1) translateY(0)"
                                  : "scale(0.96) translateY(6px)",
                              transitionTimingFunction:
                                "cubic-bezier(0.34, 1.56, 0.64, 1)",
                            }}
                          >
                            <img
                              src={src}
                              alt=""
                              className="h-full w-auto max-h-[200px] object-contain sm:max-h-[240px]"
                              style={{
                                filter: "drop-shadow(0 12px 32px rgba(0,0,0,.12))",
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      {images.length > 1 && (
                        <div className="mt-5 flex justify-center gap-2">
                          {images.map((_, i) => (
                            <span
                              key={i}
                              className="h-1 rounded-full transition-all duration-200"
                              style={{
                                width: slideIndex === i ? 20 : 6,
                                backgroundColor:
                                  slideIndex === i ? "#dc1e1e" : "#ddd",
                              }}
                              aria-hidden
                            />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex h-[220px] items-center justify-center text-[#999]">
                      {category.deviceName}
                    </div>
                  )}
                </div>
                <h3
                  className="font-syne mt-5 text-[19px] font-extrabold text-[#0f0f0f]"
                  style={{ fontWeight: 800 }}
                >
                  {category.deviceName}
                </h3>
                <p
                  className="mt-2 text-sm text-[#666] sm:text-base"
                  style={{ lineHeight: 1.65 }}
                >
                  {category.deviceDescription}
                </p>
                <div
                  className="my-5 h-px w-full bg-gradient-to-r from-transparent via-[#e0e0e0] to-transparent"
                  aria-hidden
                />
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: [1, 1.03, 1],
                  }}
                  transition={{
                    opacity: { duration: 0.4, delay: 0.1 },
                    y: { duration: 0.4, delay: 0.1 },
                    scale: {
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                  className="text-sm font-bold uppercase tracking-wider text-[#dc1e1e] sm:text-base"
                  style={{ letterSpacing: "0.08em" }}
                >
                  {BRANDS_HEADING}
                </motion.p>
                <div className="mt-4 flex-1 grid grid-cols-2 gap-3 sm:gap-4">
                  {category.brands.map((name) => (
                    <BrandLogoCell key={name} name={name} />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h3 className="font-syne text-2xl font-extrabold text-[#0f0f0f] sm:text-3xl">
            {CTA_TITLE}
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-[#666] sm:text-lg">
            {CTA_SUBTITLE}
          </p>
          <Link
            href="/zgloszenie"
            className="mt-6 inline-flex items-center gap-2 rounded-[13px] bg-[#dc1e1e] px-10 py-4 text-lg font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02]"
            style={{
              boxShadow: "0 4px 20px rgba(220,30,30,.32)",
            }}
          >
            <span aria-hidden>📋</span>
            {CTA_BUTTON}
          </Link>
        </div>
      </div>
    </section>
  );
}
