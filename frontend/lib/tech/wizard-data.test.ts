import { describe, expect, it } from "vitest";
import { DEVICE_CATEGORIES } from "@/types/repair";
import { courierService } from "@/config/prokom";
import { claim } from "./claims";
import { courierPageHref, courierPaysText } from "./courier";
import { visiblePoints } from "./points";
import { EFFECT_FAMILIES, FRAME_BOX, SPOT_TARGET, brands, buildWizardHref, deviceById, faultMeaning, frameSize, lowerFirst, sceneOf, wizardDevices } from "./wizard-data";

const backendCodes = DEVICE_CATEGORIES.map((c) => c.value as string);

describe("wizard-data", () => {
  it("every device has faults and a backend category code (KONTRAKT §1.1)", () => {
    expect(wizardDevices.length).toBe(9);
    for (const d of wizardDevices) {
      expect(d.faults.length, d.label).toBeGreaterThan(0);
      expect(new Set(d.faults).size, `${d.label}: duplicate faults`).toBe(d.faults.length);
      expect(backendCodes, d.label).toContain(d.category);
    }
  });

  it("covers every backend category exactly once", () => {
    expect(new Set(wizardDevices.map((d) => d.category))).toEqual(new Set(backendCodes));
  });

  it("every photo hotspot points to a listed fault and lies inside the frame", () => {
    for (const d of wizardDevices) {
      if (!d.photo) continue;
      expect(d.photo.spots.length, d.label).toBeGreaterThan(0);
      for (const [fault, x, y] of d.photo.spots) {
        expect(d.faults, `${d.label}: ${fault}`).toContain(fault);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(100);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(100);
      }
      const [cx, cy, cw, ch] = d.photo.crop;
      expect(cx + cw).toBeLessThanOrEqual(d.photo.width);
      expect(cy + ch).toBeLessThanOrEqual(d.photo.height);
      if (d.photo.art) expect(["watch", "data", "other"]).toContain(d.photo.art);
      else expect(d.photo.src).toMatch(/^\/tech\/.+\.webp$/);
    }
  });

  it("offers no parcel locker anywhere", () => {
    const text = JSON.stringify(wizardDevices).toLowerCase();
    expect(text).not.toContain("paczkomat");
    expect(text).not.toContain("parcel_locker");
  });

  it("builds the /zgloszenie URL from KONTRAKT §1.4", () => {
    expect(buildWizardHref({ device: "telefon", fault: "Pęknięty ekran", delivery: { kind: "point", point: "rabka" } })).toBe(
      "/zgloszenie?category=phone&usterka=P%C4%99kni%C4%99ty+ekran&punkt=rabka&dostawa=punkt",
    );
    const courier = new URL(buildWizardHref({ device: "komputer", fault: "Dysk i dane", delivery: { kind: "courier" } }), "https://x.pl");
    expect(courier.pathname).toBe("/zgloszenie");
    expect(Object.fromEntries(courier.searchParams)).toEqual({ category: "desktop", usterka: "Dysk i dane", dostawa: "kurier" });
  });

  it("falls back to the first fault when the fault does not belong to the device", () => {
    const url = new URL(buildWizardHref({ device: "drukarka", fault: "Pęknięty ekran", delivery: { kind: "courier" } }), "https://x.pl");
    expect(url.searchParams.get("usterka")).toBe("Nie drukuje");
    expect(deviceById("nie-ma").id).toBe("telefon");
  });

  it("lowerFirst keeps Polish letters", () => {
    expect(lowerFirst("Łamie się")).toBe("łamie się");
  });

  it("brands are unique", () => {
    expect(new Set(brands).size).toBe(brands.length);
  });
});

describe("delivery options and Zakopane (SPEC §5)", () => {
  it("unpublished Zakopane is not a delivery option in production, only in draft mode", () => {
    expect(visiblePoints(false).map((p) => p.key)).not.toContain("zakopane");
    expect(visiblePoints(true).map((p) => p.key)).toContain("zakopane");
  });
});

describe("claims (SPEC §10)", () => {
  const src = { quickRepair: { text: "często ok. 1 h", confirmed: false }, hgModels: { text: "10 000+", confirmed: true }, googleRating: { text: "", confirmed: true } } as never;
  it("hides unconfirmed claims in production and flags them on staging", () => {
    expect(claim("quickRepair", false, src)).toBeNull();
    expect(claim("quickRepair", true, src)).toEqual({ text: "często ok. 1 h", draft: true });
    expect(claim("hgModels", false, src)).toEqual({ text: "10 000+", draft: false });
    expect(claim("googleRating", true, src)).toBeNull();
  });
});

