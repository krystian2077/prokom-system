"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { RepairRequestListItem } from "@/types/repairs";
import { ErrorState } from "@/components/ui/ErrorState";
import { StatCardSkeleton, StackedRowSkeleton } from "@/components/ui/Skeleton";

type SummaryStatsResponse = {
  in_progress: number;
  overdue: number;
  ready_for_pickup: number;
  waiting_for_decision: number;
};

type HealthOverviewItem = {
  repair: RepairRequestListItem;
  issues: string[];
};

type HealthOverviewResponse = {
  yellow_count: number;
  red_count: number;
  yellow: HealthOverviewItem[];
  red: HealthOverviewItem[];
};

type StaffRankingItem = {
  user_id: string;
  full_name: string;
  email: string;
  completed_repairs: number;
  revenue: string;
};

type StaffRankingResponse = {
  period_days: number;
  ranking: StaffRankingItem[];
};

function fmtPln(valueStr: string) {
  const n = Number(valueStr);
  if (!Number.isFinite(n)) return valueStr;
  return Math.round(n).toLocaleString("pl-PL") + " zł";
}

function badgeStyleByKey(key: "green" | "amber" | "red" | "blue") {
  if (key === "red") return "border-[#dc1e1e]/35 bg-[#dc1e1e]/15 text-[#ffb4b4]";
  if (key === "amber") return "border-[#f59e0b]/35 bg-[#f59e0b]/15 text-[#ffe3b0]";
  if (key === "green") return "border-[#22c55e]/35 bg-[#22c55e]/15 text-[#bbf7d0]";
  return "border-[#3b82f6]/35 bg-[#3b82f6]/15 text-[#bcd6ff]";
}

function StatCard({
  label,
  value,
  accentClass,
}: {
  label: string;
  value: number;
  accentClass: string;
}) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-[var(--ink2)]">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-[var(--white)]">{value}</div>
      <div className="mt-3 inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink2)]">
        <span className={accentClass}>→</span> teraz
      </div>
    </div>
  );
}

