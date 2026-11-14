/**
 * Content rules (docs/tech/SPEC.md §3 "Dane", §8, §11 pt 5):
 * - phone, e-mail, address and hours only in config/prokom.ts,
 * - no WhatsApp,
 * - no "paczkomat" (except the sentence "nie obsługujemy paczkomatów" — TD5).
 *
 * Old public pages still have literals; they are listed in LEGACY and the list may
 * only shrink: a listed file that becomes clean fails the test until removed from it.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const FRONTEND = path.resolve(__dirname, "../..");
const SCAN_DIRS = ["app/(public)", "components/tech", "lib/tech", "sections", "components/layout", "components/hammer-glass", "components/blog", "features/zgloszenie"];
const EXT = /\.(tsx?|css|mjs|js)$/;
const IGNORE = /(\.test\.ts|\.spec\.ts)$/;

const CONTACT_LITERALS: [string, RegExp][] = [
  ["telefon serwisu", /883[\s-]?200[\s-]?151/],
  ["telefon Zakopane", /18[\s-]?541[\s-]?20[\s-]?15/],
  ["e-mail", /[\w.+-]+@(pro-kom\.eu|prokomserwis\.pl)/i],
  ["adres Rabka", /Orkana\s+16/i],
  ["adres Zakopane", /Staszica\s+8/i],
  ["godziny", /\b(0?9|10):00\s*[–-]\s*1[4-7]:(00|30)\b|\b9\s*[–-]\s*1[47]\b/],
];

/** Old files (before TD2–TD5) that still contain contact literals. Only shrinks. */
const LEGACY_CONTACT = new Set<string>([
  "features/zgloszenie/LegacyZgloszeniePage.tsx",
  "sections/Contact.tsx",
  "components/layout/PublicFooter.tsx",
  "components/hammer-glass/HammerCta.tsx",
  "components/hammer-glass/HammerHero.tsx",
]);
// FAQ (rebuilt in TD5) keeps one allowed sentence: "nie obsługujemy paczkomatów" (SPEC §11 pt 5).
const LEGACY_PACZKOMAT = new Set<string>(["app/(public)/faq/page.tsx", "app/(public)/naprawa-kurierem/page.tsx"]);
/** Rebuilt pages allowed to say only that we do NOT handle parcel lockers. */
const PACZKOMAT_NEGATIVE_ONLY = ["app/(public)/faq/page.tsx", "app/(public)/naprawa-kurierem/page.tsx"];

function walk(dir: string): string[] {
  const abs = path.join(FRONTEND, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((e) => {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) return walk(rel);
    return EXT.test(e.name) && !IGNORE.test(e.name) ? [rel] : [];
  });
}
const files = SCAN_DIRS.flatMap(walk);
const read = (rel: string) => fs.readFileSync(path.join(FRONTEND, rel), "utf8");

function contactHits(rel: string): string[] {
  const src = read(rel);
  return CONTACT_LITERALS.filter(([, re]) => re.test(src)).map(([name]) => name);
}

describe("literały kontaktowe tylko w config/prokom.ts", () => {
  it("scans a meaningful set of files", () => {
    expect(files.length).toBeGreaterThan(50);
    expect(files).toContain("app/(public)/layout.tsx");
  });

  it("new and rebuilt files have no contact literals", () => {
    const offenders = files
      .filter((f) => !LEGACY_CONTACT.has(f))
      .map((f) => ({ f, hits: contactHits(f) }))
      .filter((x) => x.hits.length);
    expect(offenders).toEqual([]);
  });

  it("LEGACY list only shrinks (clean or deleted files must be removed from it)", () => {
    const stale = Array.from(LEGACY_CONTACT).filter((f) => !fs.existsSync(path.join(FRONTEND, f)) || contactHits(f).length === 0);
    expect(stale).toEqual([]);
  });

  it("config/prokom.ts holds the data", () => {
    const src = read("config/prokom.ts");
    expect(src).toMatch(/883 200 151/);
    expect(src).toMatch(/Orkana 16B/);
  });
});

describe("treść (SPEC §8)", () => {
  it("no WhatsApp anywhere on the public site", () => {
    expect(files.filter((f) => /wa\.me|whatsapp/i.test(read(f)))).toEqual([]);
  });
  it("FAQ and /naprawa-kurierem mention parcel lockers only to say we don't handle them", () => {
    for (const f of PACZKOMAT_NEGATIVE_ONLY) {
      const sentences = read(f)
        .split(/[.!?]\s|\n/)
        .filter((x) => /paczkomat/i.test(x));
      expect(sentences.length, f).toBeGreaterThan(0);
      for (const x of sentences) expect(x, f).toMatch(/(^|[^a-ząćęłńóśźż])nie([^a-ząćęłńóśźż]|$)/i);
    }
  });
  it("no 'paczkomat' outside the legacy pages being rebuilt", () => {
    expect(files.filter((f) => !LEGACY_PACZKOMAT.has(f) && /paczkomat/i.test(read(f)))).toEqual([]);
  });
});
