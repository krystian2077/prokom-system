/**
 * Brand service pages (/serwis-apple, /serwis-samsung) — data → view helpers.
 * Data: config/serwis-marek.ts. View: components/tech/brand/BrandServicePage.tsx.
 */
import type { ServicePoint } from "@/config/prokom";
import { repairPages, type RepairPageData } from "@/config/naprawy";
import { brandPages, type BrandPage, type BrandRepair } from "@/config/serwis-marek";
import { citiesTitle } from "./devices";
import { isLive, repairPath } from "./naprawy";
import { submitHref, type CategoryCode } from "./wizard-data";

export const BRAND_PATHS = brandPages.map((b) => b.path);

/** SEO title (before " | PRO-KOM Tech") and description (120–155 chars). */
export function brandSeo(page: BrandPage, points: Pick<ServicePoint, "city">[]): { title: string; description: string } {
  const cities = citiesTitle(points);
  return { title: `${page.title} — ${cities}`, description: `${page.descStart} ${cities}. ${page.descEnd}` };
}

/**
 * Model chip → /zgloszenie with the category and the model at the start of the description.
 * The form reads only `category` and `usterka` (KONTRAKT §1.4) — there is no brand / model
 * parameter, so the model travels in `usterka` (→ problem_description, editable).
 */
export function modelHref(category: CategoryCode, model: string): string {
  return submitHref(category, `Model: ${model}. Usterka:`);
}

export type RepairCard = { key: string; t: string; s: string; href: string; device: CategoryCode; usterka: string; live: boolean };

/**
 * Repair cards of a brand page. A card pointing at config/naprawy.ts links to the repair page
 * only when it is `published && verified`; otherwise (and for plain cards) it leads to the form
 * with the category and fault filled in. Unknown slugs are dropped (tests catch them).
 */
export function brandRepairCards(page: BrandPage, pages: RepairPageData[] = repairPages): RepairCard[] {
  return page.repairs.flatMap((r: BrandRepair): RepairCard[] => {
    if ("slug" in r) {
      const p = pages.find((x) => x.slug === r.slug);
      if (!p) return [];
      const live = isLive(p);
      return [{ key: p.slug, t: p.h1, s: r.s, href: live ? repairPath(p.slug) : submitHref(p.device, p.usterka), device: p.device, usterka: p.usterka, live }];
    }
    return [{ key: r.t, t: r.t, s: r.s, href: submitHref(r.category, r.usterka), device: r.category, usterka: r.usterka, live: false }];
  });
}
