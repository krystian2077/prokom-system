"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const SECTION_IDS = ["telefony", "laptopy", "tablety", "komputery", "drukarki", "konsole"] as const;
const CAT_LABELS: Record<(typeof SECTION_IDS)[number], string> = {
  telefony: "Telefony",
  laptopy: "Laptopy",
  tablety: "Tablety",
  komputery: "Komputery",
  drukarki: "Drukarki",
  konsole: "Konsole",
};

/* -------- Inline SVG -------- */
function IconChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

/* -------- Image map: spec name → actual file in public/images/naprawy -------- */
const IMG = {
  "naprawa-telefon.jpg": "/images/naprawy/naprawa-telefon.jpg",
  "naprawa-telefon2.jpg": "/images/naprawy/naprawa-telefon-wymiana-wyświetlacza.jpg",
  "naprawa-telefon3.jpg": "/images/naprawy/naprawa-telefon-bateria.jpg",
  "naprawa-telefon-klapka.jpg": "/images/naprawy/naprawa-telefon-wymiana-tylnej-klapki.jpg",
  "naprawa-laptop.jpg": "/images/naprawy/naprawa-laptop4.jpg",
  "naprawa-laptop2.jpg": "/images/naprawy/naprawa-laptop3jpg.jpg",
  "naprawa-tablet_.jpg": "/images/naprawy/naprawa-tablet_.jpg",
  "naprawa-tablet2.jpg": "/images/naprawy/naprawa-tablet2jpg.jpg",
  "naprawa-tablet3.jpg": "/images/naprawy/naprawa-tablet3.jpg",
  "naprawa-komputer.jpg": "/images/naprawy/naprawa-komputer3.jpg",
  "naprawa-komputer2.jpg": "/images/naprawy/naprawa-komputer2.jpg",
  "naprawa-drukarki.jpg": "/images/naprawy/naprawa-drukarki.jpg",
  "naprawa-drukarki2.jpg": "/images/naprawy/naprawa-drukarki2.jpg",
  "naprawa-drukarki3.jpg": "/images/naprawy/naprawa-drukarki3.jpg",
  "naprawa-konsola.jpg": "/images/naprawy/naprawa-konsola2.jpg",
  "naprawa-konsola3.jpg": "/images/naprawy/naprawa-konsola3.jpg",
} as const;

/* -------- Section data (spec) -------- */
type SectionKey = (typeof SECTION_IDS)[number];
interface RepairItem {
  name: string;
  sub: string;
}
interface SectionData {
  id: SectionKey;
  dataNum: string;
  titleWord: string;
  titleAccent: string;
  tagline: string;
  brands: string[];
  layout: "A" | "B";
  photos: { src: keyof typeof IMG; label: string; badge: string }[];
  description: string;
  blockEmoji: string;
  repairs: RepairItem[];
  cta: string;
}

