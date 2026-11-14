/**
 * Device pages and /uslugi hub (TD5 PR 1, SPEC §6, §8, §9, KONTRAKT §1.1).
 */
import { describe, expect, it } from "vitest";
import { servicePoints } from "@/config/prokom";
import { devicePages, deviceSeo, faultExists, hubCards } from "@/lib/tech/devices";
import { repairLinks } from "@/lib/tech/nav";
import { CATEGORY_CODES } from "@/lib/tech/contract";

const SUFFIX = " | PRO-KOM Tech";
const onlyRabka = servicePoints.filter((p) => p.key === "rabka");
const both = servicePoints.map((p) => ({ ...p, published: true }));

describe("strony urządzeń — SEO", () => {
  for (const points of [onlyRabka, both]) {
    const label = points.length === 1 ? "Rabka" : "Rabka + Zakopane";
    it(`title 30–60 and description 120–155 (${label})`, () => {
      for (const page of devicePages) {
        const { title, description } = deviceSeo(page, points);
        const full = title + SUFFIX;
        expect(full.length, `${page.slug}: ${full}`).toBeGreaterThanOrEqual(30);
        expect(full.length, `${page.slug}: ${full}`).toBeLessThanOrEqual(60);
        expect(description.length, `${page.slug}: ${description}`).toBeGreaterThanOrEqual(120);
        expect(description.length, `${page.slug}: ${description}`).toBeLessThanOrEqual(155);
      }
    });
  }

  it("titles and descriptions are unique", () => {
    const seo = devicePages.map((p) => deviceSeo(p, onlyRabka));
    expect(new Set(seo.map((s) => s.title)).size).toBe(devicePages.length);
    expect(new Set(seo.map((s) => s.description)).size).toBe(devicePages.length);
  });

  it("'serwis' or the service name stays in the H1 (SPEC §8)", () => {
    for (const page of devicePages) expect(page.name).toMatch(/^(Serwis|Odzyskiwanie)/);
  });
});

describe("strony urządzeń — dane zgodne z kontraktem", () => {
  it("categories are backend codes (KONTRAKT §1.1)", () => {
    for (const page of devicePages) expect(CATEGORY_CODES).toContain(page.category);
  });

  it("every 'Zgłoś' fault exists in wizard-data for the category", () => {
    for (const page of devicePages)
      for (const r of page.repairs) if (r.fault) expect(faultExists(page.category, r.fault), `${page.slug}: ${r.fault}`).toBe(true);
  });

  it("paths match the menu links and the hub lists every page", () => {
    const menu = repairLinks.map((l) => l.href);
    for (const page of devicePages) {
      expect(page.path).toBe(`/${page.slug}`);
      expect(menu).toContain(page.path);
      expect(hubCards.map((c) => c.href)).toContain(page.path);
    }
  });

  it("FAQ: 4–6 unique questions per page", () => {
    for (const page of devicePages) {
      expect(page.faq.length).toBeGreaterThanOrEqual(4);
      expect(page.faq.length).toBeLessThanOrEqual(6);
      expect(new Set(page.faq.map((f) => f.q)).size).toBe(page.faq.length);
    }
  });
});

describe("strony urządzeń — treść (SPEC §8)", () => {
  const text = JSON.stringify(devicePages);
  it("no prices, WhatsApp, parcel lockers or shop", () => {
    expect(text).not.toMatch(/\d\s*zł|PLN|whatsapp|wa\.me|paczkomat|sklep/i);
  });
  it("no unconfirmed promises in plain text (they go through claim())", () => {
    expect(text).not.toMatch(/bezpłatn|gratis|tego samego dnia|ok\. 1 h|w 5 minut/i);
  });
  it("no hard-coded second point (Zakopane appears only through published points)", () => {
    expect(text).not.toMatch(/Zakopan/);
  });
});
