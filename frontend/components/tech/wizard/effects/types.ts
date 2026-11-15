/**
 * Effect components (PREMIUM §4): each family draws inside its region box in a
 * 0–100 viewBox. Motion lives in tech-wizard.css (`.t-fx--eN …`): an entrance, then a
 * loop of at most 3 cycles that ends on the poster frame. The SVG's static attributes
 * ARE the poster frame — `.is-poster` (reduced motion, /lab grid, off screen) simply
 * switches animations off. Colours come from tokens, so light/dark work by themselves.
 */
export type EffectProps = {
  variant?: string;
  /** Impact / hotspot inside the region, % of the region (local faults). */
  at?: [number, number] | null;
  /** Region width / height in px — lets round shapes stay round. */
  aspect: number;
};

/** Deterministic pseudo-random numbers (same drawing on server, client and in tests). */
export function seeded(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
