"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ChevronRight,
  Mail,
  NotebookPen,
  Phone,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  Wallet,
  Wrench,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { usePanelBasePath } from "@/lib/panelPaths";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { StackedRowSkeleton } from "@/components/ui/Skeleton";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  getClientBadgeStyle,
  getClientDisplayName,
  getRepairTone,
  type PremiumClientResponse,
} from "../shared";

const ARCHIVED_STATUSES = new Set(["picked_up", "shipped", "delivered", "cancelled", "unrepairable", "abandoned"]);

function InfoRow({ label, value }: { label: string; value?: any }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <dt className="shrink-0 text-[#8b93a8]">{label}</dt>
      <dd className="text-right font-semibold text-[#e5e7eb]">{typeof value === "boolean" ? (value ? "Tak" : "Nie") : value}</dd>
    </div>
  );
}

function SectionTitle({ eyebrow, title, count }: { eyebrow: string; title: string; count?: number }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b93a8]">{eyebrow}</p>
      <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold text-white">
        {title}
        <span className="rounded-full bg-[#3b82f6]/15 px-2.5 py-0.5 text-[12px] text-[#93c5fd]">{count}</span>
      </h2>
    </div>
  );
}

function MetricCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[.045] p-4 shadow-[0_12px_30px_rgba(0,0,0,.2)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9db0d4]">{label}</p>
          <p className="mt-2 text-xl font-semibold text-white">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#93c5fd]">{icon}</div>
      </div>
      <p className="mt-2 text-xs text-[#7f8ca6]">{hint}</p>
    </div>
  );
}

