import { describe, expect, it } from "vitest";
import { catalog } from "./index";
import { DESC_MAX, DESC_MIN, TITLE_MAX, TITLE_MIN, modelDescription, modelTitle, productJsonLd } from "./seo";
import { PRICE } from "./validate";

describe("SEO katalogu (runda 18.11 v2 §2)", () => {
  it("every model title fits 30–60 characters with the suffix, descriptions 120–155", () => {
    for (const m of catalog.models) {
      const full = `${modelTitle(m)} | PRO-KOM Tech`;
      expect(full.length, full).toBeLessThanOrEqual(TITLE_MAX);
      expect(full.length, full).toBeGreaterThanOrEqual(TITLE_MIN);
      const d = modelDescription(m);
      expect(d.length, d).toBeLessThanOrEqual(DESC_MAX);
      expect(d.length, d).toBeGreaterThanOrEqual(DESC_MIN);
    }
  });
  it("Product JSON-LD never carries offers or a price", () => {
    for (const m of catalog.models) {
      const ld = productJsonLd(m) as Record<string, unknown>;
      expect(ld.offers).toBeUndefined();
      expect(JSON.stringify(ld)).not.toMatch(PRICE);
      expect(JSON.stringify(ld)).not.toMatch(/"price/i);
    }
  });
});
