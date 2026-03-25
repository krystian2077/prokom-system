"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState, EMPTY_STATES } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { RepairTableSkeleton } from "@/components/ui/Skeleton";

type ClientRow = {
  id: string;
  client_number?: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  is_company?: boolean;
  is_premium?: boolean;
  company_name?: string | null;
  nip?: string | null;
  total_repairs?: number;
  active_repairs_count?: number;
  complaints_count?: number;
};

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type FilterKey = "all" | "vip" | "companies" | "active";

const PAGE_SIZE = 20;

function initials(c: ClientRow): string {
  const base = c.is_company ? c.company_name || c.full_name : c.full_name;
  const parts = (base || "?").trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function pageButtons(page: number, total: number): number[] {
  const set = new Set<number>([1, total]);
  for (let i = -2; i <= 2; i++) {
    const p = page + i;
    if (p >= 1 && p <= total) set.add(p);
  }
  return Array.from(set).sort((a, b) => a - b);
}

export default function AdminClientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user } = useAuth();

  const q = searchParams.get("q") ?? "";
  const filter = (searchParams.get("filter") as FilterKey) ?? "all";
  const page = Number(searchParams.get("page") ?? "1") || 1;

  const [searchDraft, setSearchDraft] = useState(q);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<Paginated<ClientRow> | null>(null);
  const [counts, setCounts] = useState({ all: 0, vip: 0, companies: 0, active: 0 });

  const setQuery = (next: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === null || String(v) === "" || (k === "filter" && v === "all")) params.delete(k);
      else params.set(k, String(v));
    });
    router.push(`/admin-panel/clients?${params.toString()}`);
  };

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (searchDraft !== q) setQuery({ q: searchDraft, page: 1 });
    }, 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  useEffect(() => {
    if (!token || user?.role !== "admin") return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("page_size", String(PAGE_SIZE));
        if (q.trim()) params.set("search", q.trim());
        if (filter === "vip") params.set("is_premium", "true");
        if (filter === "companies") params.set("is_company", "true");
        const res = await api.get<Paginated<ClientRow>>(`/clients/?${params.toString()}`, token);
        if (cancelled) return;
        setData(res);
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
  }, [token, user?.role, page, q, filter]);

  useEffect(() => {
    if (!token || user?.role !== "admin") return;
    let cancelled = false;
    const run = async () => {
      try {
        const base = new URLSearchParams();
        base.set("page", "1");
        base.set("page_size", "1");
        if (q.trim()) base.set("search", q.trim());

        const vip = new URLSearchParams(base);
        vip.set("is_premium", "true");
        const comp = new URLSearchParams(base);
        comp.set("is_company", "true");

        const [allRes, vipRes, compRes] = await Promise.all([
          api.get<Paginated<ClientRow>>(`/clients/?${base.toString()}`, token),
          api.get<Paginated<ClientRow>>(`/clients/?${vip.toString()}`, token),
          api.get<Paginated<ClientRow>>(`/clients/?${comp.toString()}`, token),
        ]);
        if (cancelled) return;
        setCounts((prev) => ({
          ...prev,
          all: allRes?.count ?? 0,
          vip: vipRes?.count ?? 0,
          companies: compRes?.count ?? 0,
        }));
      } catch {
        // optional counts
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [token, user?.role, q]);

  const visibleRows = useMemo(() => {
    const rows = data?.results ?? [];
    if (filter !== "active") return rows;
    return rows.filter((r) => (r.active_repairs_count ?? 0) > 0);
  }, [data, filter]);

  useEffect(() => {
    setCounts((prev) => ({
      ...prev,
      active: (data?.results ?? []).filter((r) => (r.active_repairs_count ?? 0) > 0).length,
    }));
  }, [data]);

  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));
  const buttons = pageButtons(page, totalPages);

  if (user?.role !== "admin") {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
        <p className="text-sm text-[#fca5a5]">Tylko administrator.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1400px] px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Panel Admina</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Klienci</h1>
          <p className="mt-1 text-sm text-[#9ca3af]">Baza klientów · {counts.all} łącznie</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/admin-panel/intake")}
          className="rounded-2xl bg-[#dc1e1e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b81818]"
        >
          + Nowy klient
        </button>
      </header>

      <section className="mt-4 rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
        <input
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          placeholder="Szukaj po nazwie, telefonie, emailu, NIP..."
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-[#6b7280]"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["all", `Wszyscy (${counts.all})`],
              ["vip", `VIP (${counts.vip})`],
              ["companies", `Firmy (${counts.companies})`],
              ["active", `Aktywna naprawa (${counts.active})`],
            ] as Array<[FilterKey, string]>
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setQuery({ filter: k, page: 1 })}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                filter === k
                  ? "border-[#3b82f6]/40 bg-[#3b82f6]/12 text-white"
                  : "border-white/10 bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {loading ? (
            <RepairTableSkeleton rows={8} />
          ) : error ? (
            <ErrorState error={error} onRetry={() => setQuery({ page })} />
          ) : visibleRows.length === 0 ? (
            <EmptyState
              icon={EMPTY_STATES.clients.icon}
              title={EMPTY_STATES.clients.title}
              description={EMPTY_STATES.clients.description}
            />
          ) : (
            <div className="space-y-2">
              {visibleRows.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => router.push(`/admin-panel/clients/${c.id}`)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-9 w-9 items-center justify-center text-xs font-bold text-white ${
                          c.is_company ? "rounded-xl bg-[#3b82f6]/60" : "rounded-full bg-[#1f2937]"
                        }`}
                      >
                        {initials(c)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-white">{c.is_company ? c.company_name || c.full_name : c.full_name}</p>
                          {c.is_premium ? (
                            <span className="rounded-full border border-[var(--ab)] bg-[var(--al)] px-2 py-0.5 text-[11px] font-semibold text-[var(--amber)]">
                              VIP
                            </span>
                          ) : null}
                          {c.is_company ? (
                            <span className="rounded-full border border-[var(--bb)] bg-[var(--bl)] px-2 py-0.5 text-[11px] font-semibold text-[var(--blue)]">
                              B2B Firma
                            </span>
                          ) : null}
                          {(c.total_repairs ?? 0) >= 3 ? (
                            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-[#cbd5e1]">
                              Stały
                            </span>
                          ) : null}
                        </div>
                        <p className="truncate text-xs text-[#9ca3af]">
                          {c.phone || "—"} · {c.email || "—"} {c.nip ? `· NIP ${c.nip}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-[#9ca3af]">
                      <div>Naprawy: {c.total_repairs ?? 0}</div>
                      <div>Aktywne: {c.active_repairs_count ?? 0}</div>
                      <div>Reklamacje: {c.complaints_count ?? 0}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#9ca3af]">
            Wyświetlono {visibleRows.length} z {data?.count ?? 0} klientów
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setQuery({ page: Math.max(1, page - 1), filter, q })}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#9ca3af] disabled:opacity-50"
            >
              ←
            </button>
            {buttons.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setQuery({ page: p, filter, q })}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  p === page
                    ? "border-[#3b82f6]/35 bg-[#3b82f6]/14 text-white"
                    : "border-white/10 bg-white/5 text-[#9ca3af]"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setQuery({ page: Math.min(totalPages, page + 1), filter, q })}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#9ca3af] disabled:opacity-50"
            >
              →
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

