"use client";

import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import {
  filterDevicesWhenRepairsPresent,
  mergeStaffAndGlobalRepairs,
} from "@/lib/panelSearchMerge";
import { deliveryMethodLabel, returnMethodLabel } from "@/lib/repairMethodLabels";
import type { RepairDetail, RepairRequestListItem } from "@/types/repairs";
import type { GlobalSearchRepair } from "@/types/search";
import type { GlobalSearchClient, GlobalSearchDevice, GlobalSearchResponse } from "@/types/search";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Search, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdvancedSearchPanel from "@/components/panel/AdvancedSearchPanel";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { RepairTableSkeleton } from "@/components/ui/Skeleton";

type ScopeKey = "all" | "active_repairs" | "archive" | "clients" | "devices";
const RECENT_KEY = "prokom-recent-searches";

function SearchRepairDetailPanel({
  repairId,
  token,
  onClose,
}: {
  repairId: string | null;
  token: string | null;
  onClose: () => void;
}) {
  const q = useQuery({
    queryKey: ["panel-search-page", "repair-detail", repairId],
    enabled: Boolean(token && repairId),
    queryFn: async () => {
      if (!token || !repairId) throw new Error("Brak danych");
      return api.get<RepairDetail>(`/staff/repairs/${repairId}/`, token);
    },
  });

  if (!repairId) return null;

  return (
    <section className="rounded-3xl border border-[#3b82f6]/25 bg-[var(--s1)] p-5 shadow-[0_0_40px_rgba(59,130,246,.08)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink2)]">Wybrana naprawa</p>
          <h2 className="mt-1 font-mono text-lg font-semibold text-[var(--white)]">{q.data?.repair_number ?? "…"}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/panel/naprawy/${encodeURIComponent(repairId)}`}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[var(--row-hover)] px-3 py-2 text-xs font-semibold text-[var(--white)] transition hover:bg-[var(--row-active)]"
          >
            Pełny widok
            <ExternalLink size={14} />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
            aria-label="Zamknij podgląd"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {q.isLoading ? (
        <p className="text-sm text-[var(--ink2)]">Ładuję szczegóły…</p>
      ) : q.isError ? (
        <p className="text-sm text-red-400">{q.error instanceof Error ? q.error.message : "Nie udało się wczytać naprawy."}</p>
      ) : q.data ? (
        <div className="grid gap-4 text-sm text-[#e5e7eb] md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-white/[0.03] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink2)]">Status</p>
            <p className="mt-1 font-semibold text-[var(--white)]">{q.data.status_display}</p>
            <p className="mt-2 text-xs text-[var(--ink2)]">Typ: {q.data.repair_type}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white/[0.03] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink2)]">Klient</p>
            <p className="mt-1 font-semibold text-[var(--white)]">{q.data.client.full_name}</p>
            <p className="mt-1 text-xs text-[var(--ink2)]">{q.data.client.email}</p>
            <p className="mt-0.5 text-xs text-[var(--ink2)]">{q.data.client.phone}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white/[0.03] p-4 md:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink2)]">Urządzenie</p>
            <p className="mt-1 font-semibold text-[var(--white)]">{q.data.device.device_name}</p>
            <p className="mt-1 text-xs text-[var(--ink2)]">
              {q.data.device.brand_name} · {q.data.device.category}
              {q.data.device.serial_number ? ` · SN ${q.data.device.serial_number}` : ""}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white/[0.03] p-4 md:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink2)]">Opis problemu</p>
            <p className="mt-2 whitespace-pre-wrap text-[#d1d5db]">{q.data.problem_description || "—"}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white/[0.03] p-4 md:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink2)]">Notatki wewnętrzne</p>
            <p className="mt-2 whitespace-pre-wrap text-[#d1d5db]">{q.data.internal_notes?.trim() ? q.data.internal_notes : "—"}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white/[0.03] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink2)]">Termin / czas</p>
            <p className="mt-1 text-[#e5e7eb]">
              Utworzono: {new Date(q.data.created_at).toLocaleString("pl-PL")}
            </p>
            <p className="mt-1 text-[#e5e7eb]">
              Planowany termin:{" "}
              {q.data.estimated_completion_date
                ? new Date(q.data.estimated_completion_date).toLocaleDateString("pl-PL")
                : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white/[0.03] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink2)]">Koszty (szac./końcowa)</p>
            <p className="mt-1 text-[#e5e7eb]">
              Szacunek: {q.data.estimated_cost != null ? String(q.data.estimated_cost) : "—"} · Końcowa:{" "}
              {q.data.final_cost != null ? String(q.data.final_cost) : "—"}
            </p>
            <p className="mt-2 text-xs text-[var(--ink2)]">
              Dostawa: {deliveryMethodLabel(q.data.delivery_method)} · Zwrot: {returnMethodLabel(q.data.return_method)}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default function SearchPage() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";
  const inputRef = useRef<HTMLInputElement | null>(null);
  const detailPanelRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<ScopeKey>("all");
  const [recent, setRecent] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<RepairRequestListItem[]>([]);
  const [globalRepairs, setGlobalRepairs] = useState<GlobalSearchRepair[]>([]);
  const [globalClients, setGlobalClients] = useState<GlobalSearchClient[]>([]);
  const [globalDevices, setGlobalDevices] = useState<GlobalSearchDevice[]>([]);
  const [selectedRepairId, setSelectedRepairId] = useState<string | null>(null);

  const archiveStatuses = useMemo(
    () => new Set(["repair_done", "picked_up", "shipped", "delivered", "cancelled", "unrepairable", "abandoned"]),
    [],
  );

  const mergedRepairs = useMemo(() => mergeStaffAndGlobalRepairs(results, globalRepairs), [results, globalRepairs]);

  const myRepairs = useMemo(
    () => mergedRepairs.filter((r) => !archiveStatuses.has((r.status ?? "").toLowerCase())),
    [mergedRepairs, archiveStatuses],
  );
  const archive = useMemo(
    () => mergedRepairs.filter((r) => archiveStatuses.has((r.status ?? "").toLowerCase())),
    [mergedRepairs, archiveStatuses],
  );

  const devicesForDisplay = useMemo(
    () => filterDevicesWhenRepairsPresent(globalDevices, mergedRepairs, globalRepairs),
    [globalDevices, mergedRepairs, globalRepairs],
  );

  const performSearch = useCallback(async (qStr: string) => {
    if (!token || !user) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("search", qStr);
      if (!isAdmin) params.set("assigned_to", String(user.id));
      const [repairsRes, globalRes] = await Promise.all([
        api.get<RepairRequestListItem[]>(`/staff/repairs/?${params.toString()}`, token),
        api.get<GlobalSearchResponse>(`/search/global/?q=${encodeURIComponent(qStr)}&limit=15`, token),
      ]);
      setResults(repairsRes ?? []);
      setGlobalRepairs(globalRes?.repairs ?? []);
      setGlobalClients(globalRes?.clients ?? []);
      setGlobalDevices(globalRes?.devices ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się pobrać wyników.");
      setResults([]);
      setGlobalRepairs([]);
      setGlobalClients([]);
      setGlobalDevices([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, token, user]);

  useEffect(() => {
    if (!token || !user) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setGlobalRepairs([]);
      setGlobalClients([]);
      setGlobalDevices([]);
      setError(null);
      setLoading(false);
      return;
    }
    const t = window.setTimeout(() => void performSearch(q), 300);
    return () => window.clearTimeout(t);
  }, [query, token, user, performSearch]);

  useEffect(() => {
    if (!selectedRepairId) return;
    detailPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedRepairId]);

  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "k") {
        ev.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setRecent(parsed.filter((v) => typeof v === "string").slice(0, 5));
    } catch {
      // ignore
    }
  }, []);

  const pushRecent = (term: string) => {
    const value = term.trim();
    if (value.length < 2) return;
    setRecent((prev) => {
      const next = [value, ...prev.filter((x) => x.toLowerCase() !== value.toLowerCase())].slice(0, 5);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  };

  const removeRecent = (term: string) => {
    setRecent((prev) => {
      const next = prev.filter((x) => x !== term);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  };

  const openLatestRepairForDevice = async (device: GlobalSearchDevice) => {
    if (!token || !user) return;
    const needle = `${device.imei ?? ""}`.trim() || `${device.serial_number ?? ""}`.trim();
    if (!needle) return;
    try {
      const params = new URLSearchParams();
      params.set("search", needle);
      params.set("ordering", "-created_at");
      if (user.role !== "admin") params.set("assigned_to", String(user.id));
      const repairs = await api.get<RepairRequestListItem[]>(`/staff/repairs/?${params.toString()}`, token);
      const latest = repairs?.[0];
      if (latest?.id) setSelectedRepairId(latest.id);
    } catch {
      // ignore
    }
  };

  const showActive = scope === "all" || scope === "active_repairs";
  const showArchive = scope === "all" || scope === "archive";
  const showClients = scope === "all" || scope === "clients";
  const showDevices = scope === "all" || scope === "devices";
  const hasAny = myRepairs.length + archive.length + globalClients.length + devicesForDisplay.length > 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8">
      <section className="mx-auto w-full max-w-[900px] rounded-3xl border border-[var(--border)] bg-[var(--s1)]/40 p-5 text-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--s2)]/70 px-4 py-[13px] focus-within:border-[#3b82f6]/35 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,.14)]">
            <Search size={16} className="shrink-0 text-[var(--ink2)]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") pushRecent(query);
              }}
              placeholder="Szukaj: PK-54321, Kowalski, +48 600, IMEI, iPhone 15..."
              className="w-full bg-transparent text-sm text-[var(--white)] outline-none placeholder:text-[var(--muted)]"
              autoComplete="off"
            />
            <span className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--row-hover)] px-2 py-1 text-[11px] font-semibold text-[var(--ink2)]">⌘K</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {recent.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setQuery(item);
                  pushRecent(item);
                  void performSearch(item);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--row-hover)] px-3 py-1 text-xs text-[#cbd5e1] hover:bg-[var(--row-active)]"
              >
                {item}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecent(item);
                  }}
                  className="text-[var(--ink2)]"
                >
                  ×
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["all", "Wszystko"],
                ["active_repairs", "Moje naprawy"],
                ["archive", "Archiwum"],
                ["clients", "Klienci"],
                ["devices", "Urządzenia"],
              ] as Array<[ScopeKey, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setScope(key)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                  scope === key ? "border-white/20 bg-[var(--row-active)] text-[var(--white)]" : "border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)] hover:bg-[var(--row-active)] hover:text-[var(--white)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4">
            {loading ? (
              <div className="py-2">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Szukam…</p>
                <RepairTableSkeleton rows={6} />
              </div>
            ) : null}
            {!loading && error ? (
              <ErrorState error={new Error(error)} onRetry={() => void performSearch(query.trim())} title="Nie udało się wyszukać" />
            ) : null}
            {!loading && !error && query.trim().length < 2 ? (
              <p className="py-6 text-center text-sm text-[var(--muted)]">Wpisz co najmniej 2 znaki, aby zobaczyć wyniki.</p>
            ) : null}
            {!loading && !error && query.trim().length >= 2 && !hasAny ? (
              <EmptyState
                icon={EMPTY_STATES.search.icon}
                title={EMPTY_STATES.search.title}
                description={EMPTY_STATES.search.description}
              />
            ) : null}

            {!loading && !error && query.trim().length >= 2 && hasAny ? (
              <div className="space-y-5 animate-[fadeUp_.2s_ease]">
                {showActive && (
                  <section>
                    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink2)]">Moje aktywne naprawy ({myRepairs.length})</h3>
                    <div className="space-y-2">
                      {myRepairs.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setSelectedRepairId(r.id)}
                          className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-left transition hover:bg-[var(--row-active)]"
                        >
                          <div>
                            <p className="font-mono text-sm font-semibold text-[var(--white)]">{r.repair_number}</p>
                            <p className="text-xs text-[var(--ink2)]">
                              {r.client_name} · {r.device_name}
                            </p>
                          </div>
                          <span className="text-xs text-[var(--ink2)]">{r.status_display}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {showArchive && (
                  <section>
                    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink2)]">Historia napraw ({archive.length})</h3>
                    <div className="space-y-2">
                      {archive.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setSelectedRepairId(r.id)}
                          className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-left transition hover:bg-[var(--row-active)]"
                        >
                          <div>
                            <p className="font-mono text-sm font-semibold text-[var(--white)]">{r.repair_number}</p>
                            <p className="text-xs text-[var(--ink2)]">
                              {r.client_name} · {r.device_name}
                            </p>
                          </div>
                          <span className="text-xs text-[var(--ink2)]">{new Date(r.created_at).toLocaleDateString("pl-PL")}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {showClients && (
                  <section>
                    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink2)]">Klienci ({globalClients.length})</h3>
                    <div className="space-y-2">
                      {globalClients.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => (c.last_repair_summary?.id ? setSelectedRepairId(c.last_repair_summary.id) : undefined)}
                          className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-left transition hover:bg-[var(--row-active)]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--row-active)] text-xs font-bold text-[var(--white)]">
                              {c.full_name?.slice(0, 1) || "K"}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-[var(--white)]">{c.full_name}</p>
                              <p className="text-xs text-[var(--ink2)]">{c.email}</p>
                            </div>
                          </div>
                          <span className="text-xs text-[var(--ink2)]">{c.last_repair_summary?.repair_number ?? "—"}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {showDevices && (
                  <section>
                    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink2)]">Urządzenia ({devicesForDisplay.length})</h3>
                    <p className="mb-2 text-xs text-[var(--muted)]">
                      Katalog urządzeń klientów (bez duplikatów, gdy ta sama sprawa jest już w wynikach napraw).
                    </p>
                    <div className="space-y-2">
                      {devicesForDisplay.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => void openLatestRepairForDevice(d)}
                          className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-left transition hover:bg-[var(--row-active)]"
                        >
                          <div>
                            <p className="text-sm font-semibold text-[var(--white)]">{d.device_name}</p>
                            <p className="text-xs text-[var(--ink2)]">{d.client_name ?? "—"}</p>
                          </div>
                          <span className="text-xs text-[var(--ink2)]">{d.category ?? "—"}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div ref={detailPanelRef}>
        <SearchRepairDetailPanel repairId={selectedRepairId} token={token} onClose={() => setSelectedRepairId(null)} />
      </div>

      <AdvancedSearchPanel />
    </main>
  );
}
