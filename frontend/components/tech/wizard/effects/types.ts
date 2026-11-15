/**
 * Effect components (PREMIUM §4): each family draws over its region. Motion lives in
 * tech-wizard.css (`.t-fx--eN …`): an entrance, then a loop of at most 3 cycles that ends
 * on the poster frame. The static attributes ARE the poster frame — `.is-poster` (reduced
 * motion, /lab grid) simply switches animations off, `.is-paused` (off screen) pauses them.
 * Colours come from tokens, so light/dark work by themselves. Only transform, opacity and
 * stroke-dashoffset are animated (compositor-friendly, 60 fps).
 */
export type EffectProps = {
  variant?: string;
  /** Impact / hotspot inside the region, % of the region (local faults). */
  at?: [number, number] | null;
  /** Region width / height in px — lets round shapes stay round. */
  aspect: number;
  /** Unit vector from the hotspot towards the device's centre (badge offset). */
  nudge?: [number, number];
  /** Unique id prefix for SVG defs (several scenes on one page, /lab). */
  uid?: string;
};

/** Deterministic pseudo-random numbers (same drawing on server, client and in tests). */
export function seeded(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
