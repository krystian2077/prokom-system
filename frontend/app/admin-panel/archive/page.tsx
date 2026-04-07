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
import { Archive, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

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
  if (v === "complaint") return "border-[#f59e0b]/40 bg-[#f59e0b]/12";
  if (v === "unclaimed") return "border-[#ef4444]/40 bg-[#ef4444]/12";
  if (v === "warranty") return "border-[#8b5cf6]/40 bg-[#8b5cf6]/12";
  if (v === "vip_returning") return "border-[#06b6d4]/40 bg-[#06b6d4]/12";
  return "border-[#3b82f6]/25 bg-[#3b82f6]/8";
}

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
  icon,
  loading,
  valueSuffix,
  hint,
}: {
  label: string;
  value: number | null;
  accent: string;
  icon: React.ReactNode;
  loading: boolean;
  valueSuffix?: string;
  hint?: string;
}) {
  const v = value ?? 0;
  return (
    <div
      className="relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 transition hover:shadow-lg"
      style={{
        borderColor: `${accent}40`,
        background: `linear-gradient(135deg, ${accent}12 0%, ${accent}06 100%)`,
        boxShadow: `inset 0 1px 0 ${accent}20, 0 10px 30px ${accent}10`,
      }}
    >
      <div
        className="absolute right-0 top-0 h-full w-[3px] transition-all"
        style={{
          background: accent,
          boxShadow: `0 0 20px ${accent}, inset 0 0 20px ${accent}40`,
          opacity: loading ? 0.5 : 1,
        }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: `${accent}dd` }}>
            {label}
          </div>
          {loading ? (
            <div className="mt-3 h-8 w-[100px] rounded-lg bg-white/[0.08] animate-pulse" />
          ) : (
            <>
              <div className="mt-3 text-3xl font-bold text-[var(--white)]">
                {value == null ? "—" : v}
                {valueSuffix ? <span className="text-xl font-semibold text-[var(--ink2)] ml-1">{valueSuffix}</span> : ""}
              </div>
              {hint ? <p className="mt-2 text-xs leading-snug text-[var(--muted)]">{hint}</p> : null}
            </>
          )}
        </div>
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform"
          style={{
            background: `${accent}20`,
            border: `1px solid ${accent}40`,
          }}
        >
          <div style={{ color: accent }}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

export default function AdminArchivePage() {
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? "1") || 1;

  const setPage = (next: number | ((prev: number) => number)) => {
    const nextPage = typeof next === "function" ? next(page) : next;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`/admin-panel/archive?${params.toString()}`);
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
      const url = `/repairs/?${qs.join("&")}`;
      return api.get<PaginatedResponse<RepairRequestListItem>>(url, token);
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
  }, [token, page, search, reloadTick]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <main className="mx-auto min-h-screen max-w-[1600px] px-4 py-8">
      <div className="flex flex-col gap-7">
        <header className="rounded-3xl border border-[#3b82f6]/25 bg-gradient-to-br from-[#0e1423] via-[#0f1729] to-[#0a0f1f] p-8 shadow-[0_20px_50px_rgba(59,130,246,.12)]">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[#3b82f6]/20 p-3">
                    <Archive className="h-6 w-6 text-[#60a5fa]" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink2)]">Panel administratora</p>
                    <h1 className="mt-1 text-3xl font-bold text-[var(--white)]">Historia napraw</h1>
                  </div>
                </div>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--ink2)]">
                  Przegląd wszystkich zamkniętych zleceń naprawczych z pełnymi statystykami. Reklamacje, gwarancje i klienci
                  powracający są automatycznie oznaczani dla łatwej identyfikacji.
                </p>
              </div>
              <div className="w-full md:w-[380px]">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Szukaj: numer, klient, urządzenie…"
                  className="w-full rounded-xl border border-[var(--border2)] bg-[var(--s2)] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--bl)]"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                label={`Zakończone (${KPI_DAYS} dni)`}
                value={kpi && !kpiLoading ? kpi.completed_in_period : null}
                accent="#3b82f6"
                icon={<CheckCircle2 className="h-5 w-5" />}
                loading={kpiLoading}
                hint="Liczba wszystkich napraw zamkniętych"
              />
              <SummaryCard
                label="Średni czas"
                value={kpi && !kpiLoading && kpi.average_completion_days != null ? Math.round(kpi.average_completion_days) : null}
                valueSuffix={kpiLoading ? "" : "dni"}
                accent="#22c55e"
                icon={<Clock className="h-5 w-5" />}
                loading={kpiLoading}
                hint="Od przyjęcia do zamknięcia"
              />
              <SummaryCard
                label="Roczna tendencja"
                value={count}
                accent="#f59e0b"
                icon={<TrendingUp className="h-5 w-5" />}
                loading={kpiLoading}
                hint="Całkowita liczba napraw"
              />
              <SummaryCard
                label="Na tej stronie"
                value={items.length}
                accent="#06b6d4"
                icon={<Archive className="h-5 w-5" />}
                loading={loading}
                hint={`Wyświetlane ${items.length} z ${count}`}
              />
            </div>
          </div>
        </header>

        {kpiError && !kpiLoading && (
          <div className="rounded-2xl border border-[#ef4444]/30 bg-[#ef4444]/10 p-4 text-sm text-[#fecaca]">{kpiError}</div>
        )}

        <section className="rounded-3xl border border-[#3b82f6]/20 bg-[#0f1729]/50 p-6 shadow-[0_10px_40px_rgba(0,0,0,.3)]">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3b82f6]/20">
                <span className="text-sm font-bold text-[#60a5fa]">📋</span>
              </div>
              <h2 className="text-xl font-bold text-[var(--white)]">Wszystkie zamknięte naprawy</h2>
            </div>
            {loading ? (
              <span className="h-4 w-32 animate-pulse rounded bg-[var(--bl)]" aria-hidden />
            ) : (
              <div className="text-sm font-semibold text-[var(--ink2)]">
                {items.length} z {count} pozycji
              </div>
            )}
          </div>

          <div>
            {loading && (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    className="flex items-center justify-between gap-4 rounded-xl border border-[#3b82f6]/20 bg-white/[0.03] px-4 py-4 animate-pulse"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#3b82f6]/20" />
                      <div className="min-w-0 flex-1">
                        <div className="h-4 w-40 rounded bg-[#3b82f6]/20" />
                        <div className="mt-2 h-3 w-56 rounded bg-[#3b82f6]/10" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-20 rounded-full bg-[#3b82f6]/20" />
                      <div className="h-3 w-20 rounded bg-[#3b82f6]/10" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && error ? (
              <div className="rounded-2xl border border-dashed border-[#ef4444]/30 bg-[#ef4444]/5 p-8">
                <ErrorState error={new Error(error)} onRetry={() => setReloadTick((t) => t + 1)} />
              </div>
            ) : null}

            {!loading && !error && items.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#3b82f6]/30 bg-[#3b82f6]/5 px-6 py-12">
                <EmptyState
                  icon={EMPTY_STATES.archive.icon}
                  title={EMPTY_STATES.archive.title}
                  description={EMPTY_STATES.archive.description}
                />
              </div>
            )}

            {!loading && !error && items.length > 0 && (
              <div className="space-y-2">
                {items.map((r) => {
                  const v = getHistoryVariant(r);
                  const isUnclaimed = v === "unclaimed";
                  const isComplaint = v === "complaint";
                  const isWarranty = v === "warranty";
                  const isVip = v === "vip_returning";
                  const extraChip = secondaryHistoryChip(r, v);
                  return (
                    <Link
                      key={r.id}
                      href={`/admin-panel/repairs/${r.id}`}
                      className={`group flex flex-col gap-3 rounded-xl border px-4 py-4 transition hover:shadow-lg sm:flex-row sm:items-center sm:justify-between sm:gap-6 ${variantCardClass(v)}`}
                    >
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                          <span className="font-mono text-sm font-bold tracking-tight text-white group-hover:text-[#60a5fa]">
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
                          <span className="font-medium text-white">{r.device_name}</span>
                          <span className="text-[#6b7280]"> · </span>
                          <span>{r.client_name}</span>
                        </p>
                        {isComplaint ? (
                          <p className="text-xs text-[#fbbf24] font-medium">⚠️ Reklamacja — wymaga uwagi</p>
                        ) : null}
                        {isWarranty ? (
                          <p className="text-xs text-[#c4b5fd] font-medium">🛡️ Gwarancja 90 dni</p>
                        ) : null}
                        {isVip ? (
                          <p className="text-xs text-[#67e8f9] font-medium">⭐ Klient powracający</p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 sm:flex-col sm:items-end sm:gap-2">
                        {isUnclaimed ? (
                          <button
                            type="button"
                            onClick={(e) => e.preventDefault()}
                            className="rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/15 px-3 py-1.5 text-[11px] font-semibold text-[#fecaca] transition hover:bg-[#ef4444]/25"
                          >
                            ☎️ Zadzwoń
                          </button>
                        ) : null}
                        <span className="rounded-lg border border-[#3b82f6]/30 bg-[#3b82f6]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#93c5fd]">
                          {r.priority_display}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-[#6b7280]">
                          <span className="hidden sm:inline">Od</span>
                          <span className="font-mono font-medium text-[#a9b8d6]">
                            {new Date(r.created_at).toLocaleDateString("pl-PL", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {count > PAGE_SIZE && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#3b82f6]/20 bg-white/[0.03] px-4 py-4">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!previous || page <= 1 || loading}
                className="rounded-lg border border-[#3b82f6]/30 bg-[#3b82f6]/10 px-4 py-2 text-sm font-semibold text-[#60a5fa] transition hover:bg-[#3b82f6]/20 disabled:opacity-50"
              >
                ← Poprzednia
              </button>
              <p className="text-sm text-[#a9b8d6]">
                Strona <span className="font-bold text-white">{page}</span> z {pageCount}
              </p>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={!next || page >= pageCount || loading}
                className="rounded-lg border border-[#3b82f6]/30 bg-[#3b82f6]/10 px-4 py-2 text-sm font-semibold text-[#60a5fa] transition hover:bg-[#3b82f6]/20 disabled:opacity-50"
              >
                Następna →
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

