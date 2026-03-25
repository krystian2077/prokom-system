"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, CheckSquare, ChevronLeft, ChevronRight, Download, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/store";
import type { RepairRequestListItem } from "@/types/repairs";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { RepairTableSkeleton } from "@/components/ui/Skeleton";

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

function isReady(item: RepairRequestListItem): boolean {
  return (item.status ?? "").toLowerCase() === "ready_for_pickup";
}

function isInProgress(item: RepairRequestListItem): boolean {
  return ["in_progress", "waiting_for_parts", "diagnosis", "waiting_for_quote_approval"].includes(
    (item.status ?? "").toLowerCase(),
  );
}

function isComplaint(item: RepairRequestListItem): boolean {
  return Boolean(item.complaint_warranty_status) || (item.auto_tags ?? []).includes("reklamacja");
}

export default function AdminRepairsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const { token, user } = useAuth();
  const {
    selectedRepairIds,
    toggleRepair,
    selectAll,
    clearSelection,
    openAssignModal,
    addToast,
  } = useStore();

  const isAdmin = user?.role === "admin";
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const statusFilter = searchParams.get("status") ?? "all";
  const staffFilter = searchParams.get("staff") ?? "all";
  const claimsFilter = searchParams.get("claims") ?? "all";

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

  const pills = useMemo(() => {
    const team = (staffQuery.data ?? []).slice(0, 3).map((s) => ({
      key: `staff:${s.id}`,
      label: s.full_name || `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || s.email || "Pracownik",
    }));
    return [
      { key: "all", label: "Wszystkie" },
      { key: "in_progress", label: "W naprawie" },
      { key: "waiting_for_parts", label: "Czeka na część" },
      { key: "ready", label: "Gotowe" },
      { key: "unassigned", label: "Nieprzypisane" },
      ...team,
      { key: "claims", label: "Reklamacje" },
    ];
  }, [staffQuery.data]);

  const filtered = useMemo(() => {
    let list = [...allItems];
    if (statusFilter === "in_progress") list = list.filter((r) => isInProgress(r));
    if (statusFilter === "waiting_for_parts") list = list.filter((r) => (r.status ?? "").toLowerCase() === "waiting_for_parts");
    if (statusFilter === "ready") list = list.filter((r) => isReady(r));
    if (statusFilter === "unassigned") list = list.filter((r) => !r.assigned_to);
    if (claimsFilter === "1") list = list.filter((r) => isComplaint(r));

    if (staffFilter !== "all") {
      list = list.filter((r) => getAssigneeId(r) === staffFilter);
    }
    return list;
  }, [allItems, statusFilter, staffFilter, claimsFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const setQuery = (next: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === null || String(v) === "" || String(v) === "all") params.delete(k);
      else params.set(k, String(v));
    });
    router.push(`/admin-panel/repairs?${params.toString()}`);
  };

  const pageIds = pageRows.map((r) => Number(r.id)).filter((n) => Number.isFinite(n));
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedRepairIds.includes(id));

  if (!isAdmin) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
        <p className="text-sm text-[#fca5a5]">Tylko administrator.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-8">
      <div className="flex flex-col gap-4">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Panel Admina</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Lista napraw</h1>
          </div>
          <button
            type="button"
            onClick={() => void qc.invalidateQueries({ queryKey: ["repairs", "admin", "list"] })}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
          >
            <span className="inline-flex items-center gap-2">
              <RotateCcw size={16} />
              Odśwież
            </span>
          </button>
        </header>

        <div className="rounded-3xl border border-white/10 bg-[#0f1117] p-4">
          <div className="flex flex-wrap items-center gap-2">
            {pills.map((pill) => {
              const isStaffPill = pill.key.startsWith("staff:");
              const selected =
                (pill.key === "all" && statusFilter === "all" && staffFilter === "all" && claimsFilter === "all") ||
                (pill.key === statusFilter && !isStaffPill) ||
                (pill.key === "claims" && claimsFilter === "1") ||
                (isStaffPill && staffFilter === pill.key.replace("staff:", ""));
              return (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => {
                    if (pill.key.startsWith("staff:")) {
                      setQuery({ staff: pill.key.replace("staff:", ""), page: 1, claims: claimsFilter, status: statusFilter });
                      return;
                    }
                    if (pill.key === "claims") {
                      setQuery({ claims: "1", page: 1 });
                      return;
                    }
                    setQuery({ status: pill.key, page: 1, staff: staffFilter, claims: claimsFilter === "1" && pill.key !== "all" ? 1 : undefined });
                  }}
                  className="rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition"
                  style={{
                    background: selected ? "rgba(59,130,246,.14)" : "rgba(255,255,255,.05)",
                    borderColor: selected ? "rgba(59,130,246,.45)" : "rgba(255,255,255,.12)",
                    color: selected ? "#fff" : "#9ca3af",
                  }}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {selectedRepairIds.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
                className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#3b82f6]/40 bg-gradient-to-r from-[#3b82f6]/15 to-[#2563eb]/10 px-4 py-3 shadow-[0_8px_24px_rgba(59,130,246,.2)]"
              >
                <div className="text-sm font-semibold text-[#dbeafe]">Zaznaczono: {selectedRepairIds.length} napraw</div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      openAssignModal(selectedRepairIds[0]);
                      addToast("Tryb bulk: otwarto przypisanie dla pierwszej naprawy.", "info");
                    }}
                    className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
                  >
                    Przypisz
                  </button>
                  <button
                    type="button"
                    onClick={() => addToast("Bulk zmiana statusu będzie dodana w kolejnym etapie.", "info")}
                    className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
                  >
                    Zmień status
                  </button>
                  <button
                    type="button"
                    onClick={() => addToast("Eksport CSV będzie dodany w kolejnym etapie.", "info")}
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

          <div className="mt-4 rounded-2xl border border-white/10 bg-[#0c0d12]">
            <div className="grid grid-cols-[44px_110px_1fr_1fr_180px_68px] items-center gap-2 border-b border-white/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
              <button
                type="button"
                onClick={() => (allPageSelected ? clearSelection() : selectAll(pageIds))}
                className="inline-flex h-6 w-6 items-center justify-center rounded border border-white/20 bg-white/5 text-white"
                title="Zaznacz wszystkie na stronie"
              >
                {allPageSelected ? <CheckSquare size={14} /> : "□"}
              </button>
              <div>Nr ref</div>
              <div>Urządzenie / klient</div>
              <div>Przypisany</div>
              <div>Status</div>
              <div>Akcja</div>
            </div>

            {repairsQuery.isLoading ? (
              <div className="p-4">
                <RepairTableSkeleton rows={8} />
              </div>
            ) : repairsQuery.error ? (
              <ErrorState error={repairsQuery.error instanceof Error ? repairsQuery.error : null} onRetry={() => void repairsQuery.refetch()} />
            ) : pageRows.length === 0 ? (
              <EmptyState icon={EMPTY_STATES.search.icon} title="Brak napraw dla wybranych filtrów" description="Zmień filtr statusu lub pracownika i spróbuj ponownie." />
            ) : (
              <div className="px-4 py-2">
                {pageRows.map((r) => {
                  const id = Number(r.id);
                  const selected = selectedRepairIds.includes(id);
                  return (
                    <div
                      key={r.id}
                      className="group mb-2 rounded-2xl border px-4 py-3 transition"
                      style={{
                        background: selected ? "rgba(59,130,246,.07)" : "rgba(255,255,255,.01)",
                        borderColor: selected ? "rgba(59,130,246,.38)" : "rgba(255,255,255,.08)",
                        borderLeft: selected ? "2px solid #3b82f6" : "2px solid transparent",
                      }}
                    >
                      <div className="grid grid-cols-[44px_110px_1fr_1fr_180px_68px] items-center gap-2">
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
                        <Link href={`/admin-panel/repairs/${r.id}`} className="font-mono text-sm font-semibold text-[#d1d5db] hover:text-white">
                          {r.repair_number}
                        </Link>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-white">{r.device_name}</div>
                          <div className="truncate text-xs text-[#9ca3af]">{r.client_name}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm text-white">{getAssigneeName(r)}</div>
                          <button
                            type="button"
                            onClick={() => openAssignModal(id)}
                            className="mt-1 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af] hover:bg-white/10 hover:text-white"
                          >
                            <ArrowRightLeft size={12} />
                            Przepisz
                          </button>
                        </div>
                        <div>
                          <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-[#cbd5e1]">
                            {r.status_display}
                          </span>
                        </div>
                        <div className="text-right">
                          <Link href={`/admin-panel/repairs/${r.id}`} className="text-xs font-semibold text-[#9ca3af] hover:text-white">
                            Otwórz
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!repairsQuery.isLoading && pageRows.length > 0 ? (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <p className="text-sm text-[#9ca3af]">
                  Strona <span className="font-semibold text-white">{safePage}</span> / {pageCount}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuery({ page: Math.max(1, safePage - 1), status: statusFilter, staff: staffFilter, claims: claimsFilter })}
                    disabled={safePage <= 1}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white disabled:opacity-60"
                  >
                    <span className="inline-flex items-center gap-2">
                      <ChevronLeft size={16} />
                      Prev
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuery({ page: Math.min(pageCount, safePage + 1), status: statusFilter, staff: staffFilter, claims: claimsFilter })}
                    disabled={safePage >= pageCount}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white disabled:opacity-60"
                  >
                    <span className="inline-flex items-center gap-2">
                      Next
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

