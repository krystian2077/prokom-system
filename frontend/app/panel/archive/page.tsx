"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { RepairRequestListItem } from "@/types/repairs";
import Link from "next/link";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ARCHIVED_FINAL_STATUSES } from "@/lib/repairListDisplay";

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

const PAGE_SIZE = 20;
const KPI_DAYS = 30;

type HistoryVariant = "standard" | "complaint" | "unclaimed" | "warranty" | "vip_returning";

function getHistoryVariant(item: RepairRequestListItem): HistoryVariant {
  const tags = item.auto_tags ?? [];
  const cws = (item.complaint_warranty_status ?? "").toLowerCase();
  if (cws.includes("complaint") || cws.includes("reklam") || tags.includes("complaint")) return "complaint";
  if (cws.includes("warranty") || cws.includes("gwaranc") || tags.includes("warranty")) return "warranty";
  if ((item.waiting_for_client_days ?? 0) > 7) return "unclaimed";
  if (tags.includes("vip") || tags.includes("returning_client")) return "vip_returning";
  return "standard";
}

function variantCardClass(v: HistoryVariant): string {
  if (v === "complaint") return "border-[#f59e0b]/35 bg-[#f59e0b]/10";
  if (v === "unclaimed") return "border-[#ef4444]/35 bg-[#ef4444]/10";
  if (v === "warranty") return "border-[#8b5cf6]/35 bg-[#8b5cf6]/10";
  if (v === "vip_returning") return "border-[#06b6d4]/35 bg-[#06b6d4]/10";
  return "border-[var(--border)] bg-white/[0.03]";
}

/** Dodatkowy kontekst (reklamacja, gwarancja…) — tylko gdy wariant nie jest „zwykłym” zamknięciem. */
function secondaryHistoryChip(
  item: RepairRequestListItem,
  v: HistoryVariant
): { label: string; className: string } | null {
  const s = (item.status ?? "").toLowerCase();
  if (["cancelled", "unrepairable", "abandoned"].includes(s)) return null;
  if (v === "complaint")
    return { label: "Reklamacja", className: "border-[#f59e0b]/40 bg-[#f59e0b]/15 text-[#ffd89b]" };
  if (v === "unclaimed")
    return {
      label: `Nieodebrana ${item.waiting_for_client_days ?? 0} d`,
      className: "border-[#ef4444]/40 bg-[#ef4444]/15 text-[#fecaca]",
    };
  if (v === "warranty")
    return { label: "Gwarancja 90 d", className: "border-[#8b5cf6]/40 bg-[#8b5cf6]/15 text-[#ddd6fe]" };
  if (v === "vip_returning")
    return { label: "Klient powracający", className: "border-[#06b6d4]/40 bg-[#06b6d4]/15 text-[#bae6fd]" };
  return null;
}

function statusPillStyle(status: string) {
  const s = (status ?? "").toLowerCase();
  const base = "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide";
  if (["cancelled", "unrepairable", "abandoned"].includes(s)) return `${base} border-[#dc1e1e]/35 bg-[#dc1e1e]/15 text-[#ffb4b4]`;
  if (["delivered", "picked_up"].includes(s)) return `${base} border-[#22c55e]/35 bg-[#22c55e]/15 text-[#bbf7d0]`;
  if (["shipped"].includes(s)) return `${base} border-[#3b82f6]/35 bg-[#3b82f6]/15 text-[#bcd6ff]`;
  if (["ready_for_pickup", "repair_done"].includes(s)) return `${base} border-[#f59e0b]/35 bg-[#f59e0b]/15 text-[#ffe3b0]`;
  return `${base} border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)]`;
}

