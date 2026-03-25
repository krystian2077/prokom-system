"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { RepairRequestListItem } from "@/types/repairs";

type StaffKpiItem = {
  user_id?: string;
  full_name?: string;
  email?: string;
  repairs_completed?: number;
  avg_repair_days?: number;
  complaint_rate?: number;
  health_score?: number;
  revenue?: number;
};

type AvailabilityEntry = {
  id: string | number;
  employee?: string;
  employee_name?: string;
  availability_type: string;
  availability_type_display: string;
  date?: string;
  note?: string | null;
};

type StaffLoad = {
  userId: string;
  name: string;
  activeCount: number;
  urgentCount: number;
  readyCount: number;
  complaintCount: number;
  healthScore: number;
  availability?: AvailabilityEntry;
};

function availabilityBadgeClass(typeDisplay: string, typeValue: string) {
  const v = (typeValue ?? "").toLowerCase();
  if (v.includes("dost") || v.includes("available")) return "border-[#22c55e]/35 bg-[#22c55e]/15 text-[#bbf7d0]";
  if (v.includes("zaj") || v.includes("busy")) return "border-[#f59e0b]/35 bg-[#f59e0b]/15 text-[#ffe3b0]";
  if (v.includes("zew") || v.includes("external")) return "border-[#f97316]/35 bg-[#f97316]/15 text-[#fed7aa]";
  return "border-[#22c55e]/35 bg-[#22c55e]/15 text-[#bbf7d0]";
}

export default function AdminWorkloadPage() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [staffKpi, setStaffKpi] = useState<StaffKpiItem[]>([]);
  const [availabilityToday, setAvailabilityToday] = useState<AvailabilityEntry[]>([]);
  const [activeRepairs, setActiveRepairs] = useState<RepairRequestListItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [kpiRes, avRes, repairsRes] = await Promise.all([
        api.get<StaffKpiItem[] | { results?: StaffKpiItem[] }>(`/analytics/staff-kpi/`, token),
        api.get<AvailabilityEntry[] | { results?: AvailabilityEntry[] }>(`/availability/?date=${encodeURIComponent(today)}`, token),
        api.get<RepairRequestListItem[] | { results?: RepairRequestListItem[] }>(
          `/repairs/?status__in=in_progress,waiting_for_parts,ready_for_pickup&page_size=500`,
          token,
        ),
      ]);
      setStaffKpi(Array.isArray(kpiRes) ? kpiRes : kpiRes?.results ?? []);
      setAvailabilityToday(Array.isArray(avRes) ? avRes : avRes?.results ?? []);
      setActiveRepairs(Array.isArray(repairsRes) ? repairsRes : repairsRes?.results ?? []);
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

  const staffLoads = useMemo<StaffLoad[]>(() => {
    const avMap = new Map<string, AvailabilityEntry>();
    for (const av of availabilityToday) {
      const key = String(av.employee ?? "");
      if (!key) continue;
      if (!avMap.has(key)) avMap.set(key, av);
    }
    return staffKpi.map((k) => {
      const uid = String(k.user_id ?? "");
      const mine = activeRepairs.filter((r) => {
        if (!r.assigned_to || typeof r.assigned_to === "string") return false;
        return String(r.assigned_to.id) === uid;
      });
      const urgentCount = mine.filter((r) => (r.priority ?? "").toLowerCase() === "urgent").length;
      const readyCount = mine.filter((r) => (r.status ?? "").toLowerCase() === "ready_for_pickup").length;
      const complaintCount = mine.filter((r) => Boolean(r.complaint_warranty_status)).length;
      return {
        userId: uid,
        name: k.full_name || k.email || uid,
        activeCount: mine.length,
        urgentCount,
        readyCount,
        complaintCount,
        healthScore: Number(k.health_score ?? 0),
        availability: avMap.get(uid),
      };
    });
  }, [availabilityToday, staffKpi, activeRepairs]);

  const visibleRepairs = useMemo(() => {
    if (activeTab === "all") return activeRepairs;
    return activeRepairs.filter((r) => {
      if (!r.assigned_to || typeof r.assigned_to === "string") return false;
      return String(r.assigned_to.id) === activeTab;
    });
  }, [activeRepairs, activeTab]);

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

      {loading ? (
        <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-6 text-sm text-[#9ca3af]">Ładowanie…</section>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            {staffLoads.slice(0, 3).map((st) => {
              const loadPercent = Math.min(100, Math.round((st.activeCount / 10) * 100));
              const barColor = loadPercent > 80 ? "#dc1e1e" : loadPercent >= 60 ? "#f59e0b" : "#22c55e";
              return (
                <div key={st.userId} className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{st.name}</div>
                      <div className="mt-1 text-xs text-[#9ca3af]">
                        {st.availability?.availability_type_display ?? "Brak dostępności"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#9ca3af]">Health</div>
                      <div className="text-lg font-semibold text-white">{st.healthScore || 0}</div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                    <div>
                      <div className="text-xs text-[#9ca3af]">Aktywne</div>
                      <div className="text-sm font-semibold text-white">{st.activeCount}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#9ca3af]">Pilne</div>
                      <div className="text-sm font-semibold text-white">{st.urgentCount}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#9ca3af]">Gotowe</div>
                      <div className="text-sm font-semibold text-white">{st.readyCount}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#9ca3af]">Rekl.</div>
                      <div className="text-sm font-semibold text-white">{st.complaintCount}</div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-[#9ca3af]">
                      <span>Obciążenie</span>
                      <span>{loadPercent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div className="h-full rounded-full" style={{ width: `${loadPercent}%`, background: barColor }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
            <h2 className="text-lg font-semibold text-white">Naprawy wg pracownika</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${activeTab === "all" ? "border-white/20 bg-white/10 text-white" : "border-white/10 bg-white/5 text-[#9ca3af]"}`}
              >
                Wszyscy
              </button>
              {staffLoads.map((st) => (
                <button
                  key={st.userId}
                  type="button"
                  onClick={() => setActiveTab(st.userId)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${activeTab === st.userId ? "border-white/20 bg-white/10 text-white" : "border-white/10 bg-white/5 text-[#9ca3af]"}`}
                >
                  {st.name}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              {visibleRepairs.map((r) => {
                const assigned =
                  r.assigned_to && typeof r.assigned_to !== "string"
                    ? [r.assigned_to.first_name, r.assigned_to.last_name].filter(Boolean).join(" ").trim() ||
                      r.assigned_to.email
                    : "—";
                return (
                  <div key={r.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0b0c10] px-3 py-2">
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-semibold text-white">{r.repair_number}</div>
                      <div className="truncate text-xs text-[#9ca3af]">{r.device_name} · {r.client_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#9ca3af]">{assigned}</div>
                      <button
                        type="button"
                        className="mt-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-[#9ca3af]"
                      >
                        ↔ Przepisz
                      </button>
                    </div>
                  </div>
                );
              })}
              {visibleRepairs.length === 0 ? <div className="text-sm text-[#6b7280]">Brak napraw dla wybranego filtra.</div> : null}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