const SECTIONS_DATA: SectionData[] = [
  {
    id: "telefony",
    dataNum: "01",
    titleWord: "Naprawa",
    titleAccent: "telefonów.",
    tagline:
      "Smartfon to dziś centrum życia — zdjęcia, praca, kontakty. Dlatego większość napraw kończymy jeszcze tego samego dnia.",
    brands: ["Apple iPhone", "Samsung Galaxy", "Xiaomi", "Motorola", "realme", "Huawei", "OnePlus", "Google Pixel"],
    layout: "A",
    photos: [
      { src: "naprawa-telefon.jpg", label: "Wymiana baterii", badge: "100% pojemności" },
      { src: "naprawa-telefon2.jpg", label: "Wymiana ekranu", badge: "" },
      { src: "naprawa-telefon-klapka.jpg", label: "Wymiana tylnej klapki", badge: "" },
    ],
    description:
      "Pracujemy ze smartfonami wszystkich wiodących producentów. Zanim zaczniemy naprawę, przeprowadzamy **pełną diagnostykę elektroniczną**. Używamy wyłącznie sprawdzonych części zamiennych.\n\nRozbitą szybkę wymieniamy **na oczach klienta**. Bateria traci pojemność? Przywracamy pełną żywotność. Telefon wpadł do wody? Mamy wieloletnie doświadczenie w suszeniu i przywracaniu urządzeń po zalaniu.",
    blockEmoji: "🔧",
    repairs: [
      { name: "Wymiana ekranu i szybki dotykowej", sub: "Oryginalne matryce OLED i LCD, pełna kalibracja" },
      { name: "Wymiana baterii", sub: "Akumulatory z certyfikatem, przywrócenie 100% pojemności" },
      { name: "Naprawa po zalaniu", sub: "Ultrasoniczne czyszczenie płyty, osuszanie w komorze próżniowej" },
      { name: "Złącze ładowania USB-C / Lightning", sub: "Wymiana lub lutowanie gniazda, testy prądu" },
      { name: "Głośnik, mikrofon, aparat", sub: "Diagnostyka i wymiana modułów audio i kamery" },
      { name: "Naprawa obudowy i tylnej szybki", sub: "Wymiana tylnego panelu, prostowanie ramy aluminiowej" },
    ],
    cta: "Zgłoś telefon do serwisu",
  },
  {
    id: "laptopy",
    dataNum: "02",
    titleWord: "Naprawa",
    titleAccent: "laptopów.",
    tagline:
      "Laptop to narzędzie pracy. Awaria w złym momencie kosztuje więcej niż tylko pieniądze. Diagnozujemy precyzyjnie — naprawiamy trwale.",
    brands: ["Dell", "Lenovo", "HP", "ASUS", "Acer", "Apple MacBook", "MSI", "Toshiba"],
    layout: "B",
    photos: [
      { src: "naprawa-laptop.jpg", label: "Wymiana komponentów", badge: "BGA · Lutowanie" },
      { src: "naprawa-laptop2.jpg", label: "Wymiana SSD / RAM", badge: "" },
    ],
    description:
      "Każdy model laptopa ma inną architekturę termiczną i inne złącza. Nasi technicy znają specyfikę dziesiątek modeli z pierwszej ręki.\n\nPęknięta matryca, zasilacz, zalana klawiatura — robimy to na co dzień. **Lutowanie BGA**, wymiana chipów graficznych, regeneracja gniazd DC. Jeśli inny serwis powiedział, że się nie da — przynieś do nas.",
    blockEmoji: "💻",
    repairs: [
      { name: "Wymiana matrycy LCD / IPS / OLED", sub: "Full HD, QHD i 4K, w tym panele dotykowe" },
      { name: "Wymiana klawiatury", sub: "Oryginalne klawiatury z podświetleniem, pojedyncze klawisze" },
      { name: "Rozbudowa RAM i upgrade SSD", sub: "DDR4/DDR5, NVMe PCIe 4.0, migracja danych" },
      { name: "Naprawa gniazda zasilania DC", sub: "Lutowanie, wymiana gniazda, diagnostyka zasilania" },
      { name: "Naprawa płyty głównej", sub: "Lutowanie BGA, naprawa sekcji VRM" },
      { name: "Czyszczenie i pasta termalna", sub: "Demontaż radiatora, wymiana pasty, redukcja temperatury" },
    ],
    cta: "Zgłoś laptopa do serwisu",
  },
  {
    id: "tablety",
    dataNum: "03",
    titleWord: "Naprawa",
    titleAccent: "tabletów.",
    tagline:
      "Tablety łączą precyzję smartfona ze złożonością laptopa. Cienka obudowa i miniaturowe podzespoły wymagają wyjątkowej dbałości.",
    brands: ["Apple iPad", "Samsung Galaxy Tab", "Lenovo", "Xiaomi", "Huawei", "Microsoft Surface"],
    layout: "A",
    photos: [
      { src: "naprawa-tablet_.jpg", label: "Serwis tabletu", badge: "Precyzja" },
      { src: "naprawa-tablet2.jpg", label: "Wymiana baterii", badge: "" },
      { src: "naprawa-tablet3.jpg", label: "Diagnostyka", badge: "" },
    ],
    description:
      "iPad z pękniętym ekranem, Galaxy Tab z martwym digitizerem, Surface Pro — serwisujemy je wszystkie. Każdy tablet po naprawie przechodzi **pełne testy**: dotyk, kolory, ładowanie.\n\nPrecyzyjne narzędzia i oryginalne panele. Wymiana digitizera, baterii czy gniazda ładowania — dokładnie to oferujemy.",
    blockEmoji: "📟",
    repairs: [
      { name: "Wymiana ekranu i digitizera", sub: "Oryginalne panele z certyfikatem, precyzyjne laminowanie" },
      { name: "Wymiana baterii", sub: "Ogniwa z gwarancją pojemności, ostrożny demontaż" },
      { name: "Naprawa po zalaniu", sub: "Czyszczenie ultradźwiękami, diagnostyka korozji" },
      { name: "Złącze ładowania i USB", sub: "USB-C, Lightning, Smart Connector" },
      { name: "Naprawa obudowy i tylnego panelu", sub: "Prostowanie, wymiana pokrywy, przyciski" },
      { name: "Aktualizacja i przywrócenie systemu", sub: "Reset fabryczny, reinstalacja iPadOS / Android" },
    ],
    cta: "Zgłoś tablet do serwisu",
  },
  {
    id: "komputery",
    dataNum: "04",
    titleWord: "Naprawa",
    titleAccent: "komputerów.",
    tagline:
      "Komputer stacjonarny czy All-in-One — diagnozujemy usterki sprzętowe i programowe, wymieniamy podzespoły i przywracamy dane z uszkodzonych dysków.",
    brands: ["Lenovo", "HP", "Dell", "MSI", "Gigabyte", "ASUS", "Składaki PC"],
    layout: "B",
    photos: [
      { src: "naprawa-komputer.jpg", label: "Serwis komputera", badge: "Diagnostyka" },
      { src: "naprawa-komputer2.jpg", label: "Profesjonalna diagnostyka", badge: "" },
    ],
    description:
      "Komputer nie startuje, ekran się nie włącza, system zawiesza — dziesiątki przyczyn. Zaczynamy od systematycznej diagnostyki: zasilacz, RAM, dysk, płyta główna, CPU/GPU.\n\nNaprawy sprzętowe i oprogramowanie. Reinstalacja systemu, usuwanie malware, **odzysk danych z uszkodzonego dysku** — wykonujemy to regularnie i skutecznie.",
    blockEmoji: "🖥",
    repairs: [
      { name: "Wymiana i rozbudowa RAM", sub: "DDR3 / DDR4 / DDR5, dual channel" },
      { name: "Wymiana dysku HDD / SSD", sub: "Klonowanie systemu, NVMe i SATA" },
      { name: "Naprawa zasilacza ATX", sub: "Diagnoza, wymiana kondensatorów lub jednostki" },
      { name: "Naprawa płyty głównej", sub: "Lutowanie SMD, naprawa VRM" },
      { name: "Instalacja i konfiguracja systemu", sub: "Windows 10/11, sterowniki, usuwanie malware" },
      { name: "Odzyskiwanie danych", sub: "Uszkodzone HDD, skasowane partycje" },
    ],
    cta: "Zgłoś komputer do serwisu",
  },
  {
    id: "drukarki",
    dataNum: "05",
    titleWord: "Naprawa",
    titleAccent: "drukarek.",
    tagline:
      "Drukarka, która przestała działać w połowie dokumentu — to kłopot. Serwisujemy drukarki biurowe i domowe wszystkich typów i producentów.",
    brands: ["Brother", "Epson", "Canon", "HP", "Kyocera", "Xerox"],
    layout: "A",
    photos: [
      { src: "naprawa-drukarki.jpg", label: "Serwis drukarki", badge: "Atrament · Laser" },
      { src: "naprawa-drukarki2.jpg", label: "Elektronika", badge: "" },
      { src: "naprawa-drukarki3.jpg", label: "Naprawa", badge: "" },
    ],
    description:
      "Drukarki atramentowe, laserowe, termiczne, wielofunkcyjne — znamy podajniki, optykę skanera i elektronikę. Naprawiamy uszkodzone podajniki, resetujemy liczniki, przywracamy jakość wydruku.\n\nPo serwisie konfigurujemy drukarkę w sieci lub WiFi. **Każda naprawa kończy się próbnym wydrukiem** i weryfikacją kolorów.",
    blockEmoji: "🖨",
    repairs: [
      { name: "Czyszczenie i regeneracja głowic", sub: "Głębokie czyszczenie, test dysz, kalibracja kolorów" },
      { name: "Naprawa podajnika i mechanizmu papieru", sub: "Wałki, separatory, tory papieru" },
      { name: "Wymiana fusera i bębna (laser)", sub: "Oryginalne zestawy, reset licznika" },
      { name: "Reset licznika stron / waste ink", sub: "Profesjonalne oprogramowanie serwisowe" },
      { name: "Naprawa skanera i ADF", sub: "Kalibracja skanera, naprawa automatycznego podajnika" },
      { name: "Konfiguracja sieci WiFi / LAN", sub: "Podłączenie firmowe, skanowanie do folderu, e-mail" },
    ],
    cta: "Zgłoś drukarkę do serwisu",
  },
  {
    id: "konsole",
    dataNum: "06",
    titleWord: "Naprawa",
    titleAccent: "konsol.",
    tagline:
      "PlayStation, Xbox, Nintendo Switch — naprawiamy konsole z taką samą starannością jak laptopy i telefony. Bo zepsuta konsola to też ważna sprawa.",
    brands: ["PS4", "PS5", "Xbox One", "Xbox Series X|S", "Nintendo Switch"],
    layout: "B",
    photos: [
      { src: "naprawa-konsola.jpg", label: "Serwis konsoli", badge: "HDMI · Pasta" },
      { src: "naprawa-konsola3.jpg", label: "Naprawa elektroniki", badge: "" },
    ],
    description:
      "Konsole gromadzą kurz, przegrzewają się, a ich napędy optyczne mają ograniczoną żywotność. Regularnie czyścimy PS4 i PS5, wymieniamy pastę termiczną i naprawiamy układy zasilania odpowiadające za **nagłe wyłączenia konsoli**.\n\nZłącze HDMI w PlayStation — wymiana gniazda to mikrolutowanie pod mikroskopem. Naprawiamy też **drift joysticków** w padach DualSense i Joy-Con.",
    blockEmoji: "🎮",
    repairs: [
      { name: "Wymiana napędu optycznego", sub: "Oryginalne napędy PS4/PS5/Xbox, kalibracja laserowa" },
      { name: "Naprawa złącza HDMI", sub: "Wymiana gniazda pod mikroskopem, testy 4K/120Hz" },
      { name: "Czyszczenie i pasta termalna", sub: "Thermal Grizzly, redukcja temperatury −15°C" },
      { name: "Naprawa dryftu joysticka", sub: "Wymiana modułów analogowych DualSense i Joy-Con" },
      { name: "Naprawa płyty głównej", sub: "Diagnostyka APU, naprawa sekcji zasilania, po przepięciu" },
      { name: "Wymiana i naprawa pada", sub: "DualSense, DualShock 4, Xbox Series, Joy-Con — baterie i przyciski" },
    ],
    cta: "Zgłoś konsolę do serwisu",
  },
];

