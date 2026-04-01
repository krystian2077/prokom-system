"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Package, Phone, Plus, RefreshCw, Trash2, Wrench } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api, fetchAllPages } from "@/lib/api";
import type { InventorySupplier, InventorySupplierDetail, PartUsageQueueItem } from "@/types/inventory";
import type { CustomerOrder } from "@/types/orders";
import { partUsageDisplayName } from "@/types/repairs";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { RepairTableSkeleton } from "@/components/ui/Skeleton";
import { SupplierFormModal } from "@/components/panel/SupplierFormModal";
import { useStore } from "@/store";

type UsageFilter = "all" | "ordered" | "arrived" | "used" | "unused";

type RepairOption = {
  id: string;
  repair_number?: string | null;
  client_name?: string | null;
  device_name?: string | null;
};

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
  const { addToast } = useStore();
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queueRaw, setQueueRaw] = useState<PartUsageQueueItem[]>([]);
  const [suppliers, setSuppliers] = useState<InventorySupplier[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [repairs, setRepairs] = useState<RepairOption[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [supplierModalMode, setSupplierModalMode] = useState<"create" | "edit">("create");
  const [editingSupplier, setEditingSupplier] = useState<InventorySupplierDetail | null>(null);
  const [deletingSupplierId, setDeletingSupplierId] = useState<string | null>(null);

  const [newOrder, setNewOrder] = useState({
    product_name_manual: "",
    quantity: 1,
    purchase_price: "",
    sell_price: "",
    supplier: "",
    related_repair: "",
    planned_order_date: "",
    expected_delivery_date: "",
    notes: "",
    urgent: false,
    client_waiting: true,
  });

  const [usageFilter, setUsageFilter] = useState<UsageFilter>("all");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [queueList, supplierList, ordersList, repairsList] = await Promise.all([
        fetchAllPages<PartUsageQueueItem>(`/inventory/parts-queue/?page_size=200&ordering=-created_at`, token),
        fetchAllPages<InventorySupplier>(`/inventory/suppliers/?ordering=name&page_size=200`, token),
        fetchAllPages<CustomerOrder>(`/orders/customer-orders/?ordering=-created_at&page_size=200`, token),
        fetchAllPages<RepairOption>(`/repairs/?ordering=-created_at&page_size=200`, token),
      ]);
      setQueueRaw(queueList);
      setSuppliers(supplierList);
      setOrders(ordersList);
      setRepairs(repairsList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się pobrać danych o częściach.");
      setQueueRaw([]);
      setSuppliers([]);
      setOrders([]);
      setRepairs([]);
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

  const filteredOrders = useMemo(() => {
    const needle = orderSearch.trim().toLowerCase();
    if (!needle) return orders;
    return orders.filter((o) => {
      const text = [
        o.product_name,
        o.product_name_manual,
        o.status_display,
        o.contact_phone,
        o.contact_email,
        o.notes,
      ]
        .join(" ")
        .toLowerCase();
      return text.includes(needle);
    });
  }, [orders, orderSearch]);

  const selectedOrder = useMemo(() => orders.find((o) => o.id === selectedOrderId) ?? null, [orders, selectedOrderId]);

  const orderStats = useMemo(() => {
    const waiting = orders.filter((o) => !["picked_up", "cancelled"].includes((o.status ?? "").toLowerCase())).length;
    const linked = orders.filter((o) => Boolean(o.related_repair)).length;
    return { total: orders.length, waiting, linked };
  }, [orders]);

  const openCreateSupplier = () => {
    setSupplierModalMode("create");
    setEditingSupplier(null);
    setSupplierModalOpen(true);
  };

  const openEditSupplier = async (supplierId: string) => {
    if (!token) return;
    try {
      const detail = await api.get<InventorySupplierDetail>(`/inventory/suppliers/${supplierId}/`, token);
      setSupplierModalMode("edit");
      setEditingSupplier(detail);
      setSupplierModalOpen(true);
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Nie udało się pobrać hurtowni.", "error");
    }
  };

  const deleteSupplier = async (supplier: InventorySupplier) => {
    if (!token) return;
    const ok = window.confirm(`Usunąć hurtownię "${supplier.name}"?`);
    if (!ok) return;
    setDeletingSupplierId(supplier.id);
    try {
      await api.delete(`/inventory/suppliers/${supplier.id}/`, token);
      addToast("Hurtownia została usunięta.", "success");
      await load();
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Nie udało się usunąć hurtowni.", "error");
    } finally {
      setDeletingSupplierId(null);
    }
  };

  const submitOrder = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!token) return;
    setOrderError(null);
    const productName = newOrder.product_name_manual.trim();
    if (!productName) {
      setOrderError("Podaj nazwę części.");
      return;
    }
    if (!newOrder.related_repair) {
      setOrderError("Powiąż zamówienie z naprawą z systemu.");
      return;
    }
    setSavingOrder(true);
    try {
      const payload = {
        product_name_manual: productName,
        quantity: Math.max(1, Number(newOrder.quantity) || 1),
        purchase_price: String(newOrder.purchase_price || "0"),
        sell_price: String(newOrder.sell_price || "0"),
        supplier: newOrder.supplier || null,
        related_repair: newOrder.related_repair,
        planned_order_date: newOrder.planned_order_date || null,
        expected_delivery_date: newOrder.expected_delivery_date || null,
        notes: newOrder.notes.trim(),
        urgent: newOrder.urgent,
        client_waiting: newOrder.client_waiting,
      };
      const created = await api.post<CustomerOrder>("/orders/customer-orders/", payload, token);
      addToast("Część dodana do zamówień i powiązana z naprawą.", "success");
      setNewOrder({
        product_name_manual: "",
        quantity: 1,
        purchase_price: "",
        sell_price: "",
        supplier: "",
        related_repair: "",
        planned_order_date: "",
        expected_delivery_date: "",
        notes: "",
        urgent: false,
        client_waiting: true,
      });
      await load();
      if (created?.id) setSelectedOrderId(created.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się dodać zamówienia części.";
      setOrderError(msg);
      addToast(msg, "error");
    } finally {
      setSavingOrder(false);
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
    <main className="mx-auto min-h-screen max-w-[1400px] px-4 py-8">
      <header className="mb-5 rounded-[2rem] border border-[#2a3246] bg-gradient-to-r from-[#0e1423] via-[#121b31] to-[#0d1629] p-5 shadow-[0_18px_50px_rgba(0,0,0,.35)]">
        <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#9db0d4]">Panel Admina</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Części i zamówienia</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#a9b8d6]">
            Wszystkie zamówienia części z pełnymi detalami, obowiązkowym powiązaniem z naprawą oraz zarządzaniem hurtowniami.
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
          <button
            type="button"
            onClick={openCreateSupplier}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#3b82f6]/35 bg-[#3b82f6]/15 px-4 py-2 text-sm font-semibold text-[#bfdbfe] transition hover:bg-[#3b82f6]/25"
          >
            <Plus size={16} />
            Dodaj hurtownię
          </button>
        </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Zamówienia części" value={orderStats.total} icon={<Package className="h-4 w-4" aria-hidden />} />
          <StatCard label="Do realizacji" value={orderStats.waiting} icon={<Wrench className="h-4 w-4" aria-hidden />} tone="text-[#bfdbfe]" />
          <StatCard label="Powiązane z naprawą" value={orderStats.linked} icon={<LinkIcon />} tone="text-[#bbf7d0]" />
          <StatCard label="Hurtownie" value={supplierCards.length} icon={<ExternalLink className="h-4 w-4" aria-hidden />} tone="text-[#c4b5fd]" />
        </div>
      </header>

      {error ? (
        <div className="mb-4">
          <ErrorState error={new Error(error)} onRetry={() => void load()} title="Nie udało się załadować części" />
        </div>
      ) : null}

      <section className="mb-5 grid gap-5 xl:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4 xl:col-span-1">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">Dodaj część do zamówienia</h2>
          <p className="mt-1 text-xs text-[#6b7280]">Nowa pozycja musi być przypisana do istniejącej naprawy.</p>

          <form onSubmit={(e) => void submitOrder(e)} className="mt-4 space-y-3">
            <Field label="Nazwa części *">
              <input
                value={newOrder.product_name_manual}
                onChange={(e) => setNewOrder((p) => ({ ...p, product_name_manual: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#60a5fa]"
                placeholder="np. Wyświetlacz OLED iPhone 13"
                required
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Ilość *">
                <input
                  type="number"
                  min={1}
                  value={newOrder.quantity}
                  onChange={(e) => setNewOrder((p) => ({ ...p, quantity: Number(e.target.value) || 1 }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#60a5fa]"
                  required
                />
              </Field>
              <Field label="Hurtownia">
                <select
                  value={newOrder.supplier}
                  onChange={(e) => setNewOrder((p) => ({ ...p, supplier: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#60a5fa]"
                >
                  <option value="">Wybierz</option>
                  {supplierCards.filter((s) => s.is_active !== false).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Powiązana naprawa *">
              <select
                value={newOrder.related_repair}
                onChange={(e) => setNewOrder((p) => ({ ...p, related_repair: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#60a5fa]"
                required
              >
                <option value="">Wybierz naprawę</option>
                {repairs.map((r) => (
                  <option key={r.id} value={r.id}>
                    {(r.repair_number ?? "Bez numeru") + " - " + (r.client_name ?? "Klient") + " - " + (r.device_name ?? "Urządzenie")}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Cena zakupu">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={newOrder.purchase_price}
                  onChange={(e) => setNewOrder((p) => ({ ...p, purchase_price: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#60a5fa]"
                />
              </Field>
              <Field label="Cena sprzedaży">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={newOrder.sell_price}
                  onChange={(e) => setNewOrder((p) => ({ ...p, sell_price: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#60a5fa]"
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Planowana data">
                <input
                  type="date"
                  value={newOrder.planned_order_date}
                  onChange={(e) => setNewOrder((p) => ({ ...p, planned_order_date: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#60a5fa]"
                />
              </Field>
              <Field label="Przewidywana dostawa">
                <input
                  type="date"
                  value={newOrder.expected_delivery_date}
                  onChange={(e) => setNewOrder((p) => ({ ...p, expected_delivery_date: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#60a5fa]"
                />
              </Field>
            </div>

            <Field label="Notatka">
              <textarea
                rows={3}
                value={newOrder.notes}
                onChange={(e) => setNewOrder((p) => ({ ...p, notes: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#60a5fa]"
              />
            </Field>

            <div className="flex flex-wrap gap-3 text-sm text-[#cbd5e1]">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={newOrder.urgent} onChange={(e) => setNewOrder((p) => ({ ...p, urgent: e.target.checked }))} />
                Pilne
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={newOrder.client_waiting} onChange={(e) => setNewOrder((p) => ({ ...p, client_waiting: e.target.checked }))} />
                Klient czeka
              </label>
            </div>

            {orderError ? <p className="text-sm text-[#fca5a5]">{orderError}</p> : null}

            <button
              type="submit"
              disabled={savingOrder || loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              <Plus size={16} />
              {savingOrder ? "Dodaję..." : "Dodaj część do zamówienia"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4 xl:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">Wszystkie zamówienia części</h2>
            <input
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder="Szukaj po nazwie, statusie, kontakcie..."
              className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[#111318] px-3 py-2 text-sm text-white outline-none focus:border-[#60a5fa]"
            />
          </div>

          {loading ? <RepairTableSkeleton rows={8} /> : null}

          {!loading && filteredOrders.length === 0 ? (
            <EmptyState icon={EMPTY_STATES.parts.icon} title="Brak zamówień części" description="Dodaj pierwszą część po lewej stronie." />
          ) : null}

          {!loading && filteredOrders.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                {filteredOrders.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setSelectedOrderId(o.id)}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      selectedOrderId === o.id
                        ? "border-[#60a5fa]/50 bg-[#1d4ed8]/15"
                        : "border-white/10 bg-[#0f1117] hover:bg-white/5"
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">{o.product_name}</p>
                    <p className="mt-1 text-xs text-[#9ca3af]">
                      Status: {o.status_display} · Ilość: {o.quantity}
                    </p>
                    <p className="mt-1 text-xs text-[#93c5fd]">Naprawa: {o.related_repair ?? "brak"}</p>
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0f1117] p-4">
                {!selectedOrder ? (
                  <p className="text-sm text-[#9ca3af]">Wybierz zamówienie, aby zobaczyć szczegóły.</p>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p className="text-lg font-semibold text-white">{selectedOrder.product_name}</p>
                    <DetailRow label="Status" value={selectedOrder.status_display} />
                    <DetailRow label="Ilość" value={String(selectedOrder.quantity)} />
                    <DetailRow label="Cena zakupu" value={selectedOrder.purchase_price || "-"} />
                    <DetailRow label="Cena sprzedaży" value={selectedOrder.sell_price || "-"} />
                    <DetailRow label="Marża" value={selectedOrder.margin || "-"} />
                    <DetailRow label="Telefon" value={selectedOrder.contact_phone || "-"} />
                    <DetailRow label="Email" value={selectedOrder.contact_email || "-"} />
                    <DetailRow label="Planowana data" value={selectedOrder.planned_order_date || "-"} />
                    <DetailRow label="Przewidywana dostawa" value={selectedOrder.expected_delivery_date || "-"} />
                    <DetailRow label="Powiązana naprawa" value={selectedOrder.related_repair || "-"} />
                    {selectedOrder.related_repair ? (
                      <Link href={`/admin-panel/repairs/${selectedOrder.related_repair}`} className="inline-flex text-xs font-semibold text-[#93c5fd] hover:underline">
                        Otwórz naprawę
                      </Link>
                    ) : null}
                    {selectedOrder.notes ? <p className="mt-2 whitespace-pre-wrap text-[#e5e7eb]">{selectedOrder.notes}</p> : null}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </section>

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
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void openEditSupplier(s.id)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#93c5fd] transition hover:bg-white/10"
                      >
                        Edytuj
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteSupplier(s)}
                        disabled={deletingSupplierId === s.id}
                        className="inline-flex items-center gap-1 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/15 px-3 py-1.5 text-xs font-semibold text-[#fecaca] transition hover:bg-[#ef4444]/25 disabled:opacity-60"
                      >
                        <Trash2 size={12} />
                        {deletingSupplierId === s.id ? "Usuwam..." : "Usuń"}
                      </button>
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
        onClose={() => {
          setSupplierModalOpen(false);
          setEditingSupplier(null);
        }}
        onSaved={() => void load()}
      />
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">{label}</span>
      {children}
    </label>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-[#cbd5e1]">
      <span className="text-[#8da2c5]">{label}: </span>
      <span className="text-white">{value}</span>
    </p>
  );
}

function LinkIcon() {
  return <span className="text-xs" aria-hidden>#</span>;
}

function StatCard({
  label,
  value,
  icon,
  tone = "text-white",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:bg-white/[0.06]">
      <div className="flex items-center justify-between gap-2 text-[#9fb1d3]">
        <p className="text-[11px] uppercase tracking-[0.15em]">{label}</p>
        {icon}
      </div>
      <p className={`mt-1 text-xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

