"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton, StackedRowSkeleton, StatCardSkeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { usePanelBasePath } from "@/lib/panelPaths";
import { useAuth } from "@/contexts/AuthContext";
import type {
  CustomerOrder,
  OrdersBySupplierResponse,
  OrdersDashboardResponse,
  OrdersToOrderTodayResponse,
  StoreSupplyOrder,
} from "@/types/orders";

type OrdersTab = "dashboard" | "today" | "requires_action" | "by_supplier";

function formatDate(d: string | null | undefined) {
  if (!d) return "–";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString("pl-PL");
}

function formatMoney(v: string | null | undefined) {
  if (v === null || v === undefined || v === "") return "–";
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("pl-PL", { maximumFractionDigits: 2 });
}

function statusBadgeStyle(status: string, kind: "customer" | "supply") {
  const s = (status ?? "").toLowerCase();

  const doneSet = kind === "customer" ? ["picked_up", "ready_for_pickup"] : ["arrived", "restocked"];
  const cancelSet = ["cancelled"];
  const urgentSet = ["to_order"];

  if (cancelSet.includes(s)) return "border-[#dc1e1e]/35 bg-[#dc1e1e]/15 text-[#ffb4b4]";
  if (doneSet.includes(s)) return "border-[#22c55e]/35 bg-[#22c55e]/15 text-[#bbf7d0]";
  if (urgentSet.includes(s)) return "border-[#f59e0b]/35 bg-[#f59e0b]/15 text-[#ffe3b0]";
  return "border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)]";
}

