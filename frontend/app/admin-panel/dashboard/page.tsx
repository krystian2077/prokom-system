"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorState } from "@/components/ui/ErrorState";
import { StatCardSkeleton, StackedRowSkeleton } from "@/components/ui/Skeleton";
import type { RepairRequestListItem } from "@/types/repairs";

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

// ─── Constants ────────────────────────────────────────────────────────────────

const TECH_COLORS = [
  "#3b82f6", "#a78bfa", "#22c55e", "#f59e0b",
  "#f97316", "#ec4899", "#14b8a6", "#e11d48",
];

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

function priorityAccent(priority: string): string {
  const p = (priority ?? "").toLowerCase();
  if (p.includes("urgent") || p.includes("wysok") || p.includes("high")) return "#ef4444";
  if (p.includes("low") || p.includes("nisk")) return "#525b6e";
  return "#3b82f6";
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
      const [dash, repairsRes, newRes, repairRes, waitingRes, readyRes, unassignedRes] = await Promise.all([
        api.get<AdminDashboardResponse>("/analytics/admin-dashboard/?days=30", token),
        api.get<{ results?: RepairRequestListItem[] }>("/repairs/?page_size=20&ordering=-updated_at", token),
        api.get<{ results?: RepairRequestListItem[] }>("/repairs/?status=new&ordering=-created_at&page_size=20", token),
        api.get<{ results?: RepairRequestListItem[] }>(`/repairs/?${IN_REPAIR_PARAMS}&ordering=-updated_at&page_size=20`, token),
        api.get<{ results?: RepairRequestListItem[] }>("/repairs/?status=waiting_for_parts&ordering=-updated_at&page_size=20", token),
        api.get<{ results?: RepairRequestListItem[] }>(`/repairs/?${READY_PARAMS}&ordering=-updated_at&page_size=20`, token),
        api.get<{ results?: RepairRequestListItem[] }>(`/repairs/?${ALL_ACTIVE_PARAMS}&ordering=-updated_at&page_size=20`, token),
      ]);
      const newItems        = newRes?.results        ?? [];
      const repairItems     = repairRes?.results     ?? [];
      const waitingItems    = waitingRes?.results    ?? [];
      const readyItems      = readyRes?.results      ?? [];
      const allActive       = unassignedRes?.results ?? [];
      const unassignedItems = allActive.filter((r) => !r.assigned_to);
      setDashData(dash ?? null);
      setRecentRepairs(repairsRes?.results ?? []);
      setAllActiveRepairs(allActive);
      setTabRepairs({ new: newItems, repair: repairItems, waiting: waitingItems, ready: readyItems, unassigned: unassignedItems });

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  const kpiCards = useMemo(() => {
    const kpi = dashData?.kpi;
    return [
      { label: "Przychód mies.", value: fmtPln(kpi?.revenue_total ?? "0"), sub: "robocizna + części", accent: "#22c55e", onClick: () => router.push("/admin-panel/stats"), clickable: true },
      { label: "W naprawie", value: toNum(kpi?.in_progress_count), sub: undefined, accent: "#f59e0b", onClick: undefined, clickable: false },
      { label: "Nowe zgłoszenia", value: toNum(kpi?.new_count), sub: "czeka na przetworzenie", accent: "#3b82f6", onClick: undefined, clickable: false },
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
    <main className="mx-auto flex min-h-screen max-w-[1500px] flex-col gap-6 px-5 py-8">

      {/* ── Header ── */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink2)]">Panel administratora</p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--white)]">Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">KPI zarządcze oraz alerty wymagające reakcji zespołu.</p>
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
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">Warsztat</div>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--white)]">Pipeline statusów</h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">Rozkład aktywnych napraw według etapów</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
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
                      className="flex items-center gap-4 rounded-2xl px-3 py-3.5 transition-colors hover:bg-white/[0.03]"
                      style={{ opacity: isDim ? 0.3 : 1, transition: "opacity .15s" }}
                      onMouseEnter={() => setHoveredStage(i)}
                      onMouseLeave={() => setHoveredStage(null)}
                    >
                      {/* Dot + label */}
                      <div className="flex w-32 shrink-0 items-center gap-2.5">
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
                      <div className="w-16 shrink-0 text-right">
                        <span
                          className="text-xl font-bold tabular-nums transition-colors"
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
                    className="flex items-center gap-4 rounded-2xl px-3 py-3.5 border-t border-white/5 mt-1 pt-4"
                    style={{ opacity: hoveredStage !== null ? 0.2 : 0.45 }}
                  >
                    <div className="flex w-32 shrink-0 items-center gap-2.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
                      <span className="text-sm font-medium text-[var(--muted)]">Anulowane</span>
                    </div>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full w-full rounded-full bg-white/10" />
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-xl font-bold tabular-nums text-[var(--muted)]">{pipeline.closed}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Workload per technician */}
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5">
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

          {/* ── Row 3: Alerts + Team workload ── */}
          <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">

            {/* Alerts */}
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">Zarządzanie</div>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--white)]">Alerty zarządcze</h2>
                </div>
                <span className="rounded-full border border-[var(--border)] bg-[var(--row-hover)] px-3 py-1 text-[11px] font-semibold text-[var(--ink2)]">
                  Aktywne: {alerts.length}
                </span>
              </div>
              {alerts.length === 0 ? (
                <p className="rounded-xl border border-[var(--gb)] bg-[var(--gl)] px-3 py-3 text-sm text-[#bbf7d0]">
                  ✓&nbsp; Brak aktywnych alertów. Warsztat działa sprawnie.
                </p>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <button
                      key={alert.type}
                      type="button"
                      onClick={() => router.push(alert.href)}
                      className={`group w-full rounded-xl border px-4 py-3 text-left transition hover:brightness-110 ${alertClass(alert.severity)}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex-1 text-sm font-semibold">{alert.title}</span>
                        <span className="text-xs opacity-50 transition group-hover:opacity-100">→</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Team workload */}
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">Zespół</div>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--white)]">Obciążenie zespołu</h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">Top techników — ostatnie 30 dni</p>
                </div>
                <Link href="/admin-panel/workload" className="shrink-0 text-sm font-semibold text-[#3b82f6] hover:underline">
                  Workload
                </Link>
              </div>
              <div className="mt-4 space-y-0.5">
                {dashData.tables.top_staff.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 px-4 py-5 text-center">
                    <p className="text-sm text-[var(--ink2)]">Brak danych o zespole.</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">Dane pojawią się po zamknięciu pierwszych napraw.</p>
                  </div>
                ) : (
                  dashData.tables.top_staff.slice(0, 6).map((staff, i) => (
                    <div
                      key={staff.user_id}
                      className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-[var(--row-hover)]"
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                        style={{
                          background: TECH_COLORS[i % TECH_COLORS.length] + "22",
                          border: `1.5px solid ${TECH_COLORS[i % TECH_COLORS.length]}44`,
                          color: TECH_COLORS[i % TECH_COLORS.length],
                        }}
                      >
                        {initials(staff.full_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--white)]">{staff.full_name}</p>
                        <p className="text-xs text-[var(--muted)]">{staff.completed_repairs} napraw</p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-[#22c55e]">{fmtPln(staff.revenue)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* ── Row 4: Submissions with tabs ── */}
          {(() => {
            const tab = SUBMISSION_TABS.find((t) => t.key === activeTab)!;
            const items = tabRepairs[activeTab];
            return (
              <section className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5">
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
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {SUBMISSION_TABS.map((t) => {
                    const count = tabRepairs[t.key].length;
                    const isActive = activeTab === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setActiveTab(t.key)}
                        className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all"
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
                      const pAccent = priorityAccent(r.priority);
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
                            {r.priority && r.priority !== "normal" && (
                              <span
                                className="rounded-full border px-2 py-px text-[10px] font-semibold"
                                style={{ background: pAccent + "1a", borderColor: pAccent + "44", color: pAccent }}
                              >
                                {r.priority_display}
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
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5">
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
              <div className="max-h-[448px] space-y-1 overflow-y-auto pr-1 [scrollbar-color:rgba(255,255,255,.12)_transparent] [scrollbar-width:thin]">
                {recentRepairs.map((r) => {
                  const badge = statusBadge(r);
                  const pAccent = priorityAccent(r.priority);
                  const assigned = assignedInfo(r.assigned_to);
                  const cost = toNum(r.final_cost) > 0 ? r.final_cost : toNum(r.estimated_cost) > 0 ? r.estimated_cost : null;
                  const costLabel = toNum(r.final_cost) > 0 ? fmtPln(r.final_cost) : cost ? `~${fmtPln(r.estimated_cost)}` : null;
                  const costColor = toNum(r.final_cost) > 0 ? "#22c55e" : "var(--muted)";
                  return (
                    <Link
                      key={r.id}
                      href={`/admin-panel/repairs/${r.id}`}
                      className="group flex items-center gap-4 rounded-2xl border bg-[var(--s1)] px-4 py-3.5 transition hover:border-white/15 hover:bg-[var(--row-hover)]"
                      style={{
                        borderColor: "var(--border)",
                        borderLeftColor: pAccent,
                        borderLeftWidth: "2px",
                      }}
                    >
                      {/* Repair number */}
                      <span className="w-36 shrink-0 font-mono text-xs font-bold text-[var(--white)]">
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
                      <span className="w-12 shrink-0 text-right text-[11px] text-[var(--muted)]">
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
