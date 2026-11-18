/**
 * Brand service pages /serwis-apple, /serwis-samsung (round 18.11, T-R2c): data, content rules
 * (no "autoryzowany / certyfikowany", no prices, no WhatsApp), live repair links, SEO, form links.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { servicePoints } from "@/config/prokom";
import { repairPages } from "@/config/naprawy";
import { brandPage, brandPages } from "@/config/serwis-marek";
import { brandLinks } from "@/lib/tech/brand-links";
import { CATEGORY_CODES, parseWizardParams } from "@/lib/tech/contract";
import { isLive, repairPath } from "@/lib/tech/naprawy";
import { buildSitemap } from "@/lib/tech/sitemap";
import { brandRepairCards, brandSeo, modelHref } from "@/lib/tech/serwis-marek";
import { buildSearchIndex } from "@/lib/tech/search/build-index";
import { faultExists } from "@/lib/tech/devices";

const SUFFIX = " | PRO-KOM Tech";
const FRONTEND = path.resolve(__dirname, "../..");
const onlyRabka = servicePoints.filter((p) => p.key === "rabka");
const both = servicePoints.map((p) => ({ ...p, published: true }));

/** Code without comments (the header comments name the banned words on purpose). */
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** Every visible string of a brand page (data + view files, comments removed). */
function pageText(): string {
  const data = JSON.stringify(brandPages);
  const files = ["config/serwis-marek.ts", "components/tech/brand/BrandServicePage.tsx", "components/tech/brand/BrandArt.tsx"].map((f) => stripComments(fs.readFileSync(path.join(FRONTEND, f), "utf8")));
  return [data, ...files].join("\n");
}

describe("serwis marek — dane", () => {
  it("two pages: Apple and Samsung, unique paths", () => {
    expect(brandPages.map((b) => b.path)).toEqual(["/serwis-apple", "/serwis-samsung"]);
    expect(brandPage("apple").h1).toBe("Serwis iPhone, iPad i MacBook");
    expect(brandPage("samsung").h1).toBe("Serwis Samsung Galaxy");
  });

  it("menu links (client bundle) match the pages", () => {
    expect(brandLinks.map((l) => [l.label, l.href])).toEqual(brandPages.map((b) => [b.brand, b.path]));
  });

  it("model groups: Apple iPhone/iPad/MacBook/Watch, Samsung Galaxy S/A/Z/Tab, with current and older models", () => {
    expect(brandPage("apple").groups.map((g) => g.title)).toEqual(["iPhone", "iPad", "MacBook", "Apple Watch"]);
    expect(brandPage("samsung").groups.map((g) => g.title)).toEqual(["Galaxy S", "Galaxy A", "Galaxy Z", "Galaxy Tab"]);
    for (const b of brandPages) {
      for (const g of b.groups) {
        expect(CATEGORY_CODES, g.key).toContain(g.category);
        expect(g.current.length, g.key).toBeGreaterThanOrEqual(3);
        expect(g.older.length, g.key).toBeGreaterThanOrEqual(3);
        const all = [...g.current, ...g.older];
        expect(new Set(all).size, `${g.key}: duplicate model`).toBe(all.length);
      }
    }
  });

  it("FAQ: 5–8 questions per brand, none shared between brands", () => {
    const qs = brandPages.map((b) => b.faq.map((f) => f.q));
    for (const list of qs) {
      expect(list.length).toBeGreaterThanOrEqual(5);
      expect(list.length).toBeLessThanOrEqual(8);
    }
    expect(qs[0].filter((q) => qs[1].includes(q))).toEqual([]);
  });
});