function OrdersAdminPageInner() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tab = useMemo<OrdersTab>(() => {
    const t = searchParams.get("tab");
    if (t === "today" || t === "requires_action" || t === "by_supplier") return t;
    return "dashboard";
  }, [searchParams]);

  const setTab = (k: OrdersTab) => {
    const p = new URLSearchParams(searchParams.toString());
    if (k === "dashboard") p.delete("tab");
    else p.set("tab", k);
    const q = p.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  };

  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<OrdersDashboardResponse | null>(null);

  const [todayLoading, setTodayLoading] = useState(false);
  const [todayError, setTodayError] = useState<string | null>(null);
  const [todayData, setTodayData] = useState<OrdersToOrderTodayResponse | null>(null);

  const [requiresLoading, setRequiresLoading] = useState(false);
  const [requiresError, setRequiresError] = useState<string | null>(null);
  const [requiresAction, setRequiresAction] = useState<CustomerOrder[]>([]);

  const [bySupplierLoading, setBySupplierLoading] = useState(false);
  const [bySupplierError, setBySupplierError] = useState<string | null>(null);
  const [bySupplier, setBySupplier] = useState<OrdersBySupplierResponse | null>(null);

  const loadDashboard = async () => {
    if (!token) return;
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const res = await api.get<OrdersDashboardResponse>("/orders/dashboard/", token);
      setDashboard(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać dashboardu zamówień.";
      setDashboardError(msg);
    } finally {
      setDashboardLoading(false);
    }
  };

  const loadToday = async () => {
    if (!token) return;
    setTodayLoading(true);
    setTodayError(null);
    try {
      const res = await api.get<OrdersToOrderTodayResponse>("/orders/to-order-today/", token);
      setTodayData(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać list do zamówienia dziś.";
      setTodayError(msg);
    } finally {
      setTodayLoading(false);
    }
  };

  const loadRequiresAction = async () => {
    if (!token) return;
    setRequiresLoading(true);
    setRequiresError(null);
    try {
      const res = await api.get<CustomerOrder[]>("/orders/customer-orders/requires-action/", token);
      setRequiresAction(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać zamówień wymagających reakcji.";
      setRequiresError(msg);
    } finally {
      setRequiresLoading(false);
    }
  };

  const loadBySupplier = async () => {
    if (!token) return;
    setBySupplierLoading(true);
    setBySupplierError(null);
    try {
      const res = await api.get<OrdersBySupplierResponse>("/orders/by-supplier/", token);
      setBySupplier(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać zamówień po hurtowniach.";
      setBySupplierError(msg);
    } finally {
      setBySupplierLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    void loadDashboard();
    void loadToday();
    void loadRequiresAction();
    void loadBySupplier();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const refreshActive = async () => {
    if (!token) return;
    if (tab === "dashboard") return loadDashboard();
    if (tab === "today") return loadToday();
    if (tab === "requires_action") return loadRequiresAction();
    return loadBySupplier();
  };

  const tabLabel = useMemo(() => {
    switch (tab) {
      case "dashboard":
        return "Dashboard";
      case "today":
        return "Do zamówienia dziś";
      case "requires_action":
        return "Wymaga reakcji";
      case "by_supplier":
        return "Po hurtowniach";
      default:
        return "Dashboard";
    }
  }, [tab]);

  if (!isAdmin) return null;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink2)]">Panel Admina · Moduł</p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--white)]">Zamówienia i zaopatrzenie</h1>
        <p className="mt-1 text-sm text-[var(--ink2)]">Dashboard oraz listy zamówień do realizacji.</p>
      </header>

      <div className="mb-5 rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["dashboard", "Dashboard"],
                ["today", "Do zamówienia dziś"],
                ["requires_action", "Wymaga reakcji"],
                ["by_supplier", "Po hurtowniach"],
              ] as Array<[OrdersTab, string]>
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  tab === k ? "border-white/20 bg-[var(--row-active)] text-[var(--white)]" : "border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)] hover:bg-[var(--row-active)] hover:text-[var(--white)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void refreshActive()}
            className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
          >
            Odśwież
          </button>
        </div>
      </div>

      <section className="space-y-4">
        {tab === "dashboard" ? (
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
            {dashboardLoading ? (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                </div>
                <StackedRowSkeleton rows={4} />
              </div>
            ) : dashboardError ? (
              <ErrorState error={new Error(dashboardError)} onRetry={() => void loadDashboard()} title="Błąd dashboardu zamówień" />
            ) : !dashboard ? (
              <p className="text-sm text-[var(--muted)]">Brak danych.</p>
            ) : (
              <>
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--white)]">{tabLabel}</p>
                    <p className="mt-1 text-sm text-[var(--ink2)]">Kafelki statusów oraz kluczowe metryki.</p>
                  </div>
                  <div className="text-right text-xs text-[var(--ink2)]">
                    Profit: <span className="text-[var(--white)] font-semibold">{formatMoney(dashboard.total_profit)}</span>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <MetricCard label="Wymaga reakcji" value={dashboard.requires_action_count} />
                  <MetricCard label="Do zamówienia dziś" value={dashboard.to_order_today_count} />
                  <MetricCard label="Powiązane z naprawą" value={dashboard.linked_to_repair_count} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <StatusBreakdown
                    title="Zamówienia klientów"
                    byStatus={dashboard.customer_orders_by_status}
                    prefix="customer"
                  />
                  <StatusBreakdown
                    title="Zaopatrzenie sklepu"
                    byStatus={dashboard.store_supply_by_status}
                    prefix="supply"
                  />
                </div>

                <div className="mt-4">
                  <p className="text-sm text-[var(--ink2)]">
                    Nieodebrane: <span className="text-[var(--white)] font-semibold">{dashboard.uncollected_count}</span>
                  </p>
                </div>
              </>
            )}
          </div>
        ) : null}

        {tab === "today" ? (
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
            {todayLoading ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <StackedRowSkeleton rows={5} />
                <StackedRowSkeleton rows={5} />
              </div>
            ) : todayError ? (
              <ErrorState error={new Error(todayError)} onRetry={() => void loadToday()} title="Błąd listy „dziś”" />
            ) : !todayData ? (
              <p className="text-sm text-[var(--muted)]">Brak danych.</p>
            ) : (
              <>
                <p className="text-sm font-semibold text-[var(--white)]">{tabLabel}</p>
                <p className="mt-1 text-sm text-[var(--ink2)]">
                  Lista łączna: zamówienia klientów (do dnia) i braki sklepu.
                </p>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <OrdersSectionCustomer orders={todayData.customer_orders} />
                  <OrdersSectionSupply orders={todayData.store_supply_orders} />
                </div>
              </>
            )}
          </div>
        ) : null}

        {tab === "requires_action" ? (
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
            {requiresLoading ? (
              <StackedRowSkeleton rows={6} />
            ) : requiresError ? (
              <ErrorState error={new Error(requiresError)} onRetry={() => void loadRequiresAction()} title="Błąd listy wymagających reakcji" />
            ) : (
              <>
                <p className="text-sm font-semibold text-[var(--white)]">{tabLabel}</p>
                <p className="mt-1 text-sm text-[var(--ink2)]">Lista do powiadomienia klienta oraz przeterminowane zamówienia.</p>

                <div className="mt-4 space-y-3">
                  {requiresAction.length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">Brak pozycji.</p>
                  ) : (
                    requiresAction.map((o) => <OrderCardCustomer key={o.id} order={o} />)
                  )}
                </div>
              </>
            )}
          </div>
        ) : null}

        {tab === "by_supplier" ? (
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
            {bySupplierLoading ? (
              <StackedRowSkeleton rows={8} />
            ) : bySupplierError ? (
              <ErrorState error={new Error(bySupplierError)} onRetry={() => void loadBySupplier()} title="Błąd widoku hurtowni" />
            ) : !bySupplier ? (
              <p className="text-sm text-[var(--muted)]">Brak danych.</p>
            ) : (
              <>
                <p className="text-sm font-semibold text-[var(--white)]">{tabLabel}</p>
                <p className="mt-1 text-sm text-[var(--ink2)]">Grupowanie zamówień po hurtowniach.</p>

                <div className="mt-4 space-y-4">
                  {bySupplier.by_supplier.length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">Brak hurtowni w danych.</p>
                  ) : (
                    bySupplier.by_supplier.map((s) => (
                      <div key={s.supplier.id} className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[var(--white)]">{s.supplier.name}</p>
                            <p className="mt-1 text-sm text-[var(--ink2)]">
                              Klienci: <span className="text-[var(--white)] font-semibold">{s.customer_order_count}</span> · Sklep:{" "}
                              <span className="text-[var(--white)] font-semibold">{s.store_supply_count}</span>
                            </p>
                          </div>
                          <p className="text-sm text-[var(--ink2)]">
                            Est. koszt: <span className="text-[var(--white)] font-semibold">{formatMoney(s.total_estimated_cost)}</span>
                          </p>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="space-y-3">
                            <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink2)]">Klienckie</p>
                            {s.customer_orders.length === 0 ? (
                              <p className="text-sm text-[var(--muted)]">Brak</p>
                            ) : (
                              s.customer_orders.slice(0, 10).map((o) => <OrderCardCustomer key={o.id} order={o} compact />)
                            )}
                          </div>
                          <div className="space-y-3">
                            <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink2)]">Sklep</p>
                            {s.store_supply_orders.length === 0 ? (
                              <p className="text-sm text-[var(--muted)]">Brak</p>
                            ) : (
                              s.store_supply_orders.slice(0, 10).map((o) => <OrderCardSupply key={o.id} order={o} compact />)
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default function OrdersAdminPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
          <Skeleton className="mb-6 h-9 w-72" />
          <div className="mb-5 rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
            <Skeleton className="h-10 w-full max-w-md" />
          </div>
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
            <div className="mb-4 grid gap-3 md:grid-cols-3">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
            <StackedRowSkeleton rows={6} />
          </div>
        </main>
      }
    >
      <OrdersAdminPageInner />
    </Suspense>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--row-hover)] p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink2)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--white)]">{value}</p>
    </div>
  );
}

