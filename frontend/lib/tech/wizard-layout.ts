/**
 * Wizard scene geometry (PREMIUM §4, feat/tech-kreator-wizual): where the fault label goes
 * and how its leader line runs. Pure functions in stage px, so they are unit-tested.
 *
 * Rules: the label sits outside the device (fallback: outside the effect region), wholly
 * inside the stage, never over the region, another spot or a reserved box ("Pokaż całe
 * urządzenie"); the nearest valid place to the spot wins. The leader line is straight,
 * from the edge of the spot to the nearest point of the label.
 */
export type Rect = { x: number; y: number; w: number; h: number };
export type Pt = { x: number; y: number };
export type LabelSide = "left" | "right" | "top" | "bottom";

export type LabelInput = {
  stage: { w: number; h: number };
  /** Device box (the frame after the camera transform). */
  device: Rect;
  /** Effect region after the camera transform. */
  region: Rect;
  spot: Pt;
  label: { w: number; h: number };
  /** Other spots, the "whole device" button… */
  avoid?: Rect[];
  /** Centres of the other spots: the leader line keeps clear of them too. */
  spots?: Pt[];
  margin?: number;
  gap?: number;
};

export type LabelPlace = { x: number; y: number; side: LabelSide; outsideDevice: boolean };

export function intersects(a: Rect, b: Rect, pad = 0): boolean {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

function clamp(v: number, lo: number, hi: number) {
  return hi < lo ? lo : Math.max(lo, Math.min(hi, v));
}

/** Distance from a point to a segment. */
export function segDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** Nearest point of a rect to a point. */
export function nearestOn(r: Rect, p: Pt): Pt {
  return { x: clamp(p.x, r.x, r.x + r.w), y: clamp(p.y, r.y, r.y + r.h) };
}

function around(box: Rect, i: LabelInput, margin: number, gap: number) {
  const { stage, spot, label } = i;
  // several slides along each side, so the leader can angle past other spots
  const ys = [spot.y - label.h / 2, spot.y - label.h - 10, spot.y + 10, spot.y - label.h - 60, spot.y + 60].map((y) => clamp(y, margin, stage.h - label.h - margin));
  // …and just beside each reserved box ("Pokaż całe urządzenie", other spots), so a label can tuck in next to it
  const beside = (i.avoid ?? []).flatMap((a) => [a.x + a.w + 8, a.x - label.w - 8]);
  const xs = [spot.x - label.w / 2, spot.x + 10, spot.x - label.w - 10, spot.x + 60, spot.x - label.w - 60, margin, stage.w - label.w - margin, ...beside].map((x) =>
    clamp(x, margin, stage.w - label.w - margin),
  );
  // above/below: right next to the device, or against the stage edge when that row is taken
  const tops = Array.from(new Set([box.y - gap - label.h, Math.min(box.y - gap - label.h, margin)]));
  const bottoms = Array.from(new Set([box.y + box.h + gap, Math.max(box.y + box.h + gap, stage.h - label.h - margin)]));
  return [
    ...ys.flatMap((y) => [
      { side: "left" as const, x: box.x - gap - label.w, y },
      { side: "right" as const, x: box.x + box.w + gap, y },
    ]),
    ...xs.flatMap((x) => [
      ...tops.map((y) => ({ side: "top" as const, x, y })),
      ...bottoms.map((y) => ({ side: "bottom" as const, x, y })),
    ]),
  ];
}

export function placeLabel(i: LabelInput): LabelPlace {
  const { stage, label, spot } = i;
  const avoid = i.avoid ?? [];
  const score = (r: Rect, side: LabelSide) => {
    const n = nearestOn(r, spot);
    // slight preference for a horizontal leader (reads as a caption, not a tooltip)
    return Math.hypot(n.x - spot.x, n.y - spot.y) + (side === "top" || side === "bottom" ? 12 : 0);
  };
  // roomy first, then tighter (smaller gap and stage margin) before giving up the device rule
  const passes = [
    { margin: i.margin ?? 10, gap: i.gap ?? 16, outsideDevice: true },
    { margin: 6, gap: 8, outsideDevice: true },
    { margin: i.margin ?? 10, gap: i.gap ?? 16, outsideDevice: false },
    { margin: 6, gap: 8, outsideDevice: false },
  ];
  for (const { margin, gap, outsideDevice } of passes) {
    const inStage = (r: Rect) => r.x >= margin - 0.5 && r.y >= margin - 0.5 && r.x + r.w <= stage.w - margin + 0.5 && r.y + r.h <= stage.h - margin + 0.5;
    let best: (LabelPlace & { s: number }) | null = null;
    for (const c of around(outsideDevice ? i.device : i.region, i, margin, gap)) {
      const r = { x: c.x, y: c.y, w: label.w, h: label.h };
      if (!inStage(r) || intersects(r, i.region, 6) || avoid.some((a) => intersects(r, a, 4))) continue;
      if (outsideDevice && intersects(r, i.device, 2)) continue;
      // the leader line never runs over another spot (dot radius 15 + air)
      const end = nearestOn(r, spot);
      if ((i.spots ?? []).some((q) => segDist(q, spot, end) < 22)) continue;
      const s = score(r, c.side);
      if (!best || s < best.s) best = { ...c, outsideDevice, s };
    }
    if (best) return { x: best.x, y: best.y, side: best.side, outsideDevice: best.outsideDevice };
  }
  // nothing fits: under the device, clamped into the stage
  const margin = 6;
  const x = Math.max(margin, Math.min(stage.w - label.w - margin, spot.x - label.w / 2));
  const y = Math.max(margin, Math.min(stage.h - label.h - margin, i.device.y + i.device.h + 8));
  return { x, y, side: "bottom", outsideDevice: false };
}

/** Leader line: from the spot's edge (radius r) to the nearest point of the label. */
export function leader(spot: Pt, label: Rect, r: number): { a: Pt; b: Pt } {
  const b = nearestOn(label, spot);
  const dx = b.x - spot.x;
  const dy = b.y - spot.y;
  const d = Math.hypot(dx, dy) || 1;
  return { a: { x: spot.x + (dx / d) * r, y: spot.y + (dy / d) * r }, b };
}

/** Camera transform: scale `s` around `origin` (all px). */
export function zoomPt(p: Pt, origin: Pt, s: number): Pt {
  return { x: origin.x + (p.x - origin.x) * s, y: origin.y + (p.y - origin.y) * s };
}

export function zoomRect(r: Rect, origin: Pt, s: number): Rect {
  const a = zoomPt({ x: r.x, y: r.y }, origin, s);
  return { x: a.x, y: a.y, w: r.w * s, h: r.h * s };
}
