/**
 * Internal links of device and repair pages (2026-11): device ↔ repairs ↔ blog ↔ courier
 * ↔ points. Blog posts are only linked (content unchanged, SPEC §12.11); posts about
 * buying accessories are skipped (no shop, SPEC §8).
 */
import { BLOG_POSTS, type BlogPost } from "@/lib/blog-posts";
import { postsInCategory, type BlogCategorySlug } from "./blog-taxonomy";
import type { CategoryCode } from "./wizard-data";

const BLOG_CATEGORY: Partial<Record<CategoryCode, BlogCategorySlug>> = {
  phone: "telefony",
  tablet: "telefony",
  smartwatch: "telefony",
  laptop: "laptopy-i-komputery",
  desktop: "laptopy-i-komputery",
  console: "laptopy-i-komputery",
  data_recovery: "laptopy-i-komputery",
  printer: "drukarki",
};

const SHOPPY = /sklep|kup|akcesori|zakup|prezent|ofert/i;

export function blogCategoryHref(category: CategoryCode): string {
  const slug = BLOG_CATEGORY[category];
  return slug ? `/blog/kategoria/${slug}` : "/blog";
}

const words = (t: string) =>
  t
    .toLocaleLowerCase("pl-PL")
    .split(/[^a-z0-9ąćęłńóśźż]+/)
    .filter((w) => w.length > 3)
    .map((w) => w.slice(0, 6));

/** Up to `n` posts of the device's blog category, most relevant to `keywords` first. */
export function relatedPosts(category: CategoryCode, keywords: string, n = 3, posts: BlogPost[] = BLOG_POSTS): { href: string; title: string }[] {
  const slug = BLOG_CATEGORY[category];
  if (!slug) return [];
  const keys = new Set(words(keywords));
  return postsInCategory(slug, posts)
    .filter((p) => !SHOPPY.test(p.title))
    .map((p, i) => ({ p, i, score: words([p.title, ...(p.tags ?? [])].join(" ")).filter((w) => keys.has(w)).length }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, n)
    .map(({ p }) => ({ href: `/blog/${p.slug}`, title: p.title }));
}