function StatusBreakdown({
  title,
  byStatus,
  prefix,
}: {
  title: string;
  byStatus: Record<string, number>;
  prefix: "customer" | "supply";
}) {
  const entries = Object.entries(byStatus).sort((a, b) => b[1] - a[1]);
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--row-hover)] p-4">
      <p className="text-sm font-semibold text-[var(--white)]">{title}</p>
      <div className="mt-3 space-y-2">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3">
            <span className="text-sm text-[var(--ink2)]">{k}</span>
            <span className="text-sm font-semibold text-[var(--white)]">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderCardCustomer({ order, compact }: { order: CustomerOrder; compact?: boolean }) {
  const panelPaths = usePanelBasePath();
  const marginPercent = order.margin_percent;
  const linkHref = order.related_repair ? panelPaths.repairDetailPath(order.related_repair) : null;

  return (
    <div className={`rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-3 ${compact ? "p-3" : "p-4"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-[220px]">
          <p className="text-sm font-semibold text-[var(--white)]">
            {linkHref ? <Link href={linkHref}>{order.product_name}</Link> : order.product_name}
          </p>
          <p className="mt-1 text-sm text-[var(--ink2)]">
            Ilość: <span className="text-[var(--white)] font-semibold">{order.quantity}</span>
          </p>
          {order.planned_order_date ? (
            <p className="mt-1 text-sm text-[var(--ink2)]">
              Plan: <span className="text-[var(--white)] font-semibold">{formatDate(order.planned_order_date)}</span>
            </p>
          ) : null}
          {order.expected_delivery_date ? (
            <p className="mt-1 text-sm text-[var(--ink2)]">
              Dotarcie: <span className="text-[var(--white)] font-semibold">{formatDate(order.expected_delivery_date)}</span>
            </p>
          ) : null}
        </div>

        <div className="text-right">
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeStyle(order.status, "customer")}`}
          >
            {order.status_display}
          </span>
          <p className="mt-2 text-xs text-[var(--ink2)]">
            Zysk:{" "}
            <span className="text-[var(--white)] font-semibold">
              {formatMoney(order.margin)}
            </span>
          </p>
          {marginPercent !== null && marginPercent !== undefined ? (
            <p className="mt-1 text-xs text-[var(--ink2)]">
              Marża%: <span className="text-[var(--white)] font-semibold">{marginPercent}%</span>
            </p>
          ) : null}
        </div>
      </div>

      {order.notes ? <p className="mt-3 whitespace-pre-wrap text-sm text-[#e5e7eb]">{order.notes}</p> : null}
    </div>
  );
}

