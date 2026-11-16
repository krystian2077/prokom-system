/**
 * Served towns → nearer service point (design T.Main `nearR` / `nearZ`, PodhaleMap).
 * Used by "Sprawdź, gdzie masz bliżej", the towns section and the map.
 * Distances are not shown (unconfirmed numbers, SPEC §10).
 */
import type { PointKey } from "@/config/prokom";

export type Town = {
  name: string;
  slug: string;
  point: PointKey;
  /** Position on the PodhaleMap illustration, in % of its 640×560 frame. */
  map: { x: number; y: number; flip?: boolean };
};

const pct = (x: number, y: number, flip?: boolean) => ({ x: Math.round((x / 640) * 1000) / 10, y: Math.round((y / 560) * 1000) / 10, flip });

export const towns: Town[] = [
  { name: "Rabka-Zdrój", slug: "rabka-zdroj", point: "rabka", map: pct(289, 107) },
  { name: "Raba Wyżna", slug: "raba-wyzna", point: "rabka", map: pct(175, 163) },
  { name: "Jordanów", slug: "jordanow", point: "rabka", map: pct(125, 53) },
  { name: "Mszana Dolna", slug: "mszana-dolna", point: "rabka", map: pct(495, 83) },
  { name: "Nowy Targ", slug: "nowy-targ", point: "rabka", map: pct(345, 257) },
  { name: "Czarny Dunajec", slug: "czarny-dunajec", point: "rabka", map: pct(145, 305) },
  { name: "Zakopane", slug: "zakopane", point: "zakopane", map: pct(289, 451) },
  { name: "Kościelisko", slug: "koscielisko", point: "zakopane", map: pct(185, 461, true) },
  { name: "Poronin", slug: "poronin", point: "zakopane", map: pct(375, 413) },
  { name: "Biały Dunajec", slug: "bialy-dunajec", point: "zakopane", map: pct(335, 373) },
  { name: "Bukowina Tatrzańska", slug: "bukowina-tatrzanska", point: "zakopane", map: pct(455, 395) },
  { name: "Szaflary", slug: "szaflary", point: "zakopane", map: pct(355, 317) },
];

/** "w Rabce-Zdroju" — locative used in sentences ("bliżej do punktu w …"). */
export const pointLocative: Record<PointKey, string> = {
  rabka: "w Rabce-Zdroju",
  zakopane: "w Zakopanem",
};

/** Genitive for "Bliżej do …" headings. */
export const pointGenitive: Record<PointKey, string> = {
  rabka: "Rabki-Zdroju",
  zakopane: "Zakopanego",
};

export function normalizeTown(s: string): string {
  return s
    .trim()
    .toLocaleLowerCase("pl-PL")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Nearer point for a typed town, limited to the points that may be shown.
 * When the nearer point is hidden (unpublished), the town goes to the first visible point.
 */
export function nearestPoint(input: string, visible: PointKey[]): { town: Town; point: PointKey } | null {
  const q = normalizeTown(input);
  if (!q || !visible.length) return null;
  const town = towns.find((t) => normalizeTown(t.name) === q) ?? towns.find((t) => normalizeTown(t.name).startsWith(q));
  if (!town) return null;
  return { town, point: visible.includes(town.point) ? town.point : visible[0] };
}
