"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { RepairRequestListItem } from "@/types/repairs";
import Link from "next/link";

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

const PAGE_SIZE = 25;
const KPI_DAYS = 30;

const ARCHIVE_STATUSES: string[] = [
  // Backend: brak osobnego pola "archiwum" w naprawach.
  // W praktyce "historia/archiwum" traktujemy jako wszystkie sprawy od momentu,
  // kiedy nie są już w statusie "new" (lista końcowa + wcześniejsze etapy).
  "accepted",
  "in_diagnostics",
  "diagnostics_done",
  "quote_pending",
  "quote_sent",
  "quote_accepted",
  "waiting_for_parts",
  "in_repair",
  "repair_done",
  "in_testing",
  "testing_failed",
  "testing_passed",
  "ready_for_pickup",
  "picked_up",
  "shipped",
  "delivered",
  "cancelled",
  "unrepairable",
  "abandoned",
];

function statusPillStyle(status: string) {
  const s = (status ?? "").toLowerCase();
  const base = "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide";
  if (["cancelled", "unrepairable", "abandoned"].includes(s)) return `${base} border-[#dc1e1e]/35 bg-[#dc1e1e]/15 text-[#ffb4b4]`;
  if (["delivered", "picked_up"].includes(s)) return `${base} border-[#22c55e]/35 bg-[#22c55e]/15 text-[#bbf7d0]`;
  if (["shipped"].includes(s)) return `${base} border-[#3b82f6]/35 bg-[#3b82f6]/15 text-[#bcd6ff]`;
  if (["ready_for_pickup", "repair_done"].includes(s)) return `${base} border-[#f59e0b]/35 bg-[#f59e0b]/15 text-[#ffe3b0]`;
  return `${base} border-white/10 bg-white/5 text-[#9ca3af]`;
}

function formatZl(value: string | number | null | undefined) {
  if (value == null) return "—";
  const num = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(num)) return "—";
  return `${Math.round(num).toLocaleString("pl-PL")} zł`;
}

