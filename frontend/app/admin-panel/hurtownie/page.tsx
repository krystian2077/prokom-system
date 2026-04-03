"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarClock,
  ExternalLink,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api, fetchAllPages } from "@/lib/api";
import type { InventorySupplier, InventorySupplierDetail } from "@/types/inventory";
import type { CustomerOrder, OrdersBySupplierResponse, StoreSupplyOrder } from "@/types/orders";
import { SupplierFormModal } from "@/components/panel/SupplierFormModal";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { RepairTableSkeleton } from "@/components/ui/Skeleton";
import { useStore } from "@/store";

type ActivityFilter = "all" | "active" | "inactive";

type SupplierOrdersAnalytics = {
  customer_order_count: number;
  store_supply_count: number;
  total_estimated_cost: string;
  customer_orders: CustomerOrder[];
  store_supply_orders: StoreSupplyOrder[];
};

type RecentSupplierOrder = {
  id: string;
  kind: "customer" | "store";
  title: string;
  statusLabel: string;
  quantity: number;
  amount: string;
  createdAt: string;
};

function normalizeWebsite(url: string | null | undefined): string | null {
  const raw = (url ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `https://${raw}`;
}

function websiteHost(url: string | null | undefined): string {
  const href = normalizeWebsite(url);
  if (!href) return "";
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
}

function toPln(value: string | number | null | undefined): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "-";
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 2 }).format(amount);
}

function toDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function compactAddress(s: InventorySupplier): string {
  const extra = s as Partial<Record<"street" | "postal_code" | "city" | "country", string | null | undefined>>;
  const detailParts = [extra.street, extra.postal_code, extra.city].filter(Boolean).join(", ");
  const country = (extra.country ?? "").trim();
  if (detailParts && country) return `${detailParts}, ${country}`;
  return detailParts || country || "Brak adresu";
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8ea2c8]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-[#7e8aa5]">{sub}</p> : null}
    </div>
  );
}

