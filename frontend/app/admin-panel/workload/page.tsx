"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BriefcaseBusiness,
  CircleAlert,
  Gauge,
  Layers,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Timer,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";
import { api, fetchAllPages } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { StatCardSkeleton, StackedRowSkeleton } from "@/components/ui/Skeleton";
import type { RepairRequestListItem } from "@/types/repairs";

type DaysFilter = 7 | 30;
type AssigneeFilter = "all" | "unassigned" | string;
type CaseTypeFilter = "all" | "regular" | "complaint" | "warranty";

type DashboardKpi = {
  in_progress_count?: number;
  ready_for_pickup_count?: number;
  overdue_count?: number;
  complaints_count?: number;
  warranties_count?: number;
  avg_completion_days?: number | null;
};

type DashboardResponse = {
  kpi?: DashboardKpi;
};

type AssignableStaff = {
  id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  picker_label?: string;
  active_repairs_count?: number;
};

type AvailabilityEntry = {
  id: string | number;
  employee?: string | null;
  employee_name?: string | null;
  availability_type: string;
  availability_type_display: string;
  date?: string;
};

type AvailabilityBucket = "available" | "busy" | "off" | "unknown";

type StaffLoad = {
  id: string;
  name: string;
  activeCount: number;
  urgentCount: number;
  readyCount: number;
  claimsCount: number;
  avgAgeDays: number;
  utilizationPct: number;
  availability: AvailabilityBucket;
  availabilityLabel: string;
};

const DAY_OPTIONS: DaysFilter[] = [7, 30];
const CAPACITY_PER_TECH = 8;

const ACTIVE_STATUSES = [
  "new",
  "accepted",
  "in_diagnostics",
  "diagnostics_done",
  "quote_pending",
  "quote_sent",
  "quote_accepted",
  "waiting_for_parts",
  "in_repair",
  "repair_done",
  "in_testing",
  "testing_passed",
  "testing_failed",
  "ready_for_pickup",
  "shipped",
] as const;

function normalizePriority(priority: string | null | undefined): "urgent" | "high" | "normal" | "low" {
  const p = (priority ?? "").toLowerCase();
  if (p.includes("urgent") || p.includes("same_day")) return "urgent";
  if (p.includes("high") || p.includes("wysok")) return "high";
  if (p.includes("low") || p.includes("nisk")) return "low";
  return "normal";
}

function availabilityBucket(typeValue: string | null | undefined): AvailabilityBucket {
  const v = (typeValue ?? "").toLowerCase();
  if (!v) return "unknown";
  if (v.includes("available") || v.includes("dost")) return "available";
  if (v.includes("service_trip") || v.includes("installation") || v.includes("temporarily") || v.includes("zaj")) return "busy";
  if (v.includes("day_off") || v.includes("vacation") || v.includes("sick") || v.includes("urlop") || v.includes("chorob")) return "off";
  return "unknown";
}

function availabilityClass(bucket: AvailabilityBucket): string {
  if (bucket === "available") return "border-[#22c55e]/35 bg-[#22c55e]/12 text-[#86efac]";
  if (bucket === "busy") return "border-[#f59e0b]/35 bg-[#f59e0b]/12 text-[#fde68a]";
  if (bucket === "off") return "border-[#ef4444]/35 bg-[#ef4444]/12 text-[#fca5a5]";
  return "border-white/15 bg-white/5 text-[#9ca3af]";
}

function typeOfCase(r: RepairRequestListItem): CaseTypeFilter {
  if (r.repair_type === "complaint") return "complaint";
  if (r.repair_type === "warranty") return "warranty";
  return "regular";
}

function displayAssignee(r: RepairRequestListItem): string {
  if (!r.assigned_to) return "Nieprzypisane";
  if (typeof r.assigned_to === "string") return r.assigned_to;
  const full = [r.assigned_to.first_name, r.assigned_to.last_name].filter(Boolean).join(" ").trim();
  return full || r.assigned_to.email || "Przypisany";
}

