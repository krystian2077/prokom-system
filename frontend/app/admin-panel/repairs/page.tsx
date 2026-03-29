"use client";

import { useMemo, useState } from "react";
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
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { QUICK_CHANGE_STATUS_OPTIONS, type RepairStatusValue } from "@/lib/repairStatusOptions";
import { AdminAssignRepairsModal } from "@/components/panel/modals/AdminAssignRepairsModal";

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
      [r.id, r.repair_number, r.client_name, r.device_name, r.status, r.status_display, assignee].map(csvEscape).join(","),
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
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const statusFilter = searchParams.get("status") ?? "all";
  const staffFilter = searchParams.get("staff") ?? "all";
  const claimsFilter = searchParams.get("claims") ?? "all";
  const slaOverdueFilter = searchParams.get("sla_overdue") === "true";

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
    if (slaOverdueFilter)
      list = list.filter((r) => Boolean((r as { sla_overdue?: boolean }).sla_overdue));

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

  const pageIds = pageRows.map((r) => String(r.id));
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedRepairIds.includes(id));

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
      <main className="mx-auto min-h-screen max-w-[1500px] px-5 py-8">
        <p className="text-sm text-[#fca5a5]">Tylko administrator.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1500px] px-5 py-8">
      <div className="flex flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink2)]">Panel administratora</p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--white)]">Lista napraw</h1>
            <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">
              Pełny widok warsztatu: filtry, przypisanie, zmiana statusu i eksport — bez utraty kontekstu administracyjnego.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void qc.invalidateQueries({ queryKey: ["repairs", "admin", "list"] })}
            className="rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
          >
            <span className="inline-flex items-center gap-2">
              <RotateCcw size={16} />
              Odśwież
            </span>
          </button>
        </header>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,.04)]">
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
                    background: selected ? "rgba(59,130,246,.14)" : "var(--row-hover)",
                    borderColor: selected ? "rgba(59,130,246,.45)" : "var(--border)",
                    color: selected ? "var(--white)" : "var(--ink2)",
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

          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--s2)]">
            <div className="grid grid-cols-[44px_110px_1fr_1fr_180px_68px] items-center gap-2 border-b border-[var(--border)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">
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
                  const id = String(r.id);
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
                            onClick={() => {
                              setAssignTargetIds([id]);
                              setAssignOpen(true);
                            }}
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

