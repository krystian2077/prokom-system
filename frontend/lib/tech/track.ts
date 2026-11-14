/**
 * View model of the repair status (KONTRAKT §3, design #status-naprawy).
 * Pure functions; labels come from the backend and are shown verbatim.
 */
import type { TrackResponse } from "./contract";
import { TIME_ZONE } from "./hours";

export type StageState = "done" | "current" | "interrupted" | "todo";
export type StageView = { key: string; label: string; state: StageState; meta: string | null };

const dt = new Intl.DateTimeFormat("pl-PL", { timeZone: TIME_ZONE, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const d = new Intl.DateTimeFormat("pl-PL", { timeZone: TIME_ZONE, day: "numeric", month: "long", year: "numeric" });

/** "pt., 14 lis, 14:47" in Warsaw time; null for empty or invalid. */
export function formatDateTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? dt.format(new Date(t)) : null;
}
/** "14 listopada 2026" — for dates without a meaningful time (estimated completion). */
export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? d.format(new Date(t)) : null;
}

/** "150.00" → "150,00 zł"; null when empty. */
export function formatMoney(value: string | null | undefined, currency = "PLN"): string | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  const amount = n.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency === "PLN" ? `${amount} zł` : `${amount} ${currency}`;
}

/** The 5-stage axis drawn from `stages` (not hard-coded), with the interruption on its stage. */
export function stageViews(res: TrackResponse): StageView[] {
  const idx = Math.max(0, Math.min(res.stage_index, res.stages.length - 1));
  const last = res.stages.length - 1;
  return res.stages.map((s, i) => {
    let state: StageState = i < idx ? "done" : i > idx ? "todo" : "current";
    if (i === idx && res.is_interrupted) state = "interrupted";
    else if (i === idx && (res.is_finished || (i === last && res.ready_for_pickup_at))) state = "done";
    let meta: string | null = null;
    if (state === "interrupted" || state === "current") meta = res.status;
    else if (i === 0) meta = formatDateTime(res.accepted_at ?? res.created_at);
    else if (i === last && state === "done") meta = res.is_finished ? res.status : formatDateTime(res.ready_for_pickup_at);
    return { key: s.key, label: s.label, state, meta };
  });
}

/** Detail rows; empty values produce no row (no "—", no "brak"). */
export function detailRows(res: TrackResponse): { k: string; v: string }[] {
  const device = [res.device.category, [res.device.brand, res.device.name].filter(Boolean).join(" ")].filter(Boolean).join(" · ");
  const rows: [string, string | null | undefined][] = [
    ["Urządzenie", device],
    ["Zgłoszony problem", res.problem_description],
    ["Zgłoszono", formatDateTime(res.created_at)],
    ["Przyjęto", formatDateTime(res.accepted_at)],
    ["Szacowany termin", formatDate(res.estimated_completion_date)],
    ["Szacowany czas naprawy", res.estimated_duration],
    ["Gotowe do odbioru od", formatDateTime(res.ready_for_pickup_at)],
    ["Zakończono", formatDateTime(res.completed_at)],
    ["Odebrano", formatDateTime(res.picked_up_at)],
    ["Dostarczenie", res.delivery_method],
    ["Zwrot", res.return_method],
    ["Koszt szacunkowy", res.cost ? formatMoney(res.cost.estimated, res.cost.currency) : null],
    ["Koszt końcowy", res.cost ? formatMoney(res.cost.final, res.cost.currency) : null],
  ];
  return rows.filter((r): r is [string, string] => typeof r[1] === "string" && r[1].trim() !== "").map(([k, v]) => ({ k, v }));
}

/** History newest first (entries without a date at the end). */
export function historyRows(res: TrackResponse): { label: string; code: string; at: string | null; current: boolean }[] {
  const sorted = [...res.history].sort((a, b) => (b.at ? Date.parse(b.at) : -Infinity) - (a.at ? Date.parse(a.at) : -Infinity));
  return sorted.map((h, i) => ({ label: h.status, code: h.status_code, at: formatDateTime(h.at), current: i === 0 }));
}

/** Google Maps route to the address returned by the backend (the "Twój serwis" block uses API data). */
export function routeHref(address: string): string | null {
  return address.trim() ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address.trim())}` : null;
}
