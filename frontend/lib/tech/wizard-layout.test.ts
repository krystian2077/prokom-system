import { describe, expect, it } from "vitest";
import { FRAME_BOX, SCENE_ZOOM, wizardDevices } from "./wizard-data";
import { badgeDir, badgeSpot, intersects, leader, nearestOn, placeLabel, segDist, zoomPt, zoomRect, type Rect } from "./wizard-layout";

/** Desktop stage at 1440 (tech-wizard.css: 554 px column, 660 px scene, card ≈ 140 px; feat/tech-glowna-zdjecia). */
const STAGE = { w: 528, h: 482 };
/** The frame rule of `.t-scene__frame` (--w): room for the camera zoom and a label row (--resv 100 px). */
function frameFor(crop: [number, number, number, number]) {
  const ar = crop[2] / crop[3];
  const w = Math.min(FRAME_BOX.desktop[0], FRAME_BOX.desktop[1] * ar, (STAGE.w - 8) / 1.24, ((STAGE.h - 100) / SCENE_ZOOM) * ar);
  return [w, w / ar];
}
const LABEL_H = 30;
const labelW = (t: string) => 34 + t.length * 7.4; // 12.5 px / 800 ≈ 7.4 px per char + dot and padding

function layout(deviceId: string, fault: string, zoom: boolean) {
  const d = wizardDevices.find((x) => x.id === deviceId)!;
  const sc = d.scenes[fault];
  const [fw, fh] = frameFor(d.photo!.crop);
  const F: Rect = { x: (STAGE.w - fw) / 2, y: (STAGE.h - fh) / 2, w: fw, h: fh };
  const s = zoom ? SCENE_ZOOM : 1;
  const f = sc.focus ?? [50, 50];
  const origin = { x: F.x + (f[0] / 100) * fw, y: F.y + (f[1] / 100) * fh };
  const pt = (p: [number, number]) => zoomPt({ x: F.x + (p[0] / 100) * fw, y: F.y + (p[1] / 100) * fh }, origin, s);
  const [rx, ry, rw, rh] = sc.region;
  const region = zoomRect({ x: F.x + (rx / 100) * fw, y: F.y + (ry / 100) * fh, w: (rw / 100) * fw, h: (rh / 100) * fh }, origin, s);
  const device = zoomRect(F, origin, s);
  const spot = pt(sc.spot!);
  const avoid = d.photo!.spots.filter(([t]) => t !== fault).map(([, x, y]) => pt([x, y])).map((p) => ({ x: p.x - 17, y: p.y - 17, w: 34, h: 34 }));
  if (zoom) avoid.push({ x: 4, y: 4, w: 210, h: 36 }); // "Pokaż całe urządzenie"
  const label = { w: labelW(fault), h: LABEL_H };
  const spots = d.photo!.spots.filter(([t]) => t !== fault).map(([, x, y]) => pt([x, y]));
  return { place: placeLabel({ stage: STAGE, device, region, spot, label, avoid, spots }), region, device, spot, label, avoid, spots };
}

