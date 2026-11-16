import type { MetadataRoute } from "next";
import { servicePoints, type ServicePoint } from "@/config/prokom";
import { BLOG_POSTS } from "@/lib/blog-posts";
import { BLOG_CATEGORIES } from "./blog-taxonomy";
import { courierInSitemap } from "./courier-page";
import { liveRepairs, repairPath } from "./naprawy";
import { publishedLocalPages } from "./local-pages";
import { SITE_URL } from "@/lib/site-config";

type Freq = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

/**
 * Public pages for the sitemap (SPEC §9). Removed pages (/akcesoria, /oferta) are 301s and
 * stay out; local pages only when published (lib/tech/local-pages.ts). Panels never appear.
 */
export const STATIC_ROUTES: { path: string; priority: number; freq: Freq }[] = [
  { path: "/", priority: 1.0, freq: "weekly" },
  { path: "/zgloszenie", priority: 0.9, freq: "yearly" },
  { path: "/punkty-serwisowe", priority: 0.9, freq: "monthly" },
  { path: "/uslugi", priority: 0.9, freq: "monthly" },
  { path: "/serwis-telefonow", priority: 0.9, freq: "monthly" },
  { path: "/serwis-laptopow", priority: 0.8, freq: "monthly" },
  { path: "/serwis-tabletow", priority: 0.8, freq: "monthly" },
  { path: "/serwis-komputerow", priority: 0.75, freq: "monthly" },
  { path: "/serwis-smartwatchy", priority: 0.75, freq: "monthly" },
  { path: "/serwis-drukarek", priority: 0.7, freq: "monthly" },
  { path: "/serwis-konsol", priority: 0.7, freq: "monthly" },
  { path: "/odzyskiwanie-danych", priority: 0.75, freq: "monthly" },
  { path: "/hammer-glass", priority: 0.85, freq: "monthly" },
  { path: "/obslugiwane-miejscowosci", priority: 0.8, freq: "monthly" },
  { path: "/kontakt", priority: 0.8, freq: "yearly" },
  { path: "/o-firmie", priority: 0.6, freq: "yearly" },
  { path: "/track", priority: 0.6, freq: "yearly" },
  { path: "/faq", priority: 0.7, freq: "monthly" },
  { path: "/blog", priority: 0.75, freq: "weekly" },
  { path: "/polityka-prywatnosci", priority: 0.2, freq: "yearly" },
  { path: "/regulamin", priority: 0.2, freq: "yearly" },
];

/**
 * lastModified of pages without their own date: the build date (BUILD_DATE, ISO) or the last
 * content review. Not `new Date()`: every request would announce a fresh change to crawlers.
 */
const CONTENT_DATE = "2026-11-16";
const buildDate = process.env.BUILD_DATE;
export const SITEMAP_DATE = new Date(buildDate && !Number.isNaN(Date.parse(buildDate)) ? buildDate : CONTENT_DATE);

export function buildSitemap(now: Date = SITEMAP_DATE, points: ServicePoint[] = servicePoints): MetadataRoute.Sitemap {
  const url = (path: string) => (path === "/" ? SITE_URL : `${SITE_URL}${path}`);
  const pages: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({ url: url(r.path), lastModified: now, changeFrequency: r.freq, priority: r.priority }));
  const locals: MetadataRoute.Sitemap = publishedLocalPages(points).map((p) => ({
    url: url(`/${p.slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));
  // BLOG_POSTS has one duplicated slug (SPEC §12.11) — list each address once.
  const seen = new Set<string>();
  const blog: MetadataRoute.Sitemap = BLOG_POSTS.filter((p) => !seen.has(p.slug) && seen.add(p.slug)).map((post) => ({
    url: url(`/blog/${post.slug}`),
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  // Blog categories (SPEC §12.11, TD5 PR 2).
  const blogCategories: MetadataRoute.Sitemap = BLOG_CATEGORIES.map((c) => ({
    url: url(`/blog/kategoria/${c.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.65,
  }));
  // TD5 PR 3: preparation guide; courier page only once published (SPEC §12.10).
  const td5: MetadataRoute.Sitemap = [
    { url: url("/jak-przygotowac-sprzet"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    ...(courierInSitemap() ? [{ url: url("/naprawa-kurierem"), lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 }] : []),
  ];
  // Repair pages: published && verified only (SPEC §12.4, TD5b).
  const repairs: MetadataRoute.Sitemap = liveRepairs().map((r) => ({ url: url(repairPath(r.slug)), lastModified: now, changeFrequency: "monthly", priority: 0.75 }));
  return [...pages, ...locals, ...blog, ...blogCategories, ...td5, ...repairs];
}
