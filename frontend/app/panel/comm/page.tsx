"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { usePanelBasePath } from "@/lib/panelPaths";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/store";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { CommThreadListSkeleton } from "@/components/ui/Skeleton";
import type { RepairRequestListItem, RepairThreadItem } from "@/types/repairs";

type Thread = {
  repair: RepairRequestListItem;
  messages: RepairThreadItem[];
};

function lastThreadMeta(items: RepairThreadItem[]): { at: string; preview: string } {
  if (!items.length) return { at: "", preview: "" };
  const last = items[items.length - 1];
  if (last.kind === "note") return { at: last.created_at, preview: last.note };
  return { at: last.sent_at, preview: (last.subject || last.body_snapshot || "").slice(0, 160) };
}

function dateLabel(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function CommPage() {
  const { token } = useAuth();
  const p = usePanelBasePath();
  const addToast = useStore((s) => s.addToast);

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeRepairId, setActiveRepairId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [channel, setChannel] = useState<"panel" | "email">("panel");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedReply, setSuggestedReply] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchDraft.trim()), 300);
    return () => window.clearTimeout(t);
  }, [searchDraft]);

  const loadThreads = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const repairs = await api.get<RepairRequestListItem[]>(`/staff/repairs/?ordering=-created_at`, token);
      const base = (repairs ?? []).slice(0, 30);

      const withMessages = await Promise.all(
        base.map(async (r) => {
          try {
            const msgs = await api.get<RepairThreadItem[]>(`/repairs/${r.id}/messages/`, token);
            return { repair: r, messages: Array.isArray(msgs) ? msgs : [] } as Thread;
          } catch {
            return { repair: r, messages: [] } as Thread;
          }
        }),
      );

      const onlyWithMessages = withMessages
        .filter((t) => t.messages.length > 0 || t.repair.requires_attention)
        .sort((a, b) => {
          const at = lastThreadMeta(a.messages).at || a.repair.created_at;
          const bt = lastThreadMeta(b.messages).at || b.repair.created_at;
          return new Date(bt).getTime() - new Date(at).getTime();
        });

      setThreads(onlyWithMessages);
      setActiveRepairId((prev) => prev || onlyWithMessages[0]?.repair.id || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się pobrać wątków.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    void loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filteredThreads = useMemo(() => {
    if (!search) return threads;
    const needle = search.toLowerCase();
    return threads.filter((t) => {
      const head = `${t.repair.repair_number} ${t.repair.client_name} ${t.repair.device_name}`.toLowerCase();
      const body = lastThreadMeta(t.messages).preview.toLowerCase();
      return head.includes(needle) || body.includes(needle);
    });
  }, [threads, search]);

  const activeThread = filteredThreads.find((t) => t.repair.id === activeRepairId) || filteredThreads[0] || null;

  useEffect(() => {
    if (!activeThread) return;
    const key = `draft-${activeThread.repair.id}`;
    const restored = localStorage.getItem(key) || "";
    setDraft(restored);
    setEmailSubject(localStorage.getItem(`${key}-email-subj`) || "");
  }, [activeThread?.repair.id]);

  useEffect(() => {
    if (!activeThread) return;
    const key = `draft-${activeThread.repair.id}`;
    const t = window.setTimeout(() => {
      if (draft.trim()) localStorage.setItem(key, draft);
      else localStorage.removeItem(key);
      if (emailSubject.trim()) localStorage.setItem(`${key}-email-subj`, emailSubject);
      else localStorage.removeItem(`${key}-email-subj`);
    }, 1000);
    return () => window.clearTimeout(t);
  }, [activeThread?.repair.id, draft, emailSubject]);

  useEffect(() => {
    if (!token || !activeThread) return;
    void api
      .get<any>(`/communications/templates/?trigger=${encodeURIComponent(activeThread.repair.status)}&channel=panel`, token)
      .then((res) => {
        const list = Array.isArray(res) ? res : Array.isArray(res?.results) ? res.results : [];
        const first = list[0];
        const text = (first?.body || first?.content || first?.message || "").toString();
        setSuggestedReply(text);
      })
      .catch(() => setSuggestedReply(""));
  }, [token, activeThread?.repair.status]);

  const sendMessage = async () => {
    if (!token || !activeThread || !draft.trim()) return;
    if (channel === "email" && !emailSubject.trim()) {
      addToast("Podaj temat e-maila.", "error");
      return;
    }
    setSending(true);
    setError(null);
    try {
      if (channel === "panel") {
        await api.post(`/repairs/${activeThread.repair.id}/notes/`, { note: draft.trim(), is_internal: false, note_type: "client_contact" }, token);
      } else {
        await api.post(`/repairs/${activeThread.repair.id}/send-client-email/`, {
          subject: emailSubject.trim(),
          body: draft.trim(),
        }, token);
      }
      const key = `draft-${activeThread.repair.id}`;
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}-email-subj`);
      setDraft("");
      setEmailSubject("");
      addToast(channel === "panel" ? "Wiadomość w panelu wysłana." : "E-mail wysłany.", "success");
      await loadThreads();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się wysłać wiadomości.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-[1450px] px-4 py-8">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-[var(--white)]">Komunikacja</h1>
        <p className="mt-1 text-sm text-[var(--ink2)]">Wątki napraw z wiadomościami od klienta i szybka odpowiedź.</p>
      </div>

      <div className="mb-4">
        <input
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          placeholder="Szukaj po numerze, kliencie, urządzeniu..."
          className="w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-2.5 text-sm text-[var(--white)] outline-none focus:border-[#3b82f6]"
        />
      </div>

      {error ? (
        <div className="mb-4">
          <ErrorState error={new Error(error)} onRetry={() => void loadThreads()} title="Błąd komunikacji" />
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <aside className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-3">
          <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Wątki</div>
          {loading ? (
            <CommThreadListSkeleton rows={6} />
          ) : filteredThreads.length === 0 ? (
            <div className="px-2 py-4">
              <EmptyState
                icon={EMPTY_STATES.messages.icon}
                title="Brak wątków"
                description="Pojawią się naprawy z wiadomościami od klienta lub oznaczone jako wymagające reakcji."
              />
            </div>
          ) : (
            <div className="space-y-2">
              {filteredThreads.map((t) => {
                const active = t.repair.id === (activeThread?.repair.id || "");
                const meta = lastThreadMeta(t.messages);
                return (
                  <button
                    key={t.repair.id}
                    type="button"
                    onClick={() => setActiveRepairId(t.repair.id)}
                    className="w-full rounded-2xl border px-3 py-3 text-left transition"
                    style={{
                      borderColor: active ? "rgba(59,130,246,.35)" : "rgba(255,255,255,.10)",
                      background: active ? "rgba(59,130,246,.10)" : "rgba(255,255,255,.02)",
                    }}
                  >
                    <div className="font-mono text-xs font-semibold text-[var(--white)]">{t.repair.repair_number}</div>
                    <div className="mt-0.5 truncate text-sm text-[#e5e7eb]">{t.repair.client_name} · {t.repair.device_name}</div>
                    <div className="mt-1 truncate text-xs text-[var(--ink2)]">{meta.preview || "Brak wiadomości"}</div>
                    <div className="mt-1 text-[11px] text-[var(--muted)]">{meta.at ? dateLabel(meta.at) : "—"}</div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
          {!activeThread ? (
            <div className="text-sm text-[var(--muted)]">Wybierz wątek z lewej listy.</div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-3">
                <div>
                  <Link href={p.repairDetailPath(activeThread.repair.id)} className="font-mono text-sm font-semibold text-[#93c5fd] hover:underline">
                    {activeThread.repair.repair_number}
                  </Link>
                  <div className="mt-1 text-sm text-[var(--white)]">{activeThread.repair.client_name} · {activeThread.repair.device_name}</div>
                  <div className="mt-1 text-xs text-[var(--ink2)]">Status: {activeThread.repair.status_display}</div>
                </div>
                <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--row-hover)] p-1 text-xs">
                  <button type="button" onClick={() => setChannel("panel")} className={`rounded-lg px-3 py-1 font-semibold ${channel === "panel" ? "bg-[#3b82f6]/20 text-[#bfdbfe]" : "text-[var(--ink2)]"}`}>Panel</button>
                  <button type="button" onClick={() => setChannel("email")} className={`rounded-lg px-3 py-1 font-semibold ${channel === "email" ? "bg-[#3b82f6]/20 text-[#bfdbfe]" : "text-[var(--ink2)]"}`}>E-mail</button>
                </div>
              </div>

              {suggestedReply ? (
                <div className="rounded-2xl border border-[#3b82f6]/30 bg-[#3b82f6]/10 p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#93c5fd]">💡 Sugerowana odpowiedź</div>
                  <div className="mt-1 whitespace-pre-wrap text-sm text-[#e5e7eb]">{suggestedReply}</div>
                  <button
                    type="button"
                    onClick={() => setDraft((v) => (v.trim() ? v : suggestedReply))}
                    className="mt-2 rounded-lg border border-[#3b82f6]/40 bg-[#3b82f6]/15 px-3 py-1.5 text-xs font-semibold text-[#bfdbfe] hover:bg-[#3b82f6]/25"
                  >
                    Użyj w polu odpowiedzi
                  </button>
                </div>
              ) : null}

              <div className="max-h-[340px] space-y-2 overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-3">
                {activeThread.messages.length === 0 ? (
                  <div className="text-sm text-[var(--muted)]">Brak wiadomości.</div>
                ) : (
                  activeThread.messages.map((m) =>
                    m.kind === "note" ? (
                      <div key={`n-${m.id}`} className="rounded-xl border border-[var(--border)] bg-[var(--s1)] p-3">
                        <div className="text-xs text-[var(--ink2)]">
                          {(m.thread_origin === "client" || m.thread_origin === "email_inbound" ? "Klient" : m.author_name) || "—"} · {dateLabel(m.created_at)}
                        </div>
                        <div className="mt-1 whitespace-pre-wrap text-sm text-[#e5e7eb]">{m.note}</div>
                      </div>
                    ) : (
                      <div key={`e-${m.id}`} className="rounded-xl border border-dashed border-white/15 bg-[var(--s1)] p-3">
                        <div className="text-[11px] font-semibold uppercase text-[var(--ink2)]">E-mail</div>
                        <div className="mt-1 text-sm font-semibold text-[var(--white)]">{m.subject}</div>
                        <div className="mt-2 whitespace-pre-wrap text-sm text-[#e5e7eb]">{m.body_snapshot}</div>
                        <div className="mt-2 text-xs text-[var(--ink2)]">
                          {m.sent_by_name || "—"} · {dateLabel(m.sent_at)}
                        </div>
                      </div>
                    ),
                  )
                )}
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-3">
                {channel === "email" ? (
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Temat e-maila…"
                    className="mb-3 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-2.5 text-sm text-[var(--white)] outline-none focus:border-[#3b82f6]"
                  />
                ) : null}
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={4}
                  placeholder={channel === "email" ? "Treść e-maila (klient widzi ją w skrzynce i w historii)…" : "Napisz odpowiedź w panelu (widoczna dla klienta w jego koncie)…"}
                  className="w-full resize-y rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-3 text-sm text-[var(--white)] outline-none focus:border-[#3b82f6]"
                />
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDraft("");
                      setEmailSubject("");
                    }}
                    className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm font-semibold text-[var(--ink2)] hover:bg-[var(--row-active)] hover:text-[var(--white)]"
                  >
                    Wyczyść
                  </button>
                  <button
                    type="button"
                    disabled={sending || !draft.trim() || (channel === "email" && !emailSubject.trim())}
                    onClick={() => void sendMessage()}
                    className="rounded-xl bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-[var(--white)] hover:bg-[#2563eb] disabled:opacity-60"
                  >
                    {sending ? "Wysyłanie…" : channel === "panel" ? "Wyślij do panelu klienta" : "Wyślij e-mail"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

