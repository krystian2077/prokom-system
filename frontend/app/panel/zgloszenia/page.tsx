"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { usePanelBasePath } from "@/lib/panelPaths";
import type { RepairRequestListItem } from "@/types/repairs";
import Link from "next/link";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { STATUS_OPTIONS as REPAIR_STATUS_OPTIONS_BASE } from "@/components/panel/WorkerStatusChangeModal";

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type ScopeTag = string;

const KANBAN_NEW_STATUSES = new Set(["new", "accepted", "in_diagnostics", "diagnostics_done"]);
const KANBAN_QUOTE_STATUSES = new Set(["quote_pending", "quote_sent", "quote_accepted", "quote_rejected"]);
const KANBAN_IN_PROGRESS_STATUSES = new Set([
  "waiting_for_parts",
  "in_repair",
  "repair_done",
  "in_testing",
  "testing_passed",
  "testing_failed",
]);
const KANBAN_DONE_STATUSES = new Set([
  "ready_for_pickup",
  "picked_up",
  "shipped",
  "delivered",
  "cancelled",
  "unrepairable",
  "abandoned",
]);

const KANBAN_COLUMNS = [
  { key: "new" as const, title: "Nowe" },
  { key: "quote" as const, title: "Wycena" },
  { key: "in_progress" as const, title: "W trakcie" },
  { key: "done" as const, title: "Zakończone" },
] as const;
type KanbanColumnKey = (typeof KANBAN_COLUMNS)[number]["key"];

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

const PRIORITY_OPTIONS: Array<{ value: string; label: string; color: "gray" | "amber" | "red" | "blue" }> = [
  { value: "low", label: "Niski", color: "gray" },
  { value: "normal", label: "Normalny", color: "blue" },
  { value: "high", label: "Wysoki", color: "amber" },
  { value: "urgent", label: "Pilny", color: "red" },
  { value: "same_day", label: "Same Day", color: "red" },
];

const REPAIR_TYPE_OPTIONS: Array<{ value: string; label: string; color: "gray" | "amber" | "red" | "blue" }> = [
  { value: "standard", label: "Standardowa", color: "gray" },
  { value: "warranty", label: "Gwarancyjna", color: "blue" },
  { value: "complaint", label: "Reklamacja", color: "amber" },
  { value: "scheduled", label: "Z umówionym terminem", color: "gray" },
];

const TAG_OPTIONS: Array<{ value: ScopeTag; label: string }> = [
  { value: "pilne", label: "Pilne" },
  { value: "same_day", label: "Same Day" },
  { value: "wysyłkowe", label: "Wysyłkowe" },
  { value: "reklamacja", label: "Reklamacja" },
  { value: "gwarancja", label: "Gwarancja" },
  { value: "niekompletne", label: "Niekompletne" },
  { value: "czeka_na_czesc", label: "Czeka na część" },
  { value: "klient_wraca", label: "Klient wraca" },
  { value: "firma", label: "Firma" },
  { value: "odzyskiwanie_danych", label: "Odzyskiwanie danych" },
  { value: "apple", label: "Apple" },
  { value: "samsung", label: "Samsung" },
];

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