describe("label placement (PREMIUM §4, feat/tech-kreator-wizual)", () => {
  const local = wizardDevices.flatMap((d) => d.faults.filter((f) => d.scenes[f].spot).map((f) => [d.id, f] as const));

  it.each(local.flatMap(([d, f]) => [[d, f, false] as const, [d, f, true] as const]))("%s · %s (zoom %s): inside the stage, off the region and the other spots", (d, f, zoom) => {
    const { place, region, label, avoid, spot, spots } = layout(d, f, zoom);
    const r = { x: place.x, y: place.y, w: label.w, h: label.h };
    expect(r.x).toBeGreaterThanOrEqual(5.5);
    expect(r.y).toBeGreaterThanOrEqual(5.5);
    expect(r.x + r.w).toBeLessThanOrEqual(STAGE.w - 5.5);
    expect(r.y + r.h).toBeLessThanOrEqual(STAGE.h - 5.5);
    expect(intersects(r, region), "covers the effect region").toBe(false);
    for (const a of avoid) expect(intersects(r, a), "covers a spot / the button").toBe(false);
    if (place.outsideDevice) {
      const end = nearestOn(r, spot);
      for (const q of spots) expect(segDist(q, spot, end), "leader crosses a spot").toBeGreaterThanOrEqual(22);
    }
  });

  it("with and without the camera, every label sits outside the device", () => {
    const inside = local.flatMap(([d, f]) => [false, true].filter((z) => !layout(d, f, z).place.outsideDevice).map((z) => `${d} · ${f}${z ? " (zoom)" : ""}`));
    expect(inside).toEqual([]);
  });

  it("the zoomed device always fits the stage", () => {
    for (const [d, f] of local) {
      const { device } = layout(d, f, true);
      expect(device.x, `${d} · ${f}`).toBeGreaterThanOrEqual(0);
      expect(device.x + device.w, `${d} · ${f}`).toBeLessThanOrEqual(STAGE.w);
    }
  });

  it("a label tucks in beside a reserved box (the 'whole device' button) instead of covering the device", () => {
    const place = placeLabel({
      stage: { w: 528, h: 482 },
      device: { x: 138, y: 70, w: 274, h: 382 },
      region: { x: 152, y: 71, w: 50, h: 19 },
      spot: { x: 175, y: 74 },
      label: { w: 163, h: 29 },
      avoid: [{ x: 338, y: 56, w: 34, h: 34 }, { x: 4, y: 4, w: 197, h: 36 }],
      spots: [{ x: 355, y: 73 }],
    });
    expect(place.outsideDevice).toBe(true);
    expect(place.side).toBe("top");
    expect(place.x).toBeGreaterThanOrEqual(205);
  });

  it("the leader starts at the spot's edge and ends on the label", () => {
    const l = leader({ x: 100, y: 100 }, { x: 200, y: 90, w: 80, h: 30 }, 19);
    expect(l.a.x).toBeCloseTo(119, 0);
    expect(l.b).toEqual({ x: 200, y: 100 });
  });
});

describe("effect badges keep off the spots (feat/tech-glowna-zdjecia)", () => {
  const frame = { w: 300, h: 340 };
  it("badgeDir: the badge never lands on another spot and prefers the device's centre", () => {
    const spot = { x: 80, y: 250 };
    const others = [{ x: 150, y: 170 }, { x: 90, y: 60 }];
    const [dx, dy] = badgeDir({ spot, others, frame, r: 29, dist: 52 });
    const c = { x: spot.x + dx * 52, y: spot.y + dy * 52 };
    for (const o of others) expect(Math.hypot(o.x - c.x, o.y - c.y)).toBeGreaterThanOrEqual(29 + 22);
    expect(c.x).toBeGreaterThanOrEqual(29);
    expect(c.y + 29).toBeLessThanOrEqual(frame.h);
  });
  it("badgeDir: never towards the label's side", () => {
    const [dx] = badgeDir({ spot: { x: 150, y: 170 }, others: [], frame, r: 29, dist: 52, labelSide: "right" });
    expect(dx).toBeLessThan(0.5);
  });
  it("badgeSpot: the centre when free, else the nearest free point (round and wide badges)", () => {
    const bounds = { x: 0, y: 0, w: 300, h: 340 };
    expect(badgeSpot({ centre: { x: 150, y: 170 }, spots: [], w: 58, h: 58, bounds })).toEqual({ x: 150, y: 170 });
    const spots = [{ x: 150, y: 170 }];
    for (const [w, h] of [[58, 58], [112, 70]]) {
      const c = badgeSpot({ centre: { x: 150, y: 170 }, spots, w, h, bounds });
      const gap = Math.hypot(Math.max(0, Math.abs(150 - c.x) - (w / 2 - Math.min(w, h) / 2)), Math.max(0, Math.abs(170 - c.y) - (h / 2 - Math.min(w, h) / 2))) - Math.min(w, h) / 2;
      expect(gap).toBeGreaterThanOrEqual(26);
    }
  });
});
