"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { RepairRequestListItem } from "@/types/repairs";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useWorkerStore, type DashboardScope } from "@/stores/workerStore";
import { Clock4, RotateCcw, Zap, Bell, MessageSquareText, Users2 } from "lucide-react";
import { motion } from "framer-motion";
import { ScopeBar } from "@/components/layout/ScopeBar";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

type Scope = DashboardScope;

interface StaffDashboardBuckets {
  my_new: RepairRequestListItem[];
  my_urgent: RepairRequestListItem[];
  today_to_contact: RepairRequestListItem[];
  my_in_progress?: RepairRequestListItem[];
  my_overdue?: RepairRequestListItem[];
  ready_for_pickup?: RepairRequestListItem[];
  without_update?: RepairRequestListItem[];
}

const STATUS_OPTIONS: Array<{ value: string; color: "gray" | "amber" | "blue" | "purple" | "green" | "red" }> = [
  { value: "new", color: "gray" },
  { value: "accepted", color: "blue" },
  { value: "in_diagnostics", color: "blue" },
  { value: "diagnostics_done", color: "blue" },
  { value: "quote_pending", color: "amber" },
  { value: "quote_sent", color: "purple" },
  { value: "quote_accepted", color: "amber" },
  { value: "quote_rejected", color: "red" },
  { value: "waiting_for_parts", color: "blue" },
  { value: "in_repair", color: "amber" },
  { value: "repair_done", color: "amber" },
  { value: "in_testing", color: "amber" },
  { value: "testing_passed", color: "green" },
  { value: "testing_failed", color: "red" },
  { value: "ready_for_pickup", color: "green" },
  { value: "picked_up", color: "gray" },
  { value: "shipped", color: "gray" },
  { value: "delivered", color: "gray" },
  { value: "cancelled", color: "red" },
  { value: "unrepairable", color: "red" },
  { value: "abandoned", color: "red" },
];

function statusPillColor(status: string): { bg: string; border: string; text: string } {
  const opt = STATUS_OPTIONS.find((s) => s.value === status);
  const color = opt?.color ?? "gray";
  switch (color) {
    case "green":
      return { bg: "rgba(34,197,94,.14)", border: "rgba(34,197,94,.28)", text: "#22c55e" };
    case "amber":
      return { bg: "rgba(245,158,11,.16)", border: "rgba(245,158,11,.30)", text: "#f59e0b" };
    case "blue":
      return { bg: "rgba(59,130,246,.14)", border: "rgba(59,130,246,.28)", text: "#3b82f6" };
    case "purple":
      return { bg: "rgba(139,92,246,.14)", border: "rgba(139,92,246,.28)", text: "#8b5cf6" };
    case "red":
      return { bg: "rgba(220,30,30,.14)", border: "rgba(220,30,30,.28)", text: "#dc1e1e" };
    default:
      return { bg: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.12)", text: "#9ba3b0" };
  }
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
  const s = (item.status ?? "").toLowerCase();
  const tags = item.auto_tags ?? [];

  if (["ready_for_pickup"].includes(s)) return { bg: "rgba(34,197,94,.14)", border: "rgba(34,197,94,.30)", text: "#22c55e", label: "Gotowe" };
  if (["waiting_for_parts"].includes(s) || tags.includes("czeka_na_czesc"))
    return { bg: "rgba(245,158,11,.16)", border: "rgba(245,158,11,.30)", text: "#f59e0b", label: "Czeka na część" };
  if (["testing_failed"].includes(s) || tags.includes("pilne"))
    return { bg: "rgba(220,30,30,.14)", border: "rgba(220,30,30,.28)", text: "#dc1e1e", label: item.status_display || "Pilne" };

  if (["in_testing"].includes(s)) return { bg: "rgba(245,158,11,.16)", border: "rgba(245,158,11,.30)", text: "#f59e0b", label: "Testy" };
  return { bg: "rgba(59,130,246,.14)", border: "rgba(59,130,246,.28)", text: "#3b82f6", label: item.status_display || "W naprawie" };
}

