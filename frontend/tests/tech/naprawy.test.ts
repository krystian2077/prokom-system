/**
 * Repair pages /naprawy/[slug] (SPEC §12.4, TD5b): unique title/description/H1, category and
 * fault match KONTRAKT §1.1 and wizard-data, shared text between pages < 30% outside the
 * template, no prices/WhatsApp/parcel lockers, unverified pages never built in production
 * nor listed in the sitemap.
 */
import { describe, expect, it } from "vitest";
import { repairPages, type RepairPageData } from "@/config/naprawy";
import { servicePoints } from "@/config/prokom";
import sitemap from "@/app/sitemap";
import { CATEGORY_CODES } from "@/lib/tech/contract";
import { faultExists } from "@/lib/tech/devices";
import { buildableRepairs, liveRepairs, ownText, repairForFault, repairsForDevice, repairSeo, sharedRatio, wordCount } from "@/lib/tech/naprawy";

const SUFFIX = " | PRO-KOM Tech";
const rabka = servicePoints.filter((p) => p.key === "rabka");
const both = servicePoints.map((p) => ({ ...p, published: true }));
const withContent = repairPages.filter((p) => p.verified || p.intro.length);

describe("naprawy — dane", () => {
  it("unique slugs, titles and H1", () => {
    for (const key of ["slug", "title", "h1"] as const) expect(new Set(repairPages.map((p) => p[key])).size, key).toBe(repairPages.length);
  });
  it("device = KONTRAKT §1.1 category, usterka exists in wizard-data", () => {
    for (const p of repairPages) {
      expect(CATEGORY_CODES, p.slug).toContain(p.device);
      expect(faultExists(p.device, p.usterka), `${p.slug}: ${p.usterka}`).toBe(true);
    }
  });
  it("related pages exist", () => {
    const slugs = new Set(repairPages.map((p) => p.slug));
    for (const p of repairPages) for (const r of p.powiazane) expect(slugs.has(r), `${p.slug} → ${r}`).toBe(true);
  });
  it("at most 12 pages at start", () => {
    expect(repairPages.length).toBeLessThanOrEqual(12);
  });
});

describe("naprawy — publikacja", () => {
  const draftPage: RepairPageData = { ...repairPages[0], published: true, verified: false };
  const livePage: RepairPageData = { ...repairPages[0], published: true, verified: true };
  it("unverified pages are not built in production, only on staging", () => {
    expect(buildableRepairs(false, [draftPage])).toEqual([]);
    expect(buildableRepairs(true, [draftPage])).toHaveLength(1);
    expect(buildableRepairs(false, [livePage])).toHaveLength(1);
  });
  it("links (device pages, wizard) only to live pages", () => {
    expect(repairsForDevice("phone", [draftPage])).toEqual([]);
    expect(repairForFault("phone", draftPage.usterka, [draftPage])).toBeNull();
    expect(repairForFault("phone", livePage.usterka, [livePage])?.slug).toBe(livePage.slug);
  });
  it("sitemap lists exactly the live pages", () => {
    const urls = sitemap().map((u) => u.url).filter((u) => u.includes("/naprawy/"));
    expect(urls.map((u) => u.split("/naprawy/")[1]).sort()).toEqual(liveRepairs().map((p) => p.slug).sort());
  });
});

describe("naprawy — SEO i treść stron z treścią", () => {
  it("title 30–60 in both point variants, description 120–155", () => {
    for (const p of withContent) {
      for (const pts of [rabka, both]) {
        const { title, description } = repairSeo(p, pts);
        expect((title + SUFFIX).length, p.slug).toBeLessThanOrEqual(60);
        expect((title + SUFFIX).length, p.slug).toBeGreaterThanOrEqual(30);
        expect(description.length, p.slug).toBeGreaterThanOrEqual(120);
        expect(description.length, p.slug).toBeLessThanOrEqual(155);
      }
    }
  });
  it("pages with content (and every verified page): ≥ 400 own words, 3–5 FAQ, symptoms and steps", () => {
    for (const p of [...withContent, ...repairPages.filter((x) => x.verified)]) {
      expect(p.objawy.length, p.slug).toBeGreaterThanOrEqual(3);
      expect(p.przebieg.length, p.slug).toBeGreaterThanOrEqual(3);
      expect(wordCount(ownText(p)), p.slug).toBeGreaterThanOrEqual(400);
      expect(p.faq.length).toBeGreaterThanOrEqual(3);
      expect(p.faq.length).toBeLessThanOrEqual(5);
    }
  });
  it("shared text between any two pages < 30% (outside template blocks)", () => {
    for (const a of withContent) for (const b of withContent) if (a !== b) expect(sharedRatio(ownText(a), ownText(b)), `${a.slug} ~ ${b.slug}`).toBeLessThan(0.3);
  });
  it("sharedRatio detects copies", () => {
    const t = "Wymiana ekranu w telefonie zaczyna się od diagnozy i sprawdzenia, czy uszkodzony jest tylko wyświetlacz";
    expect(sharedRatio(t, t)).toBe(1);
    expect(sharedRatio(t, "Zupełnie inny tekst o bateriach laptopów i ich ładowaniu w zimie")).toBe(0);
  });
  it("unconfirmed time / warranty / on-site stay null on unverified pages (service did not confirm)", () => {
    for (const p of repairPages.filter((x) => !x.verified)) expect([p.czas, p.gwarancja, p.naMiejscu], p.slug).toEqual([null, null, null]);
  });
  it("texts never hard-code a city (points come from prokom.ts)", () => {
    for (const p of withContent) expect(ownText(p) + p.description, p.slug).not.toMatch(/rabk|zakopan/i);
  });
  it("no prices, WhatsApp, parcel lockers; no city variants", () => {
    const text = JSON.stringify(repairPages);
    expect(text).not.toMatch(/\d\s*zł|PLN|whatsapp|wa\.me|paczkomat/i);
    expect(repairPages.some((p) => /rabka|zakopane/i.test(p.slug))).toBe(false);
  });
});