export default function AdminSuppliersPage() {
  const { token, user } = useAuth();
  const { addToast } = useStore();
  const isStaffOrAdmin = user?.role === "staff" || user?.role === "admin";
  const canUseOrdersAnalytics = user?.role === "admin";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyticsWarning, setAnalyticsWarning] = useState<string | null>(null);
  const [rows, setRows] = useState<InventorySupplierDetail[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [query, setQuery] = useState("");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const [ordersBySupplier, setOrdersBySupplier] = useState<Record<string, SupplierOrdersAnalytics>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<InventorySupplierDetail | null>(null);
  const [deletingSupplierId, setDeletingSupplierId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    setAnalyticsWarning(null);

    const [suppliersResult, analyticsResult] = await Promise.allSettled([
      fetchAllPages<InventorySupplierDetail>(`/inventory/suppliers/?ordering=name&page_size=200`, token),
      canUseOrdersAnalytics
        ? api.get<OrdersBySupplierResponse>(`/orders/by-supplier/`, token)
        : Promise.resolve(null),
    ]);

    if (suppliersResult.status === "fulfilled") {
      setRows(Array.isArray(suppliersResult.value) ? suppliersResult.value : []);
    } else {
      setRows([]);
      setOrdersBySupplier({});
      setError(suppliersResult.reason instanceof Error ? suppliersResult.reason.message : "Nie udało się pobrać hurtowni.");
      setLoading(false);
      return;
    }

    if (analyticsResult.status === "fulfilled" && analyticsResult.value && canUseOrdersAnalytics) {
      const analyticsMap: Record<string, SupplierOrdersAnalytics> = {};
      for (const row of analyticsResult.value?.by_supplier ?? []) {
        if (!row?.supplier?.id) continue;
        analyticsMap[String(row.supplier.id)] = {
          customer_order_count: row.customer_order_count ?? 0,
          store_supply_count: row.store_supply_count ?? 0,
          total_estimated_cost: row.total_estimated_cost ?? "0",
          customer_orders: Array.isArray(row.customer_orders) ? row.customer_orders : [],
          store_supply_orders: Array.isArray(row.store_supply_orders) ? row.store_supply_orders : [],
        };
      }
      setOrdersBySupplier(analyticsMap);
    } else {
      setOrdersBySupplier({});
      if (canUseOrdersAnalytics) {
        setAnalyticsWarning("Analityka zamówień jest chwilowo niedostępna. Dane hurtowni i CRUD działają poprawnie.");
      }
    }

    setLastUpdated(new Date());
    setLoading(false);
  }, [canUseOrdersAnalytics, token]);

  useEffect(() => {
    if (!token || !isStaffOrAdmin) return;
    void load();
  }, [token, isStaffOrAdmin, load]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((s) => {
        if (activityFilter === "active" && s.is_active === false) return false;
        if (activityFilter === "inactive" && s.is_active !== false) return false;
        if (!q) return true;
        const haystack = [s.name, s.email, s.phone, s.city, s.nip].map((v) => (v ?? "").toLowerCase()).join(" ");
        return haystack.includes(q);
      })
      .sort((a, b) => {
        const activeRank = (a.is_active === false ? 1 : 0) - (b.is_active === false ? 1 : 0);
        if (activeRank !== 0) return activeRank;
        return a.name.localeCompare(b.name, "pl");
      });
  }, [rows, query, activityFilter]);

  useEffect(() => {
    if (filteredRows.length === 0) {
      setSelectedSupplierId(null);
      return;
    }
    const exists = filteredRows.some((s) => s.id === selectedSupplierId);
    if (!exists) setSelectedSupplierId(filteredRows[0].id);
  }, [filteredRows, selectedSupplierId]);

  const selectedSupplier = useMemo(() => filteredRows.find((s) => s.id === selectedSupplierId) ?? null, [filteredRows, selectedSupplierId]);

  const selectedAnalytics = useMemo(() => {
    if (!selectedSupplier) return null;
    return ordersBySupplier[selectedSupplier.id] ?? null;
  }, [selectedSupplier, ordersBySupplier]);

  const selectedTotalOrders =
    (selectedAnalytics?.customer_order_count ?? 0) + (selectedAnalytics?.store_supply_count ?? 0);

  const recentOrders = useMemo<RecentSupplierOrder[]>(() => {
    if (!selectedAnalytics) return [];

    const customerRows: RecentSupplierOrder[] = selectedAnalytics.customer_orders.map((o) => ({
      id: `c-${o.id}`,
      kind: "customer",
      title: o.product_name_manual || o.product_name || "Pozycja klienta",
      statusLabel: o.status_display || o.status || "-",
      quantity: Number(o.quantity) || 0,
      amount: toPln((Number(o.purchase_price || 0) || 0) * (Number(o.quantity || 0) || 0)),
      createdAt: o.created_at,
    }));

    const storeRows: RecentSupplierOrder[] = selectedAnalytics.store_supply_orders.map((o) => ({
      id: `s-${o.id}`,
      kind: "store",
      title: o.product_name_manual || o.product_name || "Pozycja sklepu",
      statusLabel: o.status_display || o.status || "-",
      quantity: Number(o.quantity) || 0,
      amount: toPln((Number(o.estimated_cost || 0) || 0) * (Number(o.quantity || 0) || 0)),
      createdAt: o.created_at,
    }));

    return [...customerRows, ...storeRows]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [selectedAnalytics]);

  const pageStats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((s) => s.is_active !== false).length;
    const inactive = total - active;

    let allOrders = 0;
    for (const k of Object.keys(ordersBySupplier)) {
      const row = ordersBySupplier[k];
      allOrders += (row.customer_order_count ?? 0) + (row.store_supply_count ?? 0);
    }

    return { total, active, inactive, allOrders };
  }, [rows, ordersBySupplier]);

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

  const removeSupplier = async (supplier: InventorySupplierDetail) => {
    if (!token) return;
    const confirmed = window.confirm(
      `Usunąć hurtownię "${supplier.name}"?\n\nTo może się nie udać, jeśli hurtownia ma powiązane zamówienia.`,
    );
    if (!confirmed) return;

    setDeletingSupplierId(supplier.id);
    try {
      await api.delete(`/inventory/suppliers/${supplier.id}/`, token);
      addToast("Hurtownia została usunięta.", "success");
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się usunąć hurtowni.";
      addToast(msg, "error");
      setError(msg);
    } finally {
      setDeletingSupplierId(null);
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
    <main className="mx-auto min-h-screen max-w-[1450px] space-y-5 px-4 py-8">
      <header className="rounded-[2rem] border border-[#2b3550] bg-gradient-to-r from-[#0d1526] via-[#121d34] to-[#0d1628] p-5 shadow-[0_16px_50px_rgba(0,0,0,.35)]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9fb4de]">
              {user?.role === "admin" ? "Panel Admina" : "Panel Pracownika"}
            </p>
            <h1 className="mt-1.5 text-3xl font-semibold text-white">Hurtownie</h1>
            <p className="mt-1 text-sm text-[#98a8c8]">Profesjonalny panel zarządzania dostawcami z podglądem zamówień i szybkim CRUD.</p>
            <p className="mt-1 text-xs text-[#6f7fa1]">
              {lastUpdated ? `Ostatnia synchronizacja: ${toDateTime(lastUpdated.toISOString())}` : "Jeszcze nie zsynchronizowano"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
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
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#3b82f6]/50 bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,.35)] transition hover:brightness-110"
            >
              <Plus size={16} />
              Dodaj hurtownię
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Wszystkie hurtownie" value={pageStats.total} sub="pełna baza dostawców" />
          <StatCard label="Aktywne" value={pageStats.active} sub="dostępne do zamówień" />
          <StatCard label="Nieaktywne" value={pageStats.inactive} sub="wyłączone z obiegu" />
          <StatCard label="Zamówienia (łączny wolumen)" value={pageStats.allOrders} />
        </div>
      </header>

      {error && !modalOpen ? <ErrorState error={new Error(error)} onRetry={() => void load()} title="Błąd panelu hurtowni" /> : null}

      {analyticsWarning && !error ? (
        <div className="rounded-2xl border border-[#f59e0b]/35 bg-[#f59e0b]/10 p-3 text-sm text-[#fde68a]">
          {analyticsWarning}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-3xl border border-white/10 bg-[#0c0f18] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#8ea2c8]">Lista hurtowni</h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white">{filteredRows.length}</span>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <Search size={14} className="text-[#7f8ca6]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Szukaj po nazwie, NIP, mieście, e-mailu..."
                className="w-full bg-transparent text-white outline-none placeholder:text-[#60708f]"
              />
            </label>
            <div className="flex gap-1">
              {([
                ["all", "Wszystkie"],
                ["active", "Aktywne"],
                ["inactive", "Nieaktywne"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActivityFilter(key)}
                  className={`rounded-lg border px-2.5 py-2 text-xs font-semibold transition ${
                    activityFilter === key
                      ? "border-[#3b82f6]/40 bg-[#3b82f6]/18 text-[#bfdbfe]"
                      : "border-white/10 bg-white/5 text-[#9ca3af] hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 max-h-[72vh] space-y-2 overflow-auto pr-1">
            {loading ? (
              <RepairTableSkeleton rows={8} />
            ) : filteredRows.length === 0 ? (
              <EmptyState icon={EMPTY_STATES.parts.icon} title="Brak wyników" description="Zmień filtry albo dodaj nową hurtownię." />
            ) : (
              filteredRows.map((s) => {
                const selected = selectedSupplierId === s.id;
                const analytics = ordersBySupplier[s.id];
                const orderCount = (analytics?.customer_order_count ?? 0) + (analytics?.store_supply_count ?? 0);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSupplierId(s.id)}
                    className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                      selected ? "border-[#3b82f6]/40 bg-[#3b82f6]/12" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{s.name}</p>
                        <p className="mt-0.5 text-[11px] text-[#8ea2c8]">{s.city || "Brak miasta"}</p>
                      </div>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          s.is_active !== false
                            ? "border-[#22c55e]/35 bg-[#22c55e]/12 text-[#86efac]"
                            : "border-[#ef4444]/35 bg-[#ef4444]/12 text-[#fca5a5]"
                        }`}
                      >
                        {s.is_active !== false ? "aktywna" : "nieaktywna"}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
                      <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[#9ca3af]">
                        Zamówienia: <span className="font-semibold text-white">{orderCount}</span>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[#9ca3af]">
                        Dostawa: <span className="font-semibold text-white">{s.average_delivery_days ? `${s.average_delivery_days} dni` : "-"}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0c0f18] p-4">
          {!selectedSupplier ? (
            <EmptyState icon="🏭" title="Wybierz hurtownię" description="Po lewej stronie wybierz dostawcę, aby zobaczyć szczegóły i historię zamówień." />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8ea2c8]">Szczegóły hurtowni</p>
                  <h3 className="mt-1 truncate text-xl font-semibold text-white">{selectedSupplier.name}</h3>
                  <p className="mt-0.5 text-xs text-[#9ca3af]">{compactAddress(selectedSupplier)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void openEdit(selectedSupplier)}
                    className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#93c5fd] transition hover:bg-white/10"
                  >
                    <Pencil size={13} />
                    Edytuj
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeSupplier(selectedSupplier)}
                    disabled={deletingSupplierId === selectedSupplier.id}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/12 px-3 py-1.5 text-xs font-semibold text-[#fecaca] transition hover:bg-[#ef4444]/20 disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                    {deletingSupplierId === selectedSupplier.id ? "Usuwam..." : "Usuń"}
                  </button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <InfoLine icon={<Phone size={13} />} label="Telefon" value={selectedSupplier.phone || "Brak"} href={selectedSupplier.phone ? `tel:${selectedSupplier.phone.replace(/\s/g, "")}` : undefined} />
                <InfoLine icon={<Mail size={13} />} label="E-mail" value={selectedSupplier.email || "Brak"} href={selectedSupplier.email ? `mailto:${selectedSupplier.email}` : undefined} />
                <InfoLine icon={<Building2 size={13} />} label="NIP" value={selectedSupplier.nip || "Brak"} />
                <InfoLine icon={<MapPin size={13} />} label="Adres" value={compactAddress(selectedSupplier)} />
                <InfoLine
                  icon={<ExternalLink size={13} />}
                  label="WWW"
                  value={websiteHost(selectedSupplier.website_url) || "Brak"}
                  href={normalizeWebsite(selectedSupplier.website_url) ?? undefined}
                />
                <InfoLine
                  icon={<CalendarClock size={13} />}
                  label="Śr. czas dostawy"
                  value={selectedSupplier.average_delivery_days ? `${selectedSupplier.average_delivery_days} dni` : "Brak danych"}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <MetricBox
                  label="Zamówienia łącznie"
                  value={selectedTotalOrders}
                  tone="border-[#3b82f6]/30 bg-[#3b82f6]/10 text-[#bfdbfe]"
                />
                <MetricBox
                  label="Łączna wartość"
                  value={toPln(selectedAnalytics?.total_estimated_cost ?? 0)}
                  tone="border-[#22c55e]/30 bg-[#22c55e]/10 text-[#bbf7d0]"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-white">Ostatnie zamówienia</h4>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-[#9ca3af]">
                    {recentOrders.length}
                  </span>
                </div>

                {recentOrders.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-[#7e8aa5]">
                    Brak historii zamówień dla tej hurtowni.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentOrders.map((o) => (
                      <div key={o.id} className="rounded-xl border border-white/10 bg-[#0f1320] px-3 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{o.title}</p>
                            <p className="text-[11px] text-[#8ea2c8]">
                              <ShoppingCart size={11} className="mr-1 inline-block" />
                              {o.kind === "customer" ? "Zamówienie klienta" : "Zaopatrzenie sklepu"}
                              <span className="mx-1">•</span>
                              {o.statusLabel}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-white">{o.amount}</p>
                            <p className="text-[11px] text-[#7e8aa5]">qty: {o.quantity}</p>
                          </div>
                        </div>
                        <p className="mt-1 text-[11px] text-[#6f7fa1]">{toDateTime(o.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

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

function MetricBox({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className={`rounded-xl border px-3 py-2 ${tone}`}>
      <p className="text-[11px] uppercase tracking-[0.12em]">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function InfoLine({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = href ? (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined} className="truncate text-[#d1d5db] hover:text-white">
      {value}
    </a>
  ) : (
    <span className="truncate text-[#d1d5db]">{value}</span>
  );

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
      <p className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-[0.12em] text-[#7e8aa5]">
        {icon}
        {label}
      </p>
      {content}
    </div>
  );
}
