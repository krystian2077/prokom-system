"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkerStore } from "@/stores/workerStore";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { NotificationFeedSkeleton } from "@/components/ui/Skeleton";
import type { StaffNotificationItem } from "@/types/notifications";

type FilterKey = "all" | "unread" | "parts" | "messages" | "tasks" | "system";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Wszystkie" },
  { key: "unread", label: "Nieprzeczytane" },
  { key: "parts", label: "Części" },
  { key: "messages", label: "Wiadomości" },
  { key: "tasks", label: "Zadania" },
  { key: "system", label: "System" },
];

function typeGroup(notificationType: string): Exclude<FilterKey, "all" | "unread"> {
  const t = (notificationType ?? "").toLowerCase();
  if (["part_arrived"].includes(t)) return "parts";
  if (["client_message", "new_message", "note_added", "mentioned"].includes(t)) return "messages";
  if (
    [
      "repair_assigned",
      "quote_accepted",
      "quote_rejected",
      "repair_due_soon",
      "sla_exceeded",
      "complaint_warranty_assigned",
      "complaint_warranty_awaiting_decision",
      "quick_accept_incomplete",
      "unassigned_queue_note",
    ].includes(t)
  ) {
    return "tasks";
  }
  return "system";
}

function iconMeta(notificationType: string): { emoji: string; className: string } {
  const t = (notificationType ?? "").toLowerCase();
  if (t === "part_arrived") return { emoji: "📦", className: "bg-[var(--gl)] text-[var(--green)] border border-[var(--gb)]" };
  if (t === "new_message" || t === "client_message") return { emoji: "💬", className: "bg-[#dc1e1e]/15 text-[#ffb4b4] border border-[#dc1e1e]/30" };
  if (t === "quote_accepted") return { emoji: "✅", className: "bg-[#f59e0b]/15 text-[#ffe3b0] border border-[#f59e0b]/30" };
  if (t === "sla_warning" || t === "sla_exceeded") return { emoji: "⏰", className: "bg-[#dc1e1e]/15 text-[#ffb4b4] border border-[#dc1e1e]/30" };
  if (t === "repair_assigned") return { emoji: "👤", className: "bg-[#3b82f6]/15 text-[#bcd6ff] border border-[#3b82f6]/30" };
  if (t === "unassigned_queue_note") return { emoji: "⏳", className: "bg-[#f59e0b]/15 text-[#ffe3b0] border border-[#f59e0b]/30" };
  if (t === "status_changed") return { emoji: "🔄", className: "bg-[var(--row-active)] text-[#d1d5db] border border-white/20" };
  return { emoji: "🔔", className: "bg-[var(--row-active)] text-[#d1d5db] border border-white/20" };
}

