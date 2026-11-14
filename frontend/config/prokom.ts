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
    parkingNote: null,
    published: true,
  },
  {
    key: "zakopane",
    name: "Zakopane",
    street: "ul. Stanisława Staszica 8",
    postal: "34-500",
    city: "Zakopane",
    // APPROXIMATE (Zakopane centre). TODO(krystian): exact pin of the shop before publishing.
    geo: { lat: 49.299, lng: 19.9489 },
    hours: [
      { days: "pn–pt", open: "10:00", close: "16:30" },
      { days: "sob", open: null, close: null },
      { days: "nd", open: null, close: null },
    ],
    phone: "+48 18 541 20 15",
    mapsUrl: null,
    parkingNote: null,
    published: false,
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
  published: false, // true only after the boss answers the 5 questions (SPEC §10)
  address: "rabka" as PointKey,
  inboundPaidBy: "client" as const,
  returnPaidBy: "service" as "service" | "client" | null,
  returnIfDeclined: null as null | "service" | "client",
  payment: null as null | string[],
  area: null as null | "polska" | "okolica",
};

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
