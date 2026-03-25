"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Building2, Phone, Mail, ShieldCheck, Wrench } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorState } from "@/components/ui/ErrorState";
import { StackedRowSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import type { RepairRequestListItem } from "@/types/repairs";

type ClientDetail = {
  id: string;
  client_number?: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  is_company?: boolean;
  is_premium?: boolean;
  company_name?: string | null;
  nip?: string | null;
  street?: string | null;
  city?: string | null;
  postal_code?: string | null;
  total_repairs?: number;
  active_repairs_count?: number;
  complaints_count?: number;
  date_joined?: string;
  notes?: string | null;
};

type PaginatedRepairs = {
  count: number;
  results: RepairRequestListItem[];
};

function statusBadgeStyle(status: string): { bg: string; border: string; text: string } {
  const s = (status ?? "").toLowerCase();
  if (s === "ready_for_pickup") return { bg: "rgba(34,197,94,.14)", border: "rgba(34,197,94,.30)", text: "#22c55e" };
  if (s === "waiting_for_parts") return { bg: "rgba(245,158,11,.16)", border: "rgba(245,158,11,.30)", text: "#f59e0b" };
  return { bg: "rgba(59,130,246,.14)", border: "rgba(59,130,246,.28)", text: "#3b82f6" };
}

function InfoRow({ label, value }: { label: string; value?: string | number | null | boolean }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between gap-4 py-2.5 text-sm">
      <dt className="shrink-0 text-[#9ca3af]">{label}</dt>
      <dd className="text-right font-semibold text-[#e5e7eb]">{String(value)}</dd>
    </div>
  );
}

