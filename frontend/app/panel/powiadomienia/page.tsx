"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import type { RepairRequestListItem } from "@/types/repairs";
import type { RequiresActionResponse, StaffNotificationItem, StaffNotificationPriorityValue, StaffNotificationStatusValue } from "@/types/notifications";

type TabKey = "all" | "requires_action";

const PRIORITY_OPTIONS: Array<{ value: StaffNotificationPriorityValue | string; label: string }> = [
  { value: "urgent", label: "Pilne" },
  { value: "important", label: "Ważne" },
  { value: "standard", label: "Standard" },
  { value: "low", label: "Niski" },
];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pl-PL");
}

function priorityBadgeClass(priority: string) {
  const p = (priority ?? "").toLowerCase();
  if (p === "urgent") return "border-[#dc1e1e]/35 bg-[#dc1e1e]/15 text-[#ffb4b4]";
  if (p === "important") return "border-[#f59e0b]/35 bg-[#f59e0b]/15 text-[#ffe3b0]";
  if (p === "low") return "border-white/10 bg-white/5 text-[#9ca3af]";
  return "border-[#3b82f6]/35 bg-[#3b82f6]/15 text-[#bcd6ff]";
}

function statusBadgeClass(status: string) {
  const s = (status ?? "").toLowerCase();
  if (s === "unread") return "border-[#dc1e1e]/35 bg-[#dc1e1e]/15 text-[#ffb4b4]";
  if (s === "read") return "border-[#22c55e]/35 bg-[#22c55e]/15 text-[#bbf7d0]";
  if (s === "archived") return "border-white/10 bg-white/5 text-[#9ca3af]";
  return "border-white/10 bg-white/5 text-[#9ca3af]";
}

