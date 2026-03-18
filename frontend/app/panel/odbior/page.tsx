"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { RepairRequestListItem } from "@/types/repairs";

type PickupPanelResponse = {
  ready_for_pickup: RepairRequestListItem[];
  unclaimed_3_days: RepairRequestListItem[];
  unclaimed_7_days: RepairRequestListItem[];
  to_prepare_shipment: RepairRequestListItem[];
  issued_today: RepairRequestListItem[];
};

type PickupTabKey = "ready" | "unclaimed_3" | "unclaimed_7" | "to_prepare" | "issued_today";

function statusBadgeText(statusDisplay: string) {
  return statusDisplay || "—";
}

function priorityBadgeClass(priorityDisplay: string) {
  const p = (priorityDisplay ?? "").toLowerCase();
  if (p.includes("piln") || p.includes("urgent")) return "border-[#dc1e1e]/35 bg-[#dc1e1e]/15 text-[#ffb4b4]";
  if (p.includes("ważn") || p.includes("important") || p.includes("wysok")) return "border-[#f59e0b]/35 bg-[#f59e0b]/15 text-[#ffe3b0]";
  if (p.includes("niski") || p.includes("low")) return "border-white/10 bg-white/5 text-[#9ca3af]";
  return "border-[#3b82f6]/35 bg-[#3b82f6]/15 text-[#bcd6ff]";
}

export default function PickupPage() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PickupPanelResponse | null>(null);

  const [tab, setTab] = useState<PickupTabKey>("ready");

  const load = async () => {
    if (!token || !user) return;
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (!isAdmin) qs.set("assigned_to", String(user.id));
      const res = await api.get<PickupPanelResponse>(`/repairs/pickup-panel/${qs.toString() ? `?${qs.toString()}` : ""}`, token);
      setData(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać panelu odbiorów.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 30_000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id, isAdmin]);

  const list = (() => {
    if (!data) return [];
    if (tab === "ready") return data.ready_for_pickup;
    if (tab === "unclaimed_3") return data.unclaimed_3_days;
    if (tab === "unclaimed_7") return data.unclaimed_7_days;
    if (tab === "to_prepare") return data.to_prepare_shipment;
    return data.issued_today;
  })();

  const tabTitle =
    tab === "ready"
      ? "Gotowe do odbioru"
      : tab === "unclaimed_3"
        ? "Nieodebrane (3 dni)"
        : tab === "unclaimed_7"
          ? "Nieodebrane (7 dni)"
          : tab === "to_prepare"
            ? "Do przygotowania wysyłki zwrotnej"
            : "Wydane dziś";

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">
          {isAdmin ? "Panel Admina" : "Panel pracownika"} · Moduł
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Odbiory i wydania</h1>
        <p className="mt-1 text-sm text-[#9ca3af]">
          Lista napraw do odbioru oraz sprawy, które wymagają akcji operacyjnej.
        </p>
      </div>

      <div className="mb-5 rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["ready", "Gotowe"],
                ["unclaimed_3", "Nieodebrane 3d"],
                ["unclaimed_7", "Nieodebrane 7d"],
                ["to_prepare", "Wysyłka zwrotna"],
                ["issued_today", "Wydane dziś"],
              ] as Array<[PickupTabKey, string]>
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  tab === k
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-white/10 bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void load()}
            disabled={!token || loading}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white disabled:opacity-60"
          >
            Odśwież
          </button>
        </div>
      </div>

      {loading && (
        <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-6 text-sm text-[#9ca3af]">
          Ładowanie…
        </div>
      )}

      {error && <p className="text-sm text-[#fca5a5]">{error}</p>}

      {!loading && !error && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#9ca3af]">
              {tabTitle}: <span className="text-white font-semibold">{list.length}</span>
            </p>
            <p className="text-sm text-[#9ca3af]">Kliknij naprawę, aby przejść do szczegółów.</p>
          </div>

          <div className="space-y-3">
            {list.length === 0 ? (
              <p className="text-sm text-[#6b7280]">Brak pozycji w tym widoku.</p>
            ) : (
              list.map((r) => (
                <div key={r.id} className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-[260px]">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Naprawa</p>
                      <Link href={`/panel/repairs/${r.id}`} className="mt-1 block text-lg font-semibold text-white hover:underline">
                        {r.repair_number}
                      </Link>
                      <p className="mt-2 text-sm text-[#9ca3af]">
                        {r.device_name} · {r.client_name}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9ca3af]">Status</p>
                      <p className="mt-1 text-sm font-semibold text-white">{statusBadgeText(r.status_display)}</p>

                      <div className="mt-3">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${priorityBadgeClass(r.priority_display)}`}>
                          {r.priority_display}
                        </span>
                      </div>

                      {typeof r.waiting_for_client_days === "number" && (
                        <p className="mt-2 text-xs text-[#9ca3af]">
                          Czeka {r.waiting_for_client_days} dni na klienta
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </main>
  );
}
