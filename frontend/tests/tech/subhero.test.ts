/**
 * Sub-page hero (SubHero): scenes point at real wizard faults, promises are exactly 3 and
 * only confirmed ones in production (SPEC §8).
 */
import { describe, expect, it } from "vitest";
import { claims } from "@/config/prokom";
import { HERO_SCENES, heroPromises } from "@/lib/tech/subhero";
import { deviceById } from "@/lib/tech/wizard-data";

describe("SubHero — sceny", () => {
  it("every category scene uses a wizard device of that category and its faults", () => {
    for (const [category, scene] of Object.entries(HERO_SCENES)) {
      const device = deviceById(scene.device);
      expect(device.category, category).toBe(category);
      expect(scene.faults.length, category).toBeGreaterThanOrEqual(1);
      expect(scene.faults.length, category).toBeLessThanOrEqual(3);
      for (const f of scene.faults) expect(device.faults, `${category}: ${f}`).toContain(f);
    }
  });
});

describe("SubHero — obietnice", () => {
  const confirmedTexts = ["Wycena przed naprawą", "Gwarancja na usługę i części", "Status naprawy online"];
  it("always 3, never a draft in production", () => {
    for (const ctx of [{}, { phoneScreen: true }, { category: "laptop" as const }, { category: "tablet" as const }]) {
      const p = heroPromises(ctx, false);
      expect(p).toHaveLength(3);
      expect(p.every((x) => !x.draft)).toBe(true);
    }
  });
  it("phone screen uses the confirmed quickRepair claim", () => {
    const p = heroPromises({ phoneScreen: true }, false).map((x) => x.text);
    expect(p).toContain(`Wymiana ekranu ${claims.quickRepair.text}`);
  });
  it("computers get the confirmed same-day diagnosis claim, other devices the base three", () => {
    expect(heroPromises({ category: "desktop" }, false).map((x) => x.text)).toContain("Diagnoza zwykle tego samego dnia");
    expect(heroPromises({ category: "tablet" }, false).map((x) => x.text)).toEqual(confirmedTexts);
  });
  it("data recovery promises no warranty on parts (audit 16.11)", () => {
    const p = heroPromises({ category: "data_recovery" }, false).map((x) => x.text);
    expect(p).toEqual(["Wycena przed rozpoczęciem", "Możesz zrezygnować", "Status naprawy online"]);
    expect(p.join(" ")).not.toMatch(/Gwarancja/);
  });
});
