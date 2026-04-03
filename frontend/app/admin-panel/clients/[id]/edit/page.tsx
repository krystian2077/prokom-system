"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BadgeInfo, Building2, CircleDollarSign, Clock3, MapPin, Save, ShieldAlert, Sparkles, User, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { usePanelBasePath } from "@/lib/panelPaths";
import { ErrorState } from "@/components/ui/ErrorState";
import { StackedRowSkeleton } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Select";
import {
  CLIENT_SEGMENT_OPTIONS,
  CLIENT_TYPE_OPTIONS,
  CONTACT_PREFERENCE_OPTIONS,
  formatDateTime,
  formatMoney,
  getClientDisplayName,
  type AdminClientDetail,
} from "../../shared";

type ClientFormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  client_type: string;
  client_segment: string;
  company_name: string;
  nip: string;
  contact_person: string;
  company_email: string;
  company_phone: string;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  preferred_contact: string;
  accepts_marketing: boolean;
  internal_notes: string;
  is_vip: boolean;
  is_blacklisted: boolean;
};

const EMPTY_FORM: ClientFormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  client_type: "individual",
  client_segment: "new",
  company_name: "",
  nip: "",
  contact_person: "",
  company_email: "",
  company_phone: "",
  street: "",
  city: "",
  postal_code: "",
  country: "Polska",
  preferred_contact: "email",
  accepts_marketing: false,
  internal_notes: "",
  is_vip: false,
  is_blacklisted: false,
};

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-[#6b7280]">{hint}</span> : null}
    </label>
  );
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#6b7280] focus:border-[#60a5fa]/45 focus:ring-4 focus:ring-[#60a5fa]/10",
        className,
      ].join(" ")}
    />
  );
}

function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "min-h-[120px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#6b7280] focus:border-[#60a5fa]/45 focus:ring-4 focus:ring-[#60a5fa]/10",
        className,
      ].join(" ")}
    />
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[.045] p-4 shadow-[0_12px_28px_rgba(0,0,0,.22)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9db0d4]">{label}</p>
          <p className="mt-2 text-lg font-semibold text-white">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#93c5fd]">{icon}</div>
      </div>
    </div>
  );
}

