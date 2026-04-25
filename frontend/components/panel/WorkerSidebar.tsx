"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Archive,
  Boxes,
  CalendarDays,
  PlusCircle,
  Search,
  Truck,
  Wrench,
  Users,
  Bell,
  MessageSquareText,
  History,
  ChevronRight,
  LogOut,
  ClipboardList,
  Warehouse,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { RepairRequestListItem } from "@/types/repairs";
import { navIconShell, navRowClass } from "@/components/panel/staffSidebarNavStyles";

function sectionTitle(text: string) {
  return (
    <div className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">{text}</div>
  );
}

function dotActive(active: boolean) {
  return (
    <span
      className={
        active
          ? "h-2 w-2 shrink-0 rounded-full bg-[var(--blue)] shadow-[0_0_10px_rgba(59,130,246,.7)] transition-shadow group-hover:shadow-[0_0_14px_rgba(59,130,246,.85)]"
          : "h-2 w-2 shrink-0 rounded-full bg-[var(--border)] transition-colors group-hover:bg-[var(--blue)]/50"
      }
    />
  );
}

function countBadge(n: number | null) {
  return (
    <span className="shrink-0 rounded-full border border-[var(--bb)] bg-[var(--bl)] px-2 py-0.5 text-[12px] font-semibold text-[var(--white)] shadow-[0_0_12px_-4px_rgba(59,130,246,.35)] transition-all duration-200 group-hover:brightness-110 group-active:scale-95">
      {n ?? "…"}
    </span>
  );
}

