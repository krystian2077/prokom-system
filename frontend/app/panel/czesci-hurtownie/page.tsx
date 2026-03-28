"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, Package, Pencil, Phone, Plus, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api, fetchAllPages } from "@/lib/api";
import type { InventorySupplier, InventorySupplierDetail, PartUsageQueueItem } from "@/types/inventory";
import { SupplierFormModal } from "@/components/panel/SupplierFormModal";
import { useStore } from "@/store";
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
  if (s === "used") return "border-white/20 bg-[var(--row-active)] text-[#d1d5db]";
  if (s === "unused") return "border-white/20 bg-[var(--row-active)] text-[var(--ink2)]";
  return "border-white/20 bg-[var(--row-active)] text-[#d1d5db]";
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
  const { addToast } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<PartRow[]>([]);
  const [suppliers, setSuppliers] = useState<InventorySupplier[]>([]);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [supplierModalMode, setSupplierModalMode] = useState<"create" | "edit">("create");
  const [editingSupplier, setEditingSupplier] = useState<InventorySupplierDetail | null>(null);

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

  const openCreateSupplier = () => {
    setSupplierModalMode("create");
    setEditingSupplier(null);
    setSupplierModalOpen(true);
  };

  const openEditSupplier = async (s: InventorySupplier) => {
    if (!token) return;
    try {
      const detail = await api.get<InventorySupplierDetail>(`/inventory/suppliers/${s.id}/`, token);
      setSupplierModalMode("edit");
      setEditingSupplier(detail);
      setSupplierModalOpen(true);
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Nie udało się wczytać hurtowni.", "error");
    }
  };

  const supplierLeadDays = (s: InventorySupplier) =>
    Number.isFinite(Number(s.average_delivery_days)) && Number(s.average_delivery_days) > 0
      ? Number(s.average_delivery_days)
      : null;

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
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink2)]">Magazyn</p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--white)]">Moje części</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Kolejka z magazynu napraw (GET /inventory/parts-queue/?assigned_to=…) — wszystkie strony paginacji.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)] disabled:opacity-50"
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
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Aktywne części</h2>
            <span className="rounded-full border border-[var(--border)] bg-[var(--row-hover)] px-2.5 py-1 text-xs font-semibold text-[var(--white)]">
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
                    : "border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)] hover:bg-[var(--row-active)] hover:text-[var(--white)]"
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
                  <div key={row.id} className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Package size={16} className="shrink-0 text-[var(--muted)]" />
                          <p className="truncate text-sm font-semibold text-[var(--white)]">{row.partName}</p>
                        </div>
                        <p className="mt-1 font-mono text-xs text-[#93c5fd]">{row.repairNumber}</p>
                        <p className="mt-1 text-xs text-[var(--ink2)]">
                          {row.deviceName} · {row.supplierName} · {formatDate(row.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusBadgeClass(st)}`}>
                          {statusLabel(st, row.statusDisplay)}
                        </span>
                        <Link
                          href={`/panel/naprawy/${row.repairId}`}
                          className="text-xs font-semibold text-[var(--ink2)] hover:text-[var(--white)]"
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

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Hurtownie</h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[var(--border)] bg-[var(--row-hover)] px-2.5 py-1 text-xs font-semibold text-[var(--white)]">
                {loading ? "…" : suppliers.length}
              </span>
              <button
                type="button"
                onClick={openCreateSupplier}
                disabled={!token}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-[var(--border)] bg-[#dc1e1e]/90 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#b81818] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={14} />
                Dodaj hurtownię
              </button>
            </div>
          </div>
          <p className="mb-3 text-xs text-[var(--muted)]">
            Lista aktywnych dostawców z magazynu — dodawanie i edycja przez pracownika (POST/PATCH).
          </p>

          {loading ? (
            <div className="space-y-2 py-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--row-hover)]" />
              ))}
            </div>
          ) : null}

          {!loading && !error && suppliers.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              Brak aktywnych hurtowni. Użyj „Dodaj hurtownię”, aby zapisać nazwę, link i kontakt.
            </p>
          ) : null}

          {!loading && suppliers.length > 0 ? (
            <div className="space-y-2">
              {suppliers.map((s) => {
                const web = (s.website_url ?? "").trim();
                const href = web
                  ? web.startsWith("http")
                    ? web
                    : `https://${web}`
                  : null;
                const lead = supplierLeadDays(s);
                return (
                  <article key={s.id} className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 text-sm font-semibold text-[var(--white)]">{s.name}</p>
                      <button
                        type="button"
                        onClick={() => void openEditSupplier(s)}
                        className="shrink-0 rounded-xl border border-[var(--border)] bg-[var(--row-hover)] p-2 text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
                        title="Edytuj hurtownię"
                        aria-label="Edytuj hurtownię"
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-col gap-1.5 text-xs text-[var(--ink2)]">
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
                          className="inline-flex items-center gap-1 text-[#d1d5db] hover:text-[var(--white)]"
                        >
                          <Phone size={12} />
                          {s.phone}
                        </a>
                      ) : null}
                      {s.email ? (
                        <a href={`mailto:${s.email}`} className="text-[#d1d5db] hover:text-[var(--white)]">
                          {s.email}
                        </a>
                      ) : null}
                      {!s.phone && !s.email ? (
                        <span className="text-[var(--muted)]">Kontakt: —</span>
                      ) : null}
                      <p className="mt-1 text-[11px] font-semibold text-[#d1d5db]">
                        Czas dostawy: {lead != null ? `${lead} dni` : "—"}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>

      <SupplierFormModal
        open={supplierModalOpen}
        mode={supplierModalMode}
        initial={editingSupplier}
        token={token}
        onClose={() => setSupplierModalOpen(false)}
        onSaved={() => void load()}
      />
    </main>
  );
}
