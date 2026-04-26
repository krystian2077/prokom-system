"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorState } from "@/components/ui/ErrorState";
import { StatCardSkeleton, StackedRowSkeleton } from "@/components/ui/Skeleton";
import type { RepairRequestListItem } from "@/types/repairs";
import type { StaffNotificationItem } from "@/types/notifications";

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminDashboardKpi = {
  new_count: number;
  in_progress_count: number;
  ready_for_pickup_count: number;
  overdue_count: number;
  unclaimed_count: number;
  revenue_total: string;
  quote_value_total: string;
  complaints_count: number;
  warranties_count: number;
};

type TopStaffItem = {
  user_id: string;
  full_name: string;
  email: string;
  completed_repairs: number;
  revenue: string;
};

type AdminDashboardResponse = {
  period_days: number;
  kpi: AdminDashboardKpi;
  tables: {
    most_overdue: RepairRequestListItem[];
    no_quote_repairs: RepairRequestListItem[];
    unclaimed_repairs: RepairRequestListItem[];
    active_complaints: RepairRequestListItem[];
    active_warranties: RepairRequestListItem[];
    top_staff: TopStaffItem[];
  };
  charts: {
    repairs_by_status: Record<string, number>;
    repairs_over_time: Array<{ period: string; count: number; revenue: string }>;
  };
};

type AlertSeverity = "red" | "amber" | "blue";

type DashboardAlert = {
  type: string;
  count: number;
  title: string;
  severity: AlertSeverity;
  href: string;
};

type WorkloadEntry = { id: string; name: string; inits: string; count: number; color: string; isUnassigned: boolean };

type PartUsageSummaryItem = {
  id: string;
  repair_number: string | null;
  repair_device_name: string;
  custom_part_name: string | null;
  quantity: number;
  expected_arrival_date: string | null;
  order_status_display: string;
};

type PartsBucket = { count: number; items: PartUsageSummaryItem[] };

type PartsDashboardSummary = {
  to_order: PartsBucket;
  in_transit: PartsBucket;
  arrived: PartsBucket;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TECH_COLORS = [
  "#3b82f6", "#a78bfa", "#22c55e", "#f59e0b",
  "#f97316", "#ec4899", "#14b8a6", "#e11d48",
];

const PARTS_BUCKETS = [
  { key: "to_order",  label: "Do zamówienia", color: "#f59e0b" },
  { key: "in_transit", label: "W drodze",     color: "#3b82f6" },
  { key: "arrived",   label: "Dotarły",       color: "#22c55e" },
] as const;

type PartsBucketKey = typeof PARTS_BUCKETS[number]["key"];

const STAFF_PERIODS = [
  { days: 1,  label: "Dziś"  },
  { days: 7,  label: "7 dni" },
  { days: 14, label: "14 dni" },
  { days: 30, label: "30 dni" },
] as const;

const PIPELINE_STAGES = [
  { label: "Nowe",        statuses: ["new", "accepted"],                                                   color: "#3b82f6" },
  { label: "Diagnostyka", statuses: ["in_diagnostics", "diagnostics_done", "quote_pending", "quote_sent"], color: "#a78bfa" },
  { label: "Oczekiwanie", statuses: ["waiting_for_parts", "quote_accepted"],                               color: "#f59e0b" },
  { label: "W naprawie",  statuses: ["in_repair", "repair_done", "in_testing", "testing_passed", "testing_failed"], color: "#60a5fa" },
  { label: "Gotowe",      statuses: ["ready_for_pickup", "picked_up", "shipped", "delivered"],             color: "#22c55e" },
] as const;

const PIPELINE_CLOSED = ["cancelled", "unrepairable", "abandoned"];

const SUBMISSION_TABS = [
  { key: "new",      label: "Nowe",              sub: "Ostatnio przyjęte — czekają na przetworzenie", href: "/admin-panel/repairs?status=new",              accent: "#3b82f6" },
  { key: "repair",   label: "W naprawie",         sub: "Aktywne naprawy w toku",                       href: "/admin-panel/repairs?status=in_repair",        accent: "#f59e0b" },
  { key: "waiting",  label: "Czeka na części",    sub: "Naprawy oczekujące na dostawę",                href: "/admin-panel/repairs?status=waiting_for_parts", accent: "#a78bfa" },
  { key: "ready",    label: "Gotowe do odbioru",  sub: "Gotowe do odbioru oraz wysłane kurierem",     href: "/admin-panel/repairs?status=ready_for_pickup",  accent: "#22c55e" },
  { key: "unassigned", label: "Nieprzypisane",    sub: "Naprawy bez przypisanego technika",           href: "/admin-panel/unassigned",                       accent: "#ef4444" },
] as const;

type SubmissionTabKey = typeof SUBMISSION_TABS[number]["key"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPln(v: string | number | null | undefined): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0 zł";
  return Math.round(n).toLocaleString("pl-PL") + " zł";
}

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function relativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" });
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
}

function assignedInfo(
  assigned: RepairRequestListItem["assigned_to"],
): { name: string; inits: string } | null {
  if (!assigned) return null;
  if (typeof assigned === "string") return null;
  const name = [assigned.first_name, assigned.last_name].filter(Boolean).join(" ") || assigned.email;
  return { name, inits: initials(name) };
}

