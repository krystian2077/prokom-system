import type { RepairRequestListItem } from "@/types/repairs";

/** Parsuje datę z API (ISO); zwraca null przy błędzie. */
export function parseRepairDate(d: string | null | undefined): Date | null {
  if (!d) return null;
  const dt = new Date(d);
  if (!Number.isFinite(dt.getTime())) return null;
  return dt;
}

export type DeadlineSummaryKind = "none" | "overdue" | "today" | "tomorrow" | "ok";

/** Relacja terminu oddania do „dziś” — sortowanie i krótkie etykiety (bez SLA/ETA). */
export function deadlineSummary(item: RepairRequestListItem): {
  kind: DeadlineSummaryKind;
  label: string;
  isOverdue: boolean;
} {
  const eta = parseRepairDate(item.estimated_completion_date);
  if (!eta) return { kind: "none", label: "Brak terminu", isOverdue: false };

  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((eta.getTime() - t0) / dayMs);

  if (diffDays < 0) {
    const n = Math.abs(diffDays);
    return {
      kind: "overdue",
      label: n === 1 ? "Przekroczony o 1 dzień" : `Przekroczony o ${n} dni`,
      isOverdue: true,
    };
  }
  if (diffDays === 0) return { kind: "today", label: "Dziś", isOverdue: false };
  if (diffDays === 1) return { kind: "tomorrow", label: "Jutro", isOverdue: false };
  if (diffDays <= 14) return { kind: "ok", label: `Za ${diffDays} dni`, isOverdue: false };

  return { kind: "ok", label: eta.toLocaleDateString("pl-PL"), isOverdue: false };
}

/** Krótka etykieta terminu dla samej daty (np. wyszukiwarka). */
export function deadlineLabelForDate(iso: string | null | undefined): string | null {
  const meta = deadlineSummary({ estimated_completion_date: iso ?? null } as RepairRequestListItem);
  if (meta.kind === "none") return null;
  return meta.label;
}

export function formatEstimatedDurationLine(item: RepairRequestListItem): string {
  if (item.estimated_duration_days_min != null && item.estimated_duration_days_max != null) {
    return `Szac. czas: ${item.estimated_duration_days_min}–${item.estimated_duration_days_max} dni rob.`;
  }
  return "";
}

/** Waga do sortowania `sort=sla`: przeterminowane, potem bliższe terminy. */
export function deadlineSortWeight(kind: DeadlineSummaryKind): number {
  if (kind === "overdue") return 0;
  if (kind === "tomorrow") return 1;
  if (kind === "today") return 2;
  return 3;
}
