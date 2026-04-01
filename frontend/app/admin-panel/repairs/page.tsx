"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowRightLeft,
  ArrowUp,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/store";
import type { RepairRequestListItem } from "@/types/repairs";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { RepairTableSkeleton } from "@/components/ui/Skeleton";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { QUICK_CHANGE_STATUS_OPTIONS, type RepairStatusValue } from "@/lib/repairStatusOptions";
import { AdminAssignRepairsModal } from "@/components/panel/modals/AdminAssignRepairsModal";
import {
  compareRepairListByAcceptanceDate,
  compareRepairListByRepairNumber,
  deadlineSummary,
  isArchivedFinalStatus,
  matchesInRepairPillFilter,
  matchesNewRepairPhaseFilter,
  matchesReadyForPickupPillFilter,
  nextAction,
  nextActionBadgeStyle,
  priorityRank,
  repairListAcceptanceDateLabel,
  repairListCostLabel,
  repairListMatchesSearch,
  statusBadge,
} from "@/lib/repairListDisplay";

const PAGE_SIZE = 20;

type StaffMember = {
  id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
};

type PaginatedRepairs = {
  count?: number;
  results?: RepairRequestListItem[];
};

type RepairsPillKey = "all" | "new" | "in_progress" | "parts_waiting" | "ready" | "unassigned";

const REPAIRS_PILL_KEYS: RepairsPillKey[] = ["all", "new", "in_progress", "parts_waiting", "ready", "unassigned"];
const nonArchivedStatus = (status: string) => !isArchivedFinalStatus(status);

function getAssigneeId(item: RepairRequestListItem): string | null {
  if (!item.assigned_to) return null;
  if (typeof item.assigned_to === "string") return item.assigned_to;
  return item.assigned_to.id ?? null;
}

function getAssigneeName(item: RepairRequestListItem): string {
  if (!item.assigned_to) return "Nieprzypisane";
  if (typeof item.assigned_to === "string") return item.assigned_to;
  const full = `${item.assigned_to.first_name ?? ""} ${item.assigned_to.last_name ?? ""}`.trim();
  return full || item.assigned_to.email || "Przypisany";
}

function derivePillFilter(item: RepairRequestListItem, pill: RepairsPillKey) {
  const s = (item.status ?? "").toLowerCase();
  if (pill === "all") return nonArchivedStatus(item.status);
  if (!nonArchivedStatus(item.status)) return false;
  if (pill === "unassigned") return !item.assigned_to;
  if (pill === "ready") return matchesReadyForPickupPillFilter(item.status);
  if (pill === "parts_waiting") return s === "waiting_for_parts";
  if (pill === "new") return matchesNewRepairPhaseFilter(item.status);
  if (pill === "in_progress") return matchesInRepairPillFilter(item.status);
  return false;
}

function adminRepairMatchesSearch(item: RepairRequestListItem, query: string): boolean {
  if (repairListMatchesSearch(item, query)) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const tokens = q.split(/\s+/).filter(Boolean);
  const assignee = getAssigneeName(item).toLowerCase();
  return tokens.every((t) => assignee.includes(t));
}

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v).replace(/"/g, '""');
  return `"${s}"`;
}

