import { describe, expect, it } from "vitest";
import { faultFamily } from "@/lib/tech/fault-family";
import { deviceExtra } from "@/lib/tech/devices";
import { HERO_SCENES } from "@/lib/tech/subhero";
import { devicePageBySlug } from "@/lib/tech/devices";

describe("FaultGlyph — ikona usterki z rodziny efektu kreatora", () => {
  it("maps wizard faults to their effect family", () => {
    expect(faultFamily(HERO_SCENES.phone.device, "Pęknięty ekran")).toBe("E1");
    expect(faultFamily(HERO_SCENES.laptop.device, "Przegrzewa się")).toBe("E10");
  });
  it("falls back to the generic family without a fault", () => {
    expect(faultFamily(HERO_SCENES.phone.device, null)).toBe("E14");
  });
  it("every symptom card of every device page gets a family", () => {
    for (const [slug, x] of Object.entries(deviceExtra)) {
      const category = slug === "serwis-telefonow" ? "phone" : devicePageBySlug(slug).category;
      const device = HERO_SCENES[category as keyof typeof HERO_SCENES].device;
      for (const s of x.symptoms) expect(faultFamily(device, s.fault), `${slug}: ${s.t}`).toMatch(/^E\d+$/);
    }
  });
});
