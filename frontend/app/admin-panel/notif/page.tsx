"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
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
      "new_unassigned",
      "complaint",
    ].includes(t)
  ) {
    return "tasks";
  }
  return "system";
}

function iconMeta(notificationType: string): { emoji: string; className: string } {
  const t = (notificationType ?? "").toLowerCase();
  if (t === "new_unassigned") return { emoji: "👤", className: "bg-[#f59e0b]/15 text-[#ffe3b0] border border-[#f59e0b]/30" };
  if (t === "part_arrived") return { emoji: "📦", className: "bg-[#3b82f6]/15 text-[#bcd6ff] border border-[#3b82f6]/30" };
  if (t === "complaint") return { emoji: "🛡", className: "bg-[#8b5cf6]/15 text-[#ddd6fe] border border-[#8b5cf6]/30" };
  if (t === "new_message" || t === "client_message") return { emoji: "💬", className: "bg-[#dc1e1e]/15 text-[#ffb4b4] border border-[#dc1e1e]/30" };
  if (t === "quote_accepted") return { emoji: "✅", className: "bg-[#f59e0b]/15 text-[#ffe3b0] border border-[#f59e0b]/30" };
  if (t === "sla_warning" || t === "sla_exceeded") return { emoji: "⏰", className: "bg-[#dc1e1e]/15 text-[#ffb4b4] border border-[#dc1e1e]/30" };
  if (t === "repair_assigned") return { emoji: "👤", className: "bg-[#3b82f6]/15 text-[#bcd6ff] border border-[#3b82f6]/30" };
  if (t === "status_changed") return { emoji: "🔄", className: "bg-white/10 text-[#d1d5db] border border-white/20" };
  return { emoji: "🔔", className: "bg-white/10 text-[#d1d5db] border border-white/20" };
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

export default function AdminNotifPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAdmin = user?.role === "admin";

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
    if (!token || !isAdmin) return;
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

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

  const patchStatus = async (id: string, next: "read" | "archived") => {
    if (!token) return;
    try {
      await api.patch(`/accounts/notifications/${id}/`, { status: next }, token);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Nie udało się zaktualizować powiadomienia."));
    }
  };

  const handleOpen = async (notification: StaffNotificationItem) => {
    setItems((prev) => prev.map((n) => (n.id === notification.id ? { ...n, status: "read" } : n)));
    if ((notification.status ?? "").toLowerCase() === "unread") {
      await patchStatus(notification.id, "read");
    }
    if (notification.repair_id) router.push(`/admin-panel/repairs/${notification.repair_id}`);
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await api.post(`/accounts/notifications/mark-all-read/`, undefined, token);
      setItems((prev) => prev.map((n) => ({ ...n, status: "read" })));
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Nie udało się oznaczyć wszystkich jako przeczytane."));
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
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Panel Admina</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Powiadomienia</h1>
      </header>

      <div className="mb-5 rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilterParam(f.key)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  filter === f.key
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-white/10 bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void handleMarkAllRead()}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
          >
            Oznacz wszystkie
          </button>
        </div>
      </div>

      {loading ? <NotificationFeedSkeleton rows={7} /> : null}
      {error && !loading ? (
        <div className="mb-4">
          <ErrorState error={error} onRetry={() => void loadAll()} title="Nie udało się załadować powiadomień" />
        </div>
      ) : null}

      {!loading && !error && filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#0c0d12] py-6">
          <EmptyState icon={EMPTY_STATES.notifications.icon} title={EMPTY_STATES.notifications.title} description={EMPTY_STATES.notifications.description} />
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
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">{label}</h2>
                <div className="space-y-2">
                  {grouped[bucket].map((n) => {
                    const isUnread = (n.status ?? "").toLowerCase() === "unread";
                    const icon = iconMeta(n.notification_type);
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => void handleOpen(n)}
                        className="relative flex w-full items-start justify-between gap-3 rounded-2xl border border-white/10 bg-[#0c0d12] p-4 text-left transition hover:border-white/20 hover:bg-[#101118]"
                      >
                        {isUnread ? <span className="absolute left-2 top-1/2 h-[5px] w-[5px] -translate-y-1/2 rounded-full bg-[#dc1e1e]" aria-hidden /> : null}
                        <div className="flex min-w-0 items-start gap-3 pl-2">
                          <span className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg text-sm ${icon.className}`}>{icon.emoji}</span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{n.title}</p>
                            {n.description ? <p className="mt-0.5 line-clamp-2 text-xs text-[#9ca3af]">{n.description}</p> : null}
                          </div>
                        </div>
                        <div className="shrink-0 text-xs text-[#9ca3af]">{relativeTime(n.created_at)}</div>
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

