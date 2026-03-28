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

function formatDateShort(iso: string | undefined | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

function clientDisplayName(c: ClientListItem): string {
  return c.client_type === "business" ? c.company_name || c.full_name : c.full_name || c.client_number;
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
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="relative">
              <input
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                className="h-11 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 pr-12 text-sm text-[var(--white)] outline-none placeholder:opacity-60 focus:border-[#3b82f6]"
                placeholder="Szukaj po nazwie, telefonie, e-mailu…"
              />
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--ink2)]" aria-hidden>
                ⌕
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <Link
              href="/panel/intake"
              className="rounded-2xl bg-[#3b82f6] px-5 py-2.5 text-sm font-semibold text-[var(--white)] transition hover:bg-[#2563eb]"
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
                className="h-[92px] animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--row-hover)]"
              />
            ))
          ) : visibleClients.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-black/20 px-4 py-7 text-sm text-[var(--ink2)]">
              Brak klientów do wyświetlenia.
            </div>
          ) : (
            visibleClients.map((c) => {
              const displayName = clientDisplayName(c);
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
                  className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] px-4 py-4 transition hover:border-white/20"
                  style={{
                    borderColor: selectedClientId === c.id ? "rgba(59,130,246,.35)" : undefined,
                    background: selectedClientId === c.id ? "rgba(59,130,246,.08)" : undefined,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-[var(--white)]"
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
                          <span className="truncate text-sm font-semibold text-[var(--white)]">{displayName}</span>
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

                        <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[var(--ink2)]">
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
                        <div className="text-base font-semibold text-[var(--white)]">{c.total_repairs ?? 0}</div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink2)]">Naprawy</div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-semibold text-[var(--white)]">{c.visit_count ?? 0}</div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink2)]">Wizyty</div>
                      </div>

                      <button
                        type="button"
                        className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink2)] transition hover:border-white/20 hover:text-[var(--white)]"
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

        <div className="mt-6 flex items-center justify-end gap-2 text-xs text-[var(--ink2)]">
          <button
            type="button"
            className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 transition hover:border-white/20 disabled:opacity-50 disabled:hover:border-[var(--border)]"
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
            className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 transition hover:border-white/20 disabled:opacity-50 disabled:hover:border-[var(--border)]"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            →
          </button>
        </div>
        <div className="mt-4 text-sm text-[var(--ink2)]">Wyświetlono {shownCount} z {data?.count ?? 0} klientów</div>
      </div>

      <aside className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5">
        <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--ink2)]">Podgląd klienta</div>
        {!selectedClientId ? (
          <div className="mt-3 text-sm text-[var(--muted)]">Kliknij klienta na liście, aby pobrać szczegóły.</div>
        ) : selectedLoading ? (
          <div className="mt-3 space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full max-w-xs" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : selectedError ? (
          <div className="mt-3 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-[#fca5a5]">{selectedError}</div>
        ) : selectedClient ? (
          <div className="mt-4 space-y-4">
            {/* Profil */}
            <div
              className="overflow-hidden rounded-2xl border border-[var(--border)]"
              style={{
                background:
                  "linear-gradient(145deg, rgba(59,130,246,.08) 0%, rgba(15,17,23,.95) 42%, #0f1117 100%)",
                boxShadow: "0 0 0 1px rgba(59,130,246,.06) inset",
              }}
            >
              <div className="p-4">
                <div className="flex gap-3">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-[var(--white)]"
                    style={{
                      background: selectedClient.is_vip
                        ? "linear-gradient(135deg, rgba(139,92,246,1), rgba(220,30,30,.85))"
                        : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                      boxShadow: selectedClient.is_vip
                        ? "0 0 0 1px rgba(139,92,246,.35) inset, 0 8px 24px rgba(59,130,246,.15)"
                        : "0 0 0 1px rgba(59,130,246,.35) inset, 0 8px 24px rgba(59,130,246,.12)",
                    }}
                    aria-hidden
                  >
                    {computeAvatarInitials(selectedClient)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 gap-y-1">
                      <h2 className="text-[15px] font-semibold leading-tight text-[var(--white)]">{clientDisplayName(selectedClient)}</h2>
                      {selectedClient.is_vip && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                          style={{
                            background: "rgba(245,158,11,.14)",
                            border: "1px solid rgba(245,158,11,.30)",
                            color: "#f59e0b",
                          }}
                        >
                          VIP
                        </span>
                      )}
                      {(() => {
                        const b = segmentBadge(selectedClient);
                        if (!b || selectedClient.is_vip) return null;
                        return (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={b.styles}>
                            {b.label}
                          </span>
                        );
                      })()}
                      {selectedClient.is_blacklisted && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                          style={{
                            background: "rgba(220,38,38,.14)",
                            border: "1px solid rgba(220,38,38,.28)",
                            color: "#f87171",
                          }}
                        >
                          Blacklist
                        </span>
                      )}
                    </div>
                    {selectedClient.client_type === "business" && selectedClient.full_name && selectedClient.company_name && (
                      <p className="mt-1 truncate text-xs text-[var(--ink2)]">{selectedClient.full_name}</p>
                    )}
                    <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-black/25 px-2.5 py-1 font-mono text-[11px] text-[#c7d2eb]">
                      {selectedClient.client_number}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { label: "Naprawy", value: selectedClient.total_repairs ?? 0 },
                    { label: "Wizyty", value: selectedClient.visit_count ?? 0 },
                  ].map((cell) => (
                    <div
                      key={cell.label}
                      className="rounded-xl border border-white/8 bg-[var(--s1)]/80 px-2 py-2.5 text-center"
                      style={{ borderColor: "rgba(255,255,255,.06)" }}
                    >
                      <div className="text-lg font-semibold tabular-nums text-[var(--white)]">{cell.value}</div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{cell.label}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-0.5 border-t border-white/8 pt-4 text-[11px] text-[var(--muted)]">
                  <p>
                    Klient od <span className="text-[var(--ink2)]">{formatDateShort(selectedClient.created_at)}</span>
                  </p>
                  {selectedClient.last_visit_at ? (
                    <p>
                      Ostatnia wizyta: <span className="text-[var(--ink2)]">{formatDateShort(selectedClient.last_visit_at)}</span>
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Kontakt */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Kontakt</div>
              <ul className="mt-3 space-y-3">
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#111318] text-sm" aria-hidden>
                    📞
                  </span>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">Telefon</div>
                    {selectedClient.phone ? (
                      <a href={`tel:${selectedClient.phone.replace(/\s/g, "")}`} className="mt-0.5 block text-sm text-[#93c5fd] hover:underline">
                        {selectedClient.phone}
                      </a>
                    ) : (
                      <span className="mt-0.5 block text-sm text-[var(--muted)]">—</span>
                    )}
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#111318] text-sm" aria-hidden>
                    ✉️
                  </span>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">E-mail</div>
                    {selectedClient.email ? (
                      <a href={`mailto:${selectedClient.email}`} className="mt-0.5 block truncate text-sm text-[#93c5fd] hover:underline">
                        {selectedClient.email}
                      </a>
                    ) : (
                      <span className="mt-0.5 block text-sm text-[var(--muted)]">—</span>
                    )}
                  </div>
                </li>
                {selectedClient.preferred_contact ? (
                  <li className="flex gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#111318] text-sm" aria-hidden>
                      💬
                    </span>
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">Preferowany kontakt</div>
                      <p className="mt-0.5 text-sm text-[var(--white)]">{selectedClient.preferred_contact}</p>
                    </div>
                  </li>
                ) : null}
              </ul>
            </div>

            {/* Adres i firma */}
            {(selectedClient.street || selectedClient.city || selectedClient.postal_code || selectedClient.nip || selectedClient.contact_person) ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4">
                {(selectedClient.street || selectedClient.city || selectedClient.postal_code) ? (
                  <>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Adres</div>
                    <p className="mt-2 text-sm leading-relaxed text-[#d1d5db]">
                      {[selectedClient.street, [selectedClient.postal_code, selectedClient.city].filter(Boolean).join(" ")].filter(Boolean).join(", ") ||
                        "—"}
                    </p>
                  </>
                ) : null}
                {selectedClient.client_type === "business" && (selectedClient.nip || selectedClient.contact_person) ? (
                  <div className={selectedClient.street || selectedClient.city ? "mt-4 border-t border-white/8 pt-4" : ""}>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Firma</div>
                    <dl className="mt-2 space-y-2 text-sm">
                      {selectedClient.nip ? (
                        <div className="flex justify-between gap-3">
                          <dt className="text-[var(--muted)]">NIP</dt>
                          <dd className="font-mono text-[var(--white)]">{selectedClient.nip}</dd>
                        </div>
                      ) : null}
                      {selectedClient.contact_person ? (
                        <div className="flex justify-between gap-3">
                          <dt className="text-[var(--muted)]">Osoba</dt>
                          <dd className="text-right text-[var(--white)]">{selectedClient.contact_person}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">Naprawy klienta</div>
                {selectedRepairs.length > 6 ? (
                  <span className="text-[10px] text-[var(--muted)]">+{selectedRepairs.length - 6} więcej</span>
                ) : null}
              </div>
              <div className="mt-3 space-y-2">
                {selectedRepairs.slice(0, 6).map((r) => (
                  <Link
                    key={r.id}
                    href={`/panel/naprawy/${r.id}`}
                    className="group block rounded-xl border border-[var(--border)] bg-gradient-to-br from-[#0c0d12] to-[#0a0b0f] px-3 py-2.5 transition hover:border-[#3b82f6]/35 hover:shadow-[0_0_0_1px_rgba(59,130,246,.12)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-[var(--white)]">{r.repair_number}</span>
                      <span className="shrink-0 rounded-md bg-[#1e293b]/80 px-1.5 py-0.5 text-[10px] text-[#93c5fd]">{r.status_display}</span>
                    </div>
                    <div className="mt-1 text-xs text-[var(--ink2)] group-hover:text-[#cbd5e1]">{r.device_name}</div>
                  </Link>
                ))}
                {selectedRepairs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--border)] bg-black/20 px-3 py-6 text-center text-xs text-[var(--muted)]">
                    Brak napraw tego klienta w systemie.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
    </main>
  );
}