function OrderCardSupply({ order, compact }: { order: StoreSupplyOrder; compact?: boolean }) {
  return (
    <div className={`rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-3 ${compact ? "p-3" : "p-4"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-[220px]">
          <p className="text-sm font-semibold text-[var(--white)]">{order.product_name}</p>
          <p className="mt-1 text-sm text-[var(--ink2)]">
            Ilość: <span className="text-[var(--white)] font-semibold">{order.quantity}</span>
          </p>
          <p className="mt-1 text-sm text-[var(--ink2)]">
            Priorytet: <span className="text-[var(--white)] font-semibold">{order.priority_display}</span>
          </p>
          <p className="mt-1 text-sm text-[var(--ink2)]">
            Koszt: <span className="text-[var(--white)] font-semibold">{formatMoney(order.estimated_cost ?? null)}</span>
          </p>
        </div>
        <div className="text-right">
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeStyle(order.status, "supply")}`}
          >
            {order.status_display}
          </span>
        </div>
      </div>
      {order.notes ? <p className="mt-3 whitespace-pre-wrap text-sm text-[#e5e7eb]">{order.notes}</p> : null}
    </div>
  );
}

function OrdersSectionCustomer({ orders }: { orders: CustomerOrder[] }) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--row-hover)] p-4">
      <p className="text-sm font-semibold text-[var(--white)]">Zamówienia klientów</p>
      <p className="mt-1 text-sm text-[var(--ink2)]">Max 100 pozycji z endpointu „do dziś”.</p>
      <div className="mt-4 space-y-3">
        {orders.length === 0 ? <p className="text-sm text-[var(--muted)]">Brak</p> : orders.slice(0, 30).map((o) => <OrderCardCustomer key={o.id} order={o} compact />)}
      </div>
    </div>
  );
}

function OrdersSectionSupply({ orders }: { orders: StoreSupplyOrder[] }) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--row-hover)] p-4">
      <p className="text-sm font-semibold text-[var(--white)]">Zaopatrzenie sklepu</p>
      <p className="mt-1 text-sm text-[var(--ink2)]">Max 100 pozycji z endpointu „do dziś”.</p>
      <div className="mt-4 space-y-3">
        {orders.length === 0 ? <p className="text-sm text-[var(--muted)]">Brak</p> : orders.slice(0, 30).map((o) => <OrderCardSupply key={o.id} order={o} compact />)}
      </div>
    </div>
  );
}

