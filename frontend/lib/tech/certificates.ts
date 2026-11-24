/**
 * Partner programmes and manufacturer certificates (boss consent 23.11.2026, documents from Krystian).
 * Every partner status has an end date and every one shown here has expired — they are presented as
 * history ("status w latach…"), never as current. The Apple programmes are current (boss, 23.11).
 * They concern sales and deployments, not an Apple service authorisation — copy must not suggest one.
 */

export type Certificate = {
  key: string;
  brand: "Samsung" | "Dell";
  title: string;
  /** What it confirms, in one short line. */
  scope: string;
  /** Shown period: "2022", "2022–2023", "2018". */
  period: string;
  kind: "status" | "szkolenie";
  image: { src: string; thumb: string; width: number; height: number; thumbWidth: number; thumbHeight: number };
};

const img = (key: string, w: number, h: number, tw: number, th: number) => ({
  src: `/tech/certyfikaty/${key}.webp`,
  thumb: `/tech/certyfikaty/${key}-min.webp`,
  width: w,
  height: h,
  thumbWidth: tw,
  thumbHeight: th,
});

export const certificates: Certificate[] = [
  {
    key: "samsung-silver-2023",
    brand: "Samsung",
    title: "Samsung Mobile Experience SILVER",
    scope: "Certyfikowany partner: rozwiązania KNOX i urządzenia mobilne",
    period: "2023–2024",
    kind: "status",
    image: img("samsung-silver-2023", 1600, 1131, 640, 453),
  },
  {
    key: "samsung-gold-2022",
    brand: "Samsung",
    title: "Samsung GOLD Mobility",
    scope: "Certyfikowany partner: rozwiązania KNOX i urządzenia mobilne",
    period: "2022",
    kind: "status",
    image: img("samsung-gold-2022", 1600, 1174, 640, 469),
  },
  {
    key: "dell-2022",
    brand: "Dell",
    title: "Dell Technologies Authorized Partner",
    scope: "Authorized Solution Provider",
    period: "2022–2023",
    kind: "status",
    image: img("dell-2022", 1600, 1078, 640, 431),
  },
  {
    key: "samsung-vd-2018",
    brand: "Samsung",
    title: "Szkolenie Samsung Visual Display",
    scope: "Installation & Service · Advanced Technical",
    period: "2018",
    kind: "szkolenie",
    image: img("samsung-vd-2018", 1153, 1600, 461, 640),
  },
  {
    key: "samsung-signage-2018",
    brand: "Samsung",
    title: "Szkolenie Samsung Professional Display",
    scope: "SMART Signage i SMART Hospitality Display",
    period: "2018",
    kind: "szkolenie",
    image: img("samsung-signage-2018", 1123, 1600, 449, 640),
  },
];

/** Apple programmes through the AB distributor (iLeader) — current, sales and deployments. */
export const applePrograms = [
  {
    key: "dep",
    title: "Apple DEP",
    lead: "Wdrożenie bez ręcznej konfiguracji",
    text: "Kupione u nas urządzenia rejestrujemy w programie Apple Device Enrollment. Z systemem MDM trafiają do pracownika gotowe do pracy, z ustawieniami firmy.",
  },
  {
    key: "cto",
    title: "Mac w konfiguracji CTO",
    lead: "Konfiguracja na zamówienie",
    text: "Zamówimy Maca dokładnie pod Twoje potrzeby: więcej pamięci, większy dysk, mocniejszy procesor. Doradzimy, co ma sens przy Twojej pracy.",
  },
  {
    key: "applecare",
    title: "AppleCare+",
    lead: "Dłuższa ochrona sprzętu",
    text: "Do kupowanego urządzenia dodamy AppleCare+, czyli rozszerzoną ochronę i pomoc Apple. Zamówisz go razem ze sprzętem.",
  },
] as const;

/**
 * Samsung for business (Krystian 24.11: promote Samsung and Samsung Business at the top level).
 * Honest: there is no current Samsung partner status — the KNOX partnership is told in the past tense.
 */
export const samsungPrograms = [
  {
    key: "team",
    title: "Galaxy dla zespołu",
    lead: "Dobór i oferta dla firmy",
    text: "Pomożemy wybrać telefony, tablety i zegarki Galaxy do pracy zespołu i przygotujemy jedną ofertę na całość, razem z akcesoriami.",
  },
  {
    key: "knox",
    title: "Samsung Knox",
    lead: "Bezpieczeństwo i zarządzanie",
    text: "Galaxy mają wbudowaną platformę bezpieczeństwa Samsung Knox. Pomożemy ją skonfigurować i wdrożyć zarządzanie urządzeniami w firmie (MDM).",
  },
  {
    key: "service",
    title: "Serwis Samsung na miejscu",
    lead: "Rabka-Zdrój i Zakopane",
    text: "Diagnoza i naprawa sprzętu Samsung w naszych salonach, wycena zawsze przed naprawą. Krótka droga, gdy coś się zepsuje.",
  },
] as const;

export const SAMSUNG_PROGRAM_NOTE = "W latach 2022–2024 byliśmy certyfikowanym partnerem Samsung w obszarze rozwiązań KNOX i urządzeń mobilnych (statusy GOLD Mobility i Mobile Experience SILVER).";

export const APPLE_PROGRAM_NOTE ="Partner programu iLeader dystrybutora AB. DEP, CTO i AppleCare+ dotyczą sprzedaży i wdrożeń sprzętu Apple.";
