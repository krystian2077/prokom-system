"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { usePanelBasePath } from "@/lib/panelPaths";
import { useStore } from "@/store";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import type { RepairRequestListItem } from "@/types/repairs";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PickupColumnSkeleton } from "@/components/ui/Skeleton";

type PickupPanelResponse = {
  ready_for_pickup: RepairRequestListItem[];
  unclaimed_7_days: RepairRequestListItem[];
  to_prepare_shipment: RepairRequestListItem[];
  issued_today: RepairRequestListItem[];
};

function waitingDays(item: RepairRequestListItem): number {
  const byApi = Number(item.waiting_for_client_days ?? 0);
  if (Number.isFinite(byApi) && byApi > 0) return byApi;
  const ts = new Date(item.ready_for_pickup_at ?? item.created_at).getTime();
  if (!Number.isFinite(ts)) return 0;
  return Math.max(0, Math.floor((Date.now() - ts) / 86400000));
}

function moneyLabel(item: RepairRequestListItem): string {
  const src = item.final_cost ?? item.estimated_cost;
  if (src == null || src === "") return "-";
  const n = typeof src === "number" ? src : Number(String(src).replace(",", "."));
  if (!Number.isFinite(n)) return `${src} PLN`;
  return `${n.toFixed(2)} PLN`;
}

