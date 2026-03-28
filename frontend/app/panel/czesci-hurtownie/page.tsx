"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, Package, Phone, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAllPages } from "@/lib/api";
import type { InventorySupplier, PartUsageQueueItem } from "@/types/inventory";
import { partUsageDisplayName } from "@/types/repairs";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { RepairTableSkeleton } from "@/components/ui/Skeleton";

type PartsFilter = "all" | "ordered" | "arrived" | "used" | "unused";

type PartRow = {
  id: string;
  repairId: string;
  repairNumber: string;
  deviceName: string;
  partName: string;
  supplierName: string;
  createdAt: string;
  status: string;
  statusDisplay: string;
};

const FILTER_TABS: Array<{ key: PartsFilter; label: string }> = [
  { key: "all", label: "Wszystkie" },
  { key: "ordered", label: "W drodze" },
  { key: "arrived", label: "Dotarły" },
  { key: "used", label: "Użyte" },
  { key: "unused", label: "Niewykorzystane" },
];

type SupplierCardRow = {
  id: string;
  name: string;
  website_url: string;
  phone: string | null;
  email: string | null;
  leadDays: number | null;
};

const SUPPLIER_FALLBACK: SupplierCardRow[] = [
  { id: "a", name: "Dostawca A - GSM Parts PL", website_url: "https://gsm-parts.pl", phone: null, email: null, leadDays: 1 },
  { id: "b", name: "Dostawca B - MobileHub", website_url: "https://mobilehub.example", phone: null, email: null, leadDays: 2 },
  { id: "c", name: "Dostawca C - iTech Supply", website_url: "https://itech-supply.example", phone: null, email: null, leadDays: 3 },
];

function mapQueueItemToRow(q: PartUsageQueueItem): PartRow {
  const status = (q.usage_status ?? "").toLowerCase();
  return {
    id: q.id,
    repairId: q.repair,
    repairNumber: q.repair_number ?? "—",
    deviceName: (q.repair_device_name ?? "").trim() || "—",
    partName: partUsageDisplayName(q),
    supplierName: q.supplier_detail?.name ?? "Brak dostawcy",
    createdAt: q.created_at ?? "",
    status,
    statusDisplay: q.usage_status_display ?? status,
  };
}

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

export default function PartsSuppliersPage() {
  const { token, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<PartRow[]>([]);
  const [suppliers, setSuppliers] = useState<InventorySupplier[]>([]);

  const statusFilter = useMemo<PartsFilter>(() => {
    const raw = searchParams.get("status");
    if (raw === "ordered" || raw === "arrived" || raw === "used" || raw === "unused") return raw;
    if (raw === "in_transit") return "ordered";
    return "all";
  }, [searchParams]);

  const setFilter = (next: PartsFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("status");
    else params.set("status", next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const load = useCallback(async () => {
    if (!token || !user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const base = `/inventory/parts-queue/?assigned_to=${encodeURIComponent(user.id)}&page_size=200&ordering=-created_at`;
      const [queueList, supplierList] = await Promise.all([
        fetchAllPages<PartUsageQueueItem>(base, token),
        fetchAllPages<InventorySupplier>(`/inventory/suppliers/?is_active=true&ordering=name&page_size=200`, token),
      ]);
      setRows(queueList.map(mapQueueItemToRow));
      setSuppliers(supplierList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się pobrać części.");
      setRows([]);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, [token, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRows = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((row) => row.status === statusFilter);
  }, [rows, statusFilter]);

  const supplierCards = useMemo((): SupplierCardRow[] => {
    if (suppliers.length > 0) {
      return suppliers.map((s) => ({
        id: s.id,
        name: s.name,
        website_url: s.website_url ?? "",
        phone: s.phone ?? null,
        email: s.email ?? null,
        leadDays:
          Number.isFinite(Number(s.average_delivery_days)) && Number(s.average_delivery_days) > 0
            ? Number(s.average_delivery_days)
            : null,
      }));
    }
    return SUPPLIER_FALLBACK;
  }, [suppliers]);

  const formatDate = (value: string) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("pl-PL");
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Magazyn</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Moje części</h1>
          <p className="mt-1 text-sm text-[#6b7280]">
            Kolejka z magazynu napraw (GET /inventory/parts-queue/?assigned_to=…) — wszystkie strony paginacji.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Odśwież
        </button>
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
              {loading ? "…" : filteredRows.length}
            </span>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {FILTER_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setFilter(t.key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === t.key
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

          {!loading && !error && filteredRows.length === 0 ? (
            <EmptyState
              icon={EMPTY_STATES.parts.icon}
              title={statusFilter === "all" ? EMPTY_STATES.parts.title : "Brak pozycji w tym filtrze"}
              description={
                statusFilter === "all"
                  ? EMPTY_STATES.parts.description
                  : "Zmień filtr lub dodaj część do naprawy w szczegółach zlecenia."
              }
            />
          ) : null}

          {!loading && !error && filteredRows.length > 0 ? (
            <div className="space-y-2">
              {filteredRows.map((row) => {
                const st = row.status;
                return (
                  <div key={row.id} className="rounded-2xl border border-white/10 bg-[#0f1117] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Package size={16} className="shrink-0 text-[#6b7280]" />
                          <p className="truncate text-sm font-semibold text-white">{row.partName}</p>
                        </div>
                        <p className="mt-1 font-mono text-xs text-[#93c5fd]">{row.repairNumber}</p>
                        <p className="mt-1 text-xs text-[#9ca3af]">
                          {row.deviceName} · {row.supplierName} · {formatDate(row.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusBadgeClass(st)}`}>
                          {statusLabel(st, row.statusDisplay)}
                        </span>
                        <Link
                          href={`/panel/naprawy/${row.repairId}`}
                          className="text-xs font-semibold text-[#9ca3af] hover:text-white"
                        >
                          Otwórz naprawę
                        </Link>
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
              {loading ? "…" : supplierCards.length}
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

          {!loading && !error && suppliers.length === 0 ? (
            <p className="text-sm text-[#6b7280]">Brak aktywnych dostawców w bazie (lub błąd wczytywania).</p>
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
                        <a
                          href={`tel:${String(s.phone).replace(/\s/g, "")}`}
                          className="inline-flex items-center gap-1 text-[#d1d5db] hover:text-white"
                        >
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
                        Czas dostawy: {s.leadDays != null ? `${s.leadDays} dni` : "—"}
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
