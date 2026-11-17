/**
 * What the empty search window offers besides the field (pattern: prokom-web `SearchDialog` of the
 * Biznes line — „Najczęściej szukane” and „Na skróty”): service phrases people type most and
 * categories with the number of results they lead to. One list for the window and `/szukaj`;
 * client-safe (no data imports), the counts come from the real index through the provider.
 */
import type { Provider, SearchIconName } from "./provider";

/** Polish plural: 1 wynik, 2–4 wyniki (but 12–14 wyników), 5+ wyników, 22 wyniki… */
export function plural(n: number, forms: readonly [one: string, few: string, many: string]): string {
  const abs = Math.abs(n);
  if (abs === 1) return forms[0];
  const tens = abs % 10;
  const hundreds = abs % 100;
  return tens >= 2 && tens <= 4 && (hundreds < 12 || hundreds > 14) ? forms[1] : forms[2];
}

export const resultsLabel = (n: number) => `${n} ${plural(n, ["wynik", "wyniki", "wyników"])}`;

/**
 * „Najczęściej szukane”: a chip types `query` into the field (the visitor sees the results and
 * Enter opens the first one); `href` is where the best result leads — kept here so a unit test
 * catches a phrase that stops finding its page (search.test.ts).
 */
export type PopularPhrase = { label: string; query: string; href: string };

export const POPULAR_PHRASES: readonly PopularPhrase[] = [
  { label: "Pęknięty ekran", query: "pęknięty ekran", href: "/naprawy/wymiana-ekranu-iphone" },
  { label: "Bateria w telefonie", query: "bateria telefon", href: "/naprawy/wymiana-baterii-w-telefonie" },
  { label: "Nie ładuje", query: "nie ładuje", href: "/naprawy/naprawa-gniazda-ladowania" },
  { label: "Zalany telefon", query: "zalany telefon", href: "/naprawy/telefon-po-zalaniu" },
  { label: "Laptop się grzeje", query: "laptop się grzeje", href: "/naprawy/laptop-sie-przegrzewa" },
  { label: "Wymiana dysku SSD", query: "dysk ssd", href: "/naprawy/wymiana-dysku-na-ssd" },
  { label: "Hammer Glass", query: "hammer glass", href: "/hammer-glass" },
  { label: "Odzyskiwanie danych", query: "odzyskiwanie danych", href: "/odzyskiwanie-danych" },
  { label: "Godziny otwarcia", query: "godziny otwarcia", href: "/punkty-serwisowe" },
  { label: "Kurier", query: "kurier", href: "/naprawa-kurierem" },
];

/**
 * „Na skróty”: a category types its `query` (the count is what that query finds, so the number
 * on the tile is exactly what the visitor gets).
 */
export type SearchCategory = { key: string; label: string; query: string; icon: SearchIconName };

export const SEARCH_CATEGORIES: readonly SearchCategory[] = [
  { key: "telefony", label: "Telefony", query: "telefon", icon: "phone" },
  { key: "laptopy", label: "Laptopy", query: "laptop", icon: "laptop" },
  { key: "tablety", label: "Tablety", query: "tablet", icon: "tablet" },
  { key: "komputery", label: "Komputery", query: "komputer", icon: "pc" },
  { key: "konsole", label: "Konsole", query: "konsola", icon: "console" },
  { key: "drukarki", label: "Drukarki", query: "drukarka", icon: "printer" },
  { key: "smartwatche", label: "Smartwatche", query: "smartwatch", icon: "watch" },
  { key: "dane", label: "Odzysk danych", query: "odzyskiwanie danych", icon: "data" },
  { key: "punkty", label: "Punkty serwisowe", query: "punkt", icon: "pin" },
  { key: "blog", label: "Blog i porady", query: "porady", icon: "doc" },
  { key: "hammer", label: "Hammer Glass", query: "hammer", icon: "shield" },
];

export type CountedCategory = SearchCategory & { count: number };

/** Categories with their counts from the index; a category that finds nothing is left out. */
export function countCategories(provider: Provider, categories: readonly SearchCategory[] = SEARCH_CATEGORIES): CountedCategory[] {
  return categories.map((c) => ({ ...c, count: provider.count(c.query) })).filter((c) => c.count > 0);
}
