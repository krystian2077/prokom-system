"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { RepairDetail, RepairTimelineEvent } from "@/types/repairs";
import { AddNoteModal } from "@/components/panel/modals/AddNoteModal";
import { AssignModal } from "@/components/panel/modals/AssignModal";
import { StatusChangeModal, type RepairStatusValue } from "@/components/panel/modals/StatusChangeModal";
import { RepairPartsSection } from "@/components/panel/RepairPartsSection";

const DELIVERY_LABELS: Record<string, string> = {
  in_person: "Osobiście w serwisie",
  courier: "Kurier",
  parcel_locker: "Paczkomat",
};
const RETURN_LABELS: Record<string, string> = {
  in_person: "Odbiór osobisty",
  courier: "Kurier do klienta",
  parcel_locker: "Paczkomat",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="shrink-0 text-[#9ca3af]">{label}</dt>
      <dd className="text-right text-[#e5e7eb]">{value ?? "–"}</dd>
    </div>
  );
}

function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-[#0c0d12] p-5 ${className}`}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9ca3af]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function PanelRepairDetailPage() {
  const { token, user } = useAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<RepairDetail | null>(null);
  const [timeline, setTimeline] = useState<RepairTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);

  type CommTab = "messages" | "notes" | "team_notes";
  const [commTab, setCommTab] = useState<CommTab>("messages");

  type EmailTemplate = {
    id: number;
    name: string;
    channel: string;
    channel_display?: string;
    message_type: string;
    message_type_display?: string;
    subject?: string;
    suggested_for_status?: string;
    is_active?: boolean;
    sort_order?: number;
  };
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [sendEmailError, setSendEmailError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const eligibleEmailTemplates = useMemo(() => {
    const status = data?.status ?? "";
    // Endpoint może zwracać paginację obiekt zamiast tablicy (DRF pagination).
    const templates = Array.isArray(emailTemplates) ? emailTemplates : [];
    return templates.filter((t) => {
      const sf = (t.suggested_for_status ?? "").trim();
      return !sf || sf === status;
    });
  }, [emailTemplates, data?.status]);

  const commTimelineEvents = useMemo(() => {
    return timeline.filter((ev) => {
      if (commTab === "messages") return ev.type === "communication";
      if (commTab === "notes") return ev.type === "note" && ev.is_internal === false;
      return ev.type === "note" && ev.is_internal === true;
    });
  }, [timeline, commTab]);

  const loadAll = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.get<RepairDetail>(`/repairs/${params.id}/`, token);
      setData(res);
      const tl = await api.get<RepairTimelineEvent[]>(`/repairs/${params.id}/timeline/`, token);
      setTimeline(tl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać szczegółów naprawy.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, params.id]);

  useEffect(() => {
    const loadTemplates = async () => {
      if (!token) return;
      setTemplatesLoading(true);
      setTemplatesError(null);
      try {
        const res = await api.get<any>(`/communications/templates/?channel=email&active_only=1`, token);
        const list: EmailTemplate[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.results)
            ? res.results
            : [];

        setEmailTemplates(list);
        setSelectedTemplateId((prev) => {
          if (prev && list.some((t) => t.id === prev)) return prev;
          const first = list[0]?.id ?? null;
          return first;
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Nie udało się pobrać szablonów e-mail.";
        setTemplatesError(msg);
      } finally {
        setTemplatesLoading(false);
      }
    };

    void loadTemplates();
  }, [token]);

  useEffect(() => {
    setSelectedTemplateId((prev) => {
      if (prev && eligibleEmailTemplates.some((t) => t.id === prev)) return prev;
      return eligibleEmailTemplates[0]?.id ?? null;
    });
  }, [eligibleEmailTemplates]);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center gap-3 text-[#9ca3af]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#dc1e1e] border-t-transparent" />
          Ładowanie szczegółów naprawy…
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-[#fca5a5]">{error || "Brak danych."}</p>
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

  const client = data.client ?? { full_name: data.client_name, email: "", phone: "" };
  const device = data.device ?? { device_name: data.device_name, brand_name: "", category: "" };
  const deliveryLabel = DELIVERY_LABELS[data.delivery_method] ?? data.delivery_method;
  const returnLabel = RETURN_LABELS[data.return_method] ?? data.return_method;

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 text-sm text-[#9ca3af] transition hover:text-white"
      >
        ← Wróć do listy zgłoszeń
      </button>

      {/* Nagłówek */}
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-white/10 bg-[#0c0d12] p-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#9ca3af]">Naprawa</p>
          <h1 className="mt-1 text-xl font-semibold text-white md:text-2xl">
            {data.repair_number}
          </h1>
          <p className="mt-2 text-sm text-[#b4b8c4]">
            {device.device_name} · {client.full_name}
          </p>
        </div>
        <div className="rounded-xl bg-white/5 px-4 py-3 text-right">
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-400">
            {data.status_display}
          </span>
          {data.estimated_completion_date && (
            <p className="mt-1 text-[11px] text-[#9ca3af]">
              Termin: {new Date(data.estimated_completion_date).toLocaleDateString("pl-PL")}
              {data.estimated_duration_display && ` · ${data.estimated_duration_display}`}
            </p>
          )}
          {data.assigned_to && (
            <p className="mt-1 text-[11px] text-[#9ca3af]">
              Przypisany: {data.assigned_to.first_name} {data.assigned_to.last_name}
            </p>
          )}
        </div>
      </header>

      <div className="mb-8 flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setStatusModalOpen(true)}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
        >
          Zmień status
        </button>

        <button
          type="button"
          onClick={() => setAssignModalOpen(true)}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
        >
          {isAdmin ? "Przypisz (admin)" : "Przypisz mnie"}
        </button>

        <button
          type="button"
          onClick={() => setNoteModalOpen(true)}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
        >
          Dodaj notatkę
        </button>
      </div>

      {/* Dane z formularza zgłoszenia */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Section title="Dane klienta (z formularza)">
            <dl className="divide-y divide-white/5">
              <InfoRow label="Imię i nazwisko" value={client.full_name} />
              <InfoRow label="E-mail" value={client.email} />
              <InfoRow label="Telefon" value={client.phone} />
            </dl>
          </Section>

          <Section title="Urządzenie (z formularza)">
            <dl className="divide-y divide-white/5">
              <InfoRow label="Urządzenie" value={device.device_name} />
              <InfoRow label="Marka" value={device.brand_name} />
              <InfoRow label="Kategoria" value={device.category} />
              <InfoRow label="Numer seryjny" value={device.serial_number} />
            </dl>
          </Section>

          <Section title="Opis problemu">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#e5e7eb]">
              {data.problem_description || "Brak opisu."}
            </p>
          </Section>

          <Section title="Dostawa i zwrot">
            <dl className="divide-y divide-white/5">
              <InfoRow label="Sposób dostarczenia" value={deliveryLabel} />
              <InfoRow label="Sposób zwrotu" value={returnLabel} />
              {data.client_tracking_number && (
                <InfoRow label="Numer śledzenia (klient)" value={data.client_tracking_number} />
              )}
            </dl>
          </Section>

          <Section title="Uwagi i stan urządzenia">
            <dl className="divide-y divide-white/5">
              {data.client_notes != null && data.client_notes !== "" && (
                <InfoRow label="Uwagi klienta" value={data.client_notes} />
              )}
              {data.device_turns_on != null && (
                <InfoRow
                  label="Urządzenie włącza się"
                  value={data.device_turns_on ? "Tak" : "Nie"}
                />
              )}
              {data.visual_condition_description != null && data.visual_condition_description !== "" && (
                <InfoRow label="Stan wizualny" value={data.visual_condition_description} />
              )}
              {!data.client_notes && data.device_turns_on == null && !data.visual_condition_description && (
                <p className="py-2 text-sm text-[#6b7280]">Brak dodatkowych uwag.</p>
              )}
            </dl>
          </Section>

          <Section title="Opcje zgłoszenia">
            <dl className="divide-y divide-white/5">
              <InfoRow label="Pilna" value={data.is_urgent ? "Tak" : "Nie"} />
              <InfoRow label="Tego samego dnia" value={data.is_same_day ? "Tak" : "Nie"} />
              <InfoRow label="Gwarancja" value={data.is_warranty ? "Tak" : "Nie"} />
              <InfoRow label="Wymaga kopii danych" value={data.requires_data_backup ? "Tak" : "Nie"} />
            </dl>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Status i wewnętrzne">
            <dl className="divide-y divide-white/5">
              <InfoRow label="Status wewnętrzny" value={data.internal_status} />
              <InfoRow label="Priorytet" value={data.priority_display} />
              <InfoRow label="Typ naprawy" value={data.repair_type} />
              <InfoRow label="Wymaga uwagi" value={data.requires_attention ? "Tak" : "Nie"} />
              <InfoRow label="Data zgłoszenia" value={new Date(data.created_at).toLocaleString("pl-PL")} />
            </dl>
          </Section>

          <Section title="Notatki wewnętrzne">
            <p className="whitespace-pre-wrap text-sm text-[#9ca3af]">
              {data.internal_notes || "Brak notatek wewnętrznych."}
            </p>
          </Section>

          <Section title="Oś czasu (statusy)">
            <div className="space-y-4">
              {timeline.filter((ev) => ev.type === "status_change").length === 0 && (
                <p className="text-sm text-[#6b7280]">Brak zmian statusu w historii.</p>
              )}
              {timeline
                .filter((ev) => ev.type === "status_change")
                .map((ev) => {
                  const date = new Date(ev.created_at).toLocaleString("pl-PL");
                  return (
                    <div key={`${ev.type}-${ev.id}`} className="flex gap-3">
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#dc1e1e]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-[#9ca3af]">
                          {date} · Zmiana statusu{ev.changed_by_name ? ` · ${ev.changed_by_name}` : ""}
                        </p>
                        <p className="mt-0.5 text-sm text-[#e5e7eb]">
                          {ev.old_status_display || "–"} → {ev.new_status_display || "–"}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Section>

          <Section title="Części w naprawie">
            <RepairPartsSection repairId={params.id} token={token} onAfterMutation={loadAll} />
          </Section>

          <Section title="Komunikacja (timeline)">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCommTab("messages")}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                    commTab === "messages"
                      ? "border-white/20 bg-white/10 text-white"
                      : "border-white/10 bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white"
                  }`}
                >
                  Wiadomości
                </button>
                <button
                  type="button"
                  onClick={() => setCommTab("notes")}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                    commTab === "notes"
                      ? "border-white/20 bg-white/10 text-white"
                      : "border-white/10 bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white"
                  }`}
                >
                  Notatki (publiczne)
                </button>
                <button
                  type="button"
                  onClick={() => setCommTab("team_notes")}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                    commTab === "team_notes"
                      ? "border-white/20 bg-white/10 text-white"
                      : "border-white/10 bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white"
                  }`}
                >
                  Komunikacja zespołowa
                </button>
              </div>

              {templatesError && commTab === "messages" && (
                <p className="text-sm text-[#fca5a5]">{templatesError}</p>
              )}

              <div className="rounded-2xl border border-white/10 bg-[#0b0c10] p-4">
                {commTimelineEvents.length === 0 ? (
                  <p className="text-sm text-[#6b7280]">Brak wpisów w tej kategorii.</p>
                ) : (
                  <div className="space-y-4">
                    {commTimelineEvents.map((ev) => {
                        if (ev.type === "communication") {
                          const date = new Date(ev.sent_at).toLocaleString("pl-PL");
                          return (
                            <div key={`${ev.type}-${ev.id}`} className="flex gap-3">
                              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#dc1e1e]" />
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] text-[#9ca3af]">
                                  {date} · {ev.channel_display}
                                  {ev.sent_by_name ? ` · ${ev.sent_by_name}` : ""}
                                </p>
                                <p className="mt-0.5 text-sm text-[#e5e7eb]">{ev.subject || ev.body_preview}</p>
                              </div>
                            </div>
                          );
                        }

                        // note
                        if (ev.type !== "note") return null;
                        const date = new Date(ev.created_at).toLocaleString("pl-PL");
                        return (
                          <div key={`${ev.type}-${ev.id}`} className="flex gap-3">
                            <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#dc1e1e]" />
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] text-[#9ca3af]">
                                {date} · Notatka{ev.author_name ? ` · ${ev.author_name}` : ""}
                                {ev.is_important ? " · ważna" : ""}
                              </p>
                              <p className="mt-0.5 whitespace-pre-wrap text-sm text-[#e5e7eb]">{ev.note}</p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setNoteModalOpen(true)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
                >
                  Dodaj notatkę
                </button>

                {commTab === "messages" && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!token || !selectedTemplateId) return;
                      setSendEmailError(null);
                      setSendingEmail(true);
                      try {
                        const res = await api.post<{ success: boolean }>(`/communications/send/`, {
                          template_id: selectedTemplateId,
                          repair_id: params.id,
                        }, token);
                        if (!res?.success) {
                          setSendEmailError("Nie udało się wysłać wiadomości.");
                        }
                        await loadAll();
                      } catch (err) {
                        const msg = err instanceof Error ? err.message : "Błąd wysyłki wiadomości.";
                        setSendEmailError(msg);
                      } finally {
                        setSendingEmail(false);
                      }
                    }}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <select
                      value={selectedTemplateId ?? ""}
                      onChange={(e) => setSelectedTemplateId(e.target.value ? Number(e.target.value) : null)}
                      disabled={templatesLoading || eligibleEmailTemplates.length === 0}
                      className="min-w-[260px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white disabled:opacity-60"
                    >
                      {eligibleEmailTemplates.length === 0 ? (
                        <option value="">Brak szablonów</option>
                      ) : (
                        eligibleEmailTemplates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.subject || t.name}
                          </option>
                        ))
                      )}
                    </select>
                    <button
                      type="submit"
                      disabled={templatesLoading || eligibleEmailTemplates.length === 0 || !selectedTemplateId || sendingEmail}
                      className="rounded-xl bg-[#dc1e1e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b61717] disabled:opacity-60"
                    >
                      {sendingEmail ? "Wysyłam…" : "Wyślij e-mail"}
                    </button>
                  </form>
                )}
              </div>

              {sendEmailError && commTab === "messages" && (
                <p className="text-sm text-[#fca5a5]">{sendEmailError}</p>
              )}
            </div>
          </Section>
        </div>
      </div>

      <StatusChangeModal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        currentStatus={data.status}
        onSubmit={async (payload) => {
          await api.post(`/repairs/${params.id}/change-status/`, payload, token);
          await loadAll();
        }}
      />

      <AssignModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        isAdmin={isAdmin}
        onSubmit={async (payload) => {
          await api.post(`/repairs/${params.id}/assign/`, payload, token);
          await loadAll();
        }}
      />

      <AddNoteModal
        open={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        onSubmit={async (payload) => {
          await api.post(`/repairs/${params.id}/notes/`, payload, token);
          await loadAll();
        }}
      />
    </main>
  );
}
