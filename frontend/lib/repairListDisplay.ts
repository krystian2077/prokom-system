import type { RepairRequestListItem } from "@/types/repairs";
import { parseRepairDate } from "@/lib/repair-deadline";

/** Statusy końcowe — naprawa zamknięta (zgodnie z RepairStatus i widokiem „Moje naprawy”). */
export const ARCHIVED_FINAL_STATUSES = [
  "picked_up",
  "shipped",
  "delivered",
  "cancelled",
  "unrepairable",
  "abandoned",
] as const;

export function isArchivedFinalStatus(status: string | null | undefined): boolean {
  const s = (status ?? "").toLowerCase();
  return (ARCHIVED_FINAL_STATUSES as readonly string[]).includes(s);
}

/**
 * Filtr pigułki „Nowe” — tylko status „Nowe zgłoszenie” (`new` w API).
 */
export const NEW_PHASE_REPAIR_STATUSES = ["new"] as const;

export function matchesNewRepairPhaseFilter(status: string | null | undefined): boolean {
  const s = (status ?? "").toLowerCase();
  return (NEW_PHASE_REPAIR_STATUSES as readonly string[]).includes(s);
}

/**
 * Filtr pigułki „W naprawie” — dokładnie statusy z listy w UI (RepairStatus):
 * Przyjęte do serwisu … W trakcie naprawy (bez „Nowe zgłoszenie”, testów, gotowych itd.).
 */
export const IN_REPAIR_PILL_STATUSES = [
  "accepted",
  "in_diagnostics",
  "diagnostics_done",
  "quote_pending",
  "quote_sent",
  "quote_accepted",
  "quote_rejected",
  "waiting_for_parts",
  "in_repair",
] as const;

export function matchesInRepairPillFilter(status: string | null | undefined): boolean {
  const s = (status ?? "").toLowerCase();
  return (IN_REPAIR_PILL_STATUSES as readonly string[]).includes(s);
}

/**
 * Filtr pigułki „Do odbioru” — wyłącznie status „Gotowe do odbioru” (`ready_for_pickup`).
 */
export function matchesReadyForPickupPillFilter(status: string | null | undefined): boolean {
  return (status ?? "").toLowerCase() === "ready_for_pickup";
}

export {
  parseRepairDate,
  deadlineSummary,
  deadlineSortWeight,
  formatEstimatedDurationLine,
  type DeadlineSummaryKind,
} from "@/lib/repair-deadline";