function KanbanBoardSkeleton() {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {Array.from({ length: 4 }).map((_, col) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={col}
            className="min-w-[280px] flex-1 rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-3"
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

export default function PanelZgloszeniaPage() {
  const { token, user } = useAuth();
  const panelPaths = usePanelBasePath();
  const [items, setItems] = useState<RepairRequestListItem[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const [page, setPage] = useState(1);

  // Filtry (startujemy od tych, które backend obsługuje „na pewno”)
  const [status, setStatus] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [repairType, setRepairType] = useState<string>("");
  const [assignedToUuid, setAssignedToUuid] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [ordering, setOrdering] = useState<string>("-created_at");

  const isAdmin = user?.role === "admin";

  const canRequest = Boolean(token && user);

  const activeTagSet = useMemo(() => new Set(tags), [tags]);

  const toggleTag = (t: string) => {
    setTags((prev) => {
      const set = new Set(prev);
      if (set.has(t)) set.delete(t);
      else set.add(t);
      return Array.from(set);
    });
  };

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

        // staff: zawsze „assigned_to=me”
        if (user?.role === "staff") params.set("assigned_to", String(user.id));
        // admin: opcjonalnie wpisany uuid
        if (isAdmin && assignedToUuid.trim()) params.set("assigned_to", assignedToUuid.trim());

        if (status) params.set("status", status);
        if (priority) params.set("priority", priority);
        if (repairType) params.set("repair_type", repairType);
        if (ordering) params.set("ordering", ordering);
        if (search.trim()) params.set("search", search.trim());
        tags.forEach((t) => params.append("tags", t));

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
    load();
  }, [
    canRequest,
    token,
    user?.role,
    user?.id,
    page,
    status,
    priority,
    repairType,
    assignedToUuid,
    search,
    tags,
    ordering,
    isAdmin,
  ]);

  useEffect(() => {
    // Gdy zmieniamy filtry, wracamy do pierwszej strony.
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, priority, repairType, assignedToUuid, search, tags, ordering]);

  const panelLabel = user?.role === "admin" ? "Panel Admina" : "Panel pracownika";
  const scopeLabel = user?.role === "admin" ? "Wszystkie naprawy" : "Moje naprawy";

  const kanbanByColumn = useMemo(() => {
    const map: Record<KanbanColumnKey, RepairRequestListItem[]> = {
      new: [],
      quote: [],
      in_progress: [],
      done: [],
    };

    for (const r of items) {
      if (KANBAN_NEW_STATUSES.has(r.status)) map.new.push(r);
      else if (KANBAN_QUOTE_STATUSES.has(r.status)) map.quote.push(r);
      else if (KANBAN_IN_PROGRESS_STATUSES.has(r.status)) map.in_progress.push(r);
      else if (KANBAN_DONE_STATUSES.has(r.status)) map.done.push(r);
      else map.done.push(r);
    }

    return map;
  }, [items]);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--ink2)]">{panelLabel}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--white)]">{scopeLabel}</h1>
            <p className="mt-1 text-sm text-[var(--ink2)]">
              Kanban z naprawami przypisanymi do Ciebie — kliknij kartę, aby przejść do szczegółów.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Porządek</div>
              <select
                value={ordering}
                onChange={(e) => setOrdering(e.target.value)}
                className="rounded-2xl border border-[var(--border)] bg-[#111318] px-3 py-1.5 text-xs font-semibold text-[var(--white)] outline-none focus:border-[#dc1e1e]"
              >
                <option value="-created_at">Najnowsze</option>
                <option value="created_at">Najstarsze</option>
                <option value="estimated_completion_date">ETA (rosnąco)</option>
              </select>
            </div>
            <Link
              href={panelPaths.intakePath}
              className="rounded-2xl bg-[#dc1e1e] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              + Nowe zgłoszenie
            </Link>
          </div>
        </div>
      </header>

      <section className="hidden mb-6 rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-1 flex-col gap-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Wyszukiwanie</div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="np. numer naprawy, klient, telefon, IMEI, serial, opis…"
              className="rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-2.5 text-sm text-[var(--white)] outline-none focus:border-[#dc1e1e]"
            />
          </div>

          <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-3 lg:max-w-[620px] lg:flex-1 lg:items-end">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Status</div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-2.5 text-sm text-[var(--white)] outline-none focus:border-[#dc1e1e]"
              >
                <option value="">Wszystkie</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Priorytet</div>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-2.5 text-sm text-[var(--white)] outline-none focus:border-[#dc1e1e]"
              >
                <option value="">Wszystkie</option>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden md:block">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Typ sprawy</div>
              <select
                value={repairType}
                onChange={(e) => setRepairType(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-2.5 text-sm text-[var(--white)] outline-none focus:border-[#dc1e1e]"
              >
                <option value="">Wszystkie</option>
                {REPAIR_TYPE_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {TAG_OPTIONS.map((t) => {
            const on = activeTagSet.has(t.value);
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => toggleTag(t.value)}
                className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition"
                style={{
                  color: on ? "#fff" : "#8b93a8",
                  background: on ? "rgba(220,30,30,.18)" : "transparent",
                  borderColor: on ? "rgba(220,30,30,.35)" : "rgba(255,255,255,.10)",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {isAdmin && (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Przypisanie (uuid)</div>
              <input
                value={assignedToUuid}
                onChange={(e) => setAssignedToUuid(e.target.value)}
                placeholder="opcjonalnie: assigned_to=<uuid> (puste = wszyscy)"
                className="mt-1 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-2.5 text-sm text-[var(--white)] outline-none focus:border-[#dc1e1e]"
              />
            </div>
            <div className="flex items-end justify-end">
              <button
                type="button"
                onClick={() => {
                  setAssignedToUuid("");
                  setStatus("");
                  setPriority("");
                  setRepairType("");
                  setSearch("");
                  setTags([]);
                  setOrdering("-created_at");
                }}
                className="rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2.5 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)]"
              >
                Wyczyść filtry
              </button>
            </div>
          </div>
        )}

        {!isAdmin && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setStatus("");
                setPriority("");
                setRepairType("");
                setSearch("");
                setTags([]);
                setOrdering("-created_at");
              }}
              className="rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2.5 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)]"
            >
              Wyczyść filtry
            </button>
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
            description={EMPTY_STATES.myRepairs.description}
          />
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
            <p className="text-sm text-[var(--ink2)]">
              Wyniki: <span className="font-semibold text-[var(--white)]">{count}</span>
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Kanban</p>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {KANBAN_COLUMNS.map((col) => {
              const colItems = kanbanByColumn[col.key];
              return (
                <div
                  key={col.key}
                  className="min-w-[280px] flex-1 rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-3"
                >
                  <div className="flex items-center justify-between gap-3 px-2 py-1">
                    <div className="text-sm font-semibold text-[var(--white)]">{col.title}</div>
                    <div className="rounded-full bg-[var(--row-hover)] px-2 py-0.5 text-[11px] font-semibold text-[var(--ink2)]">
                      {colItems.length}
                    </div>
                  </div>

                  <div className="mt-2 space-y-3">
                    {colItems.map((r) => {
                      const pill = statusPillColor(r.status);
                      const waitingDays =
                        typeof r.waiting_for_client_days === "number" ? r.waiting_for_client_days : null;
                      const createdAt = new Date(r.created_at).toLocaleDateString("pl-PL", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      });

                      return (
                        <Link
                          key={r.id}
                          href={panelPaths.zgloszenieDetailPath(r.id)}
                          className="group block rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-3 transition hover:border-white/20 hover:bg-[#111318]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-sm font-semibold text-[var(--white)] group-hover:text-[#dc1e1e]">
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

                              <p className="mt-1 text-sm text-[#b4b8c4] line-clamp-2">
                                {r.client_name} · {r.device_name}
                              </p>
                            </div>

                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <span
                                className="rounded-full border border-[var(--border)] bg-[var(--row-hover)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink2)]"
                                title="Priorytet"
                              >
                                {r.priority_display}
                              </span>
                              <span className="text-xs text-[var(--muted)]">{createdAt}</span>
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