function relativeTime(createdAt: string): string {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} godz`;
  const dayDiff = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000);
  if (dayDiff === 1) return "wczoraj";
  return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" });
}

function dayBucket(createdAt: string): "today" | "yesterday" | "older" {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return "older";
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const delta = Math.floor((startToday - startDay) / 86400000);
  if (delta <= 0) return "today";
  if (delta === 1) return "yesterday";
  return "older";
}

export default function NotificationsPage() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAdminOrStaff = user?.role === "admin" || user?.role === "staff";
  const showToast = useWorkerStore((s) => s.addToast);

  const filter = useMemo<FilterKey>(() => {
    const f = searchParams.get("filter");
    return FILTERS.some((x) => x.key === f) ? (f as FilterKey) : "all";
  }, [searchParams]);

  const setFilterParam = useCallback(
    (key: FilterKey) => {
      const p = new URLSearchParams(searchParams.toString());
      if (key === "all") p.delete("filter");
      else p.set("filter", key);
      const q = p.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const [items, setItems] = useState<StaffNotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadAll = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<StaffNotificationItem[] | { results?: StaffNotificationItem[] }>(
        `/accounts/notifications/?limit=100`,
        token,
      );
      setItems(Array.isArray(res) ? res : res?.results ?? []);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Nie udało się pobrać powiadomień."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !isAdminOrStaff) return;
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdminOrStaff]);

  const filteredItems = useMemo(
    () =>
      items.filter((n) => {
        if (filter === "all") return true;
        if (filter === "unread") return (n.status ?? "").toLowerCase() === "unread";
        return typeGroup(n.notification_type) === filter;
      }),
    [items, filter],
  );

  const grouped = useMemo(() => {
    const g = { today: [] as StaffNotificationItem[], yesterday: [] as StaffNotificationItem[], older: [] as StaffNotificationItem[] };
    filteredItems.forEach((item) => {
      g[dayBucket(item.created_at)].push(item);
    });
    return g;
  }, [filteredItems]);

  const invalidateNotifUnreadBadges = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["sidebar", "notif-unread-count"] });
    void queryClient.invalidateQueries({ queryKey: ["topbar", "notif", "unread-count"] });
  }, [queryClient]);

  const patchStatus = async (id: string, next: "read" | "archived"): Promise<boolean> => {
    if (!token) return false;
    try {
      await api.patch(`/accounts/notifications/${id}/`, { status: next }, token);
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się zaktualizować powiadomienia.";
      showToast(msg, "error");
      return false;
    }
  };

  const handleOpen = async (notification: StaffNotificationItem) => {
    const snapshot = items;
    const wasUnread = (notification.status ?? "").toLowerCase() === "unread";

    setItems((prev) => prev.map((n) => (n.id === notification.id ? { ...n, status: "read" } : n)));

    if (wasUnread) {
      const ok = await patchStatus(notification.id, "read");
      if (!ok) {
        setItems(snapshot);
        return;
      }
      invalidateNotifUnreadBadges();
    }

    if (notification.repair_id) {
      const rid = encodeURIComponent(notification.repair_id);
      const href =
        user?.role === "admin" ? `/admin-panel/repairs/${rid}` : `/panel/naprawy/${rid}`;
      router.push(href);
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    const snapshot = items;
    setItems((prev) => prev.map((n) => ({ ...n, status: "read" })));
    try {
      await api.post(`/accounts/notifications/mark-all-read/`, undefined, token);
      invalidateNotifUnreadBadges();
      showToast("Wszystkie oznaczone jako przeczytane.", "success");
    } catch (e) {
      setItems(snapshot);
      const msg = e instanceof Error ? e.message : "Nie udało się oznaczyć wszystkich jako przeczytane.";
      setError(new Error(msg));
      showToast(msg, "error");
    }
  };

  if (!isAdminOrStaff) return null;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="mt-2 text-2xl font-semibold text-[var(--white)]">Powiadomienia</h1>
        <p className="mt-1 text-sm text-[var(--ink2)]">Centrum powiadomień pracownika</p>
      </header>

      <div className="mb-5 rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilterParam(f.key)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  filter === f.key ? "border-white/20 bg-[var(--row-active)] text-[var(--white)]" : "border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)] hover:bg-[var(--row-active)] hover:text-[var(--white)]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void handleMarkAllRead()}
            className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
          >
            Oznacz wszystkie
          </button>
        </div>
      </div>

      {error && !loading ? (
        <div className="mb-4">
          <ErrorState error={error} onRetry={() => void loadAll()} title="Nie udało się załadować powiadomień" />
        </div>
      ) : null}

      {loading ? <NotificationFeedSkeleton rows={7} /> : null}

      {!loading && !error && filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] py-6">
          <EmptyState
            icon={EMPTY_STATES.notifications.icon}
            title={filter === "all" ? EMPTY_STATES.notifications.title : "Brak powiadomień w tym filtrze"}
            description={
              filter === "all"
                ? EMPTY_STATES.notifications.description
                : "Zmień filtr lub sprawdź ponownie później."
            }
          />
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="space-y-7">
          {([
            ["today", "Dzisiaj"],
            ["yesterday", "Wczoraj"],
            ["older", "Wcześniejsze"],
          ] as const).map(([bucket, label]) =>
            grouped[bucket].length > 0 ? (
              <section key={bucket}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink2)]">{label}</h2>
                <div className="space-y-2">
                  {grouped[bucket].map((n) => {
                    const isUnread = (n.status ?? "").toLowerCase() === "unread";
                    const icon = iconMeta(n.notification_type);
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => void handleOpen(n)}
                        className="relative flex w-full items-start justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4 text-left transition hover:border-white/20 hover:bg-[#101118]"
                      >
                        {isUnread ? <span className="absolute left-2 top-1/2 h-[5px] w-[5px] -translate-y-1/2 rounded-full bg-[#dc1e1e]" aria-hidden /> : null}
                        <div className="flex min-w-0 items-start gap-3 pl-2">
                          <span className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg text-sm ${icon.className}`}>{icon.emoji}</span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--white)]">{n.title}</p>
                            {n.description ? <p className="mt-0.5 line-clamp-2 text-xs text-[var(--ink2)]">{n.description}</p> : null}
                          </div>
                        </div>
                        <div className="shrink-0 text-xs text-[var(--ink2)]">{relativeTime(n.created_at)}</div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null,
          )}
        </div>
      ) : null}
    </main>
  );
}

