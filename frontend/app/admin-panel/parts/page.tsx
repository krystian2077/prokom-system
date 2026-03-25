"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { InventorySupplier } from "@/types/inventory";
import type { RepairRequestListItem } from "@/types/repairs";

type Paginated<T> = {
  count?: number;
  results?: T[];
};

type PurchaseOrderItem = {
  id: string;
  status?: string;
  status_display?: string;
  supplier_name?: string;
  repair_id?: string;
  repair_number?: string;
  part_name?: string;
  assigned_to_name?: string;
  created_at?: string;
};

type ActivePartRow = {
  id: string;
  partName: string;
  repairId: string;
  repairNumber: string;
  supplierName: string;
  status: string;
  statusDisplay: string;
  assignedLabel: string;
  createdAt: string;
};

function toRows<T>(res: T[] | Paginated<T>): T[] {
  return Array.isArray(res) ? res : res?.results ?? [];
}

function statusBadgeClass(status: string): string {
  const s = (status ?? "").toLowerCase();
  if (s === "arrived") return "border-[var(--gb)] bg-[var(--gl)] text-[var(--green)] animate-glow-g";
  if (s === "in_transit") return "border-[#3b82f6]/40 bg-[#3b82f6]/10 text-[#bcd6ff]";
  if (s === "used") return "border-white/20 bg-white/10 text-[#d1d5db]";
  if (s === "ordered") return "border-[#f59e0b]/40 bg-[#f59e0b]/10 text-[#ffe3b0]";
  return "border-white/20 bg-white/10 text-[#d1d5db]";
}

export default function AdminPartsPage() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ActivePartRow[]>([]);
  const [suppliers, setSuppliers] = useState<InventorySupplier[]>([]);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [poRes, suppliersRes, repairsRes] = await Promise.all([
        api.get<PurchaseOrderItem[] | Paginated<PurchaseOrderItem>>(`/inventory/purchase-orders/?status=in_progress&ordering=-created_at`, token),
        api.get<InventorySupplier[] | Paginated<InventorySupplier>>(`/inventory/suppliers/?is_active=true&ordering=name`, token),
        api.get<RepairRequestListItem[] | Paginated<RepairRequestListItem>>(`/repairs/?page_size=200&ordering=-created_at`, token),
      ]);

      const poRows = toRows(poRes);
      const supplierRows = toRows(suppliersRes);
      const repairs = toRows(repairsRes);
      const repairById = new Map(repairs.map((r) => [String(r.id), r]));

      const mapped: ActivePartRow[] = poRows.map((po) => {
        const rep = po.repair_id ? repairById.get(String(po.repair_id)) : undefined;
        const assignee =
          rep?.assigned_to && typeof rep.assigned_to !== "string"
            ? [rep.assigned_to.first_name, rep.assigned_to.last_name].filter(Boolean).join(" ").trim() || rep.assigned_to.email
            : rep?.assigned_to && typeof rep.assigned_to === "string"
              ? rep.assigned_to
              : po.assigned_to_name || "Nieprzypisany";

        return {
          id: String(po.id),
          partName: po.part_name || "Część",
          repairId: String(po.repair_id ?? ""),
          repairNumber: po.repair_number || rep?.repair_number || "—",
          supplierName: po.supplier_name || "Brak dostawcy",
          status: (po.status || "ordered").toLowerCase(),
          statusDisplay: po.status_display || po.status || "—",
          assignedLabel: assignee,
          createdAt: po.created_at || "",
        };
      });

      setRows(mapped);
      setSuppliers(supplierRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się pobrać części admina.");
      setRows([]);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !isAdmin) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  const supplierCards = useMemo(() => suppliers.slice(0, 8), [suppliers]);

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
        </div>
        <button
          type="button"
          className="rounded-2xl bg-[#dc1e1e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b81818]"
        >
          + Zamów część
        </button>
      </header>

      {error ? <div className="mb-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-[#fca5a5]">{error}</div> : null}

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">Aktywne części</h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white">
              {rows.length}
            </span>
          </div>

          {loading ? <p className="text-sm text-[#9ca3af]">Ładowanie…</p> : null}
          {!loading && rows.length === 0 ? <p className="text-sm text-[#6b7280]">Brak aktywnych części.</p> : null}
          {!loading ? (
            <div className="space-y-2">
              {rows.map((row) => (
                <div key={row.id} className="rounded-2xl border border-white/10 bg-[#0f1117] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{row.partName}</p>
                      <p className="mt-1 text-xs text-[#9ca3af]">
                        {row.repairNumber} · {row.supplierName}
                      </p>
                      <p className="mt-1 text-xs text-[#9ca3af]">Przypisany: {row.assignedLabel}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusBadgeClass(row.status)}`}>
                        {row.status === "arrived" ? "Dotarła · Zamontuj!" : row.statusDisplay}
                      </span>
                      {row.repairId ? (
                        <Link href={`/admin-panel/repairs/${row.repairId}`} className="text-xs font-semibold text-[#9ca3af] hover:text-white">
                          Otwórz naprawę
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
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
          {loading ? <p className="text-sm text-[#9ca3af]">Ładowanie…</p> : null}
          {!loading && supplierCards.length === 0 ? <p className="text-sm text-[#6b7280]">Brak aktywnych dostawców.</p> : null}
          <div className="space-y-2">
            {supplierCards.map((s) => (
              <article key={s.id} className="rounded-2xl border border-white/10 bg-[#0f1117] p-3">
                <p className="text-sm font-semibold text-white">{s.name}</p>
                <p className="mt-1 truncate text-xs text-[#9ca3af]">{s.website_url || "Brak URL"}</p>
                <p className="mt-2 text-xs font-semibold text-[#d1d5db]">
                  Czas dostawy: {Number.isFinite(Number(s.average_delivery_days)) ? `${s.average_delivery_days} dni` : "—"}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

