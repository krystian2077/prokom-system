"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Building2, ChevronRight, ShieldAlert, Sparkles, Search, Users } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { usePanelBasePath } from "@/lib/panelPaths";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { RepairTableSkeleton } from "@/components/ui/Skeleton";
import {
  AdminClientListItem,
  formatDate,
  getClientBadgeStyle,
  getClientDisplayName,
  getClientInitials,
} from "./shared";

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type FilterKey = "all" | "vip" | "companies" | "blacklisted";

const PAGE_SIZE = 20;

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Wszyscy" },
  { key: "vip", label: "VIP" },
  { key: "companies", label: "Firmy" },
  { key: "blacklisted", label: "Blacklist" },
];

function pageButtons(page: number, total: number): number[] {
  const set = new Set<number>([1, total]);
  for (let i = -2; i <= 2; i++) {
    const p = page + i;
    if (p >= 1 && p <= total) set.add(p);
  }
  return Array.from(set).sort((a, b) => a - b);
}

function isFilterKey(value: string | null): value is FilterKey {
  return value === "all" || value === "vip" || value === "companies" || value === "blacklisted";
}

export default function AdminClientsPage() {
  const panelPaths = usePanelBasePath();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user } = useAuth();
  const isStaffOrAdmin = user?.role === "staff" || user?.role === "admin";

  const q = searchParams.get("q") ?? "";
  const filter = isFilterKey(searchParams.get("filter")) ? (searchParams.get("filter") as FilterKey) : "all";
  const page = Number(searchParams.get("page") ?? "1") || 1;

  const [searchDraft, setSearchDraft] = useState(q);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<Paginated<AdminClientListItem> | null>(null);
  const [counts, setCounts] = useState({ all: 0, vip: 0, companies: 0, blacklisted: 0 });

  const setQuery = (next: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === null || String(v) === "" || (k === "filter" && v === "all")) params.delete(k);
      else params.set(k, String(v));
    });
    const qs = params.toString();
    router.push(qs ? `${panelPaths.klienciPath}?${qs}` : panelPaths.klienciPath);
  };

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (searchDraft !== q) setQuery({ q: searchDraft, page: 1 });
    }, 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  useEffect(() => {
    if (!token || !isStaffOrAdmin) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("page_size", String(PAGE_SIZE));
        params.set("ordering", "-created_at");
        if (q.trim()) params.set("search", q.trim());
        if (filter === "vip") params.set("is_vip", "true");
        if (filter === "companies") params.set("client_type", "business");
        if (filter === "blacklisted") params.set("is_blacklisted", "true");
        const res = await api.get<Paginated<AdminClientListItem>>(`/clients/?${params.toString()}`, token);
        if (cancelled) return;
        setData(res);
        setCounts((prev) => ({ ...prev, all: res?.count ?? 0 }));
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e : new Error("Nie udało się pobrać klientów."));
        setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [isStaffOrAdmin, token, page, q, filter]);

  useEffect(() => {
    if (!token || !isStaffOrAdmin) return;
    let cancelled = false;
    const run = async () => {
      try {
        const base = new URLSearchParams();
        base.set("page", "1");
        base.set("page_size", "1");
        base.set("ordering", "-created_at");
        if (q.trim()) base.set("search", q.trim());

        const vip = new URLSearchParams(base);
        vip.set("is_vip", "true");
        const comp = new URLSearchParams(base);
        comp.set("client_type", "business");
        const blacklisted = new URLSearchParams(base);
        blacklisted.set("is_blacklisted", "true");

        const [vipRes, compRes, blacklistedRes] = await Promise.allSettled([
          api.get<Paginated<AdminClientListItem>>(`/clients/?${vip.toString()}`, token),
          api.get<Paginated<AdminClientListItem>>(`/clients/?${comp.toString()}`, token),
          api.get<Paginated<AdminClientListItem>>(`/clients/?${blacklisted.toString()}`, token),
        ]);
        if (cancelled) return;
        setCounts({
          all: data?.count ?? 0,
          vip: vipRes.status === "fulfilled" ? vipRes.value?.count ?? 0 : 0,
          companies: compRes.status === "fulfilled" ? compRes.value?.count ?? 0 : 0,
          blacklisted: blacklistedRes.status === "fulfilled" ? blacklistedRes.value?.count ?? 0 : 0,
        });
      } catch {
        // opcjonalne liczniki
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [isStaffOrAdmin, token, q, data?.count]);

  const rows = useMemo(() => data?.results ?? [], [data]);
  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));
  const buttons = pageButtons(page, totalPages);

  const summary = useMemo(
    () => ({
      total: data?.count ?? 0,
      pages: totalPages,
      shown: rows.length,
      latestUpdate: rows[0]?.created_at ?? null,
    }),
    [data?.count, rows, totalPages],
  );

  if (!isStaffOrAdmin) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
        <p className="text-sm text-[#fca5a5]">Brak uprawnień.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-8">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(244,114,182,.08),transparent_24%),linear-gradient(180deg,#080b14_0%,#0b0f19_48%,#090c14_100%)]" />
      <header className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(16,20,32,.98),rgba(10,13,22,.98))] p-5 shadow-[0_24px_70px_rgba(0,0,0,.42)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,.18),transparent_32%),radial-gradient(circle_at_top_right,rgba(245,158,11,.10),transparent_26%),linear-gradient(180deg,rgba(255,255,255,.03),transparent_30%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,.08),transparent)] blur-2xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.25em] text-[#9ca3af]">{panelPaths.isAdminPanel ? "Panel Admina" : "Panel Pracownika"}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Klienci</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#a9b8d6]">
              Premium baza klientów z szybkim podglądem najważniejszych danych: kontakt, segment, wizyty, naprawy i statusy.
            </p>
          </div>
          <div className="relative flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void setQuery({ page })}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#d1d5db] transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <ArrowRight size={16} className={loading ? "animate-pulse" : ""} />
              Odśwież
            </button>
            <button
              type="button"
              onClick={() => router.push(panelPaths.intakePath)}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#dc1e1e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b81818]"
            >
              + Nowy klient
            </button>
          </div>
        </div>

        <div className="relative mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={<Users size={16} />} label="Wszyscy" value={counts.all} hint="Cała baza klientów" />
          <StatCard icon={<Sparkles size={16} />} label="VIP" value={counts.vip} hint="Klienci premium" />
          <StatCard icon={<Building2 size={16} />} label="Firmy" value={counts.companies} hint="Klienci biznesowi" />
          <StatCard icon={<ShieldAlert size={16} />} label="Blacklist" value={counts.blacklisted} hint="Wymagają uwagi" />
        </div>
      </header>

      <section className="relative mt-5 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(13,17,28,.96),rgba(9,12,20,.96))] p-4 shadow-[0_20px_60px_rgba(0,0,0,.26)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,.10),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,.06),transparent_26%)]" />
        <label className="relative block">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7280]" />
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Szukaj po nazwie, telefonie, emailu, NIP, numerze klienta..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-[#6b7280] outline-none transition focus:border-[#60a5fa]/45 focus:ring-4 focus:ring-[#60a5fa]/10"
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setQuery({ filter: item.key, page: 1 })}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                filter === item.key
                  ? "border-[#3b82f6]/40 bg-[#3b82f6]/14 text-white"
                  : "border-white/10 bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.key === "all"
                ? `${item.label} (${counts.all})`
                : item.key === "vip"
                  ? `${item.label} (${counts.vip})`
                  : item.key === "companies"
                    ? `${item.label} (${counts.companies})`
                    : `${item.label} (${counts.blacklisted})`}
            </button>
          ))}
        </div>

        <div className="relative mt-5">
          {loading ? (
            <RepairTableSkeleton rows={8} />
          ) : error ? (
            <ErrorState error={error} onRetry={() => setQuery({ page })} />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={EMPTY_STATES.clients.icon}
              title={EMPTY_STATES.clients.title}
              description={EMPTY_STATES.clients.description}
            />
          ) : (
            <div className="space-y-3">
              {rows.map((c) => {
                const displayName = getClientDisplayName(c);
                const badge = getClientBadgeStyle(c);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => router.push(`${panelPaths.klienciPath}/${c.id}`)}
                    className="group w-full rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.025))] px-4 py-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-[rgba(255,255,255,.07)] hover:shadow-[0_18px_40px_rgba(0,0,0,.24)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <span
                          className={`flex h-12 w-12 shrink-0 items-center justify-center text-sm font-bold text-white shadow-[0_10px_24px_rgba(0,0,0,.24)] ${
                            c.client_type === "business" ? "rounded-2xl bg-[#3b82f6]/55" : "rounded-full bg-[#1f2937]"
                          }`}
                        >
                          {getClientInitials(c)}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-base font-semibold text-white">{displayName}</p>
                            {badge ? (
                              <span
                                className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em]"
                                style={badge.styles}
                              >
                                {badge.label}
                              </span>
                            ) : null}
                            {c.is_vip ? (
                              <span className="rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/12 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#fdba74]">
                                VIP
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 truncate text-xs text-[#9ca3af]">
                            {c.client_number || "—"} · {c.phone || "—"} · {c.email || "—"}
                          </p>
                          <p className="mt-2 text-xs text-[#8b93a8]">
                            {c.client_type_display || (c.client_type === "business" ? "Firma" : "Osoba prywatna")} · {c.client_segment_display || "Nowy klient"}
                            {c.last_visit_at ? ` · Ostatnia wizyta ${formatDate(c.last_visit_at)}` : " · Brak wizyty"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        <div className="hidden sm:block">
                          <div className="text-xs uppercase tracking-[0.16em] text-[#6b7280]">Naprawy</div>
                          <div className="mt-1 text-lg font-semibold text-white">{c.total_repairs ?? 0}</div>
                        </div>
                        <div className="hidden sm:block">
                          <div className="text-xs uppercase tracking-[0.16em] text-[#6b7280]">Wizyty</div>
                          <div className="mt-1 text-lg font-semibold text-white">{c.visit_count ?? 0}</div>
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#cbd5e1] transition group-hover:bg-white/10 group-hover:text-white">
                          Szczegóły
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
          <div className="text-sm text-[#9ca3af]">
            Wyświetlono {summary.shown} z {summary.total} klientów
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setQuery({ page: Math.max(1, page - 1), filter, q })}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#9ca3af] transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              ←
            </button>
            {buttons.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setQuery({ page: p, filter, q })}
                className={`rounded-xl border px-3 py-2 text-sm transition ${
                  p === page
                    ? "border-[#3b82f6]/35 bg-[#3b82f6]/14 text-white"
                    : "border-white/10 bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setQuery({ page: Math.min(totalPages, page + 1), filter, q })}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#9ca3af] transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              →
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: number; hint: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[.045] p-4 shadow-[0_12px_26px_rgba(0,0,0,.18)] backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9db0d4]">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#93c5fd]">
          {icon}
        </div>
      </div>
      <p className="mt-2 text-xs text-[#7f8ca6]">{hint}</p>
    </div>
  );
}
