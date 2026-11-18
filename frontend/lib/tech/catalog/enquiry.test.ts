import { describe, expect, it } from "vitest";
import type { CatalogModel } from "./types";
import { addItem, clampQty, countItems, enquiryMessage, enquiryPayload, enquiryTopic, itemKey, itemLabel, makeItem, removeItem, setQty, ITEMS_MAX } from "./enquiry";

const model = {
  slug: "iphone-test",
  brand: "apple",
  name: "iPhone Test",
  colors: [
    { key: "czarny", name: "Czarny", hex: "#111111" },
    { key: "blekit", name: "Błękit lodowca", hex: "#a9c3d6" },
  ],
  storage: [
    { key: "256", label: "256 GB" },
    { key: "512", label: "512 GB" },
  ],
} as unknown as CatalogModel;

describe("lista zapytania", () => {
  it("adds a variant, merges the same one, keeps different ones apart", () => {
    let list = addItem([], makeItem(model, "blekit", "256"));
    list = addItem(list, makeItem(model, "blekit", "256", 2));
    list = addItem(list, makeItem(model, "czarny", "512"));
    expect(list).toHaveLength(2);
    expect(list[0].qty).toBe(3);
    expect(countItems(list)).toBe(4);
    expect(itemLabel(list[0])).toBe("iPhone Test · Błękit lodowca · 256 GB");
  });

  it("changes quantity within 1–10 and removes lines", () => {
    let list = addItem([], makeItem(model, "czarny", "256"));
    const k = itemKey(list[0]);
    list = setQty(list, k, 99);
    expect(list[0].qty).toBe(10);
    list = setQty(list, k, 0);
    expect(list[0].qty).toBe(1);
    expect(removeItem(list, k)).toEqual([]);
    expect(clampQty(Number.NaN)).toBe(1);
  });

  it("an unknown colour or storage is dropped, not invented", () => {
    const i = makeItem(model, "rozowy", "1tb");
    expect(i.color).toBeNull();
    expect(i.storage).toBeNull();
    expect(itemLabel(i)).toBe("iPhone Test");
  });

  it("keeps at most ITEMS_MAX lines", () => {
    let list = [] as ReturnType<typeof addItem>;
    for (let n = 0; n < ITEMS_MAX + 5; n++) list = addItem(list, { ...makeItem(model, null, null), slug: `m${n}` });
    expect(list).toHaveLength(ITEMS_MAX);
  });

  it("builds interest and message for the contact API (KONTRAKT §4), with no prices", () => {
    const list = addItem(addItem([], makeItem(model, "blekit", "256", 2)), makeItem(model, "czarny", "512"));
    expect(enquiryTopic(list)).toBe("Sprzedaż · 3 pozycje");
    const msg = enquiryMessage(list, "Odbiór w sobotę");
    expect(msg).toContain("1. iPhone Test · Błękit lodowca · 256 GB — 2 szt.");
    expect(msg).toContain("Uwagi: Odbiór w sobotę");
    expect(msg).not.toMatch(/zł|pln/i);
    const p = enquiryPayload(list, "", { firstName: "Jan", lastName: "", phone: "", email: "jan@example.com", point: "rabka" });
    expect(p.interest).toBe("Sprzedaż · 3 pozycje · punkt: Rabka-Zdrój");
    expect(p.email).toBe("jan@example.com");
    expect(p.message.startsWith("Zapytanie o cenę i dostępność:")).toBe(true);
  });

  it("Polish plural of positions", () => {
    const one = addItem([], makeItem(model, null, null));
    expect(enquiryTopic(one)).toBe("Sprzedaż · 1 pozycja");
    expect(enquiryTopic(setQty(one, itemKey(one[0]), 5))).toBe("Sprzedaż · 5 pozycji");
  });
});