export default function NotificationsPage() {
  const { token, user } = useAuth();
  const isAdminOrStaff = user?.role === "admin" || user?.role === "staff";

  const [tab, setTab] = useState<TabKey>("all");

  const [items, setItems] = useState<StaffNotificationItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);

  const [requiresAction, setRequiresAction] = useState<RepairRequestListItem[]>([]);
  const [requiresLoading, setRequiresLoading] = useState(false);
  const [requiresError, setRequiresError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StaffNotificationStatusValue | "">("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  const [search, setSearch] = useState("");

  const loadAll = async () => {
    if (!token) return;
    setItemsLoading(true);
    setItemsError(null);
    try {
      const qs: string[] = [];
      if (statusFilter) qs.push(`status=${encodeURIComponent(statusFilter)}`);
      if (priorityFilter) qs.push(`priority=${encodeURIComponent(priorityFilter)}`);
      if (typeFilter) qs.push(`type=${encodeURIComponent(typeFilter)}`);
      qs.push(`limit=50`);
      const res = await api.get<StaffNotificationItem[]>(`/accounts/notifications/${qs.length ? `?${qs.join("&")}` : ""}`, token);
      setItems(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać powiadomień.";
      setItemsError(msg);
    } finally {
      setItemsLoading(false);
    }
  };

  const loadRequiresAction = async () => {
    if (!token) return;
    setRequiresLoading(true);
    setRequiresError(null);
    try {
      const res = await api.get<RequiresActionResponse<RepairRequestListItem>>(`/accounts/notifications/requires-action/`, token);
      setRequiresAction(res.items);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać listy wymagań reakcji.";
      setRequiresError(msg);
    } finally {
      setRequiresLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !isAdminOrStaff) return;
    if (tab === "all") void loadAll();
    if (tab === "requires_action") void loadRequiresAction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tab, statusFilter, priorityFilter, typeFilter]);

  const filteredItems = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((n) => {
      const hay = `${n.title ?? ""} ${n.description ?? ""} ${n.repair_number ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [items, search]);

  const handlePatchStatus = async (id: string, next: StaffNotificationStatusValue) => {
    if (!token) return;
    try {
      await api.patch(`/accounts/notifications/${id}/`, { status: next }, token);
      if (tab === "all") await loadAll();
    } catch (e) {
      // keep it simple: show toast-like message through state
      const msg = e instanceof Error ? e.message : "Nie udało się zaktualizować powiadomienia.";
      setItemsError(msg);
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await api.post(`/accounts/notifications/mark-all-read/`, undefined, token);
      await loadAll();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się oznaczyć wszystkich jako przeczytane.";
      setItemsError(msg);
    }
  };

  if (!isAdminOrStaff) return null;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">{user?.role === "admin" ? "Panel Admina" : "Panel pracownika"} · Moduł</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Powiadomienia</h1>
        <p className="mt-1 text-sm text-[#9ca3af]">Lista powiadomień + kolejka „wymaga reakcji”.</p>
      </header>

      <div className="mb-5 rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTab("all")}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                tab === "all" ? "border-white/20 bg-white/10 text-white" : "border-white/10 bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white"
              }`}
            >
              Wszystkie
            </button>
            <button
              type="button"
              onClick={() => setTab("requires_action")}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                tab === "requires_action"
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white/10 bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white"
              }`}
            >
              Wymaga reakcji
            </button>
          </div>

          {tab === "all" ? (
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
            >
              Oznacz wszystkie jako przeczytane
            </button>
          ) : null}
        </div>
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj: tytuł / opis / numer naprawy…"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-[#6b7280]"
          />
        </div>

        {tab === "all" ? (
          <>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StaffNotificationStatusValue | "")}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <option value="">Wszystkie</option>
                <option value="unread">Nieprzeczytane</option>
                <option value="read">Przeczytane</option>
                <option value="archived">Zarchiwizowane</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Priorytet</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <option value="">Wszystkie</option>
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}
      </div>

      {tab === "all" ? (
        <>
          {itemsLoading ? (
            <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-6 text-sm text-[#9ca3af]">Ładowanie…</div>
          ) : itemsError ? (
            <p className="text-sm text-[#fca5a5]">{itemsError}</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-sm text-[#6b7280]">Brak powiadomień dla filtrów.</p>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((n) => {
                const repairLink = n.repair_id ? `/panel/repairs/${n.repair_id}` : null;
                return (
                  <div key={n.id} className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-[260px]">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Powiadomienie</p>
                        <p className="mt-1 text-lg font-semibold text-white">
                          {repairLink ? <Link href={repairLink}>{n.title}</Link> : n.title}
                        </p>
                        {n.repair_number ? (
                          <p className="mt-2 text-sm text-[#9ca3af]">
                            Naprawa: <span className="text-white font-semibold">{n.repair_number}</span>
                          </p>
                        ) : null}
                        {n.description ? <p className="mt-2 whitespace-pre-wrap text-sm text-[#e5e7eb]">{n.description}</p> : null}
                      </div>

                      <div className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${priorityBadgeClass(n.priority)}`}>{n.priority}</span>
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(n.status)}`}>{n.status}</span>
                        </div>
                        <p className="mt-3 text-xs text-[#9ca3af]">{formatDateTime(n.created_at)}</p>

                        <div className="mt-4 flex flex-wrap justify-end gap-2">
                          {n.status === "unread" ? (
                            <button
                              type="button"
                              onClick={() => void handlePatchStatus(n.id, "read")}
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
                            >
                              Oznacz przeczytane
                            </button>
                          ) : null}
                          {n.status !== "archived" ? (
                            <button
                              type="button"
                              onClick={() => void handlePatchStatus(n.id, "archived")}
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
                            >
                              Zarchiwizuj
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          {requiresLoading ? (
            <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-6 text-sm text-[#9ca3af]">Ładowanie…</div>
          ) : requiresError ? (
            <p className="text-sm text-[#fca5a5]">{requiresError}</p>
          ) : requiresAction.length === 0 ? (
            <p className="text-sm text-[#6b7280]">Brak pozycji do obsługi.</p>
          ) : (
            <div className="space-y-4">
              {requiresAction.map((r) => (
                <div key={r.id} className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-[260px]">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Naprawa</p>
                      <Link href={`/panel/repairs/${r.id}`} className="mt-1 block text-lg font-semibold text-white hover:underline">
                        {r.repair_number}
                      </Link>
                      <p className="mt-2 text-sm text-[#9ca3af]">
                        {r.client_name} · {r.device_name}
                      </p>
                      <p className="mt-2 text-sm text-[#9ca3af]">
                        Status: <span className="text-white font-semibold">{r.status_display}</span>
                      </p>
                      {typeof r.waiting_for_client_days === "number" ? (
                        <p className="mt-2 text-sm text-[#9ca3af]">
                          Czeka {r.waiting_for_client_days} dni na klienta
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${priorityBadgeClass(r.priority)}`}>{r.priority_display}</span>
                      <p className="mt-3 text-xs text-[#9ca3af]">{new Date(r.created_at).toLocaleString("pl-PL")}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

