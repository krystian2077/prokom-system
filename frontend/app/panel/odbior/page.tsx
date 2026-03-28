"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkerStore } from "@/stores/workerStore";
import type { RepairRequestListItem } from "@/types/repairs";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PickupColumnSkeleton } from "@/components/ui/Skeleton";

type PickupPanelResponse = {
  ready_for_pickup: RepairRequestListItem[];
  issued_today: RepairRequestListItem[];
};

function waitingText(createdAt: string) {
  const d = new Date(createdAt).getTime();
  const diffH = Math.max(0, Math.floor((Date.now() - d) / 3600000));
  if (diffH < 24) return `${diffH}h`;
  const days = Math.floor(diffH / 24);
  return `${days} dni`;
}

function assigneeLabel(item: RepairRequestListItem): string {
  if (!item.assigned_to) return "—";
  if (typeof item.assigned_to === "string") return "Pracownik";
  return [item.assigned_to.first_name, item.assigned_to.last_name].filter(Boolean).join(" ").trim() || item.assigned_to.email;
}

export default function PickupPage() {
  const { token, user } = useAuth();
  const addToast = useWorkerStore((s) => s.addToast);
  const [data, setData] = useState<PickupPanelResponse>({ ready_for_pickup: [], issued_today: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendingFor, setSendingFor] = useState<string | null>(null);
  const [smsTemplateId, setSmsTemplateId] = useState<number | null>(null);

  const userId = user?.id ?? null;

  const load = async () => {
    if (!token || !userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<any>(`/repairs/pickup-panel/?assigned_to=${encodeURIComponent(String(userId))}`, token);
      setData({
        ready_for_pickup: Array.isArray(res?.ready_for_pickup) ? res.ready_for_pickup : [],
        issued_today: Array.isArray(res?.issued_today) ? res.issued_today : [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się pobrać danych odbiorów.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !userId) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, userId]);

  useEffect(() => {
    if (!token) return;
    void api
      .get<any>(`/communications/templates/?channel=sms&suggested_for_status=ready_for_pickup&is_active=true`, token)
      .then((res) => {
        const list = Array.isArray(res) ? res : Array.isArray(res?.results) ? res.results : [];
        const firstId = Number(list[0]?.id);
        setSmsTemplateId(Number.isFinite(firstId) ? firstId : null);
      })
      .catch(() => setSmsTemplateId(null));
  }, [token]);

  const readyList = data.ready_for_pickup;
  const issuedList = useMemo(
    () =>
      [...data.issued_today].sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
      ),
    [data.issued_today],
  );

  const sendReadySms = async (repairId: string) => {
    if (!token || !smsTemplateId) {
      addToast("Brak aktywnego szablonu SMS dla statusu gotowe do odbioru.", "error");
      return;
    }
    setSendingFor(repairId);
    try {
      const res = await api.post<{ success: boolean }>(
        `/communications/send/`,
        { repair_id: repairId, template_id: smsTemplateId },
        token,
      );
      if (res?.success) addToast("✓ SMS wysłany do klienta", "success");
      else addToast("Wysłanie nie powiodło się (sprawdź log komunikacji).", "error");
      await load();
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Nie udało się wysłać SMS.", "error");
    } finally {
      setSendingFor(null);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-[1450px] px-4 py-8">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--white)]">Odbiory</h1>
          <p className="mt-1 text-sm text-[var(--ink2)]">Gotowe do odbioru oraz wydane dziś (widok pracownika).</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] hover:bg-[var(--row-active)] hover:text-[var(--white)]"
        >
          Odśwież
        </button>
      </div>

      {error ? (
        <div className="mb-4">
          <ErrorState error={new Error(error)} onRetry={() => void load()} title="Błąd odbiorów" />
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Gotowe do odbioru</h2>
            <span className="rounded-full border border-[var(--border)] bg-[var(--row-hover)] px-2.5 py-1 text-xs font-semibold text-[var(--white)]">{readyList.length}</span>
          </div>

          {loading ? (
            <PickupColumnSkeleton rows={4} />
          ) : readyList.length === 0 ? (
            <EmptyState
              icon={EMPTY_STATES.pickups.icon}
              title={EMPTY_STATES.pickups.title}
              description={EMPTY_STATES.pickups.description}
            />
          ) : (
            <div className="space-y-2">
              {readyList.map((r) => (
                <div key={r.id} className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/panel/naprawy/${r.id}`} className="font-mono text-sm font-semibold text-[#93c5fd] hover:underline">
                        {r.repair_number}
                      </Link>
                      <div className="mt-1 truncate text-sm text-[var(--white)]">{r.device_name}</div>
                      <div className="mt-1 text-xs text-[var(--ink2)]">
                        {r.client_name} · Czeka: {waitingText(r.created_at)} · Pracownik: {assigneeLabel(r)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void sendReadySms(r.id)}
                      disabled={sendingFor === r.id}
                      className="shrink-0 rounded-xl border border-[#3b82f6]/35 bg-[#3b82f6]/15 px-3 py-2 text-xs font-semibold text-[#bfdbfe] hover:bg-[#3b82f6]/25 disabled:opacity-60"
                    >
                      {sendingFor === r.id ? "Wysyłanie…" : "Nie powiadomiony! Wyślij SMS"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Wydane dziś</h2>
            <span className="rounded-full border border-[var(--border)] bg-[var(--row-hover)] px-2.5 py-1 text-xs font-semibold text-[var(--white)]">{issuedList.length}</span>
          </div>

          {loading ? (
            <PickupColumnSkeleton rows={3} />
          ) : issuedList.length === 0 ? (
            <div className="py-6 text-center text-sm text-[var(--muted)]">Brak wydanych dziś.</div>
          ) : (
            <div className="space-y-2">
              {issuedList.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-3 py-2">
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-semibold text-[var(--white)]">{r.repair_number}</div>
                    <div className="truncate text-xs text-[var(--ink2)]">{r.device_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#86efac]">✓ {new Date(r.created_at).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}</div>
                    <div className="text-[11px] text-[var(--ink2)]">{r.status_display}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
