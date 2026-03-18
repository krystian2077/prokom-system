"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type CommLogItem = {
  id: number;
  repair: string;
  repair_number?: string;
  template_name?: string | null;
  channel: string;
  channel_display: string;
  recipient: string;
  subject: string;
  body_snapshot: string;
  sent_at: string;
  sent_by?: string | null;
  status: string;
  error_message?: string | null;
};

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

const PAGE_SIZE = 25;

const CHANNEL_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "email", label: "E-mail" },
  { value: "sms", label: "SMS" },
  { value: "panel", label: "Panel klienta" },
  { value: "phone", label: "Telefon" },
  { value: "internal", label: "Wewnętrzna" },
];

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "sent", label: "Wysłano" },
  { value: "failed", label: "Błąd wysyłki" },
];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pl-PL");
}

export default function CommPage() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [page, setPage] = useState(1);
  const [channel, setChannel] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const [items, setItems] = useState<CommLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [next, setNext] = useState<string | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);

  const effectiveChannelOptions = useMemo(() => {
    // SMS może być wyłączony w Twojej konfiguracji (hint: w poprzednich etapach pomijaliśmy),
    // ale backend obsługuje logi po kanale.
    return CHANNEL_OPTIONS;
  }, []);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const qs: string[] = [];
      qs.push(`page=${page}`);
      qs.push(`page_size=${PAGE_SIZE}`);
      if (channel) qs.push(`channel=${encodeURIComponent(channel)}`);
      if (status) qs.push(`status=${encodeURIComponent(status)}`);
      // backend nie ma SearchFilter, więc search zrobimy po stronie UI
      const res = await api.get<PaginatedResponse<CommLogItem>>(`/communications/logs/?${qs.join("&")}`, token);
      const filtered = search.trim()
        ? res.results.filter((r) => {
            const needle = search.trim().toLowerCase();
            const hay =
              `${r.repair_number ?? ""} ${r.recipient ?? ""} ${r.subject ?? ""} ${r.channel_display ?? ""}`.toLowerCase();
            return hay.includes(needle);
          })
        : res.results;

      setItems(filtered);
      setCount(res.count);
      setNext(res.next);
      setPrevious(res.previous);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać logów komunikacji.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, channel, status, search]);

  useEffect(() => {
    setPage(1);
  }, [channel, status, search]);

  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">
            {isAdmin ? "Panel Admina" : "Panel pracownika"} · Moduł
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Komunikacja (logi wysyłek)</h1>
          <p className="mt-1 text-sm text-[#9ca3af]">Podgląd wysłanych wiadomości do klientów w kontekście napraw.</p>
        </div>

        <div className="w-full md:w-[520px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj: numer naprawy, adresat, temat…"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-[#6b7280]"
          />
        </div>
      </div>

      <section className="mb-5 rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
                Kanał
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <option value="">Wszystkie</option>
                {effectiveChannelOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <option value="">Wszystkie</option>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-right text-xs text-[#9ca3af]">
            Wyniki: <span className="text-white font-semibold">{count}</span>
          </div>
        </div>
      </section>

      {loading && (
        <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-6 text-sm text-[#9ca3af]">Ładowanie…</div>
      )}

      {error && <p className="text-sm text-[#fca5a5]">{error}</p>}

      {!loading && !error && (
        <div className="space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-[#6b7280]">Brak logów dla wybranych filtrów.</p>
          ) : (
            items.map((l) => (
              <div
                key={l.id}
                className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5 transition hover:border-white/20"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-[260px]">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Naprawa</p>
                    <Link
                      href={`/panel/repairs/${l.repair}`}
                      className="mt-1 block text-lg font-semibold text-white hover:underline"
                    >
                      {l.repair_number ?? l.repair}
                    </Link>
                    <p className="mt-2 text-sm text-[#9ca3af]">
                      Kanał: <span className="text-white font-semibold">{l.channel_display}</span> · Do:{" "}
                      <span className="text-white font-semibold">{l.recipient}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9ca3af]">Wysłano</p>
                    <p className="mt-1 text-sm font-semibold text-white">{formatDateTime(l.sent_at)}</p>
                    <p
                      className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                        l.status === "failed"
                          ? "border-[#dc1e1e]/35 bg-[#dc1e1e]/15 text-[#ffb4b4]"
                          : "border-[#22c55e]/35 bg-[#22c55e]/15 text-[#bbf7d0]"
                      }`}
                    >
                      {l.status === "failed" ? "Błąd wysyłki" : "Wysłano"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Temat</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-[#e5e7eb]">{l.subject || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Szablon</p>
                    <p className="mt-1 text-sm text-[#e5e7eb]">{l.template_name ?? "—"}</p>
                  </div>
                </div>

                {l.body_snapshot ? (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Treść (podgląd)</p>
                    <p className="mt-1 max-h-28 overflow-hidden text-sm text-[#9ca3af] whitespace-pre-wrap">
                      {l.body_snapshot.slice(0, 500)}
                      {l.body_snapshot.length > 500 ? "…" : ""}
                    </p>
                  </div>
                ) : null}

                {l.status === "failed" && l.error_message ? (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Błąd</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-[#ffb4b4]">{l.error_message}</p>
                  </div>
                ) : null}
              </div>
            ))
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!previous || page <= 1}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white disabled:opacity-60"
            >
              Poprzednia
            </button>
            <p className="text-sm text-[#9ca3af]">
              Strona {page} / {pageCount}
            </p>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={!next || page >= pageCount}
              className="rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white disabled:opacity-60"
            >
              Następna
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