function SummaryCard({
  label,
  value,
  accent,
  loading,
  valueSuffix,
  hint,
}: {
  label: string;
  value: number | null;
  accent: string;
  loading: boolean;
  valueSuffix?: string;
  hint?: string;
}) {
  const v = value ?? 0;
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4"
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
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">{label}</div>
          {loading ? (
            <div className="mt-2 h-8 w-[90px] rounded bg-[var(--row-hover)] animate-pulse" />
          ) : (
            <>
              <div className="mt-2 text-2xl font-semibold text-[var(--white)]">
                {value == null ? "…" : v}
                {valueSuffix ?? ""}
              </div>
              {hint ? <p className="mt-1.5 text-[11px] leading-snug text-[var(--muted)]">{hint}</p> : null}
            </>
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = user?.role === "admin";

  const page = Number(searchParams.get("page") ?? "1") || 1;

  const setPage = (next: number | ((prev: number) => number)) => {
    const nextPage = typeof next === "function" ? next(page) : next;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`/panel/historia?${params.toString()}`);
  };
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusInQuery = useMemo(() => {
    return ARCHIVED_FINAL_STATUSES.map((s) => `status_in=${encodeURIComponent(s)}`).join("&");
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
  const [reloadTick, setReloadTick] = useState(0);

  const [kpiLoading, setKpiLoading] = useState(true);
  const [kpiError, setKpiError] = useState<string | null>(null);
  const [kpi, setKpi] = useState<{
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
  }, [token, page, search, isAdmin, user?.id, reloadTick]);

  useEffect(() => {
    setPage(1);
  }, [search, isAdmin, user?.id]);

  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-8">
      <div className="flex flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink2)]">Historia napraw</p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--white)]">Historia zakończonych napraw</h1>
            <p className="mt-1 text-sm text-[var(--ink2)]">
              Wyłącznie zamknięte zlecenia: wydane, wysłane, dostarczone lub zakończone negatywnie (anulowane, porzucone,
              nie do naprawy). Dodatkowe oznaczenia pokazują reklamacje, gwarancję lub klienta powracającego.
            </p>
          </div>

          <div className="w-full md:w-[360px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj: numer naprawy, klient, urządzenie…"
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2.5 text-sm text-[var(--white)] placeholder:text-[var(--muted)] outline-none focus:border-[#dc1e1e]"
            />
          </div>
        </header>

        <section className="grid max-w-3xl gap-4 md:grid-cols-2">
          <SummaryCard
            label={`Zakończone (${KPI_DAYS} dni)`}
            value={kpi && !kpiLoading ? kpi.completed_in_period : null}
            accent="#3b82f6"
            loading={kpiLoading}
            hint="Liczba napraw zamkniętych w okresie (cały serwis, jak w statystykach)."
          />
          <SummaryCard
            label="Średni czas realizacji"
            value={kpi && !kpiLoading && kpi.average_completion_days != null ? Math.round(kpi.average_completion_days) : null}
            valueSuffix={kpiLoading ? "" : " dni"}
            accent="#22c55e"
            loading={kpiLoading}
            hint="Od przyjęcia do zamknięcia — naprawy wydane/wysłane/dostarczone w okresie (cały serwis)."
          />
        </section>

        {kpiError && !kpiLoading && <p className="text-sm text-[#fca5a5]">{kpiError}</p>}

        <section className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: "#dc1e1e", boxShadow: "0 0 20px #dc1e1e" }} />
                <h2 className="text-base font-semibold text-[var(--white)]">Zakończone naprawy</h2>
              </div>
              <p className="mt-1 text-sm text-[var(--ink2)]">
                Tylko statusy końcowe. Wyszukiwanie po numerze, kliencie i urządzeniu — z przypisaniem do Ciebie (jeśli nie
                jesteś administratorem).
              </p>
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">
              {loading ? (
                <span className="inline-block h-3 w-28 animate-pulse rounded bg-[var(--row-active)]" aria-hidden />
              ) : (
                `${items.length} z ${count} pozycji`
              )}
            </div>
          </div>

          <div className="mt-4">
            {loading && (
              <div className="space-y-0">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-2 py-4 animate-pulse"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-[var(--row-hover)]" />
                      <div className="min-w-0">
                        <div className="h-4 w-40 rounded bg-[var(--row-hover)]" />
                        <div className="mt-2 h-3 w-56 rounded bg-[var(--row-hover)]" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-28 rounded-full bg-[var(--row-hover)]" />
                      <div className="h-3 w-16 rounded bg-[var(--row-hover)]" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && error ? (
              <div className="py-6">
                <ErrorState error={new Error(error)} onRetry={() => setReloadTick((t) => t + 1)} title="Błąd archiwum" />
              </div>
            ) : null}

            {!loading && !error && items.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-black/10 px-5 py-8">
                <EmptyState
                  icon={EMPTY_STATES.archive.icon}
                  title={EMPTY_STATES.archive.title}
                  description={EMPTY_STATES.archive.description}
                />
              </div>
            )}

            {!loading && !error && items.length > 0 && (
              <div className="divide-y divide-[var(--border)]">
                {items.map((r, idx) => {
                  const v = getHistoryVariant(r);
                  const isUnclaimed = v === "unclaimed";
                  const isComplaint = v === "complaint";
                  const isWarranty = v === "warranty";
                  const isVip = v === "vip_returning";
                  const extraChip = secondaryHistoryChip(r, v);
                  return (
                    <Link
                      key={r.id}
                      href={`/panel/naprawy/${r.id}`}
                      className={`group flex flex-col gap-3 rounded-2xl border px-4 py-4 transition hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between sm:gap-6 ${variantCardClass(v)}`}
                      style={{ borderTop: idx === 0 ? "none" : undefined }}
                    >
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                          <span className="font-mono text-[13px] font-semibold tracking-tight text-[var(--white)] group-hover:text-[#dc1e1e]">
                            {r.repair_number}
                          </span>
                          <span className={statusPillStyle(r.status)}>{r.status_display}</span>
                          {extraChip ? (
                            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${extraChip.className}`}>
                              {extraChip.label}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm leading-snug text-[#d1d5db]">
                          <span className="font-medium text-[var(--white)]/95">{r.device_name}</span>
                          <span className="text-[var(--muted)]"> · </span>
                          <span>{r.client_name}</span>
                        </p>
                        {isComplaint ? (
                          <p className="text-xs text-[#fbbf24]/95">
                            Reklamacja — sprawdź historię zlecenia i notatki serwisowe.
                          </p>
                        ) : null}
                        {isWarranty ? (
                          <p className="text-xs text-[#c4b5fd]/95">Gwarancja: 90 dni od daty odbioru.</p>
                        ) : null}
                        {isVip ? (
                          <p className="text-xs text-[#67e8f9]/90">Klient powracający — kontekst wcześniejszych napraw.</p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 sm:flex-col sm:items-end sm:gap-2">
                        {isUnclaimed ? (
                          <button
                            type="button"
                            onClick={(e) => e.preventDefault()}
                            className="rounded-full border border-[#ef4444]/40 bg-[#ef4444]/15 px-2.5 py-1 text-[11px] font-semibold text-[#fecaca]"
                          >
                            Zadzwoń
                          </button>
                        ) : null}
                        <span className="rounded-full border border-[var(--border)] bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">
                          {r.priority_display}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                          <span className="hidden sm:inline">Przyjęto</span>
                          <span className="font-medium tabular-nums text-[var(--ink2)]">
                            {new Date(r.created_at).toLocaleDateString("pl-PL", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-[var(--ink2)] transition group-hover:text-[var(--white)]" aria-hidden>
                            →
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[var(--border)] bg-[var(--s1)] px-4 py-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!previous || page <= 1 || loading}
              className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)] disabled:opacity-60"
            >
              ← Poprzednia
            </button>
            <p className="text-sm text-[var(--ink2)]">
              Strona <span className="font-semibold text-[var(--white)]">{page}</span> / {pageCount}
            </p>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={!next || page >= pageCount || loading}
              className="rounded-xl bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)] disabled:opacity-60"
            >
              Następna →
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

