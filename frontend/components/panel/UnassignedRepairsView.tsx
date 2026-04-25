"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, authApi, ApiError, getErrorMessageFromBody } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { RepairRequestListItem } from "@/types/repairs";
import { useWorkerStore } from "@/stores/workerStore";
import { Check, ChevronDown, Info, RotateCcw, Search, Sparkles, Users2, X } from "lucide-react";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { RepairTableSkeleton } from "@/components/ui/Skeleton";

const PAGE_SIZE = 20;

type DeviceBucket = "phone_tablet" | "laptop_printer" | "general";

function deviceBucket(deviceName: string): DeviceBucket {
  const n = (deviceName ?? "").toLowerCase();
  const phoneKeywords = [
    "iphone",
    "ipad",
    "ipod",
    "pixel",
    "galaxy s",
    "galaxy a",
    "galaxy note",
    "galaxy z",
    "oneplus",
    "xiaomi",
    "oppo",
    "realme",
    "huawei",
    "telefon",
    "smartfon",
    "tablet",
    "watch",
    "zegarek",
    "apple watch",
  ];
  const laptopKeywords = [
    "macbook",
    "laptop",
    "notebook",
    "dell",
    "hp ",
    "lenovo",
    "asus",
    "acer",
    "msi",
    "komputer",
    "komputer stacjonarny",
    "pc ",
    "playstation",
    "xbox",
    "nintendo",
    "drukark",
    "printer",
    "imac",
  ];
  if (phoneKeywords.some((k) => n.includes(k))) return "phone_tablet";
  if (laptopKeywords.some((k) => n.includes(k))) return "laptop_printer";
  return "general";
}

function categoryLabel(bucket: DeviceBucket): string {
  switch (bucket) {
    case "phone_tablet":
      return "Telefon / tablet";
    case "laptop_printer":
      return "Laptop / druk";
    default:
      return "Inne / ogólne";
  }
}

function suggestedTeamLabel(bucket: DeviceBucket): string {
  switch (bucket) {
    case "phone_tablet":
      return "Telefony, tablety";
    case "laptop_printer":
      return "Laptopy, drukarki";
    default:
      return "Ogólne";
  }
}

/** Wyświetlane w kolumnie „Sugerowany” — dopasowanie do kategorii urządzenia. */
function suggestedTechnicianName(bucket: DeviceBucket): string {
  switch (bucket) {
    case "phone_tablet":
      return "Kuba";
    case "laptop_printer":
      return "Rafał";
    default:
      return "—";
  }
}

type WaitLevel = 0 | 1 | 2 | 3;

function waitingMeta(createdAt: string): { level: WaitLevel; label: string; suffix: string } {
  const t0 = new Date(createdAt).getTime();
  const hours = (Date.now() - t0) / (3600 * 1000);
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const label = h > 0 ? `${h}h ${m}min` : `${Math.max(0, m)} min`;

  if (hours < 3) return { level: 0, label, suffix: "" };
  if (hours < 12) return { level: 1, label, suffix: "" };
  if (hours < 24) return { level: 2, label, suffix: " ⚠" };
  return { level: 3, label, suffix: " ⚠⚠" };
}

function waitStyle(level: WaitLevel) {
  if (level === 0) return { color: "#fbbf24", bg: "rgba(251,191,36,.12)" };
  if (level === 1) return { color: "#fb923c", bg: "rgba(251,146,60,.14)" };
  if (level === 2) return { color: "#f97316", bg: "rgba(249,115,22,.16)" };
  return { color: "#ef4444", bg: "rgba(239,68,68,.16)" };
}

function matchesSpecialization(specialization: string | null | undefined, bucket: DeviceBucket): boolean {
  if (!specialization) return false;
  if (specialization === "general") return true;
  if (specialization === "phone_tablet") return bucket === "phone_tablet";
  if (specialization === "laptop_printer") return bucket === "laptop_printer";
  return false;
}

/** Kolejność imion w menu „Przypisz do kogoś innego” (zgodnie z ustaleniem w serwisie). */
const ASSIGN_PICKER_ORDER = ["Rafał", "Krystian", "Paweł"];

type AssignableStaff = {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  picker_label: string;
  role?: "staff" | "admin" | string;
  active_repairs_count?: number;
  specialization?: string | null;
};