function SummaryCard({
  label,
  value,
  accent,
  loading,
  valueSuffix,
}: {
  label: string;
  value: number | null;
  accent: string;
  loading: boolean;
  valueSuffix?: string;
}) {
  const v = value ?? 0;
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c0d12] p-4"
      style={{
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.05)",
      }}
    >
      <div
        className="absolute left-0 top-0 h-full w-[2px]"
        style={{
          background: accent,
          boxShadow: `0 0 18px ${accent}`,
          opacity: loading ? 0.6 : 0.95,
        }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">{label}</div>
          {loading ? (
            <div className="mt-2 h-8 w-[90px] rounded bg-white/5 animate-pulse" />
          ) : (
            <div className="mt-2 text-2xl font-semibold text-white">
              {value == null ? "…" : v}
              {valueSuffix ?? ""}
            </div>
          )}
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            background: "rgba(255,255,255,.03)",
            border: "1px solid rgba(255,255,255,.08)",
          }}
          aria-hidden="true"
        >
          <span className="text-sm font-bold" style={{ color: accent }}>
            {loading ? "…" : "→"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ArchivePage() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusInQuery = useMemo(() => {
    // Django/DRF: status_in is list-like => repeating query params
    return ARCHIVE_STATUSES.map((s) => `status_in=${encodeURIComponent(s)}`).join("&");
  }, []);

  const load = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const qs: string[] = [];
      qs.push(statusInQuery);
      qs.push(`ordering=${encodeURIComponent("-updated_at")}`);
      qs.push(`page=${page}`);
      if (search.trim()) qs.push(`search=${encodeURIComponent(search.trim())}`);
      if (!isAdmin && user?.id) qs.push(`assigned_to=${encodeURIComponent(user.id)}`);
      const url = `/repairs/?${qs.join("&")}`;
      const res = await api.get<PaginatedResponse<RepairRequestListItem>>(url, token);
      return res;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać archiwum napraw.";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const [items, setItems] = useState<RepairRequestListItem[]>([]);
  const [count, setCount] = useState(0);
  const [next, setNext] = useState<string | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);

  const [kpiLoading, setKpiLoading] = useState(true);
  const [kpiError, setKpiError] = useState<string | null>(null);
  const [kpi, setKpi] = useState<{
    repairs_total: number;
    revenue_total: string;
    overdue_count: number;
    completed_in_period: number;
    average_completion_days: number | null;
  } | null>(null);

  useEffect(() => {
    if (!token) {
      setKpiLoading(false);
      setKpiError(null);
      setKpi(null);
      return;
    }

    let cancelled = false;
    setKpiLoading(true);
    setKpiError(null);

    void api
      .get<any>(`/analytics/kpi/?days=${KPI_DAYS}`, token)
      .then((res) => {
        if (cancelled) return;
        setKpi(res ?? null);
      })
      .catch((e) => {
        if (cancelled) return;
        setKpiError(e instanceof Error ? e.message : "Nie udało się pobrać KPI.");
        setKpi(null);
      })
      .finally(() => {
        if (cancelled) return;
        setKpiLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await load();
      if (cancelled) return;
      if (!res) return;
      setItems(res.results);
      setCount(res.count);
      setNext(res.next);
      setPrevious(res.previous);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, search, isAdmin, user?.id]);

  useEffect(() => {
    setPage(1);
  }, [search, isAdmin, user?.id]);

  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const overduePercent =
    kpi && Number.isFinite(kpi.repairs_total) && kpi.repairs_total > 0 ? (kpi.overdue_count / kpi.repairs_total) * 100 : null;

  return (
    <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-8">
      <div className="flex flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Archiwum napraw</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Historia zakończonych napraw</h1>
            <p className="mt-1 text-sm text-[#9ca3af]">
              Pod spodem backend mapuje „archiwum” po statusach (`status_in`), więc to widok na naprawy końcowe/anulowane.
            </p>
          </div>

          <div className="w-full md:w-[360px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj: numer naprawy, klient, urządzenie…"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-[#6b7280] outline-none focus:border-[#dc1e1e]"
            />
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Naprawy" value={kpi && !kpiLoading ? kpi.repairs_total : null} accent="#3b82f6" loading={kpiLoading} />
          <div
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c0d12] p-4"
            style={{
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.05)",
            }}
          >
            <div className="absolute left-0 top-0 h-full w-[2px]" style={{ background: "#dc1e1e", boxShadow: "0 0 18px #dc1e1e", opacity: kpiLoading ? 0.6 : 0.95 }} />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">Przychód</div>
                {kpiLoading ? (
                  <div className="mt-2 h-8 w-[120px] rounded bg-white/5 animate-pulse" />
                ) : (
                  <div className="mt-2 text-2xl font-semibold text-white">{kpi ? formatZl(kpi.revenue_total) : "…"}</div>
                )}
              </div>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)" }}
                aria-hidden="true"
              >
                <span className="text-sm font-bold" style={{ color: "#dc1e1e" }}>
                  {kpiLoading ? "…" : "→"}
                </span>
              </div>
            </div>
          </div>

          <SummaryCard
            label="Średni czas"
            value={kpi && !kpiLoading && kpi.average_completion_days != null ? Math.round(kpi.average_completion_days) : null}
            valueSuffix={kpiLoading ? "" : " dni"}
            accent="#22c55e"
            loading={kpiLoading}
          />

          <div
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c0d12] p-4"
            style={{
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.05)",
            }}
          >
            <div className="absolute left-0 top-0 h-full w-[2px]" style={{ background: "#f59e0b", boxShadow: "0 0 18px #f59e0b", opacity: kpiLoading ? 0.6 : 0.95 }} />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">Opóźnienia</div>
                {kpiLoading ? (
                  <div className="mt-2 h-8 w-[90px] rounded bg-white/5 animate-pulse" />
                ) : (
                  <div className="mt-2 text-2xl font-semibold text-white">
                    {overduePercent == null ? "…" : `${overduePercent.toFixed(1)}%`}
                  </div>
                )}
              </div>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)" }}
                aria-hidden="true"
              >
                <span className="text-sm font-bold" style={{ color: "#f59e0b" }}>
                  {kpiLoading ? "…" : "→"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {kpiError && !kpiLoading && <p className="text-sm text-[#fca5a5]">{kpiError}</p>}

        <section className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: "#dc1e1e", boxShadow: "0 0 20px #dc1e1e" }} />
                <h2 className="text-base font-semibold text-white">Zakończone naprawy</h2>
              </div>
              <p className="mt-1 text-sm text-[#9ca3af]">
                Lista dla statusów końcowych/anulowanych (paginacja i wyszukiwanie).
              </p>
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
              {loading ? "Ładowanie" : `${items.length} z ${count} pozycji`}
            </div>
          </div>

          <div className="mt-4">
            {loading && (
              <div className="space-y-0">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    className="flex items-center justify-between gap-3 border-t border-white/10 px-2 py-4 animate-pulse"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-white/5" />
                      <div className="min-w-0">
                        <div className="h-4 w-40 rounded bg-white/5" />
                        <div className="mt-2 h-3 w-56 rounded bg-white/5" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-28 rounded-full bg-white/5" />
                      <div className="h-3 w-16 rounded bg-white/5" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && error && <p className="text-sm text-[#fca5a5]">{error}</p>}

            {!loading && !error && items.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-5 py-12 text-center">
                <p className="text-sm text-[#6b7280]">Brak pozycji w archiwum.</p>
              </div>
            )}

            {!loading && !error && items.length > 0 && (
              <div className="divide-y divide-white/10">
                {items.map((r, idx) => (
                  <Link
                    key={r.id}
                    href={`/panel/repairs/${r.id}`}
                    className="group flex items-start justify-between gap-4 px-3 py-4 transition hover:bg-white/5"
                    style={{ borderTop: idx === 0 ? "none" : undefined }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-white group-hover:text-[#dc1e1e]">
                          {r.repair_number}
                        </span>
                        <span className={statusPillStyle(r.status)}>{r.status_display}</span>
                      </div>
                      <p className="mt-1 text-sm text-[#b4b8c4]">
                        {r.device_name} · {r.client_name}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 text-right">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
                        {r.priority_display}
                      </span>
                      <span className="text-xs text-[#6b7280]">
                        {new Date(r.created_at).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </span>
                      <span className="text-[#9ca3af] group-hover:text-white">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-[#0c0d12] px-4 py-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!previous || page <= 1 || loading}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white disabled:opacity-60"
            >
              ← Poprzednia
            </button>
            <p className="text-sm text-[#9ca3af]">
              Strona <span className="font-semibold text-white">{page}</span> / {pageCount}
            </p>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={!next || page >= pageCount || loading}
              className="rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white disabled:opacity-60"
            >
              Następna →
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