export default function AdminClientEditPage() {
  const panelPaths = usePanelBasePath();
  const { token, user } = useAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const clientId = params?.id;
  const isStaffOrAdmin = user?.role === "staff" || user?.role === "admin";
  const canEditVipBlacklist = user?.role === "admin";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [client, setClient] = useState<AdminClientDetail | null>(null);
  const [form, setForm] = useState<ClientFormState>(EMPTY_FORM);

  const load = async () => {
    if (!token || !clientId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<AdminClientDetail>(`/clients/${clientId}/`, token);
      setClient(res);
      setForm({
        first_name: res.first_name ?? "",
        last_name: res.last_name ?? "",
        email: res.email ?? "",
        phone: res.phone ?? "",
        client_type: res.client_type ?? "individual",
        client_segment: res.client_segment ?? "new",
        company_name: res.company_name ?? "",
        nip: res.nip ?? "",
        contact_person: res.contact_person ?? "",
        company_email: res.company_email ?? "",
        company_phone: res.company_phone ?? "",
        street: res.street ?? "",
        city: res.city ?? "",
        postal_code: res.postal_code ?? "",
        country: res.country ?? "Polska",
        preferred_contact: res.preferred_contact ?? "email",
        accepts_marketing: Boolean(res.accepts_marketing),
        internal_notes: res.internal_notes ?? "",
        is_vip: Boolean(res.is_vip),
        is_blacklisted: Boolean(res.is_blacklisted),
      });
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Nie udało się pobrać danych klienta."));
      setClient(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isStaffOrAdmin) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, clientId, isStaffOrAdmin]);

  const displayName = useMemo(() => (client ? getClientDisplayName(client) : "Klient"), [client]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !clientId) return;
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        client_type: form.client_type,
        client_segment: form.client_segment,
        company_name: form.company_name.trim(),
        nip: form.nip.trim(),
        contact_person: form.contact_person.trim(),
        company_email: form.company_email.trim(),
        company_phone: form.company_phone.trim(),
        street: form.street.trim(),
        city: form.city.trim(),
        postal_code: form.postal_code.trim(),
        country: form.country.trim() || "Polska",
        preferred_contact: form.preferred_contact,
        accepts_marketing: form.accepts_marketing,
        internal_notes: form.internal_notes.trim(),
        ...(canEditVipBlacklist
          ? {
              is_vip: form.is_vip,
              is_blacklisted: form.is_blacklisted,
            }
          : {}),
      };
      await api.patch(`/clients/${clientId}/`, payload, token);
      router.replace(`${panelPaths.klienciPath}/${clientId}`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Nie udało się zapisać zmian.");
    } finally {
      setSaving(false);
    }
  };

  if (!isStaffOrAdmin) {
    return null;
  }

  if (loading) {
    return (
      <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-8">
        <div className="mb-6 h-9 w-40 animate-pulse rounded-xl bg-white/10" />
        <div className="grid gap-5 xl:grid-cols-[1.2fr,.8fr]">
          <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
            <StackedRowSkeleton rows={8} />
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
          ← Wróć do szczegółów
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`${panelPaths.klienciPath}/${clientId}`}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={16} />
          Wróć do szczegółów
        </Link>
        <div className="flex items-center gap-2 text-sm text-[#9ca3af]">
          <BadgeInfo size={16} />
          Edycja danych klienta: <span className="font-semibold text-white">{displayName}</span>
        </div>
      </div>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,22,37,.98),rgba(11,14,24,.98))] p-5 shadow-[0_22px_60px_rgba(0,0,0,.4)]">
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,.18),transparent_45%),radial-gradient(circle_at_top_right,rgba(245,158,11,.16),transparent_35%)]" />
        <div className="relative grid gap-4 xl:grid-cols-4">
          <StatCard icon={<User size={16} />} label="Nr klienta" value={client.client_number || "—"} />
          <StatCard icon={<Building2 size={16} />} label="Typ" value={client.client_type_display || client.client_type || "—"} />
          <StatCard icon={<Sparkles size={16} />} label="Segment" value={client.client_segment_display || client.client_segment || "—"} />
          <StatCard icon={<Wallet size={16} />} label="Obrót" value={formatMoney(client.total_spent)} />
        </div>
      </section>

      <form onSubmit={(e) => void submit(e)} className="mt-5 grid gap-5 xl:grid-cols-[1.2fr,.8fr]">
        <div className="space-y-5">
          <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b93a8]">Dane podstawowe</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Imię *" hint="Nazwa kontaktowa klienta">
                <Input value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} required />
              </Field>
              <Field label="Nazwisko *" hint="Nazwa kontaktowa klienta">
                <Input value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} required />
              </Field>
              <Field label="E-mail *">
                <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
              </Field>
              <Field label="Telefon *">
                <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} required />
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b93a8]">Status i segmentacja</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Typ klienta">
                <Select
                  value={form.client_type}
                  onChange={(e) => setForm((p) => ({ ...p, client_type: e.target.value }))}
                  options={CLIENT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                />
              </Field>
              <Field label="Segment klienta">
                <Select
                  value={form.client_segment}
                  onChange={(e) => setForm((p) => ({ ...p, client_segment: e.target.value }))}
                  options={CLIENT_SEGMENT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                />
              </Field>
              {canEditVipBlacklist ? (
                <>
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 md:col-span-2">
                    <input
                      type="checkbox"
                      checked={form.is_vip}
                      onChange={(e) => setForm((p) => ({ ...p, is_vip: e.target.checked }))}
                      className="h-4 w-4 rounded border-white/20 bg-transparent text-[#3b82f6]"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-white">VIP / premium</span>
                      <span className="block text-xs text-[#8b93a8]">Podkreśl klienta priorytetowego w panelu i na listach.</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-[#ef4444]/20 bg-[#ef4444]/10 px-4 py-3 md:col-span-2">
                    <input
                      type="checkbox"
                      checked={form.is_blacklisted}
                      onChange={(e) => setForm((p) => ({ ...p, is_blacklisted: e.target.checked }))}
                      className="h-4 w-4 rounded border-white/20 bg-transparent text-[#ef4444]"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-white">Na czarnej liście</span>
                      <span className="block text-xs text-[#fca5a5]">Włącza ostrzegawczy status klienta.</span>
                    </span>
                  </label>
                </>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-[#8b93a8] md:col-span-2">
                  VIP i blacklist może zmieniać tylko administrator.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b93a8]">Dane firmy i adres</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Nazwa firmy">
                <Input value={form.company_name} onChange={(e) => setForm((p) => ({ ...p, company_name: e.target.value }))} />
              </Field>
              <Field label="NIP">
                <Input value={form.nip} onChange={(e) => setForm((p) => ({ ...p, nip: e.target.value }))} />
              </Field>
              <Field label="Osoba kontaktowa">
                <Input value={form.contact_person} onChange={(e) => setForm((p) => ({ ...p, contact_person: e.target.value }))} />
              </Field>
              <Field label="E-mail firmowy">
                <Input type="email" value={form.company_email} onChange={(e) => setForm((p) => ({ ...p, company_email: e.target.value }))} />
              </Field>
              <Field label="Telefon firmowy">
                <Input value={form.company_phone} onChange={(e) => setForm((p) => ({ ...p, company_phone: e.target.value }))} />
              </Field>
              <Field label="Preferowany kontakt">
                <Select
                  value={form.preferred_contact}
                  onChange={(e) => setForm((p) => ({ ...p, preferred_contact: e.target.value }))}
                  options={CONTACT_PREFERENCE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                />
              </Field>
              <Field label="Ulica">
                <Input value={form.street} onChange={(e) => setForm((p) => ({ ...p, street: e.target.value }))} />
              </Field>
              <Field label="Miasto">
                <Input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
              </Field>
              <Field label="Kod pocztowy">
                <Input value={form.postal_code} onChange={(e) => setForm((p) => ({ ...p, postal_code: e.target.value }))} />
              </Field>
              <Field label="Kraj">
                <Input value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} />
              </Field>
            </div>
            <label className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <input
                type="checkbox"
                checked={form.accepts_marketing}
                onChange={(e) => setForm((p) => ({ ...p, accepts_marketing: e.target.checked }))}
                className="h-4 w-4 rounded border-white/20 bg-transparent text-[#3b82f6]"
              />
              <span>
                <span className="block text-sm font-semibold text-white">Akceptuje marketing</span>
                <span className="block text-xs text-[#8b93a8]">Możesz to wykorzystać do komunikacji i newsletterów.</span>
              </span>
            </label>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b93a8]">Uwagi</p>
            <div className="mt-4">
              <Field label="Notatki wewnętrzne">
                <Textarea
                  value={form.internal_notes}
                  onChange={(e) => setForm((p) => ({ ...p, internal_notes: e.target.value }))}
                  placeholder="Dodatkowe informacje, alerty, preferencje klienta..."
                />
              </Field>
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b93a8]">Podsumowanie</p>
            <div className="mt-4 space-y-3 text-sm">
              <SummaryLine label="Klient" value={displayName} />
              <SummaryLine label="Numer" value={client.client_number || "—"} />
              <SummaryLine label="Naprawy" value={String(client.total_repairs ?? 0)} />
              <SummaryLine label="Wizyty" value={String(client.visit_count ?? 0)} />
              <SummaryLine label="Ostatnia wizyta" value={formatDateTime(client.last_visit_at)} />
              <SummaryLine label="Obrót" value={formatMoney(client.total_spent)} />
              <SummaryLine label="Utworzono" value={formatDateTime(client.created_at)} />
              <SummaryLine label="Zmieniono" value={formatDateTime(client.updated_at)} />
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b93a8]">Szybkie wskazówki</p>
            <div className="mt-4 space-y-3 text-sm text-[#cbd5e1]">
              <Tip icon={<Clock3 size={15} />} text="Po zapisaniu wrócisz automatycznie do szczegółów klienta." />
              <Tip icon={<MapPin size={15} />} text="Adres główny i zapisane adresy są podglądowe — edycja odbywa się tutaj." />
              {canEditVipBlacklist ? <Tip icon={<ShieldAlert size={15} />} text="Blacklist i VIP zmieniają wygląd karty klienta w całym panelu." /> : null}
              <Tip icon={<CircleDollarSign size={15} />} text="Obrót jest tylko do odczytu i pochodzi z backendu." />
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b93a8]">Zapis zmian</p>
            {saveError ? <p className="mt-3 rounded-2xl border border-[#ef4444]/30 bg-[#ef4444]/12 px-4 py-3 text-sm text-[#fecaca]">{saveError}</p> : null}
            <button
              type="submit"
              disabled={saving}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#dc1e1e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#b81818] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? "Zapisywanie..." : "Zapisz zmiany"}
            </button>
          </section>
        </aside>
      </form>
    </main>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/5 bg-white/[.03] px-4 py-3">
      <span className="text-[#8b93a8]">{label}</span>
      <span className="text-right font-semibold text-white">{value}</span>
    </div>
  );
}

function Tip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[.03] px-4 py-3">
      <span className="mt-0.5 text-[#93c5fd]">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

