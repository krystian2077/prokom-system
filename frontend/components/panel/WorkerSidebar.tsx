"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Bell,
  MessageSquareText,
  History,
  ChevronRight,
  LogOut,
  CircleUserRound,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { RepairRequestListItem } from "@/types/repairs";

export function WorkerSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, token, logout } = useAuth();

  const panelUser = user && ["staff", "admin"].includes(user.role) ? user : null;

  // Badge counts (minimal, non-blocking)
  const dashboardCountsQuery = useQuery({
    queryKey: ["sidebar", "dashboard-buckets"],
    enabled: Boolean(token && panelUser),
    queryFn: async () => {
      if (!token) return null;
      // Staff dashboard buckets — zgodnie z dokumentacją (§8.1) i implementacją /panel/dashboard
      const dashboardRes = await api.get<any>(`/staff/dashboard/?days_without_update=3&recent_limit=10`, token);
      return {
        my_new: dashboardRes?.my_new ?? [],
        my_urgent: dashboardRes?.my_urgent ?? [],
        today_to_contact: dashboardRes?.today_to_contact ?? [],
        my_in_progress: dashboardRes?.my_in_progress ?? [],
        my_overdue: dashboardRes?.my_overdue ?? [],
        ready_for_pickup: dashboardRes?.ready_for_pickup ?? [],
        without_update: dashboardRes?.without_update ?? [],
      } as {
        my_new: RepairRequestListItem[];
        my_urgent: RepairRequestListItem[];
        today_to_contact: RepairRequestListItem[];
        my_in_progress: RepairRequestListItem[];
        my_overdue: RepairRequestListItem[];
        ready_for_pickup: RepairRequestListItem[];
        without_update: RepairRequestListItem[];
      };
    },
    staleTime: 15_000,
  });

  const requiresActionCountQuery = useQuery({
    queryKey: ["sidebar", "requires-action", user?.id, user?.role],
    enabled: Boolean(token && panelUser?.id),
    queryFn: async () => {
      if (!token || !panelUser?.id) return 0;
      const res = await api.get<any>(`/accounts/notifications/requires-action/`, token);
      if (typeof res?.count === "number") return res.count as number;
      if (Array.isArray(res?.items)) return res.items.length as number;
      return 0;
    },
    staleTime: 15_000,
  });

  const unassignedCountQuery = useQuery({
    queryKey: ["sidebar", "unassigned-count"],
    enabled: Boolean(token && panelUser),
    queryFn: async () => {
      if (!token) return 0;
      const rows = await api.get<RepairRequestListItem[]>(
        `/staff/repairs/?unassigned_only=1&status=new&ordering=created_at`,
        token,
      );
      return (rows ?? []).length;
    },
    staleTime: 15_000,
  });

  const myActiveCount = useMemo(() => {
    const d = dashboardCountsQuery.data;
    if (!d) return null;
    const active = (d.my_new?.length ?? 0) + (d.my_urgent?.length ?? 0) + (d.today_to_contact?.length ?? 0) + (d.my_in_progress?.length ?? 0) + (d.my_overdue?.length ?? 0) + (d.without_update?.length ?? 0);
    return active;
  }, [dashboardCountsQuery.data]);

  const requiresActionCount = (requiresActionCountQuery.data ?? 0) as number;
  const unassignedCount = unassignedCountQuery.data ?? null;
  const requiresActionNavActive = pathname === "/panel/dashboard" && searchParams.get("focus") === "requires-action";

  const notifBadgeCountQuery = useQuery({
    queryKey: ["sidebar", "notif-count"],
    enabled: Boolean(token && panelUser),
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/accounts/notifications/requires-action/`,
        { headers: token ? { Authorization: `Token ${token}` } : {} },
      );
      if (!res.ok) return 0;
      const data = await res.json();
      if (typeof data?.count === "number") return data.count;
      if (Array.isArray(data?.items)) return data.items.length;
      return 0;
    },
    staleTime: 15_000,
  });

  const notifBadgeCount = (notifBadgeCountQuery.data ?? 0) as number;

  const handleLogout = async () => {
    await logout();
    window.location.href = "/panel/login";
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside
      className="relative z-[120] hidden w-[248px] flex-col border-r border-white/5 bg-[#0f1117] md:flex"
    >
      <div className="pointer-events-none absolute right-0 top-0 h-full w-[2px] bg-[#3b82f6]/70" />

      <div className="px-5 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[13px] font-bold tracking-[0.2em] text-[#9ca3af]">PRO-KOM</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold"
                style={{
                  background: "rgba(59,130,246,.14)",
                  borderColor: "rgba(59,130,246,.35)",
                  color: "#bfdbfe",
                }}
              >
                <span
                  className="h-2 w-2 rounded-full bg-[#3b82f6]"
                  style={{ boxShadow: "0 0 14px rgba(59,130,246,.55)", animation: "statusPulse 1.6s ease infinite" }}
                />
                Panel Pracownika
              </span>
            </div>
          </div>
          <span
            className="h-9 w-9 shrink-0 rounded-full"
            style={{
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              display: "inline-block",
              boxShadow: "0 0 22px rgba(59,130,246,.35)",
            }}
          />
        </div>
      </div>

      <nav className="mt-6 flex-1 overflow-auto px-3 pb-6">
        <div className="space-y-5">
          <div>
            <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b93a8]">Skróty</div>

            <div className="space-y-1">
              <Link
                href="/panel/dashboard"
                className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition"
                style={{
                  background: isActive("/panel/dashboard") ? "rgba(59,130,246,.12)" : "transparent",
                  color: isActive("/panel/dashboard") ? "#fff" : "rgba(208,212,222,.9)",
                  borderLeft: isActive("/panel/dashboard") ? "3px solid #3b82f6" : "3px solid transparent",
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{
                      background: isActive("/panel/dashboard") ? "rgba(59,130,246,.18)" : "rgba(255,255,255,.03)",
                      border: isActive("/panel/dashboard") ? "1px solid rgba(59,130,246,.35)" : "1px solid rgba(255,255,255,.06)",
                    }}
                  >
                    <History size={18} />
                  </span>
                  <span className="text-sm font-semibold">Dashboard</span>
                </div>
                <span className={isActive("/panel/dashboard") ? "h-2 w-2 rounded-full bg-[#3b82f6]" : "h-2 w-2 rounded-full bg-white/10"} />
              </Link>

              <Link
                href="/panel/naprawy"
                className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition"
                style={{
                  background:
                    pathname.startsWith("/panel/repairs") ||
                    pathname.startsWith("/panel/naprawy") ||
                    pathname.startsWith("/panel/zgloszenia")
                      ? "rgba(59,130,246,.12)"
                      : "transparent",
                  color:
                    pathname.startsWith("/panel/repairs") ||
                    pathname.startsWith("/panel/naprawy") ||
                    pathname.startsWith("/panel/zgloszenia")
                      ? "#fff"
                      : "rgba(208,212,222,.9)",
                  borderLeft:
                    pathname.startsWith("/panel/repairs") ||
                    pathname.startsWith("/panel/naprawy") ||
                    pathname.startsWith("/panel/zgloszenia")
                      ? "3px solid #3b82f6"
                      : "3px solid transparent",
                }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{
                      background:
                        pathname.startsWith("/panel/repairs") ||
                        pathname.startsWith("/panel/naprawy") ||
                        pathname.startsWith("/panel/zgloszenia")
                          ? "rgba(59,130,246,.18)"
                          : "rgba(255,255,255,.03)",
                      border:
                        pathname.startsWith("/panel/repairs") ||
                        pathname.startsWith("/panel/naprawy") ||
                        pathname.startsWith("/panel/zgloszenia")
                          ? "1px solid rgba(59,130,246,.35)"
                          : "1px solid rgba(255,255,255,.06)",
                    }}
                  >
                    <ChevronRight size={18} />
                  </span>
                  <span className="truncate text-sm font-semibold">Moje naprawy</span>
                </div>
                <span
                  className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-[#9ca3af]"
                  style={{
                    color: "white",
                    borderColor: "rgba(59,130,246,.35)",
                    background: "rgba(59,130,246,.14)",
                  }}
                >
                  {myActiveCount ?? "…"}
                </span>
              </Link>

              <Link
                href="/panel/nieprzypisane"
                className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition"
                style={{
                  background:
                    pathname.startsWith("/panel/nieprzypisane") || pathname.startsWith("/panel/unassigned")
                      ? "rgba(59,130,246,.12)"
                      : "transparent",
                  color:
                    pathname.startsWith("/panel/nieprzypisane") || pathname.startsWith("/panel/unassigned")
                      ? "#fff"
                      : "rgba(208,212,222,.9)",
                  borderLeft:
                    pathname.startsWith("/panel/nieprzypisane") || pathname.startsWith("/panel/unassigned")
                      ? "3px solid #3b82f6"
                      : "3px solid transparent",
                }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{
                      background:
                        pathname.startsWith("/panel/nieprzypisane") || pathname.startsWith("/panel/unassigned")
                          ? "rgba(59,130,246,.18)"
                          : "rgba(255,255,255,.03)",
                      border:
                        pathname.startsWith("/panel/nieprzypisane") || pathname.startsWith("/panel/unassigned")
                          ? "1px solid rgba(59,130,246,.35)"
                          : "1px solid rgba(255,255,255,.06)",
                    }}
                  >
                    <Users size={18} />
                  </span>
                  <span className="truncate text-sm font-semibold">Nieprzypisane</span>
                </div>
                <span
                  className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-[#9ca3af]"
                  style={{
                    color: "white",
                    borderColor: "rgba(59,130,246,.35)",
                    background: "rgba(59,130,246,.14)",
                  }}
                >
                  {unassignedCount ?? "…"}
                </span>
              </Link>

              <Link
                href="/panel/wszystkie"
                className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition"
                style={{
                  background:
                    pathname.startsWith("/panel/all-repairs") || pathname.startsWith("/panel/wszystkie")
                      ? "rgba(59,130,246,.12)"
                      : "transparent",
                  color:
                    pathname.startsWith("/panel/all-repairs") || pathname.startsWith("/panel/wszystkie")
                      ? "#fff"
                      : "rgba(208,212,222,.9)",
                  borderLeft:
                    pathname.startsWith("/panel/all-repairs") || pathname.startsWith("/panel/wszystkie")
                      ? "3px solid #3b82f6"
                      : "3px solid transparent",
                }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{
                      background:
                        pathname.startsWith("/panel/all-repairs") || pathname.startsWith("/panel/wszystkie")
                          ? "rgba(59,130,246,.18)"
                          : "rgba(255,255,255,.03)",
                      border:
                        pathname.startsWith("/panel/all-repairs") || pathname.startsWith("/panel/wszystkie")
                          ? "1px solid rgba(59,130,246,.35)"
                          : "1px solid rgba(255,255,255,.06)",
                    }}
                  >
                    <History size={18} />
                  </span>
                  <span className="truncate text-sm font-semibold">Wszystkie naprawy</span>
                </div>
                <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-[#9ca3af]">—</span>
              </Link>

              <Link
                href="/panel/historia"
                className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition"
                style={{
                  background:
                    pathname.startsWith("/panel/historia") || pathname.startsWith("/panel/archive")
                      ? "rgba(59,130,246,.12)"
                      : "transparent",
                  color:
                    pathname.startsWith("/panel/historia") || pathname.startsWith("/panel/archive")
                      ? "#fff"
                      : "rgba(208,212,222,.9)",
                  borderLeft:
                    pathname.startsWith("/panel/historia") || pathname.startsWith("/panel/archive")
                      ? "3px solid #3b82f6"
                      : "3px solid transparent",
                }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{
                      background:
                        pathname.startsWith("/panel/historia") || pathname.startsWith("/panel/archive")
                          ? "rgba(59,130,246,.18)"
                          : "rgba(255,255,255,.03)",
                      border:
                        pathname.startsWith("/panel/historia") || pathname.startsWith("/panel/archive")
                          ? "1px solid rgba(59,130,246,.35)"
                          : "1px solid rgba(255,255,255,.06)",
                    }}
                  >
                    <History size={18} />
                  </span>
                  <span className="truncate text-sm font-semibold">Historia napraw</span>
                </div>
                <span
                  className={
                    pathname.startsWith("/panel/historia") || pathname.startsWith("/panel/archive")
                      ? "h-2 w-2 rounded-full bg-[#3b82f6]"
                      : "h-2 w-2 rounded-full bg-white/10"
                  }
                />
              </Link>
            </div>
          </div>

          <div>
            <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b93a8]">Kolejka</div>

            <div className="space-y-1">
              <Link
                href="/panel/dashboard?focus=requires-action"
                className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition"
                style={{
                  background: requiresActionNavActive ? "rgba(59,130,246,.12)" : "transparent",
                  color: requiresActionNavActive ? "#fff" : "rgba(208,212,222,.9)",
                  borderLeft: requiresActionNavActive ? "3px solid #3b82f6" : "3px solid transparent",
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{
                      background: requiresActionNavActive ? "rgba(59,130,246,.18)" : "rgba(255,255,255,.03)",
                      border: requiresActionNavActive ? "1px solid rgba(59,130,246,.35)" : "1px solid rgba(255,255,255,.06)",
                    }}
                  >
                    <Bell size={18} />
                  </span>
                  <span className="text-sm font-semibold">Wymaga reakcji</span>
                </div>
                <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold" style={{ borderColor: "rgba(59,130,246,.35)", background: "rgba(59,130,246,.14)", color: "#fff" }}>
                  {requiresActionCount ?? "…"}
                </span>
              </Link>

              <Link
                href="/panel/powiadomienia"
                className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition"
                style={{
                  background: pathname.startsWith("/panel/powiadomienia") ? "rgba(59,130,246,.12)" : "transparent",
                  color: pathname.startsWith("/panel/powiadomienia") ? "#fff" : "rgba(208,212,222,.9)",
                  borderLeft: pathname.startsWith("/panel/powiadomienia") ? "3px solid #3b82f6" : "3px solid transparent",
                }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{
                      background: pathname.startsWith("/panel/powiadomienia") ? "rgba(59,130,246,.18)" : "rgba(255,255,255,.03)",
                      border: pathname.startsWith("/panel/powiadomienia") ? "1px solid rgba(59,130,246,.35)" : "1px solid rgba(255,255,255,.06)",
                    }}
                  >
                    <Bell size={18} />
                  </span>
                  <span className="truncate text-sm font-semibold">Powiadomienia</span>
                </div>
                <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold" style={{ borderColor: "rgba(59,130,246,.35)", background: "rgba(59,130,246,.14)", color: "#fff" }}>
                  {notifBadgeCount ?? "…"}
                </span>
              </Link>
            </div>
          </div>

          <div>
            <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b93a8]">Panel</div>
            <div className="space-y-1">
              <Link
                href="/panel/intake"
                className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition"
                style={{
                  background: pathname.startsWith("/panel/intake") ? "rgba(59,130,246,.12)" : "transparent",
                  color: pathname.startsWith("/panel/intake") ? "#fff" : "rgba(208,212,222,.9)",
                  borderLeft: pathname.startsWith("/panel/intake") ? "3px solid #3b82f6" : "3px solid transparent",
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: pathname.startsWith("/panel/intake") ? "rgba(59,130,246,.18)" : "rgba(255,255,255,.03)", border: pathname.startsWith("/panel/intake") ? "1px solid rgba(59,130,246,.35)" : "1px solid rgba(255,255,255,.06)" }}>
                    <CircleUserRound size={18} />
                  </span>
                  <span className="text-sm font-semibold">Przyjęcie</span>
                </div>
                <span className={pathname.startsWith("/panel/intake") ? "h-2 w-2 rounded-full bg-[#3b82f6]" : "h-2 w-2 rounded-full bg-white/10"} />
              </Link>

              <Link
                href="/panel/comm"
                className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition"
                style={{
                  background: pathname.startsWith("/panel/comm") ? "rgba(59,130,246,.12)" : "transparent",
                  color: pathname.startsWith("/panel/comm") ? "#fff" : "rgba(208,212,222,.9)",
                  borderLeft: pathname.startsWith("/panel/comm") ? "3px solid #3b82f6" : "3px solid transparent",
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: pathname.startsWith("/panel/comm") ? "rgba(59,130,246,.18)" : "rgba(255,255,255,.03)", border: pathname.startsWith("/panel/comm") ? "1px solid rgba(59,130,246,.35)" : "1px solid rgba(255,255,255,.06)" }}>
                    <MessageSquareText size={18} />
                  </span>
                  <span className="text-sm font-semibold">Komunikacja</span>
                </div>
                <span className={pathname.startsWith("/panel/comm") ? "h-2 w-2 rounded-full bg-[#3b82f6]" : "h-2 w-2 rounded-full bg-white/10"} />
              </Link>

              <Link
                href="/panel/zadania"
                className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition"
                style={{
                  background:
                    pathname.startsWith("/panel/zadania") || pathname.startsWith("/panel/tasks")
                      ? "rgba(59,130,246,.12)"
                      : "transparent",
                  color:
                    pathname.startsWith("/panel/zadania") || pathname.startsWith("/panel/tasks")
                      ? "#fff"
                      : "rgba(208,212,222,.9)",
                  borderLeft:
                    pathname.startsWith("/panel/zadania") || pathname.startsWith("/panel/tasks")
                      ? "3px solid #3b82f6"
                      : "3px solid transparent",
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{
                      background:
                        pathname.startsWith("/panel/zadania") || pathname.startsWith("/panel/tasks")
                          ? "rgba(59,130,246,.18)"
                          : "rgba(255,255,255,.03)",
                      border:
                        pathname.startsWith("/panel/zadania") || pathname.startsWith("/panel/tasks")
                          ? "1px solid rgba(59,130,246,.35)"
                          : "1px solid rgba(255,255,255,.06)",
                    }}
                  >
                    <Users size={18} />
                  </span>
                  <span className="text-sm font-semibold">Zadania</span>
                </div>
                <span
                  className={
                    pathname.startsWith("/panel/zadania") || pathname.startsWith("/panel/tasks")
                      ? "h-2 w-2 rounded-full bg-[#3b82f6]"
                      : "h-2 w-2 rounded-full bg-white/10"
                  }
                />
              </Link>

              <Link
                href="/panel/wyszukiwanie"
                className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition"
                style={{
                  background:
                    pathname.startsWith("/panel/wyszukiwanie") || pathname.startsWith("/panel/search")
                      ? "rgba(59,130,246,.12)"
                      : "transparent",
                  color:
                    pathname.startsWith("/panel/wyszukiwanie") || pathname.startsWith("/panel/search")
                      ? "#fff"
                      : "rgba(208,212,222,.9)",
                  borderLeft:
                    pathname.startsWith("/panel/wyszukiwanie") || pathname.startsWith("/panel/search")
                      ? "3px solid #3b82f6"
                      : "3px solid transparent",
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{
                      background:
                        pathname.startsWith("/panel/wyszukiwanie") || pathname.startsWith("/panel/search")
                          ? "rgba(59,130,246,.18)"
                          : "rgba(255,255,255,.03)",
                      border:
                        pathname.startsWith("/panel/wyszukiwanie") || pathname.startsWith("/panel/search")
                          ? "1px solid rgba(59,130,246,.35)"
                          : "1px solid rgba(255,255,255,.06)",
                    }}
                  >
                    <ChevronRight size={18} />
                  </span>
                  <span className="text-sm font-semibold">Wyszukiwanie</span>
                </div>
                <span
                  className={
                    pathname.startsWith("/panel/wyszukiwanie") || pathname.startsWith("/panel/search")
                      ? "h-2 w-2 rounded-full bg-[#3b82f6]"
                      : "h-2 w-2 rounded-full bg-white/10"
                  }
                />
              </Link>

              <Link
                href="/panel/reklamacje"
                className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition"
                style={{
                  background:
                    pathname.startsWith("/panel/reklamacje") ||
                    pathname.startsWith("/panel/reklamacje-gwarancje") ||
                    pathname.startsWith("/panel/claims")
                      ? "rgba(59,130,246,.12)"
                      : "transparent",
                  color:
                    pathname.startsWith("/panel/reklamacje") ||
                    pathname.startsWith("/panel/reklamacje-gwarancje") ||
                    pathname.startsWith("/panel/claims")
                      ? "#fff"
                      : "rgba(208,212,222,.9)",
                  borderLeft:
                    pathname.startsWith("/panel/reklamacje") ||
                    pathname.startsWith("/panel/reklamacje-gwarancje") ||
                    pathname.startsWith("/panel/claims")
                      ? "3px solid #3b82f6"
                      : "3px solid transparent",
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{
                      background:
                        pathname.startsWith("/panel/reklamacje") ||
                        pathname.startsWith("/panel/reklamacje-gwarancje") ||
                        pathname.startsWith("/panel/claims")
                          ? "rgba(59,130,246,.18)"
                          : "rgba(255,255,255,.03)",
                      border:
                        pathname.startsWith("/panel/reklamacje") ||
                        pathname.startsWith("/panel/reklamacje-gwarancje") ||
                        pathname.startsWith("/panel/claims")
                          ? "1px solid rgba(59,130,246,.35)"
                          : "1px solid rgba(255,255,255,.06)",
                    }}
                  >
                    <Bell size={18} />
                  </span>
                  <span className="text-sm font-semibold">Reklamacje</span>
                </div>
                <span
                  className={
                    pathname.startsWith("/panel/reklamacje") ||
                    pathname.startsWith("/panel/reklamacje-gwarancje") ||
                    pathname.startsWith("/panel/claims")
                      ? "h-2 w-2 rounded-full bg-[#3b82f6]"
                      : "h-2 w-2 rounded-full bg-white/10"
                  }
                />
              </Link>

              <Link
                href="/panel/czesci-hurtownie"
                className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition"
                style={{
                  background:
                    pathname.startsWith("/panel/czesci-hurtownie") || pathname.startsWith("/panel/parts")
                      ? "rgba(59,130,246,.12)"
                      : "transparent",
                  color:
                    pathname.startsWith("/panel/czesci-hurtownie") || pathname.startsWith("/panel/parts")
                      ? "#fff"
                      : "rgba(208,212,222,.9)",
                  borderLeft:
                    pathname.startsWith("/panel/czesci-hurtownie") || pathname.startsWith("/panel/parts")
                      ? "3px solid #3b82f6"
                      : "3px solid transparent",
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{
                      background:
                        pathname.startsWith("/panel/czesci-hurtownie") || pathname.startsWith("/panel/parts")
                          ? "rgba(59,130,246,.18)"
                          : "rgba(255,255,255,.03)",
                      border:
                        pathname.startsWith("/panel/czesci-hurtownie") || pathname.startsWith("/panel/parts")
                          ? "1px solid rgba(59,130,246,.35)"
                          : "1px solid rgba(255,255,255,.06)",
                    }}
                  >
                    <Users size={18} />
                  </span>
                  <span className="text-sm font-semibold">Części</span>
                </div>
                <span
                  className={
                    pathname.startsWith("/panel/czesci-hurtownie") || pathname.startsWith("/panel/parts")
                      ? "h-2 w-2 rounded-full bg-[#3b82f6]"
                      : "h-2 w-2 rounded-full bg-white/10"
                  }
                />
              </Link>

              <Link
                href="/panel/calendar"
                className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition"
                style={{
                  background: pathname.startsWith("/panel/calendar") ? "rgba(59,130,246,.12)" : "transparent",
                  color: pathname.startsWith("/panel/calendar") ? "#fff" : "rgba(208,212,222,.9)",
                  borderLeft: pathname.startsWith("/panel/calendar") ? "3px solid #3b82f6" : "3px solid transparent",
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: pathname.startsWith("/panel/calendar") ? "rgba(59,130,246,.18)" : "rgba(255,255,255,.03)", border: pathname.startsWith("/panel/calendar") ? "1px solid rgba(59,130,246,.35)" : "1px solid rgba(255,255,255,.06)" }}>
                    <History size={18} />
                  </span>
                  <span className="text-sm font-semibold">Kalendarz</span>
                </div>
                <span className={pathname.startsWith("/panel/calendar") ? "h-2 w-2 rounded-full bg-[#3b82f6]" : "h-2 w-2 rounded-full bg-white/10"} />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="border-t border-white/5 p-4 pb-5">
        <Link href="/panel/profil" className="flex items-center gap-3 rounded-2xl transition hover:bg-white/5">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-white"
            style={{ boxShadow: "0 0 26px rgba(59,130,246,.12)" }}
          >
            {(user?.full_name ?? user?.email ?? "?")[0]?.toUpperCase() ?? "?"}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">{user?.full_name || user?.email || "—"}</div>
            <div className="truncate text-xs text-[#9ca3af]">{user?.role === "admin" ? "Admin" : "Pracownik"} · Profil</div>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => void handleLogout()}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
        >
          <LogOut size={16} />
          Wyloguj
        </button>
      </div>
    </aside>
  );
}

