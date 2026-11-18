import { describe, expect, it } from "vitest";
import { DAYLIGHT_TABLE } from "./daylight.generated";
import { RABKA, buildDaylightTable, isNight, sunTimesUtc, sunTimesWarsaw } from "./daylight";

const hm = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));

/**
 * Reference: timeanddate.com, Kraków (Rabka-Zdrój has no page there), local time with DST,
 * fetched 18.11.2026 — https://www.timeanddate.com/sun/poland/krakow?month=<m>&year=2026.
 * Kraków ≈ 50.06° N, 19.94° E; the NOAA algorithm must agree within 2 minutes.
 */
const KRAKOW = { lat: 50.0614, lng: 19.9366 };
const REFERENCE: [string, [number, number, number], string, string][] = [
  ["21.06 (przesilenie letnie)", [2026, 6, 21], "04:30", "20:53"],
  ["21.12 (przesilenie zimowe)", [2026, 12, 21], "07:36", "15:40"],
  ["30.03 (dzień po zmianie na letni)", [2026, 3, 30], "06:21", "19:08"],
  ["26.10 (dzień po zmianie na zimowy)", [2026, 10, 26], "06:19", "16:27"],
];

describe("sunTimes (NOAA)", () => {
  for (const [name, [y, m, d], rise, set] of REFERENCE) {
    it(`Kraków ${name}: within 2 min of timeanddate.com`, () => {
      const s = sunTimesWarsaw(y, m, d, KRAKOW);
      expect(Math.abs(s.sunrise - hm(rise))).toBeLessThanOrEqual(2);
      expect(Math.abs(s.sunset - hm(set))).toBeLessThanOrEqual(2);
    });
  }
  it("Rabka-Zdrój lies close to Kraków: within 10 min on every reference day", () => {
    for (const [, [y, m, d], rise, set] of REFERENCE) {
      const s = sunTimesWarsaw(y, m, d, RABKA);
      expect(Math.abs(s.sunrise - hm(rise))).toBeLessThanOrEqual(10);
      expect(Math.abs(s.sunset - hm(set))).toBeLessThanOrEqual(10);
    }
  });
});

describe("DAYLIGHT_TABLE", () => {
  it("the committed copy equals buildDaylightTable() (regenerate: paste the received array)", () => {
    expect(DAYLIGHT_TABLE).toEqual(buildDaylightTable());
    expect(DAYLIGHT_TABLE).toHaveLength(24);
  });
});

describe("isNight (table interpolation)", () => {
  const at = (iso: string) => new Date(iso);
  it("22:00 and 12:00 Warsaw time on a November day", () => {
    expect(isNight(at("2026-11-18T21:00:00Z"), DAYLIGHT_TABLE)).toBe(true); // 22:00 CET
    expect(isNight(at("2026-11-18T11:00:00Z"), DAYLIGHT_TABLE)).toBe(false); // 12:00 CET
  });
  it("summer: 21:30 still light? no — after sunset; 05:00 after sunrise", () => {
    expect(isNight(at("2026-06-21T19:30:00Z"), DAYLIGHT_TABLE)).toBe(true); // 21:30 CEST
    expect(isNight(at("2026-06-21T03:00:00Z"), DAYLIGHT_TABLE)).toBe(false); // 05:00 CEST
  });
  it("interpolation stays within 10 min of the exact function, also across DST and the year end", () => {
    for (const [y, m, d] of [[2026, 3, 30], [2026, 10, 26], [2026, 12, 31], [2026, 1, 3], [2026, 8, 1], [2026, 5, 1]] as const) {
      const exact = sunTimesUtc(y, m, d);
      const t = (utcMin: number) => new Date(Date.UTC(y, m - 1, d) + Math.round(utcMin) * 60_000);
      const label = `${d}.${m}`;
      expect([label, isNight(t(exact.sunrise - 10), DAYLIGHT_TABLE)]).toEqual([label, true]);
      expect([label, isNight(t(exact.sunrise + 10), DAYLIGHT_TABLE)]).toEqual([label, false]);
      expect([label, isNight(t(exact.sunset - 10), DAYLIGHT_TABLE)]).toEqual([label, false]);
      expect([label, isNight(t(exact.sunset + 10), DAYLIGHT_TABLE)]).toEqual([label, true]);
    }
  });
});
