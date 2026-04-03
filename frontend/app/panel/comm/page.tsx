"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { usePanelBasePath } from "@/lib/panelPaths";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/store";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { CommThreadListSkeleton } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Select";
import type { RepairRequestListItem, RepairThreadItem } from "@/types/repairs";

type Channel = "panel" | "email";
type ViewMode = "all" | "requires_attention";
type StaffMini = { id: string; name: string };

function dateLabel(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "-"
    : d.toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function relativeTime(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} godz`;
  const days = Math.floor(hours / 24);
  return `${days} d`;
}

function threadPreview(items: RepairThreadItem[]): string {
  if (!items.length) return "Brak wiadomości";
  const last = items[items.length - 1];
  if (last.kind === "note") return (last.note || "").slice(0, 120) || "Wiadomość";
  return (last.subject || last.body_snapshot || "E-mail").slice(0, 120);
}

function assigneeId(item: RepairRequestListItem): string | null {
  if (!item.assigned_to) return null;
  if (typeof item.assigned_to === "string") return item.assigned_to;
  return item.assigned_to.id ?? null;
}

function assigneeName(item: RepairRequestListItem): string {
  const assignee = item.assigned_to;
  if (!assignee) return "Nieprzypisana";
  if (typeof assignee === "string") return "Pracownik";
  return `${assignee.first_name || ""} ${assignee.last_name || ""}`.trim() || assignee.email || "Pracownik";
}

export default function CommPage() {
  const { token, user } = useAuth();
  const p = usePanelBasePath();
  const searchParams = useSearchParams();
  const addToast = useStore((s) => s.addToast);

  const isStaffOrAdmin = user?.role === "staff" || user?.role === "admin";
  const initialRepairId = searchParams.get("repairId");

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");

  const [repairs, setRepairs] = useState<RepairRequestListItem[]>([]);
  const [activeRepairId, setActiveRepairId] = useState<string | null>(null);
  const [messagesByRepair, setMessagesByRepair] = useState<Record<string, RepairThreadItem[]>>({});

  const [channel, setChannel] = useState<Channel>("panel");
  const [draft, setDraft] = useState("");
  const [emailSubject, setEmailSubject] = useState("");

  const [loadingRepairs, setLoadingRepairs] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchDraft.trim().toLowerCase()), 250);
    return () => window.clearTimeout(t);
  }, [searchDraft]);

  useEffect(() => {
    if (!user?.id) return;
    setSelectedStaffId(user.id);
  }, [user?.id]);

  const loadRepairs = async () => {
    if (!token || !isStaffOrAdmin) return;
    setLoadingRepairs(true);
    setError(null);
    try {
      const rows = await api.get<RepairRequestListItem[]>("/staff/repairs/?ordering=-last_activity_at", token);
      const list = Array.isArray(rows) ? rows : [];

      // Worker widzi wyłącznie naprawy przypisane do siebie.
      const mine = user?.id ? list.filter((r) => assigneeId(r) === user.id) : [];

      setRepairs(mine);
      setActiveRepairId((prev) => {
        if (prev && mine.some((r) => r.id === prev)) return prev;
        if (initialRepairId && mine.some((r) => r.id === initialRepairId)) return initialRepairId;
        return mine[0]?.id ?? null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się pobrać rozmów.");
    } finally {
      setLoadingRepairs(false);
    }
  };

  const loadThread = async (repairId: string) => {
    if (!token || !repairId) return;
    if (messagesByRepair[repairId]) return;
    setLoadingThread(true);
    try {
      const items = await api.get<RepairThreadItem[]>(`/repairs/${repairId}/messages/`, token);
      setMessagesByRepair((prev) => ({ ...prev, [repairId]: Array.isArray(items) ? items : [] }));
    } catch {
      setMessagesByRepair((prev) => ({ ...prev, [repairId]: [] }));
    } finally {
      setLoadingThread(false);
    }
  };

  useEffect(() => {
    if (!token || !isStaffOrAdmin) return;
    void loadRepairs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isStaffOrAdmin, user?.id]);

  useEffect(() => {
    if (!activeRepairId) return;
    void loadThread(activeRepairId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRepairId, token]);

  const staffList = useMemo<StaffMini[]>(() => {
    if (!user?.id) return [];
    const ownLabel = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || "Ja";
    return [{ id: user.id, name: ownLabel }];
  }, [user?.id, user?.first_name, user?.last_name, user?.email]);

  const filteredRepairs = useMemo(() => {
    return repairs.filter((r) => {
      if (viewMode === "requires_attention" && !r.requires_attention) return false;
      if (selectedStaffId && assigneeId(r) !== selectedStaffId) return false;
      if (!search) return true;
      const haystack = `${r.repair_number} ${r.client_name} ${r.device_name} ${r.problem_description || ""}`.toLowerCase();
      const localPreview = threadPreview(messagesByRepair[r.id] || []).toLowerCase();
      return haystack.includes(search) || localPreview.includes(search);
    });
  }, [messagesByRepair, repairs, search, selectedStaffId, viewMode]);

  const orderedRepairs = useMemo(() => {
    return [...filteredRepairs].sort((a, b) => {
      const aOpen = (messagesByRepair[a.id]?.length || 0) > 0 || Boolean(a.requires_attention);
      const bOpen = (messagesByRepair[b.id]?.length || 0) > 0 || Boolean(b.requires_attention);
      if (aOpen !== bOpen) return aOpen ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [filteredRepairs, messagesByRepair]);

  const activeRepair = orderedRepairs.find((r) => r.id === activeRepairId) || orderedRepairs[0] || null;
  const activeMessages = activeRepair ? messagesByRepair[activeRepair.id] || [] : [];
  const visibleMessages = useMemo(() => activeMessages.slice(-5), [activeMessages]);

  useEffect(() => {
    if (!activeRepair) return;
    if (activeRepair.id !== activeRepairId) setActiveRepairId(activeRepair.id);
  }, [activeRepair, activeRepairId]);

  const handleSend = async () => {
    if (!token || !activeRepair || !draft.trim()) return;
    if (channel === "email" && !emailSubject.trim()) {
      addToast("Podaj temat e-maila.", "error");
      return;
    }
    setSending(true);
    setError(null);
    try {
      if (channel === "panel") {
        await api.post(
          `/repairs/${activeRepair.id}/notes/`,
          { note: draft.trim(), is_internal: false, note_type: "client_contact" },
          token,
        );
      } else {
        await api.post(
          `/repairs/${activeRepair.id}/send-client-email/`,
          { subject: emailSubject.trim(), body: draft.trim() },
          token,
        );
      }
      setDraft("");
      setEmailSubject("");
      setMessagesByRepair((prev) => {
        const next = { ...prev };
        delete next[activeRepair.id];
        return next;
      });
      await loadThread(activeRepair.id);
      await loadRepairs();
      addToast(channel === "panel" ? "Wiadomość do klienta wysłana." : "E-mail do klienta wysłany.", "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się wysłać wiadomości.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setSending(false);
    }
  };

  if (!isStaffOrAdmin) return null;

  return (
    <main className="mx-auto min-h-screen max-w-[1550px] px-4 py-8">
      <header className="mb-6 rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,.18),transparent_42%),linear-gradient(135deg,#0d1119,#111a2d_55%,#0a0f1a)] p-6 shadow-[0_24px_70px_rgba(0,0,0,.38)]">
        <p className="text-xs uppercase tracking-[0.22em] text-[#94a3b8]">Panel Pracownika · centrum komunikacji</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Komunikacja z klientami</h1>
        <p className="mt-1 max-w-3xl text-sm text-[#9fb0c8]">
          Twoje rozmowy klient-pracownik w jednym miejscu. Widzisz tylko naprawy przypisane do Ciebie i możesz wysyłać
          odpowiedzi przez panel lub e-mail.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02))] px-4 py-4 shadow-[0_12px_28px_rgba(0,0,0,.18)]">
            <p className="text-[11px] uppercase tracking-[0.15em] text-[#9fb1d3]">Wątki</p>
            <p className="mt-1 text-2xl font-semibold text-white">{repairs.length}</p>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02))] px-4 py-4 shadow-[0_12px_28px_rgba(0,0,0,.18)]">
            <p className="text-[11px] uppercase tracking-[0.15em] text-[#9fb1d3]">Wymagają reakcji</p>
            <p className="mt-1 text-2xl font-semibold text-[#fca5a5]">{repairs.filter((r) => r.requires_attention).length}</p>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02))] px-4 py-4 shadow-[0_12px_28px_rgba(0,0,0,.18)]">
            <p className="text-[11px] uppercase tracking-[0.15em] text-[#9fb1d3]">Aktywny kanał</p>
            <p className="mt-1 text-2xl font-semibold text-[#bfdbfe]">{channel === "panel" ? "Panel" : "E-mail"}</p>
          </div>
        </div>
      </header>

      <section className="mb-4 rounded-[28px] border border-white/10 bg-[#0d1119] p-4 shadow-[0_18px_50px_rgba(0,0,0,.28)] backdrop-blur">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_260px]">
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Szukaj po numerze naprawy, kliencie, urządzeniu, treści..."
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-[#7f8da8] outline-none transition hover:border-white/20 focus:border-[#4f69a3] focus:ring-4 focus:ring-[rgba(79,105,163,.16)]"
          />
          <Select
            className="w-full"
            label="Pracownik"
            value={selectedStaffId}
            placeholder="Wszyscy pracownicy"
            onChange={(e) => setSelectedStaffId(e.target.value)}
            options={staffList.map((s) => ({ value: s.id, label: s.name }))}
          />
          <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.03] p-1 text-sm shadow-[0_10px_24px_rgba(0,0,0,.12)]">
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`flex-1 rounded-lg px-3 py-1.5 font-semibold transition ${
                viewMode === "all" ? "bg-[rgba(59,130,246,.16)] text-[#dbeafe] shadow-[0_10px_22px_rgba(59,130,246,.12)]" : "text-[#9fb1d3] hover:text-white"
              }`}
            >
              Wszystkie
            </button>
            <button
              type="button"
              onClick={() => setViewMode("requires_attention")}
              className={`flex-1 rounded-lg px-3 py-1.5 font-semibold transition ${
                viewMode === "requires_attention" ? "bg-[rgba(220,30,30,.14)] text-[#fecaca] shadow-[0_10px_22px_rgba(220,30,30,.1)]" : "text-[#9fb1d3] hover:text-white"
              }`}
            >
              Wymagają reakcji
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="mb-4">
          <ErrorState error={new Error(error)} onRetry={() => void loadRepairs()} title="Błąd komunikacji" />
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[390px_1fr]">
        <aside className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,#0d1119,#0b1020)] p-3 shadow-[0_22px_60px_rgba(0,0,0,.36)]">
          <div className="px-2 pb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#9fb1d3]">Rozmowy</div>
          {loadingRepairs ? (
            <CommThreadListSkeleton rows={7} />
          ) : filteredRepairs.length === 0 ? (
            <div className="px-2 py-4">
              <EmptyState
                icon={EMPTY_STATES.messages.icon}
                title="Brak rozmów"
                description="Brak dopasowanych konwersacji. Zmień filtry lub wyszukiwane hasło."
              />
            </div>
          ) : (
            <div className="max-h-[660px] space-y-3 overflow-y-auto pr-1">
              {orderedRepairs.map((r) => {
                const active = activeRepair?.id === r.id;
                const preview = threadPreview(messagesByRepair[r.id] || []);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setActiveRepairId(r.id)}
                    className="group min-h-[106px] w-full rounded-[24px] border px-3 py-3 text-left transition duration-200 hover:-translate-y-0.5"
                    style={{
                      borderColor: active ? "rgba(59,130,246,.45)" : "rgba(255,255,255,.10)",
                      background: active
                        ? "linear-gradient(180deg, rgba(59,130,246,.16), rgba(255,255,255,.02))"
                        : "linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.015))",
                      boxShadow: active ? "0 18px 40px rgba(59,130,246,.10)" : "0 10px 24px rgba(0,0,0,.16)",
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-xs font-semibold tracking-[0.14em] text-white">{r.repair_number}</p>
                      {r.requires_attention ? <span className="rounded-full bg-[rgba(220,30,30,.16)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#fecaca]">Pilne</span> : null}
                    </div>
                    <p className="mt-1 truncate text-[15px] font-semibold tracking-[-0.01em] text-white group-hover:text-[#eaf2ff]">{r.client_name} - {r.device_name}</p>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#9fb1d3] group-hover:text-[#b9c8e3]">{preview}</p>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-[#7f8fb0]">
                      <span className="truncate">Opiekun: {assigneeName(r)}</span>
                      <span className="rounded-full bg-white/[0.04] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[#9fb1d3]">{relativeTime(r.created_at)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,#0d1119,#0b1020)] p-4 shadow-[0_22px_60px_rgba(0,0,0,.36)]">
          {!activeRepair ? (
            <div className="py-8">
              <EmptyState icon={EMPTY_STATES.notifications.icon} title="Wybierz rozmowę" description="Z lewej strony wybierz klienta i naprawę, aby zobaczyć historię." />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 shadow-[0_12px_24px_rgba(0,0,0,.12)]">
                <div>
                  <Link href={p.repairDetailPath(activeRepair.id)} className="font-mono text-sm font-semibold text-[#93c5fd] hover:underline">
                    {activeRepair.repair_number}
                  </Link>
                  <p className="mt-1 text-[15px] font-semibold tracking-[-0.01em] text-white">{activeRepair.client_name} - {activeRepair.device_name}</p>
                  <p className="mt-1 text-xs text-[#9fb1d3]">Status: {activeRepair.status_display}</p>
                </div>
                <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.03] p-1 text-xs shadow-[0_10px_24px_rgba(0,0,0,.12)]">
                  <button type="button" onClick={() => setChannel("panel")} className={`rounded-xl px-3 py-1 font-semibold transition ${channel === "panel" ? "bg-[rgba(59,130,246,.16)] text-[#dbeafe]" : "text-[#9fb1d3] hover:text-white"}`}>
                    Panel klienta
                  </button>
                  <button type="button" onClick={() => setChannel("email")} className={`rounded-xl px-3 py-1 font-semibold transition ${channel === "email" ? "bg-[rgba(59,130,246,.16)] text-[#dbeafe]" : "text-[#9fb1d3] hover:text-white"}`}>
                    E-mail
                  </button>
                </div>
              </div>

              <div className="max-h-[360px] space-y-3 overflow-y-auto rounded-[24px] border border-white/10 bg-white/[0.02] p-3">
                {loadingThread && activeMessages.length === 0 ? (
                  <CommThreadListSkeleton rows={4} />
                ) : activeMessages.length === 0 ? (
                  <div className="text-sm text-[#9fb1d3]">Brak wiadomości. Możesz rozpocząć rozmowę.</div>
                ) : (
                  visibleMessages.map((m) =>
                    m.kind === "note" ? (
                      <div key={`n-${m.id}`} className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.015))] p-3 shadow-[0_10px_22px_rgba(0,0,0,.12)]">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-[#9fb1d3]">
                          {(m.thread_origin === "client" || m.thread_origin === "email_inbound" ? "Klient" : m.author_name) || "-"} · {dateLabel(m.created_at)}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-[#e5e7eb]">{m.note}</p>
                      </div>
                    ) : (
                      <div key={`e-${m.id}`} className="rounded-[22px] border border-dashed border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,.025),rgba(255,255,255,.01))] p-3 shadow-[0_10px_22px_rgba(0,0,0,.12)]">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9fb1d3]">E-mail</p>
                        <p className="mt-2 text-[15px] font-semibold tracking-[-0.01em] text-white">{m.subject || "Bez tematu"}</p>
                        <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-[#e5e7eb]">{m.body_snapshot || "-"}</p>
                        <p className="mt-2 text-xs text-[#9fb1d3]">{m.sent_by_name || "-"} · {dateLabel(m.sent_at)}</p>
                      </div>
                    ),
                  )
                )}
              </div>

              <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.015))] p-3 shadow-[0_10px_22px_rgba(0,0,0,.12)]">
                {channel === "email" ? (
                  <input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Temat wiadomości e-mail"
                    className="mb-3 w-full rounded-2xl border border-white/10 bg-[#0d1527] px-4 py-3 text-sm text-white placeholder:text-[#7f8da8] outline-none transition hover:border-white/20 focus:border-[#4f69a3] focus:ring-4 focus:ring-[rgba(79,105,163,.16)]"
                  />
                ) : null}
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={4}
                  placeholder={
                    channel === "panel"
                      ? "Napisz odpowiedź, którą klient zobaczy w panelu..."
                      : "Napisz treść e-maila do klienta..."
                  }
                  className="w-full resize-y rounded-2xl border border-white/10 bg-[#0d1527] px-4 py-3 text-sm text-white placeholder:text-[#7f8da8] outline-none transition hover:border-white/20 focus:border-[#4f69a3] focus:ring-4 focus:ring-[rgba(79,105,163,.16)]"
                />
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-xs text-[#8ea2c7]">Kanał: {channel === "panel" ? "Wiadomość panelowa" : "E-mail"}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDraft("");
                        setEmailSubject("");
                      }}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-[#b8c7e2] transition hover:-translate-y-0.5 hover:bg-white/[0.12] hover:text-white"
                    >
                      Wyczyść
                    </button>
                    <button
                      type="button"
                      disabled={sending || !draft.trim() || (channel === "email" && !emailSubject.trim())}
                      onClick={() => void handleSend()}
                      className="rounded-2xl bg-[linear-gradient(135deg,#3b82f6,#1d4ed8)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(59,130,246,.28)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-60"
                    >
                      {sending ? "Wysyłanie..." : channel === "panel" ? "Wyślij do panelu" : "Wyślij e-mail"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

