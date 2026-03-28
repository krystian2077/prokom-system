"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { RepairTableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import type { RepairRequestListItem } from "@/types/repairs";
import {
  repairListAcceptanceDateLabel,
  compareRepairListByAcceptanceDate,
  compareRepairListByRepairNumber,
  repairListMatchesSearch,
  deadlineSummary,
  isArchivedFinalStatus,
  matchesInRepairPillFilter,
  matchesNewRepairPhaseFilter,
  matchesReadyForPickupPillFilter,
  nextAction,
  nextActionBadgeStyle,
  priorityRank,
  repairListCostLabel,
  statusBadge,
} from "@/lib/repairListDisplay";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, RotateCcw, Search, X } from "lucide-react";

const PAGE_SIZE = 20;

type RepairsPillKey = "all" | "new" | "in_progress" | "parts_waiting" | "ready";

const ALL_REPAIRS_PILL_KEYS: RepairsPillKey[] = ["all", "new", "in_progress", "parts_waiting", "ready"];

function derivePillFilter(item: RepairRequestListItem, pill: RepairsPillKey) {
  const s = (item.status ?? "").toLowerCase();
  if (pill === "all") return true;
  if (pill === "new") {
    if (isArchivedFinalStatus(item.status)) return false;
    return matchesNewRepairPhaseFilter(item.status);
  }
  if (pill === "ready") return matchesReadyForPickupPillFilter(item.status);
  if (pill === "parts_waiting") return s === "waiting_for_parts";
  if (pill === "in_progress") return matchesInRepairPillFilter(item.status);

  return false;
}

/** Imię pracownika lub „JA”, gdy naprawa jest przypisana do zalogowanego użytkownika. */
function workerDisplayName(item: RepairRequestListItem, userId: string | null | undefined): string {
  if (!item.assigned_to) return "—";
  const me = userId != null ? String(userId) : null;
  if (typeof item.assigned_to === "string") {
    return me != null && item.assigned_to === me ? "JA" : "—";
  }
  const isMe = me != null && String(item.assigned_to.id) === me;
  if (isMe) return "JA";
  const first = (item.assigned_to.first_name ?? "").trim();
  if (first) return first;
  const last = (item.assigned_to.last_name ?? "").trim();
  if (last) return last;
  const email = (item.assigned_to.email ?? "").trim();
  if (email) {
    const local = email.split("@")[0] ?? "";
    if (local) return local;
  }
  return "—";
}