export function parseApiDecimal(v: string | number | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Etykieta kosztu na liście: finalny lub szacunek. */
export function repairListCostLabel(item: RepairRequestListItem): string | null {
  const finalC = parseApiDecimal(item.final_cost as string | number | null | undefined);
  const estC = parseApiDecimal(item.estimated_cost as string | number | null | undefined);
  if (finalC != null) return `${finalC.toLocaleString("pl-PL")} zł`;
  if (estC != null) return `Szacunek ${estC.toLocaleString("pl-PL")} zł`;
  return null;
}

/** Kolumna „Data przyjęcia” — `accepted_at`, w razie braku data utworzenia zgłoszenia. */
export function repairListAcceptanceDateLabel(item: RepairRequestListItem): string {
  const raw = item.accepted_at ?? item.created_at;
  const d = parseRepairDate(raw);
  return d ? d.toLocaleDateString("pl-PL") : "—";
}

/** Sortowanie listy po dacie przyjęcia (`accepted_at` lub `created_at`). Bez daty — na końcu. */
export function compareRepairListByAcceptanceDate(
  a: RepairRequestListItem,
  b: RepairRequestListItem,
  newestFirst: boolean,
): number {
  const ta = parseRepairDate(a.accepted_at ?? a.created_at)?.getTime();
  const tb = parseRepairDate(b.accepted_at ?? b.created_at)?.getTime();
  if (ta == null && tb == null) return 0;
  if (ta == null) return 1;
  if (tb == null) return -1;
  return newestFirst ? tb - ta : ta - tb;
}

/** Sortowanie po numerze ref (`repair_number`). `newestFirst`: malejąco (wyższe numery / „większy” tekst najpierw). */
export function compareRepairListByRepairNumber(
  a: RepairRequestListItem,
  b: RepairRequestListItem,
  newestFirst: boolean,
): number {
  const ra = (a.repair_number ?? "").trim();
  const rb = (b.repair_number ?? "").trim();
  const cmp = ra.localeCompare(rb, "pl", { numeric: true, sensitivity: "base" });
  return newestFirst ? -cmp : cmp;
}

/**
 * Wyszukiwanie po fragmencie: nr ref, data przyjęcia (różne zapisy), klient, telefon, urządzenie, status.
 * Kilka słów (rozdzielonych spacją) — wszystkie muszą wystąpić.
 */
export function repairListMatchesSearch(item: RepairRequestListItem, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;

  const accLabel = repairListAcceptanceDateLabel(item);
  const d = parseRepairDate(item.accepted_at ?? item.created_at);
  const dateVariants: string[] = [];
  if (d) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    dateVariants.push(
      d.toLocaleDateString("pl-PL"),
      `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`,
      `${dd}.${mm}.${yyyy}`,
      `${yyyy}-${mm}-${dd}`,
      yyyy,
      mm,
      dd,
    );
  }

  const hay = [
    item.repair_number,
    item.parent_repair_number,
    item.client_name,
    item.device_name,
    item.status_display,
    (item.client_phone ?? "").replace(/\s/g, ""),
    accLabel,
    item.accepted_at ?? "",
    item.created_at ?? "",
    ...dateVariants,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.every((t) => hay.includes(t));
}

export function priorityRank(priority: string | null | undefined): number {
  const p = (priority ?? "").toLowerCase();
  if (p === "urgent") return 0;
  if (p === "same_day") return 1;
  if (p === "high") return 2;
  if (p === "normal") return 3;
  if (p === "low") return 4;
  return 5;
}

export function statusBadge(item: RepairRequestListItem) {
  const s = (item.status ?? "").toLowerCase();
  if (["ready_for_pickup"].includes(s))
    return { bg: "rgba(34,197,94,.14)", border: "rgba(34,197,94,.30)", text: "#22c55e", label: "Gotowe" };
  if (["waiting_for_parts"].includes(s) || (item.auto_tags ?? []).includes("czeka_na_czesc"))
    return { bg: "rgba(245,158,11,.16)", border: "rgba(245,158,11,.30)", text: "#f59e0b", label: "Czeka na część" };
  if (["testing_failed"].includes(s) || (item.auto_tags ?? []).includes("pilne"))
    return { bg: "rgba(220,30,30,.14)", border: "rgba(220,30,30,.28)", text: "#dc1e1e", label: item.status_display || "Pilne" };
  return { bg: "rgba(59,130,246,.14)", border: "rgba(59,130,246,.28)", text: "#3b82f6", label: item.status_display || "W naprawie" };
}

export function blockerText(item: RepairRequestListItem): string {
  const s = (item.status ?? "").toLowerCase();
  if (s === "waiting_for_parts" || (item.auto_tags ?? []).includes("czeka_na_czesc")) return "Blokada: część w drodze";
  if (item.requires_attention) return "Blokada: wymaga reakcji";
  return "";
}

export function nextAction(item: RepairRequestListItem) {
  const s = (item.status ?? "").toLowerCase();
  const urgent = (item.auto_tags ?? []).includes("pilne") || priorityRank(item.priority) <= 1;

  if (s === "ready_for_pickup") return { text: "▶ Wyślij SMS do klienta", tone: "good" as const };
  if (s === "waiting_for_parts" || (item.auto_tags ?? []).includes("czeka_na_czesc"))
    return { text: "▶ Przygotuj montaż po dostawie", tone: "warn" as const };
  if (urgent) return { text: "▶ Wykonaj teraz", tone: "urgent" as const };
  if (s === "in_testing" || s === "testing_passed" || s === "testing_failed")
    return { text: "▶ Zakończ test końcowy", tone: "warn" as const };
  return { text: "▶ Kontynuuj naprawę", tone: "neutral" as const };
}

export function nextActionBadgeStyle(tone: "urgent" | "warn" | "good" | "neutral") {
  if (tone === "urgent") return { bg: "rgba(220,30,30,.14)", border: "rgba(220,30,30,.30)", text: "#dc1e1e" };
  if (tone === "warn") return { bg: "rgba(245,158,11,.16)", border: "rgba(245,158,11,.30)", text: "#f59e0b" };
  if (tone === "good") return { bg: "rgba(34,197,94,.14)", border: "rgba(34,197,94,.30)", text: "#22c55e" };
  return { bg: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.12)", text: "#9ba3b0" };
}
