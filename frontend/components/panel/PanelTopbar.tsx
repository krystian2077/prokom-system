"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Search, LogOut, Play, CheckCircle2, Bell, MessageSquareText, ChevronLeft, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { filterDevicesWhenRepairsPresent, mergeStaffAndGlobalRepairs } from "@/lib/panelSearchMerge";
import type { RepairRequestListItem } from "@/types/repairs";
import type { GlobalSearchClient, GlobalSearchDevice, GlobalSearchRepair, GlobalSearchResponse } from "@/types/search";
import { useWorkerPanelTheme } from "@/contexts/WorkerPanelThemeContext";
import { useWorkerStore } from "@/stores/workerStore";
import { deadlineLabelForDate } from "@/lib/repair-deadline";

const RECENT_SEARCH_KEY = "prokom-panel-search-recent";

function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCH_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, 12) : [];
  } catch {
    return [];
  }
}

function pushRecentSearch(q: string) {
  const t = q.trim();
  if (t.length < 2) return;
  const prev = readRecentSearches().filter((x) => x.toLowerCase() !== t.toLowerCase());
  const next = [t, ...prev].slice(0, 8);
  try {
    window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}

export function PanelTopbar() {
  const { user, logout, token } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin";
  const pathname = usePathname();
  const accent = isAdmin ? "var(--red)" : "var(--blue)";
  const { theme: panelTheme, toggleTheme } = useWorkerPanelTheme();
  const showToast = useWorkerStore((s) => s.addToast);

  const [now, setNow] = useState(() => new Date());
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const breadcrumb = useMemo(() => {
    if (pathname === "/panel/dashboard" || pathname.startsWith("/panel/dashboard/")) return "Dashboard";
    const repairsDetail =
      pathname.startsWith("/panel/repairs/") ||
      pathname.startsWith("/panel/naprawy/") ||
      pathname.startsWith("/panel/zgloszenia/");
    const repairsList =
      pathname === "/panel/repairs" ||
      pathname === "/panel/naprawy" ||
      pathname === "/panel/zgloszenia";
    if (repairsDetail) return "Szczegóły naprawy";
    if (repairsList) return "Naprawy";
    if (pathname === "/panel/unassigned" || pathname === "/panel/nieprzypisane") return "Nieprzypisane";
    if (pathname === "/panel/all-repairs" || pathname === "/panel/wszystkie") return "Wszystkie naprawy";
    if (pathname.startsWith("/panel/intake") || pathname.startsWith("/admin-panel/intake"))
      return "Przyjęcie Stacjonarne";
    if (pathname.startsWith("/panel/comm")) return "Komunikacja";
    if (pathname.startsWith("/panel/powiadomienia")) return "Powiadomienia";
    if (pathname.startsWith("/panel/calendar") || pathname.startsWith("/panel/kalendarz")) return "Kalendarz";
    if (pathname.startsWith("/panel/availability") || pathname.startsWith("/panel/dostepnosc")) return "Dostępność";
    if (pathname.startsWith("/panel/parts") || pathname.startsWith("/panel/czesci-hurtownie")) return "Części";
    if (pathname.startsWith("/panel/tasks") || pathname.startsWith("/panel/zadania")) return "Zadania";
    if (pathname.startsWith("/panel/archive") || pathname.startsWith("/panel/historia")) return "Historia napraw";
    if (pathname.startsWith("/panel/clients") || pathname.startsWith("/panel/klienci")) return "Klienci";
    if (pathname.startsWith("/panel/search") || pathname.startsWith("/panel/wyszukiwanie")) return "Wyszukiwanie";
    if (pathname.startsWith("/panel/pickups") || pathname.startsWith("/panel/odbior") || pathname.startsWith("/panel/odbiory")) return "Odbiory";
    if (pathname.startsWith("/panel/reklamacje-gwarancje/przyjecie")) return "Przyjęcie rekl./gwar.";
    if (
      pathname.startsWith("/panel/claims") ||
      pathname.startsWith("/panel/reklamacje-gwarancje") ||
      pathname.startsWith("/panel/reklamacje")
    )
      return "Reklamacje";
    if (pathname.startsWith("/panel/profil")) return "Mój profil";
    return "Panel";
  }, [pathname]);

  const showBack = pathname.startsWith("/panel/") && !pathname.includes("/panel/login") && pathname !== "/panel/dashboard";

  const notifUnreadCountQuery = useQuery({
    queryKey: ["topbar", "notif", "unread-count"],
    enabled: Boolean(token && user),
    queryFn: async () => {
      if (!token) return 0;
      const res = await api.get<{ count?: number }>(`/accounts/notifications/unread-count/`, token);
      return typeof res?.count === "number" ? res.count : 0;
    },
    staleTime: 20_000,
  });

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<RepairRequestListItem[]>([]);
  const [globalRepairs, setGlobalRepairs] = useState<GlobalSearchRepair[]>([]);
  const [globalClients, setGlobalClients] = useState<GlobalSearchClient[]>([]);
  const [globalDevices, setGlobalDevices] = useState<GlobalSearchDevice[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const repairsDetailBase = pathname?.startsWith("/admin-panel") ? "/admin-panel/repairs" : "/panel/naprawy";

  useEffect(() => {
    setRecentSearches(readRecentSearches());
  }, []);

  type NavItem =
    | { kind: "repair"; id: string }
    | { kind: "client"; id: string; client: GlobalSearchClient }
    | { kind: "device"; id: string; device: GlobalSearchDevice };

  const archiveStatuses = useMemo(
    () =>
      new Set<string>([
        "repair_done",
        "picked_up",
        "shipped",
        "delivered",
        "cancelled",
        "unrepairable",
        "abandoned",
      ]),
    [],
  );

  const mergedRepairs = useMemo(() => mergeStaffAndGlobalRepairs(results, globalRepairs), [results, globalRepairs]);

  const myRepairs = useMemo(
    () => mergedRepairs.filter((r) => !archiveStatuses.has(r.status)),
    [mergedRepairs, archiveStatuses],
  );
  const archive = useMemo(
    () => mergedRepairs.filter((r) => archiveStatuses.has(r.status)),
    [mergedRepairs, archiveStatuses],
  );

  const devicesFiltered = useMemo(
    () => filterDevicesWhenRepairsPresent(globalDevices, mergedRepairs, globalRepairs),
    [globalDevices, mergedRepairs, globalRepairs],
  );

  const clientSlice = useMemo(() => globalClients.slice(0, 3), [globalClients]);
  const deviceSlice = useMemo(() => devicesFiltered.slice(0, 3), [devicesFiltered]);

  // Kolejność nawigacji musi odpowiadać kolejności sekcji w dropdownie.
  const navItems = useMemo<NavItem[]>(
    () => [
      ...myRepairs.map((r) => ({ kind: "repair" as const, id: r.id })),
      ...archive.map((r) => ({ kind: "repair" as const, id: r.id })),
      ...clientSlice.map((c) => ({ kind: "client" as const, id: c.id, client: c })),
      ...deviceSlice.map((d) => ({ kind: "device" as const, id: d.id, device: d })),
    ],
    [myRepairs, archive, clientSlice, deviceSlice],
  );

  const indexByKey = useMemo(
    () => new Map(navItems.map((it, i) => [`${it.kind}:${it.id}`, i])),
    [navItems],
  );
  const selectedItem = navItems[selectedIndex] ?? null;

  const load = async (q: string) => {
    if (!token || !user) return;
    setLoading(true);
    setError(null);
    try {
      // Staff: tylko przypisane do mnie.
      // Admin: bez filtra `assigned_to` (globalnie).
      const params = new URLSearchParams();
      params.set("search", q);
      if (!isAdmin) params.set("assigned_to", String(user.id));

      const [repairsRes, globalRes] = await Promise.all([
        api.get<RepairRequestListItem[]>(`/staff/repairs/?${params.toString()}`, token),
        api.get<GlobalSearchResponse>(`/search/global/?q=${encodeURIComponent(q)}&limit=15`, token),
      ]);

      setResults(repairsRes ?? []);
      setGlobalRepairs(globalRes?.repairs ?? []);
      setGlobalClients(globalRes?.clients ?? []);
      setGlobalDevices(globalRes?.devices ?? []);
      setSelectedIndex(0);
      setOpen(true);
      const hits =
        (repairsRes?.length ?? 0) +
        (globalRes?.repairs?.length ?? 0) +
        (globalRes?.clients?.length ?? 0) +
        (globalRes?.devices?.length ?? 0);
      if (hits > 0) {
        pushRecentSearch(q);
        setRecentSearches(readRecentSearches());
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać wyników.";
      setError(msg);
      setResults([]);
      setGlobalRepairs([]);
      setGlobalClients([]);
      setGlobalDevices([]);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // debounce request
  useEffect(() => {
    if (!token || !user) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setGlobalRepairs([]);
      setGlobalClients([]);
      setGlobalDevices([]);
      setOpen(false);
      setLoading(false);
      setError(null);
      return;
    }

    const t = window.setTimeout(() => {
      void load(q);
    }, 350);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, token, user?.id, isAdmin]);

  // Ctrl+K focuses input
  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      const key = ev.key.toLowerCase();
      if ((ev.ctrlKey || ev.metaKey) && key === "k") {
        ev.preventDefault();
        inputRef.current?.focus();
        if (query.trim().length >= 2) setOpen(true);
      }
      if (ev.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const onDocDown = (ev: MouseEvent) => {
      const target = ev.target as Node | null;
      if (!target) return;
      if (wrapperRef.current && !wrapperRef.current.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [open]);

  const handleNavigate = (idx: number) => {
    if (!navItems.length) return;
    const next = Math.max(0, Math.min(navItems.length - 1, idx));
    setSelectedIndex(next);
  };

  const goToRepair = (id: string) => {
    setOpen(false);
    void router.push(`${repairsDetailBase}/${encodeURIComponent(id)}`);
  };

  const openLatestRepairForDevice = async (device: GlobalSearchDevice) => {
    if (!token || !user) return;
    setOpen(false);

    const needle = `${device.imei ?? ""}`.trim() || `${device.serial_number ?? ""}`.trim();
    if (!needle) return;

    try {
      const params = new URLSearchParams();
      params.set("search", needle);
      params.set("ordering", "-created_at");
      if (!isAdmin) params.set("assigned_to", String(user.id));

      const repairs = await api.get<RepairRequestListItem[]>(`/staff/repairs/?${params.toString()}`, token);
      const latest = repairs?.[0];
      if (latest?.id) {
        void router.push(`${repairsDetailBase}/${encodeURIComponent(latest.id)}`);
      }
    } catch {
      // Jeśli nie uda się pobrać napraw, nie blokujemy UX - dropdown po prostu się zamyka.
    }
  };

  const selectByItem = (item: NavItem) => {
    if (item.kind === "repair") {
      goToRepair(item.id);
      return;
    }
    if (item.kind === "client") {
      const lastId = item.client.last_repair_summary?.id;
      if (lastId) goToRepair(lastId);
      else setOpen(false);
      return;
    }
    // URZĄDZENIA: otwórz najnowszą naprawę powiązaną z imei/serial.
    void openLatestRepairForDevice(item.device);
  };
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/panel/login");
  };

  return (
    <header className="sticky top-0 z-[110] border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--s1)_85%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-[72px] max-w-[1500px] items-center justify-between gap-4 px-5 py-3 md:min-h-[76px] md:py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          {showBack ? (
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
              aria-label="Wstecz"
            >
              <ChevronLeft size={18} />
            </button>
          ) : null}

          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">
              {user?.role === "admin" ? "Panel Admina" : "Panel pracownika"}
            </div>
            <div className="truncate text-sm font-semibold text-[var(--white)]">{breadcrumb}</div>
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 items-center justify-center px-4 md:flex lg:px-8">
          <div ref={wrapperRef} className="relative w-full max-w-[min(680px,100%)]">
            <div
              className="flex min-h-[44px] w-full items-center gap-2.5 rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--s2)_88%,transparent)] px-4 py-2.5 focus-within:border-[var(--bb)]"
              style={{ color: "var(--ink2)" }}
            >
              <Search size={18} className="shrink-0 opacity-90" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Szukaj naprawy, klienta, IMEI, tel, model..."
                onFocus={() => {
                  if (query.trim().length >= 2) setOpen(true);
                }}
                onKeyDown={(e) => {
                  if (!open || !navItems.length) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    handleNavigate(selectedIndex + 1);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    handleNavigate(selectedIndex - 1);
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    if (selectedItem) selectByItem(selectedItem);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setOpen(false);
                  }
                }}
                className="w-full min-w-0 bg-transparent text-sm leading-snug text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
                autoComplete="off"
              />
              <span className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--row-hover)] px-2 py-1.5 text-[11px] font-semibold text-[var(--ink2)]">
                ⌘K
              </span>
            </div>

            {recentSearches.length > 0 ? (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 px-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Ostatnie</span>
                {recentSearches.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onMouseDown={(ev) => ev.preventDefault()}
                    onClick={() => {
                      setQuery(t);
                      void load(t);
                    }}
                    className="max-w-[200px] truncate rounded-full border border-[var(--border)] bg-[var(--row-hover)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ink)] transition hover:border-[var(--bb)] hover:bg-[var(--bl)] hover:text-[var(--white)]"
                  >
                    {t}
                  </button>
                ))}
              </div>
            ) : null}

            {open && (
              <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-[300] max-h-[440px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--s1)] shadow-[0_16px_48px_rgba(0,0,0,.2)]">
                {loading && (
                  <div className="flex items-center gap-3 px-4 py-6 text-[var(--ink2)]">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--red)] border-t-transparent" />
                    Szukam…
                  </div>
                )}

                {!loading && error && <div className="px-4 py-6 text-red-400">{error}</div>}

                {!loading && !error && mergedRepairs.length === 0 && globalClients.length === 0 && devicesFiltered.length === 0 && (
                  <div className="px-4 py-10 text-center text-[var(--muted)]">Brak wyników.</div>
                )}

                {!loading && !error && (mergedRepairs.length > 0 || globalClients.length > 0 || devicesFiltered.length > 0) && (
                  <div className="flex flex-col">
                    {myRepairs.length > 0 && (
                      <div className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">
                        {isAdmin ? "AKTYWNE WYNIKI" : "MOJE NAPRAWY"}
                      </div>
                    )}

                    {myRepairs.map((r) => {
                      const idx = indexByKey.get(`repair:${r.id}`) ?? -1;
                      const isSelected = idx === selectedIndex;
                      const urgent = Boolean(r.auto_tags?.includes("pilne"));
                      const waitingForParts =
                        Boolean(r.auto_tags?.includes("czeka_na_czesc")) || r.status === "waiting_for_parts";
                      const deadlineHint = deadlineLabelForDate(r.estimated_completion_date);

                      return (
                        <div
                          key={r.id}
                          role="button"
                          tabIndex={-1}
                          onMouseDown={(ev) => {
                            ev.stopPropagation();
                            goToRepair(r.id);
                          }}
                          onMouseEnter={() => {
                            if (idx >= 0) handleNavigate(idx);
                          }}
                          className={[
                            "flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition",
                            "hover:bg-[var(--row-hover)]",
                            isSelected ? "bg-[var(--row-active)]" : "",
                          ].join(" ")}
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div
                              className={[
                                "h-9 w-9 shrink-0 rounded-xl border",
                                urgent ? "border-red-500/30 bg-red-500/10" : "border-[var(--border)] bg-[var(--row-hover)]",
                                waitingForParts ? "border-emerald-500/30 bg-emerald-500/10" : "",
                              ].join(" ")}
                            />
                            <div className="min-w-0">
                              <p className="truncate font-mono text-sm font-semibold text-[var(--white)]">
                                {r.repair_number} · {r.device_name}
                              </p>
                              <p className="mt-0.5 truncate text-sm text-[var(--ink2)]">
                                {r.client_name}
                                {deadlineHint ? ` · Termin: ${deadlineHint}` : ""}
                              </p>
                            </div>
                          </div>

                          {urgent ? (
                            <span className="flex items-center gap-2 rounded-full border border-red-500/35 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-red-400">
                              <span className="h-2 w-2 rounded-full bg-red-500" />
                              PILNE
                            </span>
                          ) : waitingForParts ? (
                            <span className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
                              <Play size={14} />
                              Montaż
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--row-hover)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink2)]">
                              {r.status_display}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {archive.length > 0 && (
                      <div className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">
                        ARCHIWUM
                      </div>
                    )}

                    {archive.map((r) => {
                      const idx = indexByKey.get(`repair:${r.id}`) ?? -1;
                      const isSelected = idx === selectedIndex;
                      const dateLabel = r.estimated_completion_date
                        ? new Date(r.estimated_completion_date)
                        : new Date(r.created_at);
                      const dateText = Number.isFinite(dateLabel.getTime())
                        ? dateLabel.toLocaleDateString("pl-PL", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                        : "";

                      return (
                        <div
                          key={r.id}
                          role="button"
                          tabIndex={-1}
                          onMouseDown={(ev) => {
                            ev.stopPropagation();
                            goToRepair(r.id);
                          }}
                          onMouseEnter={() => {
                            if (idx >= 0) handleNavigate(idx);
                          }}
                          className={[
                            "flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition",
                            "hover:bg-[var(--row-hover)]",
                            isSelected ? "bg-[var(--row-active)]" : "",
                          ].join(" ")}
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--row-hover)]">
                              <CheckCircle2 size={18} className="text-[var(--ink2)]" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-mono text-sm font-semibold text-[var(--white)]">
                                {r.repair_number} · {r.device_name}
                              </p>
                              <p className="mt-0.5 truncate text-sm text-[var(--ink2)]">{r.client_name}</p>
                            </div>
                          </div>
                          <span className="shrink-0 text-xs text-[var(--muted)]">{dateText}</span>
                        </div>
                      );
                    })}

                    {clientSlice.length > 0 && (
                      <div className="mt-3 px-4 pb-3">
                        <div className="mb-2 px-0 py-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">
                          KLIENCI
                        </div>
                        <div className="space-y-2">
                          {clientSlice.map((c) => {
                            const badgeReturns = c.badges?.includes("klient_wraca");
                            const badgeCompany = c.badges?.includes("firma");
                            const last = c.last_repair_summary;
                            const canOpen = Boolean(last?.id);
                            const idx = indexByKey.get(`client:${c.id}`) ?? -1;
                            const isSelected = idx === selectedIndex;
                            return (
                              <div
                                key={c.id}
                                role="button"
                                tabIndex={-1}
                                onClick={() => {
                                  if (canOpen && last?.id) goToRepair(last.id);
                                  else setOpen(false);
                                }}
                                onMouseEnter={() => {
                                  if (idx >= 0) handleNavigate(idx);
                                }}
                                className={[
                                  "cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 transition hover:bg-[var(--row-active)]",
                                  isSelected ? "bg-[var(--row-active)]" : "",
                                ].join(" ")}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate font-mono text-xs font-semibold text-[var(--white)]">{c.full_name}</p>
                                    <p className="mt-0.5 truncate text-[11px] text-[var(--ink2)]">{c.email}</p>
                                  </div>
                                  {last?.repair_number ? (
                                    <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--row-hover)] px-2 py-1 text-[10px] font-semibold text-[var(--ink2)]">
                                      {last.repair_number}
                                    </span>
                                  ) : null}
                                </div>
                                {(badgeReturns || badgeCompany) && (
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    {badgeReturns ? (
                                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-400">
                                        WRACA
                                      </span>
                                    ) : null}
                                    {badgeCompany ? (
                                      <span className="rounded-full border border-[var(--bb)] bg-[var(--bl)] px-2 py-1 text-[10px] font-semibold text-[var(--blue)]">
                                        FIRMA
                                      </span>
                                    ) : null}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {deviceSlice.length > 0 && (
                      <div className="mt-2 px-4 pb-3">
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">
                          URZADZENIA
                        </div>
                        <div className="space-y-2">
                          {deviceSlice.map((d) => {
                            const idx = indexByKey.get(`device:${d.id}`) ?? -1;
                            const isSelected = idx === selectedIndex;
                            return (
                              <div
                                key={d.id}
                                role="button"
                                tabIndex={-1}
                            onClick={() => void openLatestRepairForDevice(d)}
                                onMouseEnter={() => {
                                  if (idx >= 0) handleNavigate(idx);
                                }}
                                className={[
                                  "rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 transition hover:bg-[var(--row-active)]",
                                  isSelected ? "bg-[var(--row-active)]" : "",
                                ].join(" ")}
                              >
                                <p className="truncate font-mono text-xs font-semibold text-[var(--white)]">{d.device_name}</p>
                                <p className="mt-0.5 truncate text-[11px] text-[var(--ink2)]">{d.client_name ?? "—"}</p>
                                <p className="mt-2 text-[10px] text-[var(--ink2)]">
                                  {d.category ?? "—"} · Napraw: {d.repair_count ?? 0}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-4 border-t border-[var(--border)] px-4 py-3 text-[11px] text-[var(--muted)]">
                      <div className="flex items-center gap-2">
                        <span className="rounded border border-[var(--border)] bg-[var(--row-hover)] px-2 py-1 text-[var(--ink2)]">Enter</span>
                        wybierz
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded border border-[var(--border)] bg-[var(--row-hover)] px-2 py-1 text-[var(--ink2)]">↑/↓</span>
                        nawiguj
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded border border-[var(--border)] bg-[var(--row-hover)] px-2 py-1 text-[var(--ink2)]">Esc</span>
                        zamknij
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const label = panelTheme === "dark" ? "Tryb jasny" : "Tryb ciemny";
              toggleTheme();
              showToast(label, "success");
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
            aria-label={panelTheme === "dark" ? "Przełącz na jasny motyw" : "Przełącz na ciemny motyw"}
            style={{ color: accent }}
          >
            {panelTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <Link
            href="/panel/powiadomienia"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
            aria-label="Powiadomienia"
          >
            <Bell size={18} />
            {notifUnreadCountQuery.data && (notifUnreadCountQuery.data as number) > 0 ? (
              <span className="absolute -right-1 -top-1 rounded-full bg-[var(--blue)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                {notifUnreadCountQuery.data as number}
              </span>
            ) : null}
          </Link>

          <Link
            href="/panel/comm"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
            aria-label="Wiadomości"
          >
            <MessageSquareText size={18} />
          </Link>

          <Link
            href="/panel/profil"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] text-sm font-bold text-[var(--white)] transition hover:bg-[var(--row-active)]"
            aria-label="Mój profil"
            style={{ boxShadow: `0 0 26px rgba(59,130,246,.10)` }}
          >
            {(user?.full_name || user?.email)?.[0]?.toUpperCase() ?? "?"}
          </Link>

          {isAdmin ? (
            <button
              type="button"
              onClick={handleLogout}
              className="hidden items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[var(--ink2)] transition hover:bg-[var(--row-active)] md:inline-flex"
            >
              <LogOut size={16} />
              Wyloguj
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