function statusBadge(item: RepairRequestListItem) {
  const display = (item.public_status ?? item.status_display ?? "").trim();
  const s = (item.status ?? "").toLowerCase();
  const tags = item.auto_tags ?? [];

  if (s === "ready_for_pickup")
    return { bg: "rgba(34,197,94,.14)", border: "rgba(34,197,94,.30)", text: "#22c55e", label: display || "Gotowe do odbioru" };
  if (s === "waiting_for_parts" || tags.includes("czeka_na_czesc"))
    return { bg: "rgba(245,158,11,.16)", border: "rgba(245,158,11,.30)", text: "#f59e0b", label: display || "Oczekiwanie" };
  if (s === "cancelled")
    return { bg: "rgba(220,30,30,.14)", border: "rgba(220,30,30,.28)", text: "#dc1e1e", label: display || "Anulowane" };
  if (s === "unrepairable")
    return { bg: "rgba(249,115,22,.14)", border: "rgba(249,115,22,.28)", text: "#f97316", label: display || "Nieopłacalna" };
  if (["picked_up", "shipped", "delivered"].includes(s))
    return { bg: "rgba(34,197,94,.10)", border: "rgba(34,197,94,.20)", text: "#4ade80", label: display || "Zamknięta" };
  if (s === "new" || s === "accepted")
    return { bg: "rgba(59,130,246,.12)", border: "rgba(59,130,246,.28)", text: "#60a5fa", label: display || "Nowe" };
  return { bg: "rgba(59,130,246,.14)", border: "rgba(59,130,246,.28)", text: "#3b82f6", label: display || "W trakcie" };
}

function alertClass(severity: AlertSeverity): string {
  if (severity === "red") return "border-[var(--rb)] bg-[var(--rl)] text-[#ffb4b4]";
  if (severity === "amber") return "border-[var(--ab)] bg-[var(--al)] text-[#ffe3b0]";
  return "border-[var(--bb)] bg-[var(--bl)] text-[#bcd6ff]";
}

function notifPriorityColor(priority: string): string {
  if (priority === "urgent") return "#ef4444";
  if (priority === "important") return "#f59e0b";
  if (priority === "low") return "#525b6e";
  return "#3b82f6";
}

function notifTypeLabel(type: string): string {
  const map: Record<string, string> = {
    repair_assigned: "Przypisano",
    client_message: "Wiadomość",
    new_message: "Wiadomość",
    new_unassigned: "Nieprzypisane",
    sla_exceeded: "SLA",
    sla_warning: "SLA",
    quote_accepted: "Wycena",
    quote_rejected: "Wycena",
    status_changed: "Status",
    part_arrived: "Części",
    mentioned: "Wzmianka",
    complaint: "Reklamacja",
  };
  return map[type] ?? "Info";
}

// ─── WorkloadChart ────────────────────────────────────────────────────────────

