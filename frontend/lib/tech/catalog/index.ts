/**
 * Catalogue access (runda 18.11 v2, option A): typed data from content/katalog/*.json, read at
 * build time (static pages). Pure functions only — usable in server components, tests and scripts.
 */
import apple from "@/content/katalog/apple.json";
import samsung from "@/content/katalog/samsung.json";
import families from "@/content/katalog/rodziny.json";
import accessories from "@/content/katalog/akcesoria.json";
import quizzes from "@/content/katalog/dobor.json";
import type { Accessory, Brand, Catalog, CatalogModel, Family, Kind, Quiz } from "./types";

export * from "./types";

export const catalog: Catalog = {
  models: [...(apple as CatalogModel[]), ...(samsung as CatalogModel[])],
  families: families as Family[],
  accessories: accessories as Accessory[],
  quizzes: quizzes as Quiz[],
};

export const BRAND_NAMES: Record<Brand, string> = { apple: "Apple", samsung: "Samsung" };
/** Filter labels in the catalogue (§2). */
export const KIND_NAMES: Record<Kind, string> = { phone: "Telefony", tablet: "Tablety", laptop: "Laptopy", desktop: "Komputery", watch: "Zegarki", audio: "Słuchawki" };

/** Newest first (the catalogue's default sort). */
export function sortedModels(models: CatalogModel[] = catalog.models): CatalogModel[] {
  return [...models].sort((a, b) => b.order - a.order || a.name.localeCompare(b.name, "pl"));
}

export function findModel(brand: string, slug: string): CatalogModel | undefined {
  return catalog.models.find((m) => m.brand === brand && m.slug === slug);
}

export function modelPath(m: Pick<CatalogModel, "brand" | "slug">): string {
  return `/sprzedaz/${m.brand}/${m.slug}`;
}

export function familiesOf(brand: Brand): Family[] {
  return catalog.families.filter((f) => f.brand === brand).sort((a, b) => b.order - a.order);
}

export function modelsOfFamily(key: string): CatalogModel[] {
  return sortedModels(catalog.models.filter((m) => m.family === key));
}

/**
 * „Dobierz w 3 pytaniach”: models of the department ranked by how many picked tags they carry
 * (ties: newer first). Returns at most `limit` models with at least one match.
 */
export function pickModels(brand: Brand, kind: Kind, picked: string[], limit = 3): CatalogModel[] {
  const pool = catalog.models.filter((m) => m.brand === brand && m.kind === kind);
  return pool
    .map((m) => ({ m, score: picked.filter((t) => m.tags.includes(t)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.m.order - a.m.order)
    .slice(0, limit)
    .map((x) => x.m);
}

/** „Pasuje do”: accessories and other models named in `compat`. */
export function compatOf(m: CatalogModel): { accessories: Accessory[]; models: CatalogModel[] } {
  return {
    accessories: catalog.accessories.filter((a) => m.compat.includes(a.key)),
    models: catalog.models.filter((x) => m.compat.includes(x.slug)),
  };
}