function AllRepairsPageInner() {
  const { token, user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const searchParams = useSearchParams();

  const rawStatus = searchParams.get("status");
  const pill: RepairsPillKey =
    rawStatus && ALL_REPAIRS_PILL_KEYS.includes(rawStatus as RepairsPillKey) ? (rawStatus as RepairsPillKey) : "all";
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const acceptanceSort = searchParams.get("acceptance_sort");
  const refSort = searchParams.get("ref_sort");
  const urlQ = searchParams.get("q") ?? "";
  const [searchDraft, setSearchDraft] = useState(urlQ);

  useEffect(() => {
    setSearchDraft(urlQ);
  }, [urlQ]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = searchDraft.trim();
      const cur = (searchParams.get("q") ?? "").trim();
      if (next === cur) return;
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set("q", next);
      else params.delete("q");
      params.set("page", "1");
      router.push(`/panel/wszystkie?${params.toString()}`);
    }, 350);
    return () => window.clearTimeout(id);
  }, [searchDraft, searchParams, router]);

  const repairsQuery = useQuery({
    queryKey: ["repairs", "all", "list"],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) throw new Error("Missing auth/token");
      return api.get<RepairRequestListItem[]>(`/staff/repairs/?ordering=-created_at`, token);
    },
    staleTime: 10_000,
  });

  const allItems = repairsQuery.data ?? [];

  const pills: Array<{ key: RepairsPillKey; label: string; tone: "red" | "amber" | "gray" | "green" | "blue" }> = [
    { key: "all", label: "Wszystkie", tone: "gray" },
    { key: "new", label: "Nowe", tone: "blue" },
    { key: "in_progress", label: "W naprawie", tone: "red" },
    { key: "parts_waiting", label: "Czeka na część", tone: "amber" },
    { key: "ready", label: "Do odbioru", tone: "green" },
  ];

  const counts = useMemo(() => {
    const out: Record<RepairsPillKey, number> = { all: 0, new: 0, in_progress: 0, parts_waiting: 0, ready: 0 };
    out.all = allItems.length;
    for (const p of pills) {
      out[p.key] = allItems.filter((i) => derivePillFilter(i, p.key)).length;
    }
    return out;
  }, [allItems]);

  const filtered = useMemo(() => {
    const list = allItems.filter(
      (i) => derivePillFilter(i, pill) && repairListMatchesSearch(i, searchDraft),
    );
    const sorted = [...list];

    sorted.sort((a, b) => {
      if (refSort === "newest") return compareRepairListByRepairNumber(a, b, true);
      if (refSort === "oldest") return compareRepairListByRepairNumber(a, b, false);
      if (acceptanceSort === "newest") return compareRepairListByAcceptanceDate(a, b, true);
      if (acceptanceSort === "oldest") return compareRepairListByAcceptanceDate(a, b, false);
      return priorityRank(a.priority) - priorityRank(b.priority);
    });

    return sorted;
  }, [allItems, pill, searchDraft, acceptanceSort, refSort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const sliced = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const setQuery = (next: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === null || String(v).length === 0) params.delete(k);
      else params.set(k, String(v));
    });
    router.push(`/panel/wszystkie?${params.toString()}`);
  };

  const cycleAcceptanceSort = () => {
    const next = acceptanceSort === "newest" ? "oldest" : "newest";
    setQuery({ acceptance_sort: next, ref_sort: undefined, page: 1 });
  };

  const cycleRefSort = () => {
    const next = refSort === "newest" ? "oldest" : "newest";
    setQuery({ ref_sort: next, acceptance_sort: undefined, page: 1 });
  };

  const handleRefresh = () => {
    void qc.invalidateQueries({ queryKey: ["repairs", "all", "list"] });
  };

  /** Jak „Moje naprawy” + kolumna Pracownik przed kosztem i telefonem */
  const tableGridClass =
    "grid min-w-[1380px] grid-cols-[minmax(168px,1fr)_minmax(260px,1.55fr)_minmax(148px,1fr)_minmax(132px,1fr)_minmax(200px,1.15fr)_minmax(140px,1fr)_minmax(112px,0.95fr)_minmax(132px,1fr)] gap-x-3 gap-y-2";

  return (
    <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-8">
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink2)]">Pracownik</p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--white)]">Wszystkie naprawy</h1>
            <p className="mt-1 text-sm text-[#d1d5db]">
              Pełna lista serwisu ·{" "}
              <span className="font-semibold text-[var(--white)]">{allItems.length}</span> pozycji
              <span className="mt-1 block text-xs font-normal text-[var(--ink2)]">
                Kliknij wiersz, aby otworzyć pełne szczegóły naprawy i nią zarządzać.
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/panel/naprawy"
              className="rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[#d1d5db] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
            >
              Moje naprawy
            </Link>
            <button
              type="button"
              onClick={handleRefresh}
              className="rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[#d1d5db] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
            >
              <span className="inline-flex items-center gap-2">
                <RotateCcw size={16} />
                Odśwież
              </span>
            </button>
          </div>
        </header>

        <div className="worker-card-shimmer rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {pills.map((p) => {
                const on = pill === p.key;
                const base =
                  p.tone === "red"
                    ? { bg: "rgba(220,30,30,.14)", border: "rgba(220,30,30,.35)", text: "#dc1e1e" }
                    : p.tone === "amber"
                      ? { bg: "rgba(245,158,11,.16)", border: "rgba(245,158,11,.35)", text: "#f59e0b" }
                      : p.tone === "green"
                        ? { bg: "rgba(34,197,94,.14)", border: "rgba(34,197,94,.30)", text: "#22c55e" }
                        : p.tone === "blue"
                          ? { bg: "rgba(59,130,246,.16)", border: "rgba(59,130,246,.38)", text: "#93c5fd" }
                          : { bg: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.12)", text: "#9ca3af" };

                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setQuery({ status: p.key, page: 1 })}
                    className="rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition"
                    style={{
                      background: on ? "rgba(59,130,246,.14)" : base.bg,
                      borderColor: on ? "rgba(59,130,246,.45)" : base.border,
                      color: on ? "#fff" : base.text,
                    }}
                  >
                    {p.label}({counts[p.key] ?? 0})
                  </button>
                );
              })}
            </div>

            <div className="w-full min-w-0 sm:max-w-md">
              <label className="sr-only" htmlFor="all-repairs-search">
                Szukaj na liście
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
                  aria-hidden
                />
                <input
                  id="all-repairs-search"
                  type="search"
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                  placeholder="Nr ref, data przyjęcia, klient, telefon, urządzenie…"
                  autoComplete="off"
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] py-2.5 pl-10 pr-10 text-sm text-[var(--white)] outline-none placeholder:text-[var(--muted)] focus:border-[#3b82f6]/50"
                />
                {searchDraft ? (
                  <button
                    type="button"
                    aria-label="Wyczyść wyszukiwanie"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
                    onClick={() => {
                      setSearchDraft("");
                      setQuery({ q: undefined, page: 1 });
                    }}
                  >
                    <X size={16} />
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={cycleRefSort}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-xs font-semibold text-[#e5e7eb] transition hover:bg-[var(--row-active)]"
            >
              Nr ref:
              {refSort === "newest" ? (
                <>
                  <ArrowDown className="h-3.5 w-3.5 shrink-0 text-[#93c5fd]" aria-hidden />
                  malejąco
                </>
              ) : refSort === "oldest" ? (
                <>
                  <ArrowUp className="h-3.5 w-3.5 shrink-0 text-[#93c5fd]" aria-hidden />
                  rosnąco
                </>
              ) : (
                <span className="text-[var(--ink2)]">domyślnie</span>
              )}
            </button>
            <button
              type="button"
              onClick={cycleAcceptanceSort}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-xs font-semibold text-[#e5e7eb] transition hover:bg-[var(--row-active)]"
            >
              Data przyjęcia:
              {acceptanceSort === "newest" ? (
                <>
                  <ArrowDown className="h-3.5 w-3.5 shrink-0 text-[#93c5fd]" aria-hidden />
                  najnowsze
                </>
              ) : acceptanceSort === "oldest" ? (
                <>
                  <ArrowUp className="h-3.5 w-3.5 shrink-0 text-[#93c5fd]" aria-hidden />
                  najstarsze
                </>
              ) : (
                <span className="text-[var(--ink2)]">domyślnie (priorytet)</span>
              )}
            </button>
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-[#2a3142]/80 bg-[#08090d] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div
              className={
                tableGridClass +
                " items-stretch border-b border-[#2d3548] bg-gradient-to-b from-[#151821] to-[#0d0f14] px-4 py-4 text-[11px] font-bold uppercase leading-tight tracking-[0.18em] text-[#8b9cbb] sm:text-xs"
              }
            >
              <div className="flex min-w-0 justify-center">
                <button
                  type="button"
                  onClick={cycleRefSort}
                  className="inline-flex max-w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent px-2 py-1.5 transition hover:border-[#3b82f6]/25 hover:bg-[#3b82f6]/10"
                  title={
                    refSort === "newest"
                      ? "Nr ref malejąco — kliknij, aby rosnąco"
                      : refSort === "oldest"
                        ? "Nr ref rosnąco — kliknij, aby malejąco"
                        : "Sortuj po numerze ref (najpierw malejąco)"
                  }
                >
                  <span className="text-[#c7d2eb]">Nr ref</span>
                  {refSort === "newest" ? (
                    <ArrowDown className="h-4 w-4 shrink-0 text-[#7dd3fc]" strokeWidth={2.25} aria-hidden />
                  ) : refSort === "oldest" ? (
                    <ArrowUp className="h-4 w-4 shrink-0 text-[#7dd3fc]" strokeWidth={2.25} aria-hidden />
                  ) : null}
                </button>
              </div>
              <div className="flex items-end justify-center pb-1 text-center text-[#c7d2eb]">Urządzenie</div>
              <div className="flex items-end justify-center pb-1 text-[#c7d2eb]">Klient</div>
              <div className="flex min-w-0 justify-center">
                <button
                  type="button"
                  onClick={cycleAcceptanceSort}
                  className="inline-flex max-w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent px-2 py-1.5 transition hover:border-[#3b82f6]/25 hover:bg-[#3b82f6]/10"
                  title={
                    acceptanceSort === "newest"
                      ? "Od najnowszych — kliknij, aby od najstarszych"
                      : acceptanceSort === "oldest"
                        ? "Od najstarszych — kliknij, aby od najnowszych"
                        : "Sortuj po dacie przyjęcia (najpierw najnowsze)"
                  }
                >
                  <span className="text-[#c7d2eb]">Data przyjęcia</span>
                  {acceptanceSort === "newest" ? (
                    <ArrowDown className="h-4 w-4 shrink-0 text-[#7dd3fc]" strokeWidth={2.25} aria-hidden />
                  ) : acceptanceSort === "oldest" ? (
                    <ArrowUp className="h-4 w-4 shrink-0 text-[#7dd3fc]" strokeWidth={2.25} aria-hidden />
                  ) : null}
                </button>
              </div>
              <div className="flex items-end justify-center pb-1 text-[#c7d2eb]">Status</div>
              <div className="flex items-end justify-center pb-1 text-[#c7d2eb]">Pracownik</div>
              <div className="flex items-end justify-center pb-1 text-[#c7d2eb]">Koszt naprawy</div>
              <div className="flex items-end justify-center pb-1 text-[#c7d2eb]">Telefon</div>
            </div>

            {repairsQuery.isLoading ? (
              <div className="p-4">
                <RepairTableSkeleton rows={6} />
              </div>
            ) : repairsQuery.error ? (
              <ErrorState
                error={repairsQuery.error instanceof Error ? repairsQuery.error : null}
                onRetry={() => void repairsQuery.refetch()}
                title="Nie udało się pobrać listy napraw"
              />
            ) : allItems.length === 0 ? (
              <EmptyState {...EMPTY_STATES.repairs} />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={EMPTY_STATES.search.icon}
                title={searchDraft.trim() ? "Brak wyników wyszukiwania" : "Brak wyników dla wybranego filtra"}
                description={
                  searchDraft.trim()
                    ? "Spróbuj innej frazy lub wyczyść pole szukania."
                    : "Zmień zakładkę statusu lub wyszukiwanie."
                }
              />
            ) : (
              <div className="divide-y divide-[#1e2433] px-2 py-1">
                {sliced.map((r, idx) => {
                  const sb = statusBadge(r);
                  const action = nextAction(r);
                  const actionStyle = nextActionBadgeStyle(action.tone);
                  const overdue = deadlineSummary(r).isOverdue;
                  const phone = (r.client_phone ?? "").trim() || "—";
                  const costLabel = repairListCostLabel(r);
                  const acceptedAtLabel = repairListAcceptanceDateLabel(r);
                  const workerName = workerDisplayName(r, user?.id);

                  return (
                    <Link
                      key={r.id}
                      href={`/panel/naprawy/${r.id}`}
                      className={`group relative block border border-transparent px-3 py-4 transition sm:px-4 sm:py-[1.125rem] ${
                        idx % 2 === 0 ? "bg-[#0a0c12]" : "bg-[#0d1018]/90"
                      } hover:border-[#3b82f6]/20 hover:bg-[#12182a]/95`}
                    >
                      <div className="absolute left-0 top-0 h-full w-[2px] bg-transparent">
                        <div
                          className={`h-full w-full origin-top transition-transform ${overdue ? "scale-y-100" : "scale-y-0"} group-hover:scale-y-100`}
                          style={{
                            background: "#ff6b6b",
                            transformOrigin: "top",
                            transitionDuration: "180ms",
                          }}
                        />
                      </div>

                      <div className="lg:hidden">
                        <div className="mb-3 min-w-0">
                          <div className="truncate text-base font-semibold text-[var(--white)]">{r.device_name}</div>
                          <div
                            className="mt-0.5 break-words font-mono text-xs font-semibold leading-snug [overflow-wrap:anywhere]"
                            style={{ color: overdue ? "#ff6b6b" : "#d1d5db" }}
                          >
                            {r.repair_number}
                          </div>
                        </div>
                        <div
                          className="mb-3 inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold leading-tight"
                          style={{ background: actionStyle.bg, borderColor: actionStyle.border, color: actionStyle.text }}
                        >
                          {action.text}
                        </div>
                        <dl className="grid grid-cols-1 gap-2 text-sm">
                          <div className="flex justify-between gap-3 border-b border-[var(--border)] pb-2">
                            <dt className="text-[var(--ink2)]">Klient</dt>
                            <dd className="min-w-0 text-right text-[#e5e7eb]">{r.client_name}</dd>
                          </div>
                          <div className="flex justify-between gap-3 border-b border-[var(--border)] pb-2 text-xs text-[#d1d5db]">
                            <dt className="text-[var(--ink2)]">Data przyjęcia</dt>
                            <dd className="min-w-0 text-right tabular-nums">{acceptedAtLabel}</dd>
                          </div>
                          <div className="flex justify-between gap-3 border-b border-[var(--border)] pb-2">
                            <dt className="text-[var(--ink2)]">Status</dt>
                            <dd className="flex justify-end">
                              <span
                                className="inline-flex max-w-full items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium leading-none"
                                style={{ background: sb.bg, borderColor: sb.border, color: sb.text }}
                              >
                                {sb.label}
                              </span>
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3 border-b border-[var(--border)] pb-2 text-xs">
                            <dt className="text-[var(--ink2)]">Pracownik</dt>
                            <dd className="min-w-0 text-right text-[#e5e7eb]">{workerName}</dd>
                          </div>
                          <div className="flex justify-between gap-3 border-b border-[var(--border)] pb-2 text-xs">
                            <dt className="text-[var(--ink2)]">Koszt naprawy</dt>
                            <dd className="min-w-0 text-right font-medium tabular-nums text-[#e5e7eb]">{costLabel ?? "—"}</dd>
                          </div>
                          <div className="flex justify-between gap-3 border-b border-[var(--border)] pb-2 text-xs">
                            <dt className="text-[var(--ink2)]">Telefon</dt>
                            <dd className="min-w-0 text-right font-mono tabular-nums text-[#e5e7eb]">{phone}</dd>
                          </div>
                        </dl>
                      </div>

                      <div className={"hidden lg:grid " + tableGridClass + " items-center"}>
                        <div className="min-w-0 max-w-full px-1 text-center">
                          <span
                            className="inline-block break-words font-mono text-sm font-semibold leading-snug tracking-tight text-[#dbeafe] [overflow-wrap:anywhere]"
                            title={r.repair_number}
                            style={{ color: overdue ? "#fb923c" : undefined }}
                          >
                            {r.repair_number}
                          </span>
                        </div>

                        <div className="min-w-0 text-center">
                          <div className="truncate text-base font-semibold tracking-tight text-[var(--white)]">{r.device_name}</div>
                          <div className="mt-2 flex justify-center">
                            <span
                              className="inline-flex max-w-full items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold leading-tight shadow-sm"
                              style={{ background: actionStyle.bg, borderColor: actionStyle.border, color: actionStyle.text }}
                            >
                              {action.text}
                            </span>
                          </div>
                        </div>

                        <div className="min-w-0 px-1 text-center">
                          <div className="truncate text-[15px] font-medium text-[#e8edf5]">{r.client_name}</div>
                        </div>

                        <div className="text-center text-[15px] tabular-nums text-[#b8c9e8]" title={acceptedAtLabel}>
                          {acceptedAtLabel}
                        </div>

                        <div className="flex justify-center px-1">
                          <span
                            className="inline-flex max-w-full shrink-0 items-center whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-medium leading-snug shadow-sm"
                            style={{ background: sb.bg, borderColor: sb.border, color: sb.text }}
                          >
                            {sb.label}
                          </span>
                        </div>

                        <div className="min-w-0 px-1 text-center">
                          <div className="truncate text-[15px] font-medium text-[#c5d4f0]" title={workerName}>
                            {workerName}
                          </div>
                        </div>

                        <div className="text-center">
                          <span
                            className="inline-block text-[15px] font-semibold tabular-nums tracking-tight text-[#f0d9a8]"
                            title={costLabel ?? undefined}
                          >
                            {costLabel ?? "—"}
                          </span>
                        </div>

                        <div className="text-center">
                          <span
                            className="inline-block text-[15px] font-mono tabular-nums tracking-wide text-[#c5d4f0]"
                            title={phone}
                          >
                            {phone}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {!repairsQuery.isLoading && filtered.length > 0 ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <p className="text-sm text-[#d1d5db]">
                  Strona <span className="font-semibold text-[var(--white)]">{safePage}</span> / {pageCount}
                  <span className="ml-2 text-[var(--ink2)]">
                    · {filtered.length}{" "}
                    {filtered.length === 1 ? "wynik" : filtered.length >= 2 && filtered.length <= 4 ? "wyniki" : "wyników"}
                    {searchDraft.trim() ? " · wyszukiwanie" : ""}
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuery({ page: Math.max(1, safePage - 1) })}
                    disabled={safePage <= 1}
                    className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[#d1d5db] transition hover:bg-[var(--row-active)] hover:text-[var(--white)] disabled:opacity-60"
                  >
                    <span className="inline-flex items-center gap-2">
                      <ChevronLeft size={16} />
                      Wstecz
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuery({ page: Math.min(pageCount, safePage + 1) })}
                    disabled={safePage >= pageCount}
                    className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[#d1d5db] transition hover:bg-[var(--row-active)] hover:text-[var(--white)] disabled:opacity-60"
                  >
                    <span className="inline-flex items-center gap-2">
                      Dalej
                      <ChevronRight size={16} />
                    </span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

function AllRepairsPageSkeleton() {
  return (
    <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-8">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--row-active)]" />
      <div className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
        <div className="px-4 py-3">
          <RepairTableSkeleton rows={6} />
        </div>
      </div>
    </main>
  );
}

export default function AllRepairsPage() {
  return (
    <Suspense fallback={<AllRepairsPageSkeleton />}>
      <AllRepairsPageInner />
    </Suspense>
  );
}
