"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { usePanelBasePath } from "@/lib/panelPaths";
import type { RepairRequestListItem } from "@/types/repairs";
import Link from "next/link";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { STATUS_OPTIONS as REPAIR_STATUS_OPTIONS_BASE } from "@/components/panel/WorkerStatusChangeModal";
import { PanelDateRangePicker } from "@/components/panel/PanelDateRangePicker";

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

const KANBAN_NEW_STATUSES = new Set(["new", "accepted"]);
const KANBAN_IN_PROGRESS_STATUSES = new Set([
  "in_diagnostics",
  "diagnostics_done",
  "quote_sent",
  "waiting_for_parts",
  "in_repair",
]);
const KANBAN_READY_STATUSES = new Set([
  "ready_for_pickup",
  "shipped",
]);
const KANBAN_DONE_STATUSES = new Set([
  "picked_up",
  "delivered",
]);

const KANBAN_COLUMNS = [
  { key: "new" as const, title: "Nowe" },
  { key: "in_progress" as const, title: "W trakcie" },
  { key: "ready" as const, title: "Gotowe do odbioru" },
  { key: "done" as const, title: "Zakończone" },
] as const;
type KanbanColumnKey = (typeof KANBAN_COLUMNS)[number]["key"];

type DatePreset = "today" | "week" | "month" | "last_7" | "last_14" | "last_30" | "custom";

type AssignableStaffRow = {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  picker_label?: string;
  role?: "staff" | "admin" | string;
};

const STAFF_FILTER_NAMES = ["Kuba", "Rafał", "Paweł"] as const;

const STATUS_OPTION_COLORS: Record<string, "gray" | "amber" | "blue" | "purple" | "green" | "red"> = {
  new: "gray",
  accepted: "blue",
  in_diagnostics: "blue",
  diagnostics_done: "blue",
  quote_pending: "amber",
  quote_sent: "purple",
  quote_accepted: "amber",
  quote_rejected: "red",
  waiting_for_parts: "blue",
  in_repair: "amber",
  repair_done: "amber",
  in_testing: "amber",
  testing_passed: "green",
  testing_failed: "red",
  ready_for_pickup: "green",
  picked_up: "gray",
  shipped: "gray",
  delivered: "gray",
  cancelled: "red",
  unrepairable: "red",
  abandoned: "red",
};

const STATUS_OPTIONS: Array<{ value: string; label: string; color: "gray" | "amber" | "blue" | "purple" | "green" | "red" }> =
  REPAIR_STATUS_OPTIONS_BASE.map((s) => ({
    value: s.value,
    label: s.label,
    color: STATUS_OPTION_COLORS[s.value] ?? "gray",
  }));


function statusPillColor(status: string): { bg: string; border: string; text: string } {
  const opt = STATUS_OPTIONS.find((s) => s.value === status);
  const color = opt?.color ?? "gray";
  switch (color) {
    case "green":
      return { bg: "rgba(34,197,94,.14)", border: "rgba(34,197,94,.28)", text: "#22c55e" };
    case "amber":
      return { bg: "rgba(245,158,11,.16)", border: "rgba(245,158,11,.30)", text: "#f59e0b" };
    case "blue":
      return { bg: "rgba(59,130,246,.14)", border: "rgba(59,130,246,.28)", text: "#3b82f6" };
    case "purple":
      return { bg: "rgba(139,92,246,.14)", border: "rgba(139,92,246,.28)", text: "#8b5cf6" };
    case "red":
      return { bg: "rgba(220,30,30,.14)", border: "rgba(220,30,30,.28)", text: "#dc1e1e" };
    default:
      return { bg: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.12)", text: "#9ba3b0" };
  }
}

function getAssigneeName(item: RepairRequestListItem): string {
  if (!item.assigned_to) return "Nieprzypisane";
  if (typeof item.assigned_to === "string") return "Przypisany";
  const full = `${item.assigned_to.first_name ?? ""} ${item.assigned_to.last_name ?? ""}`.trim();
  return full || item.assigned_to.email || "Przypisany";
}

