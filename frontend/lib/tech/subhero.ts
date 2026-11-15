/**
 * Hero of the sub-pages (hub /uslugi, device pages, /naprawy/[slug]): one system, not 20
 * different heroes. Data only — the view is components/tech/subhero/SubHero.tsx.
 *
 * Promises: exactly 3, only confirmed ones (SPEC §8, config/prokom.ts `claims`). Claims
 * with `confirmed: false` are hidden in production and framed on staging (claim()).
 */
import { claim } from "./claims";
import type { CategoryCode } from "./wizard-data";

export type HeroPromise = { text: string; draft: boolean };

/** Which wizard device and faults the hero scene shows for a category (effects E1–E17). */
export const HERO_SCENES: Record<Exclude<CategoryCode, "other">, { device: string; faults: string[] }> = {
  phone: { device: "telefon", faults: ["Pęknięty ekran", "Bateria", "Nie ładuje"] },
  tablet: { device: "tablet", faults: ["Pęknięty ekran", "Nie ładuje", "Bateria"] },
  smartwatch: { device: "smartwatch", faults: ["Pęknięte szkło", "Bateria", "Nie ładuje"] },
  laptop: { device: "laptop", faults: ["Przegrzewa się", "Matryca", "Klawiatura"] },
  desktop: { device: "komputer", faults: ["Głośno pracuje, grzeje się", "Brak obrazu", "Działa wolno"] },
  printer: { device: "drukarka", faults: ["Paski na wydruku", "Zacina papier", "Tusz i głowica"] },
  console: { device: "konsola", faults: ["Głośna, przegrzewa się", "Brak obrazu (HDMI)", "Dryf w padzie"] },
  data_recovery: { device: "odzysk", faults: ["Z dysku HDD lub SSD", "Z telefonu", "Z pendrive’a lub karty"] },
};

export type PromiseContext = {
  category?: CategoryCode;
  /** Phone screen replacement: "Wymiana ekranu często ok. 1 h" (claim quickRepair). */
  phoneScreen?: boolean;
};

const WARRANTY = "Gwarancja na usługę i części";
const QUOTE = "Wycena przed naprawą";
const STATUS = "Status naprawy online";

/**
 * 3 short promises for the hero. Phone screen → the confirmed "często ok. 1 h";
 * computers, laptops, consoles, printers → "Diagnoza zwykle tego samego dnia";
 * otherwise the three promises of the home hero.
 */
export function heroPromises(ctx: PromiseContext = {}, draft?: boolean): HeroPromise[] {
  const plain = (text: string): HeroPromise => ({ text, draft: false });
  const out: HeroPromise[] = [plain(QUOTE)];
  if (ctx.phoneScreen) {
    const quick = claim("quickRepair", draft);
    if (quick) out.push({ text: `Wymiana ekranu ${quick.text}`, draft: quick.draft });
  } else if (ctx.category && ["laptop", "desktop", "console", "printer"].includes(ctx.category)) {
    const sameDay = claim("sameDayDiagnosis", draft);
    if (sameDay) out.push({ text: `Diagnoza ${lowerFirst(sameDay.text).replace(/\.$/, "")}`, draft: sameDay.draft });
  }
  out.push(plain(WARRANTY));
  if (out.length < 3) out.push(plain(STATUS));
  return out.slice(0, 3);
}

function lowerFirst(s: string): string {
  return s ? s[0].toLocaleLowerCase("pl-PL") + s.slice(1) : s;
}
