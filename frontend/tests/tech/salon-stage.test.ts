/** Salon hero devices (Krystian 19.11): every configured piece exists in the catalogue as a cut-out shot. */
import { describe, expect, it } from "vitest";
import { SALON_STAGE, stagePieces } from "@/lib/tech/catalog/stage";
import { catalog } from "@/lib/tech/catalog";

describe("salon stage", () => {
  for (const brand of ["apple", "samsung"] as const) {
    it(`${brand}: each piece is a real model and colour of that brand`, () => {
      for (const p of SALON_STAGE[brand]) {
        const model = catalog.models.find((m) => m.slug === p.slug);
        expect(model?.brand, p.slug).toBe(brand);
        expect(model?.images.some((i) => i.color === p.color), `${p.slug}/${p.color}`).toBe(true);
      }
    });
    it(`${brand}: all four pieces have a transparent shot`, () => {
      expect(stagePieces(brand).map((p) => p.slug)).toEqual(SALON_STAGE[brand].map((p) => p.slug));
    });
  }
});