export function WorkerSidebar() {
  const pathname = usePathname();
  const { user, token, logout } = useAuth();

  const panelUser = user && ["staff", "admin"].includes(user.role) ? user : null;

  // Badge counts (minimal, non-blocking)
  const dashboardCountsQuery = useQuery({
    queryKey: ["sidebar", "dashboard-buckets"],
    enabled: Boolean(token && panelUser),
    queryFn: async () => {
      if (!token) return null;
      const dashboardRes = await api.get<any>(`/staff/dashboard/?days_without_update=3&recent_limit=1`, token);
      return {
        my_active_count: Number(dashboardRes?.my_active_count ?? 0),
      };
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

  const myActiveCount = dashboardCountsQuery.data?.my_active_count ?? null;

  const unassignedCount = unassignedCountQuery.data ?? null;

  const notifBadgeCountQuery = useQuery({
    queryKey: ["sidebar", "notif-unread-count"],
    enabled: Boolean(token && panelUser),
    queryFn: async () => {
      if (!token) return 0;
      const data = await api.get<{ count?: number }>(`/accounts/notifications/unread-count/`, token);
      return typeof data?.count === "number" ? data.count : 0;
    },
    staleTime: 15_000,
  });

  const notifBadgeCount = (notifBadgeCountQuery.data ?? 0) as number;

  const handleLogout = async () => {
    await logout();
    window.location.href = "/panel/login";
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const repairsActive = pathname.startsWith("/panel/repairs") || pathname.startsWith("/panel/naprawy");
  const zgloszeniaActive = pathname.startsWith("/panel/zgloszenia");
  const unassignedActive = pathname.startsWith("/panel/nieprzypisane") || pathname.startsWith("/panel/unassigned");
  const allRepairsActive = pathname.startsWith("/panel/all-repairs") || pathname.startsWith("/panel/wszystkie");
  const notifActive = pathname.startsWith("/panel/powiadomienia");
  const tasksActive = pathname.startsWith("/panel/zadania") || pathname.startsWith("/panel/tasks");
  const pickupsActive = pathname.startsWith("/panel/odbiory") || pathname.startsWith("/panel/odbior");
  const calendarActive = pathname.startsWith("/panel/kalendarz") || pathname.startsWith("/panel/calendar");
  const teamActive = pathname.startsWith("/panel/zespol") || pathname.startsWith("/panel/team");
  const statsActive = pathname.startsWith("/panel/statystyki") || pathname.startsWith("/panel/stats");

  const partsActive = pathname.startsWith("/panel/czesci-hurtownie") || pathname.startsWith("/panel/parts");
  const searchActive = pathname.startsWith("/panel/wyszukiwanie") || pathname.startsWith("/panel/search");
  const archiveActive = pathname.startsWith("/panel/historia") || pathname.startsWith("/panel/archive");
  const claimsActive =
    (pathname.startsWith("/panel/reklamacje") ||
      pathname.startsWith("/panel/reklamacje-gwarancje") ||
      pathname.startsWith("/panel/claims")) &&
    !pathname.startsWith("/panel/reklamacje-gwarancje/przyjecie");

  return (
    <aside className="relative z-[120] hidden w-[352px] flex-col border-r border-[var(--border)] bg-gradient-to-b from-[var(--s3)] via-[var(--s1)] to-[var(--page)] lg:flex">
      <div className="pointer-events-none absolute right-0 top-0 h-full w-[2px] bg-gradient-to-b from-[#60a5fa] via-[#3b82f6] to-[#1d4ed8] opacity-90 shadow-[0_0_12px_rgba(59,130,246,.45)]" />

      <div className="px-6 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[15px] font-bold tracking-[0.2em] text-[var(--ink2)]">PRO-KOM</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-2 rounded-full border border-[var(--bb)] bg-[var(--bl)] px-3 py-1.5 text-[13px] font-bold text-[var(--blue)] transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
              >
                <span
                  className="h-2 w-2 rounded-full bg-[var(--blue)]"
                  style={{ boxShadow: "0 0 14px rgba(59,130,246,.55)", animation: "statusPulse 1.6s ease infinite" }}
                />
                Panel Pracownika
              </span>
            </div>
          </div>
          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[var(--blue)] to-[var(--blue)] shadow-[0_0_22px_rgba(59,130,246,.35)] ring-1 ring-[var(--border)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_28px_rgba(59,130,246,.5)] hover:ring-[var(--bb)] active:scale-95">
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[var(--white)]/25 to-transparent opacity-60" />
          </span>
        </div>
      </div>

      <nav className="mt-6 flex-1 overflow-auto px-4 pb-6">
        <div className="space-y-5">
          <div>
            {sectionTitle("Główne")}
            <div className="space-y-1">
              <Link href="/panel/dashboard" className={navRowClass(isActive("/panel/dashboard"))}>
                <div className="flex items-center gap-3">
                  <span className={navIconShell(isActive("/panel/dashboard"))}>
                    <History size={20} />
                  </span>
                  <span className="text-base font-semibold">Dashboard</span>
                </div>
                {dotActive(isActive("/panel/dashboard"))}
              </Link>

              <Link href="/panel/naprawy" className={navRowClass(repairsActive)}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className={navIconShell(repairsActive)}>
                    <Wrench size={20} />
                  </span>
                  <span className="text-base font-semibold">Naprawy</span>
                </div>
                {countBadge(myActiveCount)}
              </Link>

              <Link href="/panel/zgloszenia" className={navRowClass(zgloszeniaActive)}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className={navIconShell(zgloszeniaActive)}>
                    <ChevronRight size={20} />
                  </span>
                  <span className="text-base font-semibold">Zgłoszenia</span>
                </div>
                {dotActive(zgloszeniaActive)}
              </Link>

              <Link href="/panel/nieprzypisane" className={navRowClass(unassignedActive)}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className={navIconShell(unassignedActive)}>
                    <ClipboardList size={20} />
                  </span>
                  <span className="text-base font-semibold">Nieprzypisane</span>
                </div>
                {countBadge(unassignedCount)}
              </Link>

              <Link href="/panel/powiadomienia" className={navRowClass(notifActive)}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className={navIconShell(notifActive)}>
                    <Bell size={20} />
                  </span>
                  <span className="text-base font-semibold">Powiadomienia</span>
                </div>
                {countBadge(notifBadgeCount)}
              </Link>

              <Link href="/panel/zadania" className={navRowClass(tasksActive)}>
                <div className="flex items-center gap-3">
                  <span className={navIconShell(tasksActive)}>
                    <Users size={20} />
                  </span>
                  <span className="text-base font-semibold">Zadania</span>
                </div>
                {dotActive(tasksActive)}
              </Link>

              <Link href="/panel/odbiory" className={navRowClass(pickupsActive)}>
                <div className="flex items-center gap-3">
                  <span className={navIconShell(pickupsActive)}>
                    <Truck size={20} />
                  </span>
                  <span className="text-base font-semibold">Odbiory</span>
                </div>
                {dotActive(pickupsActive)}
              </Link>

              <Link href="/panel/kalendarz" className={navRowClass(calendarActive)}>
                <div className="flex items-center gap-3">
                  <span className={navIconShell(calendarActive)}>
                    <CalendarDays size={20} />
                  </span>
                  <span className="text-base font-semibold">Kalendarz</span>
                </div>
                {dotActive(calendarActive)}
              </Link>

              <Link href="/panel/statystyki" className={navRowClass(statsActive)}>
                <div className="flex items-center gap-3">
                  <span className={navIconShell(statsActive)}>
                    <Activity size={20} />
                  </span>
                  <span className="text-base font-semibold">Statystyki</span>
                </div>
                {dotActive(statsActive)}
              </Link>

              <Link href="/panel/wszystkie" className={navRowClass(allRepairsActive)}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className={navIconShell(allRepairsActive)}>
                    <History size={20} />
                  </span>
                  <span className="text-base font-semibold">Wszystkie naprawy</span>
                </div>
                {dotActive(allRepairsActive)}
              </Link>
            </div>
          </div>

          <div>
            {sectionTitle("Panel")}
            <div className="space-y-1">
              <Link href="/panel/czesci-hurtownie" className={navRowClass(partsActive)}>
                <div className="flex items-center gap-3">
                  <span className={navIconShell(partsActive)}>
                    <Boxes size={20} />
                  </span>
                  <span className="text-base font-semibold">Części</span>
                </div>
                {dotActive(partsActive)}
              </Link>

              <Link href="/panel/comm" className={navRowClass(pathname.startsWith("/panel/comm"))}>
                <div className="flex items-center gap-3">
                  <span className={navIconShell(pathname.startsWith("/panel/comm"))}>
                    <MessageSquareText size={20} />
                  </span>
                  <span className="text-base font-semibold">Komunikacja</span>
                </div>
                {dotActive(pathname.startsWith("/panel/comm"))}
              </Link>

              <Link href="/panel/intake" className={navRowClass(pathname.startsWith("/panel/intake"))}>
                <div className="flex items-center gap-3">
                  <span className={navIconShell(pathname.startsWith("/panel/intake"))}>
                    <PlusCircle size={20} />
                  </span>
                  <span className="text-base font-semibold">Przyjęcie Stacjonarne</span>
                </div>
                {dotActive(pathname.startsWith("/panel/intake"))}
              </Link>

              <Link href="/panel/wyszukiwanie" className={navRowClass(searchActive)}>
                <div className="flex items-center gap-3">
                  <span className={navIconShell(searchActive)}>
                    <Search size={20} />
                  </span>
                  <span className="text-base font-semibold">Wyszukiwanie</span>
                </div>
                {dotActive(searchActive)}
              </Link>

              <Link href="/panel/historia" className={navRowClass(archiveActive)}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className={navIconShell(archiveActive)}>
                    <Archive size={20} />
                  </span>
                  <span className="text-base font-semibold">Historia napraw</span>
                </div>
                {dotActive(archiveActive)}
              </Link>

              <Link href="/panel/klienci" className={navRowClass(pathname.startsWith("/panel/klienci"))}>
                <div className="flex items-center gap-3">
                  <span className={navIconShell(pathname.startsWith("/panel/klienci"))}>
                    <Users size={20} />
                  </span>
                  <span className="text-base font-semibold">Klienci</span>
                </div>
                {dotActive(pathname.startsWith("/panel/klienci"))}
              </Link>

              <Link href="/panel/reklamacje" className={navRowClass(claimsActive)}>
                <div className="flex items-center gap-3">
                  <span className={navIconShell(claimsActive)}>
                    <ClipboardList size={20} />
                  </span>
                  <span className="text-base font-semibold">Reklamacje</span>
                </div>
                {dotActive(claimsActive)}
              </Link>
            </div>
          </div>

          <div>
            {sectionTitle("Zarządzanie")}
            <div className="space-y-1">
              <Link href="/panel/zespol" className={navRowClass(teamActive)}>
                <div className="flex items-center gap-3">
                  <span className={navIconShell(teamActive)}>
                    <Users size={20} />
                  </span>
                  <span className="text-base font-semibold">Zespół</span>
                </div>
                {dotActive(teamActive)}
              </Link>

              <Link href="/panel/hurtownie" className={navRowClass(pathname.startsWith("/panel/hurtownie"))}>
                <div className="flex items-center gap-3">
                  <span className={navIconShell(pathname.startsWith("/panel/hurtownie"))}>
                    <Warehouse size={20} />
                  </span>
                  <span className="text-base font-semibold">Hurtownie</span>
                </div>
                {dotActive(pathname.startsWith("/panel/hurtownie"))}
              </Link>

              <Link
                href="/panel/reklamacje-gwarancje/przyjecie"
                className={navRowClass(pathname.startsWith("/panel/reklamacje-gwarancje/przyjecie"))}
              >
                <div className="flex items-center gap-3">
                  <span className={navIconShell(pathname.startsWith("/panel/reklamacje-gwarancje/przyjecie"))}>
                    <ClipboardList size={20} />
                  </span>
                  <span className="text-base font-semibold">Przyjęcie rekl./gwar.</span>
                </div>
                {dotActive(pathname.startsWith("/panel/reklamacje-gwarancje/przyjecie"))}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="border-t border-[var(--border)] p-5 pb-6">
        <Link
          href="/panel/profil"
          className="group/prof flex touch-manipulation items-center gap-3 rounded-2xl px-2 py-2 transition-all duration-200 hover:bg-[var(--row-hover)] hover:shadow-[inset_0_0_0_1px_var(--border)] active:scale-[0.99] active:bg-[var(--row-active)]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] text-base font-bold text-[var(--white)] shadow-[0_0_26px_rgba(59,130,246,.12)] transition-all duration-200 group-hover/prof:border-[var(--bb)] group-hover/prof:bg-[var(--bl)] group-hover/prof:shadow-[0_0_28px_rgba(59,130,246,.22)] group-active/prof:scale-95">
            {(user?.full_name ?? user?.email ?? "?")[0]?.toUpperCase() ?? "?"}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-semibold text-[var(--white)] transition-opacity group-hover/prof:opacity-90">
              {user?.full_name || user?.email || "—"}
            </div>
            <div className="truncate text-sm text-[var(--ink2)] transition-colors group-hover/prof:text-[var(--muted)]">
              {user?.role === "admin" ? "Admin" : "Pracownik"} · Profil
            </div>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => void handleLogout()}
          className="group/btn mt-3 inline-flex w-full touch-manipulation items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2.5 text-base font-semibold text-[var(--ink2)] transition-all duration-200 hover:border-[var(--border2)] hover:bg-[var(--row-active)] hover:text-[var(--white)] active:scale-[0.98]"
        >
          <LogOut size={18} className="transition-transform duration-200 group-hover/btn:-translate-x-0.5" />
          Wyloguj
        </button>
      </div>
    </aside>
  );
}

