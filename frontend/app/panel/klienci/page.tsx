"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/Skeleton";

type ClientListItem = {
  id: string;
  client_number: string;
  full_name: string;
  email: string;
  phone: string;
  client_type: string;
  client_type_display?: string;
  client_segment: string;
  client_segment_display?: string;
  visit_count: number;
  total_repairs: number;
  created_at: string;

  // dodatkowe pola do UI
  company_name?: string;
  nip?: string;
  contact_person?: string;
  is_vip?: boolean;
  is_blacklisted?: boolean;
  last_visit_at?: string | null;
};

type ClientDetail = ClientListItem & {
  city?: string;
  street?: string;
  postal_code?: string;
  preferred_contact?: string;
};

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type FilterKey = "all" | "regular" | "vip" | "business" | "active_repair";

const PAGE_SIZE = 20;

function computeAvatarInitials(item: ClientListItem): string {
  const raw =
    item.client_type === "business" && item.company_name
      ? item.company_name
      : item.full_name || item.client_number || "?";

  const cleaned = raw
    .trim()
    .replace(/[\u0000-\u001F]/g, "")
    .replace(/[^A-Za-z0-9ĄĆĘŁŃÓŚŹŻąćęłńóśźż ]/g, " ")
    .replace(/\s+/g, " ");

  if (!cleaned) return "?";
  const parts = cleaned.split(" ").filter(Boolean);
  if (parts.length === 1) {
    const one = parts[0];
    return one.slice(0, Math.min(2, one.length)).toUpperCase();
  }
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function segmentBadge(item: ClientListItem): { label: string; styles: CSSProperties } | null {
  if (item.client_type === "business") {
    return {
      label: "FIRMA",
      styles: {
        background: "rgba(59,130,246,.14)",
        border: "1px solid rgba(59,130,246,.28)",
        color: "#3b82f6",
      },
    };
  }

  if (item.is_vip || item.client_segment === "premium") {
    return {
      label: "VIP",
      styles: {
        background: "rgba(139,92,246,.14)",
        border: "1px solid rgba(139,92,246,.28)",
        color: "#8b5cf6",
      },
    };
  }

  // uproszczona logika wg segmentu + wizyt
  if (item.client_segment === "regular" || item.visit_count >= 3) {
    return {
      label: "STAŁY",
      styles: { background: "rgba(245,158,11,.16)", border: "1px solid rgba(245,158,11,.30)", color: "#f59e0b" },
    };
  }
  if (item.client_segment === "returning" || item.visit_count >= 2) {
    return {
      label: "WRACA",
      styles: { background: "rgba(34,197,94,.14)", border: "1px solid rgba(34,197,94,.28)", color: "#22c55e" },
    };
  }
  return {
    label: "NOWY",
    styles: { background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", color: "#8b93a8" },
  };
}

function buildParams({
  page,
  search,
  filter,
}: {
  page: number;
  search: string;
  filter: FilterKey;
}): URLSearchParams {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("ordering", "-created_at");
  if (search.trim()) params.set("search", search.trim());

  if (filter === "regular") params.set("client_segment", "regular");
  if (filter === "vip") params.set("is_vip", "true");
  if (filter === "business") params.set("client_type", "business");
  // filter === "active_repair" nie jest wspierane przez API (zrobimy to po stronie UI)

  return params;
}

function buildPageButtons(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 1) return [1];
  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);

  for (let d = -2; d <= 2; d++) {
    const p = currentPage + d;
    if (p >= 1 && p <= totalPages) pages.add(p);
  }
  return Array.from(pages).sort((a, b) => a - b);
}

