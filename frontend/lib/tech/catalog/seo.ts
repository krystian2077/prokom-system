/**
 * SEO of the catalogue pages (runda 18.11 v2 §2 „SEO”): titles 30–60 characters with the
 * " | PRO-KOM Tech" suffix, descriptions 120–155, JSON-LD Product WITHOUT offers (no prices),
 * salons as CollectionPage + ItemList. One URL per model — the colour is ?kolor= with a clean canonical.
 */
import { line } from "@/config/prokom";
import { SITE_URL } from "@/lib/site-config";
import { BRAND_NAMES, modelPath } from "./index";
import type { CatalogModel } from "./types";

const SUFFIX = ` | ${line.name}`;
export const TITLE_MIN = 30;
export const TITLE_MAX = 60;
export const DESC_MIN = 120;
export const DESC_MAX = 155;

/** The part before the suffix; the first variant that fits 30–60 with the suffix. */
export function modelTitle(m: Pick<CatalogModel, "name" | "brand">): string {
  const options = [`${m.name} — kolory i wersje`, `${m.name} — kolory`, m.name, `${BRAND_NAMES[m.brand]} ${m.name} — sprzedaż w salonie`];
  const fits = (t: string) => (t + SUFFIX).length <= TITLE_MAX && (t + SUFFIX).length >= TITLE_MIN;
  return options.find(fits) ?? options.find((t) => (t + SUFFIX).length <= TITLE_MAX) ?? m.name.slice(0, TITLE_MAX - SUFFIX.length);
}

export function modelDescription(m: Pick<CatalogModel, "name" | "colors">): string {
  const colors = m.colors.length > 1 ? `${m.colors.length} kolorów` : "kolor";
  const long = `${m.name}: wybierz ${colors} i wersję, dodaj do zapytania — odpowiemy z ceną i dostępnością. Odbiór w salonie w Rabce-Zdroju lub Zakopanem.`;
  if (long.length <= DESC_MAX) return long.length >= DESC_MIN ? long : `${long} Bez cen na stronie.`.slice(0, DESC_MAX);
  const short = `${m.name}: wybierz kolor i wersję, dodaj do zapytania — odpowiemy z ceną i dostępnością. Odbiór w Rabce-Zdroju lub Zakopanem.`;
  return short.length <= DESC_MAX ? short : `${short.slice(0, DESC_MAX - 1)}…`;
}

/** schema.org Product without `offers` — prices come in the answer to the enquiry. */
export function productJsonLd(m: CatalogModel) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: m.name,
    brand: { "@type": "Brand", name: BRAND_NAMES[m.brand] },
    url: `${SITE_URL}${modelPath(m)}`,
    description: m.description[0],
    color: m.colors.map((c) => c.name).join(", "),
    ...(m.images.find((i) => i.src) ? { image: m.images.filter((i) => i.src).map((i) => `${SITE_URL}${i.src}`) } : {}),
  };
}

export function collectionJsonLd(name: string, path: string, models: CatalogModel[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url: `${SITE_URL}${path}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: models.map((m, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}${modelPath(m)}`, name: m.name })),
    },
  };
}