export default function AdminClientDetailPage() {
  const { token, user } = useAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const clientId = params?.id;

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [repairs, setRepairs] = useState<RepairRequestListItem[]>([]);
  const [repairsCount, setRepairsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = async () => {
    if (!token || !clientId) return;
    setLoading(true);
    setError(null);
    try {
      const [clientRes, repairsRes] = await Promise.all([
        api.get<ClientDetail>(`/clients/${clientId}/`, token),
        api.get<PaginatedRepairs | RepairRequestListItem[]>(
          `/repairs/?client=${clientId}&ordering=-created_at&page_size=20`,
          token,
        ),
      ]);
      setClient(clientRes);
      const rows = Array.isArray(repairsRes) ? repairsRes : repairsRes?.results ?? [];
      const count = Array.isArray(repairsRes) ? rows.length : repairsRes?.count ?? rows.length;
      setRepairs(rows);
      setRepairsCount(count);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Nie udało się pobrać danych klienta."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "admin") return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, clientId, user?.role]);

  const activeRepairs = useMemo(
    () =>
      repairs.filter((r) => {
        const s = (r.status ?? "").toLowerCase();
        return !["picked_up", "shipped", "delivered", "cancelled", "unrepairable", "abandoned"].includes(s);
      }),
    [repairs],
  );
  const archivedRepairs = useMemo(() => repairs.filter((r) => !activeRepairs.includes(r)), [repairs, activeRepairs]);

  if (user?.role !== "admin") return null;

  if (loading) {
    return (
      <main className="mx-auto min-h-screen max-w-[1400px] px-4 py-8">
        <div className="mb-6 h-9 w-32 animate-pulse rounded-xl bg-white/10" />
        <div className="grid gap-5 lg:grid-cols-[1fr,2fr]">
          <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
            <StackedRowSkeleton rows={7} />
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
            <StackedRowSkeleton rows={5} />
          </div>
        </div>
      </main>
    );
  }

  if (error || !client) {
    return (
      <main className="mx-auto min-h-screen max-w-[1400px] px-4 py-8">
        <ErrorState
          error={error ?? new Error("Nie znaleziono klienta.")}
          onRetry={() => void load()}
          title="Błąd ładowania klienta"
        />
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-4 text-sm text-[#9ca3af] hover:text-white"
        >
          ← Wróć do listy
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1400px] px-4 py-8">
      {/* Back */}
      <Link
        href="/admin-panel/clients"
        className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft size={16} />
        Wróć do klientów
      </Link>

      <div className="grid gap-5 lg:grid-cols-[1fr,2fr]">
        {/* Client card */}
        <div className="flex flex-col gap-5">
          <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl font-bold text-white">
                {client.is_company ? <Building2 size={24} className="text-[#3b82f6]" /> : <User size={24} className="text-[#3b82f6]" />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">
                  {client.client_number ?? "Klient"}
                </div>
                <h1 className="mt-1 text-xl font-bold tracking-tight text-white">
                  {client.is_company ? client.company_name || client.full_name : client.full_name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {client.is_premium ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f59e0b]/35 bg-[#f59e0b]/12 px-2.5 py-1 text-[11px] font-bold text-[#ffe3b0]">
                      <ShieldCheck size={12} /> VIP
                    </span>
                  ) : null}
                  {client.is_company ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3b82f6]/35 bg-[#3b82f6]/12 px-2.5 py-1 text-[11px] font-bold text-[#bcd6ff]">
                      <Building2 size={12} /> Firma
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <dl className="mt-5 divide-y divide-white/5">
              {client.email ? (
                <div className="flex items-center gap-2 py-2.5">
                  <Mail size={14} className="shrink-0 text-[#9ca3af]" />
                  <a href={`mailto:${client.email}`} className="truncate text-sm text-[#bcd6ff] hover:underline">
                    {client.email}
                  </a>
                </div>
              ) : null}
              {client.phone ? (
                <div className="flex items-center gap-2 py-2.5">
                  <Phone size={14} className="shrink-0 text-[#9ca3af]" />
                  <a href={`tel:${client.phone}`} className="text-sm text-[#e5e7eb] hover:underline">
                    {client.phone}
                  </a>
                </div>
              ) : null}
              <InfoRow label="NIP" value={client.nip} />
              <InfoRow label="Miasto" value={client.city} />
              <InfoRow label="Ulica" value={client.street} />
              <InfoRow label="Kod pocztowy" value={client.postal_code} />
              <InfoRow label="Napraw łącznie" value={repairsCount} />
              <InfoRow label="Aktywnych" value={activeRepairs.length} />
              <InfoRow label="Reklamacji" value={client.complaints_count} />
            </dl>

            {client.notes ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-[#0f1117] p-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">Notatki</div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-[#e5e7eb]">{client.notes}</p>
              </div>
            ) : null}
          </section>
        </div>

        {/* Repairs */}
        <div className="flex flex-col gap-5">
          <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9ca3af]">Historia</div>
                <h2 className="mt-1 text-lg font-semibold text-white">
                  Naprawy klienta
                  {repairsCount > 0 ? (
                    <span className="ml-2 rounded-full bg-[#3b82f6]/15 px-2.5 py-0.5 text-[12px] font-semibold text-[#93c5fd]">
                      {repairsCount}
                    </span>
                  ) : null}
                </h2>
              </div>
            </div>

            {repairs.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={EMPTY_STATES.myRepairs.icon}
                  title="Brak napraw"
                  description="Ten klient nie ma jeszcze żadnych napraw w systemie."
                />
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {activeRepairs.length > 0 ? (
                  <>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b93a8]">Aktywne</div>
                    {activeRepairs.map((r) => {
                      const badge = statusBadgeStyle(r.status ?? "");
                      return (
                        <Link
                          key={r.id}
                          href={`/admin-panel/repairs/${r.id}`}
                          className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0f1117] px-4 py-3 transition hover:border-white/20 hover:bg-[#111420]"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-sm font-bold text-white">{r.repair_number}</span>
                              <span className="text-xs text-[#6b7280]">·</span>
                              <span className="truncate text-sm text-[#e5e7eb]">{r.device_name}</span>
                            </div>
                            <div className="mt-1 text-xs text-[#9ca3af]">
                              {new Date(r.created_at).toLocaleDateString("pl-PL")}
                            </div>
                          </div>
                          <span
                            className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
                            style={{ background: badge.bg, borderColor: badge.border, color: badge.text }}
                          >
                            {r.status_display}
                          </span>
                        </Link>
                      );
                    })}
                  </>
                ) : null}
                {archivedRepairs.length > 0 ? (
                  <>
                    <div className="pt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b93a8]">Archiwalne</div>
                    {archivedRepairs.map((r) => {
                      const badge = statusBadgeStyle(r.status ?? "");
                      return (
                        <Link
                          key={r.id}
                          href={`/admin-panel/repairs/${r.id}`}
                          className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0a0b0f] px-4 py-3 transition hover:border-white/20 hover:bg-[#0c0d12]"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-sm font-semibold text-[#9ca3af]">{r.repair_number}</span>
                              <span className="text-xs text-[#6b7280]">·</span>
                              <span className="truncate text-sm text-[#9ca3af]">{r.device_name}</span>
                            </div>
                            <div className="mt-1 text-xs text-[#6b7280]">
                              {new Date(r.created_at).toLocaleDateString("pl-PL")}
                            </div>
                          </div>
                          <span
                            className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
                            style={{ background: badge.bg, borderColor: badge.border, color: badge.text }}
                          >
                            {r.status_display}
                          </span>
                        </Link>
                      );
                    })}
                  </>
                ) : null}
              </div>
            )}
          </section>

          {/* Quick actions */}
          <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9ca3af]">Akcje</div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/admin-panel/repairs?client=${clientId}`}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
              >
                <Wrench size={15} />
                Wszystkie naprawy
              </Link>
              {client.phone ? (
                <a
                  href={`tel:${client.phone}`}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
                >
                  <Phone size={15} />
                  Zadzwoń
                </a>
              ) : null}
              {client.email ? (
                <a
                  href={`mailto:${client.email}`}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
                >
                  <Mail size={15} />
                  Napisz e-mail
                </a>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
