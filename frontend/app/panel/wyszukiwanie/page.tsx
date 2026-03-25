"use client";

import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { RepairRequestListItem } from "@/types/repairs";
import type { GlobalSearchClient, GlobalSearchDevice, GlobalSearchResponse } from "@/types/search";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdvancedSearchPanel from "@/components/panel/AdvancedSearchPanel";

type ScopeKey = "all" | "active_repairs" | "archive" | "clients" | "parts";
const RECENT_KEY = "prokom-recent-searches";

export default function SearchPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin";
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<ScopeKey>("all");
  const [recent, setRecent] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<RepairRequestListItem[]>([]);
  const [globalClients, setGlobalClients] = useState<GlobalSearchClient[]>([]);
  const [globalDevices, setGlobalDevices] = useState<GlobalSearchDevice[]>([]);

  const archiveStatuses = useMemo(
    () => new Set(["repair_done", "picked_up", "shipped", "delivered", "cancelled", "unrepairable", "abandoned"]),
    [],
  );
  const myRepairs = useMemo(() => results.filter((r) => !archiveStatuses.has((r.status ?? "").toLowerCase())), [results, archiveStatuses]);
  const archive = useMemo(() => results.filter((r) => archiveStatuses.has((r.status ?? "").toLowerCase())), [results, archiveStatuses]);

  const performSearch = useCallback(async (q: string) => {
    if (!token || !user) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("search", q);
      if (!isAdmin) params.set("assigned_to", String(user.id));
      const [repairsRes, globalRes] = await Promise.all([
        api.get<RepairRequestListItem[]>(`/staff/repairs/?${params.toString()}`, token),
        api.get<GlobalSearchResponse>(`/search/global/?q=${encodeURIComponent(q)}&limit=15`, token),
      ]);
      setResults(repairsRes ?? []);
      setGlobalClients(globalRes?.clients ?? []);
      setGlobalDevices(globalRes?.devices ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się pobrać wyników.");
      setResults([]);
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

  const goToRepair = (id: string) => void router.push(`/panel/naprawy/${encodeURIComponent(id)}`);

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
      if (latest?.id) void router.push(`/panel/naprawy/${encodeURIComponent(latest.id)}`);
    } catch {
      // ignore
    }
  };

  const showActive = scope === "all" || scope === "active_repairs";
  const showArchive = scope === "all" || scope === "archive";
  const showClients = scope === "all" || scope === "clients";
  const showParts = scope === "all" || scope === "parts";
  const hasAny = myRepairs.length + archive.length + globalClients.length + globalDevices.length > 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8">
      <section className="mx-auto w-full max-w-[900px] rounded-3xl border border-white/10 bg-[#0b0c10]/40 p-5 text-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#11131a]/70 px-4 py-[13px] focus-within:border-[#3b82f6]/35 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,.14)]">
            <Search size={16} className="shrink-0 text-[#9ca3af]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") pushRecent(query);
              }}
              placeholder="Szukaj: PK-54321, Kowalski, +48 600, IMEI, iPhone 15..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#6b7280]"
              autoComplete="off"
            />
            <span className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-[#9ca3af]">⌘K</span>
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
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#cbd5e1] hover:bg-white/10"
              >
                {item}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecent(item);
                  }}
                  className="text-[#9ca3af]"
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
                ["parts", "Części"],
              ] as Array<[ScopeKey, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setScope(key)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                  scope === key ? "border-white/20 bg-white/10 text-white" : "border-white/10 bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0c0d12] p-4">
            {loading ? <div className="text-[#9ca3af]">Szukam...</div> : null}
            {!loading && error ? <div className="text-[#fca5a5]">{error}</div> : null}
            {!loading && !error && query.trim().length < 2 ? <div className="text-[#6b7280]">Wpisz co najmniej 2 znaki, aby zobaczyć wyniki.</div> : null}
            {!loading && !error && query.trim().length >= 2 && !hasAny ? <div className="text-[#6b7280]">Brak wyników.</div> : null}

            {!loading && !error && query.trim().length >= 2 && hasAny ? (
              <div className="space-y-5 animate-[fadeUp_.2s_ease]">
                {showActive && (
                  <section>
                    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b93a8]">Moje aktywne naprawy ({myRepairs.length})</h3>
                    <div className="space-y-2">
                      {myRepairs.map((r) => (
                        <button key={r.id} type="button" onClick={() => goToRepair(r.id)} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:bg-white/10">
                          <div>
                            <p className="font-mono text-sm font-semibold text-white">{r.repair_number}</p>
                            <p className="text-xs text-[#9ca3af]">{r.client_name} · {r.device_name}</p>
                          </div>
                          <span className="text-xs text-[#9ca3af]">{r.status_display}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {showArchive && (
                  <section>
                    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b93a8]">Historia napraw ({archive.length})</h3>
                    <div className="space-y-2">
                      {archive.map((r) => (
                        <button key={r.id} type="button" onClick={() => goToRepair(r.id)} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:bg-white/10">
                          <div>
                            <p className="font-mono text-sm font-semibold text-white">{r.repair_number}</p>
                            <p className="text-xs text-[#9ca3af]">{r.client_name} · {r.device_name}</p>
                          </div>
                          <span className="text-xs text-[#9ca3af]">{new Date(r.created_at).toLocaleDateString("pl-PL")}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {showClients && (
                  <section>
                    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b93a8]">Klienci ({globalClients.length})</h3>
                    <div className="space-y-2">
                      {globalClients.map((c) => (
                        <button key={c.id} type="button" onClick={() => (c.last_repair_summary?.id ? goToRepair(c.last_repair_summary.id) : undefined)} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:bg-white/10">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">{c.full_name?.slice(0, 1) || "K"}</span>
                            <div>
                              <p className="text-sm font-semibold text-white">{c.full_name}</p>
                              <p className="text-xs text-[#9ca3af]">{c.email}</p>
                            </div>
                          </div>
                          <span className="text-xs text-[#9ca3af]">{c.last_repair_summary?.repair_number ?? "—"}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {showParts && (
                  <section>
                    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b93a8]">Części ({globalDevices.length})</h3>
                    <div className="space-y-2">
                      {globalDevices.map((d) => (
                        <button key={d.id} type="button" onClick={() => void openLatestRepairForDevice(d)} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:bg-white/10">
                          <div>
                            <p className="text-sm font-semibold text-white">{d.device_name}</p>
                            <p className="text-xs text-[#9ca3af]">{d.client_name ?? "—"}</p>
                          </div>
                          <span className="text-xs text-[#9ca3af]">{d.category ?? "—"}</span>
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

      <AdvancedSearchPanel />
    </main>
  );
}

