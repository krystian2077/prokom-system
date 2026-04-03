"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { notificationPriorityLabel, notificationStatusLabel, notificationTypeLabel } from "@/lib/notificationLabels";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import type { StaffNotificationItem } from "@/types/notifications";

type NotificationStatus = "unread" | "read" | "archived";

function iconMeta(notificationType: string): { emoji: string; className: string } {
  const t = (notificationType ?? "").toLowerCase();
  if (t === "new_unassigned") return { emoji: "👤", className: "bg-[#f59e0b]/15 text-[#ffe3b0] border border-[#f59e0b]/30" };
  if (t === "part_arrived") return { emoji: "📦", className: "bg-[#3b82f6]/15 text-[#bcd6ff] border border-[#3b82f6]/30" };
  if (t === "complaint") return { emoji: "🛡", className: "bg-[#8b5cf6]/15 text-[#ddd6fe] border border-[#8b5cf6]/30" };
  if (t === "new_message" || t === "client_message") return { emoji: "💬", className: "bg-[#dc1e1e]/15 text-[#ffb4b4] border border-[#dc1e1e]/30" };
  if (t === "quote_accepted") return { emoji: "✅", className: "bg-[#f59e0b]/15 text-[#ffe3b0] border border-[#f59e0b]/30" };
  return { emoji: "🔔", className: "bg-white/10 text-[#d1d5db] border border-white/20" };
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminNotificationDetailsPage() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const isAdmin = user?.role === "admin";

  const [item, setItem] = useState<StaffNotificationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadDetails = useCallback(async () => {
    if (!token || !isAdmin || !id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<StaffNotificationItem>(`/accounts/notifications/admin/${id}/`, token);
      setItem(data ?? null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Nie udalo sie pobrac szczegolow powiadomienia."));
    } finally {
      setLoading(false);
    }
  }, [id, isAdmin, token]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  const updateStatus = async (nextStatus: NotificationStatus) => {
    if (!token || !item) return;
    setSaving(true);
    try {
      const updated = await api.patch<StaffNotificationItem>(`/accounts/notifications/admin/${item.id}/`, { status: nextStatus }, token);
      setItem(updated);
      void queryClient.invalidateQueries({ queryKey: ["sidebar", "notif-unread-count", "admin"] });
      void queryClient.invalidateQueries({ queryKey: ["topbar", "notif", "unread-count"] });
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Nie udalo sie zaktualizowac statusu powiadomienia."));
    } finally {
      setSaving(false);
    }
  };

  const detailRows = useMemo(
    () => [
      { label: "Pracownik", value: item?.user_name || item?.user_email || "-" },
      { label: "E-mail", value: item?.user_email || "-" },
      { label: "Typ", value: notificationTypeLabel(item?.notification_type) },
      { label: "Priorytet", value: notificationPriorityLabel(item?.priority) },
      { label: "Status", value: notificationStatusLabel(item?.status) },
      { label: "Data", value: item?.created_at ? formatDate(item.created_at) : "-" },
    ],
    [item],
  );

  if (!isAdmin) {
    return (
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-8">
        <p className="text-sm text-[#fca5a5]">Tylko administrator.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#93a6cb]">Panel Admina</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Szczegoly powiadomienia</h1>
        </div>
        <Link href="/admin-panel/notif" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-[#c4d2ec] transition hover:bg-white/[0.12] hover:text-white">
          Wroc do listy
        </Link>
      </header>

      {loading ? (
        <section className="rounded-3xl border border-[#2b3650] bg-[#0d1322]/90 p-5">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="mt-3 h-20 w-full" />
          <Skeleton className="mt-3 h-28 w-full" />
        </section>
      ) : null}

      {error && !loading ? (
        <div className="mb-4">
          <ErrorState error={error} onRetry={() => void loadDetails()} title="Nie udalo sie zaladowac powiadomienia" />
        </div>
      ) : null}

      {!loading && !error && item ? (
        <section className="rounded-3xl border border-[#2b3650] bg-gradient-to-b from-[#0d1424] to-[#0a0f1d] p-5 shadow-[0_16px_46px_rgba(0,0,0,.35)]">
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-xl text-base ${iconMeta(item.notification_type).className}`}>
              {iconMeta(item.notification_type).emoji}
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-white">{item.title}</h2>
              <p className="mt-1 text-sm text-[#9db0d5]">{item.description || "Brak opisu."}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {detailRows.map((row) => (
              <div key={row.label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#8194bb]">{row.label}</p>
                <p className="mt-1 text-sm font-medium text-[#e6eeff]">{row.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void updateStatus("read")}
              disabled={saving || item.status === "read"}
              className="rounded-xl border border-[#3b82f6]/40 bg-[#3b82f6]/15 px-4 py-2 text-sm font-semibold text-[#cfe0ff] transition hover:bg-[#3b82f6]/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Oznacz jako przeczytane
            </button>
            <button
              type="button"
              onClick={() => void updateStatus("archived")}
              disabled={saving || item.status === "archived"}
              className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-[#b7c7e4] transition hover:bg-white/[0.12] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Archiwizuj
            </button>
            {item.repair_id ? (
              <button
                type="button"
                onClick={() => router.push(`/admin-panel/repairs/${item.repair_id}`)}
                className="rounded-xl border border-emerald-500/35 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/25"
              >
                Otworz naprawe
              </button>
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}

