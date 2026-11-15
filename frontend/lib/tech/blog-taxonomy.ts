/**
 * Blog taxonomy (docs/tech/SPEC.md §12.11): 4 public categories on top of lib/blog-posts.ts.
 * Post content is never edited — this layer maps old categories to new ones, replaces
 * service links to removed pages (/akcesoria, /oferta) at render time and holds the
 * category intros. Intros accepted on 15.11.2026.
 *
 * TODO(krystian): accept the post assignment (SPEC §10).
 */
import { servicePoints } from "@/config/prokom";
import { BLOG_POSTS, type BlogPost } from "@/lib/blog-posts";
import { publishedPoints } from "./points";

export type BlogCategorySlug = "telefony" | "laptopy-i-komputery" | "drukarki" | "porady-zakupowe";

export type ServiceLink = { href: string; label: string };

export type BlogCategory = {
  slug: BlogCategorySlug;
  name: string;
  /** Intro for the category page. `{punkty}` = "w Rabce-Zdroju" or "w Rabce-Zdroju i Zakopanem". */
  intro: string;
  description: string;
  /** Default "Powiązana usługa" link (replaces /akcesoria and /oferta). */
  service: ServiceLink;
  /** "Masz taki problem?" box: device pages of the category. */
  related: ServiceLink[];
};

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    slug: "telefony",
    name: "Telefony i tablety",
    intro:
      "Pęknięty ekran, słaba bateria, telefon, który nie chce się ładować albo przeszedł zalanie — tu zebraliśmy porady z codziennej pracy naszego serwisu {punkty}. Piszemy, co możesz sprawdzić sam, kiedy naprawa ma sens i jak chronić telefon, żeby rzadziej trafiał do serwisu. Jeśli problem nie znika, zgłoś naprawę online — wycenę dostaniesz przed rozpoczęciem pracy.",
    description: "Porady serwisu o telefonach i tabletach: ekran, bateria, ładowanie, zalanie i ochrona ekranu. Co sprawdzić samemu i kiedy naprawa ma sens.",
    service: { href: "/serwis-telefonow", label: "Serwis telefonów" },
    related: [
      { href: "/serwis-telefonow", label: "Serwis telefonów" },
      { href: "/serwis-tabletow", label: "Serwis tabletów" },
      { href: "/serwis-smartwatchy", label: "Serwis smartwatchy" },
      { href: "/hammer-glass", label: "Hammer Glass — folie na wymiar" },
    ],
  },
  {
    slug: "laptopy-i-komputery",
    name: "Laptopy i komputery",
    intro:
      "Laptop się przegrzewa, komputer zwalnia albo sam się restartuje? W tej części bloga wyjaśniamy najczęstsze usterki laptopów i komputerów stacjonarnych, podpowiadamy, kiedy opłaca się modernizacja, a kiedy naprawa, i jak przygotować sprzęt do pracy lub grania. Poradniki piszemy na podstawie napraw, które robimy na co dzień.",
    description: "Poradniki o laptopach i komputerach: przegrzewanie, wolne działanie, dysk SSD, modernizacja i sprzęt do gier. Z codziennej pracy serwisu.",
    service: { href: "/serwis-laptopow", label: "Serwis laptopów" },
    related: [
      { href: "/serwis-laptopow", label: "Serwis laptopów" },
      { href: "/serwis-komputerow", label: "Serwis komputerów" },
      { href: "/serwis-konsol", label: "Serwis konsol" },
      { href: "/odzyskiwanie-danych", label: "Odzyskiwanie danych" },
    ],
  },
  {
    slug: "drukarki",
    name: "Drukarki",
    intro:
      "Drukarka nie drukuje, brudzi kartki albo zgubiła Wi-Fi — zanim zadzwonisz do serwisu, sprawdź nasze poradniki. Opisujemy najczęstsze usterki drukarek atramentowych i laserowych, proste rozwiązania do zrobienia samemu i to, jak dbać o drukarkę, żeby rzadziej się psuła.",
    description: "Poradniki o drukarkach atramentowych i laserowych: paski na wydruku, zacięcia papieru, Wi-Fi i konserwacja. Co zrobić samemu, a kiedy do serwisu.",
    service: { href: "/serwis-drukarek", label: "Serwis drukarek" },
    related: [{ href: "/serwis-drukarek", label: "Serwis drukarek" }],
  },
  {
    slug: "porady-zakupowe",
    name: "Porady zakupowe",
    intro:
      "Nowy czy poleasingowy laptop? Jaki komputer do firmy albo pracy zdalnej? Na co uważać przy zakupie akcesoriów do telefonu? Zebraliśmy porady, które dajemy klientom w naszych sklepach {punkty} — bez reklam konkretnych ofert i bez cen.",
    description: "Porady przed zakupem: laptop nowy czy poleasingowy, komputer do firmy i pracy zdalnej, akcesoria do telefonu. Bez reklam konkretnych ofert i bez cen.",
    service: { href: "/uslugi", label: "Naprawy" },
    related: [
      { href: "/uslugi", label: "Wszystkie naprawy" },
      { href: "/serwis-laptopow", label: "Serwis laptopów" },
      { href: "/serwis-komputerow", label: "Serwis komputerów" },
    ],
  },
];

