"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton, StatCardSkeleton, StackedRowSkeleton } from "@/components/ui/Skeleton";
import type { RepairRequestListItem } from "@/types/repairs";

type RepairsResponse = {
  count: number;
  results: RepairRequestListItem[];
};

type KpiResponse = {
  repairs_total?: number;
  in_progress_count?: number;
  ready_for_pickup_count?: number;
  overdue_count?: number;
  revenue_total?: string | number;
  average_completion_days?: number | null;
};

type DashboardKpi = {
  repairsTotal: number;
  inProgress: number;
  readyForPickup: number;
  overdue: number;
  revenueTotal: string | number;
  avgCompletionDays: number | null;
};

type AlertSeverity = "red" | "amber" | "blue";

type DashboardAlert = {
  type: "unassigned" | "sla_overdue" | "waiting_response" | "uncollected";
  count: number;
  title: string;
  severity: AlertSeverity;
  href: string;
};

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtMoney(value: string | number): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0 zł";
  return `${Math.round(n).toLocaleString("pl-PL")} zł`;
}

function buildFallbackKpi(repairs: RepairRequestListItem[]): DashboardKpi {
  const inProgress = repairs.filter((r) => r.status === "in_progress").length;
  const readyForPickup = repairs.filter((r) => r.status === "ready_for_pickup").length;
  const overdue = repairs.filter((r) => Boolean((r as { sla_overdue?: boolean }).sla_overdue)).length;
  return {
    repairsTotal: repairs.length,
    inProgress,
    readyForPickup,
    overdue,
    revenueTotal: "0",
    avgCompletionDays: null,
  };
}

function buildAlerts(repairs: RepairRequestListItem[]): DashboardAlert[] {
  const unassigned = repairs.filter((r) => !r.assigned_to).length;
  const slaOverdue = repairs.filter((r) => Boolean((r as { sla_overdue?: boolean }).sla_overdue)).length;
  const waitingResponse = repairs.filter((r) => r.status === "waiting_for_quote_approval").length;
  const uncollected = repairs.filter((r) => {
    const daysWaiting = toNum((r as { days_waiting?: number }).days_waiting ?? r.waiting_for_client_days);
    return r.status === "ready_for_pickup" && daysWaiting > 3;
  }).length;

  const all: DashboardAlert[] = [
    {
      type: "unassigned",
      count: unassigned,
      title: `${unassigned} napraw bez przypisanego pracownika`,
      severity: "red",
      href: "/admin-panel/unassigned",
    },
    {
      type: "sla_overdue",
      count: slaOverdue,
      title: `${slaOverdue} napraw z przekroczonym SLA`,
      severity: "amber",
      href: "/admin-panel/repairs?status=in_progress",
    },
    {
      type: "waiting_response",
      count: waitingResponse,
      title: `${waitingResponse} klientów czeka na odpowiedź`,
      severity: "blue",
      href: "/admin-panel/comm",
    },
    {
      type: "uncollected",
      count: uncollected,
      title: `${uncollected} gotowych urządzeń nieodebranych >3 dni`,
      severity: "red",
      href: "/admin-panel/pickups",
    },
  ];

  return all.filter((a) => a.count > 0);
}

