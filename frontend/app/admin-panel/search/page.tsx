"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { RepairTableSkeleton } from "@/components/ui/Skeleton";
import type { AdvancedSearchResponse, GlobalSearchClient, GlobalSearchRepair, GlobalSearchResponse } from "@/types/search";

type ResultScope = "all" | "active_repairs" | "archive" | "clients";

type StaffMember = {
  id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
};

const RECENT_KEY = "prokom-recent-searches-admin";

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
  return ["repair_done", "picked_up", "shipped", "delivered", "cancelled", "unrepairable", "abandoned"].includes(
    (status ?? "").toLowerCase(),
  );
}

function AdminSearchPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, token } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [query, setQuery] = useState("");
  const scope = useMemo<ResultScope>(() => {
    const s = searchParams.get("scope");
    const allowed: ResultScope[] = ["all", "active_repairs", "archive", "clients"];
    return s && allowed.includes(s as ResultScope) ? (s as ResultScope) : "all";
  }, [searchParams]);

  const setScope = (key: ResultScope) => {
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
  const [assignedTo, setAssignedTo] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isWarranty, setIsWarranty] = useState(false);
  const [isComplaint, setIsComplaint] = useState(false);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repairs, setRepairs] = useState<GlobalSearchRepair[]>([]);
  const [clients, setClients] = useState<GlobalSearchClient[]>([]);

  const hasAdvancedFilters = Boolean(
    status || category || priority || assignedTo || dateFrom || dateTo || isWarranty || isComplaint,
  );

  const activeRepairs = useMemo(() => repairs.filter((r) => !isArchived(r.status)), [repairs]);
  const archiveRepairs = useMemo(() => repairs.filter((r) => isArchived(r.status)), [repairs]);

  const hasAnyResult = activeRepairs.length + archiveRepairs.length + clients.length > 0;
  const showActive = scope === "all" || scope === "active_repairs";
  const showArchive = scope === "all" || scope === "archive";
  const showClients = scope === "all" || scope === "clients";

  const pushRecent = (term: string) => {
    const value = term.trim();
    if (value.length < 2) return;
    setRecent((prev) => {
      const next = [value, ...prev.filter((x) => x.toLowerCase() !== value.toLowerCase())].slice(0, 5);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  };

  const performSearch = useCallback(
    async (q: string) => {
      if (!token) return;
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
          const globalRes = await api.get<GlobalSearchResponse>(
            `/search/global/?q=${encodeURIComponent(needle)}&limit=20`,
            token,
          );
          setRepairs(globalRes?.repairs ?? []);
          setClients(globalRes?.clients ?? []);
        } else {
          const params = new URLSearchParams();
          params.set("q", needle);
          params.set("limit", "20");
          if (status) params.set("status", status);
          if (category) params.set("category", category);
          if (priority) params.set("priority", priority);
          if (assignedTo) params.set("assigned_to", assignedTo);
          if (dateFrom) params.set("date_from", dateFrom);
          if (dateTo) params.set("date_to", dateTo);
          if (isWarranty) params.set("is_warranty", "true");
          if (isComplaint) params.set("is_complaint", "true");
          const adv = await api.get<AdvancedSearchResponse>(`/search/advanced/?${params.toString()}`, token);
          setRepairs(adv?.repairs ?? []);
          setClients(adv?.clients ?? []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Nie udało się pobrać wyników.");
        setRepairs([]);
        setClients([]);
      } finally {
        setLoading(false);
      }
    },
    [assignedTo, category, dateFrom, dateTo, hasAdvancedFilters, isComplaint, isWarranty, priority, status, token],
  );

  useEffect(() => {
    if (user?.role !== "admin" || !token) return;
    void api
      .get<StaffMember[] | { results?: StaffMember[] }>("/accounts/staff/", token)
      .then((res) => setStaff(Array.isArray(res) ? res : res?.results ?? []))
      .catch(() => setStaff([]));
  }, [token, user?.role]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setRecent(parsed.filter((v) => typeof v === "string").slice(0, 5));
    } catch {
      setRecent([]);
    }
  }, []);

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
    const t = window.setTimeout(() => void performSearch(query), 300);
    return () => window.clearTimeout(t);
  }, [query, performSearch]);

  if (user?.role !== "admin") {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
        <p className="text-sm text-[#fca5a5]">Tylko administrator.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Panel Admina</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Wyszukiwanie globalne</h1>
        <p className="mt-1 text-sm text-[#9ca3af]">
          Szukaj po: IMEI, nr tel, kliencie, nr naprawy, modelu i opisie usterki.
        </p>
      </header>

      <section className="rounded-3xl border border-white/10 bg-[#0b0c10]/40 p-5">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#11131a]/70 px-4 py-[13px] focus-within:border-[#3b82f6]/45 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,.1)]">
          <Search size={16} className="shrink-0 text-[#9ca3af]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") pushRecent(query);
            }}
            placeholder="Szukaj: PK-54321, Kowalski, +48 600, 354612..., rozbity ekran..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#6b7280]"
          />
          <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-[#9ca3af]">
            ⌘K
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#cbd5e1] hover:bg-white/10"
          >
            Filtry
          </button>
          {recent.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setQuery(item);
                pushRecent(item);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#cbd5e1] hover:bg-white/10"
            >
              {item}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setRecent((prev) => {
                    const next = prev.filter((x) => x !== item);
                    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
                    return next;
                  });
                }}
                className="text-[#9ca3af]"
              >
                ×
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
              className="mt-3 grid gap-3 rounded-2xl border border-white/10 bg-[#0c0d12] p-4 md:grid-cols-2 lg:grid-cols-4"
            >
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                <option value="">Wszyscy przypisani</option>
                {staff.map((s) => {
                  const label = s.full_name || `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || s.email || "Pracownik";
                  return (
                    <option key={s.id} value={s.id}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
              <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#cbd5e1]">
                <input type="checkbox" checked={isWarranty} onChange={(e) => setIsWarranty(e.target.checked)} />
                Gwarancja
              </label>
              <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#cbd5e1]">
                <input type="checkbox" checked={isComplaint} onChange={(e) => setIsComplaint(e.target.checked)} />
                Reklamacja
              </label>
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
            ] as Array<[ResultScope, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setScope(key)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                scope === key
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white/10 bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0c0d12] p-4">
        {loading ? (
          <div className="py-2">
            <RepairTableSkeleton rows={6} />
          </div>
        ) : null}
        {!loading && error ? <ErrorState error={new Error(error)} onRetry={() => void performSearch(query)} /> : null}
        {!loading && !error && query.trim().length < 2 ? (
          <p className="text-sm text-[#6b7280]">Wpisz min. 2 znaki, aby wyszukać wyniki.</p>
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
                      onClick={() => router.push(`/admin-panel/repairs/${r.id}`)}
                      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:bg-white/10"
                    >
                      <div>
                        <p className="font-mono text-sm font-semibold text-white">{r.repair_number}</p>
                        <p className="text-xs text-[#9ca3af]">
                          {r.client_name ?? "—"} · {r.device_name ?? "—"}
                        </p>
                      </div>
                      <span className="text-xs text-[#9ca3af]">{r.status_display}</span>
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
                      onClick={() => router.push(`/admin-panel/repairs/${r.id}`)}
                      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:bg-white/10"
                    >
                      <div>
                        <p className="font-mono text-sm font-semibold text-white">{r.repair_number}</p>
                        <p className="text-xs text-[#9ca3af]">
                          {r.client_name ?? "—"} · {r.device_name ?? "—"}
                        </p>
                      </div>
                      <span className="text-xs text-[#9ca3af]">{r.status_display}</span>
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
                        if (repairId) router.push(`/admin-panel/repairs/${repairId}`);
                      }}
                      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:bg-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                          {c.full_name?.slice(0, 1) || "K"}
                        </span>
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
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default function AdminSearchPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8">
          <header>
            <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Panel Admina</p>
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
      <AdminSearchPageInner />
    </Suspense>
  );
}
