"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, Filter, Wrench } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/panel/StatusBadge";
import { apiRepairListItemToPanel, type ApiRepairListItem } from "@/lib/panel-api";
import { formatDate } from "@/lib/format";
import { formatPrice, getDeviceEmoji } from "@/types/panel";
import { truncate } from "@/lib/format";
import type { Repair } from "@/types/panel";

const ITEMS_PER_PAGE = 10;
const FILTERS = ["Wszystkie", "W naprawie", "Gotowe", "Oczekuje", "Zakończone"] as const;

function filterRepairs(repairs: Repair[] | null, activeFilter: string): Repair[] {
  if (!repairs) return [];
  if (activeFilter === "Wszystkie") return repairs;
  if (activeFilter === "W naprawie") return repairs.filter((r) => r.status === "in_progress");
  if (activeFilter === "Gotowe") return repairs.filter((r) => r.status === "ready" || r.status === "done");
  if (activeFilter === "Oczekuje") return repairs.filter((r) => r.status === "wait_decision" || r.status === "diagnosed");
  if (activeFilter === "Zakończone") return repairs.filter((r) => r.status === "done");
  return repairs;
}

function getFilterCounts(repairs: Repair[] | null): Record<string, number> {
  if (!repairs) return { Wszystkie: 0, "W naprawie": 0, Gotowe: 0, Oczekuje: 0, Zakonczone: 0 };
  return {
    Wszystkie: repairs.length,
    "W naprawie": repairs.filter((r) => r.status === "in_progress").length,
    Gotowe: repairs.filter((r) => r.status === "ready" || r.status === "done").length,
    Oczekuje: repairs.filter((r) => r.status === "wait_decision" || r.status === "diagnosed").length,
    Zakonczone: repairs.filter((r) => r.status === "done").length,
  };
}

