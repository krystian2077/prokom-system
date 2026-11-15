/**
 * PRO-KOM Tech — the single source of contact data, service points and line info
 * (docs/tech/SPEC.md §5, §12.1, §12.9, §12.10).
 *
 * Phone, e-mail, address and opening hours must never be hard-coded in components
 * (tests/tech/literaly.test.ts). A point with `published: false` renders nowhere in
 * production; on staging it shows with a "do uzupełnienia" frame when
 * NEXT_PUBLIC_TECH_DRAFT=1 (lib/tech/points.ts).
 */

export const company = {
  name: "PRO-KOM Tadeusz Wójciak",
  nip: "7352511447",
  since: 2004,
  hq: { street: "ul. Orkana 16B", postal: "34-700", city: "Rabka-Zdrój" },
} as const;

export const line = {
  key: "tech",
  name: "PRO-KOM Tech",
  domain: "prokomserwis.pl",
  phone: "+48 883 200 151",
  phoneDisplay: "883 200 151",
  // MX confirmed and mailbox tested 14.11.2026 (TM+ stage B, docs/STAN.md).
  email: "kontakt@prokomserwis.pl",
} as const;

export type PointKey = "rabka" | "zakopane";

/** Day groups used in `hours`. */
export type DaysKey = "pn–pt" | "sob" | "nd";

export type ServicePoint = {
  key: PointKey;
  name: string;
  street: string | null;
  postal: string;
  city: string;
  geo: { lat: number; lng: number } | null;
  hours: { days: DaysKey; open: string | null; close: string | null }[];
  /** null = line.phone */
  phone: string | null;
  mapsUrl: string | null;
  /** Where to park (free parking at both salons, Krystian 15.11.2026). null = not shown. */
  parkingNote: string | null;
  published: boolean;
};

export const servicePoints: ServicePoint[] = [
  {
    key: "rabka",
    name: "Rabka-Zdrój",
    street: "ul. Orkana 16B",
    postal: "34-700",
    city: "Rabka-Zdrój",
    geo: { lat: 49.613, lng: 19.9629 },
    hours: [
      { days: "pn–pt", open: "09:00", close: "17:00" },
      { days: "sob", open: "09:00", close: "14:00" },
      { days: "nd", open: null, close: null },
    ],
    phone: null,
    mapsUrl: null,
    parkingNote: "Bezpłatny parking przy salonie.",
    published: true,
  },
  {
    key: "zakopane",
    name: "Zakopane",
    street: "ul. Stanisława Staszica 8",
    postal: "34-500",
    city: "Zakopane",
    // Shop pin from Krystian, 15.11.2026 (ul. Stanisława Staszica 8, by Krupówki).
    geo: { lat: 49.2978, lng: 19.9539 },
    hours: [
      { days: "pn–pt", open: "10:00", close: "16:30" },
      { days: "sob", open: null, close: null },
      { days: "nd", open: null, close: null },
    ],
    phone: "+48 18 541 20 15",
    mapsUrl: null,
    parkingNote: "Bezpłatny parking.",
    published: true,
  },
];

/** Extra closed days besides statutory holidays (inventory, holiday leave…). */
export type Closure = { date: string /* YYYY-MM-DD */; note: string; points?: PointKey[] };
export const closures: Closure[] = [];

/** Notice above the capsule (SPEC §12.9). At most one active per day; none = no space taken. */
export type Notice = {
  id: string;
  text: string;
  href?: string;
  from: string; // YYYY-MM-DD, inclusive (Europe/Warsaw)
  to: string; // YYYY-MM-DD, inclusive
  points?: PointKey[];
};
export const notices: Notice[] = [];

/** Courier repair (SPEC §12.10). `null` = the sentence is not shown. */
export const courierService = {
  // The boss's answers to SPEC §10/§12.10, passed on by Krystian on 15.11.2026.
  // Parcels may go to ANY published point (Krystian, 15.11.2026) — lib/tech/courier.ts courierPoints().
  published: true,
  inboundPaidBy: "client" as const,
  returnPaidBy: "service" as "service" | "client" | null,
  returnIfDeclined: "service" as null | "service" | "client",
  /** Payment methods; „przelew po diagnozie…” renders as a full sentence (lib/tech/courier-page.ts). No cash on delivery. */
  payment: ["przelew po diagnozie i akceptacji naprawy"] as null | string[],
  area: "polska" as null | "polska" | "okolica",
};

