"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Package, Pencil, Phone, Plus, RefreshCw, Wrench } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api, fetchAllPages } from "@/lib/api";
import { usePanelBasePath } from "@/lib/panelPaths";
import type { InventorySupplier, InventorySupplierDetail, PartUsageQueueItem } from "@/types/inventory";
import type { RepairRequestListItem } from "@/types/repairs";
import { SupplierFormModal } from "@/components/panel/SupplierFormModal";
import { useStore } from "@/store";
import { partUsageDisplayName } from "@/types/repairs";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { RepairTableSkeleton } from "@/components/ui/Skeleton";

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

const PREMIUM_CARD_CLASS =
  "relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#121625] via-[#0f1320] to-[#0b0e18] p-5 shadow-[0_20px_55px_rgba(0,0,0,.36)]";
const PREMIUM_CARD_GLOW_CLASS =
  "pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 via-white/0 to-transparent";
const FORM_CONTROL_CLASS =
  "w-full rounded-xl border border-[#2a3348] bg-[#0d111b] px-3 py-2.5 text-sm text-white shadow-inner shadow-black/30 outline-none transition placeholder:text-[#60708f] focus:border-[#60a5fa] focus:ring-2 focus:ring-[#60a5fa]/20";

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
  const panelPaths = usePanelBasePath();
  const { token, user } = useAuth();
  const { addToast } = useStore();
  const isStaffOrAdmin = user?.role === "staff" || user?.role === "admin";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queueRaw, setQueueRaw] = useState<PartUsageQueueItem[]>([]);
  const [suppliers, setSuppliers] = useState<InventorySupplier[]>([]);
  const [repairs, setRepairs] = useState<RepairOption[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [supplierModalMode, setSupplierModalMode] = useState<"create" | "edit">("create");
  const [editingSupplier, setEditingSupplier] = useState<InventorySupplierDetail | null>(null);

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
    if (!token || !user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [queueList, supplierList, repairsList] = await Promise.all([
        fetchAllPages<PartUsageQueueItem>(`/inventory/parts-queue/?assigned_to=${encodeURIComponent(user.id)}&page_size=200&ordering=-created_at`, token),
        fetchAllPages<InventorySupplier>(`/inventory/suppliers/?is_active=true&ordering=name&page_size=200`, token),
        fetchAllPages<RepairRequestListItem>(`/staff/repairs/?assigned_to=${encodeURIComponent(user.id)}&ordering=-created_at&page_size=200`, token),
      ]);
      setQueueRaw(queueList);
      setSuppliers(supplierList);
      setRepairs(
        repairsList.map((r) => ({
          id: r.id,
          repair_number: r.repair_number,
          client_name: r.client_name,
          device_name: r.device_name,
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się pobrać części.");
      setQueueRaw([]);
      setSuppliers([]);
      setRepairs([]);
    } finally {
      setLoading(false);
    }
  }, [token, user?.id]);

  useEffect(() => {
    if (!isStaffOrAdmin) return;
    void load();
  }, [isStaffOrAdmin, load]);

  const filteredQueue = useMemo(() => {
    if (usageFilter === "all") return queueRaw;
    return queueRaw.filter((q) => (q.usage_status ?? "").toLowerCase() === usageFilter);
  }, [queueRaw, usageFilter]);

  const supplierCards = useMemo(() => suppliers, [suppliers]);

  const orderStats = useMemo(() => {
    const waiting = queueRaw.filter((q) => {
      const s = (q.usage_status ?? "").toLowerCase();
      return s !== "used" && s !== "unused";
    }).length;
    const linked = queueRaw.filter((q) => Boolean(q.repair)).length;
    return { total: queueRaw.length, waiting, linked };
  }, [queueRaw]);

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
      await api.post("/orders/customer-orders/", payload, token);
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
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się dodać zamówienia części.";
      setOrderError(msg);
      addToast(msg, "error");
    } finally {
      setSavingOrder(false);
    }
  };

  if (!isStaffOrAdmin) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
        <p className="text-sm text-[#fca5a5]">Brak uprawnień.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1400px] px-4 py-8">
      <header className="mb-5 rounded-[2rem] border border-[#2a3246] bg-gradient-to-r from-[#0e1423] via-[#121b31] to-[#0d1629] p-5 shadow-[0_18px_50px_rgba(0,0,0,.35)]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#9db0d4]">Panel Pracownika</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Części i zamówienia</h1>
            <p className="mt-1 max-w-2xl text-sm text-[#a9b8d6]">
              Widok części przypisanych do Ciebie, z tym samym premium layoutem i zarządzaniem hurtowniami.
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
        <div className={`${PREMIUM_CARD_CLASS} xl:col-span-1`}>
          <div className={PREMIUM_CARD_GLOW_CLASS} aria-hidden />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9fb1d3]">Operacje</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Dodaj część do zamówienia</h2>
          <p className="mt-1 text-xs text-[#7f8ca6]">Nowa pozycja musi być przypisana do istniejącej naprawy.</p>

          <form onSubmit={(e) => void submitOrder(e)} className="mt-4 space-y-3">
            <Field label="Nazwa części *">
              <input
                value={newOrder.product_name_manual}
                onChange={(e) => setNewOrder((p) => ({ ...p, product_name_manual: e.target.value }))}
                className={FORM_CONTROL_CLASS}
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
                  className={FORM_CONTROL_CLASS}
                  required
                />
              </Field>
              <Field label="Hurtownia">
                <select
                  value={newOrder.supplier}
                  onChange={(e) => setNewOrder((p) => ({ ...p, supplier: e.target.value }))}
                  className={FORM_CONTROL_CLASS}
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
                className={FORM_CONTROL_CLASS}
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
                  className={FORM_CONTROL_CLASS}
                />
              </Field>
              <Field label="Cena sprzedaży">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={newOrder.sell_price}
                  onChange={(e) => setNewOrder((p) => ({ ...p, sell_price: e.target.value }))}
                  className={FORM_CONTROL_CLASS}
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Planowana data">
                <input
                  type="date"
                  value={newOrder.planned_order_date}
                  onChange={(e) => setNewOrder((p) => ({ ...p, planned_order_date: e.target.value }))}
                  className={FORM_CONTROL_CLASS}
                />
              </Field>
              <Field label="Przewidywana dostawa">
                <input
                  type="date"
                  value={newOrder.expected_delivery_date}
                  onChange={(e) => setNewOrder((p) => ({ ...p, expected_delivery_date: e.target.value }))}
                  className={FORM_CONTROL_CLASS}
                />
              </Field>
            </div>

            <Field label="Notatka">
              <textarea
                rows={3}
                value={newOrder.notes}
                onChange={(e) => setNewOrder((p) => ({ ...p, notes: e.target.value }))}
                className={FORM_CONTROL_CLASS}
              />
            </Field>

            <div className="flex flex-wrap gap-2 text-sm text-[#d1dae9]">
              <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
                <input className="h-4 w-4 rounded border-white/20 bg-transparent accent-[#dc2626]" type="checkbox" checked={newOrder.urgent} onChange={(e) => setNewOrder((p) => ({ ...p, urgent: e.target.checked }))} />
                Pilne
              </label>
              <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
                <input className="h-4 w-4 rounded border-white/20 bg-transparent accent-[#2563eb]" type="checkbox" checked={newOrder.client_waiting} onChange={(e) => setNewOrder((p) => ({ ...p, client_waiting: e.target.checked }))} />
                Klient czeka
              </label>
            </div>

            {orderError ? <p className="text-sm text-[#fca5a5]">{orderError}</p> : null}

            <button
              type="submit"
              disabled={savingOrder || loading}
              className="inline-flex items-center gap-2 rounded-xl border border-[#3b82f6]/50 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(37,99,235,.35)] transition hover:brightness-110 disabled:opacity-60"
            >
              <Plus size={16} />
              {savingOrder ? "Dodaję..." : "Dodaj część do zamówienia"}
            </button>
          </form>
        </div>

        <div className={`${PREMIUM_CARD_CLASS} xl:col-span-2`}>
          <div className={PREMIUM_CARD_GLOW_CLASS} aria-hidden />
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9fb1d3]">Monitoring</p>
              <h2 className="text-lg font-semibold text-white">Aktywne części</h2>
            </div>
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
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition ${
                  usageFilter === t.key
                    ? "border-[#dc1e1e]/55 bg-[#dc1e1e]/20 text-white"
                    : "border-white/10 bg-white/5 text-[#9ca3af] hover:border-white/20 hover:bg-white/10 hover:text-white"
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
                  <div key={row.id} className="rounded-2xl border border-white/10 bg-[#111726] p-3.5 shadow-[0_8px_24px_rgba(0,0,0,.28)] transition hover:border-white/20 hover:bg-[#141c2d]">
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
                          <Link href={panelPaths.repairDetailPath(row.repair)} className="text-xs font-semibold text-[#9ca3af] hover:text-white">
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
      </section>

      <section className="mb-5">
        <div className={PREMIUM_CARD_CLASS}>
          <div className={PREMIUM_CARD_GLOW_CLASS} aria-hidden />
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9fb1d3]">Dostawcy</p>
              <h2 className="text-lg font-semibold text-white">Hurtownie</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white">
                {supplierCards.length}
              </span>
              <button
                type="button"
                onClick={openCreateSupplier}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#3b82f6]/45 bg-[#3b82f6]/20 px-3 py-1.5 text-xs font-semibold text-[#dbeafe] shadow-[0_8px_20px_rgba(59,130,246,.22)] transition hover:brightness-110"
              >
                <Plus size={14} />
                Dodaj hurtownię
              </button>
            </div>
          </div>
          <p className="mb-3 text-xs text-[#7f8ca6]">
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
            <div className="grid gap-3 md:grid-cols-2">
              {supplierCards.map((s) => {
                const href = s.website_url?.trim()
                  ? s.website_url.startsWith("http")
                    ? s.website_url
                    : `https://${s.website_url}`
                  : null;
                return (
                  <article key={s.id} className="rounded-2xl border border-white/10 bg-[#111726] p-3.5 shadow-[0_8px_24px_rgba(0,0,0,.28)] transition hover:border-white/20 hover:bg-[#141c2d]">
                    <p className="text-sm font-semibold tracking-wide text-white">{s.name}</p>
                    <div className="mt-2 flex flex-col gap-1.5 text-xs text-[#9ca3af]">
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-[#93c5fd] hover:text-[#bfdbfe]"
                        >
                          {formatWebsite(s.website_url)}
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span>Brak strony www</span>
                      )}
                      {s.phone ? (
                        <a href={`tel:${String(s.phone).replace(/\s/g, "")}`} className="inline-flex items-center gap-1 text-[#d1d5db] hover:text-white">
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
                        onClick={() => void openEditSupplier(s)}
                        className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#93c5fd] transition hover:border-white/20 hover:bg-white/10"
                      >
                        <Pencil size={12} />
                        Edytuj
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

