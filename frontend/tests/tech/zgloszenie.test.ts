/** Repair form helpers (TD3 PR 2): courier lines, quick faults, chosen point, prep list, QR. */
import { describe, expect, it } from "vitest";
import { DEVICE_CATEGORIES } from "@/types/repair";
import { emptyRepairForm } from "@/lib/tech/contract";
import { qrMatrix, qrPath } from "@/lib/tech/qr";
import { CATEGORY_ICON, FORM_STEPS, appendFault, chosenPoint, courierLines, prepChecklist } from "@/lib/tech/repair-form";

describe("courierLines (SPEC §12.10, config courierService)", () => {
  it("shows only the sentences that have a value", () => {
    expect(courierLines({ inboundPaidBy: "client", returnPaidBy: null, returnIfDeclined: null })).toEqual(["Wysyłkę do serwisu opłacasz Ty."]);
    expect(courierLines({ inboundPaidBy: "client", returnPaidBy: "service", returnIfDeclined: "client" })).toHaveLength(3);
  });
  it("never mentions parcel lockers", () => {
    const all = courierLines({ inboundPaidBy: "service", returnPaidBy: "client", returnIfDeclined: "service" }).join(" ");
    expect(all).not.toMatch(/paczkomat/i);
  });
});

describe("appendFault", () => {
  it("starts an empty description with a capital letter", () => {
    expect(appendFault("", "nie ładuje")).toBe("Nie ładuje");
  });
  it("appends with a comma and does not duplicate", () => {
    expect(appendFault("Pęknięty ekran.", "po zalaniu")).toBe("Pęknięty ekran, po zalaniu");
    expect(appendFault("Pęknięty ekran, po zalaniu", "po zalaniu")).toBe("Pęknięty ekran, po zalaniu");
  });
});

describe("chosenPoint", () => {
  const f = emptyRepairForm();
  it("drop-off point first, then pick-up point, courier both ways = none", () => {
    expect(chosenPoint({ ...f, dropoff: "zakopane", pickupPoint: "rabka" })).toBe("zakopane");
    expect(chosenPoint({ ...f, dropoff: "courier", returnMethod: "in_person", pickupPoint: "rabka" })).toBe("rabka");
    expect(chosenPoint({ ...f, dropoff: "courier", returnMethod: "courier", pickupPoint: null })).toBeNull();
  });
});

describe("form content", () => {
  it("5 steps as in the design", () => {
    expect(FORM_STEPS.map((s) => s.title)).toEqual(["Urządzenie", "Dostarczenie", "Dodatki", "Twoje dane", "Podsumowanie"]);
  });
  it("every category has an icon entry and a 4-item prep list", () => {
    for (const c of DEVICE_CATEGORIES) {
      expect(CATEGORY_ICON).toHaveProperty(c.value);
      expect(prepChecklist(c.value)).toHaveLength(4);
    }
    expect(prepChecklist(null)).toHaveLength(4);
  });
});

describe("QR (SPEC §12.7)", () => {
  it("encodes the track URL into a square matrix and a path", () => {
    const m = qrMatrix("https://prokomserwis.pl/track?ref=PROKOM%2FRMA%2F2%2F2026");
    expect(m.size).toBeGreaterThanOrEqual(21);
    expect((m.size - 17) % 4).toBe(0);
    const d = qrPath(m);
    expect(d.startsWith("M")).toBe(true);
    // finder pattern: top-left module is dark
    expect(m.dark(0, 0)).toBe(true);
  });
});
