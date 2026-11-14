import { describe, expect, it } from "vitest";
import { DEVICE_CATEGORIES } from "@/types/repair";
import { courierService } from "@/config/prokom";
import { claim } from "./claims";
import { courierPageHref, courierPaysText } from "./courier";
import { visiblePoints } from "./points";
import { brands, buildWizardHref, deviceById, lowerFirst, wizardDevices } from "./wizard-data";

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
      expect(d.photo.src).toMatch(/^\/tech\/.+\.webp$/);
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
