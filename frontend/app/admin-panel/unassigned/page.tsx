"use client";

import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { RepairDetail, RepairRequestListItem } from "@/types/repairs";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type RepairListItemWithAssigned = RepairRequestListItem & { assigned_to?: string | null };

type SuggestAssignmentResponse = {
  suggested_user_id: string | null;
  suggested_user: { id: string; email: string; full_name: string } | null;
};

type UnassignedRow = {
  id: string;
  repair_number: string;
  created_at: string;
  client_name: string;
  device_name: string;
  device_category: string;
  problem_description: string;
  suggested_user: { id: string; full_name: string } | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  printer: "Drukarka",
  phone: "Telefon",
  tablet: "Tablet",
  laptop: "Laptop",
};

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

function plPlural(n: number, singular: string, plural2to4: string, plural5plus: string) {
  const abs = Math.abs(n);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 10 && mod100 <= 20) return plural5plus;
  if (mod10 === 1) return singular;
  if (mod10 >= 2 && mod10 <= 4) return plural2to4;
  return plural5plus;
}

function formatWait(createdAt: string) {
  const created = new Date(createdAt);
  const ms = Date.now() - created.getTime();
  const hours = Math.max(0, Math.floor(ms / 3_600_000));
  const days = Math.floor(hours / 24);

  if (days >= 1) {
    const label = plPlural(days, "dzień", "dni", "dni");
    return {
      main: `${days} ${label}`,
      sub: created.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" }),
    };
  }

  const label = plPlural(hours, "godzinę", "godziny", "godzin");
  return {
    main: `${hours} ${label}`,
    sub: created.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }),
  };
}

function categoryToLabel(cat: string) {
  if (!cat) return "Inne";
  return CATEGORY_LABELS[cat] ?? (cat.charAt(0).toUpperCase() + cat.slice(1));
}

