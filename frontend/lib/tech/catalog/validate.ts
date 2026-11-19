/**
 * Catalogue rules (runda 18.11 v2 §0, §5 T-R2a) as plain TypeScript — no schema library added:
 * every model has colours, storage (unless audio), 10–14 specs (8+ for audio), a dated source,
 * three own paragraphs, ≥ 3 FAQ, and never a price or „autoryzowany/certyfikowany”.
 */
import type { Catalog, CatalogModel } from "./types";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX = /^#[0-9a-f]{6}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Price values: „1 299 zł”, „4999 PLN”, „zł”. (Talking about prices — „odpowiemy z ceną” — is fine.) */
export const PRICE = /\d[\d\s.,]*\s?(zł|pln)(?![a-ząćęłńóśźż])|(?:^|[^a-ząćęłńóśźż])(zł|pln)(?![a-ząćęłńóśźż])/i;
/** No partner/certification claims — the Samsung/Dell certificates expired, Apple none (§0). */
export const AUTHORISED = /autoryzowan|certyfikowan|oficjalny partner|oficjalny serwis/i;

export function modelErrors(m: CatalogModel, families: Set<string>, accessories: Set<string>, slugs: Set<string>): string[] {
  const e: string[] = [];
  const at = (msg: string) => e.push(`${m.slug}: ${msg}`);
  if (!SLUG.test(m.slug)) at("slug");
  if (!families.has(m.family)) at(`nieznana rodzina ${m.family}`);
  if (!m.colors.length) at("brak kolorów");
  const colorKeys = new Set<string>();
  for (const c of m.colors) {
    if (!SLUG.test(c.key) || colorKeys.has(c.key)) at(`klucz koloru ${c.key}`);
    colorKeys.add(c.key);
    if (!HEX.test(c.hex)) at(`hex ${c.name}`);
    if (!c.name.trim()) at("pusta nazwa koloru");
  }
  if (m.kind !== "audio" && !m.storage.length) at("brak wariantów pamięci/rozmiaru");
  const minSpecs = m.kind === "audio" ? 8 : 10;
  if (m.specs.length < minSpecs || m.specs.length > 14) at(`parametry: ${m.specs.length} (wymagane ${minSpecs}–14)`);
  if (m.keyFacts.length !== 4) at("„W skrócie” musi mieć 4 pozycje");
  // inBox may be empty when the manufacturer page does not list it (the section is then not shown).
  if (m.description.length !== 3 || m.description.some((p) => p.trim().length < 80)) at("opis: 3 akapity po min. 80 znaków");
  if (m.faq.length < 3) at("FAQ < 3");
  if (!m.sources.length || m.sources.some((s) => !DATE.test(s.date) || !/^https:\/\//.test(s.url))) at("źródła z datą i adresem");
  for (const img of m.images) {
    if (!colorKeys.has(img.color)) at(`zdjęcie dla nieznanego koloru ${img.color}`);
    if (!DATE.test(img.source.date) || !img.source.consent) at("zdjęcie bez źródła/zgody");
  }
  for (const c of m.compat) if (!accessories.has(c) && !slugs.has(c)) at(`„Pasuje do”: nieznane ${c}`);
  const text = [m.name, ...m.keyFacts, ...m.description, ...m.faq.flatMap((f) => [f.q, f.a]), ...m.specs.map((s) => s.value)].join("\n");
  if (PRICE.test(text)) at("cena w treści");
  if (AUTHORISED.test(text)) at("„autoryzowany/certyfikowany” w treści");
  return e;
}

export function catalogErrors(c: Catalog): string[] {
  const families = new Set(c.families.map((f) => f.key));
  const accessories = new Set(c.accessories.map((a) => a.key));
  const slugs = new Set<string>();
  const e: string[] = [];
  for (const m of c.models) {
    if (slugs.has(m.slug)) e.push(`${m.slug}: duplikat`);
    slugs.add(m.slug);
  }
  for (const m of c.models) e.push(...modelErrors(m, families, accessories, slugs));
  for (const f of c.families) {
    if (!c.models.some((m) => m.family === f.key)) e.push(`rodzina ${f.key} bez modeli`);
    if (AUTHORISED.test(f.forWho) || PRICE.test(f.forWho)) e.push(`rodzina ${f.key}: niedozwolone słowa`);
  }
  for (const q of c.quizzes) {
    if (q.questions.length !== 3) e.push(`dobór ${q.brand}/${q.kind}: wymagane 3 pytania`);
    const tags = new Set(c.models.filter((m) => m.brand === q.brand && m.kind === q.kind).flatMap((m) => m.tags));
    for (const qq of q.questions) for (const o of qq.options) for (const t of o.tags) if (!tags.has(t)) e.push(`dobór ${q.brand}/${q.kind}: tag ${t} nie pasuje do żadnego modelu`);
  }
  return e;
}

/** Longest run of identical words shared by two texts (copy check against a manufacturer text, §0: < 12 words). */
export function longestCommonRun(a: string, b: string): number {
  const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9ąćęłńóśźżäöüéèáíúý\s]/g, " ").split(/\s+/).filter(Boolean);
  const x = words(a);
  const y = words(b);
  let best = 0;
  let prev = new Array(y.length + 1).fill(0);
  for (let i = 1; i <= x.length; i++) {
    const cur = new Array(y.length + 1).fill(0);
    for (let j = 1; j <= y.length; j++) {
      if (x[i - 1] === y[j - 1]) {
        cur[j] = prev[j - 1] + 1;
        if (cur[j] > best) best = cur[j];
      }
    }
    prev = cur;
  }
  return best;
}
