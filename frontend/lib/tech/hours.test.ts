import { describe, expect, it } from "vitest";
import { servicePoints, type ServicePoint } from "@/config/prokom";
import { easterSunday, getOpeningStatus, hoursSummary, isoDate, publicHolidays, warsawNow } from "./hours";

const rabka = servicePoints.find((p) => p.key === "rabka")!;
const zakopane = servicePoints.find((p) => p.key === "zakopane")!;
/** Warsaw wall clock → Date (offset given explicitly, so tests don't depend on the machine TZ). */
const at = (isoWithOffset: string) => new Date(isoWithOffset);
const text = (p: ServicePoint, iso: string, closures = []) => getOpeningStatus(p, at(iso), closures)?.text;

describe("getOpeningStatus — Rabka (pn–pt 9–17, sob 9–14)", () => {
  it("weekday mid-day: open until 17:00, green dot", () => {
    const s = getOpeningStatus(rabka, at("2026-11-16T12:00:00+01:00"), []);
    expect(s).toMatchObject({ state: "open", isOpen: true, text: "Otwarte do 17:00" });
  });
  it("last 30 minutes: closing soon", () => {
    expect(text(rabka, "2026-11-16T16:35:00+01:00")).toBe("Zamykamy za 25 min");
  });
  it("Saturday 13:40 → Zamykamy za 20 min", () => {
    expect(text(rabka, "2026-11-14T13:40:00+01:00")).toBe("Zamykamy za 20 min");
  });
  it("Saturday 13:29 is still 'Otwarte do 14:00'", () => {
    expect(text(rabka, "2026-11-14T13:29:00+01:00")).toBe("Otwarte do 14:00");
  });
  it("before opening: Otwieramy dziś o 9:00 (no dot)", () => {
    const s = getOpeningStatus(rabka, at("2026-11-16T07:50:00+01:00"), []);
    expect(s).toMatchObject({ state: "opens-today", isOpen: false, text: "Otwieramy dziś o 9:00" });
  });
  it("weekday evening → jutro", () => {
    expect(text(rabka, "2026-11-16T17:00:00+01:00")).toBe("Zamknięte · otwieramy jutro o 9:00");
  });
  it("Saturday after closing → w poniedziałek", () => {
    expect(text(rabka, "2026-11-14T15:00:00+01:00")).toBe("Zamknięte · otwieramy w poniedziałek o 9:00");
  });
  it("Sunday → jutro (Monday)", () => {
    expect(text(rabka, "2026-11-15T11:00:00+01:00")).toBe("Zamknięte · otwieramy jutro o 9:00");
  });
  it("Christmas Eve 24.12.2026 (Thu) is a holiday; 25, 26 holidays, 27 Sunday → Monday", () => {
    expect(text(rabka, "2026-12-24T10:00:00+01:00")).toBe("Zamknięte dziś (święto) · otwieramy w poniedziałek o 9:00");
  });
  it("Easter Monday 2027 (29.03) → jutro", () => {
    expect(text(rabka, "2027-03-29T10:00:00+02:00")).toBe("Zamknięte dziś (święto) · otwieramy jutro o 9:00");
  });
  it("Corpus Christi 2026 (Thu 4.06) → jutro", () => {
    expect(text(rabka, "2026-06-04T12:00:00+02:00")).toBe("Zamknięte dziś (święto) · otwieramy jutro o 9:00");
  });
  it("day before a holiday, after closing, skips it", () => {
    // Tue 10.11.2026 evening, Wed 11.11 Independence Day → Thursday
    expect(text(rabka, "2026-11-10T18:00:00+01:00")).toBe("Zamknięte · otwieramy w czwartek o 9:00");
  });
  it("closure from prokom.ts uses its note and applies only to listed points", () => {
    const closures = [{ date: "2026-11-17", note: "inwentaryzacja", points: ["rabka" as const] }];
    expect(getOpeningStatus(rabka, at("2026-11-17T10:00:00+01:00"), closures)?.text).toBe(
      "Zamknięte dziś (inwentaryzacja) · otwieramy jutro o 9:00",
    );
    expect(getOpeningStatus(zakopane, at("2026-11-17T12:00:00+01:00"), closures)?.text).toBe("Otwarte do 16:30");
  });
  it("closure the day after shifts the next opening", () => {
    const closures = [{ date: "2026-11-17", note: "urlop" }];
    expect(getOpeningStatus(rabka, at("2026-11-16T18:00:00+01:00"), closures)?.text).toBe(
      "Zamknięte · otwieramy w środę o 9:00",
    );
  });
});