const GUARANTEE_ITEMS: { emoji: string; titlePrefix: string; titleAccent: string; desc: string }[] = [
  { emoji: "🛡️", titlePrefix: "Gwarancja na każdą ", titleAccent: "naprawę", desc: "Minimum 3 miesiące na każdą wykonaną usługę. Wymienione części do 6 miesięcy. Bez ukrytych warunków." },
  { emoji: "⚡", titlePrefix: "Diagnostyka tego samego ", titleAccent: "dnia", desc: "Zostawiasz sprzęt rano — jeszcze tego samego dnia wiesz, co się stało i ile kosztuje naprawa." },
  { emoji: "📦", titlePrefix: "Oryginalne i certyfikowane ", titleAccent: "części", desc: "Używamy wyłącznie sprawdzonych zamienników i oryginalnych podzespołów od zaufanych dostawców." },
  { emoji: "🚚", titlePrefix: "Wysyłka kurierem w obie ", titleAccent: "strony", desc: "Nie możesz przyjechać? Wyślij sprzęt kurierem. Odsyłamy naprawiony sprzęt na terenie całej Polski." },
];

export function UslugiContent() {
  const [activeCat, setActiveCat] = useState<SectionKey | null>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const id = e.target.id as SectionKey;
          if (SECTION_IDS.includes(id)) setActiveCat(id);
        });
      },
      { threshold: 0.35 }
    );
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.07 }
    );
    document.querySelectorAll(".uslugi-page .reveal, .uslugi-page .reveal-left, .uslugi-page .reveal-right").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="uslugi-page bg-[var(--bg)]" style={{ fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif" }}>
      {/* Hero + Stats Bar — jeden ciemny blok, zawartość w tej samej kolumnie (max-width), jak na zdjęciu */}
      <section className="relative pt-14 pb-0 lg:pt-20 lg:pb-0" style={{ background: "var(--dark)" }}>
        <div className="absolute inset-0 pointer-events-none opacity-[0.012]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.012) 1px, transparent 1px)", backgroundSize: "80px 80px", maskImage: "radial-gradient(ellipse 90% 70% at 60% 40%, black 20%, transparent 100%)" }} aria-hidden />
        <div className="absolute -right-10 -top-20 h-[700px] w-[700px] pointer-events-none rounded-full" style={{ background: "radial-gradient(ellipse, rgba(220,30,30,.06), transparent 65%)" }} aria-hidden />
        <div className="relative mx-auto max-w-[1300px] px-5 md:px-8 lg:px-[52px]">
          {/* Hero: 2 kolumny — tekst | collage */}
          <div className="grid grid-cols-1 items-end gap-14 pb-12 pt-6 lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:pb-14 lg:pt-8">
            <div>
              <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.72)" }}>
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--red)] ring-pulse-dot" aria-hidden />
                PROFESJONALNY SERWIS ELEKTRONIKI
              </p>
              <h1 className="text-[clamp(48px,6.8vw,100px)] font-black leading-[1.2] tracking-[-0.058em] text-white" style={{ fontFamily: "var(--font-unbounded)" }}>
                Usługi <span style={{ color: "var(--red)" }}>serwisowe.</span>
              </h1>
              <p className="mt-5 max-w-[420px] text-[15.5px] leading-[1.82]" style={{ color: "rgba(255,255,255,0.78)" }}>
                Kompleksowa naprawa elektroniki użytkowej i biurowej. Każde urządzenie trafia w ręce doświadczonego technika.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {SECTION_IDS.map((id) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="group flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-medium transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--red)] hover:bg-[var(--red)] hover:text-white hover:shadow-[0_4px_14px_rgba(220,30,30,.35)]"
                    style={{ borderColor: "rgba(255,255,255,.15)", background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,0.82)" }}
                  >
                    <span className="inline-block transition-transform duration-200 group-hover:scale-125" aria-hidden>{(id === "telefony" && "📱") || (id === "laptopy" && "💻") || (id === "tablety" && "📟") || (id === "komputery" && "🖥") || (id === "drukarki" && "🖨") || (id === "konsole" && "🎮")}</span>
                    {CAT_LABELS[id]}
                  </a>
                ))}
              </div>
            </div>
            <div className="hidden flex-col pt-6 lg:flex lg:pt-6 lg:self-stretch">
              <div className="grid min-h-[360px] grid-cols-2 grid-rows-[1.4fr_1fr] gap-1.5 overflow-hidden rounded-[20px] lg:min-h-[500px] [&_.hero-photo]:transition-all [&_.hero-photo]:duration-700 [&_div:hover_.hero-photo]:scale-[1.07] [&_div:hover_.hero-photo]:saturate-[0.85] [&_div:hover_.hero-photo]:brightness-[0.82]">
                <div className="relative col-span-1 row-span-2 overflow-hidden rounded-l-[20px]">
                  <Image src={IMG["naprawa-telefon.jpg"]} alt="Naprawa telefonu" fill className="hero-photo object-cover" style={{ filter: "saturate(.45) brightness(.55)" }} sizes="50vw" />
                  <div className="absolute inset-0 flex items-end p-4" style={{ background: "linear-gradient(to top, rgba(0,0,0,.62) 0%, rgba(0,0,0,.14) 40%, transparent 70%)" }}>
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] origin-left" style={{ color: "rgba(255,255,255,.65)", writingMode: "vertical-rl", display: "inline-block" }}>Smartfony</span>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-tr-[20px]">
                  <Image src={IMG["naprawa-laptop.jpg"]} alt="Naprawa laptopa" fill className="hero-photo object-cover" style={{ filter: "saturate(.45) brightness(.55)" }} sizes="25vw" />
                  <div className="absolute inset-0 flex items-end p-4" style={{ background: "linear-gradient(to top, rgba(0,0,0,.62) 0%, rgba(0,0,0,.14) 40%, transparent 70%)" }}>
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,.65)" }}>Laptopy</span>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-br-[20px]">
                  <Image src={IMG["naprawa-komputer.jpg"]} alt="Naprawa komputera" fill className="hero-photo object-cover" style={{ filter: "saturate(.45) brightness(.55)" }} sizes="25vw" />
                  <div className="absolute inset-0 flex items-end p-4" style={{ background: "linear-gradient(to top, rgba(0,0,0,.62) 0%, rgba(0,0,0,.14) 40%, transparent 70%)" }}>
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,.65)" }}>Komputery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Stats Bar — efekt wyspy: zaokrąglone karty z cieniem, uniesione nad tłem */}
          <div className="grid grid-cols-2 gap-3 pt-6 pb-2 lg:grid-cols-4 lg:gap-4">
            {[
              { main: "10", accent: "+", main2: "", desc: "lat doświadczenia w serwisie" },
              { main: "6", accent: "×", main2: "", desc: "kategorii urządzeń pod jednym dachem" },
              { main: "100", accent: "%", main2: "", desc: "bezpłatna diagnostyka przed wyceną" },
              { main: "3", accent: "–", main2: "6", desc: "miesiące gwarancji na każdą naprawę" },
            ].map((item, i) => (
              <div
                key={i}
                className="group relative rounded-2xl border py-6 px-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,.4)] lg:px-6"
                style={{
                  background: "rgba(255,255,255,.045)",
                  borderColor: "rgba(255,255,255,.08)",
                  boxShadow: "0 4px 20px rgba(0,0,0,.25)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,.07)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,.12)";
                  e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,.4), 0 0 0 1px rgba(220,30,30,.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,.045)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,.08)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,.25)";
                }}
              >
                <p className="text-[22px] font-black tracking-tight text-white" style={{ fontFamily: "var(--font-unbounded)" }}>
                  {item.main}
                  <span style={{ color: "var(--red)" }}>{item.accent}</span>
                  {item.main2}
                </p>
                <p className="mt-2 text-[12px] leading-[1.5] tracking-wide" style={{ color: "rgba(255,255,255,0.68)", fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif" }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CategoryBar — sticky pod PublicNavbar (h-20 = 80px), większy odstęp od Hero */}
      <div
        className="sticky top-20 z-[400] mt-12 flex flex-wrap justify-center gap-0 border-b px-4 py-0 md:mt-16 md:px-[52px]"
        style={{ background: "#fff", borderColor: "var(--border)", boxShadow: "0 2px 16px rgba(0,0,0,.05)" }}
      >
        {SECTION_IDS.map((id) => (
          <a
            key={id}
            href={`#${id}`}
            className={`flex items-center gap-2 border-b-2 px-5 py-4 text-[15px] font-medium transition-colors md:text-[16px] ${activeCat === id ? "border-[var(--red)] font-bold text-[var(--text)]" : "border-transparent text-[var(--muted)]"}`}
          >
            <span className="h-[5px] w-[5px] rounded-full transition-colors" style={{ background: activeCat === id ? "var(--red)" : "#ccc" }} />
            {CAT_LABELS[id]}
          </a>
        ))}
      </div>

      {/* Sections */}
      {SECTIONS_DATA.map((sec, idx) => {
        const isOdd = idx % 2 === 0;
        const bg = isOdd ? "#fff" : "var(--bg)";
        return (
          <div key={sec.id} role="region" id={sec.id} aria-label={sec.titleWord + " " + sec.titleAccent} className="scroll-mt-[120px]" style={{ background: bg }}>
            <div className="svc-intro reveal relative mx-auto grid max-w-[1300px] grid-cols-1 gap-12 px-5 py-16 md:px-[52px] lg:grid-cols-[1fr_auto] lg:items-end lg:gap-12 lg:px-[52px] lg:pt-[72px] lg:pb-14" data-num={sec.dataNum}>
              <div className="absolute right-[52px] top-10 pointer-events-none text-[120px] font-black text-transparent select-none max-[1100px]:text-[80px]" style={{ WebkitTextStroke: "1px rgba(0,0,0,.04)" }} aria-hidden>{sec.dataNum}</div>
              <div>
                <p className="mb-2 text-[11px] font-semibold tracking-wide" style={{ color: "var(--red)", fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif" }}>
                  — {sec.dataNum}
                </p>
                <h2 className="text-[clamp(34px,4vw,62px)] font-black leading-[0.9] tracking-[-0.04em]" style={{ fontFamily: "var(--font-unbounded)" }}>
                  <span style={{ color: "#000" }}>{sec.titleWord} </span>
                  <span style={{ color: "var(--red)" }}>{sec.titleAccent}</span>
                </h2>
                <p className="mt-4 max-w-[580px] text-[15px] leading-[1.78]" style={{ color: "var(--text2)" }}>{sec.tagline}</p>
              </div>
              <div className="flex flex-wrap justify-end gap-2.5" style={{ maxWidth: 320 }}>
                <p className="mb-3 w-full text-right text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--muted)", fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif" }}>
                  <span className="mr-1.5 inline-block h-px w-4 align-middle" style={{ background: "var(--red)" }} aria-hidden />
                  Marki
                </p>
                {sec.brands.map((b) => (
                  <span
                    key={b}
                    className="rounded-xl border-2 px-4 py-2 text-[12px] font-semibold tracking-wide transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(220,30,30,.22)]"
                    style={{ borderColor: "rgba(220,30,30,.35)", color: "var(--text)", background: "#fff", boxShadow: "0 2px 8px rgba(220,30,30,.08)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--red)";
                      e.currentTarget.style.color = "var(--red)";
                      e.currentTarget.style.background = "rgba(220,30,30,.06)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(220,30,30,.35)";
                      e.currentTarget.style.color = "var(--text)";
                      e.currentTarget.style.background = "#fff";
                    }}
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="svc-body mx-auto grid max-w-[1300px] grid-cols-1 gap-12 px-5 pb-20 md:px-[52px] lg:grid-cols-2 lg:gap-16 lg:items-start lg:pb-20" style={{ gridTemplateAreas: isOdd ? '"photos content"' : '"content photos"' }}>
              <div className="photos-col order-2 lg:order-none" style={{ gridArea: "photos" }}>
                {sec.layout === "A" ? <PhotoLayoutA photos={sec.photos} index={idx} /> : <PhotoLayoutB photos={sec.photos} index={idx} />}
              </div>
              <div className="content-col order-1 lg:order-none" style={{ gridArea: "content" }}>
                <div className="text-[15px] leading-[1.88] mb-8" style={{ color: "var(--text2)" }} dangerouslySetInnerHTML={{ __html: sec.description.replace(/\*\*(.*?)\*\*/g, "<strong style='color:var(--text);font-weight:600'>$1</strong>").replace(/\n/g, "<br />") }} />
                <RepairBlock emoji={sec.blockEmoji} repairs={sec.repairs} isEven={!isOdd} />
                <Link href="/zgloszenie" className="cta-btn group relative mt-8 inline-flex items-center gap-2 overflow-hidden rounded-[13px] px-7 py-3.5 text-[14px] font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_26px_rgba(220,30,30,.35)]" style={{ background: "var(--dark)", boxShadow: "0 3px 14px rgba(0,0,0,.14)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--red)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "var(--dark)"; }}>
                  <span className="absolute inset-0 rounded-[13px] opacity-0 transition-opacity group-hover:opacity-100" style={{ background: "linear-gradient(135deg, rgba(255,255,255,.1) 0%, transparent 60%)" }} />
                  {sec.cta}
                  <span className="transition-transform group-hover:translate-x-1"><IconChevronRight /></span>
                </Link>
              </div>
            </div>
          </div>
        );
      })}

      {/* GuaranteeStrip */}
      <section className="px-5 py-16 md:px-[52px]" style={{ background: "var(--dark)", paddingTop: 72, paddingBottom: 72 }}>
        <div className="mx-auto grid max-w-[1300px] grid-cols-1 gap-5 max-[520px]:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {GUARANTEE_ITEMS.map((item, i) => (
            <div
              key={i}
              className="reveal delay-1 relative rounded-[18px] border p-6 pb-8 transition-all hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,.3)]"
              style={{ background: "rgba(255,255,255,.025)", borderColor: "rgba(255,255,255,.055)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,.045)";
                e.currentTarget.style.borderColor = "rgba(220,30,30,.18)";
                const after = e.currentTarget.querySelector(".guarantee-after") as HTMLElement;
                if (after) after.style.opacity = "1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,.025)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,.055)";
                const after = e.currentTarget.querySelector(".guarantee-after") as HTMLElement;
                if (after) after.style.opacity = "0";
              }}
            >
              <div className="guarantee-after absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-[var(--red)] to-transparent opacity-0 transition-opacity" />
              <span className="flex h-12 w-12 items-center justify-center rounded-[13px] text-xl" style={{ background: "rgba(220,30,30,.07)", border: "1px solid rgba(220,30,30,.22)" }}>{item.emoji}</span>
              <h3 className="mt-4 text-[12.5px] font-bold leading-snug text-white" style={{ fontFamily: "var(--font-unbounded)", letterSpacing: "-0.025em" }}>{item.titlePrefix}<span style={{ color: "var(--red)" }}>{item.titleAccent}</span></h3>
              <p className="mt-2 text-[13px] leading-[1.72]" style={{ color: "#3e4255" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DarkCTA */}
      <section className="relative px-5 py-20 text-center md:px-[52px]" style={{ background: "var(--dark)", paddingTop: 88, paddingBottom: 88 }}>
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full" style={{ background: "radial-gradient(ellipse, rgba(220,30,30,.065), transparent 65%)" }} aria-hidden />
        <p className="relative text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.72)", marginBottom: 24 }}>ul. Orkana 16B · Rabka-Zdrój · Bezpłatna diagnostyka</p>
        <h2 className="relative text-[clamp(42px,6vw,80px)] font-black leading-[0.87] tracking-[-0.055em] text-white" style={{ fontFamily: "var(--font-unbounded)" }}>
          Zepsute? <span style={{ color: "var(--red)" }}>Naprawimy.</span>
        </h2>
        <p className="relative mx-auto mt-6 max-w-[500px] text-[15px] leading-[1.8] mb-10" style={{ color: "rgba(255,255,255,0.78)" }}>
          Przynieś sprzęt do serwisu, wyślij kurierem lub zadzwoń. Bezpłatna wycena, szybka realizacja, gwarancja na każdą usługę.
        </p>
        <div className="relative flex flex-wrap items-center justify-center gap-4 max-[520px]:flex-col">
          <a href="tel:883200151" className="inline-flex items-center gap-2 rounded-[13px] px-8 py-4 text-[15px] font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(220,30,30,.5)]" style={{ background: "var(--red)", boxShadow: "0 4px 20px rgba(220,30,30,.38)" }}>📞 883 200 151</a>
          <Link href="/zgloszenie" className="inline-flex items-center gap-2 rounded-[13px] border px-8 py-4 text-[15px] font-bold text-white transition-all hover:-translate-y-0.5" style={{ borderColor: "rgba(255,255,255,.12)" }}>Zgłoś naprawę online</Link>
        </div>
      </section>

    </div>
  );
}

function PhotoLayoutA({ photos, index }: { photos: SectionData["photos"]; index: number }) {
  return (
    <div className="reveal-left delay-1 grid h-[280px] grid-cols-[1.2fr_1fr] grid-rows-2 gap-1.5 overflow-hidden rounded-[20px] md:h-[360px] lg:h-[560px]">
      <div className="pla-main group relative row-span-2 overflow-hidden">
        <Image src={IMG[photos[0].src]} alt={photos[0].label} fill className="object-cover transition-all duration-700 group-hover:scale-[1.07] group-hover:saturate-100 group-hover:brightness-[1.02]" style={{ filter: "saturate(.78) brightness(.92)" }} sizes="(max-width:900px) 100vw, 50vw" />
        <PhotoOverlay label={photos[0].label} badge={photos[0].badge} />
      </div>
      <div className="pla-s1 group relative overflow-hidden">
        <Image src={IMG[photos[1].src]} alt={photos[1].label} fill className="object-cover transition-all duration-700 group-hover:scale-[1.07] group-hover:saturate-100 group-hover:brightness-[1.02]" style={{ filter: "saturate(.78) brightness(.92)" }} sizes="25vw" />
        <PhotoOverlay label={photos[1].label} badge={photos[1].badge} />
      </div>
      <div className="pla-s2 group relative overflow-hidden">
        <Image src={IMG[photos[2].src]} alt={photos[2].label} fill className="object-cover transition-all duration-700 group-hover:scale-[1.07] group-hover:saturate-100 group-hover:brightness-[1.02]" style={{ filter: "saturate(.78) brightness(.92)" }} sizes="25vw" />
        <PhotoOverlay label={photos[2].label} badge={photos[2].badge} />
      </div>
    </div>
  );
}

function PhotoLayoutB({ photos, index }: { photos: SectionData["photos"]; index: number }) {
  return (
    <div className="reveal-right delay-1 flex h-[280px] flex-col gap-1.5 overflow-hidden rounded-[20px] md:h-[360px] lg:h-[560px]">
      <div className="plb-main group relative flex-[1.5] overflow-hidden">
        <Image src={IMG[photos[0].src]} alt={photos[0].label} fill className="object-cover transition-all duration-700 group-hover:scale-[1.07] group-hover:saturate-100 group-hover:brightness-[1.02]" style={{ filter: "saturate(.78) brightness(.92)" }} sizes="(max-width:900px) 100vw, 50vw" />
        <PhotoOverlay label={photos[0].label} badge={photos[0].badge} />
      </div>
      <div className="plb-sub group relative flex-1 overflow-hidden">
        <Image src={IMG[photos[1].src]} alt={photos[1].label} fill className="object-cover transition-all duration-700 group-hover:scale-[1.07] group-hover:saturate-100 group-hover:brightness-[1.02]" style={{ filter: "saturate(.78) brightness(.92)" }} sizes="50vw" />
        <PhotoOverlay label={photos[1].label} badge={photos[1].badge} />
      </div>
    </div>
  );
}

function PhotoOverlay({ label, badge }: { label: string; badge: string }) {
  return (
    <div className="photo-overlay absolute inset-0 flex items-end p-4" style={{ background: "linear-gradient(to top, rgba(0,0,0,.62) 0%, rgba(0,0,0,.14) 40%, transparent 70%)", pointerEvents: "none" }}>
      <span className="pt-label flex-1 text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,.65)" }}>{label}</span>
      {badge && <span className="pt-badge rounded-full px-2.5 py-1 text-[8.5px] font-extrabold uppercase tracking-wide text-white" style={{ background: "rgba(220,30,30,.88)", backdropFilter: "blur(4px)" }}>{badge}</span>}
    </div>
  );
}

function RepairBlock({ emoji, repairs, isEven }: { emoji: string; repairs: RepairItem[]; isEven?: boolean }) {
  return (
    <div className="repair-block overflow-hidden rounded-[18px] border-[1.5px] mb-8" style={{ borderColor: "var(--border)", background: "#fff" }}>
      <div className="repair-block-head flex items-center gap-3 px-5 py-3.5" style={{ background: isEven ? "#ededeb" : "var(--bg2)", borderBottom: "1.5px solid var(--border)" }}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-base" style={{ background: "rgba(220,30,30,.07)", border: "1px solid rgba(220,30,30,.22)" }}>{emoji}</span>
        <span className="text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-[var(--text)]">Zakres napraw</span>
        <span className="ml-auto rounded-full border px-2 py-0.5 text-[10px] font-semibold text-[var(--muted)]" style={{ borderColor: "var(--border)", background: "#fff" }}>{repairs.length} pozycji</span>
      </div>
      <div className="repair-grid grid grid-cols-1 sm:grid-cols-2">
        {repairs.map((r, i) => (
          <div
            key={i}
            className="ri group relative flex gap-3 border-b border-r p-4 transition-colors hover:bg-[#fafaf9] sm:border-r-[var(--border)] [&:nth-child(even)]:border-r-0 [&:nth-last-child(-n+2)]:border-b-0 [&:last-child:nth-child(odd)]:col-span-2 [&:last-child:nth-child(odd)]:border-r-0 [&:last-child:nth-child(odd)]:border-b-0"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="ri-stripe absolute left-0 top-0 bottom-0 w-[2.5px] rounded-r-sm bg-[var(--red)] origin-top scale-y-0 transition-transform duration-200 group-hover:scale-y-100" aria-hidden />
            <span className="ri-dot mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ccc] transition-all group-hover:scale-150 group-hover:bg-[var(--red)]" />
            <div>
              <p className="ri-name text-[13px] font-semibold text-[var(--text)]">{r.name}</p>
              <p className="ri-sub mt-0.5 text-[11.5px] text-[var(--muted)]">{r.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