export function ClientNaprawyList() {
  const { token } = useAuth();
  const router = useRouter();
  const [repairs, setRepairs] = useState<Repair[] | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("Wszystkie");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filteredRepairs = filterRepairs(repairs, activeFilter);
  const filterCounts = getFilterCounts(repairs);
  const totalPages = Math.max(1, Math.ceil(filteredRepairs.length / ITEMS_PER_PAGE));
  const pageRepairs = filteredRepairs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get<ApiRepairListItem[] | { results: ApiRepairListItem[] }>("/repairs/", token)
      .then((res) => {
        if (cancelled) return;
        const arr = Array.isArray(res) ? res : (res as { results: ApiRepairListItem[] }).results ?? [];
        setRepairs(arr.map(apiRepairListItemToPanel));
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Błąd ładowania.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error && !repairs) {
    return (
      <div className="mx-auto max-w-[1520px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="panel-card p-6" style={{ color: "var(--ink)" }}>
          <p style={{ color: "var(--red)" }}>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--island2)]"
          >
            Odśwież
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1520px] px-4 py-6 max-lg:px-3 sm:px-6 lg:px-8 lg:py-8">
      <div className="panel-card max-lg:rounded-[22px]">
        <div className="panel-card-header flex flex-wrap items-end justify-between gap-4 max-sm:gap-3">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
              Panel klienta
            </p>
            <h1 className="cp-heading font-extrabold" style={{ fontFamily: "var(--font-unbounded)", fontSize: "clamp(20px, 2.2vw, 28px)" }}>
              Moje naprawy
            </h1>
            <p className="mt-1 text-sm max-sm:text-xs" style={{ color: "var(--muted)" }}>
              Najważniejsze statusy i pełna historia zgłoszeń w jednym miejscu.
            </p>
          </div>
          <Link
            href="/zgloszenie"
            className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 max-sm:min-h-[44px] max-sm:rounded-[14px] max-sm:px-5 max-sm:py-3"
            style={{ background: "var(--red)" }}
          >
            + Zgłoś naprawę
          </Link>
        </div>

        {!loading && (
          <div className="grid gap-3 border-b border-[var(--border)] px-5 py-4 max-sm:grid-cols-3 max-sm:gap-2 max-sm:px-3 sm:grid-cols-3">
            <div
              className="rounded-xl border p-3 max-sm:rounded-[14px] max-sm:p-2.5"
              style={{
                borderColor: "var(--border)",
                background: "var(--island2)",
                boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide max-sm:text-[9px]" style={{ color: "var(--muted)" }}>
                Aktywne
              </p>
              <p className="mt-1 flex items-center gap-2 text-xl font-semibold cp-heading max-sm:text-lg">
                <Wrench size={16} className="max-sm:h-3.5 max-sm:w-3.5" />
                {filterCounts["W naprawie"]}
              </p>
            </div>
            <div
              className="rounded-xl border p-3 max-sm:rounded-[14px] max-sm:p-2.5"
              style={{
                borderColor: "var(--border)",
                background: "var(--island2)",
                boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide max-sm:text-[9px]" style={{ color: "var(--muted)" }}>
                Gotowe
              </p>
              <p className="mt-1 flex items-center gap-2 text-xl font-semibold cp-heading max-sm:text-lg">
                <CheckCircle2 size={16} className="max-sm:h-3.5 max-sm:w-3.5" />
                {filterCounts.Gotowe}
              </p>
            </div>
            <div
              className="rounded-xl border p-3 max-sm:rounded-[14px] max-sm:p-2.5"
              style={{
                borderColor: "var(--border)",
                background: "var(--island2)",
                boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide max-sm:text-[9px]" style={{ color: "var(--muted)" }}>
                Oczekuje
              </p>
              <p className="mt-1 flex items-center gap-2 text-xl font-semibold cp-heading max-sm:text-lg">
                <Clock3 size={16} className="max-sm:h-3.5 max-sm:w-3.5" />
                {filterCounts.Oczekuje}
              </p>
            </div>
          </div>
        )}

        {/* Scrollable filter chips on mobile */}
        <div className="flex gap-2 border-b border-[var(--border)] px-5 py-3 max-sm:overflow-x-auto max-sm:px-3 max-sm:[scrollbar-width:none] max-sm:[-ms-overflow-style:none] max-sm:[&::-webkit-scrollbar]:hidden sm:flex-wrap">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold" style={{ color: "var(--muted)" }}>
            <Filter size={13} />
            Filtry
          </span>
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className="shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition max-sm:min-h-[36px] max-sm:rounded-[10px] max-sm:px-3.5 max-sm:text-[13px]"
              style={{
                background: activeFilter === f ? "var(--red-l)" : "transparent",
                color: activeFilter === f ? "var(--red)" : "var(--ink2)",
                borderColor: activeFilter === f ? "var(--red-border)" : "var(--border)",
              }}
            >
              {f} {filterCounts[f] != null ? filterCounts[f] : 0}
            </button>
          ))}
        </div>

        {/* Mobile cards — premium */}
        <div className="space-y-2.5 p-3 sm:hidden">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 rounded-[16px] p-3.5" style={{ background: "var(--island2)" }}>
                <div className="skeleton h-12 w-12 shrink-0 rounded-xl" />
                <div className="flex-1">
                  <div className="skeleton mb-2 h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                </div>
              </div>
            ))
          ) : pageRepairs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl" style={{ background: "var(--island3)" }}>
                🔧
              </div>
              <p className="cp-heading font-semibold">Brak napraw</p>
              <p className="text-sm" style={{ color: "var(--ink2)" }}>
                {activeFilter === "Wszystkie" ? "Nie masz jeszcze zgłoszeń." : "Brak napraw w tej kategorii."}
              </p>
            </div>
          ) : (
            pageRepairs.map((repair) => {
              const deviceLabel = [repair.deviceBrand, repair.deviceModel].filter(Boolean).join(" ") || repair.deviceModel;
              return (
                <Link
                  key={`m-${repair.id}`}
                  href={`/client/naprawy/${repair.id}`}
                  className="block rounded-[16px] border p-4 transition active:scale-[0.98]"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--island2)",
                    boxShadow: "0 2px 8px rgba(15,23,42,0.06), 0 12px 28px rgba(15,23,42,0.09)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-xl"
                      style={{ background: "var(--island3)" }}
                    >
                      {getDeviceEmoji(repair.deviceCategory)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="cp-heading text-[13px] font-semibold leading-snug">
                        {truncate(repair.problemDescription ? `${deviceLabel} - ${repair.problemDescription}` : deviceLabel, 44)}
                      </p>
                      <p className="mt-1 text-[11px]" style={{ color: "var(--muted)" }}>{repair.repairNumber}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <StatusBadge status={repair.status} labelOverride={repair.statusDisplay} />
                    <div className="text-right">
                      <span className="cp-heading text-sm font-bold">{formatPrice(repair.totalPrice)}</span>
                      <p className="mt-0.5 text-[10px]" style={{ color: "var(--muted)" }}>{formatDate(repair.createdAt)}</p>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Table */}
        <div className="hidden overflow-x-auto sm:block">
          {loading ? (
            <div className="p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4 border-b border-[var(--border)] py-4">
                  <div className="skeleton h-10 w-10 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <div className="skeleton mb-2 h-4 w-3/4 rounded" />
                    <div className="skeleton h-3 w-32 rounded font-mono" />
                  </div>
                  <div className="skeleton h-4 w-24 shrink-0 rounded" />
                  <div className="skeleton h-6 w-28 shrink-0 rounded-full" />
                  <div className="skeleton h-4 w-16 shrink-0 rounded" />
                </div>
              ))}
            </div>
          ) : pageRepairs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl text-3xl" style={{ background: "var(--island3)" }}>
                🔧
              </div>
              <p className="cp-heading font-semibold">Brak napraw</p>
              <p className="text-sm" style={{ color: "var(--ink2)" }}>
                {activeFilter === "Wszystkie" ? "Nie masz jeszcze zgłoszeń." : "Brak napraw w tej kategorii."}
              </p>
              <Link
                href="/zgloszenie"
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                style={{ background: "var(--red)" }}
              >
                Zgłoś naprawę
              </Link>
            </div>
          ) : (
            <>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                    <th className="p-4 font-medium" style={{ width: "2fr" }}>Urządzenie / Naprawa</th>
                    <th className="p-4 font-medium" style={{ width: "1.2fr" }}>Data przyjęcia</th>
                    <th className="p-4 font-medium" style={{ width: "1fr" }}>Status</th>
                    <th className="p-4 font-medium" style={{ width: "1fr" }}>Koszt</th>
                    <th className="w-[100px] p-4" />
                  </tr>
                </thead>
                <tbody>
                  {pageRepairs.map((repair) => (
                    <tr
                      key={repair.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(`/client/naprawy/${repair.id}`)}
                      onKeyDown={(e) => e.key === "Enter" && router.push(`/client/naprawy/${repair.id}`)}
                      className="group cp-row-hover cursor-pointer border-t border-[var(--border)] transition"
                    >
                      <td className="p-4">
                        {(() => {
                          const deviceLabel = [repair.deviceBrand, repair.deviceModel].filter(Boolean).join(" ") || repair.deviceModel;
                          return (
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg" style={{ background: "var(--island3)" }}>
                            {getDeviceEmoji(repair.deviceCategory)}
                          </span>
                          <div className="min-w-0">
                            <p className="cp-heading font-medium">
                              {truncate(repair.problemDescription ? `${deviceLabel} – ${repair.problemDescription}` : deviceLabel, 55)}
                            </p>
                            <p className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-xs" style={{ color: "var(--muted)", fontFamily: "'Courier New', monospace" }}>
                              <span>{repair.repairNumber}</span>
                              {(repair.deliveryMethod === "kurier" || repair.pickupMethod === "kurier") && (
                                <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ background: "rgba(220,30,30,.15)", color: "var(--red)", border: "1px solid rgba(220,30,30,.35)" }}>
                                  <span aria-hidden>📦</span> Kurier
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                          );
                        })()}
                      </td>
                      <td className="p-4 text-sm" style={{ color: "var(--ink)" }}>
                        {formatDate(repair.createdAt)}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={repair.status} labelOverride={repair.statusDisplay} />
                      </td>
                      <td className="cp-heading p-4 text-sm font-medium">
                        {formatPrice(repair.totalPrice)}
                      </td>
                      <td className="p-4">
                        <span className="inline-block opacity-0 transition group-hover:opacity-100" aria-hidden>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--ink2)]">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredRepairs.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] px-5 py-4 max-sm:px-3">
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Wyświetlono {pageRepairs.length} z {filteredRepairs.length} napraw
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex h-[44px] w-[44px] items-center justify-center rounded-xl transition disabled:opacity-40 hover:bg-[var(--island3)] sm:h-auto sm:w-auto sm:rounded sm:p-2"
                aria-label="Poprzednia strona"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className="min-h-[44px] min-w-[44px] rounded-xl px-2 py-1.5 text-sm font-medium transition sm:min-h-0 sm:min-w-[36px] sm:rounded"
                  style={{
                    background: currentPage === p ? "var(--red)" : "transparent",
                    color: currentPage === p ? "#fff" : "var(--ink2)",
                  }}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="flex h-[44px] w-[44px] items-center justify-center rounded-xl transition disabled:opacity-40 hover:bg-[var(--island3)] sm:h-auto sm:w-auto sm:rounded sm:p-2"
                aria-label="Następna strona"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
