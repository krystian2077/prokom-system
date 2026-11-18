/**
 * Umami events (docs/tech/SPEC.md §12.5). Event names and their parameters are
 * binding; parameters describe the action, never the person: no names, phone
 * numbers, e-mails, repair numbers or free text. No-op without Umami (dev,
 * staging without NEXT_PUBLIC_UMAMI_WEBSITE_ID, blocked script).
 */

export type TechEvents = {
  telefon_klik: { miejsce: string };
  zgloszenie_start: { zrodlo: "kreator" | "przycisk" | "strona_naprawy" | "kurier" };
  zgloszenie_krok: { nr: 1 | 2 | 3 | 4 | 5 };
  zgloszenie_wyslane: { kategoria: string; dostawa: string; punkt?: string };
  zgloszenie_blad: { typ: "walidacja" | "429" | "siec" | "5xx" | "timeout" };
  kontakt_wyslany: { temat: string };
  status_sprawdzony: { wynik: "znaleziono" | "nie" };
  nawigacja_klik: { punkt: string; aplikacja: "google" | "apple" | "waze" };
  kreator_usterka: { urzadzenie: string; usterka: string };
  pwa_start: Record<string, never>;
  poradnik_otwarty: Record<string, never>;
  /** "Jak sprawdzić model" in /zgloszenie: never the model itself. */
  pomocnik_modelu: { kategoria: string; pole: "model" | "imei"; propozycja: "uzyta" | "nie" | "brak" };
  kurier_strona: Record<string, never>;
  blog_kategoria: { slug: string };
  blog_powiazana_naprawa_klik: Record<string, never>;
  /** Site search (SPEC §12.5): phrase length and result count only — never the phrase itself. */
  szukaj: { dlugosc: number; wyniki: number; zrodlo: "okno" | "strona" };
  /** Sales enquiry list (runda 18.11 v2): counts only, never the models or the person. */
  zapytanie_dodaj: { rodzaj: string };
  zapytanie_wyslane: { pozycje: number };
};
export type TechEventName = keyof TechEvents;

type Umami = { track: (name: string, data?: Record<string, string | number>) => void };
declare global {
  interface Window {
    umami?: Umami;
  }
}

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE = /(?:\d[\s-]?){7,}/; // 7+ digits, also with spaces or dashes
const REPAIR_NO = /\b[A-Z]+\/RMA\/\d+/i;
const MAX_LEN = 60;

/** Drops values that look like personal data; returns null when anything was dropped. */
export function sanitizeParams(params: Record<string, unknown> | undefined): Record<string, string | number> | null {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v === undefined) continue;
    if (typeof v === "number" && Number.isFinite(v) && Math.abs(v) < 1e6) {
      out[k] = v;
      continue;
    }
    if (typeof v !== "string") return null;
    if (v.length > MAX_LEN || EMAIL.test(v) || PHONE.test(v) || REPAIR_NO.test(v)) return null;
    out[k] = v;
  }
  return out;
}

export function trackEvent<N extends TechEventName>(name: N, ...args: TechEvents[N] extends Record<string, never> ? [] : [TechEvents[N]]): void {
  if (typeof window === "undefined" || !window.umami) return;
  const params = sanitizeParams(args[0] as Record<string, unknown> | undefined);
  if (params === null) {
    if (process.env.NODE_ENV !== "production") console.warn(`trackEvent(${name}): parametry wyglądają na dane osobowe — pominięto`);
    return;
  }
  try {
    window.umami.track(name, Object.keys(params).length ? params : undefined);
  } catch {
    /* analytics must never break the page */
  }
}
