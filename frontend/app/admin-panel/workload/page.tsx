"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type TeamDashboardResponse = {
  open_count: number;
  overdue_count: number;
  urgent_count: number;
  no_due_date_count: number;
  by_assigned_to: Array<{
    user_id: string;
    user_name: string;
    count: number;
  }>;
};

type AvailabilityEntry = {
  id: number;
  employee: string;
  employee_name: string;
  availability_type: string;
  availability_type_display: string;
  date: string;
  is_all_day: boolean;
  start_time?: string | null;
  end_time?: string | null;
  note?: string | null;
};

type AvailabilityWeekResponse = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: AvailabilityEntry[];
} | AvailabilityEntry[];

type HealthOverviewResponse = {
  yellow_count: number;
  red_count: number;
  yellow: Array<{ repair: unknown; issues: string[] }>;
  red: Array<{ repair: unknown; issues: string[] }>;
};

function availabilityBadgeClass(typeDisplay: string, typeValue: string) {
  const v = (typeValue ?? "").toLowerCase();
  if (v !== "available") return "border-[#dc1e1e]/35 bg-[#dc1e1e]/15 text-[#ffb4b4]";
  return "border-[#22c55e]/35 bg-[#22c55e]/15 text-[#bbf7d0]";
}

export default function AdminWorkloadPage() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [teamDash, setTeamDash] = useState<TeamDashboardResponse | null>(null);
  const [availabilityWeek, setAvailabilityWeek] = useState<AvailabilityEntry[]>([]);
  const [health, setHealth] = useState<HealthOverviewResponse | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [td, av, h] = await Promise.all([
        api.get<TeamDashboardResponse>(`/tasks/team-dashboard/`, token),
        api.get<AvailabilityEntry[] | { results: AvailabilityEntry[] }>(`/availability/week/`, token),
        api.get<HealthOverviewResponse>(`/analytics/health-overview/`, token),
      ]);
      setTeamDash(td);
      setAvailabilityWeek(Array.isArray(av) ? av : av.results ?? []);
      setHealth(h);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać workload.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  const topAssignees = useMemo(() => {
    const arr = teamDash?.by_assigned_to ?? [];
    return [...arr].sort((a, b) => b.count - a.count).slice(0, 10);
  }, [teamDash]);

  const availabilityByEmployee = useMemo(() => {
    const map = new Map<string, AvailabilityEntry[]>();
    for (const e of availabilityWeek) {
      const arr = map.get(e.employee) ?? [];
      arr.push(e);
      map.set(e.employee, arr);
    }
    return map;
  }, [availabilityWeek]);

  const employeeOrder = useMemo(() => {
    const ids = topAssignees.map((x) => x.user_id);
    const rest = Array.from(availabilityByEmployee.keys()).filter((id) => !ids.includes(id));
    return [...ids, ...rest];
  }, [availabilityByEmployee, topAssignees]);

  if (!isAdmin) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
        <p className="text-sm text-[#fca5a5]">Tylko administrator.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Panel Admina</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Workload</h1>
        <p className="mt-1 text-sm text-[#9ca3af]">Obciążenie zespołu, dostępność i health score.</p>
      </header>

      {error ? <p className="text-sm text-[#fca5a5]">{error}</p> : null}

      {loading || !teamDash ? (
        <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-6 text-sm text-[#9ca3af]">Ładowanie…</section>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-[#9ca3af]">Otwarte</div>
              <div className="mt-2 text-3xl font-semibold text-white">{teamDash.open_count}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-[#9ca3af]">Pilne</div>
              <div className="mt-2 text-3xl font-semibold text-white">{teamDash.urgent_count}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-[#9ca3af]">Zaległe</div>
              <div className="mt-2 text-3xl font-semibold text-white">{teamDash.overdue_count}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-[#9ca3af]">Bez terminu</div>
              <div className="mt-2 text-3xl font-semibold text-white">{teamDash.no_due_date_count}</div>
            </div>
          </div>

          <section className="grid gap-4 lg:grid-cols-[1.1fr,.9fr]">
            <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Sugerowane obciążenie</p>
                  <h2 className="mt-2 text-lg font-semibold text-white">Zadania per pracownik</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold border-[#22c55e]/35 bg-[#22c55e]/15 text-[#bbf7d0]">
                    Żółte: {health?.yellow_count ?? 0}
                  </span>
                  <span className="inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold border-[#dc1e1e]/35 bg-[#dc1e1e]/15 text-[#ffb4b4]">
                    Czerwone: {health?.red_count ?? 0}
                  </span>
                </div>
              </div>

              <div className="mt-4 divide-y divide-white/10 rounded-2xl border border-white/10 bg-[#0b0c10] overflow-hidden">
                {topAssignees.map((it, idx) => (
                  <div key={it.user_id} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">#{idx + 1}</div>
                      <div className="truncate text-sm font-semibold text-white">{it.user_name || it.user_id}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#9ca3af]">Otwarte</div>
                      <div className="text-sm font-semibold text-white">{it.count}</div>
                    </div>
                  </div>
                ))}
                {topAssignees.length === 0 ? <div className="p-4 text-sm text-[#6b7280]">Brak danych.</div> : null}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Dostępność (tydzień)</p>
              <h2 className="mt-2 text-lg font-semibold text-white">Pracownicy i wpisy</h2>

              <div className="mt-4 space-y-4">
                {employeeOrder.map((eid) => {
                  const entries = availabilityByEmployee.get(eid) ?? [];
                  if (!entries.length) return null;
                  const first = entries[0];
                  return (
                    <div key={eid} className="rounded-2xl border border-white/10 bg-[#0b0c10] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-white">{first.employee_name}</div>
                          <div className="mt-1 text-xs text-[#9ca3af]">Wpisy: {entries.length}</div>
                        </div>
                        <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#9ca3af]">
                          {entries[0]?.date}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2">
                        {entries.slice(0, 6).map((e) => (
                          <div key={e.id} className="flex items-center justify-between gap-3">
                            <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${availabilityBadgeClass(e.availability_type_display, e.availability_type)}`}>
                              {e.availability_type_display}
                            </span>
                            <span className="text-xs text-[#9ca3af]">
                              {e.is_all_day
                                ? "Cały dzień"
                                : `${e.start_time ?? "?"} - ${e.end_time ?? "?"}`}
                            </span>
                          </div>
                        ))}
                        {entries.length > 6 ? <div className="text-xs text-[#6b7280]">+{entries.length - 6} więcej</div> : null}
                      </div>
                    </div>
                  );
                })}
                {employeeOrder.length === 0 ? <div className="text-sm text-[#6b7280]">Brak dostępności.</div> : null}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