function assigneeId(r: RepairRequestListItem): string | null {
  if (!r.assigned_to || typeof r.assigned_to === "string") return null;
  return String(r.assigned_to.id);
}

function ageDays(iso: string | null | undefined): number {
  if (!iso) return 0;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return Math.floor(ms / 86_400_000);
}

function staffName(s: AssignableStaff): string {
  const direct = (s.full_name ?? "").trim();
  if (direct) return direct;
  const full = [s.first_name, s.last_name].filter(Boolean).join(" ").trim();
  if (full) return full;
  return s.picker_label || s.email || "Pracownik";
}

function kpiCard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string | number; sub: string; accent: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c0d12] p-4">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-25 blur-2xl" style={{ background: accent }} />
      <div className="flex items-center justify-between gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${accent}22`, color: accent }}>
          {icon}
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b7280]">KPI</span>
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b7280]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-[#9ca3af]">{sub}</p>
    </div>
  );
}

function caseTypeLabel(t: CaseTypeFilter): string {
  if (t === "all") return "Wszystkie";
  if (t === "regular") return "Standard";
  if (t === "complaint") return "Reklamacje";
  return "Gwarancje";
}

export default function AdminWorkloadPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAdmin = user?.role === "admin";

  const days = useMemo<DaysFilter>(() => {
    const d = Number(searchParams.get("days"));
    return d === 7 ? 7 : 30;
  }, [searchParams]);

  const assignee = useMemo<AssigneeFilter>(() => searchParams.get("assignee") || "all", [searchParams]);
  const caseType = useMemo<CaseTypeFilter>(() => {
    const t = searchParams.get("case");
    if (t === "regular" || t === "complaint" || t === "warranty") return t;
    return "all";
  }, [searchParams]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [repairs, setRepairs] = useState<RepairRequestListItem[]>([]);
  const [staff, setStaff] = useState<AssignableStaff[]>([]);
  const [availabilityToday, setAvailabilityToday] = useState<AvailabilityEntry[]>([]);
  const [kpi, setKpi] = useState<DashboardKpi | null>(null);

  const setFilters = useCallback(
    (next: Partial<{ days: DaysFilter; assignee: AssigneeFilter; caseType: CaseTypeFilter }>) => {
      const p = new URLSearchParams(searchParams.toString());
      const d = next.days ?? days;
      const a = next.assignee ?? assignee;
      const ct = next.caseType ?? caseType;

      if (d === 30) p.delete("days");
      else p.set("days", String(d));

      if (a === "all") p.delete("assignee");
      else p.set("assignee", a);

      if (ct === "all") p.delete("case");
      else p.set("case", ct);

      // Czyscimy legacy parametry po usunietych filtrach.
      p.delete("priority");
      p.delete("availability");

      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [searchParams, days, assignee, caseType, router, pathname],
  );

  const load = useCallback(async () => {
    if (!token || !isAdmin) return;
    setLoading(true);
    setError(null);
    const localWarnings: string[] = [];

    try {
      const today = new Date().toISOString().slice(0, 10);
      const statusQuery = ACTIVE_STATUSES.map((s) => `status_in=${encodeURIComponent(s)}`).join("&");

      const [dashboardRes, repairsRes, staffRes, availabilityRes] = await Promise.allSettled([
        api.get<DashboardResponse>(`/analytics/admin-dashboard/?days=${days}`, token),
        fetchAllPages<RepairRequestListItem>(`/repairs/?${statusQuery}&ordering=-updated_at&page_size=200`, token),
        api.get<AssignableStaff[] | { results?: AssignableStaff[] }>("/accounts/staff/assignable-for-repairs/?include_self=1", token),
        api.get<AvailabilityEntry[] | { results?: AvailabilityEntry[] }>(`/availability/?date=${encodeURIComponent(today)}`, token),
      ]);

      if (dashboardRes.status === "fulfilled") {
        setKpi(dashboardRes.value?.kpi ?? null);
      } else {
        setKpi(null);
        localWarnings.push("Brak KPI z analityki - pokazuję tylko dane operacyjne.");
      }

      if (repairsRes.status === "fulfilled") {
        setRepairs(Array.isArray(repairsRes.value) ? repairsRes.value : []);
      } else {
        setError(new Error("Nie udało się pobrać aktywnych napraw."));
        setWarnings(localWarnings);
        setRepairs([]);
        setStaff([]);
        setAvailabilityToday([]);
        setKpi(null);
        return;
      }

      if (staffRes.status === "fulfilled") {
        const rows = Array.isArray(staffRes.value) ? staffRes.value : staffRes.value?.results ?? [];
        setStaff(rows);
      } else {
        setStaff([]);
        localWarnings.push("Lista pracowników jest chwilowo niedostępna.");
      }

      if (availabilityRes.status === "fulfilled") {
        const rows = Array.isArray(availabilityRes.value) ? availabilityRes.value : availabilityRes.value?.results ?? [];
        setAvailabilityToday(rows);
      } else {
        setAvailabilityToday([]);
        localWarnings.push("Statusy dostępności są chwilowo niedostępne.");
      }

      setWarnings(localWarnings);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Nie udało się pobrać obciążenia."));
      setWarnings([]);
      setRepairs([]);
      setStaff([]);
      setAvailabilityToday([]);
      setKpi(null);
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, days]);

  useEffect(() => {
    if (!isAdmin) return;
    void load();
    const id = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(id);
  }, [isAdmin, load]);

  const availabilityMap = useMemo(() => {
    const map = new Map<string, AvailabilityEntry>();
    for (const row of availabilityToday) {
      const key = String(row.employee ?? "");
      if (!key || map.has(key)) continue;
      map.set(key, row);
    }
    return map;
  }, [availabilityToday]);

  const filteredRepairs = useMemo(() => {
    return repairs.filter((r) => {
      const rid = assigneeId(r);
      const t = typeOfCase(r);

      if (assignee === "unassigned" && rid !== null) return false;
      if (assignee !== "all" && assignee !== "unassigned" && rid !== assignee) return false;
      if (caseType !== "all" && t !== caseType) return false;

      return true;
    });
  }, [repairs, assignee, caseType]);

  const staffLoads = useMemo<StaffLoad[]>(() => {
    const names = new Map<string, string>();

    for (const s of staff) names.set(String(s.id), staffName(s));
    for (const r of repairs) {
      const rid = assigneeId(r);
      if (!rid || names.has(rid)) continue;
      names.set(rid, displayAssignee(r));
    }

    const rows: StaffLoad[] = Array.from(names.entries()).map(([id, name]) => {
      const mine = filteredRepairs.filter((r) => assigneeId(r) === id);
      const urgent = mine.filter((r) => normalizePriority(r.priority) === "urgent").length;
      const ready = mine.filter((r) => r.status === "ready_for_pickup" || r.status === "shipped").length;
      const claims = mine.filter((r) => r.repair_type === "complaint" || r.repair_type === "warranty").length;
      const avgAge = mine.length > 0 ? Math.round(mine.reduce((sum, r) => sum + ageDays(r.created_at), 0) / mine.length) : 0;
      const avRow = availabilityMap.get(id);
      const avBucket = availabilityBucket(avRow?.availability_type);
      const utilizationPct = Math.min(100, Math.round((mine.length / CAPACITY_PER_TECH) * 100));

      return {
        id,
        name,
        activeCount: mine.length,
        urgentCount: urgent,
        readyCount: ready,
        claimsCount: claims,
        avgAgeDays: avgAge,
        utilizationPct,
        availability: avBucket,
        availabilityLabel: avRow?.availability_type_display ?? "Brak wpisu",
      };
    });

    return rows.sort((a, b) => b.activeCount - a.activeCount || b.urgentCount - a.urgentCount || a.name.localeCompare(b.name, "pl"));
  }, [staff, repairs, filteredRepairs, availabilityMap]);

  const totals = useMemo(() => {
    const total = filteredRepairs.length;
    const unassigned = filteredRepairs.filter((r) => !assigneeId(r)).length;
    const urgent = filteredRepairs.filter((r) => normalizePriority(r.priority) === "urgent").length;
    const overloaded = staffLoads.filter((s) => s.utilizationPct >= 90).length;
    return { total, unassigned, urgent, overloaded };
  }, [filteredRepairs, staffLoads]);

  const aggregate = useMemo(() => {
    const avgAge = filteredRepairs.length > 0 ? Math.round(filteredRepairs.reduce((sum, r) => sum + ageDays(r.created_at), 0) / filteredRepairs.length) : 0;
    const atRisk = filteredRepairs.filter((r) => {
      const age = ageDays(r.created_at);
      const p = normalizePriority(r.priority);
      return age >= 7 || p === "urgent";
    }).length;
    const totalCapacity = Math.max(0, staffLoads.length * CAPACITY_PER_TECH);
    const occupancyPct = totalCapacity > 0 ? Math.min(100, Math.round((filteredRepairs.length / totalCapacity) * 100)) : 0;
    return { avgAge, atRisk, totalCapacity, occupancyPct };
  }, [filteredRepairs, staffLoads]);

  const activeFilters = useMemo(() => {
    const chips: Array<{ key: string; label: string; onClear: () => void }> = [];
    if (days !== 30) chips.push({ key: "days", label: `Okno: ${days} dni`, onClear: () => setFilters({ days: 30 }) });
    if (caseType !== "all") chips.push({ key: "case", label: `Typ: ${caseTypeLabel(caseType)}`, onClear: () => setFilters({ caseType: "all" }) });
    if (assignee !== "all") {
      const assigneeName = assignee === "unassigned" ? "Nieprzypisane" : staffLoads.find((s) => s.id === assignee)?.name ?? "Pracownik";
      chips.push({ key: "assignee", label: `Osoba: ${assigneeName}`, onClear: () => setFilters({ assignee: "all" }) });
    }
    return chips;
  }, [days, caseType, assignee, staffLoads, setFilters]);

  const visibleRepairs = useMemo(() => {
    return [...filteredRepairs].sort((a, b) => {
      const pa = normalizePriority(a.priority);
      const pb = normalizePriority(b.priority);
      const rank = { urgent: 3, high: 2, normal: 1, low: 0 };
      if (rank[pb] !== rank[pa]) return rank[pb] - rank[pa];
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [filteredRepairs]);

  if (!isAdmin) {
    return (
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-8">
        <p className="text-sm text-[#fca5a5]">Tylko administrator.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl space-y-6 px-4 py-8">
      <header className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,.22),transparent_45%),#0d1119] p-5 shadow-[0_10px_40px_rgba(2,6,23,.35)]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#93c5fd]">Panel Admina</p>
            <h1 className="mt-1.5 flex items-center gap-2 text-2xl font-bold text-white">
              <Sparkles size={20} className="text-[#60a5fa]" />
              Obciazenie zespolu
            </h1>
            <p className="mt-1 text-xs text-[#9ca3af]">
              Widok premium planowania mocy przerobowych, ryzyk i kolejek operacyjnych.
              {lastUpdated ? ` Odsw. ${lastUpdated.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-[#3b82f6]/35 bg-[#3b82f6]/10 px-2.5 py-1 text-[11px] font-semibold text-[#bfdbfe]">
                Oblozenie: {aggregate.occupancyPct}%
              </span>
              <span className="rounded-full border border-[#f59e0b]/35 bg-[#f59e0b]/10 px-2.5 py-1 text-[11px] font-semibold text-[#fde68a]">
                Ryzyko: {aggregate.atRisk}
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-[#d1d5db]">
                Aktywne filtry: {activeFilters.length}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#d1d5db] transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60a5fa]/70 disabled:opacity-60"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Odswiez
          </button>
        </div>
      </header>

      {error && !loading ? <ErrorState error={error} onRetry={() => void load()} title="Nie udalo sie zaladowac obciazenia" /> : null}

      {warnings.length > 0 && !error ? (
        <section className="rounded-2xl border border-[#f59e0b]/35 bg-[#f59e0b]/10 p-3">
          <div className="flex items-start gap-2 text-sm text-[#fde68a]">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <p>{warnings.join(" ")}</p>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-[#0c0d12] p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7280]">Filtry operacyjne</p>
          <button
            type="button"
            onClick={() => setFilters({ days: 30, assignee: "all", caseType: "all" })}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60a5fa]/70"
          >
            Resetuj wszystko
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Zakres dni">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setFilters({ days: d })}
              aria-pressed={days === d}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                days === d
                  ? "bg-[#2563eb] text-white"
                  : "border border-white/10 bg-white/5 text-[#9ca3af] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60a5fa]/70"
              }`}
            >
              {d} dni
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2" role="group" aria-label="Typ sprawy">
          {(["all", "regular", "complaint", "warranty"] as CaseTypeFilter[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilters({ caseType: t })}
              aria-pressed={caseType === t}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                caseType === t ? "border-white/20 bg-white/10 text-white" : "border-white/10 bg-white/5 text-[#9ca3af] hover:text-white"
              }`}
            >
              {t === "all" ? "Typ: wszystkie" : t === "regular" ? "Typ: standard" : t === "complaint" ? "Typ: reklamacje" : "Typ: gwarancje"}
            </button>
          ))}
        </div>

        {activeFilters.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFilters.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.onClear}
                className="rounded-full border border-[#60a5fa]/35 bg-[#1d4ed8]/18 px-2.5 py-1 text-[11px] font-semibold text-[#bfdbfe] transition hover:bg-[#1d4ed8]/28"
              >
                {chip.label} x
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[11px] text-[#6b7280]">Brak aktywnych filtrow - pokazuje pelen obraz operacyjny.</p>
        )}
      </section>

      {loading ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
            <StackedRowSkeleton rows={6} />
          </section>
        </>
      ) : !error ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {kpiCard({
              icon: <BriefcaseBusiness size={16} />,
              label: "Aktywne zgłoszenia",
              value: totals.total,
              sub: "Po aktualnych filtrach operacyjnych",
              accent: "#3b82f6",
            })}
            {kpiCard({
              icon: <ShieldAlert size={16} />,
              label: "Pilne",
              value: totals.urgent,
              sub: "Wymagaja szybkiej reakcji",
              accent: "#ef4444",
            })}
            {kpiCard({
              icon: <Users size={16} />,
              label: "Nieprzypisane",
              value: totals.unassigned,
              sub: "Do rozdysponowania",
              accent: "#f59e0b",
            })}
            {kpiCard({
              icon: <Gauge size={16} />,
              label: "Przeciazony zespol",
              value: totals.overloaded,
              sub: `>=90% pojemnosci (limit ${CAPACITY_PER_TECH})`,
              accent: "#22c55e",
            })}
            {kpiCard({
              icon: <Timer size={16} />,
              label: "Sredni wiek",
              value: `${aggregate.avgAge} dni`,
              sub: "Sredni czas spraw w toku",
              accent: "#a78bfa",
            })}
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
            <div className="rounded-2xl border border-white/10 bg-[#0c0d12] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-white">Ranking obciazenia zespolu</h2>
                <span className="text-xs text-[#6b7280]">{staffLoads.length} osob</span>
              </div>
              {staffLoads.length === 0 ? (
                <p className="text-sm text-[#6b7280]">Brak danych o pracownikach.</p>
              ) : (
                <div className="space-y-2.5">
                  {staffLoads.map((s) => {
                    const isSelected = assignee === s.id;
                    const utilColor = s.utilizationPct >= 90 ? "#ef4444" : s.utilizationPct >= 60 ? "#f59e0b" : "#22c55e";
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setFilters({ assignee: isSelected ? "all" : s.id })}
                        className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                          isSelected ? "border-[#3b82f6]/45 bg-[#3b82f6]/10" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{s.name}</p>
                            <p className="text-[11px] text-[#9ca3af]">Sredni wiek zgloszen: {s.avgAgeDays} dni</p>
                          </div>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${availabilityClass(s.availability)}`}>
                            {s.availabilityLabel}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[11px]">
                          <div><div className="text-[#6b7280]">Aktywne</div><div className="font-semibold text-white">{s.activeCount}</div></div>
                          <div><div className="text-[#6b7280]">Pilne</div><div className="font-semibold text-white">{s.urgentCount}</div></div>
                          <div><div className="text-[#6b7280]">Gotowe</div><div className="font-semibold text-white">{s.readyCount}</div></div>
                          <div><div className="text-[#6b7280]">Rek/Gw</div><div className="font-semibold text-white">{s.claimsCount}</div></div>
                        </div>
                        <div className="mt-2">
                          <div className="mb-1 flex items-center justify-between text-[10px] text-[#9ca3af]">
                            <span>Wykorzystanie mocy</span>
                            <span>{s.utilizationPct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/10">
                            <div className="h-full rounded-full" style={{ width: `${s.utilizationPct}%`, background: utilColor }} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#0c0d12] p-4">
                <h2 className="text-sm font-semibold text-white">Sygnaly operacyjne</h2>
                <div className="mt-3 space-y-2 text-xs text-[#cbd5e1]">
                  <p>• SLA po terminie: <span className="font-semibold text-white">{kpi?.overdue_count ?? 0}</span></p>
                  <p>• Gotowe do odbioru: <span className="font-semibold text-white">{kpi?.ready_for_pickup_count ?? 0}</span></p>
                  <p>• Reklamacje / gwarancje: <span className="font-semibold text-white">{kpi?.complaints_count ?? 0} / {kpi?.warranties_count ?? 0}</span></p>
                  <p>• Sredni czas realizacji: <span className="font-semibold text-white">{kpi?.avg_completion_days ?? "-"}</span></p>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#6b7280]">Pojemnosc</p>
                    <p className="mt-1 text-sm font-semibold text-white">{aggregate.totalCapacity}</p>
                    <p className="text-[11px] text-[#9ca3af]">Sloty aktywne ({staffLoads.length} osob)</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#6b7280]">Sprawy ryzyka</p>
                    <p className="mt-1 text-sm font-semibold text-white">{aggregate.atRisk}</p>
                    <p className="text-[11px] text-[#9ca3af]">Pilne lub &gt;=7 dni</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0c0d12] p-4">
                <h2 className="text-sm font-semibold text-white">Szybkie akcje</h2>
                <div className="mt-3 grid gap-2">
                  <Link href="/admin-panel/unassigned" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#d1d5db] transition hover:bg-white/10 hover:text-white">
                    Przejdz do nieprzypisanych
                  </Link>
                  <Link href="/admin-panel/claims" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#d1d5db] transition hover:bg-white/10 hover:text-white">
                    Otworz reklamacje i gwarancje
                  </Link>
                  <Link href="/admin-panel/calendar" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#d1d5db] transition hover:bg-white/10 hover:text-white">
                    Sprawdz kalendarz zespolu
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0c0d12] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-white">Kolejka operacyjna</h2>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-[#9ca3af]">
                  <Layers size={12} />
                  Pokazano {Math.min(visibleRepairs.length, 120)} / {visibleRepairs.length}
                </span>
                <button
                  type="button"
                  onClick={() => setFilters({ assignee: "all" })}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
                >
                  Resetuj osobe
                </button>
              </div>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFilters({ assignee: "all" })}
                className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${assignee === "all" ? "border-white/20 bg-white/10 text-white" : "border-white/10 bg-white/5 text-[#9ca3af]"}`}
              >
                Wszyscy
              </button>
              <button
                type="button"
                onClick={() => setFilters({ assignee: "unassigned" })}
                className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${assignee === "unassigned" ? "border-[#f59e0b]/35 bg-[#f59e0b]/14 text-[#fde68a]" : "border-white/10 bg-white/5 text-[#9ca3af]"}`}
              >
                Nieprzypisane
              </button>
              {staffLoads.slice(0, 8).map((s) => (
                <button
                  key={`chip-${s.id}`}
                  type="button"
                  onClick={() => setFilters({ assignee: s.id })}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${assignee === s.id ? "border-[#3b82f6]/35 bg-[#3b82f6]/14 text-[#bfdbfe]" : "border-white/10 bg-white/5 text-[#9ca3af]"}`}
                >
                  {s.name.split(" ")[0]} ({s.activeCount})
                </button>
              ))}
            </div>

            {totals.unassigned > 0 ? (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-3 py-2 text-xs text-[#fde68a]">
                <CircleAlert size={14} className="shrink-0" />
                W kolejce jest {totals.unassigned} nieprzypisanych zgloszen - warto rozdysponowac je priorytetowo.
              </div>
            ) : null}

            {visibleRepairs.length === 0 ? (
              <div className="py-6">
                <EmptyState icon="🧠" title="Brak zgłoszeń dla wybranych filtrów" description="Zmien kryteria lub odswiez dane." />
              </div>
            ) : (
              <ul className="space-y-2">
                {visibleRepairs.slice(0, 120).map((r) => {
                  const p = normalizePriority(r.priority);
                  const pClass = p === "urgent" ? "border-[#ef4444]/35 bg-[#ef4444]/14 text-[#fecaca]" : p === "high" ? "border-[#f59e0b]/35 bg-[#f59e0b]/14 text-[#fde68a]" : p === "low" ? "border-white/15 bg-white/5 text-[#9ca3af]" : "border-[#3b82f6]/35 bg-[#3b82f6]/14 text-[#bfdbfe]";
                  const t = typeOfCase(r);
                  return (
                    <li key={r.id} className="rounded-xl border border-white/10 bg-[#0b0c10] p-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-white">{r.repair_number}</span>
                            <span className="text-[#4b5563]">•</span>
                            <span className="truncate text-xs text-[#9ca3af]">{r.client_name}</span>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${pClass}`}>{p}</span>
                            {t !== "regular" ? (
                              <span className="rounded-full border border-[#a78bfa]/35 bg-[#a78bfa]/12 px-2 py-0.5 text-[10px] font-bold uppercase text-[#ddd6fe]">
                                {t === "complaint" ? "reklamacja" : "gwarancja"}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 truncate text-sm text-[#e5e7eb]">{r.device_name}</p>
                          <p className="mt-1 text-[11px] text-[#9ca3af]">
                            <UserRound size={12} className="mr-1 inline-block" />
                            {displayAssignee(r)}
                            <span className="mx-1">•</span>
                            <Activity size={12} className="mr-1 inline-block" />
                            {r.status_display}
                            <span className="mx-1">•</span>
                            <Wrench size={12} className="mr-1 inline-block" />
                            {ageDays(r.created_at)} dni w systemie
                          </p>
                        </div>
                        <Link
                          href={`/admin-panel/repairs/${r.id}`}
                          className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-[#d1d5db] transition hover:bg-white/10 hover:text-white"
                        >
                          Otworz
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}