/**
 * Numbers and promises from the design (SPEC §10). Confirmed by Krystian on 15.11.2026:
 * quickRepair, freeDiagnosis, sameDayDiagnosis, hg*, sinceYear, aboutSince, courierWholeCountry, ruleData.
 * `confirmed: false` → hidden in production (or the sentence goes without the number);
 * with NEXT_PUBLIC_TECH_DRAFT=1 (staging) shown inside the "do potwierdzenia" frame.
 * Flip `confirmed` after confirmation — components read it via lib/tech/claims.ts.
 */
export type Claim = { text: string; confirmed: boolean };
export const claims = {
  /** Phone screen replacement time, pill on "Najczęstsze naprawy". */
  quickRepair: { text: "często ok. 1 h", confirmed: true },
  /** Diagnosis is free in most cases (step 2 of "Od zgłoszenia do odbioru"). */
  freeDiagnosis: { text: "Bezpłatnie w większości przypadków.", confirmed: true },
  /** Diagnosis usually the same day (step 2). */
  sameDayDiagnosis: { text: "Zwykle tego samego dnia.", confirmed: true },
  /** Hammer Glass block. */
  hgModels: { text: "10 000+", confirmed: true },
  hgFoils: { text: "9", confirmed: true },
  hgPrecision: { text: "0,1 mm", confirmed: true },
  hgMinutes: { text: "W około 5 minut.", confirmed: true },
  hgCutTime: { text: "Cięcie trwa około minuty", confirmed: true },
  /** Google rating card ("Dlaczego"): rating and number of reviews, e.g. "4,9 · 120 opinii". */
  googleRating: { text: "", confirmed: false },
  /** "Na Podhalu od 2004 roku" card ("Dlaczego"); the year itself is company.since. */
  sinceYear: { text: "2004", confirmed: true },
  /** Courier from the whole country (SPEC §10 courier question 5). */
  courierWholeCountry: { text: "z całej Polski", confirmed: true },
  /** TD4 "O firmie": founding year shown as a number (hero, stat card; SPEC §10 „2004”). */
  aboutSince: { text: String(company.since), confirmed: true },
  /** TD4 "O firmie": "4 + 1" — PRO-KOM lines and the Gaming brand. */
  aboutLines: { text: "4 + 1", confirmed: false },
  /** TD4 "O firmie" rules outside SPEC §8 promises: which parts we use… */
  ruleParts: { text: "Oryginalne albo sprawdzone zamienniki. Zawsze mówimy, które.", confirmed: false },
  /** …and how we treat data on the device. */
  ruleData: { text: "Nie przeglądamy zawartości urządzeń bez potrzeby.", confirmed: true },
  /** Google Business profile link(s) for the rating card on "O firmie" (empty = no card). */
  googleProfiles: { text: "", confirmed: false },
} satisfies Record<string, Claim>;
export type ClaimKey = keyof typeof claims;

export type LineKey = "prokom" | "biznes" | "instalacje" | "software" | "tech" | "gaming";
export type Line = {
  key: LineKey;
  name: string;
  /** Label under the PRO–KOM mark in the lines band ('' for the parent brand). */
  label: string;
  domain: string;
  description: string;
  /** Dash colour on light backgrounds (brand bar). */
  dash: string;
  /** Accent on the dark footer band. */
  dashDark: string;
};

/** PRO-KOM lines (brand bar and footer band), colours from the design (T.Naglowek, T.Stopka). */
export const lines: Line[] = [
  { key: "prokom", name: "PRO-KOM", label: "", domain: "pro-kom.eu", description: "Wszystkie linie PRO-KOM", dash: "#45A02C", dashDark: "#4FB034" },
  { key: "biznes", name: "Biznes", label: "BIZNES", domain: "prokombiznes.pl", description: "Kasy, komputery, opieka IT", dash: "#244FB0", dashDark: "#4A7BE0" },
  { key: "instalacje", name: "Instalacje", label: "INSTALACJE", domain: "prokominstalacje.pl", description: "Monitoring, sieci, smart home", dash: "#0093B3", dashDark: "#12B6D8" },
  { key: "software", name: "Software", label: "SOFTWARE", domain: "prokomsoftware.pl", description: "Strony, systemy, aplikacje", dash: "#8B61E3", dashDark: "#9670EE" },
  { key: "tech", name: "Tech", label: "TECH", domain: "prokomserwis.pl", description: "Naprawy telefonów i komputerów", dash: "#D13A2E", dashDark: "#E2483A" },
  { key: "gaming", name: "Gaming", label: "GAMING", domain: "prokomgaming.pl", description: "Komputery gamingowe · marka PRO-KOM", dash: "#D9A400", dashDark: "#F2C230" },
];

export const social = {
  facebook: "https://www.facebook.com/prokomrabka",
} as const;

/** "+48 883 200 151" → "tel:+48883200151" */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function pointPhone(p: ServicePoint): string {
  return p.phone ?? line.phone;
}
