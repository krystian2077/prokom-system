"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { RepairRequestListItem } from "@/types/repairs";

type AdminDashboardResponse = {
  period_days: number;
  kpi: {
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
  charts?: {
    repairs_by_status?: Record<string, number>;
    repairs_over_time?: Array<{ period: string; count: number; revenue: string }>;
  };
};

function statusPillStyle(status: string) {
  const s = (status ?? "").toLowerCase();
  const base = "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide";
  if (["cancelled", "unrepairable", "abandoned"].includes(s)) return `${base} border-[#dc1e1e]/35 bg-[#dc1e1e]/15 text-[#ffb4b4]`;
  if (["delivered", "picked_up"].includes(s)) return `${base} border-[#22c55e]/35 bg-[#22c55e]/15 text-[#bbf7d0]`;
  if (["shipped"].includes(s)) return `${base} border-[#3b82f6]/35 bg-[#3b82f6]/15 text-[#bcd6ff]`;
  if (["ready_for_pickup", "repair_done"].includes(s)) return `${base} border-[#f59e0b]/35 bg-[#f59e0b]/15 text-[#ffe3b0]`;
  return `${base} border-white/10 bg-white/5 text-[#9ca3af]`;
}

function priorityBadgeClass(priorityDisplay: string) {
  const p = (priorityDisplay ?? "").toLowerCase();
  if (p.includes("piln") || p.includes("urgent")) return "border-[#dc1e1e]/35 bg-[#dc1e1e]/15 text-[#ffb4b4]";
  if (p.includes("ważn") || p.includes("important") || p.includes("wysok")) return "border-[#f59e0b]/35 bg-[#f59e0b]/15 text-[#ffe3b0]";
  if (p.includes("niski") || p.includes("low")) return "border-white/10 bg-white/5 text-[#9ca3af]";
  return "border-[#3b82f6]/35 bg-[#3b82f6]/15 text-[#bcd6ff]";
}

function fmtPln(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return Math.round(n).toLocaleString("pl-PL") + " zł";
}

export default function AdminDashboardPage() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";
  const [days, setDays] = useState(30);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdminDashboardResponse | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<AdminDashboardResponse>(`/analytics/admin-dashboard/?days=${days}`, token);
      setData(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać dashboardu admina.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin, days]);

  const kpi = data?.kpi;
  const tables = data?.tables;

  const topOverdue = tables?.most_overdue.slice(0, 7) ?? [];
  const topUnclaimed = tables?.unclaimed_repairs.slice(0, 7) ?? [];
  const activeComplaints = tables?.active_complaints.slice(0, 6) ?? [];
  const activeWarranties = tables?.active_warranties.slice(0, 6) ?? [];
  const noQuoteRepairs = tables?.no_quote_repairs.slice(0, 6) ?? [];

  const topStaff = useMemo(() => tables?.top_staff.slice(0, 10) ?? [], [tables]);

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
        <h1 className="mt-2 text-2xl font-semibold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-[#9ca3af]">
          KPI, alerty operacyjne, listy napraw oraz top pracownicy.
        </p>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Zakres</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-[160px] rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            >
              <option value={7}>7 dni</option>
              <option value={30}>30 dni</option>
              <option value={90}>90 dni</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={!token || loading}
            className="h-[40px] rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white disabled:opacity-60"
          >
            Odśwież
          </button>
        </div>

        {user?.email ? <p className="text-xs text-[#8b93a8]">Zalogowano jako: {user.email}</p> : null}
      </div>

      {error ? <p className="text-sm text-[#fca5a5]">{error}</p> : null}

      {loading || !kpi || !tables ? (
        <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-6 text-sm text-[#9ca3af]">Ładowanie…</section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-[#9ca3af]">Nowe</div>
              <div className="mt-2 text-3xl font-semibold text-white">{kpi.new_count}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-[#9ca3af]">W toku</div>
              <div className="mt-2 text-3xl font-semibold text-white">{kpi.in_progress_count}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-[#9ca3af]">Gotowe do odbioru</div>
              <div className="mt-2 text-3xl font-semibold text-white">{kpi.ready_for_pickup_count}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-[#9ca3af]">Zaległe</div>
              <div className="mt-2 text-3xl font-semibold text-white">{kpi.overdue_count}</div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.1fr,.9fr]">
            <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Alerty operacyjne</p>
                  <h2 className="mt-2 text-lg font-semibold text-white">Szybkie listy</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#9ca3af]">
                    Nieodebrane: {kpi.unclaimed_count}
                  </span>
                  <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#9ca3af]">
                    Reklamacje: {kpi.complaints_count}
                  </span>
                  <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#9ca3af]">
                    Gwarancje: {kpi.warranties_count}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-[#0b0c10] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">Najbardziej zaległe</p>
                  <div className="mt-3 space-y-2">
                    {topOverdue.map((r) => (
                      <Link
                        key={r.id}
                        href={`/panel/repairs/${r.id}`}
                        className="group flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-mono text-sm font-semibold text-white group-hover:text-[#dc1e1e]">
                            {r.repair_number}
                          </div>
                          <div className="truncate text-xs text-[#9ca3af]">
                            {r.device_name} · {r.client_name}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={statusPillStyle(r.status)}>{r.status_display}</span>
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${priorityBadgeClass(
                              r.priority_display,
                            )}`}
                          >
                            {r.priority_display}
                          </span>
                        </div>
                      </Link>
                    ))}
                    {topOverdue.length === 0 ? <p className="text-sm text-[#6b7280]">Brak.</p> : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0b0c10] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">Nieodebrane</p>
                  <div className="mt-3 space-y-2">
                    {topUnclaimed.map((r) => (
                      <Link
                        key={r.id}
                        href={`/panel/repairs/${r.id}`}
                        className="block rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10"
                      >
                        <div className="truncate font-mono text-sm font-semibold text-white hover:text-[#dc1e1e]">
                          {r.repair_number}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className={statusPillStyle(r.status)}>{r.status_display}</span>
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${priorityBadgeClass(
                              r.priority_display,
                            )}`}
                          >
                            {r.priority_display}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-[#9ca3af] truncate">
                          {r.device_name} · {r.client_name}
                        </div>
                      </Link>
                    ))}
                    {topUnclaimed.length === 0 ? <p className="text-sm text-[#6b7280]">Brak.</p> : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0b0c10] p-3 md:col-span-2">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">Bez wyceny</p>
                      <div className="mt-2 space-y-2">
                        {noQuoteRepairs.map((r) => (
                          <Link
                            key={r.id}
                            href={`/panel/repairs/${r.id}`}
                            className="block rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10"
                          >
                            <div className="truncate font-mono text-sm font-semibold text-white">{r.repair_number}</div>
                            <div className="mt-1 text-xs text-[#9ca3af] truncate">{r.client_name}</div>
                          </Link>
                        ))}
                        {noQuoteRepairs.length === 0 ? <p className="text-sm text-[#6b7280]">Brak.</p> : null}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">Aktywne reklamacje</p>
                      <div className="mt-2 space-y-2">
                        {activeComplaints.map((r) => (
                          <Link
                            key={r.id}
                            href={`/panel/repairs/${r.id}`}
                            className="block rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10"
                          >
                            <div className="truncate font-mono text-sm font-semibold text-white">{r.repair_number}</div>
                            <div className="mt-1 text-xs text-[#9ca3af] truncate">{r.client_name}</div>
                          </Link>
                        ))}
                        {activeComplaints.length === 0 ? <p className="text-sm text-[#6b7280]">Brak.</p> : null}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">Aktywne gwarancje</p>
                      <div className="mt-2 space-y-2">
                        {activeWarranties.map((r) => (
                          <Link
                            key={r.id}
                            href={`/panel/repairs/${r.id}`}
                            className="block rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10"
                          >
                            <div className="truncate font-mono text-sm font-semibold text-white">{r.repair_number}</div>
                            <div className="mt-1 text-xs text-[#9ca3af] truncate">{r.client_name}</div>
                          </Link>
                        ))}
                        {activeWarranties.length === 0 ? <p className="text-sm text-[#6b7280]">Brak.</p> : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Top pracownicy</p>
              <h2 className="mt-2 text-lg font-semibold text-white">Ranking</h2>

              <div className="mt-3 text-sm text-[#9ca3af]">
                Przychód: <span className="text-white font-semibold">{fmtPln(kpi.revenue_total)}</span>
              </div>
              <div className="mt-1 text-sm text-[#9ca3af]">
                Suma wycen: <span className="text-white font-semibold">{fmtPln(kpi.quote_value_total)}</span>
              </div>

              <div className="mt-4 divide-y divide-white/10 rounded-2xl border border-white/10 bg-[#0b0c10] overflow-hidden">
                {topStaff.map((st, idx) => (
                  <div key={st.user_id} className="flex items-start justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">#{idx + 1}</div>
                      <div className="mt-1 truncate text-sm font-semibold text-white">{st.full_name}</div>
                      <div className="mt-1 truncate text-xs text-[#9ca3af]">{st.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#9ca3af]">Zakończone</div>
                      <div className="text-sm font-semibold text-white">{st.completed_repairs}</div>
                      <div className="mt-2 text-xs text-[#9ca3af]">Przychód</div>
                      <div className="text-sm font-semibold text-white">{fmtPln(st.revenue)}</div>
                    </div>
                  </div>
                ))}
                {topStaff.length === 0 ? <div className="p-4 text-sm text-[#6b7280]">Brak danych.</div> : null}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

