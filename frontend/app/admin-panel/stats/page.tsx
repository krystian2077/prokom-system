"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorState } from "@/components/ui/ErrorState";
import type { RepairRequestListItem } from "@/types/repairs";

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

type TimePoint = { period: string; count: number; revenue: string };

type AdminDashboardResponse = {
  period_days: number;
  kpi: AdminDashboardKpi;
  tables: {
    most_overdue: RepairRequestListItem[];
    no_quote_repairs: RepairRequestListItem[];
    unclaimed_repairs: RepairRequestListItem[];
    active_complaints: RepairRequestListItem[];
    active_warranties: RepairRequestListItem[];
    top_staff: Array<{
      user_id: string;
      full_name: string;
      email: string;
      completed_repairs: number;
      revenue: string;
    }>;
  };
  charts: {
    repairs_by_status: Record<string, number>;
    repairs_over_time: TimePoint[];
  };
};

const DAY_OPTIONS = [7, 30, 90] as const;

function fmtPln(valueStr: string) {
  const n = Number(valueStr);
  if (!Number.isFinite(n)) return valueStr;
  return Math.round(n).toLocaleString("pl-PL") + " zł";
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-[#9ca3af]">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      {sub ? <div className="mt-1 text-xs text-[#6b7280]">{sub}</div> : null}
    </div>
  );
}

function RepairRow({ r }: { r: RepairRequestListItem }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/5 py-2 last:border-0">
      <div className="min-w-0">
        <Link
          href={`/admin-panel/repairs/${r.id}`}
          className="text-sm font-semibold text-white hover:underline"
        >
          {r.repair_number}
        </Link>
        <p className="mt-0.5 truncate text-xs text-[#9ca3af]">
          {r.device_name} · {r.client_name}
        </p>
      </div>
      <span className="shrink-0 text-xs text-[#9ca3af]">{r.status_display}</span>
    </div>
  );
}

