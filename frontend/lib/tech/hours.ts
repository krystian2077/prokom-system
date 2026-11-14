/**
 * Live opening status of a service point (docs/tech/SPEC.md §12.1).
 * Pure functions: everything is computed on the Europe/Warsaw wall clock, so the
 * March/October time change needs no special handling. Messages are literal
 * from the spec — do not reword without changing SPEC first.
 */
import { closures as defaultClosures, type Closure, type ServicePoint } from "@/config/prokom";

export const TIME_ZONE = "Europe/Warsaw";
const CLOSING_SOON_MIN = 30;
const LOOKAHEAD_DAYS = 21;

type CivilDate = { y: number; m: number; d: number };

export type OpeningState = "open" | "closing" | "opens-today" | "closed";
export type OpeningStatus = {
  state: OpeningState;
  /** Green dot only when true ("Otwarte …"). */
  isOpen: boolean;
  text: string;
  /** Minutes until the point opens (0 when open) — used to pick the point nearest to opening. */
  minutesToOpen: number;
};

const fmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Wall-clock date and minute of day in Warsaw. */
export function warsawNow(now: Date): { date: CivilDate; minutes: number } {
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  return {
    date: { y: +parts.year, m: +parts.month, d: +parts.day },
    minutes: +parts.hour * 60 + +parts.minute,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");
export const isoDate = (c: CivilDate) => `${c.y}-${pad(c.m)}-${pad(c.d)}`;

function addDays(c: CivilDate, days: number): CivilDate {
  const t = new Date(Date.UTC(c.y, c.m - 1, c.d + days));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

/** 0 = Sunday … 6 = Saturday */
const weekday = (c: CivilDate) => new Date(Date.UTC(c.y, c.m - 1, c.d)).getUTCDay();

/** Easter Sunday (Gregorian, anonymous algorithm). */
export function easterSunday(y: number): CivilDate {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { y, m: month, d: day };
}

/** Polish statutory public holidays (ISO dates). Christmas Eve is a holiday from 2025. */
export function publicHolidays(y: number): Set<string> {
  const fixed = ["01-01", "01-06", "05-01", "05-03", "08-15", "11-01", "11-11", "12-25", "12-26"];
  if (y >= 2025) fixed.push("12-24");
  const easter = easterSunday(y);
  const movable = [0, 1, 49, 60].map((off) => isoDate(addDays(easter, off))); // Easter, Easter Monday, Pentecost, Corpus Christi
  return new Set([...fixed.map((md) => `${y}-${md}`), ...movable]);
}

function closedReason(point: ServicePoint, c: CivilDate, closures: Closure[]): string | null {
  const iso = isoDate(c);
  if (publicHolidays(c.y).has(iso)) return "święto";
  const closure = closures.find((x) => x.date === iso && (!x.points || x.points.includes(point.key)));
  return closure ? closure.note : null;
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
/** "09:00" → "9:00" */
export const formatTime = (hhmm: string) => hhmm.replace(/^0(\d)/, "$1");

function hoursOn(point: ServicePoint, c: CivilDate) {
  const wd = weekday(c);
  const key = wd === 0 ? "nd" : wd === 6 ? "sob" : "pn–pt";
  const h = point.hours.find((x) => x.days === key);
  return h && h.open && h.close ? { open: h.open, close: h.close } : null;
}

const WEEKDAY_IN = ["w niedzielę", "w poniedziałek", "we wtorek", "w środę", "w czwartek", "w piątek", "w sobotę"];

/** null when the point has no opening hours (then no status is shown). */
export function getOpeningStatus(
  point: ServicePoint,
  now: Date,
  closures: Closure[] = defaultClosures,
): OpeningStatus | null {
  if (!point.hours.some((h) => h.open && h.close)) return null;

  const { date: today, minutes } = warsawNow(now);
  const reasonToday = closedReason(point, today, closures);
  const todayHours = reasonToday ? null : hoursOn(point, today);

  if (todayHours) {
    const open = toMin(todayHours.open);
    const close = toMin(todayHours.close);
    if (minutes < open) {
      return { state: "opens-today", isOpen: false, text: `Otwieramy dziś o ${formatTime(todayHours.open)}`, minutesToOpen: open - minutes };
    }
    if (minutes < close) {
      const left = close - minutes;
      return left <= CLOSING_SOON_MIN
        ? { state: "closing", isOpen: true, text: `Zamykamy za ${left} min`, minutesToOpen: 0 }
        : { state: "open", isOpen: true, text: `Otwarte do ${formatTime(todayHours.close)}`, minutesToOpen: 0 };
    }
  }

  // Closed for the rest of today: find the next opening day.
  for (let i = 1; i <= LOOKAHEAD_DAYS; i++) {
    const day = addDays(today, i);
    if (closedReason(point, day, closures)) continue;
    const h = hoursOn(point, day);
    if (!h) continue;
    const when = i === 1 ? "jutro" : i <= 6 ? WEEKDAY_IN[weekday(day)] : `${day.d}.${pad(day.m)}`;
    const prefix = reasonToday ? `Zamknięte dziś (${reasonToday})` : "Zamknięte";
    return {
      state: "closed",
      isOpen: false,
      text: `${prefix} · otwieramy ${when} o ${formatTime(h.open)}`,
      minutesToOpen: (i - 1) * 1440 + (1440 - minutes) + toMin(h.open),
    };
  }
  return { state: "closed", isOpen: false, text: "Zamknięte", minutesToOpen: Number.POSITIVE_INFINITY };
}

/** Short hours summary for cards and the footer, e.g. weekdays and Saturday ranges joined with " · ". */
export function hoursSummary(point: ServicePoint): string {
  const short = (t: string) => formatTime(t).replace(/:00$/, "");
  return point.hours
    .filter((h) => h.open && h.close)
    .map((h) => `${h.days} ${short(h.open!)}–${short(h.close!)}`)
    .join(" · ");
}

/** Whether a YYYY-MM-DD..YYYY-MM-DD range includes today in Warsaw. */
export function isActiveToday(from: string, to: string, now: Date): boolean {
  const today = isoDate(warsawNow(now).date);
  return from <= today && today <= to;
}
