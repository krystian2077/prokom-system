import { describe, expect, it } from "vitest";
import { FRAME_BOX, SCENE_ZOOM, frameSize, wizardDevices } from "./wizard-data";
import { intersects, leader, placeLabel, zoomPt, zoomRect, type Rect } from "./wizard-layout";

/** Desktop stage at 1440 (tech-wizard.css: 500 px column, 600 px scene, card ≈ 120 px). */
const STAGE = { w: 474, h: 440 };
const LABEL_H = 30;
const labelW = (t: string) => 34 + t.length * 7.4; // 12.5 px / 800 ≈ 7.4 px per char + dot and padding

function layout(deviceId: string, fault: string, zoom: boolean) {
  const d = wizardDevices.find((x) => x.id === deviceId)!;
  const sc = d.scenes[fault];
  const [fw, fh] = frameSize(d.photo!.crop, [Math.min(FRAME_BOX.desktop[0], STAGE.w - 48), Math.min(FRAME_BOX.desktop[1], STAGE.h - 136)]);
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
  return { place: placeLabel({ stage: STAGE, device, region, spot, label, avoid }), region, device, spot, label, avoid };
}

describe("label placement (PREMIUM §4, feat/tech-kreator-wizual)", () => {
  const local = wizardDevices.flatMap((d) => d.faults.filter((f) => d.scenes[f].spot).map((f) => [d.id, f] as const));

  it.each(local.flatMap(([d, f]) => [[d, f, false] as const, [d, f, true] as const]))("%s · %s (zoom %s): inside the stage, off the region and the other spots", (d, f, zoom) => {
    const { place, region, label, avoid } = layout(d, f, zoom);
    const r = { x: place.x, y: place.y, w: label.w, h: label.h };
    expect(r.x).toBeGreaterThanOrEqual(5.5);
    expect(r.y).toBeGreaterThanOrEqual(5.5);
    expect(r.x + r.w).toBeLessThanOrEqual(STAGE.w - 5.5);
    expect(r.y + r.h).toBeLessThanOrEqual(STAGE.h - 5.5);
    expect(intersects(r, region), "covers the effect region").toBe(false);
    for (const a of avoid) expect(intersects(r, a), "covers a spot / the button").toBe(false);
  });

  it("without the camera, every label sits outside the device", () => {
    const inside = local.filter(([d, f]) => !layout(d, f, false).place.outsideDevice).map(([d, f]) => `${d} · ${f}`);
    expect(inside).toEqual([]);
  });

  it("the leader starts at the spot's edge and ends on the label", () => {
    const l = leader({ x: 100, y: 100 }, { x: 200, y: 90, w: 80, h: 30 }, 19);
    expect(l.a.x).toBeCloseTo(119, 0);
    expect(l.b).toEqual({ x: 200, y: 100 });
  });
});
