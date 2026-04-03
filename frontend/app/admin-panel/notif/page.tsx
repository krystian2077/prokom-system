"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { NotificationFeedSkeleton } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Select";
import type { StaffNotificationItem } from "@/types/notifications";

type FilterKey = "all" | "unread" | "parts" | "messages" | "tasks" | "system";
type PriorityFilter = "all" | "low" | "standard" | "important" | "urgent";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Wszystkie" },
  { key: "unread", label: "Nieprzeczytane" },
  { key: "parts", label: "Czesci" },
  { key: "messages", label: "Wiadomosci" },
  { key: "tasks", label: "Zadania" },
  { key: "system", label: "System" },
];

const PRIORITIES: Array<{ key: PriorityFilter; label: string }> = [
  { key: "all", label: "Priorytet: wszystkie" },
  { key: "low", label: "Niski" },
  { key: "standard", label: "Standard" },
  { key: "important", label: "Wazny" },
  { key: "urgent", label: "Pilny" },
];

type AdminNotificationsResponse = {
  count: number;
  results: StaffNotificationItem[];
};

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
  if (Number.isNaN(d.getTime())) return "-";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} godz`;
  const dayDiff = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000);
  if (dayDiff === 1) return "wczoraj";
  return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function priorityBadge(priority: string): string {
  switch ((priority ?? "").toLowerCase()) {
    case "urgent":
      return "border-red-500/40 bg-red-500/15 text-red-200";
    case "important":
      return "border-amber-500/40 bg-amber-500/15 text-amber-200";
    case "low":
      return "border-emerald-500/40 bg-emerald-500/15 text-emerald-200";
    default:
      return "border-white/15 bg-white/5 text-[#c8d2e9]";
  }
}

export default function AdminNotifPage() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAdmin = user?.role === "admin";

  const filter = useMemo<FilterKey>(() => {
    const f = searchParams.get("filter");
    return FILTERS.some((x) => x.key === f) ? (f as FilterKey) : "all";
  }, [searchParams]);

  const priority = useMemo<PriorityFilter>(() => {
    const p = searchParams.get("priority");
    return PRIORITIES.some((x) => x.key === p) ? (p as PriorityFilter) : "all";
  }, [searchParams]);

  const selectedUser = useMemo(() => searchParams.get("user") ?? "", [searchParams]);
  const searchPhrase = useMemo(() => searchParams.get("q") ?? "", [searchParams]);

  const setParam = useCallback(
    (next: Record<string, string>) => {
      const p = new URLSearchParams(searchParams.toString());
      Object.entries(next).forEach(([key, value]) => {
        if (!value || value === "all") p.delete(key);
        else p.set(key, value);
      });
      const q = p.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const [items, setItems] = useState<StaffNotificationItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadAll = useCallback(async () => {
    if (!token || !isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams();
      p.set("limit", "500");
      if (filter === "unread") p.set("status", "unread");
      if (priority !== "all") p.set("priority", priority);
      if (selectedUser) p.set("user_id", selectedUser);
      if (searchPhrase.trim()) p.set("q", searchPhrase.trim());
      const res = await api.get<AdminNotificationsResponse>(`/accounts/notifications/admin/?${p.toString()}`, token);
      setItems(res?.results ?? []);
      setTotalCount(res?.count ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Nie udalo sie pobrac powiadomien."));
    } finally {
      setLoading(false);
    }
  }, [filter, isAdmin, priority, searchPhrase, selectedUser, token]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const users = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    items.forEach((n) => {
      if (!n.user_id) return;
      const name = n.user_name || n.user_email || "Pracownik";
      map.set(n.user_id, { id: n.user_id, name });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "pl"));
  }, [items]);

  const unreadCount = useMemo(() => items.filter((n) => (n.status ?? "").toLowerCase() === "unread").length, [items]);
  const urgentCount = useMemo(() => items.filter((n) => (n.priority ?? "").toLowerCase() === "urgent").length, [items]);
  const filteredItems = useMemo(
    () =>
      items.filter((n) => {
        if (filter === "all") return true;
        if (filter === "unread") return (n.status ?? "").toLowerCase() === "unread";
        return typeGroup(n.notification_type) === filter;
      }),
    [filter, items],
  );

  const handleMarkAllRead = async () => {
    if (!token || !isAdmin) return;
    try {
      await api.post(`/accounts/notifications/admin/mark-all-read/`, selectedUser ? { user_id: selectedUser } : undefined, token);
      void queryClient.invalidateQueries({ queryKey: ["sidebar", "notif-unread-count", "admin"] });
      void queryClient.invalidateQueries({ queryKey: ["topbar", "notif", "unread-count"] });
      void loadAll();
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Nie udalo sie oznaczyc wszystkich jako przeczytane."));
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
    <main className="mx-auto min-h-screen max-w-[1550px] px-4 py-8">
      <header className="mb-6 rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,.18),transparent_42%),linear-gradient(135deg,#0d1119,#10182a_55%,#0a0f1a)] p-6 shadow-[0_24px_70px_rgba(0,0,0,.38)]">
        <p className="text-xs uppercase tracking-[0.22em] text-[#94a3b8]">Panel Admina · centrum reakcji</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Globalne powiadomienia</h1>
        <p className="mt-1 max-w-3xl text-sm text-[#9fb0c8]">Elegancki, operacyjny feed: alerty, wiadomości i zadania z zespołu w jednym miejscu.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02))] px-4 py-4 shadow-[0_12px_28px_rgba(0,0,0,.18)]">
            <p className="text-[11px] uppercase tracking-[0.15em] text-[#9fb1d3]">Wyniki</p>
            <p className="mt-1 text-2xl font-semibold text-white">{items.length}</p>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02))] px-4 py-4 shadow-[0_12px_28px_rgba(0,0,0,.18)]">
            <p className="text-[11px] uppercase tracking-[0.15em] text-[#9fb1d3]">Nieprzeczytane</p>
            <p className="mt-1 text-2xl font-semibold text-[#fca5a5]">{unreadCount}</p>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02))] px-4 py-4 shadow-[0_12px_28px_rgba(0,0,0,.18)]">
            <p className="text-[11px] uppercase tracking-[0.15em] text-[#9fb1d3]">Pilne</p>
            <p className="mt-1 text-2xl font-semibold text-[#fcd34d]">{urgentCount}</p>
          </div>
        </div>
      </header>

      <section className="mb-5 rounded-[28px] border border-white/10 bg-[#0d1119] p-4 shadow-[0_18px_50px_rgba(0,0,0,.28)] backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setParam({ filter: f.key })}
                className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition duration-200 ${
                  filter === f.key
                    ? "border-[rgba(59,130,246,.42)] bg-[rgba(59,130,246,.14)] text-[#dbeafe] shadow-[0_12px_24px_rgba(59,130,246,.12)]"
                    : "border-white/10 bg-white/[0.03] text-[#a7b6d2] hover:-translate-y-0.5 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_1fr_220px_auto]">
          <input
            value={searchPhrase}
            onChange={(e) => setParam({ q: e.target.value })}
            placeholder="Szukaj po tytule, opisie, e-mailu..."
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-[#7f8da8] outline-none transition hover:border-white/20 focus:border-[#4f69a3] focus:ring-4 focus:ring-[rgba(79,105,163,.16)]"
          />
          <Select
            className="w-full"
            label="Pracownik"
            value={selectedUser}
            placeholder="Wszyscy pracownicy"
            onChange={(e) => setParam({ user: e.target.value })}
            options={users.map((u) => ({ value: u.id, label: u.name }))}
          />
          <Select
            className="w-full"
            label="Priorytet"
            value={priority === "all" ? "" : priority}
            placeholder="Wszystkie priorytety"
            onChange={(e) => setParam({ priority: e.target.value })}
            options={PRIORITIES.filter((p) => p.key !== "all").map((p) => ({ value: p.key, label: p.label }))}
          />
          <button
            type="button"
            onClick={() => void handleMarkAllRead()}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-[#b8c7e2] transition hover:-translate-y-0.5 hover:bg-white/[0.12] hover:text-white"
          >
            Oznacz wszystkie
          </button>
        </div>
      </section>

      {loading ? <NotificationFeedSkeleton rows={7} /> : null}
      {error && !loading ? (
        <div className="mb-4">
          <ErrorState error={error} onRetry={() => void loadAll()} title="Nie udało się załadować powiadomień" />
        </div>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#0c0f18] py-8">
          <EmptyState
            icon={EMPTY_STATES.notifications.icon}
            title="Brak powiadomien"
            description="W tym zakresie nie ma jeszcze zadnych wpisow."
          />
        </div>
      ) : null}

      {!loading && !error && items.length > 0 && filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#0c0f18] py-8">
          <EmptyState
            icon={EMPTY_STATES.search.icon}
            title="Brak powiadomien w tym filtrze"
            description="Zmien filtr lub wyczysc wyszukiwanie, aby zobaczyc wszystkie wpisy."
          />
        </div>
      ) : null}

      {!loading && !error && filteredItems.length > 0 ? (
        <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,#0d1119,#0b1020)] p-4 shadow-[0_22px_60px_rgba(0,0,0,.36)]">
          <div className="mb-4 flex items-center justify-between px-1">
            <p className="text-sm text-[#9fb1d3]">
              Pokazuje <span className="font-semibold text-white">{filteredItems.length}</span> z {totalCount}
            </p>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#8194bb]">Kliknij, aby zobaczyc szczegoly</p>
          </div>
          <div className="space-y-3">
            {filteredItems.map((n) => {
              const icon = iconMeta(n.notification_type);
              const isUnread = (n.status ?? "").toLowerCase() === "unread";
              const owner = n.user_name || n.user_email || "Pracownik";
              return (
                <Link
                  key={n.id}
                  href={`/admin-panel/notif/${n.id}`}
                  className="group relative flex items-start justify-between gap-4 overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.015))] p-4 transition duration-200 hover:-translate-y-1 hover:border-[rgba(59,130,246,.35)] hover:shadow-[0_18px_42px_rgba(0,0,0,.24)] hover:bg-white/[0.045]"
                >
                  <span className={`absolute left-0 top-0 h-full w-[4px] ${isUnread ? "bg-[#ef4444]" : "bg-[rgba(59,130,246,.35)]"}`} aria-hidden />
                  {isUnread ? <span className="absolute left-2 top-1/2 h-[6px] w-[6px] -translate-y-1/2 rounded-full bg-[#ef4444]" aria-hidden /> : null}
                  <div className="flex min-w-0 items-start gap-3 pl-2">
                    <span className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-2xl text-sm shadow-[0_12px_26px_rgba(0,0,0,.18)] ${icon.className}`}>{icon.emoji}</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-[15px] font-semibold tracking-[-0.01em] text-white group-hover:text-[#eaf2ff]">{n.title}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${priorityBadge(n.priority ?? "standard")}`}>
                          {n.priority || "standard"}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#9fb1d3] group-hover:text-[#b9c8e3]">{n.description || "Bez opisu"}</p>
                      <div className="mt-2 space-y-1 text-xs text-[#7f8fb0]">
                        <p>
                          <span className="font-semibold text-[#b9c8e3]">Pracownik:</span> {owner}
                        </p>
                        {n.repair_number ? (
                          <p>
                            <span className="font-semibold text-[#b9c8e3]">Naprawa:</span> {n.repair_number}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-[#8ea2c7]">{relativeTime(n.created_at)}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#7487ac] transition group-hover:text-[#c7d5f3]">Szczegoly -&gt;</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </main>
  );
}

