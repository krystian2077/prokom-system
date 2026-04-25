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

/** Zdjęcia urządzeń z /public/images/urzadzenia/ i /urzadzenia2 (telefony) — po kategoriach (slider) */
const DEVICE_IMAGES: Record<string, string[]> = {
  telefony: [
    "/images/urzadzenia2/iphone.png",
    "/images/urzadzenia2/Samsung.png",
    "/images/urzadzenia2/motorola.png",
    "/images/urzadzenia2/xiaomi.png",
    "/images/urzadzenia2/realme.png",
  ],
  laptopy: [
    "/images/urzadzenia2/dell.png",
    "/images/urzadzenia2/hp.png",
    "/images/urzadzenia2/lenovo.png",
    "/images/urzadzenia2/macbook.png",
  ],
  tablety: [
    "/images/urzadzenia2/galaxy-tab.png",
    "/images/urzadzenia2/ipadjpg.png",
    "/images/urzadzenia2/lenovo-tablet.png",
    "/images/urzadzenia2/tablet-microsoft.png",
  ],
  komputery: [
    "/images/urzadzenia2/dell-komputeri.png",
    "/images/urzadzenia2/lenovo-komputer.png",
    "/images/urzadzenia2/msi-komputer.png",
    "/images/urzadzenia2/asus-komputer.png",
  ],
  drukarki: [
    "/images/urzadzenia2/brotherjpg.png",
    "/images/urzadzenia2/canon.png",
    "/images/urzadzenia2/hp-drukarka.png",
    "/images/urzadzenia2/epson.png",
  ],
  konsole: [
    "/images/urzadzenia2/xbox.png",
    "/images/urzadzenia2/playstation.png",
    "/images/urzadzenia2/nintendojpg.png",
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
        desc: "Pęknięty ekran, brak obrazu lub martwy dotyk — wymieniamy wyświetlacz na wysokiej jakości część. Gwarantujemy dopasowanie i test dotyku po montażu.",
        tag: "Naprawa w 1h",
        popular: true,
      },
      {
        icon: "🔋",
        name: "Wymiana baterii",
        desc: "Telefon szybko się rozładowuje lub grzeje — wymieniamy baterię i przywracamy stabilną pracę. Po wymianie wykonujemy kalibrację i sprawdzamy temperatury.",
        tag: "Nowa bateria",
      },
      {
        icon: "⚡",
        name: "Naprawa portu ładowania",
        desc: "Telefon nie ładuje się lub kabel wypada — naprawiamy port USB‑C lub Lightning. W razie potrzeby wymieniamy także elementy złącza i poprawiamy lutowania.",
        tag: "USB-C / Lightning",
      },
      {
        icon: "🔧",
        name: "Klapka baterii",
        desc: "Pęknięte klapki baterii lub tylne plecki — wymieniamy uszkodzone elementy i dopasowujemy obudowę. Dbamy o szczelne spasowanie i poprawne zamocowanie klapki.",
        tag: "Naprawa klapki",
      },
      {
        icon: "🔊",
        name: "Naprawa głośnika / mikrofonu",
        desc: "Cichy dźwięk lub problemy w rozmowach — naprawiamy głośnik i mikrofon. Testujemy jakość dźwięku przed oddaniem urządzenia.",
        tag: "Audio / mikrofon",
      },
      {
        icon: "💧",
        name: "Naprawa po zalaniu",
        desc: "Kontakt z wodą lub cieczą — czyścimy elektronikę i diagnozujemy usterkę. Działamy szybko, żeby ograniczyć skutki korozji.",
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
        desc: "Pęknięty ekran, linie lub brak obrazu — wymieniamy matrycę i przywracamy jakość obrazu. Dobieramy parametry matrycy do modelu i sprawdzamy działanie w różnych trybach.",
        tag: "Nowa matryca",
      },
      {
        icon: "🔋",
        name: "Wymiana baterii",
        desc: "Laptop działa tylko na zasilaczu lub szybko traci energię — wymieniamy baterię. Po montażu weryfikujemy utrzymanie zasilania i stan ogniw.",
        tag: "Nowa bateria",
        popular: true,
      },
      {
        icon: "❄️",
        name: "Czyszczenie układu chłodzenia",
        desc: "Przegrzewanie i hałas wentylatora — czyścimy układ chłodzenia i wymieniamy pastę termiczną. Wykonujemy test temperatur pod obciążeniem.",
        tag: "Cisza i chłód",
      },
      {
        icon: "⚡",
        name: "Naprawa gniazda zasilania",
        desc: "Zasilanie przerywa lub wtyczka się luzuje — naprawiamy lub wymieniamy gniazdo zasilania. Sprawdzamy też przewody i punkty lutowane.",
        tag: "Gniazdo DC",
      },
      {
        icon: "⌨️",
        name: "Wymiana klawiatury",
        desc: "Klawisze nie działają lub klawiatura była zalana — wymieniamy moduł na nowy. Czyścimy wnętrze i sprawdzamy taśmy oraz sterowanie.",
        tag: "Nowa klawiatura",
      },
      {
        icon: "🖥️",
        name: "Naprawa płyty głównej",
        desc: "Laptop nie startuje lub nie wykrywa podzespołów — diagnozujemy i naprawiamy płytę główną. Usuwamy usterki na poziomie komponentów i testujemy stabilność działania.",
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
        desc: "Pęknięty ekran lub brak reakcji na dotyk — wymieniamy wyświetlacz. Kalibrujemy dotyk, aby działał precyzyjnie.",
        tag: "Nowy ekran",
        popular: true,
      },
      {
        icon: "🔋",
        name: "Wymiana baterii",
        desc: "Tablet szybko się rozładowuje lub nie włącza — instalujemy nową baterię. Po wymianie sprawdzamy ładowanie i czas pracy.",
        tag: "Nowa bateria",
      },
      {
        icon: "⚡",
        name: "Naprawa portu ładowania",
        desc: "Tablet nie ładuje się stabilnie — naprawiamy port ładowania. W razie potrzeby poprawiamy złącze i lutowania.",
        tag: "Port ładowania",
      },
      {
        icon: "🔘",
        name: "Naprawa przycisków",
        desc: "Przycisk zasilania lub głośności nie działa — naprawiamy moduł przycisków. Testujemy działanie przycisków po montażu.",
        tag: "Przyciski",
      },
      {
        icon: "📷",
        name: "Naprawa aparatu",
        desc: "Aparat nie robi zdjęć lub kamera działa źle — naprawiamy moduł aparatu. Korygujemy ostrość i weryfikujemy działanie w aplikacji.",
        tag: "Kamera",
      },
      {
        icon: "💧",
        name: "Naprawa po zalaniu",
        desc: "Kontakt z wodą lub cieczą — czyścimy elektronikę i robimy pełną diagnostykę. Usuwamy skutki wilgoci i sprawdzamy funkcje urządzenia.",
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
        icon: "⚙️",
        name: "Instalacja sterowników / Aktualizacja BIOSU",
        desc: "Instalujemy sterowniki i aktualizujemy BIOS/UEFI, żeby poprawić stabilność oraz działanie podzespołów. Aktualizacje wykonujemy w bezpiecznej procedurze i weryfikujemy komputer po restarcie.",
        tag: "Sterowniki / BIOS",
      },
      {
        icon: "💾",
        name: "Wymiana dysku SSD / HDD",
        desc: "System działa wolno lub się zawiesza — instalujemy szybki dysk i poprawiamy wydajność. Przenosimy system lub przygotowujemy konfigurację pod Twoje pliki.",
        tag: "Szybszy komputer",
        popular: true,
      },
      {
        icon: "🖥️",
        name: "Naprawa płyty głównej",
        desc: "Brak startu lub problemy z wykryciem podzespołów — naprawiamy płytę główną. Wykonujemy testy komponentów i przywracamy poprawną pracę.",
        tag: "Diagnostyka",
      },
      {
        icon: "❄️",
        name: "Czyszczenie komputera",
        desc: "Kurz w obudowie powoduje przegrzewanie — czyścimy komputer i weryfikujemy temperatury. W razie potrzeby wymieniamy pastę dla lepszego chłodzenia.",
        tag: "Konserwacja",
      },
      {
        icon: "🪟",
        name: "Reinstalacja systemu Windows",
        desc: "Reinstalacja systemu usuwa błędy i przywraca sprawne działanie komputera. Sprawdzamy też podstawowe ustawienia i konfigurujemy system pod Twoje potrzeby.",
        tag: "Windows",
      },
      {
        icon: "🧠",
        name: "Rozbudowa pamięci RAM",
        desc: "Komputer zwalnia przy wielu aplikacjach — zwiększamy RAM dla lepszej płynności. Sprawdzamy kompatybilność modułów i stabilność systemu.",
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
        desc: "Zacięcia lub brak poboru kartek — naprawiamy podajnik i wymieniamy zużyte rolki. Regulujemy mechanikę, żeby druk przebiegał bez przerw.",
        tag: "Zacięcia papieru",
        popular: true,
      },
      {
        icon: "🖋️",
        name: "Naprawa głowicy drukującej",
        desc: "Braki kolorów lub linie — czyścimy lub wymieniamy głowicę drukującą. Wykonujemy test wydruków po serwisie.",
        tag: "Pełne kolory",
      },
      {
        icon: "⚡",
        name: "Naprawa zasilacza",
        desc: "Drukarka nie włącza się lub przerywa — diagnozujemy układ zasilania. Sprawdzamy też elementy przewodzące i stabilność pracy.",
        tag: "Diagnostyka",
      },
      {
        icon: "✨",
        name: "Czyszczenie i konserwacja drukarki",
        desc: "Spadek jakości druku lub zabrudzenia — wykonujemy czyszczenie i konserwację. Czyścimy tor druku i wykonujemy kalibrację jakości.",
        tag: "Konserwacja",
      },
      {
        icon: "🖨️",
        name: "Naprawa mechanizmu drukującego",
        desc: "Drukarka hałasuje lub przestaje pracować — naprawiamy mechanizm drukujący. Wymieniamy elementy eksploatacyjne, jeśli są zużyte.",
        tag: "Mechanizm",
      },
      {
        icon: "📄",
        name: "Wymiana rolek pobierających papier",
        desc: "Drukarka pobiera kilka kartek naraz — wymieniamy rolki. Korygujemy ustawienia, aby papier pobierał się pojedynczo.",
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
        desc: "Konsola przegrzewa się lub głośno pracuje — czyścimy chłodzenie i wymieniamy pastę. Testujemy temperatury i sprawność wentylatora po serwisie.",
        tag: "Czyszczenie",
        popular: true,
      },
      {
        icon: "📡",
        name: "Naprawa portu HDMI",
        desc: "Brak obrazu z konsoli na TV — naprawiamy lub wymieniamy port HDMI. Sprawdzamy sygnał i stabilność po podłączeniu.",
        tag: "HDMI",
      },
      {
        icon: "⚡",
        name: "Naprawa zasilania",
        desc: "Konsola nie uruchamia się lub się wyłącza — diagnozujemy i naprawiamy zasilanie. Weryfikujemy elementy zasilacza i zabezpieczenia.",
        tag: "Zasilanie",
      },
      {
        icon: "💿",
        name: "Naprawa napędu",
        desc: "Konsola nie czyta płyt lub nie wysuwa nośnika — naprawiamy napęd. Regulujemy mechanizm i sprawdzamy odczyt nośników.",
        tag: "Napęd",
      },
      {
        icon: "💾",
        name: "Wymiana dysku",
        desc: "Za mało miejsca lub problemy z dyskiem — instalujemy nowy dysk. Konfigurujemy urządzenie i przenosimy dane, jeśli to możliwe.",
        tag: "Nowy dysk",
      },
      {
        icon: "❄️",
        name: "Naprawa przegrzewania",
        desc: "Konsola wyłącza się podczas gry — naprawiamy układ chłodzenia. Upewniamy się, że system utrzymuje właściwe temperatury w trakcie rozgrywki.",
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
    <section className="w-full bg-white py-12 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        {/* Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold uppercase tracking-wider text-white">
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-white"
              aria-hidden
            />
            {BADGE_LABEL}
          </span>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-dark xs:text-3xl sm:text-4xl lg:text-5xl">
            Najczęstsze <span className="text-primary">naprawy</span>
          </h2>
          <p
            className="mx-auto mt-4 max-w-2xl text-sm text-[#666] sm:mt-6 sm:text-lg lg:text-xl"
            style={{ lineHeight: 1.75 }}
          >
            {SUBTITLE}
          </p>
        </div>

        {/* Segmented control (iOS-style) — na mobile przewijanie w poziomie */}
        <div className="most-common-tabs-scroll mt-10 flex justify-start overflow-x-auto px-1 pb-2 sm:justify-center sm:overflow-visible sm:px-0 sm:pb-0" style={{ WebkitOverflowScrolling: "touch" }}>
          <div
            ref={wrapperRef}
            className="relative inline-flex min-w-max flex-shrink-0 items-center gap-2 rounded-full p-2 sm:min-w-0"
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
                className={`relative z-10 flex shrink-0 items-center gap-2 rounded-full px-4 py-3 text-sm font-medium transition-colors sm:px-6 sm:py-3.5 sm:text-base ${
                  activeIndex === i
                    ? "text-white"
                    : "text-[#999] hover:text-[#555]"
                }`}
              >
                <span className="text-base sm:text-lg" aria-hidden>
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
                className="max-sm:flex max-sm:overflow-x-auto max-sm:snap-x max-sm:snap-mandatory max-sm:gap-5 max-sm:pb-4 max-sm:-mx-4 max-sm:px-4 max-sm:[scrollbar-width:none] grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-[14px]"
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
                    className="group relative overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[rgba(220,30,30,.2)] hover:shadow-[0_10px_28px_rgba(0,0,0,.09),0_0_28px_rgba(220,30,30,.09)] max-sm:min-w-[280px] max-sm:max-w-[85vw] max-sm:snap-center max-sm:flex-shrink-0 max-lg:rounded-[20px] max-lg:border-[#f0f0f0] max-lg:shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)]"
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
                      <div className="p-6">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-[13px] bg-[#fff0f0] text-[22px] transition-all duration-300 group-hover:rotate-[-5deg] group-hover:scale-105 group-hover:bg-[#dc1e1e]"
                        style={{ fontSize: "22px" }}
                      >
                        {repair.icon}
                      </div>
                      <h3
                        className="mt-3.5 text-lg font-bold text-dark sm:text-xl"
                        style={{ lineHeight: 1.25 }}
                      >
                        {repair.name}
                      </h3>
                      <p
                        className="mt-2 text-sm text-[#666] sm:text-base"
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
              className="mt-6 flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-base font-bold text-[#333] sm:text-lg max-lg:rounded-[20px] max-lg:px-6 max-lg:py-5"
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
                className="sticky top-20 flex h-full min-h-0 flex-col p-4 sm:p-6"
              >
                <div
                  className="absolute left-0 top-0 h-[3px] w-full bg-[#dc1e1e]"
                  style={{
                    background:
                      "linear-gradient(90deg, #dc1e1e, rgba(220,30,30,.7))",
                  }}
                  aria-hidden
                />
                {/* Slider zdjęć urządzeń — przezroczyste tło, zachowany układ slidera */}
                <div className="relative overflow-hidden rounded-2xl bg-transparent px-6 py-8 sm:px-8 sm:py-10">
                  {hasImages ? (
                    <>
                      <div className="relative h-[220px] overflow-hidden sm:h-[260px]">
                        <AnimatePresence mode="wait">
                          <motion.img
                            key={images[slideIndex]}
                            src={images[slideIndex]}
                            alt=""
                            className="absolute inset-0 m-auto h-full w-auto max-h-[230px] object-contain sm:max-h-[260px]"
                            style={{
                              filter: "drop-shadow(0 18px 45px rgba(0,0,0,.28))",
                            }}
                            initial={{ opacity: 0, x: 60, scale: 0.98 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -60, scale: 0.98 }}
                            transition={{
                              duration: 0.55,
                              ease: [0.22, 0.61, 0.36, 1],
                            }}
                          />
                        </AnimatePresence>
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
                <h3 className="mt-5 text-xl font-bold text-[#111] sm:text-2xl">
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
          <h3 className="mt-4 text-4xl font-extrabold tracking-tight text-dark sm:text-5xl max-lg:text-2xl">
            {CTA_TITLE}
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-neutral max-lg:text-sm max-lg:mt-2" style={{ lineHeight: 1.6 }}>
            {CTA_SUBTITLE}
          </p>
          <Link
            href="/zgloszenie"
            className="mt-6 inline-flex items-center gap-2 rounded-[13px] bg-[#dc1e1e] px-10 py-4 text-lg font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] max-lg:w-full max-lg:justify-center max-lg:rounded-[16px] max-lg:py-[14px] max-lg:text-base max-lg:shadow-[0_4px_20px_rgba(220,30,30,0.28)]"
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