function KanbanBoardSkeleton() {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="flex gap-5 overflow-x-auto pb-2">
        {Array.from({ length: 4 }).map((_, col) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={col}
            className="min-w-[320px] flex-1 rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-3"
          >
            <Skeleton className="h-5 w-24" />
            <div className="mt-3 space-y-3">
              {Array.from({ length: 3 }).map((_, row) => (
                // eslint-disable-next-line react/no-array-index-key
                <Skeleton key={row} variant="card" className="h-28" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ymd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dayStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function rangeByPreset(
  preset: "today" | "week" | "month" | "last_7" | "last_14" | "last_30",
  ref: Date,
): { from: string; to: string } {
  const now = dayStart(ref);
  if (preset === "today") return { from: ymd(now), to: ymd(now) };
  if (preset === "last_7" || preset === "last_14" || preset === "last_30") {
    const days = preset === "last_7" ? 7 : preset === "last_14" ? 14 : 30;
    const from = new Date(now);
    from.setDate(now.getDate() - (days - 1));
    return { from: ymd(from), to: ymd(now) };
  }
  if (preset === "week") {
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { from: ymd(monday), to: ymd(sunday) };
  }
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: ymd(monthStart), to: ymd(monthEnd) };
}

function inDateScope(item: RepairRequestListItem, from: string, to: string): boolean {
  const parseYmd = (v: string): Date | null => {
    if (!v) return null;
    const [yy, mm, dd] = v.split("-").map((n) => Number(n));
    if (!yy || !mm || !dd) return null;
    return new Date(yy, mm - 1, dd);
  };
  if (!from && !to) return true;
  const raw = item.accepted_at || item.created_at;
  if (!raw) return false;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return false;
  const point = dayStart(d).getTime();
  const fromDate = parseYmd(from);
  const toDate = parseYmd(to);
  const fromMs = fromDate ? dayStart(fromDate).getTime() : Number.NEGATIVE_INFINITY;
  const toMs = toDate ? dayStart(toDate).getTime() : Number.POSITIVE_INFINITY;
  return point >= fromMs && point <= toMs;
}

export default function PanelZgloszeniaPage() {
  const { token, user } = useAuth();
  const panelPaths = usePanelBasePath();
  const [items, setItems] = useState<RepairRequestListItem[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [assignedToUuid, setAssignedToUuid] = useState<string>("");
  const [datePreset, setDatePreset] = useState<DatePreset>("last_7");
  const [dateFrom, setDateFrom] = useState<string>(() => rangeByPreset("last_7", new Date()).from);
  const [dateTo, setDateTo] = useState<string>(() => rangeByPreset("last_7", new Date()).to);

  const page = 1;
  const isAdmin = user?.role === "admin";
  const canRequest = Boolean(token && user);

  const staffQuery = useQuery({
    queryKey: ["accounts", "staff", "assignable-for-repairs"],
    enabled: Boolean(token && isAdmin),
    queryFn: async () => {
      if (!token) throw new Error("Missing auth/token");
      return api.get<AssignableStaffRow[]>("/accounts/staff/assignable-for-repairs/?include_self=1", token);
    },
    staleTime: 60_000,
  });

  const staffFilters = useMemo(() => {
    const rows = (staffQuery.data ?? []).filter((row) => row.role === "staff");
    return STAFF_FILTER_NAMES.map((name) => {
      const match = rows.find((row) => (row.first_name ?? "").trim() === name);
      return { name, id: match?.id ?? null, available: Boolean(match) };
    });
  }, [staffQuery.data]);

  useEffect(() => {
    if (datePreset === "custom") return;
    const range = rangeByPreset(datePreset, new Date());
    setDateFrom(range.from);
    setDateTo(range.to);
  }, [datePreset]);

  useEffect(() => {
    if (!canRequest) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("page_size", "500");

        if (user?.role === "staff") params.set("assigned_to", String(user.id));
        if (isAdmin && assignedToUuid.trim()) params.set("assigned_to", assignedToUuid.trim());

        const url = `/repairs/?${params.toString()}`;
        const data = await api.get<PaginatedResponse<RepairRequestListItem>>(url, token);
        setItems(data?.results ?? []);
        setCount(data?.count ?? 0);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Nie udało się pobrać listy zgłoszeń.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [canRequest, token, user?.role, user?.id, page, assignedToUuid, isAdmin, reloadNonce]);

  const panelLabel = user?.role === "admin" ? "Panel Admina" : "Panel pracownika";
  const scopeLabel = user?.role === "admin" ? "Wszystkie naprawy" : "Moje naprawy";

  const scopedItems = useMemo(() => items.filter((r) => inDateScope(r, dateFrom, dateTo)), [items, dateFrom, dateTo]);

  const kanbanByColumn = useMemo(() => {
    const map: Record<KanbanColumnKey, RepairRequestListItem[]> = { new: [], in_progress: [], ready: [], done: [] };
    for (const r of scopedItems) {
      if (KANBAN_NEW_STATUSES.has(r.status)) map.new.push(r);
      else if (KANBAN_IN_PROGRESS_STATUSES.has(r.status)) map.in_progress.push(r);
      else if (KANBAN_READY_STATUSES.has(r.status)) map.ready.push(r);
      else if (KANBAN_DONE_STATUSES.has(r.status)) map.done.push(r);
      else map.in_progress.push(r);
    }
    return map;
  }, [scopedItems]);

  return (
    <main className="mx-auto min-h-screen max-w-[1840px] px-3 py-4 md:px-4 md:py-8">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--ink2)]">{panelLabel}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--white)]">{scopeLabel}</h1>
            <p className="mt-1 text-sm text-[var(--ink2)]">Premium kanban serwisowy — daty, kalendarz i pracownicy.</p>
          </div>
          <Link
            href={panelPaths.intakePath}
            className="rounded-2xl bg-[#dc1e1e] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            + Nowe zgłoszenie
          </Link>
        </div>
      </header>

      <section className="mb-6 rounded-3xl border border-[#2a3142] bg-[#0c101a]/85 p-4 shadow-[0_16px_44px_rgba(0,0,0,.35)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {([
              { key: "today", label: "Dzisiaj" },
              { key: "last_7", label: "Ostatnie 7 dni" },
              { key: "last_14", label: "Ostatnie 14 dni" },
              { key: "last_30", label: "Ostatnie 30 dni" },
              { key: "week", label: "Ten tydzień" },
              { key: "month", label: "Ten miesiąc" },
            ] as const).map((p) => {
              const on = datePreset === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setDatePreset(p.key)}
                  className="rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition"
                  style={{
                    borderColor: on ? "rgba(59,130,246,.5)" : "rgba(255,255,255,.14)",
                    background: on ? "rgba(59,130,246,.18)" : "rgba(255,255,255,.03)",
                    color: on ? "#dbeafe" : "#9ca3af",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <PanelDateRangePicker
              value={{ from: dateFrom, to: dateTo }}
              onChange={(next) => {
                setDatePreset("custom");
                setDateFrom(next.from);
                setDateTo(next.to);
              }}
            />
            <button
              type="button"
              onClick={() => {
                const range = rangeByPreset("last_7", new Date());
                setDatePreset("last_7");
                setDateFrom(range.from);
                setDateTo(range.to);
              }}
              className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-xs font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
            >
              Reset zakresu
            </button>
          </div>
        </div>

        {isAdmin && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAssignedToUuid("")}
              className="rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition"
              style={{
                borderColor: assignedToUuid ? "rgba(255,255,255,.12)" : "rgba(59,130,246,.45)",
                background: assignedToUuid ? "rgba(255,255,255,.03)" : "rgba(59,130,246,.18)",
                color: assignedToUuid ? "#9ca3af" : "#dbeafe",
              }}
            >
              Wszyscy
            </button>
            {staffFilters.map((worker) => {
              const active = worker.id != null && assignedToUuid === worker.id;
              return (
                <button
                  key={worker.name}
                  type="button"
                  onClick={() => {
                    if (worker.id) setAssignedToUuid(worker.id);
                  }}
                  disabled={!worker.available}
                  className="rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-45"
                  style={{
                    borderColor: active ? "rgba(59,130,246,.5)" : "rgba(255,255,255,.12)",
                    background: active ? "rgba(59,130,246,.18)" : "rgba(255,255,255,.03)",
                    color: active ? "#dbeafe" : "#9ca3af",
                  }}
                >
                  {worker.name}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {loading ? <KanbanBoardSkeleton /> : null}
      {error && !loading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-4 py-8">
          <ErrorState error={new Error(error)} onRetry={() => setReloadNonce((n) => n + 1)} title="Błąd listy zgłoszeń" />
        </div>
      ) : null}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-4 py-8">
          <EmptyState
            icon={EMPTY_STATES.myRepairs.icon}
            title={EMPTY_STATES.myRepairs.title}
            description="Brak zgłoszeń z ostatnich 7 dni."
          />
        </div>
      )}

      {!loading && !error && items.length > 0 && scopedItems.length === 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-4 py-8">
          <EmptyState
            icon={EMPTY_STATES.search.icon}
            title="Brak zgłoszeń z ostatnich 7 dni"
            description="W tym zakresie nie ma jeszcze żadnych napraw."
          />
        </div>
      )}

      {!loading && !error && scopedItems.length > 0 && (
        <section className="rounded-3xl border border-[#263042] bg-gradient-to-b from-[#0f1422] to-[#090d17] p-4 shadow-[0_16px_48px_rgba(0,0,0,.42)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
            <p className="text-sm text-[var(--ink2)]">
              Wyniki: <span className="font-semibold text-[var(--white)]">{scopedItems.length}</span>
              <span className="ml-2 text-xs text-[#8ea2c7]">z {count}</span>
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Kanban</p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 md:gap-5">
            {KANBAN_COLUMNS.map((col) => {
              const colItems = kanbanByColumn[col.key];
              return (
                <div
                  key={col.key}
                  className="min-w-[286px] flex-1 rounded-2xl border border-[#2b3650] bg-[#0a1020]/88 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.05)] md:min-w-[330px] md:rounded-3xl"
                >
                  <div className="flex items-center justify-between gap-3 px-2 py-1">
                    <div className="text-sm font-semibold text-[#edf3ff]">{col.title}</div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-[#b7c3db]">
                      {colItems.length}
                    </div>
                  </div>

                  <div className="mt-2 space-y-3">
                    {colItems.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-8 text-center text-xs text-[#7384a5]">
                        Brak zgłoszeń w tej kolumnie
                      </div>
                    ) : null}
                    {colItems.map((r) => {
                      const pill = statusPillColor(r.status);
                      const waitingDays = typeof r.waiting_for_client_days === "number" ? r.waiting_for_client_days : null;
                      const createdAt = new Date(r.created_at).toLocaleDateString("pl-PL", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      });

                      return (
                        <Link
                          key={r.id}
                          href={panelPaths.repairDetailPath(r.id)}
                          className="group block rounded-2xl border border-[#27334a] bg-[#0d1428] p-3 transition hover:-translate-y-0.5 hover:border-[#4f69a3] hover:bg-[#111a32] hover:shadow-[0_12px_28px_rgba(0,0,0,.35)]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-sm font-semibold text-[#f3f7ff] group-hover:text-[#93c5fd]">
                                  {r.repair_number}
                                </span>
                                <span
                                  className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                                  style={{
                                    background: pill.bg,
                                    border: `1px solid ${pill.border}`,
                                    color: pill.text,
                                  }}
                                >
                                  {r.status_display}
                                </span>
                              </div>

                              {waitingDays != null && waitingDays > 0 && (
                                <div className="mt-2">
                                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-400">
                                    czeka {waitingDays} dni
                                  </span>
                                </div>
                              )}

                              <p className="mt-1 text-sm text-[#c8d2e9] line-clamp-2">
                                {r.client_name} · {r.device_name}
                              </p>

                              <p className="mt-2 text-xs text-[#8da0c5]">
                                <span className="font-semibold uppercase tracking-wide text-[#b7c3db]">Serwisant:</span>{" "}
                                {getAssigneeName(r)}
                              </p>
                            </div>

                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <span className="text-xs text-[#8da0c5]">{createdAt}</span>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center justify-end">
                            <span className="text-[var(--ink2)] transition group-hover:text-[var(--white)]">→</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
