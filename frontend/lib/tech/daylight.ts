/**
 * Sunrise and sunset for the Auto theme (docs/tech/MOTYW-PASEK-LINII.md §2.2): night in Rabka-Zdrój
 * → dark. Standard NOAA solar position algorithm (the NOAA Solar Calculator spreadsheet), official
 * zenith 90.833° (refraction + the sun's radius). No location, no network — just the date.
 *
 * The inline theme script does not do trigonometry on every visit: it reads DAYLIGHT_TABLE
 * (daylight.generated.ts — 24 values from this function) and interpolates between months.
 */
export const RABKA = { lat: 49.61, lng: 19.96 } as const;

/** Night = from sunset to sunrise, without shifts (kept as a constant for a later correction). */
export const NIGHT_OFFSET_MIN = 0;

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/**
 * Sunrise and sunset on the given UTC calendar day, in minutes after 00:00 UTC.
 * (UTC, not local time: the table then stays continuous across the DST switches in March and October.)
 */
export function sunTimesUtc(year: number, month: number, day: number, at: { lat: number; lng: number } = RABKA): { sunrise: number; sunset: number } {
  // Julian day at 12:00 UTC of that date
  const jd = Date.UTC(year, month - 1, day, 12) / 86_400_000 + 2_440_587.5;
  const t = (jd - 2_451_545) / 36_525;
  const l0 = (((280.46646 + t * (36_000.76983 + t * 0.0003032)) % 360) + 360) % 360;
  const m = 357.52911 + t * (35_999.05029 - 0.0001537 * t);
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const c = Math.sin(rad(m)) * (1.914602 - t * (0.004817 + 0.000014 * t)) + Math.sin(rad(2 * m)) * (0.019993 - 0.000101 * t) + Math.sin(rad(3 * m)) * 0.000289;
  const omega = 125.04 - 1934.136 * t;
  const lambda = l0 + c - 0.00569 - 0.00478 * Math.sin(rad(omega));
  const eps0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(rad(omega));
  const decl = Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lambda)));
  const y = Math.tan(rad(eps / 2)) ** 2;
  const eqTime =
    4 *
    deg(y * Math.sin(2 * rad(l0)) - 2 * e * Math.sin(rad(m)) + 4 * e * y * Math.sin(rad(m)) * Math.cos(2 * rad(l0)) - 0.5 * y * y * Math.sin(4 * rad(l0)) - 1.25 * e * e * Math.sin(2 * rad(m)));
  const lat = rad(at.lat);
  const ha = deg(Math.acos(Math.cos(rad(90.833)) / (Math.cos(lat) * Math.cos(decl)) - Math.tan(lat) * Math.tan(decl)));
  const noon = 720 - 4 * at.lng - eqTime;
  return { sunrise: noon - 4 * ha, sunset: noon + 4 * ha };
}

/** Minutes after midnight in Europe/Warsaw for an instant (DST included) — for tests and display. */
export function warsawMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Warsaw", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}

/** Sunrise and sunset of a UTC day as local Warsaw clock minutes (what a calendar shows). */
export function sunTimesWarsaw(year: number, month: number, day: number, at: { lat: number; lng: number } = RABKA): { sunrise: number; sunset: number } {
  const { sunrise, sunset } = sunTimesUtc(year, month, day, at);
  const local = (utcMin: number) => warsawMinutes(new Date(Date.UTC(year, month - 1, day) + Math.round(utcMin) * 60_000));
  return { sunrise: local(sunrise), sunset: local(sunset) };
}

/**
 * Table for the inline script: [sunrise, sunset] in UTC minutes on the 15th of each month,
 * January first (24 values). Built from sunTimesUtc; daylight.test.ts keeps the committed copy in step.
 */
export function buildDaylightTable(year = 2026, at: { lat: number; lng: number } = RABKA): number[] {
  return Array.from({ length: 12 }, (_, i) => sunTimesUtc(year, i + 1, 15, at)).flatMap((s) => [Math.round(s.sunrise), Math.round(s.sunset)]);
}

/**
 * Is it night now? Linear interpolation by day of year between the mid-month entries (wraps
 * December → January). The same logic, minified, runs in the theme script (lib/tech/theme.ts).
 */
export function isNight(now: Date, table: readonly number[], offset = NIGHT_OFFSET_MIN): boolean {
  const y = now.getUTCFullYear();
  const doy = (Date.UTC(y, now.getUTCMonth(), now.getUTCDate()) - Date.UTC(y, 0, 0)) / 86_400_000; // 1..366
  // day-of-year of each 15th (non-leap is close enough for ±10 min)
  const mids = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349];
  let i = mids.findIndex((d) => d > doy) - 1;
  if (i === -2) i = 11; // after 15 Dec
  const a = i < 0 ? 11 : i;
  const b = (a + 1) % 12;
  // before 15 Jan: from 15 Dec of last year to 15 Jan; after 15 Dec: to 15 Jan of next year
  const from = i < 0 ? mids[11] - 365 : mids[a];
  const to = i < 0 ? mids[0] : b === 0 ? mids[0] + 365 : mids[b];
  const f = (doy - from) / (to - from);
  const rise = table[a * 2] + (table[b * 2] - table[a * 2]) * f;
  const set = table[a * 2 + 1] + (table[b * 2 + 1] - table[a * 2 + 1]) * f;
  const min = now.getUTCHours() * 60 + now.getUTCMinutes();
  return min < rise - offset || min >= set + offset;
}