function downloadRepairsCsv(rows: RepairRequestListItem[], filename: string) {
  const headers = ["id", "repair_number", "client_name", "device_name", "status", "status_display", "assignee"];
  const lines = [headers.join(",")];
  for (const r of rows) {
    const assignee = getAssigneeName(r);
    lines.push(
      [r.id, r.repair_number, r.client_name, r.device_name, r.status, r.status_display, assignee]
        .map(csvEscape)
        .join(","),
    );
  }
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminRepairsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const { token, user } = useAuth();
  const { confirm } = useConfirm();
  const { selectedRepairIds, toggleRepair, selectAll, clearSelection, addToast } = useStore();

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTargetIds, setAssignTargetIds] = useState<string[]>([]);

  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [bulkNewStatus, setBulkNewStatus] = useState<RepairStatusValue>("in_repair");
  const [bulkStatusSaving, setBulkStatusSaving] = useState(false);

  const isAdmin = user?.role === "admin";

  const rawStatus = searchParams.get("status");
  const pill: RepairsPillKey =
    rawStatus && REPAIRS_PILL_KEYS.includes(rawStatus as RepairsPillKey) ? (rawStatus as RepairsPillKey) : "all";
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const acceptanceSort = searchParams.get("acceptance_sort");
  const refSort = searchParams.get("ref_sort");
  const staffFilter = searchParams.get("staff") ?? "all";
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
      router.push(`/admin-panel/repairs?${params.toString()}`);
    }, 350);
    return () => window.clearTimeout(id);
  }, [searchDraft, searchParams, router]);

  const setQuery = (next: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === null || String(v).length === 0 || String(v) === "all") params.delete(k);
      else params.set(k, String(v));
    });
    router.push(`/admin-panel/repairs?${params.toString()}`);
  };

  const repairsQuery = useQuery({
    queryKey: ["repairs", "admin", "list"],
    enabled: Boolean(token && isAdmin),
    queryFn: async () => {
      const res = await api.get<PaginatedRepairs | RepairRequestListItem[]>("/repairs/?page_size=500", token);
      if (Array.isArray(res)) return res;
      return res?.results ?? [];
    },
  });

  const staffQuery = useQuery({
    queryKey: ["staff", "admin", "list"],
    enabled: Boolean(token && isAdmin),
    queryFn: async () => {
      const res = await api.get<StaffMember[] | { results?: StaffMember[] }>("/accounts/staff/", token);
      return Array.isArray(res) ? res : res?.results ?? [];
    },
  });

  const allItems = repairsQuery.data ?? [];

  const staffAssignOptions = useMemo(
    () =>
      (staffQuery.data ?? []).map((s) => ({
        id: s.id,
        label: s.full_name || `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || s.email || "Pracownik",
      })),
    [staffQuery.data],
  );

  const pills: Array<{ key: RepairsPillKey; label: string; tone: "red" | "amber" | "gray" | "green" | "blue" | "slate" }> = [
    { key: "all", label: "Wszystkie", tone: "gray" },
    { key: "new", label: "Nowe", tone: "blue" },
    { key: "in_progress", label: "W naprawie", tone: "red" },
    { key: "parts_waiting", label: "Czeka na część", tone: "amber" },
    { key: "ready", label: "Do odbioru", tone: "green" },
    { key: "unassigned", label: "Nieprzypisane", tone: "slate" },
  ];

  const counts = useMemo(() => {
    const base = allItems.filter((i) => nonArchivedStatus(i.status));
    const out: Record<RepairsPillKey, number> = {
      all: 0,
      new: 0,
      in_progress: 0,
      parts_waiting: 0,
      ready: 0,
      unassigned: 0,
    };
    out.all = base.length;
    for (const p of pills) {
      out[p.key] = base.filter((i) => derivePillFilter(i, p.key)).length;
    }
    return out;
  }, [allItems]);

  const filtered = useMemo(() => {
    const list = allItems.filter((i) => {
      if (!derivePillFilter(i, pill)) return false;
      if (staffFilter !== "all" && getAssigneeId(i) !== staffFilter) return false;
      return adminRepairMatchesSearch(i, searchDraft);
    });
    const sorted = [...list];

    sorted.sort((a, b) => {
      if (refSort === "newest") return compareRepairListByRepairNumber(a, b, true);
      if (refSort === "oldest") return compareRepairListByRepairNumber(a, b, false);
      if (acceptanceSort === "newest") return compareRepairListByAcceptanceDate(a, b, true);
      if (acceptanceSort === "oldest") return compareRepairListByAcceptanceDate(a, b, false);
      return priorityRank(a.priority) - priorityRank(b.priority);
    });

    return sorted;
  }, [allItems, pill, staffFilter, searchDraft, refSort, acceptanceSort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const pageIds = pageRows.map((r) => String(r.id));
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedRepairIds.includes(id));

  const cycleAcceptanceSort = () => {
    const next = acceptanceSort === "newest" ? "oldest" : "newest";
    setQuery({ acceptance_sort: next, ref_sort: undefined, page: 1 });
  };

  const cycleRefSort = () => {
    const next = refSort === "newest" ? "oldest" : "newest";
    setQuery({ ref_sort: next, acceptance_sort: undefined, page: 1 });
  };

  const exportSelectedCsv = () => {
    const rows = allItems.filter((r) => selectedRepairIds.includes(String(r.id)));
    if (rows.length === 0) {
      addToast("Najpierw zaznacz naprawy w tabeli.", "info");
      return;
    }
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadRepairsCsv(rows, `prokom-naprawy-${stamp}.csv`);
    addToast(`✓ Wyeksportowano ${rows.length} wierszy`, "success");
  };

  const applyBulkStatus = async () => {
    if (!token || selectedRepairIds.length === 0) return;
    if (bulkNewStatus === "delivered") {
      const ok = await confirm({
        title: "Oznaczyć jako wydane?",
        description: `Status „Dostarczone” zostanie ustawiony dla ${selectedRepairIds.length} napraw. Ta operacja jest trudna do cofnięcia.`,
        confirmLabel: "Tak, wydano",
        variant: "danger",
      });
      if (!ok) return;
    }
    setBulkStatusSaving(true);
    let okCount = 0;
    let failCount = 0;
    for (const id of selectedRepairIds) {
      try {
        await api.post(
          `/repairs/${id}/change-status/`,
          { new_status: bulkNewStatus, notes: "Zmiana zbiorcza (panel admin)" },
          token,
        );
        okCount++;
      } catch {
        failCount++;
      }
    }
    setBulkStatusSaving(false);
    setBulkStatusOpen(false);
    clearSelection();
    void qc.invalidateQueries({ queryKey: ["repairs", "admin", "list"] });
    if (failCount === 0) {
      addToast(`✓ Zaktualizowano status (${okCount} napraw)`, "success");
    } else {
      addToast(`Częściowy sukces: ${okCount} ok, ${failCount} błędów`, "error");
    }
  };

  if (!isAdmin) {
    return (
      <main className="mx-auto min-h-screen max-w-[2100px] px-5 py-8">
        <p className="text-sm text-[#fca5a5]">Tylko administrator.</p>
      </main>
    );
  }

  const tableGridClass =
    "grid min-w-[2060px] grid-cols-[44px_minmax(168px,1fr)_minmax(240px,1.35fr)_minmax(148px,1fr)_minmax(132px,1fr)_minmax(190px,1.1fr)_minmax(170px,1fr)_minmax(180px,1fr)_minmax(220px,1.25fr)] gap-x-3 gap-y-2";

  return (
    <main className="mx-auto min-h-screen max-w-[2100px] px-4 py-8">
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink2)]">Panel administratora</p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--white)]">Lista napraw</h1>
            <p className="mt-1 text-sm text-[#d1d5db]">
              Widok serwisu ·{" "}
              <span className="font-semibold text-[var(--white)]">{allItems.filter((i) => nonArchivedStatus(i.status)).length}</span> aktywnych
              <span className="mt-1 block text-xs font-normal text-[var(--ink2)]">
                Filtry i tabela są spójne z widokiem pracownika „Moje naprawy”.
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void qc.invalidateQueries({ queryKey: ["repairs", "admin", "list"] })}
              className="rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[#d1d5db] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
            >
              <span className="inline-flex items-center gap-2">
                <RotateCcw size={16} />
                Odśwież
              </span>
            </button>
            <Link href="/admin-panel/intake" className="rounded-2xl bg-[#dc1e1e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b81818]">
              Nowe przyjęcie
            </Link>
          </div>
        </header>

        <div className="worker-card-shimmer rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
          <AnimatePresence>
            {selectedRepairIds.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
                className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#3b82f6]/40 bg-gradient-to-r from-[#3b82f6]/15 to-[#2563eb]/10 px-4 py-3 shadow-[0_8px_24px_rgba(59,130,246,.2)]"
              >
                <div className="text-sm font-semibold text-[#dbeafe]">Zaznaczono: {selectedRepairIds.length} napraw</div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAssignTargetIds([...selectedRepairIds]);
                      setAssignOpen(true);
                    }}
                    className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
                  >
                    Przypisz
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkStatusOpen(true)}
                    className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
                  >
                    Zmień status
                  </button>
                  <button
                    type="button"
                    onClick={exportSelectedCsv}
                    className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Download size={14} />
                      Eksportuj CSV
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#9ca3af] hover:bg-white/10 hover:text-white"
                  >
                    ✕ Anuluj
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

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
                          : p.tone === "slate"
                            ? { bg: "rgba(148,163,184,.16)", border: "rgba(148,163,184,.35)", text: "#cbd5e1" }
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
              <label className="sr-only" htmlFor="admin-repairs-search">
                Szukaj na liście
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
                  aria-hidden
                />
                <input
                  id="admin-repairs-search"
                  type="search"
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                  placeholder="Nr ref, data przyjęcia, klient, urządzenie, przypisany…"
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

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between lg:hidden">
            <div className="flex flex-wrap items-center gap-2">
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
            <div>
              <label className="mr-2 text-xs text-[var(--ink2)]" htmlFor="admin-staff-filter-mobile">Przypisany:</label>
              <select
                id="admin-staff-filter-mobile"
                value={staffFilter}
                onChange={(e) => setQuery({ staff: e.target.value, page: 1 })}
                className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-xs text-white"
              >
                <option value="all">Wszyscy</option>
                {staffAssignOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-[#2a3142]/80 bg-[#08090d] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div
              className={
                tableGridClass +
                " items-stretch border-b border-[#2d3548] bg-gradient-to-b from-[#151821] to-[#0d0f14] px-4 py-4 text-[11px] font-bold uppercase leading-tight tracking-[0.18em] text-[#8b9cbb] sm:text-xs"
              }
            >
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => (allPageSelected ? clearSelection() : selectAll(pageIds))}
                  className="inline-flex h-6 w-6 items-center justify-center rounded border border-white/20 bg-white/5 text-white"
                  title="Zaznacz wszystkie na stronie"
                >
                  {allPageSelected ? <CheckSquare size={14} /> : "□"}
                </button>
              </div>

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
              <div className="flex items-end justify-center pb-1 text-[#c7d2eb]">Koszt naprawy</div>
              <div className="hidden items-end justify-center pb-1 text-[#c7d2eb] lg:flex">
                <label className="mr-2" htmlFor="admin-staff-filter-desktop">Przypisany</label>
                <select
                  id="admin-staff-filter-desktop"
                  value={staffFilter}
                  onChange={(e) => setQuery({ staff: e.target.value, page: 1 })}
                  className="rounded-lg border border-white/10 bg-[#0f1422] px-2 py-1 text-[11px] font-semibold normal-case tracking-normal text-white"
                >
                  <option value="all">Wszyscy</option>
                  {staffAssignOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end justify-center pb-1 text-[#c7d2eb]">Akcja</div>
            </div>

            {repairsQuery.isLoading ? (
              <div className="p-4">
                <RepairTableSkeleton rows={8} />
              </div>
            ) : repairsQuery.error ? (
              <ErrorState
                error={repairsQuery.error}
                onRetry={() => void repairsQuery.refetch()}
                title="Nie udało się pobrać listy napraw"
              />
            ) : allItems.length === 0 ? (
              <EmptyState
                icon={EMPTY_STATES.myRepairs.icon}
                title="Brak napraw w systemie"
                description="Po utworzeniu pierwszego zlecenia pojawi się ono tutaj."
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={EMPTY_STATES.search.icon}
                title={searchDraft.trim() ? "Brak wyników wyszukiwania" : "Brak wyników dla wybranego filtra"}
                description={
                  searchDraft.trim()
                    ? "Spróbuj innej frazy lub wyczyść pole szukania."
                    : "Zmień zakładkę statusu lub filtr przypisania."
                }
              />
            ) : (
              <div className="divide-y divide-[#1e2433] px-2 py-1">
                {pageRows.map((r, idx) => {
                  const id = String(r.id);
                  const selected = selectedRepairIds.includes(id);
                  const sb = statusBadge(r);
                  const action = nextAction(r);
                  const actionStyle = nextActionBadgeStyle(action.tone);
                  const overdue = deadlineSummary(r).isOverdue;
                  const costLabel = repairListCostLabel(r);
                  const acceptedAtLabel = repairListAcceptanceDateLabel(r);
                  const assignee = getAssigneeName(r);

                  return (
                    <div
                      key={r.id}
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
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-base font-semibold text-[var(--white)]">{r.device_name}</div>
                            <div
                              className="mt-0.5 font-mono text-xs font-semibold leading-snug [overflow-wrap:anywhere]"
                              style={{ color: overdue ? "#ff6b6b" : "#d1d5db" }}
                            >
                              {r.repair_number}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleRepair(id)}
                            className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border text-xs transition ${
                              selected
                                ? "border-[#3b82f6] bg-[#3b82f6]/20 text-white"
                                : "border-white/15 bg-white/5 text-[#9ca3af]"
                            }`}
                            title="Zaznacz naprawę"
                          >
                            {selected ? "✓" : "□"}
                          </button>
                        </div>

                        <div className="mb-3 inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold leading-tight" style={{ background: actionStyle.bg, borderColor: actionStyle.border, color: actionStyle.text }}>
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
                              <span className="inline-flex max-w-full items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium leading-none" style={{ background: sb.bg, borderColor: sb.border, color: sb.text }}>
                                {sb.label}
                              </span>
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3 border-b border-[var(--border)] pb-2 text-xs">
                            <dt className="text-[var(--ink2)]">Koszt naprawy</dt>
                            <dd className="min-w-0 text-right font-medium tabular-nums text-[#e5e7eb]">{costLabel ?? "—"}</dd>
                          </div>
                          <div className="flex justify-between gap-3 border-b border-[var(--border)] pb-2 text-xs">
                            <dt className="text-[var(--ink2)]">Przypisany</dt>
                            <dd className="min-w-0 text-right text-[#e5e7eb]">{assignee}</dd>
                          </div>
                        </dl>

                        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAssignTargetIds([id]);
                              setAssignOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#cbd5e1] hover:bg-white/10 hover:text-white"
                          >
                            <ArrowRightLeft size={12} />
                            Przypisz do innego serwisanta
                          </button>
                          <Link href={`/admin-panel/repairs/${r.id}`} className="rounded-full border border-[#3b82f6]/40 bg-[#3b82f6]/10 px-3 py-1.5 text-xs font-semibold text-[#bfdbfe] hover:bg-[#3b82f6]/20">
                            Otwórz
                          </Link>
                        </div>
                      </div>

                      <div className={"hidden lg:grid " + tableGridClass + " items-center"}>
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => toggleRepair(id)}
                            className={`inline-flex h-6 w-6 items-center justify-center rounded border text-xs transition ${
                              selected
                                ? "border-[#3b82f6] bg-[#3b82f6]/20 text-white"
                                : "border-white/15 bg-white/5 text-[#9ca3af] group-hover:opacity-100"
                            } ${selected ? "opacity-100" : "opacity-0"}`}
                            title="Zaznacz naprawę"
                          >
                            {selected ? "✓" : "□"}
                          </button>
                        </div>

                        <div className="min-w-0 max-w-full px-1 text-center">
                          <span
                            className="inline-block font-mono text-sm font-semibold leading-snug tracking-tight text-[#dbeafe] [overflow-wrap:anywhere]"
                            title={r.repair_number}
                            style={{ color: overdue ? "#fb923c" : undefined }}
                          >
                            {r.repair_number}
                          </span>
                        </div>

                        <div className="min-w-0 text-center">
                          <div className="truncate text-base font-semibold tracking-tight text-[var(--white)]">{r.device_name}</div>
                          <div className="mt-2 flex justify-center">
                            <span className="inline-flex max-w-full items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold leading-tight shadow-sm" style={{ background: actionStyle.bg, borderColor: actionStyle.border, color: actionStyle.text }}>
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
                          <span className="inline-flex max-w-full shrink-0 items-center whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-medium leading-snug shadow-sm" style={{ background: sb.bg, borderColor: sb.border, color: sb.text }}>
                            {sb.label}
                          </span>
                        </div>

                        <div className="text-center">
                          <span className="inline-block text-[15px] font-semibold tabular-nums tracking-tight text-[#f0d9a8]" title={costLabel ?? undefined}>
                            {costLabel ?? "—"}
                          </span>
                        </div>

                        <div className="text-center">
                          <span className="inline-block max-w-full truncate text-[14px] font-medium tracking-tight text-[#c5d4f0]" title={assignee}>
                            {assignee}
                          </span>
                        </div>

                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAssignTargetIds([id]);
                              setAssignOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#cbd5e1] hover:bg-white/10 hover:text-white"
                          >
                            <ArrowRightLeft size={12} />
                            Przypisz
                          </button>
                          <Link href={`/admin-panel/repairs/${r.id}`} className="rounded-full border border-[#3b82f6]/40 bg-[#3b82f6]/10 px-3 py-1.5 text-xs font-semibold text-[#bfdbfe] hover:bg-[#3b82f6]/20">
                            Otwórz
                          </Link>
                        </div>
                      </div>
                    </div>
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

      {bulkStatusOpen ? (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
          role="dialog"
          aria-modal
          aria-labelledby="bulk-status-title"
        >
          <div className="w-full max-w-md rounded-[18px] border border-white/15 bg-[#0f1117] p-5 shadow-[0_20px_60px_rgba(0,0,0,.55)]">
            <h2 id="bulk-status-title" className="text-lg font-semibold text-white">
              Zmiana statusu ({selectedRepairIds.length} napraw)
            </h2>
            <p className="mt-1 text-sm text-[#9ca3af]">Wybierz status publiczny. Backend zaktualizuje każdą naprawę osobno.</p>
            <label className="mt-4 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">Nowy status</label>
            <select
              value={bulkNewStatus}
              onChange={(e) => setBulkNewStatus(e.target.value as RepairStatusValue)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-2.5 text-sm text-white outline-none focus:border-[#3b82f6]"
            >
              {QUICK_CHANGE_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBulkStatusOpen(false)}
                disabled={bulkStatusSaving}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={() => void applyBulkStatus()}
                disabled={bulkStatusSaving}
                className="rounded-xl border border-[#3b82f6]/40 bg-[#3b82f6]/20 px-4 py-2 text-sm font-semibold text-white hover:bg-[#3b82f6]/30 disabled:opacity-50"
              >
                {bulkStatusSaving ? "Zapisywanie…" : "Zastosuj"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AdminAssignRepairsModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        repairIds={assignTargetIds}
        staff={staffAssignOptions}
        token={token}
        onSuccess={({ ok, failed }) => {
          clearSelection();
          void qc.invalidateQueries({ queryKey: ["repairs", "admin", "list"] });
          if (failed === 0) {
            addToast(`✓ Przypisano ${ok} ${ok === 1 ? "naprawę" : "napraw"}`, "success");
          } else {
            addToast(`Przypisano ${ok}, błędów: ${failed}`, "error");
          }
        }}
      />
    </main>
  );
}