describe("courier (SPEC §12.10)", () => {
  it("builds the 'who pays' sentence only from courierService", () => {
    expect(courierPaysText({ ...courierService, inboundPaidBy: "client", returnPaidBy: "service" })).toBe(
      "Wysyłka do serwisu na Twój koszt, odesłanie po naprawie na nasz koszt.",
    );
    expect(courierPaysText({ ...courierService, returnPaidBy: null })).toBe("Wysyłka do serwisu na Twój koszt.");
  });
  it("links the courier page only when published", () => {
    expect(courierPageHref({ ...courierService, published: false })).toBeNull();
    expect(courierPageHref({ ...courierService, published: true })).toBe("/naprawa-kurierem");
  });
});

describe("scenes (PREMIUM §4): every fault of every device", () => {
  const inside = (v: number) => v >= 0 && v <= 100;

  it("every device has a photo or an illustration", () => {
    for (const d of wizardDevices) expect(d.photo, d.label).not.toBeNull();
  });

  it("each fault has an effect family, a region inside the frame and — when local — a spot inside it", () => {
    let pairs = 0;
    for (const d of wizardDevices) {
      for (const f of d.faults) {
        const sc = d.scenes[f];
        expect(sc, `${d.label} · ${f}`).toBeDefined();
        expect(Object.keys(EFFECT_FAMILIES), `${d.label} · ${f}`).toContain(sc.effect);
        const [x, y, w, h] = sc.region;
        expect(w > 0 && h > 0, `${d.label} · ${f}: region size`).toBe(true);
        expect([x, y, x + w, y + h].every((v) => v >= 0 && v <= 100.05), `${d.label} · ${f}: region ${sc.region}`).toBe(true);
        if (sc.spot) {
          expect(sc.spot.every(inside), `${d.label} · ${f}: spot`).toBe(true);
          expect(sc.focus).toEqual(sc.spot);
          // the spot belongs to its region (a little slack for edge controls)
          expect(sc.spot[0] >= x - 4 && sc.spot[0] <= x + w + 4 && sc.spot[1] >= y - 4 && sc.spot[1] <= y + h + 4, `${d.label} · ${f}: spot outside region`).toBe(true);
        } else {
          expect(sc.focus, `${d.label} · ${f}: whole has no camera target`).toBeNull();
        }
        pairs++;
      }
      expect(Object.keys(d.scenes).sort()).toEqual([...d.faults].sort());
    }
    expect(pairs).toBe(66);
  });

  it("photo spots are derived from the local scenes", () => {
    for (const d of wizardDevices) {
      const local = d.faults.filter((f) => d.scenes[f].spot);
      expect(d.photo!.spots.map(([f]) => f), d.label).toEqual(local);
    }
  });

  it.each([
    ["1440", FRAME_BOX.desktop],
    ["390", FRAME_BOX.phone],
  ] as const)("spots never collide at %s (centres ≥ 44 px apart)", (_w, box) => {
    for (const d of wizardDevices) {
      const [fw, fh] = frameSize(d.photo!.crop, box);
      const pts = d.photo!.spots.map(([f, x, y]) => [f, (x / 100) * fw, (y / 100) * fh] as const);
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) {
          const dist = Math.hypot(pts[i][1] - pts[j][1], pts[i][2] - pts[j][2]);
          expect(dist, `${d.label}: ${pts[i][0]} ↔ ${pts[j][0]} = ${dist.toFixed(1)} px`).toBeGreaterThanOrEqual(SPOT_TARGET);
        }
    }
  });

  it("sceneOf falls back to the first fault", () => {
    const d = deviceById("drukarka");
    expect(sceneOf(d, "nie ma")).toBe(d.scenes["Nie drukuje"]);
  });
});

describe("'co to zwykle znaczy' (PREMIUM §5)", () => {
  it("every fault of every device has one sentence", () => {
    for (const d of wizardDevices)
      for (const f of d.faults) {
        const m = faultMeaning(d.id, f);
        expect(m.length, `${d.label} · ${f}`).toBeGreaterThan(20);
        expect(m.endsWith(".") || m.endsWith("?"), `${d.label} · ${f}`).toBe(true);
      }
  });

  it("no prices, no repair times, no promises", () => {
    for (const d of wizardDevices)
      for (const f of d.faults) {
        const m = faultMeaning(d.id, f);
        expect(m, `${d.label} · ${f}`).not.toMatch(/\d|(^|[\s(])(zł|pln)([\s.,)]|$)|godzin|minut|(^|\s)dni(\s|$)|dzień|od ręki|gwarantujemy|na pewno|zawsze naprawimy|tanio|gratis|darmow/i);
      }
  });
});