type AdminAssignTarget = {
  id: string;
  repair_number: string;
  device_name: string;
  client_name: string;
  problem_description: string;
  created_at: string;
  device_category: string;
};

function sortAssignableForPicker(rows: AssignableStaff[]): AssignableStaff[] {
  const rank = (label: string): number => {
    const word = label.trim().split(/\s+/)[0] ?? "";
    const i = ASSIGN_PICKER_ORDER.indexOf(word);
    if (i >= 0) return i;
    return 100;
  };
  return [...rows].sort((a, b) => {
    const ra = rank(a.picker_label);
    const rb = rank(b.picker_label);
    if (ra !== rb) return ra - rb;
    return a.picker_label.localeCompare(b.picker_label, "pl");
  });
}

function AssignRepairActions({
  busy,
  assignableSorted,
  assignableLoading,
  allowAssignMe = true,
  assignOtherLabel = "Przypisz do kogoś innego",
  emptyOtherLabel = "Brak dostępnych osób",
  onAssignMe,
  onAssignUser,
  size = "compact",
  children,
}: {
  busy: boolean;
  assignableSorted: AssignableStaff[];
  assignableLoading: boolean;
  allowAssignMe?: boolean;
  assignOtherLabel?: string;
  emptyOtherLabel?: string;
  onAssignMe?: () => void;
  onAssignUser: (a: AssignableStaff) => void;
  size?: "compact" | "comfortable";
  children?: ReactNode;
}) {
  const hasOthers = assignableSorted.length > 0;
  const preferUpwardDropdown = size === "compact";
  const primaryClass =
    size === "comfortable"
      ? "rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--white)] transition hover:bg-[#2563eb] disabled:opacity-60"
      : "rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--white)] transition hover:bg-[#2563eb] disabled:opacity-60";
  const secondaryClass =
    !allowAssignMe
      ? size === "comfortable"
        ? "flex cursor-pointer list-none items-center gap-1 rounded-xl border border-[#60a5fa]/70 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_26px_-14px_rgba(59,130,246,.95)] transition hover:from-[#3b82f6] hover:to-[#2563eb] hover:shadow-[0_12px_28px_-12px_rgba(59,130,246,.95)] [&::-webkit-details-marker]:hidden"
        : "flex cursor-pointer list-none items-center gap-1 rounded-lg border border-[#60a5fa]/70 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_10px_26px_-14px_rgba(59,130,246,.95)] transition hover:from-[#3b82f6] hover:to-[#2563eb] hover:shadow-[0_12px_28px_-12px_rgba(59,130,246,.95)] [&::-webkit-details-marker]:hidden"
      : size === "comfortable"
        ? "flex cursor-pointer list-none items-center gap-1 rounded-xl border border-white/15 bg-[var(--row-hover)] px-4 py-2.5 text-sm font-semibold text-[#e5e7eb] transition hover:bg-[var(--row-active)] [&::-webkit-details-marker]:hidden"
        : "flex cursor-pointer list-none items-center gap-1 rounded-lg border border-white/15 bg-[var(--row-hover)] px-3 py-1.5 text-xs font-semibold text-[#e5e7eb] transition hover:bg-[var(--row-active)] [&::-webkit-details-marker]:hidden";

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {allowAssignMe ? (
        <button
          type="button"
          disabled={busy}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAssignMe?.();
          }}
          className={`bg-[#3b82f6] ${primaryClass}`}
        >
          {busy ? (size === "comfortable" ? "Przypisywanie…" : "…") : "Przypisz do mnie"}
        </button>
      ) : null}
      {hasOthers ? (
        <details className="group relative z-20">
          <summary className={secondaryClass} onClick={(e) => e.stopPropagation()}>
            {assignOtherLabel}
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70 transition group-open:rotate-180" aria-hidden />
          </summary>
          <ul
            className={`absolute right-0 z-50 min-w-[12rem] rounded-lg border border-[var(--border)] bg-[#1a1d26] py-1 shadow-xl ${
              preferUpwardDropdown ? "bottom-full mb-1" : "top-full mt-1"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {assignableLoading ? (
              <li className="px-3 py-2 text-xs text-[var(--ink2)]">Ładowanie…</li>
            ) : (
              assignableSorted.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    disabled={busy}
                    className="w-full px-3 py-2 text-left text-xs font-medium text-[#e5e7eb] transition hover:bg-[var(--row-active)] disabled:opacity-50"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onAssignUser(u);
                      const det = e.currentTarget.closest("details") as HTMLDetailsElement | null;
                      if (det) det.open = false;
                    }}
                  >
                    {u.picker_label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </details>
      ) : !allowAssignMe ? (
        <span className="rounded-lg border border-white/15 bg-[var(--row-hover)] px-3 py-1.5 text-xs font-semibold text-[var(--ink2)]">
          {emptyOtherLabel}
        </span>
      ) : null}
      {children}
    </div>
  );
}

function AdminAssignWorkerModal({
  open,
  repair,
  staff,
  search,
  selectedId,
  submitting,
  onSearchChange,
  onSelect,
  onClose,
  onConfirm,
}: {
  open: boolean;
  repair: AdminAssignTarget | null;
  staff: AssignableStaff[];
  search: string;
  selectedId: string;
  submitting: boolean;
  onSearchChange: (value: string) => void;
  onSelect: (staffId: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const selected = staff.find((s) => s.id === selectedId) ?? null;
  const title = repair ? `Przypisz ${repair.repair_number}` : "Przypisz naprawę";

  if (!open || !repair) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#0b0c10] shadow-[0_30px_90px_rgba(0,0,0,.6)]">
        <div className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(59,130,246,.16),rgba(59,130,246,.04))] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#60a5fa]/30 bg-[#2563eb]/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#93c5fd]">
                <Sparkles size={12} />
                Wybór serwisanta
              </div>
              <h3 className="mt-3 text-2xl font-semibold text-white">{title}</h3>
              <p className="mt-1 max-w-2xl text-sm text-[#9ca3af]">
                Wybierz pracownika z listy. Najpierw pokazujemy najbardziej dostępnych serwisantów, żeby decyzja była szybka i czytelna.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 bg-white/5 p-2.5 text-[#cbd5e1] transition hover:bg-white/10 hover:text-white"
              aria-label="Zamknij popup przypisania"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#9ca3af]">Naprawa</div>
              <div className="mt-1 font-mono text-sm font-semibold text-white">{repair.repair_number}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 md:col-span-2">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#9ca3af]">Urządzenie / klient</div>
              <div className="mt-1 truncate text-sm font-semibold text-white">
                {repair.device_name} · {repair.client_name}
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-white/10 px-6 py-4">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">Szukaj pracownika</label>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <Search size={16} className="text-[#60a5fa]" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Wpisz imię, nazwisko lub specjalizację..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#6b7280]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-6 py-4">
          <div className="mb-3 flex items-center justify-between text-sm text-[#9ca3af]">
            <span className="inline-flex items-center gap-2">
              <Users2 size={15} className="text-[#60a5fa]" />
              {staff.length ? `${staff.length} dostępnych serwisantów` : "Brak dostępnych serwisantów"}
            </span>
            <span>{selected ? `Wybrano: ${selected.picker_label}` : "Wybierz jedną osobę"}</span>
          </div>

          <div className="max-h-[42vh] overflow-y-auto pr-1">
            <div className="grid gap-3 md:grid-cols-2">
              {staff.map((person) => {
                const isSelected = person.id === selectedId;
                const activeCount = person.active_repairs_count ?? 0;
                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => onSelect(person.id)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-[#60a5fa]/70 bg-[#2563eb]/15 shadow-[0_0_0_1px_rgba(96,165,250,.25),0_16px_30px_-22px_rgba(59,130,246,.9)]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-base font-semibold text-white">{person.picker_label}</div>
                        <div className="mt-1 truncate text-sm text-[#9ca3af]">{person.full_name}</div>
                      </div>
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                          isSelected
                            ? "border-[#60a5fa]/50 bg-[#2563eb] text-white"
                            : "border-white/10 bg-black/20 text-[#9ca3af]"
                        }`}
                      >
                        {isSelected ? <Check size={16} /> : <span className="text-xs font-bold">{activeCount}</span>}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[#9ca3af]">
                      <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1">Aktywne: {activeCount}</span>
                      <span className="truncate">{person.specialization ?? "—"}</span>
                    </div>
                  </button>
                );
              })}

              {staff.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-sm text-[#9ca3af]">
                  Brak pracowników do przypisania.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-black/30 px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-[#9ca3af]">
              {selected ? (
                <>
                  Przypisanie trafi do <span className="font-semibold text-white">{selected.picker_label}</span>.
                </>
              ) : (
                "Kliknij pracownika, aby go wybrać."
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-[#d1d5db] transition hover:bg-white/10"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={submitting || !selected}
                className="rounded-2xl bg-gradient-to-r from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_-16px_rgba(59,130,246,.95)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-18px_rgba(59,130,246,.98)] disabled:translate-y-0 disabled:opacity-60"
              >
                {submitting ? "Przypisywanie…" : "Przypisz do serwisanta"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UnassignedRepairsView({
  basePath,
  mode = "staff",
  detailBasePath,
}: {
  basePath: string;
  mode?: "staff" | "admin";
  detailBasePath?: string;
}) {
  const { token, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const addToast = useWorkerStore((s) => s.addToast);

  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const [refreshTick, setRefreshTick] = useState(0);
  const [postingFor, setPostingFor] = useState<string | null>(null);
  const [assigningFor, setAssigningFor] = useState<string | null>(null);
  const isAdminMode = mode === "admin";
  const repairDetailBasePath = detailBasePath ?? (isAdminMode ? "/admin-panel/repairs" : "/panel/naprawy");
  const [adminAssignTarget, setAdminAssignTarget] = useState<AdminAssignTarget | null>(null);
  const [adminAssignSearch, setAdminAssignSearch] = useState("");
  const [adminSelectedStaffId, setAdminSelectedStaffId] = useState<string>("");

  const spec = user?.staff_profile?.specialization ?? null;
  const specDisplay = user?.staff_profile?.specialization_display ?? null;

  const repairsQuery = useQuery({
    queryKey: ["repairs", "unassigned-new", refreshTick],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) throw new Error("Missing auth/token");
      return api.get<RepairRequestListItem[]>(
        `/staff/repairs/?unassigned_only=1&status=new&ordering=created_at`,
        token,
      );
    },
    staleTime: 10_000,
  });

  const assignableQuery = useQuery({
    queryKey: ["staff", "assignable-for-repairs"],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) throw new Error("Missing auth/token");
      return api.get<AssignableStaff[]>("/accounts/staff/assignable-for-repairs/", token);
    },
    staleTime: 60_000,
  });

  const assignableSorted = sortAssignableForPicker(assignableQuery.data ?? []).filter((row) => {
    if (!isAdminMode) return true;
    return row.role === "staff";
  });
  const adminAssignableSorted = useMemo(
    () =>
      assignableSorted
        .filter((row) => row.role === "staff")
        .sort((a, b) => {
          const ca = a.active_repairs_count ?? 0;
          const cb = b.active_repairs_count ?? 0;
          if (ca !== cb) return ca - cb;
          return a.picker_label.localeCompare(b.picker_label, "pl");
        }),
    [assignableSorted],
  );
  const filteredAdminAssignable = useMemo(() => {
    const q = adminAssignSearch.trim().toLowerCase();
    if (!q) return adminAssignableSorted;
    return adminAssignableSorted.filter((row) => {
      const hay = `${row.picker_label} ${row.full_name} ${row.specialization ?? ""} ${row.active_repairs_count ?? 0}`.toLowerCase();
      return hay.includes(q);
    });
  }, [adminAssignSearch, adminAssignableSorted]);

  const list = repairsQuery.data ?? [];
  const oldest = list[0] ?? null;

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const slice = list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${basePath}?${params.toString()}`);
  };

  async function postNote(repairId: string, body: string) {
    setPostingFor(repairId);
    try {
      await authApi.post(`/repairs/${repairId}/notes/`, { note: body, note_type: "internal" });
      addToast("✓ Powiadomienie wysłane do admina", "success");
      await queryClient.invalidateQueries({ queryKey: ["repairs", "unassigned-new"] });
      await queryClient.invalidateQueries({ queryKey: ["sidebar", "unassigned-count"] });
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? getErrorMessageFromBody(e.body ?? "", "Nie udało się wysłać notatki.")
          : "Nie udało się wysłać notatki.";
      addToast(msg, "error");
    } finally {
      setPostingFor(null);
    }
  }

  function onUrgent() {
    if (!oldest) return;
    const human = new Date(oldest.created_at).toLocaleString("pl-PL");
    void postNote(
      oldest.id,
      `Proszę o pilne przypisanie — naprawa ${oldest.repair_number} czeka w kolejce od ${human}.`,
    );
  }

  async function assignToMe(repairId: string) {
    if (!token) return;
    setAssigningFor(repairId);
    try {
      await api.post(`/repairs/${repairId}/assign/`, {}, token);
      addToast("✓ Naprawa przypisana do Ciebie", "success");
      await queryClient.invalidateQueries({ queryKey: ["repairs", "unassigned-new"] });
      await queryClient.invalidateQueries({ queryKey: ["sidebar", "unassigned-count"] });
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? getErrorMessageFromBody(e.body ?? "", "Nie udało się przypisać naprawy.")
          : "Nie udało się przypisać naprawy.";
      addToast(msg, "error");
    } finally {
      setAssigningFor(null);
    }
  }

  async function assignToUser(repairId: string, assignee: AssignableStaff) {
    if (!token) return;
    setAssigningFor(repairId);
    try {
      await api.post(`/repairs/${repairId}/assign/`, { assigned_to_id: assignee.id }, token);
      addToast(`✓ Naprawa przypisana do ${assignee.picker_label}`, "success");
      await queryClient.invalidateQueries({ queryKey: ["repairs", "unassigned-new"] });
      await queryClient.invalidateQueries({ queryKey: ["sidebar", "unassigned-count"] });
      return true;
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? getErrorMessageFromBody(e.body ?? "", "Nie udało się przypisać naprawy.")
          : "Nie udało się przypisać naprawy.";
      addToast(msg, "error");
      return false;
    } finally {
      setAssigningFor(null);
    }
  }

  const openAdminAssignModal = (r: RepairRequestListItem) => {
    const bucket = deviceBucket(r.device_name);
    setAdminAssignTarget({
      id: r.id,
      repair_number: r.repair_number,
      device_name: r.device_name,
      client_name: r.client_name,
      problem_description: r.problem_description ?? "",
      created_at: r.created_at,
      device_category: bucket,
    });
    setAdminAssignSearch("");
    setAdminSelectedStaffId(adminAssignableSorted[0]?.id ?? "");
  };

  const closeAdminAssignModal = () => {
    setAdminAssignTarget(null);
    setAdminAssignSearch("");
    setAdminSelectedStaffId("");
  };

  const confirmAdminAssign = async () => {
    if (!adminAssignTarget) return;
    const selected = filteredAdminAssignable.find((row) => row.id === adminSelectedStaffId) ?? null;
    if (!selected) return;
    const ok = await assignToUser(adminAssignTarget.id, selected);
    if (ok) closeAdminAssignModal();
  };

  function onSuggest(r: RepairRequestListItem, bucket: DeviceBucket) {
    const team = suggestedTeamLabel(bucket);
    const line =
      specDisplay != null
        ? `Sugestia przypisania: ${r.repair_number} (${team}) — pasuje do mojej specjalizacji (${specDisplay}). Proponuję przypisanie do mnie.`
        : `Sugestia przypisania: ${r.repair_number} (${team}) — proszę o rozpatrzenie przypisania do mnie.`;
    void postNote(r.id, line);
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-8">
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink2)]">{isAdminMode ? "Administrator" : "Pracownik"}</p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--white)]">Nieprzypisane</h1>
            <p className="mt-1 text-sm text-[var(--ink2)]">
              {isAdminMode
                ? "Kolejka zgłoszeń ze statusem „nowe”. Przypisz bezpośrednio do serwisanta."
                : "Kolejka zgłoszeń ze statusem „nowe”, bez przypisanego pracownika"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setRefreshTick((t) => t + 1)}
              className="rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
            >
              <span className="inline-flex items-center gap-2">
                <RotateCcw size={16} />
                Odśwież
              </span>
            </button>
            <Link
              href={isAdminMode ? "/admin-panel/intake" : "/panel/intake"}
              className="rounded-2xl bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-[var(--white)] transition hover:bg-[#2563eb]"
            >
              Nowe przyjęcie
            </Link>
          </div>
        </header>

        <div
          className="flex gap-3 rounded-2xl border px-4 py-3 text-sm"
          style={{
            borderColor: "rgba(59,130,246,.35)",
            background: "rgba(59,130,246,.10)",
            color: "rgba(226,232,240,.95)",
          }}
        >
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#60a5fa]" aria-hidden />
          <div>
            <p className="font-semibold text-[var(--white)]">Przypisywanie z kolejki</p>
            <p className="mt-1 text-[#cbd5e1]">
              {isAdminMode
                ? "Przypisuj bezpośrednio do serwisantów z poziomu kolejki. Konto administratora nie może przypisać zgłoszenia do siebie."
                : "„Przypisz do mnie” albo „Przypisz do kogoś innego” (lista pracowników). Opcjonalnie wyślij notatkę do administratora („Pilnie → Admin” lub „Sugestia”), gdy potrzebna jest eskalacja lub informacja wg specjalizacji."}
            </p>
          </div>
        </div>

        {oldest ? (
          <div
            className="flex flex-col gap-3 rounded-2xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            style={{
              borderColor: "rgba(239,68,68,.45)",
              background: "rgba(239,68,68,.12)",
            }}
          >
            <div>
              <p className="text-sm font-semibold text-[#fecaca]">Najdłużej w kolejce</p>
              <p className="mt-1 font-mono text-lg text-[var(--white)]">{oldest.repair_number}</p>
              <p className="mt-0.5 text-sm text-[#fca5a5]">
                {oldest.device_name} · od {new Date(oldest.created_at).toLocaleString("pl-PL")}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              {isAdminMode ? (
                <button
                  type="button"
                  onClick={() => openAdminAssignModal(oldest)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_-16px_rgba(59,130,246,.95)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-18px_rgba(59,130,246,.98)]"
                >
                  <Users2 size={16} />
                  Przypisz do serwisanta
                </button>
              ) : (
                <AssignRepairActions
                  busy={Boolean(assigningFor === oldest.id || postingFor === oldest.id)}
                  assignableSorted={assignableSorted}
                  assignableLoading={assignableQuery.isLoading}
                  allowAssignMe={!isAdminMode}
                  assignOtherLabel={isAdminMode ? "Przypisz do serwisanta" : "Przypisz do kogoś innego"}
                  emptyOtherLabel={isAdminMode ? "Brak aktywnych serwisantów" : "Brak dostępnych osób"}
                  onAssignMe={isAdminMode ? undefined : () => void assignToMe(oldest.id)}
                  onAssignUser={(u) => void assignToUser(oldest.id, u)}
                  size="comfortable"
                />
              )}
              {!isAdminMode ? (
                <button
                  type="button"
                  disabled={postingFor === oldest.id || assigningFor === oldest.id}
                  onClick={onUrgent}
                  className="rounded-xl bg-[#dc2626] px-4 py-2.5 text-sm font-semibold text-[var(--white)] transition hover:bg-[#b91c1c] disabled:opacity-60"
                >
                  {postingFor === oldest.id ? "Wysyłanie…" : "Pilnie → Admin"}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)]" style={{ overflow: "visible" }}>
          {repairsQuery.isLoading ? (
            <div className="p-4">
              <RepairTableSkeleton rows={8} />
            </div>
          ) : repairsQuery.error ? (
            <div className="px-4 py-8">
              <ErrorState
                error={repairsQuery.error ?? new Error("Nie udało się pobrać listy napraw.")}
                onRetry={() => void repairsQuery.refetch()}
                title="Błąd listy nieprzypisanych"
              />
            </div>
          ) : slice.length === 0 ? (
            <div className="px-4 py-8">
              <EmptyState
                icon={EMPTY_STATES.unassigned.icon}
                title={EMPTY_STATES.unassigned.title}
                description="Brak zgłoszeń w statusie „nowe” bez przypisanego pracownika."
              />
            </div>
          ) : (
            <>
              <div className="space-y-3 p-3 md:hidden">
                {slice.map((r) => {
                  const bucket = deviceBucket(r.device_name);
                  const wait = waitingMeta(r.created_at);
                  const ws = waitStyle(wait.level);
                  const showSuggest = matchesSpecialization(spec, bucket);
                  return (
                    <article key={r.id} className="rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link href={`${repairDetailBasePath}/${r.id}`} className="font-mono text-sm font-semibold text-[#93c5fd] hover:underline">
                            {r.repair_number}
                          </Link>
                          <p className="mt-1 text-sm font-semibold text-[var(--white)]">{r.device_name}</p>
                          <p className="mt-1 text-xs text-[#cbd5e1]">{r.client_name}</p>
                        </div>
                        <span
                          className="shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold"
                          style={{ color: ws.color, background: ws.bg, borderColor: `${ws.color}55` }}
                        >
                          {wait.label}
                          {wait.suffix}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--s1)] px-2 py-1.5 text-[var(--ink2)]">
                          Kategoria: <span className="font-semibold text-[var(--white)]">{categoryLabel(bucket)}</span>
                        </div>
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--s1)] px-2 py-1.5 text-[var(--ink2)]">
                          Sugerowany: <span className="font-semibold text-[var(--white)]">{suggestedTechnicianName(bucket)}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap justify-end gap-2">
                        {isAdminMode ? (
                          <button
                            type="button"
                            onClick={() => openAdminAssignModal(r)}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] px-3 py-2 text-xs font-semibold text-white"
                          >
                            <Users2 size={14} />
                            Przypisz
                          </button>
                        ) : (
                          <AssignRepairActions
                            busy={Boolean(assigningFor === r.id || postingFor === r.id)}
                            assignableSorted={assignableSorted}
                            assignableLoading={assignableQuery.isLoading}
                            allowAssignMe={!isAdminMode}
                            assignOtherLabel={isAdminMode ? "Przypisz" : "Do kogoś innego"}
                            emptyOtherLabel={isAdminMode ? "Brak serwisantów" : "Brak osób"}
                            onAssignMe={isAdminMode ? undefined : () => void assignToMe(r.id)}
                            onAssignUser={(u) => void assignToUser(r.id, u)}
                          >
                            {!isAdminMode && showSuggest ? (
                              <button
                                type="button"
                                disabled={postingFor === r.id || assigningFor === r.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onSuggest(r, bucket);
                                }}
                                className="rounded-lg border border-[#3b82f6]/40 bg-[#3b82f6]/15 px-3 py-1.5 text-xs font-semibold text-[#93c5fd] transition hover:bg-[#3b82f6]/25 disabled:opacity-60"
                              >
                                {postingFor === r.id ? "…" : "Sugestia"}
                              </button>
                            ) : null}
                          </AssignRepairActions>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto md:block" style={{ overflowY: "visible" }}>
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--ink2)]">
                    <th className="px-4 py-3 font-semibold">Nr ref</th>
                    <th className="px-4 py-3 font-semibold">Urządzenie</th>
                    <th className="px-4 py-3 font-semibold">Klient</th>
                    <th className="px-4 py-3 font-semibold">Kategoria</th>
                    <th className="px-4 py-3 font-semibold">Oczekiwanie</th>
                    <th className="px-4 py-3 font-semibold">Sugerowany</th>
                    <th className="px-4 py-3 font-semibold text-right">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {slice.map((r) => {
                    const bucket = deviceBucket(r.device_name);
                    const wait = waitingMeta(r.created_at);
                    const ws = waitStyle(wait.level);
                    const showSuggest = matchesSpecialization(spec, bucket);
                    return (
                      <tr key={r.id} className="border-b border-white/[0.06] transition hover:bg-white/[0.03]">
                        <td className="px-4 py-3 align-middle">
                          <Link href={`${repairDetailBasePath}/${r.id}`} className="font-mono font-semibold text-[#93c5fd] hover:underline">
                            {r.repair_number}
                          </Link>
                        </td>
                        <td className="px-4 py-3 align-middle text-[var(--white)]">{r.device_name}</td>
                        <td className="px-4 py-3 align-middle text-[#e5e7eb]">{r.client_name}</td>
                        <td className="px-4 py-3 align-middle text-[#cbd5e1]">{categoryLabel(bucket)}</td>
                        <td className="px-4 py-3 align-middle">
                          <span
                            className="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold"
                            style={{ color: ws.color, background: ws.bg, borderColor: `${ws.color}55` }}
                          >
                            {wait.label}
                            {wait.suffix}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-middle text-[#e5e7eb]">{suggestedTechnicianName(bucket)}</td>
                        <td className="px-4 py-3 align-middle text-right">
                          {isAdminMode ? (
                            <button
                              type="button"
                              onClick={() => openAdminAssignModal(r)}
                              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_-16px_rgba(59,130,246,.95)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-18px_rgba(59,130,246,.98)]"
                            >
                              <Users2 size={16} />
                              Przypisz do serwisanta
                            </button>
                          ) : (
                            <AssignRepairActions
                              busy={Boolean(assigningFor === r.id || postingFor === r.id)}
                              assignableSorted={assignableSorted}
                              assignableLoading={assignableQuery.isLoading}
                              allowAssignMe={!isAdminMode}
                              assignOtherLabel={isAdminMode ? "Przypisz do serwisanta" : "Przypisz do kogoś innego"}
                              emptyOtherLabel={isAdminMode ? "Brak aktywnych serwisantów" : "Brak dostępnych osób"}
                              onAssignMe={isAdminMode ? undefined : () => void assignToMe(r.id)}
                              onAssignUser={(u) => void assignToUser(r.id, u)}
                            >
                              {!isAdminMode && showSuggest ? (
                              <button
                                type="button"
                                disabled={postingFor === r.id || assigningFor === r.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onSuggest(r, bucket);
                                }}
                                className="rounded-lg border border-[#3b82f6]/40 bg-[#3b82f6]/15 px-3 py-1.5 text-xs font-semibold text-[#93c5fd] transition hover:bg-[#3b82f6]/25 disabled:opacity-60"
                              >
                                {postingFor === r.id ? "…" : "Sugestia"}
                              </button>
                              ) : null}
                            </AssignRepairActions>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}

          {!repairsQuery.isLoading && slice.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3">
              <p className="text-sm text-[var(--ink2)]">
                Strona <span className="font-semibold text-[var(--white)]">{safePage}</span> / {pageCount}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, safePage - 1))}
                  disabled={safePage <= 1}
                  className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm font-semibold text-[var(--ink2)] hover:bg-[var(--row-active)] hover:text-[var(--white)] disabled:opacity-50"
                >
                  Wstecz
                </button>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(pageCount, safePage + 1))}
                  disabled={safePage >= pageCount}
                  className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm font-semibold text-[var(--ink2)] hover:bg-[var(--row-active)] hover:text-[var(--white)] disabled:opacity-50"
                >
                  Dalej
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <footer className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-4 py-4 text-sm text-[var(--ink2)]">
          <p className="font-semibold text-[var(--white)]">{isAdminMode ? "Tryb administratora" : "Twoja specjalizacja"}</p>
          <p className="mt-2">
            {isAdminMode ? (
              <>
                Ten widok jest zoptymalizowany pod szybkie przypisanie nowych zgłoszeń do serwisantów. Akcja „Przypisz do mnie”
                jest ukryta, aby uniknąć omyłkowego przypisania naprawy do konta administratora.
              </>
            ) : specDisplay ? (
              <>
                W profilu serwisowym: <span className="text-[#e5e7eb]">{specDisplay}</span>. Przypisanie do siebie lub do innego
                pracownika jest dostępne dla każdej pozycji w kolejce. Przycisk „Sugestia” (notatka do admina) pojawia się dodatkowo przy zgłoszeniach zgodnych z tym
                zakresem (oraz przy „ogólnych”, jeśli masz specjalizację ogólną).
              </>
            ) : (
              <>
                Brak ustawionej specjalizacji w profilu — nadal możesz przypisywać naprawy do siebie lub do innego pracownika.
                Ustaw specjalizację u administratora, aby mieć dodatkowy przycisk „Sugestia” przy pasujących zgłoszeniach.
              </>
            )}
          </p>
        </footer>

        <AdminAssignWorkerModal
          open={Boolean(adminAssignTarget)}
          repair={adminAssignTarget}
          staff={filteredAdminAssignable}
          search={adminAssignSearch}
          selectedId={adminSelectedStaffId}
          submitting={Boolean(adminAssignTarget && assigningFor === adminAssignTarget.id)}
          onSearchChange={setAdminAssignSearch}
          onSelect={setAdminSelectedStaffId}
          onClose={closeAdminAssignModal}
          onConfirm={() => void confirmAdminAssign()}
        />
      </div>
    </main>
  );
}
