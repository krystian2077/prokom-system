"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api, fetchAllPages } from "@/lib/api";
import type { InventorySupplier, InventorySupplierDetail } from "@/types/inventory";
import { SupplierFormModal } from "@/components/panel/SupplierFormModal";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { RepairTableSkeleton } from "@/components/ui/Skeleton";

export default function AdminSuppliersPage() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<InventorySupplier[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<InventorySupplierDetail | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAllPages<InventorySupplier>(`/inventory/suppliers/?ordering=name&page_size=200`, token);
      setRows(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się pobrać hurtowni.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token || !isAdmin) return;
    void load();
  }, [token, isAdmin, load]);

  const openCreate = () => {
    setModalMode("create");
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = async (s: InventorySupplier) => {
    if (!token) return;
    setError(null);
    try {
      const detail = await api.get<InventorySupplierDetail>(`/inventory/suppliers/${s.id}/`, token);
      setModalMode("edit");
      setEditing(detail);
      setModalOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się wczytać hurtowni.");
    }
  };

  if (!isAdmin) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
        <p className="text-sm text-[#fca5a5]">Tylko administrator.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1100px] px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Panel Admina</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Hurtownie</h1>
          <p className="mt-1 text-sm text-[#6b7280]">Dostawcy części — edycja i średni czas dostawy.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Odśwież
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#dc1e1e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b81818]"
          >
            <Plus size={16} />
            Dodaj hurtownię
          </button>
        </div>
      </header>

      {error && !modalOpen ? (
        <div className="mb-4">
          <ErrorState error={new Error(error)} onRetry={() => void load()} title="Błąd" />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0c0d12]">
        {loading ? (
          <div className="p-4">
            <RepairTableSkeleton rows={8} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={EMPTY_STATES.parts.icon} title="Brak hurtowni" description="Dodaj pierwszego dostawcę." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
                <th className="px-4 py-3">Nazwa</th>
                <th className="hidden px-4 py-3 sm:table-cell">Kontakt</th>
                <th className="px-4 py-3">Dni</th>
                <th className="px-4 py-3">Aktywny</th>
                <th className="px-4 py-3 text-right">Akcja</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-semibold text-white">{s.name}</td>
                  <td className="hidden max-w-[220px] truncate px-4 py-3 text-[#9ca3af] sm:table-cell">
                    {[s.phone, s.email].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-[#e5e7eb]">
                    {Number.isFinite(Number(s.average_delivery_days)) && Number(s.average_delivery_days) > 0
                      ? `${s.average_delivery_days} dni`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-[#9ca3af]">{s.is_active !== false ? "tak" : "nie"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void openEdit(s)}
                      className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#93c5fd] hover:bg-white/10"
                    >
                      <Pencil size={14} />
                      Edytuj
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <SupplierFormModal
        open={modalOpen}
        mode={modalMode}
        initial={editing}
        token={token}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSaved={() => void load()}
      />
    </main>
  );
}
