import { describe, expect, it } from "vitest";
import { servicePoints } from "@/config/prokom";
import { nearestPoint, normalizeTown, pointGenitive, pointLocative, towns } from "./towns";

describe("towns", () => {
  it("every town points to an existing service point and sits inside the map", () => {
    const keys = servicePoints.map((p) => p.key);
    for (const t of towns) {
      expect(keys, t.name).toContain(t.point);
      expect(t.map.x).toBeGreaterThan(0);
      expect(t.map.x).toBeLessThan(100);
      expect(t.map.y).toBeGreaterThan(0);
      expect(t.map.y).toBeLessThan(100);
    }
    expect(new Set(towns.map((t) => t.slug)).size).toBe(towns.length);
  });

  it("has sentence forms for every point", () => {
    for (const p of servicePoints) {
      expect(pointLocative[p.key]).toBeTruthy();
      expect(pointGenitive[p.key]).toBeTruthy();
    }
  });

  it("normalizes Polish names", () => {
    expect(normalizeTown("  Kościelisko ")).toBe("koscielisko");
    expect(normalizeTown("BIAŁY dunajec")).toBe("bialy dunajec");
  });

  it("finds the nearer point, but only among visible points (SPEC §5)", () => {
    expect(nearestPoint("nowy targ", ["rabka", "zakopane"])).toMatchObject({ town: { name: "Nowy Targ" }, point: "rabka" });
    expect(nearestPoint("Poronin", ["rabka", "zakopane"])?.point).toBe("zakopane");
    // Zakopane unpublished → everything goes to Rabka
    expect(nearestPoint("Poronin", ["rabka"])?.point).toBe("rabka");
    expect(nearestPoint("buko", ["rabka", "zakopane"])?.town.name).toBe("Bukowina Tatrzańska");
    expect(nearestPoint("Kraków", ["rabka"])).toBeNull();
    expect(nearestPoint("", ["rabka"])).toBeNull();
  });
});
