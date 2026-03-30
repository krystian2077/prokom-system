"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton, StatCardSkeleton, StackedRowSkeleton } from "@/components/ui/Skeleton";
import type { RepairRequestListItem } from "@/types/repairs";

// ─── Types (matching /analytics/admin-dashboard/) ───────────────────────────

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

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtPln(valueStr: string | number): string {
  const n = Number(valueStr);
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
  return `${Math.floor(diff / 86400)}d`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

function statusBadge(item: RepairRequestListItem) {
  const display = (item.public_status ?? item.status_display ?? "").trim();
  const s = (item.status ?? "").toLowerCase();
  const tags = item.auto_tags ?? [];

  if (s === "ready_for_pickup")
    return { bg: "rgba(34,197,94,.14)", border: "rgba(34,197,94,.30)", text: "#22c55e", label: display || "Gotowe do odbioru" };
  if (s === "waiting_for_parts" || tags.includes("czeka_na_czesc"))
    return { bg: "rgba(245,158,11,.16)", border: "rgba(245,158,11,.30)", text: "#f59e0b", label: display || "Oczekiwanie na części" };
  if (s === "cancelled")
    return { bg: "rgba(220,30,30,.14)", border: "rgba(220,30,30,.28)", text: "#dc1e1e", label: display || "Anulowane" };
  if (s === "unrepairable")
    return { bg: "rgba(249,115,22,.14)", border: "rgba(249,115,22,.28)", text: "#f97316", label: display || "Nieopłacalna" };
  if (["picked_up", "shipped", "delivered"].includes(s))
    return { bg: "rgba(34,197,94,.10)", border: "rgba(34,197,94,.20)", text: "#4ade80", label: display || "Zamknięta" };
  return { bg: "rgba(59,130,246,.14)", border: "rgba(59,130,246,.28)", text: "#3b82f6", label: display || "W trakcie" };
}

function alertClassBySeverity(severity: AlertSeverity): string {
  if (severity === "red") return "border-[var(--rb)] bg-[var(--rl)] text-[#ffb4b4]";
  if (severity === "amber") return "border-[var(--ab)] bg-[var(--al)] text-[#ffe3b0]";
  return "border-[var(--bb)] bg-[var(--bl)] text-[#bcd6ff]";
}

// ─── Pipeline config ─────────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  { label: "Nowe",        statuses: ["new", "accepted"],                                                  color: "#3b82f6" },
  { label: "Diagnostyka", statuses: ["in_diagnostics", "diagnostics_done", "quote_pending", "quote_sent"], color: "#a78bfa" },
  { label: "Oczekiwanie", statuses: ["waiting_for_parts", "quote_accepted"],                              color: "#f59e0b" },
  { label: "W naprawie",  statuses: ["in_repair", "repair_done", "in_testing", "testing_passed", "testing_failed"], color: "#60a5fa" },
  { label: "Gotowe",      statuses: ["ready_for_pickup", "picked_up", "shipped", "delivered"],            color: "#22c55e" },
] as const;

