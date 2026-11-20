/**
 * Server-side builder of SalesNav (the capsule's „Sprzedaż” menu and the home page section). Imports
 * the catalogue — call it only from server components (TechShell, the home page).
 */
import { catalog, modelPath, sortedModels } from "./index";
import { salesColumns, SALON_HREF, type SalesNav, type SalesTeaser } from "./nav";
import type { Brand, CatalogModel } from "./types";

/** The hero of each salon: a cut-out shot looks best on the dark stage (silver iPhone — Krystian 19.11). */
const HERO: Record<Brand, { slug: string; color: string }> = { apple: { slug: "iphone-18-pro", color: "srebrny" }, samsung: { slug: "galaxy-s26-ultra", color: "srebrny" } };

function teaser(m: CatalogModel, color?: string): SalesTeaser {
  const img = (color ? m.images.find((i) => i.src && i.color === color && i.transparent) : undefined) ?? m.images.find((i) => i.src && i.transparent) ?? m.images.find((i) => i.src) ?? null;
  return { name: m.name, href: modelPath(m), img: img?.src ?? null, transparent: !!img?.transparent, bg: img?.bg ?? null, brand: m.brand };
}

export function buildSalesNav(newestCount = 6): SalesNav {
  const cols = salesColumns();
  const salons = (["apple", "samsung"] as Brand[]).map((brand) => {
    const hero = catalog.models.find((m) => m.slug === HERO[brand].slug) ?? sortedModels(catalog.models.filter((m) => m.brand === brand))[0];
    const t = teaser(hero, HERO[brand].color);
    return { brand, title: brand === "apple" ? "Apple" : "Samsung", href: SALON_HREF[brand], img: t.img, transparent: t.transparent, bg: t.bg, departments: cols.find((c) => c.brand === brand)?.links ?? [] };
  });
  // one per family, newest first, alternating brands
  const seen = new Set<string>();
  const newest = sortedModels().filter((m) => m.isNew && !seen.has(m.family) && seen.add(m.family)).slice(0, newestCount).map((m) => teaser(m));
  return { count: catalog.models.length, salons, newest };
}