function blockerText(item: RepairRequestListItem) {
  const s = (item.status ?? "").toLowerCase();
  const tags = item.auto_tags ?? [];

  if (s === "waiting_for_parts" || tags.includes("czeka_na_czesc")) return "Blokada: część w drodze";
  if (item.requires_attention) return "Blokada: wymaga reakcji";
  return "";
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

function StaffDashboardPage() {
  const { token, user } = useAuth();
  const searchParams = useSearchParams();
  const requiresActionSectionRef = useRef<HTMLElement | null>(null);

  const scope = useWorkerStore((s) => s.scope);
  const setScope = useWorkerStore((s) => s.setScope);
  const showToast = useWorkerStore((s) => s.addToast);

  const panelLabel = user?.role === "admin" ? "Panel Admina" : "Panel pracownika";

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

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "staff", scope],
    enabled: Boolean(token && user),
    queryFn: async () => {
      if (!token) throw new Error("Missing token");
      const dashboardRes = await api.get<any>(
        `/staff/dashboard/?days_without_update=${scopeDaysWithoutUpdate}&recent_limit=10`,
        token,
      );
      return {
        my_new: dashboardRes.my_new ?? [],
        my_urgent: dashboardRes.my_urgent ?? [],
        today_to_contact: dashboardRes.today_to_contact ?? [],
        my_in_progress: dashboardRes.my_in_progress ?? [],
        my_overdue: dashboardRes.my_overdue ?? [],
        ready_for_pickup: dashboardRes.ready_for_pickup ?? [],
        without_update: dashboardRes.without_update ?? [],
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
    queryKey: ["dashboard", "tasks", "due-today"],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) throw new Error("Missing token");
      // Backend: /api/v1/tasks/due-today/
      return api.get<any[]>("/tasks/due-today/", token);
    },
    staleTime: 10_000,
  });

  const teamAvailabilityQuery = useQuery({
    queryKey: ["dashboard", "team", "today"],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) throw new Error("Missing token");
      return api.get<any>("/availability/team-today/", token);
    },
    staleTime: 30_000,
  });

  const commLogsQuery = useQuery({
    queryKey: ["dashboard", "comm", "latest"],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) throw new Error("Missing token");
      // DRF pagination: count/next/previous/results
      const res = await api.get<any>(`/communications/logs/?page=1&page_size=3`, token);
      return (res?.results ?? []) as Array<any>;
    },
    staleTime: 30_000,
  });

  const refreshQueryKeys = useMemo(
    () =>
      [
        ["dashboard", "staff", scope],
        ["dashboard", "requires-action", user?.id, user?.role, scope],
        ["dashboard", "tasks", "due-today"],
        ["dashboard", "team", "today"],
        ["dashboard", "comm", "latest"],
      ] as const,
    [scope, user?.id, user?.role],
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
    const inProgress = (data?.my_in_progress?.length ?? 0) + (data?.today_to_contact?.length ?? 0);

    switch (scope) {
      case "today":
        return `Masz ${urgent} pilną naprawę · ${ready} gotowe · Część dotarła — zamontuj!`;
      case "tomorrow":
        return `Jutro: LCD iPhone dotrze rano · SLA upływa o 17:00 · iPad gotowy do odbioru`;
      case "week":
        return `Ten tydzień: ${Math.max(0, ready)} zakończonych · ${inProgress} w toku · 0 reklamacji`;
      case "month":
        return `Styczeń: ${Math.max(0, ready)} zakończonych · 12 840 zł przychód · Score 88/100`;
      default:
        return "Podsumowanie wczytywane…";
    }
  }, [scope, data]);

  useEffect(() => {
    if (searchParams.get("focus") !== "requires-action") return;
    const t = window.setTimeout(() => {
      requiresActionSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(t);
  }, [searchParams]);

  const renderStatusPill = (r: RepairRequestListItem) => {
    const pill = statusPillColor(r.status);
    return (
      <span
        className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
        style={{ background: pill.bg, border: `1px solid ${pill.border}`, color: pill.text }}
        title="Status"
      >
        {r.status_display}
      </span>
    );
  };

  const listPanelItems = (items: RepairRequestListItem[] | null | undefined) => (items ?? []).slice(0, 6);

  const SummaryCard = ({ label, value, accent }: { label: string; value: number | null; accent: string }) => {
    const isLoading = value == null;
    const v = value ?? 0;

    return (
      <div
        className="relative min-h-[86px] overflow-hidden rounded-2xl border border-white/10 bg-[#0c0d12] p-4"
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
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">{label}</div>
            <div className="mt-2 text-xl font-semibold text-white">{isLoading ? "…" : v}</div>
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
              {isLoading ? "…" : v}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const ListPanel = ({
    title,
    subtitle,
    accent,
    items,
    loading: panelLoading,
    emptyText,
    action,
  }: {
    title: string;
    subtitle?: string;
    accent: string;
    items: RepairRequestListItem[] | null;
    loading: boolean;
    emptyText: string;
    action?: { label: string; href: string };
  }) => {
    const sliced = listPanelItems(items);

    return (
      <section
        className="rounded-3xl border border-white/10 bg-[#0f1117] p-5"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,.05), inset -1px 0 0 rgba(220,30,30,.02)" }}
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: accent, boxShadow: `0 0 20px ${accent}` }} />
              <h2 className="text-[15px] font-semibold tracking-wide text-white">{title}</h2>
            </div>
            {subtitle && <p className="mt-1 text-sm text-[#9ca3af]">{subtitle}</p>}
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: accent }}>
            {panelLoading ? "Ładowanie" : `${(items?.length ?? 0)} pozycji`}
          </div>
        </div>

        {panelLoading && (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={i}
                className="h-[44px] animate-pulse rounded-xl bg-white/5"
                style={{ border: "1px solid rgba(255,255,255,.08)" }}
              />
            ))}
          </div>
        )}

        {!panelLoading && (items?.length ?? 0) === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-black/10 px-4 py-5 text-sm text-[#9ca3af]">
            {emptyText}
          </div>
        )}

        {!panelLoading && (items?.length ?? 0) > 0 && (
          <div className="mt-4 space-y-2">
            {sliced.map((r) => (
              <Link
                key={r.id}
                href={`/panel/naprawy/${r.id}`}
                className="group block rounded-2xl border border-white/10 bg-[#0b0c10] px-4 py-3 transition hover:border-white/20 hover:bg-[#10131c]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-white group-hover:text-[#dc1e1e]">
                        {r.repair_number}
                      </span>
                      {renderStatusPill(r)}
                    </div>
                    <div className="mt-1 text-sm text-[#b4b8c4]">
                      {r.device_name} · {r.client_name}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
                      {r.priority_display}
                    </span>
                    <span className="text-[#9ca3af] group-hover:text-white">→</span>
                  </div>
                </div>
              </Link>
            ))}
            {(items?.length ?? 0) > sliced.length && (
              <div className="pt-1 text-[11px] text-[#9ca3af]">
                +{(items!.length - sliced.length).toString()} kolejnych.
                {action ? (
                  <>
                    {" "}
                    Przejdź do{" "}
                    <Link href={action.href} className="text-[#f97316] underline">
                      {action.label}
                    </Link>
                  </>
                ) : null}
              </div>
            )}
          </div>
        )}
      </section>
    );
  };

  return (
    <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-8">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-[#9ca3af]">
              Pracownik · {userFirstName}{" "}
              <span
                className="ml-2 inline-block h-2 w-2 rounded-full bg-[#22c55e]"
                style={{ boxShadow: "0 0 18px rgba(34,197,94,.45)", animation: "pulse 1.6s ease-in-out infinite" }}
              />
            </p>
            <h1 className="mt-2 text-[28px] font-semibold text-white" style={{ fontFamily: "var(--font-unbounded)" }}>
              Dzień dobry, {userFirstName}.
            </h1>
            <p className="mt-1 text-sm text-[#9ca3af]">{subtitleByScope}</p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0c0d12] px-4 py-2.5 text-sm">
                <span className="inline-flex items-center justify-center">
                  {isRefreshing ? (
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#3b82f6] border-t-transparent" />
                  ) : (
                    <Clock4 size={16} className="text-[#3b82f6]" />
                  )}
                </span>
                <span className="text-[#9ca3af]">Auto-refresh za</span>
                <span className="font-semibold text-white">{countdown}s</span>
                <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-[#22c55e]" style={{ boxShadow: "0 0 18px rgba(34,197,94,.45)" }} />
              </div>

              <button
                type="button"
                onClick={manualRefresh}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white disabled:opacity-60"
                disabled={loading}
              >
                <span className="inline-flex items-center gap-2">
                  <RotateCcw size={16} />
                  Odśwież
                </span>
              </button>

              <Link href="/panel/intake" className="rounded-2xl bg-[#dc1e1e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b81818]">
                Nowe przyjęcie
              </Link>
            </div>
          </div>
        </header>

        {error && !loading ? <p className="text-sm text-[#fca5a5]">{error}</p> : null}

        <ScopeBar value={scope} onChange={setScope} />

        <section className="rounded-3xl border border-white/10 bg-[#0f1117] p-3">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              {
                label: "Aktywnych",
                value: data && !loading ? (data.my_new.length + data.my_urgent.length + data.today_to_contact.length + (data.my_in_progress?.length ?? 0) + (data.my_overdue?.length ?? 0) + (data.without_update?.length ?? 0)) : null,
                accent: "#f59e0b",
                delay: "0ms",
              },
              {
                label: "Pilna / SLA",
                value: data && !loading ? data.my_urgent.length : null,
                accent: "#dc1e1e",
                delay: "80ms",
              },
              {
                label: "Gotowe",
                value: !loading ? (data?.ready_for_pickup?.length ?? 0) : null,
                accent: "#22c55e",
                delay: "160ms",
              },
              {
                label: "Wiadomości",
                value: !loading ? (requiresAction?.length ?? 0) : null,
                accent: "#3b82f6",
                delay: "240ms",
              },
              {
                label: "Zakończonych",
                value: !loading ? (data?.ready_for_pickup?.length ?? 0) : null,
                accent: "#22c55e",
                delay: "320ms",
              },
            ].map((s) => (
              <motion.div
                key={`${s.label}-${s.value ?? "load"}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="cursor-default transition-transform hover:-translate-y-0.5"
              >
                <SummaryCard label={s.label} value={s.value as number | null} accent={s.accent} />
              </motion.div>
            ))}
          </div>
        </section>

        <section
          ref={requiresActionSectionRef}
          id="requires-action"
          className="scroll-mt-24 rounded-3xl border border-white/10 bg-[#0f1117] p-5"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#3b82f6]/30 bg-[#3b82f6]/10">
                <Zap size={18} className="text-[#3b82f6]" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3b82f6]">Następne działania</div>
                <h2 className="mt-1 text-lg font-semibold text-white">Co teraz robić?</h2>
              </div>
            </div>
            <Link href="/panel/naprawy" className="text-sm font-semibold text-[#3b82f6] hover:underline">
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
              const blocker = blockerText(r);
              const sb = statusBadge(r);
              return (
                <Link
                  key={r.id}
                  href={`/panel/naprawy/${r.id}`}
                  className="group relative rounded-2xl border border-white/10 bg-[#0c0d12] p-4 transition hover:translate-x-0.5 hover:bg-white/5 hover:border-white/20"
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
                      className="font-mono text-xs font-semibold text-[#9ca3af]"
                      style={{ minWidth: 72 }}
                    >
                      {r.repair_number}
                    </span>
                  </div>

                  <div className="mt-2 text-sm font-semibold text-white">{r.device_name}</div>
                  <div className="mt-1 text-xs text-[#9ca3af]">{r.status_display}</div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
                      style={{ background: sb.bg, borderColor: sb.border, color: sb.text }}
                    >
                      {sb.label}
                    </span>
                    {blocker ? (
                      <span className="rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#f59e0b]">
                        {blocker}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#9ca3af] group-hover:text-white">
                    {action.text}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <section className="worker-card-shimmer rounded-3xl border border-white/10 bg-[#0f1117] p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">Moje naprawy</div>
                  <h2 className="mt-1 text-lg font-semibold text-white">
                    {scope === "today" ? "Dziś" : scope === "tomorrow" ? "Jutro" : scope === "week" ? "Ten tydzień" : "Ten miesiąc"}
                  </h2>
                </div>
                <Link href="/panel/naprawy" className="text-sm font-semibold text-[#3b82f6] hover:underline">
                  Wszystkie
                </Link>
              </div>

              <div className="mt-4 divide-y divide-white/10 rounded-2xl border border-white/10 bg-[#0c0d12]">
                {(loading
                  ? Array.from({ length: 4 })
                  : [
                      ...(scope === "today" ? (data?.my_new ?? []) : []),
                      ...(scope === "today" ? (data?.today_to_contact ?? []) : []),
                      ...(scope === "today" ? (data?.my_urgent ?? []) : []),
                      ...(scope === "tomorrow" ? (data?.today_to_contact ?? []) : []),
                      ...(scope === "tomorrow" ? (data?.my_urgent ?? []) : []),
                      ...(scope === "week" ? (data?.my_in_progress ?? []) : []),
                      ...(scope === "week" ? (data?.my_overdue ?? []) : []),
                      ...(scope === "month" ? (data?.without_update ?? []) : []),
                    ]
                ).slice(0, 4).map((r: any, idx: number) =>
                  loading ? (
                    <div key={idx} className="h-[62px] animate-pulse px-4 py-3">
                      <div className="h-3 w-24 rounded bg-white/10" />
                      <div className="mt-2 h-3 w-48 rounded bg-white/10" />
                    </div>
                  ) : (
                    <Link
                      key={r.id}
                      href={`/panel/naprawy/${r.id}`}
                      className="group flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-white/5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-[#9ca3af]">{r.repair_number}</span>
                          <span className="h-7 w-7 rounded-xl bg-[#191d28] border border-white/10" />
                          <span className="min-w-0 truncate text-sm font-semibold text-white">{r.device_name}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#9ca3af]">
                          <span>{r.client_name}</span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-semibold uppercase tracking-wide text-[10px] text-[#9ca3af]">
                            {nextAction(r).text.replace("▶ ", "")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
                          {statusBadge(r).label}
                        </span>
                      </div>
                    </Link>
                  ),
                )}
              </div>
            </section>
          </div>

          <div className="space-y-4 lg:col-span-5">
            <section className="rounded-3xl border border-white/10 bg-[#0f1117] p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">Zadania</div>
                  <h2 className="mt-1 text-lg font-semibold text-white">Dziś</h2>
                </div>
                <Link href="/panel/tasks" className="text-sm font-semibold text-[#3b82f6] hover:underline">
                  Wszystkie
                </Link>
              </div>
              <div className="mt-4 space-y-2">
                {tasksQuery.isLoading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="h-[58px] animate-pulse rounded-2xl border border-white/10 bg-[#0c0d12]" />
                  ))
                ) : tasksQuery.error ? (
                  <p className="text-sm text-[#fca5a5]">Nie udało się pobrać zadań.</p>
                ) : (tasksQuery.data ?? []).slice(0, 3).length === 0 ? (
                  <p className="text-sm text-[#6b7280]">Brak zadań w tym widoku.</p>
                ) : (
                  (tasksQuery.data ?? []).slice(0, 3).map((t: any) => (
                    <div key={t.id} className="rounded-2xl border border-white/10 bg-[#0c0d12] px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-white truncate">{t.title}</span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
                          {t.priority_display ?? "—"}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-[#9ca3af]">
                        Zakończone: {t.completed_at ? "tak" : "nie"} {t.due_date ? `· ${new Date(t.due_date).toLocaleDateString("pl-PL")}` : ""}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#0f1117] p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">Wiadomości</div>
                  <h2 className="mt-1 text-lg font-semibold text-white">Najnowsze</h2>
                </div>
                <Link href="/panel/comm" className="text-sm font-semibold text-[#3b82f6] hover:underline">
                  Wszystkie
                </Link>
              </div>
              <div className="mt-4 space-y-2">
                {commLogsQuery.isLoading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="h-[64px] animate-pulse rounded-2xl border border-white/10 bg-[#0c0d12]" />
                  ))
                ) : (
                  (commLogsQuery.data ?? []).map((l: any) => (
                    <Link
                      key={l.id}
                      href={l.repair ? `/panel/naprawy/${l.repair}` : "/panel/comm"}
                      className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0c0d12] px-4 py-3 transition hover:bg-white/5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3b82f6]/15 border border-[#3b82f6]/30 text-sm font-bold text-[#bcd6ff]">
                          {(l.recipient ?? "?").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-white">{l.subject ?? "Wiadomość"}</div>
                          <div className="mt-0.5 truncate text-xs text-[#9ca3af]">{l.repair_number ?? ""}</div>
                        </div>
                      </div>
                      <div className="shrink-0 text-xs text-[#9ca3af]">
                        {l.sent_at ? new Date(l.sent_at).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }) : ""}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#0f1117] p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">Zespół dziś</div>
                  <h2 className="mt-1 text-lg font-semibold text-white">Status</h2>
                </div>
                <Link href="/panel/availability" className="text-sm font-semibold text-[#3b82f6] hover:underline">
                  Szczegóły
                </Link>
              </div>

              <div className="mt-4 space-y-2">
                {teamAvailabilityQuery.isLoading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="h-[64px] animate-pulse rounded-2xl border border-white/10 bg-[#0c0d12]" />
                  ))
                ) : (teamAvailabilityQuery.data?.entries ?? []).slice(0, 3).map((e: any) => {
                  const lower = (e.availability_type_display ?? "").toLowerCase();
                  const dotColor = lower.includes("dostęp") ? "#22c55e" : lower.includes("niedost") ? "#f59e0b" : "#f97316";
                  const name = e.employee_name ?? e.employee ?? "—";
                  return (
                    <div key={e.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0c0d12] px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-sm font-bold text-white">
                          {(String(name).slice(0, 2) || "?").toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-white">{name}</div>
                          <div className="mt-0.5 truncate text-xs text-[#9ca3af]">{e.availability_type_display ?? "—"}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: dotColor, boxShadow: `0 0 18px ${dotColor}` }} />
                      </div>
                    </div>
                  );
                })}
                {teamAvailabilityQuery.data && (teamAvailabilityQuery.data?.entries ?? []).length === 0 ? (
                  <p className="text-sm text-[#6b7280]">Brak wpisów dostępności na dziś.</p>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function StaffDashboardPageWithSuspense() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-8">
          <div className="h-10 w-48 animate-pulse rounded-xl bg-white/10" />
          <div className="mt-6 h-40 animate-pulse rounded-3xl border border-white/10 bg-[#0f1117]" />
        </main>
      }
    >
      <StaffDashboardPage />
    </Suspense>
  );
}
