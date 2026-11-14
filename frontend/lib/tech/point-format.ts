/**
 * Text helpers for service point cards and pages (TD4). Everything comes from
 * config/prokom.ts — no contact literals here (tests/tech/literaly.test.ts).
 */
import { company, line, pointPhone, type DaysKey, type ServicePoint } from "@/config/prokom";
import { formatTime } from "./hours";

const DAY_LABEL: Record<DaysKey, string> = { "pn–pt": "Pon–Pt", sob: "Sobota", nd: "Niedziela" };

export type HoursRow = { days: DaysKey; label: string; value: string; open: boolean };

/** Rows for the hours chips: label ("Pon–Pt", "Sobota", "Niedziela") + range or "zamknięte". */
export function hoursRows(point: Pick<ServicePoint, "hours">): HoursRow[] {
  return point.hours.map((h) => {
    const open = Boolean(h.open && h.close);
    return {
      days: h.days,
      label: DAY_LABEL[h.days],
      value: open ? `${formatTime(h.open!)}–${formatTime(h.close!)}` : "zamknięte",
      open,
    };
  });
}

/** Long one-line summary with minutes, day groups joined with " · " (closed days skipped). */
export function hoursLong(point: Pick<ServicePoint, "hours">): string {
  return point.hours
    .filter((h) => h.open && h.close)
    .map((h) => `${h.days} ${formatTime(h.open!)}–${formatTime(h.close!)}`)
    .join(" · ");
}

/** Saturday hours as "H:MM–H:MM", or null when closed on Saturdays. */
export function saturdayHours(point: Pick<ServicePoint, "hours">): string | null {
  const h = point.hours.find((x) => x.days === "sob");
  return h?.open && h.close ? `${formatTime(h.open)}–${formatTime(h.close)}` : null;
}

/** "street, postal city" (street may be missing → just postal + city). */
export function pointAddress(point: Pick<ServicePoint, "street" | "postal" | "city">): string {
  const city = `${point.postal} ${point.city}`;
  return point.street ? `${point.street}, ${city}` : city;
}

/** The point at the company seat is the main one (design: "Serwis · punkt główny"). */
export function isMainPoint(point: Pick<ServicePoint, "city">): boolean {
  return point.city === company.hq.city;
}

/** Display form of a point phone: the line phone has its own display form, others are shown as stored without +48. */
export function pointPhoneDisplay(point: ServicePoint): string {
  const phone = pointPhone(point);
  return phone === line.phone ? line.phoneDisplay : phone.replace(/^\+48\s*/, "");
}

/** Locative city name for sentences ("w Rabce-Zdroju", "w Zakopanem"). */
const LOCATIVE: Record<string, string> = { "Rabka-Zdrój": "Rabce-Zdroju", Zakopane: "Zakopanem" };
export function inCity(city: string): string {
  return `w ${LOCATIVE[city] ?? city}`;
}

/** Joins city names: "Rabka-Zdrój", "Rabka-Zdrój i Zakopane". */
export function joinCities(points: Pick<ServicePoint, "city">[]): string {
  const names = points.map((p) => p.city);
  return names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} i ${names[names.length - 1]}`;
}

/** Public CEIDG search (the register lets anyone check the company by NIP). */
export const CEIDG_URL = "https://aplikacja.ceidg.gov.pl/ceidg/ceidg.public.ui/search.aspx";
