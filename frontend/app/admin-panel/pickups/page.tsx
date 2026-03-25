"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAllPages } from "@/lib/api";
import type { RepairRequestListItem } from "@/types/repairs";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PickupColumnSkeleton } from "@/components/ui/Skeleton";

function waitingDays(item: RepairRequestListItem): number {
  const byApi = Number(item.waiting_for_client_days ?? 0);
  if (Number.isFinite(byApi) && byApi > 0) return byApi;
  const ts = new Date(item.created_at).getTime();
  if (!Number.isFinite(ts)) return 0;
  return Math.max(0, Math.floor((Date.now() - ts) / 86400000));
}

function assigneeLabel(item: RepairRequestListItem): string {
  if (!item.assigned_to) return "Nieprzypisane";
  if (typeof item.assigned_to === "string") return item.assigned_to;
  return [item.assigned_to.first_name, item.assigned_to.last_name].filter(Boolean).join(" ").trim() || item.assigned_to.email;
}

export default function AdminPickupsPage() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [ready, setReady] = useState<RepairRequestListItem[]>([]);
  const [uncollected, setUncollected] = useState<RepairRequestListItem[]>([]);
  const [deliveredToday, setDeliveredToday] = useState<RepairRequestListItem[]>([]);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [readyList, oldList, delList] = await Promise.all([
        fetchAllPages<RepairRequestListItem>(
          `/repairs/?status=ready_for_pickup&ordering=-created_at&page_size=200`,
          token,
        ),
        fetchAllPages<RepairRequestListItem>(
          `/repairs/?status=ready_for_pickup&days_since_ready__gt=7&ordering=-created_at&page_size=200`,
          token,
        ),
        fetchAllPages<RepairRequestListItem>(
          `/repairs/?status=delivered&delivered_today=true&ordering=-created_at&page_size=200`,
          token,
        ),
      ]);
      setReady(readyList);
      setUncollected(oldList);
      setDeliveredToday(delList);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Nie udało się pobrać danych odbiorów."));
      setReady([]);
      setUncollected([]);
      setDeliveredToday([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin || !token) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, token]);

  const deliveredSorted = useMemo(
    () =>
      [...deliveredToday].sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
      ),
    [deliveredToday],
  );

  if (!isAdmin) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
        <p className="text-sm text-[#fca5a5]">Tylko administrator.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Panel Admina</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Odbiory</h1>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          Odśwież
        </button>
      </div>

      {error && !loading ? (
        <div className="mb-4">
          <ErrorState error={error} onRetry={() => void load()} title="Nie udało się załadować odbiorów" />
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">Gotowe do odbioru</h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white">
              {loading ? "…" : ready.length}
            </span>
          </div>
          {loading ? (
            <PickupColumnSkeleton rows={5} />
          ) : !error && ready.length === 0 ? (
            <div className="py-4">
              <EmptyState
                icon={EMPTY_STATES.pickups.icon}
                title="Brak urządzeń gotowych"
                description="Gdy naprawy przejdą w status gotowe do odbioru, pojawią się tutaj."
              />
            </div>
          ) : !error ? (
            <div className="space-y-2">
              {ready.map((r) => (
                <div key={r.id} className="rounded-2xl border border-white/10 bg-[#0f1117] p-3">
                  <Link href={`/admin-panel/repairs/${r.id}`} className="font-mono text-sm font-semibold text-[#93c5fd] hover:underline">
                    {r.repair_number}
                  </Link>
                  <div className="mt-1 truncate text-sm text-white">{r.device_name}</div>
                  <div className="mt-1 text-xs text-[#9ca3af]">
                    {r.client_name} · Czeka: {waitingDays(r)} dni · {assigneeLabel(r)}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-3xl border border-[#dc1e1e]/25 bg-[#0c0d12] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#ffb4b4]">Nieodebrane &gt;7 dni</h2>
            <span className="rounded-full border border-[#dc1e1e]/35 bg-[#dc1e1e]/12 px-2.5 py-1 text-xs font-semibold text-[#ffb4b4]">
              {loading ? "…" : uncollected.length}
            </span>
          </div>
          {loading ? (
            <PickupColumnSkeleton rows={5} />
          ) : !error && uncollected.length === 0 ? (
            <p className="text-sm text-[#6b7280]">Brak zaległych odbiorów.</p>
          ) : !error ? (
            <div className="space-y-2">
              {uncollected.map((r) => (
                <div key={r.id} className="rounded-2xl border border-[#dc1e1e]/30 bg-[#dc1e1e]/8 p-3">
                  <Link href={`/admin-panel/repairs/${r.id}`} className="font-mono text-sm font-semibold text-[#fecaca] hover:underline">
                    {r.repair_number}
                  </Link>
                  <div className="mt-1 truncate text-sm text-white">{r.device_name}</div>
                  <div className="mt-1 text-xs text-[#ffb4b4]">
                    {r.client_name} · {waitingDays(r)} dni · ⚠ Kontakt wymagany
                  </div>
                  <button
                    type="button"
                    className="mt-2 rounded-lg border border-[#dc1e1e]/35 bg-[#dc1e1e]/15 px-3 py-1 text-xs font-semibold text-[#ffb4b4] hover:bg-[#dc1e1e]/22"
                  >
                    Zadzwoń
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">Wydane dziś</h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white">
              {loading ? "…" : deliveredSorted.length}
            </span>
          </div>
          {loading ? (
            <PickupColumnSkeleton rows={5} />
          ) : !error && deliveredSorted.length === 0 ? (
            <p className="text-sm text-[#6b7280]">Brak wydanych dziś.</p>
          ) : !error ? (
            <div className="space-y-2">
              {deliveredSorted.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0f1117] px-3 py-2">
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-semibold text-white">{r.repair_number}</div>
                    <div className="truncate text-xs text-[#9ca3af]">{r.device_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#86efac]">
                      ✓ {new Date(r.created_at).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div className="text-[11px] text-[#9ca3af]">{r.status_display}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
