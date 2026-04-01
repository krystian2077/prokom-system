"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/store";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { CommThreadListSkeleton } from "@/components/ui/Skeleton";
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

export default function AdminCommPage() {
  const { token, user } = useAuth();
  const addToast = useStore((s) => s.addToast);
  const isAdmin = user?.role === "admin";

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

  const loadRepairs = async () => {
    if (!token || !isAdmin) return;
    setLoadingRepairs(true);
    setError(null);
    try {
      const rows = await api.get<RepairRequestListItem[]>("/staff/repairs/?ordering=-last_activity_at", token);
      setRepairs(Array.isArray(rows) ? rows : []);
      setActiveRepairId((prev) => prev || (rows?.[0]?.id ?? null));
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
    if (!token || !isAdmin) return;
    void loadRepairs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  useEffect(() => {
    if (!activeRepairId) return;
    void loadThread(activeRepairId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRepairId, token]);

  const staffList = useMemo<StaffMini[]>(() => {
    const map = new Map<string, StaffMini>();
    for (const r of repairs) {
      const assignee = r.assigned_to;
      if (!assignee || typeof assignee === "string") continue;
      const name = `${assignee.first_name || ""} ${assignee.last_name || ""}`.trim() || assignee.email;
      map.set(assignee.id, { id: assignee.id, name });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "pl"));
  }, [repairs]);

  const filteredRepairs = useMemo(() => {
    return repairs.filter((r) => {
      if (viewMode === "requires_attention" && !r.requires_attention) return false;
      if (selectedStaffId) {
        const assignee = r.assigned_to;
        if (!assignee || typeof assignee === "string" || assignee.id !== selectedStaffId) return false;
      }
      if (!search) return true;
      const haystack = `${r.repair_number} ${r.client_name} ${r.device_name} ${r.problem_description || ""}`.toLowerCase();
      const localPreview = threadPreview(messagesByRepair[r.id] || []).toLowerCase();
      return haystack.includes(search) || localPreview.includes(search);
    });
  }, [messagesByRepair, repairs, search, selectedStaffId, viewMode]);

  const orderedRepairs = useMemo(() => {
    // "Otwarte" = mają wiadomości albo są oznaczone jako wymagające reakcji.
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

  if (!isAdmin) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
        <p className="text-sm text-[#fca5a5]">Tylko administrator ma dostęp do globalnej komunikacji.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-8">
      <header className="mb-6 rounded-3xl border border-[#2a3246] bg-gradient-to-r from-[#0e1423] via-[#121b31] to-[#0d1629] p-5 shadow-[0_18px_50px_rgba(0,0,0,.35)]">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9db0d4]">Panel Admina</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Komunikacja z klientami</h1>
        <p className="mt-1 text-sm text-[#a9b8d6]">
          Wszystkie rozmowy klient-pracownik w jednym miejscu. Administrator może przejąć komunikację i wysłać odpowiedź
          przez panel lub e-mail.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.15em] text-[#9fb1d3]">Wątki</p>
            <p className="mt-1 text-xl font-semibold text-white">{repairs.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.15em] text-[#9fb1d3]">Wymagają reakcji</p>
            <p className="mt-1 text-xl font-semibold text-[#fca5a5]">{repairs.filter((r) => r.requires_attention).length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.15em] text-[#9fb1d3]">Aktywny kanał</p>
            <p className="mt-1 text-xl font-semibold text-[#bfdbfe]">{channel === "panel" ? "Panel" : "E-mail"}</p>
          </div>
        </div>
      </header>

      <section className="mb-4 rounded-3xl border border-[#2b3650] bg-[#0c1322]/88 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_260px]">
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Szukaj po numerze naprawy, kliencie, urządzeniu, treści..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-[#7f8da8] outline-none transition focus:border-[#4f69a3]"
          />
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none transition focus:border-[#4f69a3]"
          >
            <option value="">Wszyscy pracownicy</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1 text-sm">
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`flex-1 rounded-lg px-3 py-1.5 font-semibold ${
                viewMode === "all" ? "bg-[#1a2743] text-[#dbeafe]" : "text-[#9fb1d3]"
              }`}
            >
              Wszystkie
            </button>
            <button
              type="button"
              onClick={() => setViewMode("requires_attention")}
              className={`flex-1 rounded-lg px-3 py-1.5 font-semibold ${
                viewMode === "requires_attention" ? "bg-[#3f1f2a] text-[#fecaca]" : "text-[#9fb1d3]"
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
        <aside className="rounded-3xl border border-[#2a3245] bg-gradient-to-b from-[#0d1424] to-[#0a0f1d] p-3 shadow-[0_16px_46px_rgba(0,0,0,.35)]">
          <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#9fb1d3]">Rozmowy</div>
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
            <div className="max-h-[660px] space-y-2 overflow-y-auto pr-1">
              {orderedRepairs.map((r) => {
                const active = activeRepair?.id === r.id;
                const assignee = r.assigned_to;
                const staffName =
                  assignee && typeof assignee !== "string"
                    ? `${assignee.first_name || ""} ${assignee.last_name || ""}`.trim() || assignee.email
                    : "Nieprzypisana";
                const preview = threadPreview(messagesByRepair[r.id] || []);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setActiveRepairId(r.id)}
                    className="min-h-[102px] w-full rounded-2xl border px-3 py-3 text-left transition"
                    style={{
                      borderColor: active ? "rgba(79,105,163,.75)" : "rgba(255,255,255,.10)",
                      background: active ? "rgba(79,105,163,.16)" : "rgba(255,255,255,.02)",
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-xs font-semibold text-white">{r.repair_number}</p>
                      {r.requires_attention ? <span className="rounded-full bg-[#7f1d1d] px-2 py-0.5 text-[10px] font-semibold text-[#fecaca]">Pilne</span> : null}
                    </div>
                    <p className="mt-1 truncate text-sm text-[#e5e7eb]">{r.client_name} - {r.device_name}</p>
                    <p className="mt-1 truncate text-xs text-[#9fb1d3]">{preview}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-[#7f8fb0]">
                      <span className="truncate">Opiekun: {staffName}</span>
                      <span>{relativeTime(r.created_at)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <div className="rounded-3xl border border-[#2a3245] bg-gradient-to-b from-[#0d1424] to-[#0a0f1d] p-4 shadow-[0_16px_46px_rgba(0,0,0,.35)]">
          {!activeRepair ? (
            <div className="py-8">
              <EmptyState icon={EMPTY_STATES.notifications.icon} title="Wybierz rozmowę" description="Z lewej strony wybierz klienta i naprawę, aby zobaczyć historię." />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div>
                  <Link href={`/admin-panel/repairs/${activeRepair.id}`} className="font-mono text-sm font-semibold text-[#93c5fd] hover:underline">
                    {activeRepair.repair_number}
                  </Link>
                  <p className="mt-1 text-sm text-white">{activeRepair.client_name} - {activeRepair.device_name}</p>
                  <p className="mt-1 text-xs text-[#9fb1d3]">Status: {activeRepair.status_display}</p>
                </div>
                <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1 text-xs">
                  <button type="button" onClick={() => setChannel("panel")} className={`rounded-lg px-3 py-1 font-semibold ${channel === "panel" ? "bg-[#1a2743] text-[#dbeafe]" : "text-[#9fb1d3]"}`}>
                    Panel klienta
                  </button>
                  <button type="button" onClick={() => setChannel("email")} className={`rounded-lg px-3 py-1 font-semibold ${channel === "email" ? "bg-[#1a2743] text-[#dbeafe]" : "text-[#9fb1d3]"}`}>
                    E-mail
                  </button>
                </div>
              </div>

              <div className="max-h-[360px] space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                {loadingThread && activeMessages.length === 0 ? (
                  <CommThreadListSkeleton rows={4} />
                ) : activeMessages.length === 0 ? (
                  <div className="text-sm text-[#9fb1d3]">Brak wiadomości. Administrator może rozpocząć rozmowę.</div>
                ) : (
                  visibleMessages.map((m) =>
                    m.kind === "note" ? (
                      <div key={`n-${m.id}`} className="rounded-xl border border-white/10 bg-[#0f172a]/60 p-3">
                        <p className="text-xs text-[#9fb1d3]">
                          {(m.thread_origin === "client" || m.thread_origin === "email_inbound" ? "Klient" : m.author_name) || "-"} · {dateLabel(m.created_at)}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-[#e5e7eb]">{m.note}</p>
                      </div>
                    ) : (
                      <div key={`e-${m.id}`} className="rounded-xl border border-dashed border-white/20 bg-[#0f172a]/50 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9fb1d3]">E-mail</p>
                        <p className="mt-1 text-sm font-semibold text-white">{m.subject || "Bez tematu"}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-[#e5e7eb]">{m.body_snapshot || "-"}</p>
                        <p className="mt-2 text-xs text-[#9fb1d3]">{m.sent_by_name || "-"} · {dateLabel(m.sent_at)}</p>
                      </div>
                    ),
                  )
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                {channel === "email" ? (
                  <input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Temat wiadomości e-mail"
                    className="mb-3 w-full rounded-xl border border-white/10 bg-[#0d1527] px-3 py-2 text-sm text-white placeholder:text-[#7f8da8] outline-none focus:border-[#4f69a3]"
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
                  className="w-full resize-y rounded-xl border border-white/10 bg-[#0d1527] px-3 py-2 text-sm text-white placeholder:text-[#7f8da8] outline-none focus:border-[#4f69a3]"
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
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-[#b8c7e2] transition hover:bg-white/[0.12] hover:text-white"
                    >
                      Wyczyść
                    </button>
                    <button
                      type="button"
                      disabled={sending || !draft.trim() || (channel === "email" && !emailSubject.trim())}
                      onClick={() => void handleSend()}
                      className="rounded-xl bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2563eb] disabled:opacity-60"
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