export default function StatsAdminPage() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<SummaryStatsResponse | null>(null);
  const [health, setHealth] = useState<HealthOverviewResponse | null>(null);
  const [ranking, setRanking] = useState<StaffRankingResponse | null>(null);

  const [rankingDays, setRankingDays] = useState<number>(30);

  const loadAll = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [s, h, r] = await Promise.all([
        api.get<SummaryStatsResponse>(`/analytics/summary/`, token),
        api.get<HealthOverviewResponse>(`/analytics/health-overview/`, token),
        api.get<StaffRankingResponse>(`/analytics/staff-ranking/?days=${rankingDays}`, token),
      ]);
      setSummary(s);
      setHealth(h);
      setRanking(r);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać statystyk.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !isAdmin) return;
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin, rankingDays]);

  const maxHealthList = 10;
  const healthYellow = health?.yellow ?? [];
  const healthRed = health?.red ?? [];

  const rankingTop = (ranking?.ranking ?? []).slice(0, 12);

  const rankingInfo = useMemo(() => {
    const total = ranking?.ranking?.length ?? 0;
    return { total };
  }, [ranking]);

  if (!isAdmin) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
        <p className="text-sm text-[#fca5a5]">Tylko administrator.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--ink2)]">Panel Admina</p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--white)]">Statystyki i health score</h1>
        <p className="mt-1 text-sm text-[var(--ink2)]">
          KPI na żywo, health (żółte/czerwone) oraz ranking pracowników.
        </p>
      </header>

      {loading ? (
        <>
          <section className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </section>
          <section className="mb-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
              <StackedRowSkeleton rows={5} />
            </div>
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
              <StackedRowSkeleton rows={5} />
            </div>
          </section>
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
            <StackedRowSkeleton rows={6} />
          </div>
        </>
      ) : error ? (
        <div className="mb-4">
          <ErrorState error={new Error(error)} onRetry={() => void loadAll()} title="Błąd statystyk" />
        </div>
      ) : (
        <>
          <section className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="W toku"
              value={summary?.in_progress ?? 0}
              accentClass={badgeStyleByKey("blue")}
            />
            <StatCard label="Zaległe" value={summary?.overdue ?? 0} accentClass={badgeStyleByKey("red")} />
            <StatCard
              label="Gotowe do odbioru"
              value={summary?.ready_for_pickup ?? 0}
              accentClass={badgeStyleByKey("amber")}
            />
            <StatCard
              label="Czeka na decyzję"
              value={summary?.waiting_for_decision ?? 0}
              accentClass={badgeStyleByKey("amber")}
            />
          </section>

          <section className="mb-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink2)]">Health score</p>
                  <h2 className="mt-2 text-lg font-semibold text-[var(--white)]">Wymaga uwagi</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${badgeStyleByKey("amber")}`}>
                    Żółte: {health?.yellow_count ?? 0}
                  </span>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${badgeStyleByKey("red")}`}>
                    Czerwone: {health?.red_count ?? 0}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">Żółte</p>
                  <div className="mt-3 space-y-2">
                    {healthYellow.slice(0, maxHealthList).map((it) => (
                      <div key={it.repair.id} className="rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] p-3">
                        <Link href={`/panel/repairs/${it.repair.id}`} className="block truncate text-sm font-semibold text-[var(--white)] hover:underline">
                          {it.repair.repair_number}
                        </Link>
                        <p className="mt-1 text-xs text-[var(--ink2)]">{it.repair.device_name} · {it.repair.client_name}</p>
                        {it.issues?.length ? (
                          <div className="mt-2 text-xs text-[#ffe3b0]">
                            {it.issues.slice(0, 3).join(", ")}
                          </div>
                        ) : null}
                      </div>
                    ))}
                    {healthYellow.length === 0 ? <p className="text-sm text-[var(--muted)]">Brak.</p> : null}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">Czerwone</p>
                  <div className="mt-3 space-y-2">
                    {healthRed.slice(0, maxHealthList).map((it) => (
                      <div key={it.repair.id} className="rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] p-3">
                        <Link href={`/panel/repairs/${it.repair.id}`} className="block truncate text-sm font-semibold text-[var(--white)] hover:underline">
                          {it.repair.repair_number}
                        </Link>
                        <p className="mt-1 text-xs text-[var(--ink2)]">{it.repair.device_name} · {it.repair.client_name}</p>
                        {it.issues?.length ? (
                          <div className="mt-2 text-xs text-[#ffb4b4]">
                            {it.issues.slice(0, 3).join(", ")}
                          </div>
                        ) : null}
                      </div>
                    ))}
                    {healthRed.length === 0 ? <p className="text-sm text-[var(--muted)]">Brak.</p> : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink2)]">Ranking</p>
                  <h2 className="mt-2 text-lg font-semibold text-[var(--white)]">Najlepsi pracownicy</h2>
                </div>

                <div className="flex items-end gap-3">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">
                      Zakres
                    </label>
                    <select
                      value={rankingDays}
                      onChange={(e) => setRankingDays(Number(e.target.value))}
                      className="w-[170px] rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[var(--white)]"
                    >
                      <option value={7}>7 dni</option>
                      <option value={30}>30 dni</option>
                      <option value={90}>90 dni</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => void loadAll()}
                    className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
                  >
                    Odśwież
                  </button>
                </div>
              </div>

              <div className="mt-3 text-xs text-[var(--ink2)]">
                Wyświetlanych pracowników: {rankingTop.length} / {rankingInfo.total}
              </div>

              <div className="mt-3 divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--s1)]">
                {rankingTop.map((it, idx) => (
                  <div key={it.user_id} className="flex items-start justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">#{idx + 1}</p>
                      <p className="mt-1 truncate text-sm font-semibold text-[var(--white)]">{it.full_name}</p>
                      <p className="mt-1 truncate text-xs text-[var(--ink2)]">{it.email}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-[var(--ink2)]">Zakończone</p>
                      <p className="text-sm font-semibold text-[var(--white)]">{it.completed_repairs}</p>
                      <p className="mt-2 text-xs text-[var(--ink2)]">Przychód</p>
                      <p className="text-sm font-semibold text-[var(--white)]">{fmtPln(it.revenue)}</p>
                    </div>
                  </div>
                ))}

                {rankingTop.length === 0 ? <div className="p-4 text-sm text-[var(--muted)]">Brak danych.</div> : null}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

