"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { partUsageDisplayName, type PartUsage, type RepairRequestListItem } from "@/types/repairs";
import type { PartsDashboardSummary } from "@/types/inventory";
import { PartUsageDetailModal } from "@/components/panel/PartUsageDetailModal";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkerStore, type DashboardScope } from "@/stores/workerStore";
import { ChevronRight, Clock4, Mail, MessageSquareText, RotateCcw, Smartphone, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { ScopeBar } from "@/components/layout/ScopeBar";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { usePanelBasePath } from "@/lib/panelPaths";

type Scope = DashboardScope;

interface StaffDashboardBuckets {
  my_new: RepairRequestListItem[];
  my_urgent: RepairRequestListItem[];
  today_to_contact: RepairRequestListItem[];
  my_in_progress?: RepairRequestListItem[];
  my_overdue?: RepairRequestListItem[];
  ready_for_pickup?: RepairRequestListItem[];
  without_update?: RepairRequestListItem[];
  completed_pickups_count: number;
  /** Unikalna liczba aktywnych napraw przypisanych do mnie (zgodna z /panel/naprawy). */
  my_active_count: number;
  /** „W trakcie naprawy” — staff: moje; admin: cały warsztat (jak lista wszystkich napraw). */
  in_repair_kpi_count: number;
}

function priorityRank(priority: string | null | undefined) {
  const p = (priority ?? "").toLowerCase();
  if (p === "urgent") return 0;
  if (p === "same_day") return 1;
  if (p === "high") return 2;
  if (p === "normal") return 3;
  if (p === "low") return 4;
  return 5;
}

function statusBadge(item: RepairRequestListItem) {
  const display = (item.public_status ?? item.status_display ?? "").trim();
  const s = (item.status ?? "").toLowerCase();
  const tags = item.auto_tags ?? [];

  if (["ready_for_pickup"].includes(s))
    return { bg: "rgba(34,197,94,.14)", border: "rgba(34,197,94,.30)", text: "#22c55e", label: display || "Gotowe Do Odbioru" };
  if (["waiting_for_parts"].includes(s) || tags.includes("czeka_na_czesc"))
    return { bg: "rgba(245,158,11,.16)", border: "rgba(245,158,11,.30)", text: "#f59e0b", label: display || "Oczekiwanie na Części" };
  if (["testing_failed"].includes(s) || tags.includes("pilne"))
    return { bg: "rgba(220,30,30,.14)", border: "rgba(220,30,30,.28)", text: "#dc1e1e", label: display || "Pilne" };

  if (["in_testing"].includes(s))
    return { bg: "rgba(245,158,11,.16)", border: "rgba(245,158,11,.30)", text: "#f59e0b", label: display || "W naprawie" };
  return { bg: "rgba(59,130,246,.14)", border: "rgba(59,130,246,.28)", text: "#3b82f6", label: display || "W naprawie" };
}

function taskPriorityPillClass(priorityRaw: string | undefined): string {
  const p = (priorityRaw ?? "").toLowerCase();
  if (p === "urgent") return "border-[#dc1e1e]/40 bg-[#dc1e1e]/15 text-[#ffb4b4]";
  if (p === "important") return "border-[#f59e0b]/40 bg-[#f59e0b]/15 text-[#ffd9a6]";
  return "border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)]";
}

const TASK_PRIORITY_LABEL: Record<string, string> = {
  low: "Niski",
  standard: "Standardowy",
  important: "Ważny",
  urgent: "Pilny",
};

type DashboardTaskRow = {
  id: string;
  title: string;
  priority?: string;
  priority_display?: string;
  due_date?: string | null;
  related_repair?: string | null;
  related_repair_number?: string | null;
  status?: string;
};

type CommLogRow = {
  id: string;
  repair: string;
  repair_number?: string | null;
  channel?: string;
  channel_display?: string;
  recipient?: string | null;
  subject?: string | null;
  body_snapshot?: string | null;
  sent_at?: string | null;
  status?: string;
};

/** GET /repairs/dashboard-comms-preview/ — scalone: od klienta + wysyłka (log). */
type DashboardCommPreviewItem =
  | {
      kind: "from_client";
      id: string;
      at: string;
      repair_id: string;
      repair_number: string;
      label: string;
      preview: string;
    }
  | {
      kind: "to_client";
      id: string;
      at: string;
      repair: string;
      repair_number?: string | null;
      channel?: string;
      recipient?: string | null;
      subject?: string | null;
      body_snapshot?: string | null;
      sent_at?: string | null;
      status?: string;
    };

function commLogPreviewText(l: CommLogRow): string {
  const sub = (l.subject ?? "").trim();
  if (sub) return sub;
  const body = (l.body_snapshot ?? "").replace(/\s+/g, " ").trim();
  if (body.length > 0) return body.length > 90 ? `${body.slice(0, 90)}…` : body;
  return l.channel_display === "SMS" || l.channel === "sms" ? "SMS do klienta" : "Wiadomość e-mail";
}

function nextAction(item: RepairRequestListItem) {
  const s = (item.status ?? "").toLowerCase();
  const tags = item.auto_tags ?? [];
  const urgent = tags.includes("pilne") || priorityRank(item.priority) <= 1;

  if (s === "ready_for_pickup") return { text: "▶ Wyślij SMS do klienta", tone: "good" as const };
  if (s === "waiting_for_parts" || tags.includes("czeka_na_czesc")) return { text: "▶ Przygotuj montaż po dostawie", tone: "warn" as const };
  if (urgent) return { text: "▶ Wykonaj teraz", tone: "urgent" as const };
  if (["in_testing"].includes(s) || s.startsWith("testing_")) return { text: "▶ Zakończ test końcowy", tone: "warn" as const };
  return { text: "▶ Kontynuuj naprawę", tone: "neutral" as const };
}

/** Kolejność kubełków ma znaczenie (pierwsze wystąpienie wygrywa). Dedup po id — te same naprawy są w wielu kubełkach. */
function mergeRepairBucketsUnique(chunks: RepairRequestListItem[][]): RepairRequestListItem[] {
  const seen = new Set<string>();
  const out: RepairRequestListItem[] = [];
  for (const chunk of chunks) {
    for (const r of chunk) {
      const id = String(r?.id ?? "");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(r);
    }
  }
  return out;
}

function dayFromIso(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const t = new Date(iso);
  if (!Number.isFinite(t.getTime())) return null;
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

function startOfTomorrow(from: Date): Date {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  d.setDate(d.getDate() + 1);
  return d;
}

/** Poniedziałek tygodnia kalendarzowego (lokalnie), 00:00. */
function mondayOfWeek(ref: Date): Date {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function sundayOfWeek(ref: Date): Date {
  const m = mondayOfWeek(ref);
  const s = new Date(m);
  s.setDate(s.getDate() + 6);
  return s;
}

function daysEqual(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

/** Priorytet: plan pracy pracownika, potem termin (SLA / komunikacja z klientem). */
function effectivePlanDay(r: RepairRequestListItem): Date | null {
  return dayFromIso(r.staff_planned_work_date ?? r.estimated_completion_date);
}

function allActiveRepairsFromBuckets(d: StaffDashboardBuckets): RepairRequestListItem[] {
  return mergeRepairBucketsUnique([
    d.my_new ?? [],
    d.today_to_contact ?? [],
    d.my_urgent ?? [],
    d.my_in_progress ?? [],
    d.my_overdue ?? [],
    d.ready_for_pickup ?? [],
    d.without_update ?? [],
  ]);
}

/**
 * Filtr zakresu po efektywnej dacie planu (`staff_planned_work_date` lub `estimated_completion_date`).
 * Bez obu dat: widoczne tylko w „Dziś” (backlog), nie w Jutro/Tydzień/Miesiąc.
 */
function filterRepairsByDashboardScope(items: RepairRequestListItem[], scope: Scope, now: Date): RepairRequestListItem[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = startOfTomorrow(now);
  const mon = mondayOfWeek(now);
  const sun = sundayOfWeek(now);
  const y = now.getFullYear();
  const mo = now.getMonth();

  switch (scope) {
    case "today":
      return items.filter((r) => {
        const ed = effectivePlanDay(r);
        if (ed === null) return true;
        return ed.getTime() <= today.getTime();
      });
    case "tomorrow":
      return items.filter((r) => {
        const ed = effectivePlanDay(r);
        return ed !== null && daysEqual(ed, tomorrow);
      });
    case "week":
      return items.filter((r) => {
        const ed = effectivePlanDay(r);
        return ed !== null && ed >= mon && ed <= sun;
      });
    case "month":
      return items.filter((r) => {
        const ed = effectivePlanDay(r);
        return ed !== null && ed.getFullYear() === y && ed.getMonth() === mo;
      });
    default:
      return items;
  }
}

function StaffDashboardSummaryCard({
  label,
  value,
  accent,
  href,
}: {
  label: string;
  value: number | null;
  accent: string;
  href?: string;
}) {
  const isLoading = value == null;
  const v = value ?? 0;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isLoading) return;
    const target = Math.max(0, v);
    const start = displayValue;
    if (start === target) return;

    const durationMs = 420;
    const startTs = performance.now();
    let raf = 0;

    const tick = (ts: number) => {
      const progress = Math.min(1, (ts - startTs) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(start + (target - start) * eased);
      setDisplayValue(next);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v, isLoading]);

  const card = (
    <div
      className="relative min-h-[86px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4"
      style={{
        boxShadow: `inset 0 1px 0 rgba(255,255,255,.06), 0 0 24px rgba(0,0,0,.25)`,
      }}
    >
      <div
        className="absolute left-0 top-0 h-full w-[2px]"
        style={{
          background: accent,
          boxShadow: `0 0 18px ${accent}`,
          opacity: 0.95,
        }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">{label}</div>
          <div className="mt-2 text-xl font-semibold text-[var(--white)]">{isLoading ? "…" : displayValue}</div>
        </div>

        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{
            background: "rgba(255,255,255,.03)",
            border: "1px solid rgba(255,255,255,.08)",
            boxShadow: `0 0 0 1px rgba(255,255,255,.02), 0 0 22px rgba(0,0,0,.2)`,
          }}
          aria-hidden="true"
        >
          <span className="text-sm font-bold" style={{ color: accent }}>
            {isLoading ? "…" : displayValue}
          </span>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-2xl outline-none ring-offset-2 ring-offset-[#0f1117] transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#3b82f6]/55"
        aria-label={`${label} — otwórz`}
      >
        {card}
      </Link>
    );
  }

  return card;
}

function StaffDashboardPage() {
  const { token, user } = useAuth();
  const searchParams = useSearchParams();
  const requiresActionSectionRef = useRef<HTMLElement | null>(null);
  const p = usePanelBasePath();

  const scope = useWorkerStore((s) => s.scope);
  const setScope = useWorkerStore((s) => s.setScope);
  const showToast = useWorkerStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [partsModalUsage, setPartsModalUsage] = useState<PartUsage | null>(null);

  const panelLabel = user?.role === "admin" ? "Panel administratora" : "Panel pracownika";

  const scopeDaysWithoutUpdate = useMemo(() => {
    switch (scope) {
      case "today":
        return 0;
      case "tomorrow":
        return 1;
      case "week":
        return 7;
      case "month":
        return 30;
      default:
        return 3;
    }
  }, [scope]);

  const daysWithoutUpdateForApi = useMemo(() => Math.max(1, scopeDaysWithoutUpdate), [scopeDaysWithoutUpdate]);

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "staff", scope, daysWithoutUpdateForApi],
    enabled: Boolean(token && user),
    queryFn: async () => {
      if (!token) throw new Error("Missing token");
      const q = new URLSearchParams({
        days_without_update: String(daysWithoutUpdateForApi),
        recent_limit: "10",
        dashboard_scope: scope,
      });
      const dashboardRes = await api.get<any>(`/staff/dashboard/?${q.toString()}`, token);
      return {
        my_new: dashboardRes.my_new ?? [],
        my_urgent: dashboardRes.my_urgent ?? [],
        today_to_contact: dashboardRes.today_to_contact ?? [],
        my_in_progress: dashboardRes.my_in_progress ?? [],
        my_overdue: dashboardRes.my_overdue ?? [],
        ready_for_pickup: dashboardRes.ready_for_pickup ?? [],
        without_update: dashboardRes.without_update ?? [],
        completed_pickups_count: Number(dashboardRes.completed_pickups_count ?? 0),
        my_active_count: Number(dashboardRes.my_active_count ?? 0),
        in_repair_kpi_count: Number(dashboardRes.in_repair_kpi_count ?? 0),
      } as StaffDashboardBuckets;
    },
  });

  const requiresActionQuery = useQuery({
    queryKey: ["dashboard", "requires-action", user?.id, user?.role, scope],
    enabled: Boolean(token && user?.id),
    queryFn: async () => {
      if (!token || !user?.id) throw new Error("Missing token/user");
      const path =
        user.role === "admin"
          ? `/repairs/special-views/requires-action/`
          : `/repairs/special-views/requires-action/?assigned_to=${user.id}`;
      return api.get<RepairRequestListItem[]>(path, token);
    },
  });

  const data = dashboardQuery.data ?? null;
  const requiresAction = requiresActionQuery.data ?? null;
  const loading = dashboardQuery.isLoading || requiresActionQuery.isLoading;
  const error =
    (dashboardQuery.error instanceof Error ? dashboardQuery.error.message : null) ??
    (requiresActionQuery.error instanceof Error ? requiresActionQuery.error.message : null);

  const tasksQuery = useQuery({
    queryKey: ["dashboard", "tasks", "preview"],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) throw new Error("Missing token");
      return api.get<DashboardTaskRow[]>("/tasks/dashboard-preview/", token);
    },
    staleTime: 10_000,
  });

  const completeDashboardTask = useMutation({
    mutationFn: async (taskId: string) => {
      if (!token) throw new Error("Brak sesji.");
      return api.patch(`/tasks/${taskId}/`, { status: "completed" }, token);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "tasks", "preview"] });
      showToast("Zadanie oznaczone jako wykonane.", "success");
    },
    onError: (e: unknown) => {
      showToast(e instanceof Error ? e.message : "Nie udało się zakończyć zadania.", "error");
    },
  });

  const partsStatusQuery = useQuery({
    queryKey: ["dashboard", "parts-status"],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) throw new Error("Missing token");
      return api.get<PartsDashboardSummary>("/inventory/parts-dashboard-summary/", token);
    },
    staleTime: 30_000,
  });

  const commPreviewQuery = useQuery({
    queryKey: ["dashboard", "comms", "preview"],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) throw new Error("Missing token");
      const res = await api.get<{ items?: DashboardCommPreviewItem[] }>(`/repairs/dashboard-comms-preview/?limit=8`, token);
      return (res?.items ?? []) as DashboardCommPreviewItem[];
    },
    staleTime: 30_000,
  });

  const refreshQueryKeys = useMemo(
    () =>
      [
        ["dashboard", "staff", scope, daysWithoutUpdateForApi],
        ["dashboard", "requires-action", user?.id, user?.role, scope],
        ["dashboard", "tasks", "preview"],
        ["dashboard", "parts-status"],
        ["dashboard", "comms", "preview"],
        ["sidebar", "dashboard-buckets"],
      ] as const,
    [scope, daysWithoutUpdateForApi, user?.id, user?.role],
  );

  const { countdown, isRefreshing, refresh: runAutoRefresh } = useAutoRefresh([...refreshQueryKeys], 30_000);

  const manualRefresh = () => {
    runAutoRefresh();
    showToast(
      `✓ Dane odświeżone · ${new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}`,
      "success",
    );
  };

  const userFirstName = useMemo(() => {
    const full = user?.full_name || user?.email || "";
    const parts = String(full).trim().split(/\s+/g);
    return parts[0] || "Kuba";
  }, [user]);

  const subtitleByScope = useMemo(() => {
    const urgent = data?.my_urgent?.length ?? 0;
    const ready = data?.ready_for_pickup?.length ?? 0;
    const completed = data?.completed_pickups_count ?? 0;
    const inProgress = (data?.my_in_progress?.length ?? 0) + (data?.today_to_contact?.length ?? 0);

    switch (scope) {
      case "today":
        return `Masz ${urgent} pilną naprawę · ${ready} gotowe · Część dotarła — zamontuj!`;
      case "tomorrow":
        return `Jutro: LCD iPhone dotrze rano · SLA upływa o 17:00 · iPad gotowy do odbioru`;
      case "week":
        return `Ten tydzień: ${Math.max(0, completed)} zakończonych · ${inProgress} w toku · 0 reklamacji`;
      case "month":
        return `Ten miesiąc: ${Math.max(0, completed)} zakończonych · 12 840 zł przychód · Score 88/100`;
      default:
        return "Podsumowanie wczytywane…";
    }
  }, [scope, data]);

  /** Podgląd „Moje naprawy”: pełna pula aktywnych z kubełków, potem filtr kalendarzowy wg zakresu. */
  const { myRepairsPreviewRows, myRepairsPreviewScopeFallback } = useMemo(() => {
    if (!data) return { myRepairsPreviewRows: [] as RepairRequestListItem[], myRepairsPreviewScopeFallback: false };
    const merged = allActiveRepairsFromBuckets(data);
    const now = new Date();
    let scoped = filterRepairsByDashboardScope(merged, scope, now);
    let fallback = false;
    if (scoped.length === 0 && merged.length > 0 && (scope === "month" || scope === "week")) {
      scoped = merged;
      fallback = true;
    }
    return { myRepairsPreviewRows: scoped.slice(0, 4), myRepairsPreviewScopeFallback: fallback };
  }, [data, scope]);

  useEffect(() => {
    if (searchParams.get("focus") !== "requires-action") return;
    const t = window.setTimeout(() => {
      requiresActionSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(t);
  }, [searchParams]);

  return (
    <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-8">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink2)]">
              Pracownik · {userFirstName}{" "}
              <span
                className="ml-2 inline-block h-2 w-2 rounded-full bg-[#22c55e]"
                style={{ boxShadow: "0 0 18px rgba(34,197,94,.45)", animation: "pulse 1.6s ease-in-out infinite" }}
              />
            </p>
            <h1 className="mt-2 text-[28px] font-semibold text-[var(--white)]" style={{ fontFamily: "var(--font-unbounded)" }}>
              Dzień dobry, {userFirstName}.
            </h1>
            <p className="mt-1 text-sm text-[var(--ink2)]">{subtitleByScope}</p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-4 py-2.5 text-sm">
                <span className="inline-flex items-center justify-center">
                  {isRefreshing ? (
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#3b82f6] border-t-transparent" />
                  ) : (
                    <Clock4 size={16} className="text-[#3b82f6]" />
                  )}
                </span>
                <span className="text-[var(--ink2)]">Auto-refresh za</span>
                <span className="font-semibold text-[var(--white)]">{countdown}s</span>
                <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-[#22c55e]" style={{ boxShadow: "0 0 18px rgba(34,197,94,.45)" }} />
              </div>

              <button
                type="button"
                onClick={manualRefresh}
                className="rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2.5 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)] disabled:opacity-60"
                disabled={loading}
              >
                <span className="inline-flex items-center gap-2">
                  <RotateCcw size={16} />
                  Odśwież
                </span>
              </button>

              <Link href={p.intakePath} className="rounded-2xl bg-[#dc1e1e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b81818]">
                Nowe przyjęcie
              </Link>
            </div>
          </div>
        </header>

        {error && !loading ? <p className="text-sm text-[#fca5a5]">{error}</p> : null}

        <ScopeBar value={scope} onChange={setScope} />

        <section className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-3">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              {
                id: "active",
                label: "Aktywnych",
                href: `${p.repairsListPath}?status=all`,
                value: data && !loading ? data.my_active_count : null,
                accent: "#f59e0b",
                delay: "0ms",
              },
              {
                id: "in_repair",
                label: "W trakcie Naprawy",
                href: `${p.repairsListPath}?status=in_progress`,
                value: data && !loading ? data.in_repair_kpi_count : null,
                accent: "#dc1e1e",
                delay: "80ms",
              },
              {
                id: "ready",
                label: "Gotowe do Odbioru",
                href: `${p.repairsListPath}?status=ready`,
                value: !loading ? (data?.ready_for_pickup?.length ?? 0) : null,
                accent: "#22c55e",
                delay: "160ms",
              },
              {
                id: "messages",
                label: "Wiadomości",
                href: p.commPath,
                value: data && !loading ? (data.today_to_contact?.length ?? 0) : null,
                accent: "#3b82f6",
                delay: "240ms",
              },
              {
                id: "completed",
                label: "Zakończonych",
                href: p.historiaPath,
                value: !loading ? (data?.completed_pickups_count ?? 0) : null,
                accent: "#86efac",
                delay: "320ms",
              },
            ].map((s) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <StaffDashboardSummaryCard
                  label={s.label}
                  value={s.value as number | null}
                  accent={s.accent}
                  href={s.href}
                />
              </motion.div>
            ))}
          </div>
        </section>

        <section
          ref={requiresActionSectionRef}
          id="requires-action"
          className="scroll-mt-24 rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#3b82f6]/30 bg-[#3b82f6]/10">
                <Zap size={18} className="text-[#3b82f6]" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3b82f6]">Następne działania</div>
                <h2 className="mt-1 text-lg font-semibold text-[var(--white)]">Co teraz robić?</h2>
              </div>
            </div>
            <Link href={p.repairsListPath} className="text-sm font-semibold text-[#3b82f6] hover:underline">
              Wszystkie
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(requiresAction ?? []).slice(0, 4).map((r, i) => {
              const tone = (() => {
                if (priorityRank(r.priority) <= 1 || (r.auto_tags ?? []).includes("pilne")) return "urgent";
                if ((r.auto_tags ?? []).includes("same_day")) return "warn";
                return "neutral";
              })();

              const action = nextAction(r);
              const sb = statusBadge(r);
              return (
                <Link
                  key={r.id}
                  href={p.repairDetailPath(r.id)}
                  className="group relative rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4 transition hover:translate-x-0.5 hover:bg-[var(--row-hover)] hover:border-[var(--border2)]"
                >
                  <div className="absolute right-3 top-3 h-2 w-2 rounded-full" style={{ background: tone === "urgent" ? "#dc1e1e" : tone === "warn" ? "#f59e0b" : "#9ca3af" }} />
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
                      style={{
                        background: tone === "urgent" ? "rgba(220,30,30,.14)" : tone === "warn" ? "rgba(245,158,11,.16)" : "rgba(255,255,255,.05)",
                        borderColor: tone === "urgent" ? "rgba(220,30,30,.30)" : tone === "warn" ? "rgba(245,158,11,.30)" : "rgba(255,255,255,.12)",
                        color: tone === "urgent" ? "#dc1e1e" : tone === "warn" ? "#f59e0b" : "#9ca3af",
                      }}
                    >
                      #{i + 1}
                    </span>
                    <span
                      className="font-mono text-xs font-semibold text-[var(--ink2)]"
                      style={{ minWidth: 72 }}
                    >
                      {r.repair_number}
                    </span>
                  </div>

                  <div className="mt-2 text-sm font-semibold text-[var(--white)]">{r.device_name}</div>
                  <div className="mt-1 text-xs text-[var(--ink2)]">{r.status_display}</div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
                      style={{ background: sb.bg, borderColor: sb.border, color: sb.text }}
                    >
                      {sb.label}
                    </span>
                  </div>

                  <div className="mt-3 inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-xs font-semibold text-[var(--ink2)] group-hover:text-[var(--white)]">
                    {action.text}
                  </div>
                </Link>
              );
            })}
          </div>
          {!requiresActionQuery.isLoading && (requiresAction?.length ?? 0) === 0 ? (
            <p className="mt-4 text-sm text-[var(--ink2)]">
              Brak aktywnych napraw do wyświetlenia. Sprawdź{" "}
              <Link href={p.repairsListPath} className="font-semibold text-[#3b82f6] hover:underline">
                Moje naprawy
              </Link>
              .
            </p>
          ) : null}
        </section>

        <div className="flex flex-col gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="worker-card-shimmer rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">Moje naprawy</div>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--white)]">
                    {scope === "today" ? "Dziś" : scope === "tomorrow" ? "Jutro" : scope === "week" ? "Ten tydzień" : "Ten miesiąc"}
                  </h2>
                </div>
                <Link href={p.repairsListPath} className="text-sm font-semibold text-[#3b82f6] hover:underline">
                  Wszystkie
                </Link>
              </div>

              <div className="mt-4 divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--s1)]">
                {(loading ? Array.from({ length: 4 }) : myRepairsPreviewRows).map((r: any, idx: number) =>
                  loading ? (
                    <div key={idx} className="h-[62px] animate-pulse px-4 py-3">
                      <div className="h-3 w-24 rounded bg-[var(--row-active)]" />
                      <div className="mt-2 h-3 w-48 rounded bg-[var(--row-active)]" />
                    </div>
                  ) : (
                    <Link
                      key={r.id}
                      href={p.repairDetailPath(r.id)}
                      className="group flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-[var(--row-hover)]"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-[var(--ink2)]">{r.repair_number}</span>
                          <span className="h-7 w-7 rounded-xl bg-[#191d28] border border-[var(--border)]" />
                          <span className="min-w-0 truncate text-sm font-semibold text-[var(--white)]">{r.device_name}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--ink2)]">
                          <span>{r.client_name}</span>
                          <span className="rounded-full border border-[var(--border)] bg-[var(--row-hover)] px-2 py-0.5 font-semibold uppercase tracking-wide text-[10px] text-[var(--ink2)]">
                            {nextAction(r).text.replace("▶ ", "")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full border border-[var(--border)] bg-[var(--row-hover)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink2)]">
                          {statusBadge(r).label}
                        </span>
                      </div>
                    </Link>
                  ),
                )}
              </div>
              {!loading && myRepairsPreviewRows.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--muted)]">
                  Brak napraw pasujących do tego widoku (termin SLA / data utworzenia). Otwórz{" "}
                  <Link href={p.repairsListPath} className="font-semibold text-[#3b82f6] hover:underline">
                    Moje naprawy
                  </Link>
                  , aby zobaczyć pełną listę.
                </p>
              ) : null}
              {!loading && myRepairsPreviewScopeFallback ? (
                <p className="mt-3 text-xs text-[var(--muted)]">
                  Brak pozycji z terminem SLA / datą utworzenia w tym oknie — pokazano wszystkie aktywne naprawy.
                </p>
              ) : null}
            </section>

            <section className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">Moje zadania</div>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--white)]">Dziś</h2>
                  <p className="mt-1 max-w-[280px] text-xs leading-snug text-[var(--muted)]">
                    Termin na dziś oraz otwarte zadania powiązane z naprawą (np. z szybkich zadań przy zgłoszeniu).
                  </p>
                </div>
                <Link href={p.zadaniaPath} className="shrink-0 text-sm font-semibold text-[#3b82f6] hover:underline">
                  Wszystkie
                </Link>
              </div>
              <div className="mt-4 space-y-2">
                {tasksQuery.isLoading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-[72px] animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--s1)]" />
                  ))
                ) : tasksQuery.error ? (
                  <p className="text-sm text-[#fca5a5]">Nie udało się pobrać zadań.</p>
                ) : (tasksQuery.data ?? []).length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">Brak zadań w tym widoku.</p>
                ) : (
                  (tasksQuery.data ?? []).slice(0, 5).map((t) => {
                    const zadaniaHref = t.related_repair
                      ? `${p.zadaniaPath}?${new URLSearchParams({ related_repair: t.related_repair }).toString()}`
                      : p.zadaniaPath;
                    const pri = (t.priority ?? "standard").toLowerCase();
                    const priLabel =
                      t.priority_display ?? TASK_PRIORITY_LABEL[pri] ?? TASK_PRIORITY_LABEL.standard;
                    const finishing =
                      completeDashboardTask.isPending && completeDashboardTask.variables === t.id;
                    return (
                      <div
                        key={t.id}
                        className="flex flex-wrap items-stretch gap-2 rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-2 sm:flex-nowrap sm:items-center sm:gap-3 sm:p-3"
                      >
                        <div className="flex min-w-0 flex-1 items-start gap-2 px-0.5 py-0.5">
                          <Link
                            href={zadaniaHref}
                            className="mt-0.5 shrink-0 text-[var(--muted)] transition hover:text-[#3b82f6]"
                            aria-label="Otwórz listę zadań"
                          >
                            <ChevronRight className="h-4 w-4" aria-hidden />
                          </Link>
                          <div className="min-w-0 flex-1">
                            <Link
                              href={zadaniaHref}
                              className="text-sm font-semibold text-[var(--white)] transition hover:text-[#93c5fd]"
                            >
                              {t.title}
                            </Link>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${taskPriorityPillClass(t.priority)}`}
                              >
                                {priLabel}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-[var(--ink2)]">
                              {t.related_repair && t.related_repair_number ? (
                                <Link
                                  href={p.repairDetailPath(t.related_repair)}
                                  className="font-semibold text-[#3b82f6] hover:underline"
                                >
                                  {t.related_repair_number}
                                </Link>
                              ) : (
                                "Bez powiązanej naprawy"
                              )}
                              {t.due_date
                                ? ` · Termin: ${new Date(t.due_date).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`
                                : ""}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={finishing}
                          onClick={() => completeDashboardTask.mutate(t.id)}
                          className="shrink-0 self-center rounded-xl bg-[#22c55e] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#16a34a] disabled:opacity-60"
                        >
                          {finishing ? "…" : "Zakończ"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">Wiadomości</div>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--white)]">Najnowsze</h2>
                  <p className="mt-1 max-w-[280px] text-xs leading-snug text-[var(--muted)]">
                    Ostatnie wpisy: wiadomości od klienta (panel lub e-mail) oraz wychodzące wiadomości z logu — zakres jak w komunikacji przy naprawach.
                  </p>
                </div>
                <Link href={p.commPath} className="shrink-0 text-sm font-semibold text-[#3b82f6] hover:underline">
                  Wszystkie
                </Link>
              </div>
              <div className="mt-4 space-y-2">
                {commPreviewQuery.isLoading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-[76px] animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--s1)]" />
                  ))
                ) : commPreviewQuery.error ? (
                  <p className="text-sm text-[#fca5a5]">Nie udało się pobrać wiadomości.</p>
                ) : (commPreviewQuery.data ?? []).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-[var(--s1)]/80 px-4 py-6 text-center">
                    <MessageSquareText className="mx-auto h-8 w-8 text-[#4b5563]" aria-hidden />
                    <p className="mt-2 text-sm text-[var(--ink2)]">Brak ostatniej komunikacji w wątkach.</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Gdy klient napisze w panelu lub wyślesz wiadomość z naprawy, pojawi się tu skrót.
                    </p>
                    <Link
                      href={p.repairsListPath}
                      className="mt-3 inline-block text-sm font-semibold text-[#3b82f6] hover:underline"
                    >
                      Przejdź do napraw
                    </Link>
                  </div>
                ) : (
                  (commPreviewQuery.data ?? []).map((row) => {
                    if (row.kind === "from_client") {
                      return (
                        <Link
                          key={row.id}
                          href={`${p.repairDetailPath(row.repair_id)}?tab=comms`}
                          className="group block rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-4 py-3 transition hover:bg-[var(--row-hover)]"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex min-w-0 flex-1 items-start gap-3">
                              <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-500/35 bg-amber-500/15 text-[#fcd34d]"
                                aria-hidden
                              >
                                <MessageSquareText className="h-4 w-4" strokeWidth={2.25} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-200/90">{row.label}</div>
                                <div className="mt-0.5 truncate text-sm font-semibold text-[var(--white)]">{row.preview}</div>
                                <div className="mt-1 text-xs text-[var(--ink2)]">
                                  <span className="font-mono font-semibold">{row.repair_number}</span>
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0 text-right text-[11px] text-[var(--ink2)]">
                              {row.at
                                ? new Date(row.at).toLocaleString("pl-PL", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </div>
                          </div>
                        </Link>
                      );
                    }
                    const l = row as Extract<DashboardCommPreviewItem, { kind: "to_client" }>;
                    const ch = (l.channel ?? "").toLowerCase();
                    const isSms = ch === "sms";
                    const preview = commLogPreviewText(l as CommLogRow);
                    return (
                      <Link
                        key={l.id}
                        href={l.repair ? `${p.repairDetailPath(l.repair)}?tab=comms` : p.commPath}
                        className="group block rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-4 py-3 transition hover:bg-[var(--row-hover)]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                                isSms
                                  ? "border-emerald-500/35 bg-emerald-500/15 text-[#a7f3d0]"
                                  : "border-[#3b82f6]/30 bg-[#3b82f6]/15 text-[#bcd6ff]"
                              }`}
                              aria-hidden
                            >
                              {isSms ? <Smartphone className="h-4 w-4" strokeWidth={2.25} /> : <Mail className="h-4 w-4" strokeWidth={2.25} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Wysłane do klienta</div>
                              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                <span className="truncate text-sm font-semibold text-[var(--white)]">{preview}</span>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--ink2)]">
                                {l.repair_number ? (
                                  <span className="font-mono font-semibold text-[var(--ink2)]">{l.repair_number}</span>
                                ) : null}
                                {l.recipient ? (
                                  <span className="truncate" title={l.recipient}>
                                    → {l.recipient}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          <div className="shrink-0 text-right text-[11px] text-[var(--ink2)]">
                            {l.sent_at
                              ? new Date(l.sent_at).toLocaleString("pl-PL", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">Status</div>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--white)]">Status części</h2>
                </div>
                <Link href={p.czesciPath} className="text-sm font-semibold text-[#3b82f6] hover:underline">
                  Szczegóły
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {partsStatusQuery.isLoading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="h-[72px] animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--s1)]" />
                  ))
                ) : (
                  (["to_order", "in_transit", "arrived"] as const).map((bucketKey) => {
                    const labels: Record<typeof bucketKey, string> = {
                      to_order: "Części do zamówienia",
                      in_transit: "Części w drodze",
                      arrived: "Części które przyszły",
                    };
                    const bucket = partsStatusQuery.data?.[bucketKey];
                    const count = bucket?.count ?? 0;
                    const items = bucket?.items ?? [];
                    const extra = Math.max(0, count - items.length);
                    return (
                      <div
                        key={bucketKey}
                        className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-[var(--white)]">{labels[bucketKey]}</span>
                          <span className="shrink-0 rounded-lg bg-[var(--row-hover)] px-2 py-0.5 text-xs font-mono font-semibold text-[var(--ink2)]">
                            {count}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1">
                          {items.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setPartsModalUsage(item)}
                              className="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-transparent px-2 py-1.5 text-left text-sm text-[#e5e7eb] transition hover:border-[var(--border)] hover:bg-[var(--row-hover)]"
                            >
                              <span className="min-w-0 truncate">
                                <span className="font-mono text-[var(--ink2)]">{item.repair_number ?? "—"}</span>
                                <span className="text-[var(--muted)]"> · </span>
                                <span>{partUsageDisplayName(item)}</span>
                                {item.expected_arrival_date ? (
                                  <span className="text-[11px] text-[var(--muted)]">
                                    {" "}
                                    · dostawa {String(item.expected_arrival_date).slice(0, 10)}
                                  </span>
                                ) : null}
                              </span>
                            </button>
                          ))}
                          {items.length === 0 ? (
                            <p className="px-2 text-xs text-[var(--muted)]">Brak pozycji.</p>
                          ) : null}
                          {extra > 0 ? (
                            <p className="px-2 text-xs text-[var(--muted)]">
                              + {extra} więcej — zobacz{" "}
                              <Link href={p.czesciPath} className="font-semibold text-[#3b82f6] hover:underline">
                                kolejkę części
                              </Link>
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
      <PartUsageDetailModal
        open={partsModalUsage !== null}
        onClose={() => setPartsModalUsage(null)}
        usageRow={partsModalUsage}
        token={token}
      />
    </main>
  );
}

export default function StaffDashboardPageWithSuspense() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-8">
          <div className="h-10 w-48 animate-pulse rounded-xl bg-[var(--row-active)]" />
          <div className="mt-6 h-40 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--s1)]" />
        </main>
      }
    >
      <StaffDashboardPage />
    </Suspense>
  );
}
