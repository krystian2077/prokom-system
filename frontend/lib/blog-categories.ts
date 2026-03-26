/**
 * Centralna definicja kategorii bloga.
 * Importuj stąd we wszystkich miejscach, żeby uniknąć duplikacji:
 *  - blog/page.tsx
 *  - blog/[slug]/page.tsx
 *  - components/blog/BlogTeaser.tsx
 */

export type BlogCategory = {
  slug: string;
  label: string;
  pill: string;
  dot: string;
  /** Kolor akcentu dla hero/sekcji danej kategorii */
  accent?: string;
};

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    slug: "Naprawa telefonów",
    label: "Naprawa telefonów",
    pill: "bg-red-50 text-red-700 border border-red-200",
    dot: "bg-red-500",
    accent: "red",
  },
  {
    slug: "Akcesoria GSM",
    label: "Akcesoria GSM",
    pill: "bg-blue-50 text-blue-700 border border-blue-200",
    dot: "bg-blue-500",
    accent: "blue",
  },
  {
    slug: "Sklep GSM",
    label: "Sklep GSM",
    pill: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
    accent: "emerald",
  },
  {
    slug: "Laptopy",
    label: "Laptopy",
    pill: "bg-violet-50 text-violet-700 border border-violet-200",
    dot: "bg-violet-500",
    accent: "violet",
  },
  {
    slug: "Komputery",
    label: "Komputery",
    pill: "bg-orange-50 text-orange-700 border border-orange-200",
    dot: "bg-orange-500",
    accent: "orange",
  },
  {
    slug: "Drukarki",
    label: "Drukarki",
    pill: "bg-cyan-50 text-cyan-700 border border-cyan-200",
    dot: "bg-cyan-500",
    accent: "cyan",
  },
  {
    slug: "Sprzęt biznesowy",
    label: "Sprzęt biznesowy",
    pill: "bg-slate-100 text-slate-700 border border-slate-200",
    dot: "bg-slate-500",
    accent: "slate",
  },
  {
    slug: "Poleasing",
    label: "Poleasing",
    pill: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-500",
    accent: "amber",
  },
  {
    slug: "Gaming",
    label: "Gaming",
    pill: "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200",
    dot: "bg-fuchsia-500",
    accent: "fuchsia",
  },
];

/** Tablica tylko nazw kategorii do wyświetlenia jako filtry */
export const CATEGORY_FILTER_LABELS = [
  "Wszystkie",
  ...BLOG_CATEGORIES.map((c) => c.label),
];

/** Szybki lookup: nazwa → styl */
const _map: Record<string, BlogCategory> = Object.fromEntries(
  BLOG_CATEGORIES.map((c) => [c.slug, c])
);

export function getCategoryStyle(category: string): Pick<BlogCategory, "pill" | "dot"> {
  return (
    _map[category] ?? {
      pill: "bg-gray-100 text-gray-700 border border-gray-200",
      dot: "bg-gray-400",
    }
  );
}
