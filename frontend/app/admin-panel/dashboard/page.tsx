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

type DonutSegment = { label: string; count: number; revenue: string; color: string };

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

// ─── DonutChart ───────────────────────────────────────────────────────────────

function DonutChart({ segments }: { segments: DonutSegment[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const total = segments.reduce((s, d) => s + d.count, 0);
  const GAP = 0.022;
  const R = 78, R_HOV = 84, INNER = 52, CX = 100, CY = 100;

  const arcs = useMemo(() => {
    if (total === 0) return [];
    const totalSweep = 2 * Math.PI - GAP * segments.length;
    let angle = -Math.PI / 2;

    return segments.map((seg) => {
      const sweep = (seg.count / total) * totalSweep;
      const end = angle + sweep;
      const large = sweep > Math.PI ? 1 : 0;

      const makePath = (outerR: number) => {
        const x1 = CX + outerR * Math.cos(angle), y1 = CY + outerR * Math.sin(angle);
        const x2 = CX + outerR * Math.cos(end),   y2 = CY + outerR * Math.sin(end);
        const ix1 = CX + INNER * Math.cos(end),   iy1 = CY + INNER * Math.sin(end);
        const ix2 = CX + INNER * Math.cos(angle), iy2 = CY + INNER * Math.sin(angle);
        return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${outerR} ${outerR} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L${ix1.toFixed(2)} ${iy1.toFixed(2)} A${INNER} ${INNER} 0 ${large} 0 ${ix2.toFixed(2)} ${iy2.toFixed(2)}Z`;
      };

      const result = {
        ...seg,
        normal: makePath(R),
        expanded: makePath(R_HOV),
        pct: Math.round((seg.count / total) * 100),
      };
      angle = end + GAP;
      return result;
    });
  }, [segments, total]);

  if (total === 0) {
    return (
      <div className="flex h-44 items-center justify-center">
        <p className="text-sm text-[var(--muted)]">Brak danych — zamknij pierwsze naprawy.</p>
      </div>
    );
  }

  const active = hovered !== null ? arcs[hovered] : null;

  return (
    <div className="flex items-center gap-4">
      <svg
        width="200" height="200" viewBox="0 0 200 200"
        className="shrink-0"
        style={{ overflow: "visible" }}
      >
        {arcs.map((arc, i) => (
          <path
            key={arc.label}
            d={hovered === i ? arc.expanded : arc.normal}
            fill={arc.color}
            style={{
              opacity: hovered !== null && hovered !== i ? 0.22 : 1,
              transition: "opacity .15s",
              cursor: "pointer",
              filter: hovered === i ? `drop-shadow(0 0 8px ${arc.color}88)` : "none",
            }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
        <text x="100" y="89" textAnchor="middle" fontSize="23" fontWeight="700" fill="white">
          {active ? active.count : total}
        </text>
        <text x="100" y="108" textAnchor="middle" fontSize="10" fill="#8b93a8">
          {active ? active.label.split(" ")[0] : "napraw"}
        </text>
        {active && (
          <text x="100" y="123" textAnchor="middle" fontSize="9" fill="#22c55e">
            {fmtPln(active.revenue)}
          </text>
        )}
      </svg>

      <div className="flex-1 space-y-0.5">
        {arcs.map((arc, i) => (
          <div
            key={arc.label}
            className="flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-white/5"
            style={{ opacity: hovered !== null && hovered !== i ? 0.35 : 1, transition: "opacity .15s" }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: arc.color }} />
            <span className="min-w-0 flex-1 truncate text-sm text-[var(--ink2)]">{arc.label}</span>
            <span className="shrink-0 text-[11px] text-[var(--muted)]">{arc.pct}%</span>
            <span className="w-5 shrink-0 text-right text-sm font-bold text-[var(--white)]">{arc.count}</span>
          </div>
        ))}
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
  const [newSubmissions, setNewSubmissions] = useState<RepairRequestListItem[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [dash, repairsRes, newRes] = await Promise.all([
        api.get<AdminDashboardResponse>("/analytics/admin-dashboard/?days=30", token),
        api.get<{ results?: RepairRequestListItem[] }>("/repairs/?page_size=10&ordering=-updated_at", token),
        api.get<{ results?: RepairRequestListItem[] }>("/repairs/?status__in=new,accepted&ordering=-created_at&page_size=8", token),
      ]);
      setDashData(dash ?? null);
      setRecentRepairs(repairsRes?.results ?? []);
      setNewSubmissions(newRes?.results ?? []);

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
      setNewSubmissions([]);
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

  const techSegments = useMemo<DonutSegment[]>(() => {
    return (dashData?.tables?.top_staff ?? [])
      .filter((s) => s.completed_repairs > 0)
      .map((s, i) => ({
        label: s.full_name,
        count: s.completed_repairs,
        revenue: s.revenue,
        color: TECH_COLORS[i % TECH_COLORS.length],
      }));
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

          {/* ── Row 2: Alerts + Team workload ── */}
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

          {/* ── Row 3: Pipeline + Donut chart ── */}
          <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">

            {/* Pipeline */}
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5">
              <div className="mb-5 flex items-end justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">Warsztat</div>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--white)]">Pipeline statusów</h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">Rozkład aktywnych napraw według etapów</p>
                </div>
                <Link href="/admin-panel/repairs" className="shrink-0 text-sm font-semibold text-[#3b82f6] hover:underline">
                  Wszystkie naprawy
                </Link>
              </div>
              <div className="space-y-4">
                {pipeline.stages.map((stage) => {
                  const pct = Math.round((stage.count / pipeline.total) * 100);
                  return (
                    <div key={stage.label} className="flex items-center gap-4">
                      <div className="flex w-28 shrink-0 items-center gap-2">
                        <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: stage.color }} />
                        <span className="text-sm font-medium text-[var(--ink2)]">{stage.label}</span>
                      </div>
                      <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${stage.color}bb, ${stage.color})`,
                            boxShadow: stage.count > 0 ? `0 0 8px ${stage.color}44` : "none",
                            transition: "width .6s cubic-bezier(.4,0,.2,1)",
                          }}
                        />
                      </div>
                      <div className="w-14 shrink-0 text-right">
                        <span className="text-sm font-bold text-[var(--white)]">{stage.count}</span>
                        <span className="ml-1 text-[10px] text-[var(--muted)]">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
                {pipeline.closed > 0 && (
                  <div className="flex items-center gap-4 border-t border-white/5 pt-3">
                    <div className="flex w-28 shrink-0 items-center gap-2">
                      <div className="h-2 w-2 shrink-0 rounded-full bg-white/20" />
                      <span className="text-sm font-medium text-[var(--muted)]">Anulowane</span>
                    </div>
                    <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full w-full rounded-full bg-white/12" />
                    </div>
                    <div className="w-14 shrink-0 text-right">
                      <span className="text-sm font-bold text-[var(--muted)]">{pipeline.closed}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Donut: repair distribution per technician */}
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">Zespół</div>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--white)]">Rozkład napraw</h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">Ukończone naprawy per technik — 30 dni</p>
                </div>
                <Link href="/admin-panel/workload" className="shrink-0 text-sm font-semibold text-[#3b82f6] hover:underline">
                  Workload
                </Link>
              </div>
              <DonutChart segments={techSegments} />
            </div>
          </section>

          {/* ── Row 4: New submissions ── */}
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">Zgłoszenia</div>
                <h2 className="mt-1 text-lg font-semibold text-[var(--white)]">Nowe zgłoszenia</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">Ostatnio przyjęte — czekają na przetworzenie</p>
              </div>
              <div className="flex items-center gap-3">
                {toNum(dashData.kpi.new_count) > 0 && (
                  <span className="rounded-full border border-[#3b82f6]/30 bg-[#3b82f6]/12 px-2.5 py-1 text-[11px] font-bold text-[#60a5fa]">
                    {dashData.kpi.new_count} oczekuje
                  </span>
                )}
                <Link href="/admin-panel/repairs?status=new" className="text-sm font-semibold text-[#3b82f6] hover:underline">
                  Wszystkie →
                </Link>
              </div>
            </div>

            {newSubmissions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center">
                <p className="text-sm text-[var(--ink2)]">Brak nowych zgłoszeń.</p>
                <p className="mt-1 text-xs text-[var(--muted)]">Wszystkie zgłoszenia zostały przetworzone.</p>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {newSubmissions.map((r) => {
                  const pAccent = priorityAccent(r.priority);
                  const badge = statusBadge(r);
                  const assigned = assignedInfo(r.assigned_to);
                  return (
                    <Link
                      key={r.id}
                      href={`/admin-panel/repairs/${r.id}`}
                      className="group flex flex-col gap-2.5 rounded-2xl border border-[var(--border)] bg-[var(--s2)] p-4 transition hover:border-white/15 hover:bg-[var(--row-hover)]"
                      style={{ borderTopColor: pAccent, borderTopWidth: "2px" }}
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
              <div className="space-y-1">
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