function dateTimeLabel(v?: string | null): string {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function returnMethodLabel(v?: string | null): string {
  if (v === "in_person") return "Odbior osobisty";
  if (v === "courier") return "Zwrot kurierem";
  if (v === "parcel_locker") return "Zwrot paczkomatem";
  return "Odbior osobisty";
}

function assigneeLabel(item: RepairRequestListItem): string {
  if (!item.assigned_to) return "Nieprzypisane";
  if (typeof item.assigned_to === "string") return item.assigned_to;
  return [item.assigned_to.first_name, item.assigned_to.last_name].filter(Boolean).join(" ").trim() || item.assigned_to.email;
}

export default function AdminPickupsPage() {
  const panelPaths = usePanelBasePath();
  const { token, user } = useAuth();
  const { addToast } = useStore();
  const { confirm } = useConfirm();
  const isStaffOrAdmin = user?.role === "staff" || user?.role === "admin";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [issuingId, setIssuingId] = useState<string | null>(null);
  const [data, setData] = useState<PickupPanelResponse>({
    ready_for_pickup: [],
    unclaimed_7_days: [],
    to_prepare_shipment: [],
    issued_today: [],
  });

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (user?.role === "staff" && user?.id) params.set("assigned_to", String(user.id));
      const url = params.toString() ? `/repairs/pickup-panel/?${params.toString()}` : "/repairs/pickup-panel/";
      const res = await api.get<Partial<PickupPanelResponse>>(url, token);
      setData({
        ready_for_pickup: Array.isArray(res?.ready_for_pickup) ? res.ready_for_pickup : [],
        unclaimed_7_days: Array.isArray(res?.unclaimed_7_days) ? res.unclaimed_7_days : [],
        to_prepare_shipment: Array.isArray(res?.to_prepare_shipment) ? res.to_prepare_shipment : [],
        issued_today: Array.isArray(res?.issued_today) ? res.issued_today : [],
      });
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Nie udało się pobrać danych odbiorów."));
      setData({ ready_for_pickup: [], unclaimed_7_days: [], to_prepare_shipment: [], issued_today: [] });
    } finally {
      setLoading(false);
    }
  };

  const issueDevice = async (repair: RepairRequestListItem) => {
    if (!token) return;
    const ok = await confirm({
      title: "Potwierdź wydanie sprzętu",
      description: `Naprawa ${repair.repair_number} zostanie oznaczona jako odebrana przez klienta.`,
      confirmLabel: "Tak, wydaj sprzęt",
      variant: "warning",
    });
    if (!ok) return;
    setIssuingId(repair.id);
    try {
      await api.post(
        `/repairs/${repair.id}/change-status/`,
        {
          new_status: "picked_up",
          notes:
            user?.role === "admin"
              ? "Wydanie sprzętu potwierdzone w panelu odbiorów (admin)."
              : "Wydanie sprzętu potwierdzone w panelu odbiorów (staff).",
        },
        token,
      );
      addToast(`Wydano sprzęt: ${repair.repair_number}`, "success");
      await load();
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Nie udało się potwierdzić wydania sprzętu.", "error");
    } finally {
      setIssuingId(null);
    }
  };

  useEffect(() => {
    if (!isStaffOrAdmin || !token) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaffOrAdmin, token, user?.id, user?.role]);

  const readySorted = useMemo(
    () => [...data.ready_for_pickup].sort((a, b) => waitingDays(b) - waitingDays(a)),
    [data.ready_for_pickup],
  );

  const issuedSorted = useMemo(
    () =>
      [...data.issued_today].sort(
        (a, b) =>
          new Date(b.picked_up_at ?? b.created_at ?? 0).getTime() -
          new Date(a.picked_up_at ?? a.created_at ?? 0).getTime(),
      ),
    [data.issued_today],
  );

  const summary = useMemo(
    () => ({
      ready: data.ready_for_pickup.length,
      stale: data.unclaimed_7_days.length,
      shipping: data.to_prepare_shipment.length,
      issuedToday: data.issued_today.length,
    }),
    [data],
  );

  if (!isStaffOrAdmin) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
        <p className="text-sm text-[#fca5a5]">Brak uprawnień.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">{panelPaths.isAdminPanel ? "Panel Admina" : "Panel Pracownika"}</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Odbiory i wydania</h1>
          <p className="mt-1 text-sm text-[#9ca3af]">Priorytetowe zlecenia do odbioru, zaległe wydania i historia dzienna.</p>
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

      <section className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(59,130,246,.2),rgba(10,12,18,.92))] p-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-[#bfdbfe]">Gotowe do odbioru</div>
          <div className="mt-2 text-3xl font-semibold text-white">{loading ? "..." : summary.ready}</div>
        </div>
        <div className="rounded-2xl border border-[#dc2626]/35 bg-[linear-gradient(135deg,rgba(220,38,38,.18),rgba(10,12,18,.92))] p-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-[#fca5a5]">Nieodebrane powyzej 7 dni</div>
          <div className="mt-2 text-3xl font-semibold text-white">{loading ? "..." : summary.stale}</div>
        </div>
        <div className="rounded-2xl border border-[#f59e0b]/35 bg-[linear-gradient(135deg,rgba(245,158,11,.16),rgba(10,12,18,.92))] p-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-[#fde68a]">Do przygotowania wysylki</div>
          <div className="mt-2 text-3xl font-semibold text-white">{loading ? "..." : summary.shipping}</div>
        </div>
        <div className="rounded-2xl border border-[#22c55e]/35 bg-[linear-gradient(135deg,rgba(34,197,94,.16),rgba(10,12,18,.92))] p-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-[#86efac]">Wydane dzis</div>
          <div className="mt-2 text-3xl font-semibold text-white">{loading ? "..." : summary.issuedToday}</div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.45fr_.9fr]">
        <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">Gotowe do odbioru</h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white">
              {loading ? "..." : readySorted.length}
            </span>
          </div>
          {loading ? (
            <PickupColumnSkeleton rows={5} />
          ) : !error && readySorted.length === 0 ? (
            <div className="py-4">
              <EmptyState
                icon={EMPTY_STATES.pickups.icon}
                title="Brak urządzeń gotowych"
                description="Gdy naprawy przejdą w status gotowe do odbioru, pojawią się tutaj."
              />
            </div>
          ) : !error ? (
            <div className="space-y-3">
              {readySorted.map((r) => (
                <article key={r.id} className="rounded-2xl border border-white/10 bg-[linear-gradient(150deg,rgba(17,24,39,.8),rgba(15,17,23,.95))] p-4 shadow-[0_8px_28px_rgba(0,0,0,.25)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={panelPaths.repairDetailPath(r.id)} className="font-mono text-sm font-semibold text-[#93c5fd] hover:underline">
                        {r.repair_number}
                      </Link>
                      <div className="mt-1 truncate text-base font-medium text-white">{r.device_name}</div>
                      <div className="mt-1 text-xs text-[#cbd5e1]">
                        {r.client_name}
                        {r.client_phone ? ` · tel. ${r.client_phone}` : ""}
                      </div>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${waitingDays(r) >= 7 ? "border-[#dc2626]/35 bg-[#dc2626]/15 text-[#fecaca]" : "border-[#22c55e]/35 bg-[#22c55e]/15 text-[#86efac]"}`}>
                      Czeka {waitingDays(r)} dni
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-[#9ca3af] sm:grid-cols-2 lg:grid-cols-4">
                    <div>Pracownik: <span className="text-white">{assigneeLabel(r)}</span></div>
                    <div>Zwrot: <span className="text-white">{returnMethodLabel(r.return_method)}</span></div>
                    <div>Kwota: <span className="text-white">{moneyLabel(r)}</span></div>
                    <div>Gotowe od: <span className="text-white">{dateTimeLabel(r.ready_for_pickup_at)}</span></div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void issueDevice(r)}
                      disabled={issuingId === r.id}
                      className="rounded-xl border border-[#22c55e]/40 bg-[#22c55e]/15 px-3 py-2 text-xs font-semibold text-[#bbf7d0] transition hover:bg-[#22c55e]/25 disabled:opacity-60"
                    >
                      {issuingId === r.id ? "Potwierdzanie..." : "Potwierdz wydanie sprzetu"}
                    </button>
                    <Link href={panelPaths.repairDetailPath(r.id)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#cbd5e1] hover:bg-white/10 hover:text-white">
                      Szczegoly naprawy
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-[#dc1e1e]/25 bg-[#0c0d12] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#ffb4b4]">Nieodebrane &gt;7 dni</h2>
              <span className="rounded-full border border-[#dc1e1e]/35 bg-[#dc1e1e]/12 px-2.5 py-1 text-xs font-semibold text-[#ffb4b4]">
                {loading ? "..." : data.unclaimed_7_days.length}
              </span>
            </div>
            {loading ? (
              <PickupColumnSkeleton rows={4} />
            ) : data.unclaimed_7_days.length === 0 ? (
              <p className="text-sm text-[#6b7280]">Brak zaleglych odbiorow.</p>
            ) : (
              <div className="space-y-2">
                {data.unclaimed_7_days.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-[#dc1e1e]/30 bg-[#dc1e1e]/8 p-3">
                    <div className="font-mono text-xs font-semibold text-[#fecaca]">{r.repair_number}</div>
                    <div className="mt-1 text-sm text-white">{r.client_name}</div>
                    <div className="mt-1 text-xs text-[#ffb4b4]">{r.device_name} · czeka {waitingDays(r)} dni</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-[#f59e0b]/30 bg-[#0c0d12] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#fde68a]">Do przygotowania wysylki</h2>
              <span className="rounded-full border border-[#f59e0b]/35 bg-[#f59e0b]/15 px-2.5 py-1 text-xs font-semibold text-[#fde68a]">
                {loading ? "..." : data.to_prepare_shipment.length}
              </span>
            </div>
            {loading ? (
              <PickupColumnSkeleton rows={3} />
            ) : data.to_prepare_shipment.length === 0 ? (
              <p className="text-sm text-[#6b7280]">Brak zlecen do wysylki zwrotnej.</p>
            ) : (
              <div className="space-y-2">
                {data.to_prepare_shipment.slice(0, 6).map((r) => (
                  <div key={r.id} className="rounded-2xl border border-[#f59e0b]/25 bg-[#f59e0b]/8 p-3">
                    <div className="font-mono text-xs font-semibold text-[#fde68a]">{r.repair_number}</div>
                    <div className="mt-1 truncate text-sm text-white">{r.device_name}</div>
                    <div className="mt-1 text-xs text-[#fcd34d]">{r.client_name} · {returnMethodLabel(r.return_method)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">Wydane dzis</h2>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white">
                {loading ? "..." : issuedSorted.length}
              </span>
            </div>
            {loading ? (
              <PickupColumnSkeleton rows={4} />
            ) : issuedSorted.length === 0 ? (
              <p className="text-sm text-[#6b7280]">Brak wydanych dzisiaj.</p>
            ) : (
              <div className="space-y-2">
                {issuedSorted.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0f1117] px-3 py-2">
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-semibold text-white">{r.repair_number}</div>
                      <div className="truncate text-xs text-[#9ca3af]">{r.device_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#86efac]">✓ {dateTimeLabel(r.picked_up_at ?? r.created_at)}</div>
                      <div className="text-[11px] text-[#9ca3af]">{r.status_display}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
