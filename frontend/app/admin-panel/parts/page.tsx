"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Package, Phone, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAllPages } from "@/lib/api";
import type { InventorySupplier, PartUsageQueueItem } from "@/types/inventory";
import { partUsageDisplayName } from "@/types/repairs";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { RepairTableSkeleton } from "@/components/ui/Skeleton";

type UsageFilter = "all" | "ordered" | "arrived" | "used" | "unused";

const FILTER_TABS: Array<{ key: UsageFilter; label: string }> = [
  { key: "all", label: "Wszystkie" },
  { key: "ordered", label: "W drodze" },
  { key: "arrived", label: "Dotarły" },
  { key: "used", label: "Użyte" },
  { key: "unused", label: "Niewykorzystane" },
];

function statusBadgeClass(status: string): string {
  const s = (status ?? "").toLowerCase();
  if (s === "arrived") return "border-[var(--gb)] bg-[var(--gl)] text-[var(--green)] animate-glow-g";
  if (s === "ordered") return "border-[#f59e0b]/40 bg-[#f59e0b]/10 text-[#ffe3b0]";
  if (s === "used") return "border-white/20 bg-white/10 text-[#d1d5db]";
  if (s === "unused") return "border-white/20 bg-white/10 text-[#9ca3af]";
  return "border-white/20 bg-white/10 text-[#d1d5db]";
}

function statusLabel(status: string, display?: string | null): string {
  const s = (status ?? "").toLowerCase();
  if (s === "arrived") return "Dotarła · Zamontuj!";
  return display || status || "—";
}

function formatWebsite(url: string | null | undefined): string {
  if (!url) return "";
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function AdminPartsPage() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queueRaw, setQueueRaw] = useState<PartUsageQueueItem[]>([]);
  const [suppliers, setSuppliers] = useState<InventorySupplier[]>([]);
  const [usageFilter, setUsageFilter] = useState<UsageFilter>("all");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [queueList, supplierList] = await Promise.all([
        fetchAllPages<PartUsageQueueItem>(`/inventory/parts-queue/?page_size=200&ordering=-created_at`, token),
        fetchAllPages<InventorySupplier>(`/inventory/suppliers/?is_active=true&ordering=name&page_size=200`, token),
      ]);
      setQueueRaw(queueList);
      setSuppliers(supplierList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się pobrać danych o częściach.");
      setQueueRaw([]);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token || !isAdmin) return;
    void load();
  }, [token, isAdmin, load]);

  const filteredQueue = useMemo(() => {
    if (usageFilter === "all") return queueRaw;
    return queueRaw.filter((q) => (q.usage_status ?? "").toLowerCase() === usageFilter);
  }, [queueRaw, usageFilter]);

  const supplierCards = useMemo(() => suppliers, [suppliers]);

  if (!isAdmin) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
        <p className="text-sm text-[#fca5a5]">Tylko administrator.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1400px] px-4 py-8">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Panel Admina</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Części</h1>
          <p className="mt-1 max-w-xl text-sm text-[#6b7280]">
            Kolejka z magazynu napraw (status części) oraz aktywni dostawcy z API.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Odśwież
          </button>
          <Link
            href="/admin-panel/orders"
            className="rounded-2xl bg-[#dc1e1e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b81818]"
          >
            + Zamów część
          </Link>
        </div>
      </header>

      {error ? (
        <div className="mb-4">
          <ErrorState error={new Error(error)} onRetry={() => void load()} title="Nie udało się załadować części" />
        </div>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">Aktywne części</h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white">
              {filteredQueue.length}
            </span>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {FILTER_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setUsageFilter(t.key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  usageFilter === t.key
                    ? "border-[#dc1e1e]/50 bg-[#dc1e1e]/15 text-white"
                    : "border-white/10 bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-2">
              <RepairTableSkeleton rows={6} />
            </div>
          ) : null}

          {!loading && !error && filteredQueue.length === 0 ? (
            <EmptyState
              icon={EMPTY_STATES.parts.icon}
              title={usageFilter === "all" ? EMPTY_STATES.parts.title : "Brak pozycji w tym filtrze"}
              description={
                usageFilter === "all"
                  ? EMPTY_STATES.parts.description
                  : "Zmień filtr lub dodaj część do naprawy w szczegółach zlecenia."
              }
            />
          ) : null}

          {!loading && !error && filteredQueue.length > 0 ? (
            <div className="space-y-2">
              {filteredQueue.map((row) => {
                const st = (row.usage_status ?? "").toLowerCase();
                return (
                  <div key={row.id} className="rounded-2xl border border-white/10 bg-[#0f1117] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Package size={16} className="shrink-0 text-[#6b7280]" />
                          <p className="truncate text-sm font-semibold text-white">{partUsageDisplayName(row)}</p>
                        </div>
                        <p className="mt-1 font-mono text-xs text-[#93c5fd]">{row.repair_number ?? "—"}</p>
                        <p className="mt-1 text-xs text-[#9ca3af]">
                          Hurtownia: {row.supplier_detail?.name ?? "—"}
                          {row.assigned_to_name ? ` · Przypisany: ${row.assigned_to_name}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusBadgeClass(st)}`}>
                          {statusLabel(st, row.usage_status_display)}
                        </span>
                        {row.repair ? (
                          <Link
                            href={`/admin-panel/repairs/${row.repair}`}
                            className="text-xs font-semibold text-[#9ca3af] hover:text-white"
                          >
                            Otwórz naprawę
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">Hurtownie</h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white">
              {supplierCards.length}
            </span>
          </div>
          <p className="mb-3 text-xs text-[#6b7280]">
            Źródło: <span className="font-mono text-[#9ca3af]">GET /inventory/suppliers/</span>
          </p>

          {loading ? (
            <div className="space-y-2 py-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : null}

          {!loading && !error && supplierCards.length === 0 ? (
            <p className="text-sm text-[#6b7280]">Brak aktywnych dostawców w bazie.</p>
          ) : null}

          {!loading && supplierCards.length > 0 ? (
            <div className="space-y-2">
              {supplierCards.map((s) => {
                const href = s.website_url?.trim()
                  ? s.website_url.startsWith("http")
                    ? s.website_url
                    : `https://${s.website_url}`
                  : null;
                return (
                  <article key={s.id} className="rounded-2xl border border-white/10 bg-[#0f1117] p-3">
                    <p className="text-sm font-semibold text-white">{s.name}</p>
                    <div className="mt-2 flex flex-col gap-1.5 text-xs text-[#9ca3af]">
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-[#93c5fd] hover:underline"
                        >
                          {formatWebsite(s.website_url)}
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span>Brak strony www</span>
                      )}
                      {s.phone ? (
                        <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1 text-[#d1d5db] hover:text-white">
                          <Phone size={12} />
                          {s.phone}
                        </a>
                      ) : null}
                      {s.email ? (
                        <a href={`mailto:${s.email}`} className="text-[#d1d5db] hover:text-white">
                          {s.email}
                        </a>
                      ) : null}
                      <p className="mt-1 text-[11px] font-semibold text-[#d1d5db]">
                        Czas dostawy:{" "}
                        {Number.isFinite(Number(s.average_delivery_days)) && Number(s.average_delivery_days) > 0
                          ? `${s.average_delivery_days} dni`
                          : "—"}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
