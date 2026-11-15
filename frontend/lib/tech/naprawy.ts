/**
 * Repair pages helpers (SPEC §12.4): visibility, SEO, links from device pages, the wizard
 * and blog posts. Only `published && verified` pages are public; drafts only on staging.
 */
import { repairPages, type RepairPageData } from "@/config/naprawy";
import type { ServicePoint } from "@/config/prokom";
import { joinCities } from "./point-format";
import { isDraftMode } from "./points";
import type { CategoryCode } from "./wizard-data";

export const REPAIRS_BASE = "/naprawy";
export const repairPath = (slug: string) => `${REPAIRS_BASE}/${slug}`;

export function isLive(p: Pick<RepairPageData, "published" | "verified">): boolean {
  return p.published && p.verified;
}

/** Built pages: production = live only; staging also drafts (framed). */
export function buildableRepairs(draft: boolean = isDraftMode(), pages: RepairPageData[] = repairPages): RepairPageData[] {
  return pages.filter((p) => isLive(p) || draft);
}

/** Sitemap and links: live only (never drafts, also on staging). */
export function liveRepairs(pages: RepairPageData[] = repairPages): RepairPageData[] {
  return pages.filter(isLive);
}

export function repairBySlug(slug: string, pages: RepairPageData[] = repairPages): RepairPageData | undefined {
  return pages.find((p) => p.slug === slug);
}

export function repairsForDevice(device: CategoryCode, pages: RepairPageData[] = repairPages): RepairPageData[] {
  return liveRepairs(pages).filter((p) => p.device === device);
}

/** Wizard "Dowiedz się więcej": live page for the device + fault, else null. */
export function repairForFault(device: CategoryCode, usterka: string, pages: RepairPageData[] = repairPages): RepairPageData | null {
  return liveRepairs(pages).find((p) => p.device === device && p.usterka === usterka) ?? null;
}

/** SEO: "Wymiana ekranu iPhone — Rabka-Zdrój[ i Zakopane]" (city never as a variant page). */
export function repairSeo(p: RepairPageData, points: Pick<ServicePoint, "city">[]): { title: string; description: string } {
  return { title: `${p.title} — ${joinCities(points)}`, description: p.description };
}

/** Own text of a page (without template blocks) — for the "< 30% shared" test. */
export function ownText(p: RepairPageData): string {
  return [
    ...p.intro,
    ...p.objawy,
    ...p.przebieg,
    ...p.przyczyny.flatMap((x) => [x.t, x.s]),
    ...p.czesci,
    ...p.przygotowanie,
    ...p.poNaprawie,
    ...p.porady.flatMap((x) => [x.t, x.s]),
    ...p.faq.flatMap((f) => [f.q, f.a]),
  ].join(" ");
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Share of word 5-grams of `a` that also appear in `b` (0–1). */
export function sharedRatio(a: string, b: string, n = 5): number {
  const grams = (t: string) => {
    const w = t.toLocaleLowerCase("pl-PL").split(/[^a-z0-9ąćęłńóśźż]+/).filter(Boolean);
    const out = new Set<string>();
    for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(" "));
    return out;
  };
  const ga = grams(a);
  if (!ga.size) return 0;
  const gb = grams(b);
  let hit = 0;
  ga.forEach((g) => {
    if (gb.has(g)) hit++;
  });
  return hit / ga.size;
}

const BLOG_DEVICES: Record<string, CategoryCode[]> = {
  telefony: ["phone", "tablet", "smartwatch"],
  "laptopy-i-komputery": ["laptop", "desktop", "console", "data_recovery"],
  drukarki: ["printer"],
  "porady-zakupowe": [],
};

/**
 * "Powiązana naprawa" under a blog post (SPEC §12.11): a live repair of the post's new
 * category whose title shares the most words with the post tags/title. Post content unchanged.
 */
export function repairForPost(post: { title: string; tags?: string[] }, blogCategory: string, pages: RepairPageData[] = repairPages): RepairPageData | null {
  const devices = BLOG_DEVICES[blogCategory] ?? [];
  const words = new Set(
    [post.title, ...(post.tags ?? [])]
      .join(" ")
      .toLocaleLowerCase("pl-PL")
      .split(/[^a-z0-9ąćęłńóśźż]+/)
      .filter((w) => w.length > 3),
  );
  let best: RepairPageData | null = null;
  let bestScore = 0;
  for (const p of liveRepairs(pages).filter((r) => devices.includes(r.device))) {
    const score = p.title
      .toLocaleLowerCase("pl-PL")
      .split(/[^a-z0-9ąćęłńóśźż]+/)
      .filter((w) => w.length > 3 && words.has(w)).length;
    if (score > bestScore) {
      best = p;
      bestScore = score;
    }
  }
  return best;
}
