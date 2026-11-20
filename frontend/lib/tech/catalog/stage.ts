import { catalog } from "./index";
import type { Brand } from "./types";

/** Where a device sits on the stage: a large one at the back, a phone in front, two small ones. */
export type StageSlot = "back" | "front" | "side" | "small";
type Piece = { slug: string; color: string; slot: StageSlot };

/**
 * Devices on the salon hero (Krystian 19.11: „w hero salonu przydałyby się urządzenia”). Only cut-out
 * manufacturer shots from the catalogue (transparent WebP) — a piece without one is skipped.
 */
export const SALON_STAGE: Record<Brand, Piece[]> = {
  apple: [
    { slug: "macbook-air-15", color: "srebrny", slot: "back" },
    { slug: "iphone-18-pro", color: "srebrny", slot: "front" },
    { slug: "apple-watch-series-12", color: "naturalny", slot: "side" },
    { slug: "airpods-pro-3", color: "bialy", slot: "small" },
  ],
  samsung: [
    { slug: "galaxy-tab-s12-ultra", color: "srebrny", slot: "back" },
    { slug: "galaxy-s26-ultra", color: "srebrny", slot: "front" },
    { slug: "galaxy-watch-ultra2", color: "tytanowy-srebrny", slot: "side" },
    { slug: "galaxy-buds4-pro", color: "bialy", slot: "small" },
  ],
};

export function stagePieces(brand: Brand) {
  return SALON_STAGE[brand].flatMap((p) => {
    const model = catalog.models.find((m) => m.slug === p.slug);
    const img = model?.images.find((i) => i.color === p.color && i.src && i.transparent);
    return model && img?.src ? [{ ...p, src: img.src, name: model.name }] : [];
  });
}