function WorkloadChart({ repairs }: { repairs: RepairRequestListItem[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const entries = useMemo<WorkloadEntry[]>(() => {
    const techMap = new Map<string, { name: string; inits: string; count: number }>();
    let unassignedCount = 0;

    for (const r of repairs) {
      if (!r.assigned_to) {
        unassignedCount++;
      } else if (typeof r.assigned_to === "object") {
        const id = r.assigned_to.id;
        const name =
          [r.assigned_to.first_name, r.assigned_to.last_name].filter(Boolean).join(" ") ||
          r.assigned_to.email;
        const prev = techMap.get(id) ?? { name, inits: initials(name), count: 0 };
        techMap.set(id, { ...prev, count: prev.count + 1 });
      }
    }

    const assigned: WorkloadEntry[] = Array.from(techMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([id, d], i) => ({ id, ...d, color: TECH_COLORS[i % TECH_COLORS.length], isUnassigned: false }));

    if (unassignedCount > 0)
      assigned.push({ id: "__unassigned", name: "Nieprzypisane", inits: "—", count: unassignedCount, color: "#ef4444", isUnassigned: true });

    return assigned;
  }, [repairs]);

  const maxCount = Math.max(...entries.map((e) => e.count), 1);
  const total = repairs.length;
  const unassignedEntry = entries.find((e) => e.isUnassigned);

  if (total === 0) {
    return (
      <div className="flex h-44 items-center justify-center">
        <p className="text-sm text-[var(--muted)]">Brak aktywnych napraw.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Summary row */}
      <div className="mb-5 flex items-end gap-3">
        <div>
          <p className="text-3xl font-bold tabular-nums text-[var(--white)]">{total}</p>
          <p className="text-[11px] uppercase tracking-wider text-[var(--muted)]">aktywnych zleceń</p>
        </div>
        {unassignedEntry && (
          <div className="mb-1 rounded-full border border-[#ef4444]/30 bg-[#ef4444]/10 px-2.5 py-1 text-[11px] font-bold text-[#ef4444]">
            {unassignedEntry.count} bez technika
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        {entries.map((entry) => {
          const isHov = hovered === entry.id;
          const isDim = hovered !== null && !isHov;
          const barPct = Math.round((entry.count / maxCount) * 100);

          return (
            <div
              key={entry.id}
              className="flex cursor-default items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/[0.03]"
              style={{ opacity: isDim ? 0.22 : 1, transition: "opacity .15s" }}
              onMouseEnter={() => setHovered(entry.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Avatar */}
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  background: entry.color + "1a",
                  border: `1.5px solid ${entry.color}${isHov ? "88" : "33"}`,
                  color: entry.color,
                  boxShadow: isHov ? `0 0 14px ${entry.color}44` : "none",
                  transition: "box-shadow .15s, border-color .15s",
                }}
              >
                {entry.inits}
              </div>

              {/* Name + bar */}
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-semibold transition-colors"
                  style={{ color: isHov ? "var(--white)" : "var(--ink2)" }}
                >
                  {entry.name}
                </p>
                <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(barPct, entry.count > 0 ? 4 : 0)}%`,
                      background: `linear-gradient(90deg, ${entry.color}66, ${entry.color})`,
                      boxShadow: isHov ? `0 0 10px ${entry.color}99` : `0 0 4px ${entry.color}33`,
                      transition: "width .65s cubic-bezier(.4,0,.2,1), box-shadow .15s",
                    }}
                  />
                </div>
              </div>

              {/* Count badge */}
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums transition-all"
                style={{
                  background: isHov ? entry.color + "22" : "transparent",
                  color: isHov ? entry.color : "var(--white)",
                  border: isHov ? `1px solid ${entry.color}44` : "1px solid transparent",
                  transition: "background .15s, color .15s, border-color .15s",
                }}
              >
                {entry.count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dashData, setDashData] = useState<AdminDashboardResponse | null>(null);
  const [recentRepairs, setRecentRepairs] = useState<RepairRequestListItem[]>([]);
  const [tabRepairs, setTabRepairs] = useState<Record<SubmissionTabKey, RepairRequestListItem[]>>({ new: [], repair: [], waiting: [], ready: [], unassigned: [] });
  const [allActiveRepairs, setAllActiveRepairs] = useState<RepairRequestListItem[]>([]);
  const [activeTab, setActiveTab] = useState<SubmissionTabKey>("new");
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<StaffNotificationItem[]>([]);
  const [staffPeriod, setStaffPeriod] = useState(30);
  const [staffList, setStaffList] = useState<TopStaffItem[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [partsSummary, setPartsSummary] = useState<PartsDashboardSummary | null>(null);
  const [activeBucket, setActiveBucket] = useState<PartsBucketKey>("to_order");

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      // API uses repeated status_in params: ?status_in=X&status_in=Y (not status__in=X,Y)
      const si = (...ss: string[]) => ss.map((s) => `status_in=${s}`).join("&");
      const IN_REPAIR_PARAMS  = si("in_diagnostics","diagnostics_done","quote_pending","quote_sent","quote_accepted","waiting_for_parts","in_repair","repair_done","in_testing","testing_failed","testing_passed");
      const READY_PARAMS       = si("ready_for_pickup","shipped");
      const ALL_ACTIVE_PARAMS  = si("new","accepted","in_diagnostics","diagnostics_done","quote_pending","quote_sent","quote_accepted","waiting_for_parts","in_repair","repair_done","in_testing","testing_failed","testing_passed");
      const [dash, repairsRes, newRes, repairRes, waitingRes, readyRes, unassignedRes, notifRes, partsRes] = await Promise.all([
        api.get<AdminDashboardResponse>("/analytics/admin-dashboard/?days=30", token),
        api.get<{ results?: RepairRequestListItem[] }>("/repairs/?page_size=20&ordering=-updated_at", token),
        api.get<{ results?: RepairRequestListItem[] }>("/repairs/?status=new&ordering=-created_at&page_size=20", token),
        api.get<{ results?: RepairRequestListItem[] }>(`/repairs/?${IN_REPAIR_PARAMS}&ordering=-updated_at&page_size=20`, token),
        api.get<{ results?: RepairRequestListItem[] }>("/repairs/?status=waiting_for_parts&ordering=-updated_at&page_size=20", token),
        api.get<{ results?: RepairRequestListItem[] }>(`/repairs/?${READY_PARAMS}&ordering=-updated_at&page_size=20`, token),
        api.get<{ results?: RepairRequestListItem[] }>(`/repairs/?${ALL_ACTIVE_PARAMS}&ordering=-updated_at&page_size=50`, token),
        api.get<{ count: number; results: StaffNotificationItem[] }>("/accounts/notifications/admin/?limit=20", token),
        api.get<PartsDashboardSummary>("/inventory/parts-dashboard-summary/", token),
      ]);
      const newItems        = newRes?.results        ?? [];
      const repairItems     = repairRes?.results     ?? [];
      const waitingItems    = waitingRes?.results    ?? [];
      const readyItems      = readyRes?.results      ?? [];
      const allActive       = unassignedRes?.results ?? [];
      const unassignedItems = allActive
        .filter((r) => !r.assigned_to)
        .sort((a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime());
      setDashData(dash ?? null);
      setRecentRepairs(repairsRes?.results ?? []);
      setAllActiveRepairs(allActive);
      setTabRepairs({ new: newItems, repair: repairItems, waiting: waitingItems, ready: readyItems, unassigned: unassignedItems });
      setStaffList(dash?.tables?.top_staff ?? []);
      setStaffPeriod(30);
      setNotifications(notifRes?.results ?? []);
      setPartsSummary(partsRes ?? null);

      const built: DashboardAlert[] = [];
      const unassignedCount = (repairsRes?.results ?? []).filter((r) => !r.assigned_to).length;
      if (unassignedCount > 0)
        built.push({ type: "unassigned", count: unassignedCount, title: `${unassignedCount} napraw bez przypisanego pracownika`, severity: "red", href: "/admin-panel/unassigned" });
      const waitingResponse = (repairsRes?.results ?? []).filter((r) => r.status === "waiting_for_quote_approval").length;
      if (waitingResponse > 0)
        built.push({ type: "waiting_response", count: waitingResponse, title: `${waitingResponse} klientów czeka na odpowiedź`, severity: "blue", href: "/admin-panel/comm" });
      const unclaimedCount = (dash?.tables?.unclaimed_repairs ?? []).length;
      if (unclaimedCount > 0)
        built.push({ type: "uncollected_7d", count: unclaimedCount, title: `${unclaimedCount} urządzeń gotowych nieodebranych >7 dni`, severity: "red", href: "/admin-panel/pickups" });
      const overdueCount = toNum(dash?.kpi?.overdue_count);
      if (overdueCount > 0)
        built.push({ type: "sla_overdue", count: overdueCount, title: `${overdueCount} napraw z przekroczonym terminem`, severity: "amber", href: "/admin-panel/repairs?status=in_progress" });
      setAlerts(built);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Nie udało się pobrać danych dashboardu."));
      setDashData(null);
      setRecentRepairs([]);
      setAllActiveRepairs([]);
      setTabRepairs({ new: [], repair: [], waiting: [], ready: [], unassigned: [] });
      setAlerts([]);
      setNotifications([]);
      setStaffList([]);
      setPartsSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  const handleStaffPeriod = async (days: number) => {
    if (days === staffPeriod) return;
    setStaffPeriod(days);
    if (!token) return;
    setStaffLoading(true);
    try {
      const res = await api.get<AdminDashboardResponse>(`/analytics/admin-dashboard/?days=${days}`, token);
      setStaffList(res?.tables?.top_staff ?? []);
    } catch {
      // silent — keep existing list
    } finally {
      setStaffLoading(false);
    }
  };

  const kpiCards = useMemo(() => {
    const kpi = dashData?.kpi;
    return [
      { label: "Przychód mies.", value: fmtPln(kpi?.revenue_total ?? "0"), sub: "robocizna + części", accent: "#22c55e", onClick: () => router.push("/admin-panel/stats"), clickable: true },
      { label: "W naprawie", value: toNum(kpi?.in_progress_count), sub: "aktywne zlecenia", accent: "#f59e0b", onClick: () => router.push("/admin-panel/repairs?status=in_progress"), clickable: true },
      { label: "Nowe zgłoszenia", value: toNum(kpi?.new_count), sub: "czeka na przetworzenie", accent: "#3b82f6", onClick: () => router.push("/admin-panel/repairs?status=new"), clickable: true },
      { label: "Gotowe do odbioru", value: toNum(kpi?.ready_for_pickup_count), sub: "urządzeń do odbioru", accent: "#a78bfa", onClick: () => router.push("/admin-panel/pickups"), clickable: true },
    ];
  }, [dashData, router]);

  const pipeline = useMemo(() => {
    const byStatus = dashData?.charts?.repairs_by_status ?? {};
    const stages = PIPELINE_STAGES.map((s) => ({
      ...s,
      count: s.statuses.reduce((acc, key) => acc + toNum(byStatus[key]), 0),
    }));
    const total = stages.reduce((a, s) => a + s.count, 0) || 1;
    const closed = PIPELINE_CLOSED.reduce((a, key) => a + toNum(byStatus[key]), 0);
    return { stages, total, closed };
  }, [dashData]);


  if (!isAdmin) {
    return (
      <main className="mx-auto min-h-screen max-w-[1500px] px-5 py-8">
        <p className="text-sm text-[#fca5a5]">Tylko administrator.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[1500px] flex-col gap-4 overflow-x-hidden px-3 py-4 pb-24 sm:gap-6 sm:px-5 sm:py-8 sm:pb-8">

      {/* ── Header ── */}
      <header className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink2)]">Panel administratora</p>
          <h1 className="mt-2 text-xl font-semibold text-[var(--white)] sm:text-2xl">Dashboard</h1>
          <p className="mt-1 max-w-[38ch] text-sm text-[var(--muted)]">KPI zarządcze oraz alerty wymagające reakcji zespołu.</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading || !token}
          className="rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2.5 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)] disabled:opacity-60"
        >
          Odśwież
        </button>
      </header>

      {/* ── Loading ── */}
      {loading && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
          </section>
          <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5"><StackedRowSkeleton rows={4} /></div>
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5"><StackedRowSkeleton rows={5} /></div>
          </section>
          <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5"><StackedRowSkeleton rows={6} /></div>
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5"><StackedRowSkeleton rows={5} /></div>
          </section>
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5"><StackedRowSkeleton rows={4} /></div>
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5"><StackedRowSkeleton rows={10} /></div>
        </>
      )}

      {/* ── Error ── */}
      {!loading && error && <ErrorState error={error} onRetry={() => void load()} />}

      {/* ── Content ── */}
      {!loading && !error && dashData && (
        <>
          {/* ── Row 1: KPI cards ── */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiCards.map((card) => (
              <article
                key={card.label}
                onClick={card.onClick}
                className={`relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,.04)] transition ${
                  card.clickable ? "cursor-pointer hover:brightness-105 hover:border-white/20" : ""
                }`}
              >
                <div className="absolute left-0 top-0 h-full w-[3px]" style={{ background: card.accent }} />
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink2)]">{card.label}</p>
                <p className="mt-2 text-3xl font-semibold text-[var(--white)]">{card.value}</p>
                {card.sub && <p className="mt-1 text-xs text-[var(--muted)]">{card.sub}</p>}
                {card.clickable && <p className="mt-2 text-[11px] font-semibold text-[#3b82f6]">Szczegóły →</p>}
              </article>
            ))}
          </section>

          {/* ── Row 2: Pipeline + Donut chart ── */}
          <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">

            {/* Premium Pipeline */}
            <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4 sm:p-6">
              <div className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">Warsztat</div>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--white)]">Pipeline statusów</h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">Rozkład aktywnych napraw według etapów</p>
                </div>
                <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start sm:gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold tabular-nums text-[var(--white)]">
                      {pipeline.stages.reduce((a, s) => a + s.count, 0)}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">aktywnych</p>
                  </div>
                  <Link href="/admin-panel/repairs" className="text-sm font-semibold text-[#3b82f6] hover:underline">
                    Wszystkie →
                  </Link>
                </div>
              </div>

              <div className="space-y-1">
                {pipeline.stages.map((stage, i) => {
                  const pct = Math.round((stage.count / pipeline.total) * 100);
                  const isHov = hoveredStage === i;
                  const isDim = hoveredStage !== null && !isHov;
                  return (
                    <Link
                      key={stage.label}
                      href={`/admin-panel/repairs?status=${stage.statuses[0]}`}
                      className="flex items-center gap-2 rounded-2xl px-2 py-3 transition-colors hover:bg-white/[0.03] sm:gap-4 sm:px-3 sm:py-3.5"
                      style={{ opacity: isDim ? 0.3 : 1, transition: "opacity .15s" }}
                      onMouseEnter={() => setHoveredStage(i)}
                      onMouseLeave={() => setHoveredStage(null)}
                    >
                      {/* Dot + label */}
                      <div className="flex w-24 shrink-0 items-center gap-2 sm:w-32 sm:gap-2.5">
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            background: stage.color,
                            boxShadow: isHov ? `0 0 10px ${stage.color}` : "none",
                            transform: isHov ? "scale(1.5)" : "scale(1)",
                            transition: "transform .15s, box-shadow .15s",
                          }}
                        />
                        <span
                          className="text-sm font-medium transition-colors"
                          style={{ color: isHov ? "var(--white)" : "var(--ink2)" }}
                        >
                          {stage.label}
                        </span>
                      </div>

                      {/* Bar */}
                      <div
                        className="relative flex-1 overflow-hidden rounded-full bg-white/[0.05]"
                        style={{ height: isHov ? "12px" : "8px", transition: "height .2s" }}
                      >
                        <div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{
                            width: `${Math.max(pct, stage.count > 0 ? 2 : 0)}%`,
                            background: `linear-gradient(90deg, ${stage.color}88, ${stage.color})`,
                            boxShadow: isHov ? `0 0 18px ${stage.color}88` : stage.count > 0 ? `0 0 8px ${stage.color}33` : "none",
                            transition: "width .7s cubic-bezier(.4,0,.2,1), box-shadow .15s",
                          }}
                        />
                      </div>

                      {/* Count */}
                      <div className="w-12 shrink-0 text-right sm:w-16">
                        <span
                          className="text-lg font-bold tabular-nums transition-colors sm:text-xl"
                          style={{ color: isHov ? stage.color : "var(--white)" }}
                        >
                          {stage.count}
                        </span>
                        {pct > 0 && (
                          <span className="ml-1 text-[10px] text-[var(--muted)]">{pct}%</span>
                        )}
                      </div>
                    </Link>
                  );
                })}

                {pipeline.closed > 0 && (
                  <div
                    className="mt-1 flex items-center gap-2 rounded-2xl border-t border-white/5 px-2 py-3 pt-4 sm:gap-4 sm:px-3 sm:py-3.5"
                    style={{ opacity: hoveredStage !== null ? 0.2 : 0.45 }}
                  >
                    <div className="flex w-24 shrink-0 items-center gap-2 sm:w-32 sm:gap-2.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
                      <span className="text-sm font-medium text-[var(--muted)]">Anulowane</span>
                    </div>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full w-full rounded-full bg-white/10" />
                    </div>
                    <div className="w-12 text-right sm:w-16">
                      <span className="text-lg font-bold tabular-nums text-[var(--muted)] sm:text-xl">{pipeline.closed}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Workload per technician */}
            <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4 sm:p-5">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">Zespół</div>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--white)]">Obciążenie techników</h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">Aktywne zlecenia na teraz</p>
                </div>
                <Link href="/admin-panel/workload" className="shrink-0 text-sm font-semibold text-[#3b82f6] hover:underline">
                  Workload →
                </Link>
              </div>
              <WorkloadChart repairs={allActiveRepairs} />
            </div>
          </section>

          {/* ── Row 3: Centrum uwagi + Last activity ── */}
          <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">

            {/* Centrum uwagi */}
            <div className="relative flex min-w-0 flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--s1)]">
              {/* Subtle top gradient accent */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              <div className="flex flex-col gap-0 p-4 sm:p-6">
                {/* Header */}
                <div className="mb-6 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--ink2)]">Operacje</p>
                    <h2 className="mt-1.5 text-xl font-semibold text-[var(--white)]">Centrum uwagi</h2>
                    <p className="mt-1 text-xs text-[var(--muted)]">Alerty, nieprzypisane zlecenia i powiadomienia</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {alerts.length > 0 && (
                      <span className="flex items-center gap-1.5 rounded-full border border-[#ef4444]/35 bg-[#ef4444]/12 px-3 py-1.5 text-[11px] font-bold text-[#ef4444]">
                        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#ef4444]" />
                        {alerts.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Section 1: Alerty ── */}
                <div className="mb-5">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Alerty</span>
                  </div>
                  <div className="space-y-1.5">
                    {alerts.length === 0 ? (
                      <div className="flex items-center gap-3 rounded-2xl border border-[#22c55e]/20 bg-[#22c55e]/[0.06] px-4 py-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#22c55e]/30 bg-[#22c55e]/15 text-[11px] font-bold text-[#22c55e]">✓</div>
                        <p className="text-sm font-medium text-[#86efac]">Brak alertów — warsztat działa sprawnie.</p>
                      </div>
                    ) : (
                      alerts.map((alert) => {
                        const accentColor = alert.severity === "red" ? "#ef4444" : alert.severity === "amber" ? "#f59e0b" : "#3b82f6";
                        return (
                          <button
                            key={alert.type}
                            type="button"
                            onClick={() => router.push(alert.href)}
                            className={`group relative w-full overflow-hidden rounded-2xl border px-4 py-3 text-left transition hover:brightness-110 ${alertClass(alert.severity)}`}
                          >
                            <div className="absolute inset-y-0 left-0 w-[3px] rounded-l-2xl" style={{ background: accentColor }} />
                            <div className="flex items-center gap-3 pl-2">
                              <span className="flex-1 text-[13px] font-semibold leading-snug">{alert.title}</span>
                              <span className="shrink-0 text-xs font-bold opacity-40 transition group-hover:opacity-90">→</span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* ── Divider ── */}
                <div className="mb-5 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

                {/* ── Section 2: Nieprzypisane ── */}
                <div className="mb-5">
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Nieprzypisane</span>
                      {tabRepairs.unassigned.length > 0 && (
                        <span className="rounded-full border border-[#ef4444]/30 bg-[#ef4444]/12 px-2 py-px text-[10px] font-bold text-[#ef4444]">
                          {tabRepairs.unassigned.length}
                        </span>
                      )}
                    </div>
                    <Link href="/admin-panel/unassigned" className="text-[11px] font-semibold text-[#60a5fa] transition hover:text-[#93c5fd]">
                      Wszystkie →
                    </Link>
                  </div>
                  {tabRepairs.unassigned.length === 0 ? (
                    <p className="text-xs text-[var(--muted)]">Wszystkie naprawy mają przypisanego technika.</p>
                  ) : (
                    <div className="max-h-[132px] space-y-1.5 overflow-y-auto pr-0 sm:max-h-[160px] sm:pr-1 [scrollbar-color:rgba(255,255,255,.12)_transparent] [scrollbar-width:thin]">
                      {tabRepairs.unassigned.map((r) => (
                        <Link
                          key={r.id}
                          href={`/admin-panel/repairs/${r.id}`}
                          className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-[#ef4444]/14 bg-[#ef4444]/[0.04] px-4 py-3 transition hover:border-[#ef4444]/28 hover:bg-[#ef4444]/[0.08]"
                        >
                          <div className="absolute inset-y-0 left-0 w-[3px] rounded-l-2xl bg-[#ef4444]/60" />
                          <div className="min-w-0 flex-1 pl-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[12px] font-bold text-[var(--white)]">{r.repair_number}</span>
                            </div>
                            <p className="mt-0.5 truncate text-[11px] text-[var(--muted)]">{r.client_name} · {r.device_name}</p>
                          </div>
                          <span className="shrink-0 text-[10px] tabular-nums text-[var(--muted)]">{relativeTime(r.created_at)}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Divider ── */}
                <div className="mb-5 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

                {/* ── Section 3: Powiadomienia ── */}
                <div>
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Powiadomienia</span>
                      {notifications.length > 0 && (
                        <span className="rounded-full border border-[#3b82f6]/30 bg-[#3b82f6]/12 px-2 py-px text-[10px] font-bold text-[#60a5fa]">
                          {notifications.length}
                        </span>
                      )}
                    </div>
                    <Link href="/admin-panel/notifications" className="text-[11px] font-semibold text-[#60a5fa] transition hover:text-[#93c5fd]">
                      Wszystkie →
                    </Link>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-[var(--muted)]">Brak nowych powiadomień.</p>
                  ) : (
                    <div className="max-h-[220px] space-y-1.5 overflow-y-auto pr-0 sm:max-h-[260px] sm:pr-1 [scrollbar-color:rgba(255,255,255,.12)_transparent] [scrollbar-width:thin]">
                      {notifications.map((n) => {
                        const dot = notifPriorityColor(n.priority);
                        const label = notifTypeLabel(n.notification_type);
                        return (
                          <div
                            key={n.id}
                            className="flex items-start gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.025] px-4 py-3 transition hover:border-white/10 hover:bg-white/[0.04]"
                          >
                            {/* Priority indicator */}
                            <div
                              className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                              style={{ background: dot + "18", border: `1px solid ${dot}35` }}
                            >
                              <div className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className="rounded-md border px-1.5 py-px text-[9px] font-bold uppercase tracking-wider"
                                  style={{ background: dot + "12", borderColor: dot + "28", color: dot }}
                                >
                                  {label}
                                </span>
                                {n.repair_number && (
                                  <span className="font-mono text-[10px] font-semibold text-[var(--ink2)]">{n.repair_number}</span>
                                )}
                              </div>
                              <p className="mt-1 truncate text-[12px] font-medium leading-snug text-[var(--white)]">{n.title}</p>
                            </div>
                            <span className="mt-[3px] shrink-0 text-[10px] tabular-nums text-[var(--muted)]">{relativeTime(n.created_at)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Top staff performance */}
            <div className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4 sm:p-6">
              {/* Header + period filter */}
              <div className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:flex-wrap">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--ink2)]">Zespół</p>
                  <h2 className="mt-1.5 text-lg font-semibold text-[var(--white)]">Wyniki techników</h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">Przychód i ukończone naprawy</p>
                </div>
                {/* Period tabs */}
                <div className="flex w-full items-center gap-0.5 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--row-hover)] p-0.5 sm:w-auto">
                  {STAFF_PERIODS.map((p) => (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => void handleStaffPeriod(p.days)}
                      disabled={staffLoading}
                      className="shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all disabled:opacity-50"
                      style={
                        staffPeriod === p.days
                          ? { background: "var(--s1)", color: "var(--white)", boxShadow: "0 1px 4px rgba(0,0,0,.35)" }
                          : { color: "var(--muted)" }
                      }
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              {staffLoading ? (
                <div className="flex flex-1 items-center justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-[#3b82f6]" />
                </div>
              ) : staffList.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center">
                  <p className="text-sm text-[var(--ink2)]">Brak danych w tym okresie.</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">Dane pojawią się po zamknięciu napraw.</p>
                </div>
              ) : (() => {
                const maxRev = Math.max(...staffList.map((s) => toNum(s.revenue)), 1);
                const totalRev = staffList.reduce((sum, s) => sum + toNum(s.revenue), 0);
                const rankStyle = ["#f59e0b", "#94a3b8", "#b45309"] as const;
                return (
                  <>
                    <div className="space-y-1">
                      {staffList.slice(0, 8).map((staff, i) => {
                        const rev = toNum(staff.revenue);
                        const barPct = Math.round((rev / maxRev) * 100);
                        const color = TECH_COLORS[i % TECH_COLORS.length];
                        return (
                          <div
                            key={staff.user_id}
                            className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-white/[0.03]"
                          >
                            {/* Rank */}
                            <span
                              className="w-4 shrink-0 text-center text-[11px] font-bold tabular-nums"
                              style={{ color: i < 3 ? rankStyle[i] : "var(--muted)" }}
                            >
                              {i + 1}
                            </span>
                            {/* Avatar */}
                            <div
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                              style={{
                                background: color + "20",
                                border: `1.5px solid ${color}44`,
                                color,
                              }}
                            >
                              {initials(staff.full_name)}
                            </div>
                            {/* Name + bar */}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-semibold text-[var(--white)]">{staff.full_name}</p>
                              <div className="mt-1.5 h-[4px] overflow-hidden rounded-full bg-white/[0.06]">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.max(barPct, rev > 0 ? 3 : 0)}%`,
                                    background: `linear-gradient(90deg, ${color}55, ${color})`,
                                    transition: "width .7s cubic-bezier(.4,0,.2,1)",
                                  }}
                                />
                              </div>
                            </div>
                            {/* Revenue + repairs */}
                            <div className="shrink-0 text-right">
                              <p className="text-[13px] font-bold text-[#22c55e]">{fmtPln(rev)}</p>
                              <p className="text-[10px] tabular-nums text-[var(--muted)]">{staff.completed_repairs} napraw</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Total */}
                    <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
                      <span className="text-xs text-[var(--muted)]">
                        Łącznie · {STAFF_PERIODS.find((p) => p.days === staffPeriod)?.label}
                      </span>
                      <span className="text-base font-bold text-[#22c55e]">{fmtPln(totalRev)}</span>
                    </div>
                  </>
                );
              })()}

              {/* ── Części — status ── */}
              {partsSummary && (() => {
                const bucket = PARTS_BUCKETS.find((b) => b.key === activeBucket)!;
                const items = partsSummary[activeBucket].items;
                const totalParts = PARTS_BUCKETS.reduce((s, b) => s + partsSummary[b.key].count, 0);
                return (
                  <div className="mt-5 border-t border-white/[0.06] pt-5">
                    {/* Sub-header */}
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Części</span>
                        {totalParts > 0 && (
                          <span className="rounded-full border border-white/10 bg-white/[0.05] px-1.5 py-px text-[10px] font-bold text-[var(--ink2)]">
                            {totalParts}
                          </span>
                        )}
                      </div>
                      <Link href="/admin-panel/parts" className="text-[11px] font-semibold text-[#60a5fa] transition hover:text-[#93c5fd]">
                        Zarządzaj →
                      </Link>
                    </div>

                    {/* Bucket tabs */}
                    <div className="mb-3 flex gap-1 overflow-x-auto pb-0.5">
                      {PARTS_BUCKETS.map((b) => {
                        const cnt = partsSummary[b.key].count;
                        const isActive = activeBucket === b.key;
                        return (
                          <button
                            key={b.key}
                            type="button"
                            onClick={() => setActiveBucket(b.key)}
                            className="flex min-w-[118px] shrink-0 items-center justify-center gap-1.5 rounded-xl border py-2 text-[11px] font-semibold transition-all sm:min-w-0 sm:flex-1"
                            style={
                              isActive
                                ? { borderColor: b.color + "40", background: b.color + "14", color: b.color }
                                : { borderColor: "transparent", background: "rgba(255,255,255,.03)", color: "var(--muted)" }
                            }
                          >
                            <span className="truncate">{b.label}</span>
                            {cnt > 0 && (
                              <span
                                className="shrink-0 rounded-full px-1.5 text-[9px] font-bold"
                                style={
                                  isActive
                                    ? { background: b.color + "25", color: b.color }
                                    : { background: "rgba(255,255,255,.07)", color: "var(--muted)" }
                                }
                              >
                                {cnt}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Items */}
                    {items.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/[0.07] px-3 py-4 text-center">
                        <p className="text-xs text-[var(--muted)]">Brak części w tej kategorii.</p>
                      </div>
                    ) : (
                      <div className="max-h-[168px] space-y-1 overflow-y-auto pr-0.5 [scrollbar-color:rgba(255,255,255,.10)_transparent] [scrollbar-width:thin]">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 transition hover:bg-white/[0.04]"
                          >
                            <div className="mt-px h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: bucket.color }} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[12px] font-semibold text-[var(--white)]">
                                {item.custom_part_name ?? "—"}
                              </p>
                              <div className="mt-0.5 flex items-center gap-1.5">
                                {item.repair_number && (
                                  <span className="font-mono text-[10px] text-[var(--ink2)]">{item.repair_number}</span>
                                )}
                                {item.repair_device_name && (
                                  <span className="truncate text-[10px] text-[var(--muted)]">· {item.repair_device_name}</span>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className="text-[11px] font-bold text-[var(--white)]">×{item.quantity}</span>
                              {item.expected_arrival_date && (
                                <p className="text-[9px] text-[var(--muted)]">
                                  {new Date(item.expected_arrival_date).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" })}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </section>

          {/* ── Row 4: Submissions with tabs ── */}
          {(() => {
            const tab = SUBMISSION_TABS.find((t) => t.key === activeTab)!;
            const items = tabRepairs[activeTab];
            return (
              <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4 sm:p-5">
                {/* Header */}
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">Zgłoszenia</div>
                    <h2 className="mt-1 text-lg font-semibold text-[var(--white)]">{tab.label}</h2>
                    <p className="mt-1 text-xs text-[var(--muted)]">{tab.sub}</p>
                  </div>
                  <Link href={tab.href} className="text-sm font-semibold text-[#3b82f6] hover:underline">
                    Wszystkie →
                  </Link>
                </div>

                {/* Tabs */}
                <div className="mb-4 flex gap-1.5 overflow-x-auto pb-0.5">
                  {SUBMISSION_TABS.map((t) => {
                    const count = tabRepairs[t.key].length;
                    const isActive = activeTab === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setActiveTab(t.key)}
                        className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all"
                        style={
                          isActive
                            ? { borderColor: t.accent + "55", background: t.accent + "18", color: t.accent }
                            : { borderColor: "var(--border)", background: "var(--row-hover)", color: "var(--ink2)" }
                        }
                      >
                        {t.label}
                        {count > 0 && (
                          <span
                            className="rounded-full px-1.5 text-[10px] font-bold"
                            style={
                              isActive
                                ? { background: t.accent + "30", color: t.accent }
                                : { background: "rgba(255,255,255,.08)", color: "var(--muted)" }
                            }
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Cards */}
                {items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center">
                    <p className="text-sm text-[var(--ink2)]">Brak zgłoszeń w tej kategorii.</p>
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {items.map((r) => {
                      const badge = statusBadge(r);
                      const assigned = assignedInfo(r.assigned_to);
                      return (
                        <Link
                          key={r.id}
                          href={`/admin-panel/repairs/${r.id}`}
                          className="group flex flex-col gap-2.5 rounded-2xl border border-[var(--border)] bg-[var(--s2)] p-4 transition hover:border-white/15 hover:bg-[var(--row-hover)]"
                          style={{ borderTopColor: tab.accent, borderTopWidth: "2px" }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-mono text-xs font-bold text-[var(--white)]">{r.repair_number}</span>
                            <span className="shrink-0 text-[10px] text-[var(--muted)]">{relativeTime(r.created_at)}</span>
                          </div>
                          <div>
                            <p className="truncate text-sm font-semibold text-[var(--white)]">{r.client_name}</p>
                            <p className="mt-0.5 truncate text-xs text-[var(--muted)]">{r.device_name}</p>
                          </div>
                          <div className="mt-auto flex flex-wrap items-center gap-1.5">
                            <span
                              className="rounded-full border px-2 py-px text-[10px] font-semibold"
                              style={{ background: badge.bg, borderColor: badge.border, color: badge.text }}
                            >
                              {badge.label}
                            </span>
                            {!assigned && (
                              <span className="rounded-full border border-[var(--rb)] bg-[var(--rl)] px-2 py-px text-[10px] font-semibold text-[#ffb4b4]">
                                Nieprzypisane
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })()}

          {/* ── Row 5: Enhanced last activity ── */}
          <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4 sm:p-5">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">Aktywność</div>
                <h2 className="mt-1 text-lg font-semibold text-[var(--white)]">Ostatnia aktywność</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">Ostatnio zaktualizowane naprawy w warsztacie</p>
              </div>
              <Link href="/admin-panel/repairs" className="shrink-0 text-sm font-semibold text-[#3b82f6] hover:underline">
                Wszystkie
              </Link>
            </div>

            {/* Column headers */}
            {recentRepairs.length > 0 && (
              <div className="mb-1 hidden grid-cols-[144px_1fr_32px_120px_80px_48px] items-center gap-4 px-4 sm:grid">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">Nr zlecenia</span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">Klient / Urządzenie</span>
                <span />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">Status</span>
                <span className="text-right text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">Kwota</span>
                <span className="text-right text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">Czas</span>
              </div>
            )}

            {recentRepairs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center">
                <p className="text-sm text-[var(--ink2)]">Brak niedawnej aktywności.</p>
              </div>
            ) : (
              <div className="max-h-[380px] space-y-1 overflow-y-auto pr-0 sm:max-h-[448px] sm:pr-1 [scrollbar-color:rgba(255,255,255,.12)_transparent] [scrollbar-width:thin]">
                {recentRepairs.map((r) => {
                  const badge = statusBadge(r);
                  const assigned = assignedInfo(r.assigned_to);
                  const cost = toNum(r.final_cost) > 0 ? r.final_cost : toNum(r.estimated_cost) > 0 ? r.estimated_cost : null;
                  const costLabel = toNum(r.final_cost) > 0 ? fmtPln(r.final_cost) : cost ? `~${fmtPln(r.estimated_cost)}` : null;
                  const costColor = toNum(r.final_cost) > 0 ? "#22c55e" : "var(--muted)";
                  return (
                    <Link
                      key={r.id}
                      href={`/admin-panel/repairs/${r.id}`}
                      className="group flex flex-col items-start gap-2 rounded-2xl border bg-[var(--s1)] px-3 py-3 transition hover:border-white/15 hover:bg-[var(--row-hover)] sm:flex-row sm:items-center sm:gap-4 sm:px-4 sm:py-3.5"
                      style={{
                        borderColor: "var(--border)",
                        borderLeftColor: badge.text,
                        borderLeftWidth: "2px",
                      }}
                    >
                      {/* Repair number */}
                      <span className="w-full shrink-0 truncate font-mono text-xs font-bold text-[var(--white)] sm:w-36">
                        {r.repair_number ?? r.id}
                      </span>

                      {/* Client + device */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--white)]">{r.client_name ?? "—"}</p>
                        <p className="truncate text-xs text-[var(--muted)]">{r.device_name ?? ""}</p>
                      </div>

                      {/* Assigned tech avatar */}
                      <div className="hidden sm:block">
                        {assigned ? (
                          <div
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 text-[10px] font-bold"
                            style={{ background: "rgba(255,255,255,.06)", color: "var(--ink2)" }}
                            title={assigned.name}
                          >
                            {assigned.inits}
                          </div>
                        ) : (
                          <div
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed border-white/15"
                            title="Nieprzypisane"
                          >
                            <span className="text-[9px] text-[var(--muted)]">—</span>
                          </div>
                        )}
                      </div>

                      {/* Status badge */}
                      <span
                        className="hidden w-28 shrink-0 rounded-full border px-2.5 py-0.5 text-center text-[11px] font-semibold sm:inline-flex sm:items-center sm:justify-center"
                        style={{ background: badge.bg, borderColor: badge.border, color: badge.text }}
                      >
                        {badge.label}
                      </span>

                      {/* Cost */}
                      <span
                        className="hidden w-20 shrink-0 text-right text-xs font-semibold lg:block"
                        style={{ color: costColor }}
                      >
                        {costLabel ?? "—"}
                      </span>

                      {/* Time */}
                      <span className="w-full shrink-0 text-right text-[11px] text-[var(--muted)] sm:w-12">
                        {relativeTime((r as any).updated_at)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function AdminDashboardBottomNavPortal() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <nav
      className="dashboard-mobile-hard-nav border-t border-[var(--border)] bg-[var(--s1)]/95 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] pt-2 backdrop-blur-xl"
      style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 2147483647 }}
    >
      <ul className="grid grid-cols-5 gap-1">
        <li><Link href="/admin-panel/dashboard" className="flex min-h-[52px] items-center justify-center rounded-xl text-xs font-semibold text-[var(--white)]">Start</Link></li>
        <li><Link href="/admin-panel/repairs" className="flex min-h-[52px] items-center justify-center rounded-xl text-xs font-semibold text-[var(--ink2)]">Naprawy</Link></li>
        <li><Link href="/admin-panel/tasks" className="flex min-h-[52px] items-center justify-center rounded-xl text-xs font-semibold text-[var(--ink2)]">Zadania</Link></li>
        <li><Link href="/admin-panel/notif" className="flex min-h-[52px] items-center justify-center rounded-xl text-xs font-semibold text-[var(--ink2)]">Alerty</Link></li>
        <li><Link href="/admin-panel/profil" className="flex min-h-[52px] items-center justify-center rounded-xl text-xs font-semibold text-[var(--ink2)]">Profil</Link></li>
      </ul>
    </nav>,
    document.body,
  );
}