export default function AdminUnassignedPlaceholder() {
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<UnassignedRow[]>([]);

  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = user?.role === "admin";

  const activeStatusesForUnassigned = useMemo(
    () => [
      // Lista „żywych” statusów, które sensownie trzymać w kolejce do dopasowania.
      "new",
      "accepted",
      "in_diagnostics",
      "diagnostics_done",
      "quote_pending",
      "quote_sent",
      "quote_accepted",
      "waiting_for_parts",
      "in_repair",
      "repair_done",
      "in_testing",
      "testing_passed",
      "testing_failed",
      "ready_for_pickup",
    ],
    [],
  );

  useEffect(() => {
    if (!token || !isAdmin) return;

    let cancelled = false;
    const load = async () => {
      setError(null);
      setLoading(true);
      try {
        const statusQuery = activeStatusesForUnassigned.map((s) => `status_in=${encodeURIComponent(s)}`).join("&");

        const list = await api.get<RepairListItemWithAssigned[]>(
          `/staff/repairs/?${statusQuery}&ordering=-created_at`,
          token,
        );

        const unassigned = (list ?? [])
          .filter((r) => !r.assigned_to)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .slice(0, 6);

        const details = await Promise.all(
          unassigned.map((r) =>
            api.get<RepairDetail>(`/staff/repairs/${r.id}/`, token).catch(() => null),
          ),
        );

        const suggestions = await Promise.all(
          unassigned.map((r) =>
            api.get<SuggestAssignmentResponse>(`/repairs/${r.id}/suggest-assignment/`, token).catch(() => null),
          ),
        );

        if (cancelled) return;

        const nextRows: UnassignedRow[] = unassigned.map((r, idx) => {
          const d = details[idx];
          const s = suggestions[idx];
          return {
            id: r.id,
            repair_number: (d?.repair_number ?? r.repair_number) as string,
            created_at: d?.created_at ?? r.created_at,
            client_name: d?.client_name ?? r.client_name ?? "—",
            device_name: d?.device?.device_name ?? r.device_name ?? "—",
            device_category: d?.device?.category ?? "",
            problem_description: d?.problem_description ?? "",
            suggested_user: s?.suggested_user
              ? { id: s.suggested_user.id, full_name: s.suggested_user.full_name }
              : null,
          };
        });

        setRows(nextRows);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Nie udało się pobrać danych.";
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [token, isAdmin, activeStatusesForUnassigned]);

  const oldestWait = useMemo(() => {
    if (!rows.length) return null;
    const oldest = rows.reduce((acc, r) => {
      const t = new Date(r.created_at).getTime();
      return t > acc.t ? { t, r } : acc;
    }, { t: 0, r: null as UnassignedRow | null });
    if (!oldest.r) return null;
    return { wait: formatWait(oldest.r.created_at), row: oldest.r };
  }, [rows]);

  const handleRefresh = async () => {
    if (!token || !isAdmin) return;
    setRefreshing(true);
    // „Soft refresh” bez skomplikowanej logiki, wystarczy dla UX.
    setRows([]);
    setLoading(true);
    try {
      const statusQuery = activeStatusesForUnassigned.map((s) => `status_in=${encodeURIComponent(s)}`).join("&");
      const list = await api.get<RepairListItemWithAssigned[]>(
        `/staff/repairs/?${statusQuery}&ordering=-created_at`,
        token,
      );
      const unassigned = (list ?? [])
        .filter((r) => !r.assigned_to)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .slice(0, 6);

      const details = await Promise.all(
        unassigned.map((r) =>
          api.get<RepairDetail>(`/staff/repairs/${r.id}/`, token).catch(() => null),
        ),
      );
      const suggestions = await Promise.all(
        unassigned.map((r) =>
          api.get<SuggestAssignmentResponse>(`/repairs/${r.id}/suggest-assignment/`, token).catch(() => null),
        ),
      );

      const nextRows: UnassignedRow[] = unassigned.map((r, idx) => {
        const d = details[idx];
        const s = suggestions[idx];
        return {
          id: r.id,
          repair_number: (d?.repair_number ?? r.repair_number) as string,
          created_at: d?.created_at ?? r.created_at,
          client_name: d?.client_name ?? r.client_name ?? "—",
          device_name: d?.device?.device_name ?? r.device_name ?? "—",
          device_category: d?.device?.category ?? "",
          problem_description: d?.problem_description ?? "",
          suggested_user: s?.suggested_user
            ? { id: s.suggested_user.id, full_name: s.suggested_user.full_name }
            : null,
        };
      });

      setRows(nextRows);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się odświeżyć.";
      setError(msg);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const handleSendSuggestions = async () => {
    // Na ten moment backend nie ma endpointu „bulk send sugestii”.
    // UI ma wyglądać jak na screanie — odświeżamy więc sugestie i pokazujemy je w tabeli.
    await handleRefresh();
  };

  return (
    <main className="mx-auto min-h-[calc(100vh-62px)] max-w-[1500px] px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Panel Admina</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Nieprzypisane naprawy</h1>
          <p className="mt-1 text-sm text-[#9ca3af]">
            Jak działają sugestie? System dobiera pracowników na podstawie kategorii i historii obsługi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="hidden rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 md:inline-flex"
            onClick={() => {
              // UI-only: w obecnym zakresie nie ma endpointu do „zgłaszania adminowi” z tej kolejki.
            }}
          >
            Zgłoś adminowi
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 disabled:opacity-60"
          >
            <RefreshCcw size={16} />
            Odśwież
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-[#0b0c10]/70 p-5">
        <div className="flex flex-col gap-3 md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: "rgba(245,158,11,.14)",
                border: "1px solid rgba(245,158,11,.35)",
                boxShadow: "0 0 18px rgba(245,158,11,.18)",
              }}
            >
              <AlertTriangle size={18} style={{ color: "#f59e0b" }} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-sm font-semibold text-white">
                  {oldestWait?.row ? `${oldestWait.row.repair_number} — ${categoryToLabel(oldestWait.row.device_category)} czeka ${oldestWait.wait.main}` : "—"}
                </div>
              </div>
              <div className="mt-1 text-sm text-[#9ca3af]">
                Wyświetlamy kolejkę napraw bez aktualnego przypisania — najszybciej jak się da.
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-[#090a0f]/60">
        <div
          className="grid grid-cols-[0.85fr_2.35fr_1.15fr_0.95fr_0.85fr_1.45fr] gap-4 border-b border-white/10 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: "#9ca3af", background: "rgba(255,255,255,.02)" }}
        >
          <div>NR REF</div>
          <div>Urządzenie / Problem</div>
          <div>Klient</div>
          <div>Kategoria</div>
          <div>Oczekiwanie</div>
          <div>Sugerowany</div>
        </div>

        {error && (
          <div className="px-6 py-5 text-sm text-[#fca5a5]" role="alert">
            {error}
          </div>
        )}

        {loading && !error && (
          <div className="px-6 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <div
                key={i}
                className="mb-3 grid grid-cols-[0.85fr_2.35fr_1.15fr_0.95fr_0.85fr_1.45fr] gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                {Array.from({ length: 6 }).map((__, j) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <div key={j} className="h-[22px] w-full animate-pulse rounded-lg bg-white/10" />
                ))}
              </div>
            ))}
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="px-6 py-10">
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-6 text-sm text-[#9ca3af]">
              Brak nieprzypisanych napraw do wyświetlenia.
            </div>
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div>
            {rows.map((r) => {
              const wait = formatWait(r.created_at);
              const catLabel = categoryToLabel(r.device_category);
              const hasSuggestion = Boolean(r.suggested_user);
              const suggestedName = r.suggested_user?.full_name ?? "—";
              const initialsText = r.suggested_user ? initials(r.suggested_user.full_name) : "";
              return (
                <div
                  key={r.id}
                  className="grid grid-cols-[0.85fr_2.35fr_1.15fr_0.95fr_0.85fr_1.45fr] gap-4 border-b border-white/10 px-6 py-4 transition hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-start gap-3">
                      <span
                        className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-semibold"
                        style={{ color: "#9ca3af" }}
                      >
                        {r.repair_number}
                      </span>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{r.device_name}</div>
                    <div className="mt-1 line-clamp-2 text-sm text-[#9ca3af]">{r.problem_description || "—"}</div>
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{r.client_name}</div>
                    <div className="mt-1 text-xs text-[#9ca3af]">—</div>
                  </div>

                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
                      style={{
                        background: "rgba(59,130,246,.12)",
                        borderColor: "rgba(59,130,246,.28)",
                        color: "#93c5fd",
                      }}
                    >
                      {catLabel}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white">{wait.main}</div>
                    <div className="mt-1 text-xs text-[#9ca3af]">od {wait.sub}</div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white">
                          {suggestedName}
                        </div>
                        <div className="mt-1 text-xs text-[#9ca3af]">
                          {hasSuggestion ? "sugerowany" : "brak sugestii"}
                        </div>
                      </div>
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5"
                        style={{
                          background: hasSuggestion ? "rgba(59,130,246,.10)" : "rgba(255,255,255,.04)",
                          borderColor: hasSuggestion ? "rgba(59,130,246,.28)" : "rgba(255,255,255,.10)",
                        }}
                        title={hasSuggestion ? suggestedName : "Brak sugestii"}
                      >
                        <span className="text-sm font-bold" style={{ color: hasSuggestion ? "#93c5fd" : "#9ca3af" }}>
                          {initialsText || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-3 bg-black/20 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-[#9ca3af]">
            Naprawy telefonów i tabletów są sugerowane dla Ciebie (Kuba P.) w zależności od aktualnej kolejki.
          </div>
          <button
            type="button"
            onClick={handleSendSuggestions}
            disabled={loading || refreshing || rows.length === 0}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-[#d1d5db] transition hover:bg-white/10 disabled:opacity-60"
          >
            Wyślij sugestie przypisania
          </button>
        </div>
      </section>
    </main>
  );
}