const PIPELINE_CLOSED = ["cancelled", "unrepairable", "abandoned"];

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dashData, setDashData] = useState<AdminDashboardResponse | null>(null);
  const [recentRepairs, setRecentRepairs] = useState<RepairRequestListItem[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [dash, repairsRes] = await Promise.all([
        api.get<AdminDashboardResponse>("/analytics/admin-dashboard/?days=30", token),
        api.get<{ results?: RepairRequestListItem[] }>("/repairs/?page_size=8&ordering=-updated_at", token),
      ]);
      setDashData(dash ?? null);
      setRecentRepairs(repairsRes?.results ?? []);

      // Build alerts from repair list (legacy) + admin dashboard tables
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

  // ── KPI cards ──────────────────────────────────────────────────────────────
  const kpiCards = useMemo(() => {
    const kpi = dashData?.kpi;
    return [
      {
        label: "Przychód mies.",
        value: fmtPln(kpi?.revenue_total ?? "0"),
        sub: "robocizna + części",
        accent: "#22c55e",
        onClick: () => router.push("/admin-panel/stats"),
        clickable: true,
      },
      {
        label: "W naprawie",
        value: toNum(kpi?.in_progress_count),
        sub: undefined,
        accent: "#f59e0b",
        onClick: undefined,
        clickable: false,
      },
      {
        label: "Nowe zgłoszenia",
        value: toNum(kpi?.new_count),
        sub: "czeka na przetworzenie",
        accent: "#3b82f6",
        onClick: undefined,
        clickable: false,
      },
      {
        label: "Gotowe do odbioru",
        value: toNum(kpi?.ready_for_pickup_count),
        sub: "urządzeń do odbioru",
        accent: "#a78bfa",
        onClick: () => router.push("/admin-panel/pickups"),
        clickable: true,
      },
    ];
  }, [dashData, router]);

  // ── Pipeline ───────────────────────────────────────────────────────────────
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
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5"><StackedRowSkeleton rows={5} /></div>
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5"><StackedRowSkeleton rows={8} /></div>
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
                {card.clickable && (
                  <p className="mt-2 text-[11px] font-semibold text-[#3b82f6]">Szczegóły →</p>
                )}
              </article>
            ))}
          </section>

          {/* ── Row 2: Alerty + Obciążenie zespołu ── */}
          <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">

            {/* Alerty zarządcze */}
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">Zarządzanie</div>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--white)]">Alerty zarządcze</h2>
                </div>
                <span className="rounded-full border border-[var(--border)] bg-[var(--row-hover)] px-3 py-1 text-[11px] font-semibold text-[var(--ink2)]">
                  Aktywne: {alerts.length}
                </span>
              </div>
              {alerts.length === 0 ? (
                <p className="rounded-xl border border-[var(--gb)] bg-[var(--gl)] px-3 py-2 text-sm text-[#bbf7d0]">
                  Brak aktywnych alertów. Warsztat działa sprawnie.
                </p>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <button
                      key={alert.type}
                      type="button"
                      onClick={() => router.push(alert.href)}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition hover:brightness-110 ${alertClassBySeverity(alert.severity)}`}
                    >
                      {alert.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Obciążenie zespołu */}
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
              <div className="mt-4">
                {dashData.tables.top_staff.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-[var(--s1)]/80 px-4 py-5 text-center">
                    <p className="text-sm text-[var(--ink2)]">Brak danych o zespole.</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">Dane pojawią się po zamknięciu pierwszych napraw.</p>
                  </div>
                ) : (
                  <div>
                    {dashData.tables.top_staff.slice(0, 6).map((staff) => (
                      <div key={staff.user_id} className="flex items-center gap-3 border-b border-[var(--border)] py-2.5 last:border-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--row-hover)] text-[11px] font-semibold text-[var(--ink2)]">
                          {initials(staff.full_name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[var(--white)]">{staff.full_name}</p>
                          <p className="text-xs text-[var(--muted)]">{staff.completed_repairs} napraw</p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-[#22c55e]">{fmtPln(staff.revenue)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── Row 3: Pipeline statusów ── */}
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">Warsztat</div>
                <h2 className="mt-1 text-lg font-semibold text-[var(--white)]">Pipeline statusów</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">Rozkład aktywnych napraw według etapów</p>
              </div>
              <Link href="/admin-panel/repairs" className="shrink-0 text-sm font-semibold text-[#3b82f6] hover:underline">
                Wszystkie naprawy
              </Link>
            </div>
            <div className="space-y-3">
              {pipeline.stages.map((stage) => {
                const pct = Math.round((stage.count / pipeline.total) * 100);
                return (
                  <div key={stage.label} className="flex items-center gap-4">
                    <div className="w-28 shrink-0">
                      <span className="text-sm font-medium text-[var(--ink2)]">{stage.label}</span>
                    </div>
                    <div className="flex-1 overflow-hidden rounded-full bg-[var(--row-hover)]" style={{ height: "8px" }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: stage.color }}
                      />
                    </div>
                    <div className="w-10 shrink-0 text-right text-sm font-semibold text-[var(--white)]">
                      {stage.count}
                    </div>
                  </div>
                );
              })}
              {pipeline.closed > 0 && (
                <div className="flex items-center gap-4 pt-1">
                  <div className="w-28 shrink-0">
                    <span className="text-sm font-medium text-[var(--muted)]">Anulowane</span>
                  </div>
                  <div className="flex-1 overflow-hidden rounded-full bg-[var(--row-hover)]" style={{ height: "8px" }}>
                    <div className="h-full rounded-full bg-white/15" style={{ width: "100%" }} />
                  </div>
                  <div className="w-10 shrink-0 text-right text-sm font-semibold text-[var(--muted)]">
                    {pipeline.closed}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── Row 4: Aktywność dziś ── */}
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
            {recentRepairs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-[var(--s1)]/80 px-4 py-6 text-center">
                <p className="text-sm text-[var(--ink2)]">Brak niedawnej aktywności.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentRepairs.map((r) => {
                  const badge = statusBadge(r);
                  return (
                    <Link
                      key={r.id}
                      href={`/admin-panel/repairs/${r.id}`}
                      className="group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-4 py-3 transition hover:bg-[var(--row-hover)]"
                    >
                      <span className="w-40 shrink-0 font-mono text-xs font-semibold text-[var(--white)]">
                        {r.repair_number ?? r.id}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-[var(--ink2)]">
                        {r.client_name ?? "—"}
                      </span>
                      <span
                        className="shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                        style={{ background: badge.bg, borderColor: badge.border, color: badge.text }}
                      >
                        {badge.label}
                      </span>
                      <span className="w-10 shrink-0 text-right text-[11px] text-[var(--muted)]">
                        {relativeTime(r.updated_at)}
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