describe("serwis marek — zasady treści (SPEC §8, runda 18.11)", () => {
  const text = pageText();
  it("never claims an authorised / certified service or partnership", () => {
    expect(text).not.toMatch(/autoryzowan|certyfikowan|partner(em)?\s+(apple|samsung)/i);
  });
  it("no prices", () => {
    expect(text).not.toMatch(/\d\s*(zł|pln)\b|\bod\s+\d+\s*z|cena\s*:\s*\d/i);
  });
  it("no WhatsApp, no parcel lockers, no shop", () => {
    expect(text).not.toMatch(/whats\s*app|paczkomat|koszyk|do koszyka/i);
  });
  it("no contact literals (data only from config/prokom.ts)", () => {
    expect(text).not.toMatch(/883[\s-]?200[\s-]?151|18[\s-]?541|@prokomserwis\.pl|Orkana\s+16|Staszica\s+8/);
  });
  it("keeps the word 'serwis' in H1 and titles", () => {
    for (const b of brandPages) {
      expect(b.h1.toLowerCase()).toContain("serwis");
      expect(b.title.toLowerCase()).toContain("serwis");
    }
  });
  it("the hero art never uses a photo with the apple mark", () => {
    const art = fs.readFileSync(path.join(FRONTEND, "components/tech/brand/BrandArt.tsx"), "utf8");
    expect(art).not.toMatch(/urzadzenia\/(iphone|laptop|tablet)\.webp/);
  });
});

describe("serwis marek — naprawy i linki zgłoszenia", () => {
  it("repair slugs exist in config/naprawy.ts", () => {
    for (const b of brandPages) {
      for (const r of b.repairs) {
        if ("slug" in r) expect(repairPages.some((p) => p.slug === r.slug), r.slug).toBe(true);
        else expect(faultExists(r.category, r.usterka), r.t).toBe(true);
      }
      expect(brandRepairCards(b)).toHaveLength(b.repairs.length);
    }
  });

  it("links a repair page only when published && verified, else the form", () => {
    const pages = repairPages.map((p) => (p.slug === "wymiana-ekranu-iphone" ? { ...p, verified: false } : p));
    const cards = brandRepairCards(brandPage("apple"), pages);
    const screen = cards.find((c) => c.key === "wymiana-ekranu-iphone")!;
    expect(screen.live).toBe(false);
    expect(screen.href).toMatch(/^\/zgloszenie\?category=phone&usterka=/);
    for (const c of brandRepairCards(brandPage("apple"))) {
      const p = repairPages.find((x) => x.slug === c.key);
      if (p) expect(c.href).toBe(isLive(p) ? repairPath(p.slug) : expect.stringMatching(/^\/zgloszenie\?/));
    }
  });

  it("model chip → form with the category and the model in the description (KONTRAKT §1.4)", () => {
    const href = modelHref("phone", "iPhone 15 Pro");
    const prefill = parseWizardParams(new URL(href, "http://x").searchParams);
    expect(prefill.category).toBe("phone");
    expect(prefill.problem).toBe("Model: iPhone 15 Pro. Usterka:");
    expect(new URL(modelHref("laptop", "MacBook Air (M1)"), "http://x").searchParams.get("category")).toBe("laptop");
  });
});

describe("serwis marek — SEO, sitemap, wyszukiwarka", () => {
  for (const points of [onlyRabka, both]) {
    it(`title 30–60 and description 120–155 (${points.length} pkt)`, () => {
      for (const b of brandPages) {
        const { title, description } = brandSeo(b, points);
        const full = title + SUFFIX;
        expect(full.length, full).toBeGreaterThanOrEqual(30);
        expect(full.length, full).toBeLessThanOrEqual(60);
        expect(description.length, description).toBeGreaterThanOrEqual(120);
        expect(description.length, description).toBeLessThanOrEqual(155);
      }
    });
  }

  it("both pages in the sitemap, no city × brand pages", () => {
    const urls = buildSitemap().map((e) => e.url);
    expect(urls.filter((u) => /\/serwis-(apple|samsung)$/.test(u))).toHaveLength(2);
    expect(urls.some((u) => /serwis-(apple|samsung)-/.test(u))).toBe(false);
  });

  it("search finds the brand page by a model name", () => {
    const entries = buildSearchIndex(false).filter((e) => e.id.startsWith("marka:"));
    expect(entries.map((e) => e.href)).toEqual(["/serwis-apple", "/serwis-samsung"]);
    expect(entries[0].text).toContain("iPhone 13");
    expect(entries[1].text).toContain("Galaxy A54");
  });
});
