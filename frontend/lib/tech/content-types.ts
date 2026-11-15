/**
 * Extended content of device pages and repair pages (2026-11 "strony napraw" session).
 * Texts live in `config/tresci/*.ts`, one file per group, merged in `lib/tech/devices.ts`
 * and `config/naprawy.ts`. Rules (SPEC §8): no prices, no messengers, no parcel lockers,
 * no shop, no cities (points come from prokom.ts), no time or warranty numbers, no
 * unconfirmed promises in plain text (they go through `claim()`).
 */

/** Short title + one or two sentences. */
export type Titled = { t: string; s: string };

/** "Po czym poznać usterkę" card on a device page. */
export type Symptom = {
  /** Fault name, e.g. "Bateria traci pojemność". */
  t: string;
  /** 2–4 concrete signs the visitor can notice. */
  signs: string[];
  /** One sentence: what it usually means / what we check. */
  meaning: string;
  /** Fault from wizard-data for the category (prefills /zgloszenie) or null. */
  fault: string | null;
};

export type DeviceExtra = {
  /** 2 paragraphs: "<Serwis X>: co warto wiedzieć" (SEO text, concrete). */
  intro: string[];
  /** 4–6 most common faults with symptoms. */
  symptoms: Symptom[];
  /** 4–6 things to check yourself before coming. */
  selfCheck: Titled[];
  /** When the repair pays off and when it does not. */
  worth: { yes: string[]; no: string[]; note: string };
  /** Optional replacement of `kinds` (brands and model families). */
  kinds?: { n: string; s: string }[];
  /** Device-specific paragraph for "Jak oddać sprzęt" (what to bring, how to pack). */
  intake: string;
  /** Device-specific paragraph for "Gwarancja" (what it covers, in general terms). */
  warranty: string;
  /** New FAQ entries, appended after the accepted ones (total 6–10). */
  faq: { q: string; a: string }[];
};

export type RepairExtra = {
  /** 3–5 causes of the fault. */
  przyczyny: Titled[];
  /** 1–2 paragraphs: original or replacement part (no promises the service did not make). */
  czesci: string[];
  /** 2–4 repair-specific preparation items (on top of the device PrepChecklist). */
  przygotowanie: string[];
  /** 3–4 items: what to expect after the repair. */
  poNaprawie: string[];
  /** 3–5 tips: how to avoid the fault. */
  porady: Titled[];
  /** New FAQ entries, appended after the accepted ones (total 5–8). */
  faq: { q: string; a: string }[];
};