function SimpleBarChart({ points }: { points: TimePoint[] }) {
  const max = useMemo(() => Math.max(1, ...points.map((p) => p.count)), [points]);
  if (!points.length) {
    return <p className="text-sm text-[#6b7280]">Brak danych w wybranym okresie.</p>;
  }
  const last = points.slice(-14);
  return (
    <div className="flex h-40 items-end gap-1">
      {last.map((p) => {
        const h = Math.round((p.count / max) * 100);
        const label = p.period.slice(5, 10).replace("-", ".");
        return (
          <div key={p.period} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full min-h-[4px] rounded-t bg-gradient-to-t from-[#3b82f6]/40 to-[#60a5fa]"
              style={{ height: `${Math.max(8, h)}%` }}
              title={`${p.period}: ${p.count} napraw`}
            />
            <span className="text-[9px] text-[#6b7280]">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function StatusBreakdown({ byStatus }: { byStatus: Record<string, number> }) {
  const entries = useMemo(
    () =>
      Object.entries(byStatus)
        .filter(([, c]) => c > 0)
        .sort((a, b) => b[1] - a[1]),
    [byStatus],
  );
  const max = useMemo(() => Math.max(1, ...entries.map(([, c]) => c)), [entries]);
  if (!entries.length) {
    return <p className="text-sm text-[#6b7280]">Brak danych.</p>;
  }
  return (
    <ul className="space-y-2">
      {entries.slice(0, 12).map(([key, count]) => (
        <li key={key}>
          <div className="flex justify-between gap-2 text-xs">
            <span className="truncate font-medium text-[#d1d5db]">{key.replace(/_/g, " ")}</span>
            <span className="shrink-0 text-[#9ca3af]">{count}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#6366f1]/80"
              style={{ width: `${Math.round((count / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function AdminStatsPage() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const daysParam = Number(searchParams.get("days"));
  const days = DAY_OPTIONS.includes(daysParam as (typeof DAY_OPTIONS)[number]) ? daysParam : 30;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<AdminDashboardResponse | null>(null);

  const load = useCallback(async () => {
    if (!token || !isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<AdminDashboardResponse>(
        `/analytics/admin-dashboard/?days=${days}`,
        token,
      );
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Nie udało się pobrać statystyk."));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, days]);

  useEffect(() => {
    void load();
  }, [load]);

  const setDays = (d: number) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("days", String(d));
    router.replace(`${pathname}?${next.toString()}`);
  };

  const kpi = data?.kpi;

  if (!isAdmin) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
        <p className="text-sm text-[#fca5a5]">Tylko administrator.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#9ca3af]">Panel Admina</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Statystyki</h1>
          <p className="mt-1 text-sm text-[#9ca3af]">
            KPI, naprawy w czasie, rozkład statusów oraz tabele operacyjne (endpoint admin-dashboard).
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
              Okres
            </label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-[170px] rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {DAY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d} dni
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            Odśwież
          </button>
        </div>
      </header>

      {error ? (
        <div className="mb-6">
          <ErrorState error={error} onRetry={() => void load()} />
        </div>
      ) : null}

      {loading && !data ? (
        <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-6 text-sm text-[#9ca3af]">
          Ładowanie…
        </div>
      ) : null}

      {data && kpi ? (
        <>
          <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Nowe" value={kpi.new_count} />
            <StatCard label="W toku" value={kpi.in_progress_count} />
            <StatCard label="Gotowe do odbioru" value={kpi.ready_for_pickup_count} />
            <StatCard label="Zaległe (termin)" value={kpi.overdue_count} />
            <StatCard label="Nieodebrane >7 dni" value={kpi.unclaimed_count} />
            <StatCard label="Przychód (zakończone)" value={fmtPln(kpi.revenue_total)} />
            <StatCard label="Wartość wycen" value={fmtPln(kpi.quote_value_total)} />
            <StatCard
              label="Reklamacje / gwarancje"
              value={`${kpi.complaints_count} / ${kpi.warranties_count}`}
              sub="w okresie (utworzone)"
            />
          </section>

          <section className="mb-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Wykres</p>
              <h2 className="mt-2 text-lg font-semibold text-white">Nowe naprawy (dziennie)</h2>
              <p className="mt-1 text-xs text-[#6b7280]">Ostatnie 14 punktów z serii czasowej.</p>
              <div className="mt-4">
                <SimpleBarChart points={data.charts?.repairs_over_time ?? []} />
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Rozkład</p>
              <h2 className="mt-2 text-lg font-semibold text-white">Statusy (okres)</h2>
              <p className="mt-1 text-xs text-[#6b7280]">Według utworzeń w wybranych dniach.</p>
              <div className="mt-4 max-h-52 overflow-y-auto pr-1">
                <StatusBreakdown byStatus={data.charts?.repairs_by_status ?? {}} />
              </div>
            </div>
          </section>

          <section className="mb-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
              <h2 className="text-lg font-semibold text-white">Najbardziej zaległe</h2>
              <div className="mt-3">
                {(data.tables?.most_overdue ?? []).length ? (
                  (data.tables.most_overdue ?? []).map((r) => <RepairRow key={r.id} r={r} />)
                ) : (
                  <p className="text-sm text-[#6b7280]">Brak.</p>
                )}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
              <h2 className="text-lg font-semibold text-white">Długo gotowe (nieodebrane)</h2>
              <div className="mt-3">
                {(data.tables?.unclaimed_repairs ?? []).length ? (
                  (data.tables.unclaimed_repairs ?? []).map((r) => <RepairRow key={r.id} r={r} />)
                ) : (
                  <p className="text-sm text-[#6b7280]">Brak.</p>
                )}
              </div>
            </div>
          </section>

          <section className="mb-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
              <h2 className="text-lg font-semibold text-white">Aktywne reklamacje</h2>
              <div className="mt-3">
                {(data.tables?.active_complaints ?? []).length ? (
                  (data.tables.active_complaints ?? []).map((r) => <RepairRow key={r.id} r={r} />)
                ) : (
                  <p className="text-sm text-[#6b7280]">Brak.</p>
                )}
              </div>
              <Link
                href="/admin-panel/reklamacje"
                className="mt-3 inline-block text-xs font-semibold text-[#93c5fd] hover:underline"
              >
                Wszystkie reklamacje →
              </Link>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
              <h2 className="text-lg font-semibold text-white">Aktywne gwarancje</h2>
              <div className="mt-3">
                {(data.tables?.active_warranties ?? []).length ? (
                  (data.tables.active_warranties ?? []).map((r) => <RepairRow key={r.id} r={r} />)
                ) : (
                  <p className="text-sm text-[#6b7280]">Brak.</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Ranking pracowników</h2>
              <p className="text-xs text-[#9ca3af]">
                Zakończone w okresie {data.period_days} dni (jak w panelu KPI).
              </p>
            </div>
            <div className="mt-3 divide-y divide-white/10">
              {(data.tables?.top_staff ?? []).map((it, idx) => (
                <div key={it.user_id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">
                      #{idx + 1}
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-white">{it.full_name}</p>
                    <p className="mt-0.5 truncate text-xs text-[#9ca3af]">{it.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#9ca3af]">Zakończone</p>
                    <p className="text-sm font-semibold text-white">{it.completed_repairs}</p>
                    <p className="mt-1 text-xs text-[#9ca3af]">Przychód</p>
                    <p className="text-sm font-semibold text-white">{fmtPln(it.revenue)}</p>
                  </div>
                </div>
              ))}
              {(data.tables?.top_staff ?? []).length === 0 ? (
                <p className="py-4 text-sm text-[#6b7280]">Brak danych.</p>
              ) : null}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