export default function ClientsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filter, setFilter] = useState<FilterKey>("all");
  const page = Number(searchParams.get("page") ?? "1") || 1;

  const setPage = (next: number | ((prev: number) => number)) => {
    const nextPage = typeof next === "function" ? next(page) : next;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`/panel/klienci?${params.toString()}`);
  };

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");

  const [data, setData] = useState<Paginated<ClientListItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientDetail | null>(null);
  const [selectedRepairs, setSelectedRepairs] = useState<Array<{ id: string; repair_number: string; status_display: string; device_name: string }>>([]);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [selectedError, setSelectedError] = useState<string | null>(null);

  const [counts, setCounts] = useState({ all: 0, regular: 0, vip: 0, business: 0, activeOnPage: 0 });

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchDraft);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchDraft]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = buildParams({ page, search, filter });
        const res = await api.get<Paginated<ClientListItem>>(`/clients/?${params.toString()}`, token);
        if (cancelled) return;
        setData(res);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Błąd ładowania klientów.");
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [token, page, search, filter]);

  // liczniki pigułek (tylko dla filtrów wspieranych przez API)
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const run = async () => {
      try {
        const base = new URLSearchParams();
        base.set("page", "1");
        base.set("ordering", "-created_at");
        if (search.trim()) base.set("search", search.trim());

        const allRes = await api.get<Paginated<ClientListItem>>(`/clients/?${base.toString()}`, token);
        if (cancelled) return;

        const regularParams = new URLSearchParams(base);
        regularParams.set("client_segment", "regular");
        const vipParams = new URLSearchParams(base);
        vipParams.set("is_vip", "true");
        const businessParams = new URLSearchParams(base);
        businessParams.set("client_type", "business");

        const [regularRes, vipRes, businessRes] = await Promise.all([
          api.get<Paginated<ClientListItem>>(`/clients/?${regularParams.toString()}`, token),
          api.get<Paginated<ClientListItem>>(`/clients/?${vipParams.toString()}`, token),
          api.get<Paginated<ClientListItem>>(`/clients/?${businessParams.toString()}`, token),
        ]);
        if (cancelled) return;

        setCounts({
          all: allRes?.count ?? 0,
          regular: regularRes?.count ?? 0,
          vip: vipRes?.count ?? 0,
          business: businessRes?.count ?? 0,
          activeOnPage: 0,
        });
      } catch {
        // ignore - liczniki są opcjonalne
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [token, search]);

  const visibleClients = useMemo(() => {
    const list = data?.results ?? [];
    if (filter !== "active_repair") return list;
    return list.filter((c) => (c.total_repairs ?? 0) > 0);
  }, [data, filter]);

  useEffect(() => {
    // count aktywnej naprawy liczymy po stronie UI (na bieżącej stronie)
    const activeOnPage = (data?.results ?? []).filter((c) => (c.total_repairs ?? 0) > 0).length;
    setCounts((prev) => ({ ...prev, activeOnPage }));
  }, [data]);

  const totalPages = useMemo(() => {
    const count = data?.count ?? 0;
    return Math.max(1, Math.ceil(count / PAGE_SIZE));
  }, [data]);

  const pageButtons = useMemo(() => buildPageButtons(page, totalPages), [page, totalPages]);
  const shownCount = visibleClients.length;

  useEffect(() => {
    if (!token || !selectedClientId) return;
    let cancelled = false;
    const run = async () => {
      setSelectedLoading(true);
      setSelectedError(null);
      try {
        const [clientRes, repairsRes] = await Promise.all([
          api.get<ClientDetail>(`/clients/${selectedClientId}/`, token),
          api.get<Array<{ id: string; repair_number: string; status_display: string; device_name: string }>>(
            `/staff/repairs/?client=${selectedClientId}&ordering=-created_at`,
            token,
          ),
        ]);
        if (cancelled) return;
        setSelectedClient(clientRes);
        setSelectedRepairs(Array.isArray(repairsRes) ? repairsRes : []);
      } catch (e) {
        if (cancelled) return;
        setSelectedError(e instanceof Error ? e.message : "Nie udało się pobrać szczegółów klienta.");
      } finally {
        if (cancelled) return;
        setSelectedLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [token, selectedClientId]);

  const titleForFilter: Record<FilterKey, string> = {
    all: "Wszyscy",
    regular: "Stali",
    vip: "VIP",
    business: "Firmy",
    active_repair: "Aktywna naprawa",
  };

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-8">
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="relative">
              <input
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                className="h-11 w-full rounded-2xl border border-white/10 bg-[#111318] px-4 pr-12 text-sm text-white outline-none placeholder:opacity-60 focus:border-[#3b82f6]"
                placeholder="Szukaj po nazwie, telefonie, e-mailu…"
              />
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#8b93a8]" aria-hidden>
                ⌕
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <Link
              href="/panel/intake"
              className="rounded-2xl bg-[#3b82f6] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2563eb]"
            >
              + Nowe przyjęcie
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
          {(
            [
              ["all", counts.all],
              ["regular", counts.regular],
              ["vip", counts.vip],
              ["business", counts.business],
              ["active_repair", counts.activeOnPage],
            ] as Array<[FilterKey, number]>
          ).map(([k, count]) => {
            const on = filter === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setFilter(k);
                  setPage(1);
                }}
                className="rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition"
                style={{
                  background: on ? "rgba(59,130,246,.14)" : "rgba(255,255,255,.03)",
                  borderColor: on ? "rgba(59,130,246,.35)" : "rgba(255,255,255,.10)",
                  color: on ? "#fff" : "#8b93a8",
                  borderWidth: 1,
                }}
              >
                <span>{titleForFilter[k]}</span>
                <span className="ml-2 text-[11px]" style={{ color: on ? "rgba(255,255,255,.88)" : "#9ca3af" }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-[#fca5a5]">{error}</div>
        )}

        <div className="mt-4 space-y-3">
          {loading ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={i}
                className="h-[92px] animate-pulse rounded-2xl border border-white/10 bg-white/5"
              />
            ))
          ) : visibleClients.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-7 text-sm text-[#9ca3af]">
              Brak klientów do wyświetlenia.
            </div>
          ) : (
            visibleClients.map((c) => {
              const displayName =
                c.client_type === "business" ? c.company_name || c.full_name : c.full_name || c.client_number;
              const badge = segmentBadge(c);
              const avatarInitials = computeAvatarInitials(c);
              const blacklisted = Boolean(c.is_blacklisted);
              const vip = Boolean(c.is_vip);

              return (
                <div
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedClientId(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setSelectedClientId(c.id);
                  }}
                  className="rounded-2xl border border-white/10 bg-[#0b0c10] px-4 py-4 transition hover:border-white/20"
                  style={{
                    borderColor: selectedClientId === c.id ? "rgba(59,130,246,.35)" : undefined,
                    background: selectedClientId === c.id ? "rgba(59,130,246,.08)" : undefined,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{
                          background: vip
                            ? "linear-gradient(135deg, rgba(139,92,246,1), rgba(220,30,30,.9))"
                            : "linear-gradient(135deg, rgba(59,130,246,1), rgba(29,78,216,.9))",
                          boxShadow: vip ? "0 0 0 1px rgba(139,92,246,.35) inset" : "0 0 0 1px rgba(59,130,246,.35) inset",
                        }}
                        aria-hidden
                      >
                        {avatarInitials}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-semibold text-white">{displayName}</span>
                          {vip && (
                            <span
                              className="rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                              style={{
                                background: "rgba(245,158,11,.14)",
                                border: "1px solid rgba(245,158,11,.30)",
                                color: "#f59e0b",
                              }}
                            >
                              VIP
                            </span>
                          )}
                          {badge && !vip && (
                            <span
                              className="rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                              style={badge.styles}
                            >
                              {badge.label}
                            </span>
                          )}
                          {blacklisted && (
                            <span
                              className="rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                              style={{
                                background: "rgba(220,38,38,.14)",
                                border: "1px solid rgba(220,38,38,.28)",
                                color: "#dc2626",
                              }}
                            >
                              BLACKLIST
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#8b93a8]">
                          <span className="truncate">📞 {c.phone || "—"}</span>
                          <span className="truncate">✉️ {c.email || "—"}</span>
                          {c.client_type === "business" && (c.nip || c.contact_person) && (
                            <span className="truncate">
                              {c.nip ? `NIP ${c.nip}` : c.contact_person ? `Osoba: ${c.contact_person}` : null}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-4">
                      <div className="text-right">
                        <div className="text-base font-semibold text-white">{c.total_repairs ?? 0}</div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8b93a8]">Naprawy</div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-semibold text-white">{c.visit_count ?? 0}</div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8b93a8]">Wizyty</div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-semibold text-white">{blacklisted ? 1 : 0}</div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8b93a8]">Ryzyko</div>
                      </div>

                      <button
                        type="button"
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af] transition hover:border-white/20 hover:text-white"
                        style={{
                          borderColor: c.total_repairs > 0 ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.08)",
                        }}
                      >
                        {c.client_number} {c.total_repairs > 0 ? "Aktywna" : "—"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 text-xs text-[#9ca3af]">
          <button
            type="button"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:border-white/20 disabled:opacity-50 disabled:hover:border-white/10"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ←
          </button>

          {pageButtons.map((p) => {
            const isActive = p === page;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className="rounded-xl border px-3 py-2 transition"
                style={{
                  background: isActive ? "rgba(59,130,246,.14)" : "rgba(255,255,255,.03)",
                  borderColor: isActive ? "rgba(59,130,246,.35)" : "rgba(255,255,255,.10)",
                  color: isActive ? "#fff" : "#8b93a8",
                }}
              >
                {p}
              </button>
            );
          })}

          <button
            type="button"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:border-white/20 disabled:opacity-50 disabled:hover:border-white/10"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            →
          </button>
        </div>
        <div className="mt-4 text-sm text-[#9ca3af]">Wyświetlono {shownCount} z {data?.count ?? 0} klientów</div>
      </div>

      <aside className="rounded-3xl border border-white/10 bg-[#0c0d12] p-5">
        <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9ca3af]">Podgląd klienta</div>
        {!selectedClientId ? (
          <div className="mt-3 text-sm text-[#6b7280]">Kliknij klienta na liście, aby pobrać szczegóły.</div>
        ) : selectedLoading ? (
          <div className="mt-3 space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full max-w-xs" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : selectedError ? (
          <div className="mt-3 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-[#fca5a5]">{selectedError}</div>
        ) : selectedClient ? (
          <div className="mt-3 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-[#0f1117] p-3">
              <div className="text-sm font-semibold text-white">{selectedClient.full_name}</div>
              <div className="mt-1 text-xs text-[#9ca3af]">{selectedClient.email || "—"} · {selectedClient.phone || "—"}</div>
              <div className="mt-1 text-xs text-[#9ca3af]">{selectedClient.street || ""} {selectedClient.city || ""} {selectedClient.postal_code || ""}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0f1117] p-3">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Naprawy klienta</div>
              <div className="mt-2 space-y-2">
                {selectedRepairs.slice(0, 6).map((r) => (
                  <Link key={r.id} href={`/panel/naprawy/${r.id}`} className="block rounded-xl border border-white/10 bg-[#0c0d12] px-3 py-2 hover:border-white/20">
                    <div className="font-mono text-xs font-semibold text-white">{r.repair_number}</div>
                    <div className="mt-0.5 text-xs text-[#9ca3af]">{r.device_name}</div>
                    <div className="mt-0.5 text-[11px] text-[#93c5fd]">{r.status_display}</div>
                  </Link>
                ))}
                {selectedRepairs.length === 0 ? <div className="text-xs text-[#6b7280]">Brak napraw klienta.</div> : null}
              </div>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
    </main>
  );
}

