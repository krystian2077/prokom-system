"use client";

import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { RepairRequestListItem } from "@/types/repairs";
import type { GlobalSearchClient, GlobalSearchDevice, GlobalSearchResponse } from "@/types/search";
import { Search, Play, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import AdvancedSearchPanel from "@/components/panel/AdvancedSearchPanel";

export default function SearchPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin";

  const inputRef = useRef<HTMLInputElement | null>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<RepairRequestListItem[]>([]);
  const [globalClients, setGlobalClients] = useState<GlobalSearchClient[]>([]);
  const [globalDevices, setGlobalDevices] = useState<GlobalSearchDevice[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

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

  const myRepairs = useMemo(() => results.filter((r) => !archiveStatuses.has(r.status)), [results, archiveStatuses]);
  const archive = useMemo(() => results.filter((r) => archiveStatuses.has(r.status)), [results, archiveStatuses]);

  const clientSlice = useMemo(() => globalClients.slice(0, 4), [globalClients]);
  const deviceSlice = useMemo(() => globalDevices.slice(0, 4), [globalDevices]);

  // Kolejność jak w widoku dropdown: naprawy -> archiwum -> klienci -> urządzenia.
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

  const formatSla = (estimated: string | null | undefined) => {
    if (!estimated) return null;
    const d = new Date(estimated);
    if (!Number.isFinite(d.getTime())) return null;

    const today = new Date();
    const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    const diffDays = Math.round((d.getTime() - t0) / dayMs);

    if (diffDays === 0) return "SLA Dziś";
    if (diffDays === 1) return "SLA Jutro";
    if (diffDays === -1) return "SLA Wczoraj";
    if (diffDays > 1 && diffDays <= 7) return `SLA +${diffDays} dni`;

    return `SLA ${d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" })}`;
  };

  const load = async (q: string) => {
    if (!token || !user) return;
    setLoading(true);
    setError(null);
    try {
      // Staff: wyniki tylko dla przydzielonych do mnie.
      // Admin: wyniki bez filtra `assigned_to` (szukamy w całym systemie).
      const params = new URLSearchParams();
      params.set("search", q);
      if (!isAdmin) params.set("assigned_to", String(user.id));

      const [repairsRes, globalRes] = await Promise.all([
        api.get<RepairRequestListItem[]>(`/staff/repairs/?${params.toString()}`, token),
        api.get<GlobalSearchResponse>(
          `/search/global/?q=${encodeURIComponent(q)}&limit=15`,
          token,
        ),
      ]);

      setResults(repairsRes ?? []);
      setGlobalClients(globalRes?.clients ?? []);
      setGlobalDevices(globalRes?.devices ?? []);
      setSelectedIndex(0);
      setOpen(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać wyników.";
      setError(msg);
      setResults([]);
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
  }, [query, token, user?.id]);

  // Ctrl+K focuses input (hint on the right)
  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      const key = ev.key.toLowerCase();
      if ((ev.ctrlKey || ev.metaKey) && key === "k") {
        ev.preventDefault();
        inputRef.current?.focus();
      }
      if (ev.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleNavigate = (idx: number) => {
    if (!navItems.length) return;
    const next = Math.max(0, Math.min(navItems.length - 1, idx));
    setSelectedIndex(next);
  };

  const goToRepair = (id: string) => {
    setOpen(false);
    void router.push(`/panel/repairs/${encodeURIComponent(id)}`);
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
      // Staff: trzymamy tę samą logikę widoczności co listowanie w dropdownie.
      if (user.role !== "admin") params.set("assigned_to", String(user.id));

      const repairs = await api.get<RepairRequestListItem[]>(`/staff/repairs/?${params.toString()}`, token);
      const latest = repairs?.[0];
      if (latest?.id) {
        void router.push(`/panel/repairs/${encodeURIComponent(latest.id)}`);
      }
    } catch {
      // Jeśli nie uda się pobrać napraw, dropdown po prostu się zamyka.
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

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8">
      <section className="mx-auto w-full max-w-[720px] rounded-3xl border border-white/10 bg-[#0b0c10]/40 p-5 text-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#11131a]/70 px-4 py-2.5">
            <Search size={16} className="shrink-0 text-[#9ca3af]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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
              placeholder="Szukaj: naprawa, klient, IMEI, model, tel…"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#6b7280]"
              autoComplete="off"
            />
            <span className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-[#9ca3af]">
              Ctrl K
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0c0d12] overflow-hidden">
            {loading && (
              <div className="flex items-center gap-3 px-4 py-6 text-[#9ca3af]">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#3b82f6] border-t-transparent" />
                Szukam…
              </div>
            )}

            {!loading && error && <div className="px-4 py-6 text-[#fca5a5]">{error}</div>}

            {!loading && !error && open && results.length === 0 && globalClients.length === 0 && globalDevices.length === 0 && (
              <div className="px-4 py-10 text-center text-[#6b7280]">Brak wyników.</div>
            )}

            {!loading && !error && open && (results.length > 0 || globalClients.length > 0 || globalDevices.length > 0) && (
              <div>
                {myRepairs.length > 0 && (
                  <div className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b93a8]">
                    {isAdmin ? "AKTYWNE WYNIKI" : "MOJE NAPRAWY"}
                  </div>
                )}

                {myRepairs.map((r) => {
                  const idx = indexByKey.get(`repair:${r.id}`) ?? -1;
                  const isSelected = idx === selectedIndex;
                  const urgent = Boolean(r.auto_tags?.includes("pilne"));
                  const waitingForParts =
                    Boolean(r.auto_tags?.includes("czeka_na_czesc")) || r.status === "waiting_for_parts";

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
                        "hover:bg-white/5",
                        isSelected ? "bg-white/10" : "",
                      ].join(" ")}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div
                          className={[
                            "h-9 w-9 shrink-0 rounded-xl border",
                            urgent ? "border-red-500/30 bg-red-500/10" : "border-white/10 bg-white/5",
                            waitingForParts ? "border-emerald-500/30 bg-emerald-500/10" : "",
                          ].join(" ")}
                        />

                        <div className="min-w-0">
                          <p className="truncate font-mono text-sm font-semibold text-white">
                            {r.repair_number} · {r.device_name}
                          </p>
                          <p className="mt-0.5 truncate text-sm text-[#9ca3af]">
                            {r.client_name}
                            {formatSla(r.estimated_completion_date)
                              ? ` · ${formatSla(r.estimated_completion_date)}`
                              : ""}
                          </p>
                        </div>
                      </div>

                      {urgent ? (
                        <span className="flex items-center gap-2 rounded-full border border-red-500/35 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-red-400">
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                          PILNE
                        </span>
                      ) : waitingForParts ? (
                        <span
                          onClick={(ev) => {
                            ev.stopPropagation();
                            goToRepair(r.id);
                          }}
                          className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-400"
                        >
                          <Play size={14} />
                          Montaż
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
                          {r.status_display}
                        </span>
                      )}
                    </div>
                  );
                })}

                {archive.length > 0 && (
                  <div className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b93a8]">
                    ARCHIWUM
                  </div>
                )}

                {archive.map((r) => {
                  const idx = indexByKey.get(`repair:${r.id}`) ?? -1;
                  const isSelected = idx === selectedIndex;
                  const dateLabel = r.estimated_completion_date ? new Date(r.estimated_completion_date) : new Date(r.created_at);
                  const dateText = Number.isFinite(dateLabel.getTime())
                    ? dateLabel.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" })
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
                        "hover:bg-white/5",
                        isSelected ? "bg-white/10" : "",
                      ].join(" ")}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                          <CheckCircle2 size={18} className="text-[#94a3b8]" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-mono text-sm font-semibold text-white">
                            {r.repair_number} · {r.device_name}
                          </p>
                          <p className="mt-0.5 truncate text-sm text-[#9ca3af]">{r.client_name}</p>
                        </div>
                      </div>

                      <span className="shrink-0 text-xs text-[#6b7280]">{dateText}</span>
                    </div>
                  );
                })}

                {clientSlice.length > 0 && (
                  <div className="mt-3">
                    <div className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b93a8]">KLIENCI</div>
                    <div className="space-y-2 px-4 pb-3">
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
                              "flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10",
                              isSelected ? "bg-white/10" : "",
                            ].join(" ")}
                          >
                            <div className="min-w-0">
                              <p className="truncate font-mono text-sm font-semibold text-white">
                                {c.full_name}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-[#9ca3af]">{c.email}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                {badgeReturns ? (
                                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-400">
                                    WRACA
                                  </span>
                                ) : null}
                                {badgeCompany ? (
                                  <span className="rounded-full border border-[#3b82f6]/30 bg-[#3b82f6]/10 px-2 py-1 text-[11px] font-semibold text-[#3b82f6]">
                                    FIRMA
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            {last?.repair_number ? (
                              <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-[#9ca3af]">
                                Ostatnia: {last.repair_number}
                              </span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {deviceSlice.length > 0 && (
                  <div className="mt-2">
                    <div className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b93a8]">URZADZENIA</div>
                    <div className="space-y-2 px-4 pb-3">
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
                              "rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10",
                              isSelected ? "bg-white/10" : "",
                            ].join(" ")}
                          >
                            <p className="truncate font-mono text-sm font-semibold text-white">{d.device_name}</p>
                            <p className="mt-0.5 truncate text-xs text-[#9ca3af]">{d.client_name ?? "—"}</p>
                            <p className="mt-2 text-[11px] text-[#9ca3af]">
                              Kategoria: {d.category ?? "—"} · Napraw: {d.repair_count ?? 0}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 border-t border-white/10 px-4 py-3 text-[11px] text-[#6b7280]">
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[#9ca3af]">Enter</span>
                    wybierz
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[#9ca3af]">↑/↓</span>
                    nawiguj
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[#9ca3af]">Esc</span>
                    zamknij
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <AdvancedSearchPanel />
    </main>
  );
}

