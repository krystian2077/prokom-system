import type { PointKey } from "@/config/prokom";

/**
 * Static street maps of the points (OpenStreetMap tiles composed once on 23.11.2026, centred on
 * config `geo`; © OpenStreetMap contributors, ODbL — the attribution is shown on the map).
 * No external request from the page (SPEC §7). Rebuild when `geo` changes.
 */
export const POINT_MAPS: Partial<Record<PointKey, { src: string; width: number; height: number }>> = {
  rabka: { src: "/tech/punkty/mapa-rabka.webp", width: 1200, height: 640 },
  zakopane: { src: "/tech/punkty/mapa-zakopane.webp", width: 1200, height: 640 },
};