/** Old category (blog-posts.ts) → new category. */
export const CATEGORY_MAP: Record<string, BlogCategorySlug> = {
  "Naprawa telefonów": "telefony",
  "Akcesoria GSM": "telefony",
  Laptopy: "laptopy-i-komputery",
  Komputery: "laptopy-i-komputery",
  Gaming: "laptopy-i-komputery",
  Drukarki: "drukarki",
  Poleasing: "porady-zakupowe",
  "Sprzęt biznesowy": "porady-zakupowe",
  "Sklep GSM": "porady-zakupowe",
};

/** Per-post overrides (SPEC §12.11 table). */
export const SLUG_OVERRIDES: Record<string, BlogCategorySlug> = {
  "oryginalne-czesci-samsung-czy-zamienniki": "telefony",
  "jak-rozpoznac-oryginalne-czesci-w-serwisie-gsm": "telefony",
};

/** Links that replace /akcesoria and /oferta for specific posts (otherwise: category default). */
const SERVICE_OVERRIDES: Record<string, ServiceLink> = {
  "jak-dobrac-etui-do-telefonu": { href: "/hammer-glass", label: "Hammer Glass — folie na wymiar" },
  "gdzie-kupic-akcesoria-gsm-rabka-zdroj": { href: "/hammer-glass", label: "Hammer Glass — folie na wymiar" },
  "dlaczego-warto-kupowac-akcesoria-gsm-w-sprawdzonym-sklepie": { href: "/hammer-glass", label: "Hammer Glass — folie na wymiar" },
  "laptop-gamingowy-czy-komputer-stacjonarny": { href: "/serwis-komputerow", label: "Serwis komputerów" },
};

/** Old-category default inside "laptopy-i-komputery" (SPEC: /serwis-laptopow or /serwis-komputerow). */
const OLD_CATEGORY_SERVICE: Record<string, ServiceLink> = {
  Komputery: { href: "/serwis-komputerow", label: "Serwis komputerów" },
  Gaming: { href: "/serwis-komputerow", label: "Serwis komputerów" },
};

const REMOVED_PAGES = new Set(["/akcesoria", "/oferta"]);

export function categoryOf(post: Pick<BlogPost, "slug" | "category">): BlogCategory {
  const slug = SLUG_OVERRIDES[post.slug] ?? CATEGORY_MAP[post.category];
  const cat = BLOG_CATEGORIES.find((c) => c.slug === slug);
  if (!cat) throw new Error(`Blog post without a category: ${post.slug} (${post.category})`);
  return cat;
}

export function categoryBySlug(slug: string): BlogCategory | undefined {
  return BLOG_CATEGORIES.find((c) => c.slug === slug);
}

/** "Powiązana usługa" — links to removed pages are replaced, the rest stays as in the post. */
export function serviceLinkOf(post: Pick<BlogPost, "slug" | "category" | "relatedServiceHref" | "relatedServiceLabel">): ServiceLink | null {
  const href = post.relatedServiceHref;
  if (href && !REMOVED_PAGES.has(href)) return post.relatedServiceLabel ? { href, label: post.relatedServiceLabel } : null;
  if (!href) return null;
  return SERVICE_OVERRIDES[post.slug] ?? OLD_CATEGORY_SERVICE[post.category] ?? categoryOf(post).service;
}

const byDateDesc = (a: BlogPost, b: BlogPost) => b.date.localeCompare(a.date);

export function postsInCategory(slug: BlogCategorySlug, posts: BlogPost[] = BLOG_POSTS): BlogPost[] {
  return posts.filter((p) => categoryOf(p).slug === slug).sort(byDateDesc);
}

/** Featured post of a category: `featured`, otherwise the newest. */
export function featuredInCategory(slug: BlogCategorySlug, posts: BlogPost[] = BLOG_POSTS): BlogPost | undefined {
  const list = postsInCategory(slug, posts);
  return list.find((p) => p.featured) ?? list[0];
}

/** Related posts: `relatedSlugs`, otherwise the same NEW category (SPEC §12.11). */
export function relatedPosts(post: BlogPost, limit = 3, posts: BlogPost[] = BLOG_POSTS): BlogPost[] {
  const manual = (post.relatedSlugs ?? [])
    .map((s) => posts.find((p) => p.slug === s))
    .filter((p): p is BlogPost => !!p)
    .slice(0, limit);
  if (manual.length) return manual;
  const cat = categoryOf(post).slug;
  return posts.filter((p) => p.slug !== post.slug && categoryOf(p).slug === cat).sort(byDateDesc).slice(0, limit);
}

/** Intro with the cities of published points (Zakopane only once published). */
export function categoryIntro(cat: BlogCategory, points = servicePoints): string {
  const pub = publishedPoints(points);
  const where = pub.length > 1 ? "w Rabce-Zdroju i Zakopanem" : "w Rabce-Zdroju";
  return cat.intro.replace("{punkty}", where);
}