describe("time change (Europe/Warsaw)", () => {
  it("night of the October change: Sunday 25.10.2026 02:30 (both CEST and CET instants)", () => {
    expect(text(rabka, "2026-10-25T00:30:00Z")).toBe("Zamknięte · otwieramy jutro o 9:00");
    expect(text(rabka, "2026-10-25T01:30:00Z")).toBe("Zamknięte · otwieramy jutro o 9:00");
  });
  it("Monday after the October change: 07:50 UTC is 08:50 CET → opens today", () => {
    expect(text(rabka, "2026-10-26T07:50:00Z")).toBe("Otwieramy dziś o 9:00");
  });
  it("Friday before the October change: 14:45 UTC is 16:45 CEST → closing soon", () => {
    expect(text(rabka, "2026-10-23T14:45:00Z")).toBe("Zamykamy za 15 min");
  });
  it("Monday after the March change: 07:30 UTC is 09:30 CEST → open", () => {
    expect(text(rabka, "2026-03-30T07:30:00Z")).toBe("Otwarte do 17:00");
  });
  it("warsawNow follows the offset", () => {
    expect(warsawNow(at("2026-03-29T00:30:00Z")).minutes).toBe(90); // 01:30 CET
    expect(warsawNow(at("2026-03-29T01:30:00Z")).minutes).toBe(210); // 03:30 CEST
  });
});

describe("Zakopane (pn–pt 10–16:30, weekend closed)", () => {
  it("Friday after closing → w poniedziałek o 10:00", () => {
    expect(text(zakopane, "2026-11-20T17:00:00+01:00")).toBe("Zamknięte · otwieramy w poniedziałek o 10:00");
  });
  it("16:10 → Zamykamy za 20 min", () => {
    expect(text(zakopane, "2026-11-20T16:10:00+01:00")).toBe("Zamykamy za 20 min");
  });
});

describe("no hours → no status", () => {
  it("returns null", () => {
    const p: ServicePoint = { ...rabka, hours: [{ days: "pn–pt", open: null, close: null }] };
    expect(getOpeningStatus(p, new Date(), [])).toBeNull();
  });
});

describe("holidays", () => {
  it("Easter dates", () => {
    expect(isoDate(easterSunday(2026))).toBe("2026-04-05");
    expect(isoDate(easterSunday(2027))).toBe("2027-03-28");
    expect(isoDate(easterSunday(2028))).toBe("2028-04-16");
  });
  it("Christmas Eve only from 2025", () => {
    expect(publicHolidays(2024).has("2024-12-24")).toBe(false);
    expect(publicHolidays(2025).has("2025-12-24")).toBe(true);
  });
  it("13 + Easter set in 2026", () => {
    const h = publicHolidays(2026);
    for (const d of ["2026-01-01", "2026-01-06", "2026-04-05", "2026-04-06", "2026-05-01", "2026-05-03", "2026-05-24", "2026-06-04", "2026-08-15", "2026-11-01", "2026-11-11", "2026-12-24", "2026-12-25", "2026-12-26"]) {
      expect(h.has(d), d).toBe(true);
    }
  });
});

describe("minutesToOpen picks the point nearest to opening", () => {
  it("Saturday 15:00: Rabka opens Monday 9:00, Zakopane Monday 10:00", () => {
    const now = at("2026-11-14T15:00:00+01:00");
    const r = getOpeningStatus(rabka, now, [])!;
    const z = getOpeningStatus(zakopane, now, [])!;
    expect(r.minutesToOpen).toBeLessThan(z.minutesToOpen);
    expect(z.minutesToOpen - r.minutesToOpen).toBe(60);
  });
});

describe("hoursSummary", () => {
  it("formats short ranges", () => {
    expect(hoursSummary(rabka)).toBe("pn–pt 9–17 · sob 9–14");
    expect(hoursSummary(zakopane)).toBe("pn–pt 10–16:30");
  });
});