function alertClassBySeverity(severity: AlertSeverity): string {
  if (severity === "red") return "border-[var(--rb)] bg-[var(--rl)] text-[#ffb4b4]";
  if (severity === "amber") return "border-[var(--ab)] bg-[var(--al)] text-[#ffe3b0]";
  return "border-[var(--bb)] bg-[var(--bl)] text-[#bcd6ff]";
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [kpi, setKpi] = useState<DashboardKpi | null>(null);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const repairsRes = await api.get<RepairsResponse>("/repairs/?page_size=500", token);
      const repairs = repairsRes?.results ?? [];
      setAlerts(buildAlerts(repairs));

      let nextKpi: DashboardKpi | null = null;
      try {
        const kpiRes = await api.get<KpiResponse>("/analytics/kpi/", token);
        nextKpi = {
          repairsTotal: toNum(kpiRes?.repairs_total ?? repairsRes?.count),
          inProgress:
            toNum(kpiRes?.in_progress_count) || repairs.filter((r) => r.status === "in_progress").length,
          readyForPickup:
            toNum(kpiRes?.ready_for_pickup_count) ||
            repairs.filter((r) => r.status === "ready_for_pickup").length,
          overdue:
            toNum(kpiRes?.overdue_count) ||
            repairs.filter((r) => Boolean((r as { sla_overdue?: boolean }).sla_overdue)).length,
          revenueTotal: kpiRes?.revenue_total ?? "0",
          avgCompletionDays:
            typeof kpiRes?.average_completion_days === "number" ? kpiRes.average_completion_days : null,
        };
      } catch {
        nextKpi = buildFallbackKpi(repairs);
      }

      setKpi(nextKpi);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Nie udało się pobrać danych dashboardu."));
      setKpi(null);
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

  const kpiCards = useMemo(
    () => [
      { label: "Naprawy łącznie", value: kpi?.repairsTotal ?? 0, accent: "var(--blue)" },
      { label: "W naprawie", value: kpi?.inProgress ?? 0, accent: "var(--amber)" },
      { label: "Gotowe do odbioru", value: kpi?.readyForPickup ?? 0, accent: "var(--green)" },
      { label: "Przekroczone SLA", value: kpi?.overdue ?? 0, accent: "var(--red)" },
    ],
    [kpi],
  );

  if (!isAdmin) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
        <p className="text-sm text-[#fca5a5]">Tylko administrator.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Panel Admina</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-[#9ca3af]">KPI zarządcze oraz alerty wymagające reakcji zespołu.</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading || !token}
          className="h-[40px] rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white disabled:opacity-60"
        >
          Odśwież
        </button>
      </header>

      {loading ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </section>
          <section className="grid gap-4 lg:grid-cols-[1.2fr,.8fr]">
            <div className="rounded-2xl border border-white/10 bg-[#0c0d12] p-4">
              <StackedRowSkeleton rows={4} />
            </div>
            <div className="space-y-3 rounded-2xl border border-white/10 bg-[#0c0d12] p-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full max-w-sm" />
              <Skeleton className="h-4 w-3/4 max-w-xs" />
            </div>
          </section>
        </>
      ) : null}

      {!loading && error ? <ErrorState error={error} onRetry={() => void load()} /> : null}

      {!loading && !error && kpi ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiCards.map((card) => (
              <article key={card.label} className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c0d12] p-4">
                <div className="absolute left-0 top-0 h-full w-[2px]" style={{ background: card.accent }} />
                <p className="text-xs uppercase tracking-[0.18em] text-[#9ca3af]">{card.label}</p>
                <p className="mt-2 text-3xl font-semibold text-white">{card.value}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.2fr,.8fr]">
            <div className="rounded-2xl border border-white/10 bg-[#0c0d12] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-white">Alerty zarządcze</h2>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#9ca3af]">
                  Aktywne: {alerts.length}
                </span>
              </div>

              {alerts.length === 0 ? (
                <p className="rounded-xl border border-[var(--gb)] bg-[var(--gl)] px-3 py-2 text-sm text-[#bbf7d0]">
                  Brak aktywnych alertów.
                </p>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <button
                      key={alert.type}
                      type="button"
                      onClick={() => router.push(alert.href)}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition hover:brightness-110 ${alertClassBySeverity(
                        alert.severity,
                      )}`}
                    >
                      {alert.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0c0d12] p-4">
              <h2 className="text-lg font-semibold text-white">Kondycja operacyjna</h2>
              <p className="mt-1 text-sm text-[#9ca3af]">Podstawowe wskaźniki finansowe i czasowe z dashboardu admina.</p>
              <dl className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-[#9ca3af]">Przychód</dt>
                  <dd className="font-semibold text-white">{fmtMoney(kpi.revenueTotal)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-[#9ca3af]">Śr. czas naprawy</dt>
                  <dd className="font-semibold text-white">
                    {kpi.avgCompletionDays === null ? "Brak danych" : `${kpi.avgCompletionDays.toFixed(1)} dnia`}
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