export default function AdminClientDetailPage() {
  const panelPaths = usePanelBasePath();
  const { token, user } = useAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const clientId = params?.id;
  const isStaffOrAdmin = user?.role === "staff" || user?.role === "admin";
  const canDeleteClient = user?.role === "admin";

  const [payload, setPayload] = useState<PremiumClientResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = async () => {
    if (!token || !clientId) return;
    setLoading(true);
    setError(null);
    setDeleteError(null);
    try {
      const res = await api.get<PremiumClientResponse>(`/clients/${clientId}/premium-card/`, token);
      setPayload(res);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Nie udało się pobrać danych klienta."));
      setPayload(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isStaffOrAdmin) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, clientId, isStaffOrAdmin]);

  const client = payload?.client ?? null;
  const repairs = payload?.repairs ?? [];
  const devices = payload?.devices ?? [];
  const notes = payload?.notes ?? [];

  const activeRepairs = useMemo(() => repairs.filter((r) => !ARCHIVED_STATUSES.has((r.status ?? "").toLowerCase())), [repairs]);
  const archivedRepairs = useMemo(() => repairs.filter((r) => ARCHIVED_STATUSES.has((r.status ?? "").toLowerCase())), [repairs]);
  const defaultAddress = useMemo(() => client?.addresses?.find((a) => a.is_default) ?? client?.addresses?.[0] ?? null, [client?.addresses]);
  const badge = client ? getClientBadgeStyle(client) : null;

  const handleDelete = async () => {
    if (!token || !clientId || !client || !canDeleteClient) return;
    const confirmed = window.confirm(
      `Usunąć klienta ${getClientDisplayName(client)}? Ta operacja przeniesie rekord do archiwum i ukryje go z list.`,
    );
    if (!confirmed) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/clients/${clientId}/`, token);
      router.replace(panelPaths.klienciPath);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Nie udało się usunąć klienta.");
    } finally {
      setDeleting(false);
    }
  };

  if (!isStaffOrAdmin) {
    return null;
  }

  if (loading) {
    return (
      <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-8">
        <div className="mb-6 h-9 w-40 animate-pulse rounded-xl bg-white/10" />
        <div className="grid gap-5 lg:grid-cols-[360px,1fr]">
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
      <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-8">
        <ErrorState error={error ?? new Error("Nie znaleziono klienta.")} onRetry={() => void load()} title="Błąd ładowania klienta" />
        <button type="button" onClick={() => router.back()} className="mt-4 text-sm text-[#9ca3af] hover:text-white">
          ← Wróć do listy
        </button>
      </main>
    );
  }

  const displayName = getClientDisplayName(client);
  const totalSpent = formatMoney(client.total_spent);
  const lastVisit = formatDateTime(client.last_visit_at);
  const isBusiness = client.client_type === "business";

  return (
    <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={panelPaths.klienciPath}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={16} />
          Wróć do klientów
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`${panelPaths.klienciPath}/${client.id}/edit`}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#3b82f6]/30 bg-[#3b82f6]/12 px-4 py-2 text-sm font-semibold text-[#dbeafe] transition hover:bg-[#3b82f6]/18 hover:text-white"
          >
            Edytuj dane
          </Link>
          {canDeleteClient ? (
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#ef4444]/30 bg-[#ef4444]/12 px-4 py-2 text-sm font-semibold text-[#fecaca] transition hover:bg-[#ef4444]/18 hover:text-white disabled:opacity-60"
            >
              <Trash2 size={16} />
              {deleting ? "Usuwanie..." : "Usuń klienta"}
            </button>
          ) : null}
        </div>
      </div>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,22,37,.98),rgba(11,14,24,.98))] p-5 shadow-[0_22px_60px_rgba(0,0,0,.4)]">
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,.18),transparent_45%),radial-gradient(circle_at_top_right,rgba(245,158,11,.16),transparent_35%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center shadow-[0_14px_32px_rgba(0,0,0,.28)] ${isBusiness ? "rounded-3xl bg-[#3b82f6]/55" : "rounded-full bg-[#1f2937]"}`}>
              {isBusiness ? <Building2 size={28} className="text-white" /> : <User size={28} className="text-white" />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9ca3af]">{client.client_number ?? "Klient"}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{displayName}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {badge ? (
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em]" style={badge.styles}>
                    {badge.label}
                  </span>
                ) : null}
                {client.is_vip ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/12 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#fdba74]">
                    <Sparkles size={12} /> VIP
                  </span>
                ) : null}
                {isBusiness ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3b82f6]/30 bg-[#3b82f6]/12 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#bfdbfe]">
                    <Building2 size={12} /> Firma
                  </span>
                ) : null}
                {client.is_blacklisted ? (
                  <span className="rounded-full border border-[#ef4444]/30 bg-[#ef4444]/12 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#fecaca]">
                    Czarna lista
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="relative flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b93a8]">Wizyty</p>
              <p className="mt-1 text-lg font-semibold text-white">{client.visit_count ?? payload?.visit_count ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b93a8]">Naprawy</p>
              <p className="mt-1 text-lg font-semibold text-white">{repairs.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b93a8]">Ostatnia wizyta</p>
              <p className="mt-1 text-sm font-semibold text-white">{lastVisit}</p>
            </div>
          </div>
        </div>

        {deleteError ? <p className="relative mt-4 rounded-2xl border border-[#ef4444]/30 bg-[#ef4444]/12 px-4 py-3 text-sm text-[#fecaca]">{deleteError}</p> : null}

        <div className="relative mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={<Wrench size={16} />} label="Wszystkie naprawy" value={String(repairs.length)} hint="Historia serwisowa klienta" />
          <MetricCard icon={<ShieldCheck size={16} />} label="Aktywne" value={String(activeRepairs.length)} hint="Otwarte lub w toku zgłoszenia" />
          <MetricCard icon={<CalendarDays size={16} />} label="Urządzenia" value={String(devices.length)} hint="Powiązane urządzenia klienta" />
          <MetricCard icon={<Wallet size={16} />} label="Obrót" value={totalSpent} hint="Łączna wydana kwota" />
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[360px,1fr]">
        <div className="flex flex-col gap-5">
          <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
            <SectionTitle eyebrow="Dane klienta" title="Kontakt i status" />
            <dl className="mt-4 divide-y divide-white/5">
              {client.email ? (
                <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
                  <dt className="shrink-0 text-[#8b93a8]">E-mail</dt>
                  <dd className="text-right font-semibold text-[#e5e7eb]">
                    <a href={`mailto:${client.email}`} className="text-[#93c5fd] hover:underline">
                      {client.email}
                    </a>
                  </dd>
                </div>
              ) : null}
              {client.phone ? (
                <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
                  <dt className="shrink-0 text-[#8b93a8]">Telefon</dt>
                  <dd className="text-right font-semibold text-[#e5e7eb]">
                    <a href={`tel:${client.phone}`} className="text-[#93c5fd] hover:underline">
                      {client.phone}
                    </a>
                  </dd>
                </div>
              ) : null}
              <InfoRow label="Typ" value={client.client_type_display || (isBusiness ? "Firma" : "Osoba prywatna")} />
              <InfoRow label="Segment" value={client.client_segment_display || "—"} />
              <InfoRow label="Preferowany kontakt" value={client.preferred_contact || "—"} />
              <InfoRow label="Marketing" value={client.accepts_marketing ?? null} />
              <InfoRow label="NIP" value={client.nip} />
              <InfoRow label="Osoba kontaktowa" value={client.contact_person} />
            </dl>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
            <SectionTitle eyebrow="Adres" title="Dane adresowe" />
            <dl className="mt-4 divide-y divide-white/5">
              <InfoRow label="Ulica" value={client.street} />
              <InfoRow label="Miasto" value={client.city} />
              <InfoRow label="Kod pocztowy" value={client.postal_code} />
              <InfoRow label="Kraj" value={client.country} />
              <InfoRow label="Stworzono" value={formatDateTime(client.created_at)} />
              <InfoRow label="Zaktualizowano" value={formatDateTime(client.updated_at)} />
            </dl>
            {defaultAddress ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{defaultAddress.label}</p>
                  {defaultAddress.is_default ? <span className="rounded-full bg-[#3b82f6]/15 px-2 py-0.5 text-[11px] font-semibold text-[#93c5fd]">Domyślny</span> : null}
                </div>
                <p className="mt-2 text-sm text-[#d1d5db]">
                  {defaultAddress.street}
                  {defaultAddress.house_number ? ` ${defaultAddress.house_number}` : ""}
                  , {defaultAddress.postal_code} {defaultAddress.city}
                </p>
                {defaultAddress.phone ? <p className="mt-1 text-xs text-[#8b93a8]">Tel. {defaultAddress.phone}</p> : null}
                {defaultAddress.additional_info ? <p className="mt-2 whitespace-pre-wrap text-sm text-[#9ca3af]">{defaultAddress.additional_info}</p> : null}
              </div>
            ) : null}
          </section>

          {client.internal_notes ? (
            <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
              <SectionTitle eyebrow="Notatki wewnętrzne" title="Uwagi zespołu" />
              <p className="mt-4 whitespace-pre-wrap rounded-2xl border border-[#f59e0b]/20 bg-[#f59e0b]/8 p-4 text-sm leading-relaxed text-[#fde68a]">
                {client.internal_notes}
              </p>
            </section>
          ) : null}

          {client.addresses && client.addresses.length > 0 ? (
            <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
              <SectionTitle eyebrow="Książka adresowa" title="Zapisane adresy" count={client.addresses.length} />
              <div className="mt-4 space-y-3">
                {client.addresses.map((address) => (
                  <div key={address.id} className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{address.label}</p>
                      {address.is_default ? <span className="rounded-full bg-[#22c55e]/12 px-2 py-0.5 text-[11px] font-semibold text-[#86efac]">Domyślny</span> : null}
                    </div>
                    <p className="mt-2 text-sm text-[#d1d5db]">
                      {address.street}
                      {address.house_number ? ` ${address.house_number}` : ""}, {address.postal_code} {address.city}
                    </p>
                    <p className="mt-1 text-xs text-[#8b93a8]">{address.country}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <div className="flex flex-col gap-5">
          <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
            <SectionTitle eyebrow="Historia" title="Naprawy klienta" count={repairs.length} />

            {repairs.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={EMPTY_STATES.repairs.icon}
                  title="Brak napraw"
                  description="Ten klient nie ma jeszcze historii napraw w systemie."
                />
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {activeRepairs.length > 0 ? (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b93a8]">Aktywne</p>
                    <div className="mt-3 space-y-3">
                      {activeRepairs.map((repair) => {
                        const tone = getRepairTone(repair.status);
                        return (
                          <Link
                            key={repair.id}
                              href={panelPaths.repairDetailPath(repair.id)}
                            className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0f1117] px-4 py-3 transition hover:border-white/20 hover:bg-[#111420]"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-sm font-bold text-white">{repair.repair_number}</span>
                                <span className="text-xs text-[#6b7280]">·</span>
                                <span className="truncate text-sm text-[#e5e7eb]">{repair.device_name || "Urządzenie"}</span>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#8b93a8]">
                                <span>{repair.status_display || repair.status}</span>
                                <span>·</span>
                                <span>{formatDate(repair.created_at)}</span>
                                {repair.final_cost ? (
                                  <>
                                    <span>·</span>
                                    <span>{formatMoney(repair.final_cost)}</span>
                                  </>
                                ) : null}
                              </div>
                            </div>
                            <span className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide" style={{ background: tone.bg, borderColor: tone.border, color: tone.text }}>
                              {repair.status_display || repair.status}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {archivedRepairs.length > 0 ? (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b93a8]">Archiwalne</p>
                    <div className="mt-3 space-y-3">
                      {archivedRepairs.map((repair) => {
                        const tone = getRepairTone(repair.status);
                        return (
                          <Link
                            key={repair.id}
                              href={panelPaths.repairDetailPath(repair.id)}
                            className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0a0b0f] px-4 py-3 transition hover:border-white/20 hover:bg-[#0c0d12]"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-sm font-semibold text-[#9ca3af]">{repair.repair_number}</span>
                                <span className="text-xs text-[#6b7280]">·</span>
                                <span className="truncate text-sm text-[#9ca3af]">{repair.device_name || "Urządzenie"}</span>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#6b7280]">
                                <span>{repair.status_display || repair.status}</span>
                                <span>·</span>
                                <span>{formatDate(repair.created_at)}</span>
                                {repair.final_cost ? (
                                  <>
                                    <span>·</span>
                                    <span>{formatMoney(repair.final_cost)}</span>
                                  </>
                                ) : null}
                              </div>
                            </div>
                            <span className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide" style={{ background: tone.bg, borderColor: tone.border, color: tone.text }}>
                              {repair.status_display || repair.status}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </section>

          <div className="grid gap-5 xl:grid-cols-2">
            <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
              <SectionTitle eyebrow="Urządzenia" title="Sprzęt klienta" count={devices.length} />
              {devices.length === 0 ? (
                <div className="mt-4">
                  <EmptyState icon="📦" title="Brak urządzeń" description="Klient nie ma jeszcze powiązanych urządzeń." />
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {devices.map((device) => (
                    <div key={device.id} className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{device.device_name || "Urządzenie"}</p>
                          <p className="mt-1 text-xs text-[#8b93a8]">{device.brand_name || "—"}</p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#cbd5e1]">
                          {device.category || "—"}
                        </span>
                      </div>
                      {device.serial_number ? <p className="mt-2 text-xs text-[#9ca3af]">S/N: {device.serial_number}</p> : null}
                      {device.created_at ? <p className="mt-1 text-xs text-[#6b7280]">Dodano: {formatDate(device.created_at)}</p> : null}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
              <SectionTitle eyebrow="Notatki" title="Historia komentarzy" count={notes.length} />
              {notes.length === 0 ? (
                <div className="mt-4">
                  <EmptyState icon="📝" title="Brak notatek" description="W systemie nie zapisano jeszcze notatek dla tego klienta." />
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className={`rounded-2xl border p-4 ${note.is_important ? "border-[#f59e0b]/25 bg-[#f59e0b]/10" : "border-white/10 bg-white/[.04]"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <NotebookPen size={15} className={note.is_important ? "text-[#f59e0b]" : "text-[#93c5fd]"} />
                          <p className="text-sm font-semibold text-white">{note.author || "Zespół"}</p>
                        </div>
                        <p className="text-xs text-[#8b93a8]">{formatDateTime(note.created_at)}</p>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#d1d5db]">{note.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
            <SectionTitle eyebrow="Akcje" title="Szybkie działania" />
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`${panelPaths.repairsListPath}?client=${client.id}`}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#cbd5e1] transition hover:bg-white/10 hover:text-white"
              >
                <Wrench size={15} />
                Wszystkie naprawy
              </Link>
              {client.phone ? (
                <a
                  href={`tel:${client.phone}`}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#cbd5e1] transition hover:bg-white/10 hover:text-white"
                >
                  <Phone size={15} />
                  Zadzwoń
                </a>
              ) : null}
              {client.email ? (
                <a
                  href={`mailto:${client.email}`}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#cbd5e1] transition hover:bg-white/10 hover:text-white"
                >
                  <Mail size={15} />
                  Napisz e-mail
                </a>
              ) : null}
              <Link
                href={`${panelPaths.klienciPath}/${client.id}/edit`}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#3b82f6]/30 bg-[#3b82f6]/12 px-4 py-2 text-sm font-semibold text-[#dbeafe] transition hover:bg-[#3b82f6]/18 hover:text-white"
              >
                <ChevronRight size={15} />
                Edytuj dane
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
