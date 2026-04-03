"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Archive, Filter, Search, Sparkles, Users, Wrench, type LucideIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { globalSearchRepairToListItem, mergeStaffAndGlobalRepairs } from "@/lib/panelSearchMerge";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { RepairTableSkeleton } from "@/components/ui/Skeleton";
import type { RepairRequestListItem } from "@/types/repairs";
import type { AdvancedSearchResponse, GlobalSearchClient, GlobalSearchResponse } from "@/types/search";

type ScopeKey = "all" | "active_repairs" | "archive" | "clients";
const RECENT_KEY = "prokom-recent-searches";
const ARCHIVE_STATUSES = [
  "repair_done",
  "picked_up",
  "shipped",
  "delivered",
  "cancelled",
  "unrepairable",
  "abandoned",
] as const;

const STATUS_OPTIONS = [
  { value: "", label: "Wszystkie statusy" },
  { value: "new", label: "Nowe" },
  { value: "in_progress", label: "W naprawie" },
  { value: "waiting_for_parts", label: "Czeka na część" },
  { value: "ready_for_pickup", label: "Gotowe do odbioru" },
  { value: "delivered", label: "Wydane" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "Wszystkie kategorie" },
  { value: "phone", label: "Telefon" },
  { value: "laptop", label: "Laptop" },
  { value: "tablet", label: "Tablet" },
  { value: "desktop", label: "Desktop" },
  { value: "printer", label: "Drukarka" },
  { value: "console", label: "Konsola" },
  { value: "other", label: "Inne" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "Wszystkie priorytety" },
  { value: "normal", label: "Normalny" },
  { value: "high", label: "Wysoki" },
  { value: "urgent", label: "Pilne" },
];

function isArchived(status: string): boolean {
  return ARCHIVE_STATUSES.includes((status ?? "").toLowerCase() as (typeof ARCHIVE_STATUSES)[number]);
}

function SearchPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, token } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [query, setQuery] = useState("");
  const scope = useMemo<ScopeKey>(() => {
    const s = searchParams.get("scope");
    const allowed: ScopeKey[] = ["all", "active_repairs", "archive", "clients"];
    return s && allowed.includes(s as ScopeKey) ? (s as ScopeKey) : "all";
  }, [searchParams]);
  const setScope = (key: ScopeKey) => {
    const p = new URLSearchParams(searchParams.toString());
    if (key === "all") p.delete("scope");
    else p.set("scope", key);
    const q = p.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  };

  const [showFilters, setShowFilters] = useState(false);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isWarranty, setIsWarranty] = useState(false);
  const [isComplaint, setIsComplaint] = useState(false);

  const [recent, setRecent] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repairs, setRepairs] = useState<RepairRequestListItem[]>([]);
  const [clients, setClients] = useState<GlobalSearchClient[]>([]);

  const hasAdvancedFilters = Boolean(
    status || category || priority || dateFrom || dateTo || isWarranty || isComplaint,
  );

  const activeRepairs = useMemo(() => repairs.filter((r) => !isArchived(r.status)), [repairs]);
  const archiveRepairs = useMemo(() => repairs.filter((r) => isArchived(r.status)), [repairs]);

  const hasAnyResult = activeRepairs.length + archiveRepairs.length + clients.length > 0;
  const showActive = scope === "all" || scope === "active_repairs";
  const showArchive = scope === "all" || scope === "archive";
  const showClients = scope === "all" || scope === "clients";
  const activeFilterCount =
    [status, category, priority, dateFrom, dateTo].filter(Boolean).length +
    (isWarranty ? 1 : 0) +
    (isComplaint ? 1 : 0);

  const performSearch = useCallback(async (q: string) => {
    if (!token || !user) return;
    const needle = q.trim();
    if (needle.length < 2) {
      setRepairs([]);
      setClients([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (!hasAdvancedFilters) {
        const staffParams = new URLSearchParams();
        staffParams.set("search", needle);
        staffParams.set("assigned_to", String(user.id));
        const [staffRepairs, globalRes] = await Promise.all([
          api.get<RepairRequestListItem[]>(`/staff/repairs/?${staffParams.toString()}`, token),
          api.get<GlobalSearchResponse>(`/search/global/?q=${encodeURIComponent(needle)}&limit=20`, token),
        ]);
        setRepairs(mergeStaffAndGlobalRepairs(staffRepairs ?? [], globalRes?.repairs ?? []));
        setClients(globalRes?.clients ?? []);
      } else {
        const params = new URLSearchParams();
        params.set("q", needle);
        params.set("limit", "20");
        params.set("assigned_to", String(user.id));
        if (status) params.set("status", status);
        if (category) params.set("category", category);
        if (priority) params.set("priority", priority);
        if (dateFrom) params.set("date_from", dateFrom);
        if (dateTo) params.set("date_to", dateTo);
        if (isWarranty) params.set("is_warranty", "true");
        if (isComplaint) params.set("is_complaint", "true");
        const adv = await api.get<AdvancedSearchResponse>(`/search/advanced/?${params.toString()}`, token);
        setRepairs((adv?.repairs ?? []).map(globalSearchRepairToListItem));
        setClients(adv?.clients ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się pobrać wyników.");
      setRepairs([]);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [category, dateFrom, dateTo, hasAdvancedFilters, isComplaint, isWarranty, priority, status, token, user]);

  useEffect(() => {
    if (!token || !user) return;
    const q = query.trim();
    if (q.length < 2) {
      setRepairs([]);
      setClients([]);
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-6 px-4 py-8">
      <header className="rounded-[2rem] border border-[#2a3246] bg-gradient-to-r from-[#0e1423] via-[#121b31] to-[#0d1629] p-5 shadow-[0_18px_50px_rgba(0,0,0,.35)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#9db0d4]">Panel Pracownika</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Wyszukiwanie globalne</h1>
            <p className="mt-1 text-sm text-[#a9b8d6]">
              Szukaj po: IMEI, numerze telefonu, kliencie, numerze naprawy, modelu i opisie usterki.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl border border-[#3b82f6]/35 bg-[#3b82f6]/15 px-3 py-2 text-xs font-semibold text-[#bfdbfe]">
            <Sparkles className="h-4 w-4" aria-hidden />
            Widok premium
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Naprawy łącznie" value={repairs.length} icon={Wrench} />
          <SummaryCard label="Naprawy aktywne" value={activeRepairs.length} icon={Wrench} tone="text-[#bfdbfe]" />
          <SummaryCard label="Archiwum" value={archiveRepairs.length} icon={Archive} tone="text-[#c4b5fd]" />
          <SummaryCard label="Klienci" value={clients.length} icon={Users} tone="text-[#bbf7d0]" />
        </div>
      </header>

      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--s1)]/70 p-5">
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-[#3b82f6]/30 via-[#60a5fa]/15 to-[#3b82f6]/30 blur-sm"
          />
          <div className="relative flex items-center gap-3 rounded-2xl border border-[#334155] bg-gradient-to-r from-[#0f172a]/90 via-[#111c34]/90 to-[#0f172a]/90 px-4 py-[13px] shadow-[0_10px_30px_rgba(2,6,23,.45)] transition focus-within:border-[#60a5fa]/70 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,.2),0_14px_34px_rgba(30,64,175,.28)]">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#3b82f6]/35 bg-[#1e3a8a]/25 text-[#93c5fd]">
              <Search size={15} className="shrink-0" />
            </span>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") pushRecent(query);
              }}
              placeholder="Szukaj: PK-54321, Kowalski, +48 600, 354612..., rozbity ekran..."
              className="w-full bg-transparent text-[15px] text-[var(--white)] outline-none placeholder:text-[#8da2c5]"
              autoComplete="off"
            />
            <span className="shrink-0 rounded-lg border border-[#3b82f6]/40 bg-[#1e3a8a]/25 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#bfdbfe]">
              Ctrl / K
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-1.5 text-xs font-semibold text-[var(--white)] transition hover:bg-[var(--row-active)]"
          >
            <Filter className="h-3.5 w-3.5" aria-hidden />
            Filtry
            {activeFilterCount > 0 ? (
              <span className="rounded-full border border-[#3b82f6]/45 bg-[#3b82f6]/20 px-2 py-0.5 text-[10px] text-[#bfdbfe]">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
          {recent.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setQuery(item);
                pushRecent(item);
                void performSearch(item);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--row-hover)] px-3 py-1 text-xs text-[#cbd5e1] transition hover:bg-[var(--row-active)]"
            >
              {item}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  removeRecent(item);
                }}
                className="text-[var(--ink2)]"
              >
                x
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence>
          {showFilters ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.16 }}
              className="mt-3 grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4 md:grid-cols-2 lg:grid-cols-4"
            >
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[var(--white)]">
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[var(--white)]">
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[var(--white)]">
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[var(--white)]" />
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[var(--white)]" />
              <label className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[#cbd5e1]">
                <input type="checkbox" checked={isWarranty} onChange={(e) => setIsWarranty(e.target.checked)} />
                Gwarancja
              </label>
              <label className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[#cbd5e1]">
                <input type="checkbox" checked={isComplaint} onChange={(e) => setIsComplaint(e.target.checked)} />
                Reklamacja
              </label>
              <button
                type="button"
                onClick={() => {
                  setStatus("");
                  setCategory("");
                  setPriority("");
                  setDateFrom("");
                  setDateTo("");
                  setIsWarranty(false);
                  setIsComplaint(false);
                }}
                className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
              >
                Wyczyść filtry
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {(
            [
              ["all", "Wszystko"],
              ["active_repairs", "Naprawy aktywne"],
              ["archive", "Historia napraw"],
              ["clients", "Klienci"],
            ] as Array<[ScopeKey, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setScope(key)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                scope === key
                  ? "border-white/20 bg-[var(--row-active)] text-[var(--white)]"
                  : "border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)] hover:bg-[var(--row-active)] hover:text-[var(--white)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4 shadow-[0_10px_32px_rgba(0,0,0,.2)]">
        {loading ? (
          <div className="py-2">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Szukam…</p>
            <RepairTableSkeleton rows={6} />
          </div>
        ) : null}
        {!loading && error ? <ErrorState error={new Error(error)} onRetry={() => void performSearch(query)} /> : null}
        {!loading && !error && query.trim().length < 2 ? (
          <p className="py-6 text-center text-sm text-[var(--muted)]">Wpisz min. 2 znaki, aby wyszukać wyniki.</p>
        ) : null}
        {!loading && !error && query.trim().length >= 2 && !hasAnyResult ? (
          <EmptyState icon={EMPTY_STATES.search.icon} title={EMPTY_STATES.search.title} description={EMPTY_STATES.search.description} />
        ) : null}

        {!loading && !error && query.trim().length >= 2 && hasAnyResult ? (
          <div className="space-y-5 animate-[fadeUp_.2s_ease]">
            {showActive ? (
              <section>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b93a8]">
                  Naprawy aktywne ({activeRepairs.length})
                </h3>
                <div className="space-y-2">
                  {activeRepairs.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => router.push(`/panel/naprawy/${r.id}`)}
                      className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-left transition hover:bg-[var(--row-active)]"
                    >
                      <div>
                        <p className="font-mono text-sm font-semibold text-[var(--white)]">{r.repair_number}</p>
                        <p className="text-xs text-[var(--ink2)]">
                          {r.client_name ?? "—"} · {r.device_name ?? "—"}
                        </p>
                      </div>
                      <span className="text-xs text-[var(--ink2)]">{r.status_display}</span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {showArchive ? (
              <section>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b93a8]">
                  Historia napraw ({archiveRepairs.length})
                </h3>
                <div className="space-y-2">
                  {archiveRepairs.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => router.push(`/panel/naprawy/${r.id}`)}
                      className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-left transition hover:bg-[var(--row-active)]"
                    >
                      <div>
                        <p className="font-mono text-sm font-semibold text-[var(--white)]">{r.repair_number}</p>
                        <p className="text-xs text-[var(--ink2)]">
                          {r.client_name ?? "—"} · {r.device_name ?? "—"}
                        </p>
                      </div>
                      <span className="text-xs text-[var(--ink2)]">{r.status_display}</span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {showClients ? (
              <section>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b93a8]">
                  Klienci ({clients.length})
                </h3>
                <div className="space-y-2">
                  {clients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        const repairId = c.last_repair_summary?.id;
                        if (repairId) router.push(`/panel/naprawy/${repairId}`);
                      }}
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
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-[1400px] flex-col gap-6 px-4 py-8">
          <header>
            <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Panel Pracownika</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Wyszukiwanie globalne</h1>
            <p className="mt-1 text-sm text-[#9ca3af]">
              Szukaj po: IMEI, nr tel, kliencie, nr naprawy, modelu i opisie usterki.
            </p>
          </header>
          <section className="rounded-2xl border border-white/10 bg-[#0c0d12] p-4">
            <RepairTableSkeleton rows={6} />
          </section>
        </main>
      }
    >
      <SearchPageInner />
    </Suspense>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone = "text-white",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:bg-white/[0.06]">
      <div className="flex items-center justify-between gap-2 text-[#9fb1d3]">
        <p className="text-[11px] uppercase tracking-[0.15em]">{label}</p>
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <p className={`mt-1 text-xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
