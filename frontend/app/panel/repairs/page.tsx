"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { RepairRequestListItem } from "@/types/repairs";
import { Eye, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

const PAGE_SIZE = 10;

type RepairsPillKey = "all" | "in_progress" | "parts_waiting" | "ready" | "urgent";
type RepairsSortKey = "priority" | "date" | "sla";

const nonArchivedStatus = (status: string) => {
  const s = (status ?? "").toLowerCase();
  // W mockupie "Historia napraw" to osobny widok — dlatego tu wyłączamy końcowe zamknięcia.
  const archivedFinal = ["picked_up", "shipped", "delivered", "cancelled", "unrepairable", "abandoned"];
  return !archivedFinal.includes(s);
};

const priorityRank = (priority: string | null | undefined) => {
  const p = (priority ?? "").toLowerCase();
  if (p === "urgent") return 0;
  if (p === "same_day") return 1;
  if (p === "high") return 2;
  if (p === "normal") return 3;
  if (p === "low") return 4;
  return 5;
};

function parseDate(d: string | null | undefined) {
  if (!d) return null;
  const dt = new Date(d);
  if (!Number.isFinite(dt.getTime())) return null;
  return dt;
}

function slaMeta(item: RepairRequestListItem) {
  const eta = parseDate(item.estimated_completion_date);
  if (!eta) return { kind: "none" as const, label: "SLA —", isOverdue: false };

  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((eta.getTime() - t0) / dayMs);

  if (diffDays < 0) return { kind: "overdue" as const, label: `SLA: ${diffDays}d`, isOverdue: true };
  if (diffDays === 0) return { kind: "today" as const, label: "SLA dzisiaj", isOverdue: false };
  if (diffDays === 1) return { kind: "tomorrow" as const, label: "SLA jutro", isOverdue: false };

  return { kind: "ok" as const, label: `SLA ${eta.toLocaleDateString("pl-PL")}`, isOverdue: false };
}

function statusBadge(item: RepairRequestListItem) {
  const s = (item.status ?? "").toLowerCase();
  if (["ready_for_pickup"].includes(s)) return { bg: "rgba(34,197,94,.14)", border: "rgba(34,197,94,.30)", text: "#22c55e", label: "Gotowe" };
  if (["waiting_for_parts"].includes(s) || (item.auto_tags ?? []).includes("czeka_na_czesc"))
    return { bg: "rgba(245,158,11,.16)", border: "rgba(245,158,11,.30)", text: "#f59e0b", label: "Czeka na część" };
  if (["testing_failed"].includes(s) || (item.auto_tags ?? []).includes("pilne"))
    return { bg: "rgba(220,30,30,.14)", border: "rgba(220,30,30,.28)", text: "#dc1e1e", label: item.status_display || "Pilne" };
  return { bg: "rgba(59,130,246,.14)", border: "rgba(59,130,246,.28)", text: "#3b82f6", label: item.status_display || "W naprawie" };
}

function blockerText(item: RepairRequestListItem) {
  const s = (item.status ?? "").toLowerCase();
  if (s === "waiting_for_parts" || (item.auto_tags ?? []).includes("czeka_na_czesc")) return "Blokada: część w drodze";
  if (item.requires_attention) return "Blokada: wymaga reakcji";
  return "";
}

function nextAction(item: RepairRequestListItem) {
  const s = (item.status ?? "").toLowerCase();
  const urgent = (item.auto_tags ?? []).includes("pilne") || priorityRank(item.priority) <= 1;

  if (s === "ready_for_pickup") return { text: "▶ Wyślij SMS do klienta", tone: "good" as const };
  if (s === "waiting_for_parts" || (item.auto_tags ?? []).includes("czeka_na_czesc"))
    return { text: "▶ Przygotuj montaż po dostawie", tone: "warn" as const };
  if (urgent) return { text: "▶ Wykonaj teraz", tone: "urgent" as const };
  if (s === "in_testing" || s === "testing_passed" || s === "testing_failed") return { text: "▶ Zakończ test końcowy", tone: "warn" as const };
  return { text: "▶ Kontynuuj naprawę", tone: "neutral" as const };
}

function nextActionBadgeStyle(tone: "urgent" | "warn" | "good" | "neutral") {
  if (tone === "urgent") return { bg: "rgba(220,30,30,.14)", border: "rgba(220,30,30,.30)", text: "#dc1e1e" };
  if (tone === "warn") return { bg: "rgba(245,158,11,.16)", border: "rgba(245,158,11,.30)", text: "#f59e0b" };
  if (tone === "good") return { bg: "rgba(34,197,94,.14)", border: "rgba(34,197,94,.30)", text: "#22c55e" };
  return { bg: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.12)", text: "#9ba3b0" };
}

function derivePillFilter(item: RepairRequestListItem, pill: RepairsPillKey) {
  const s = (item.status ?? "").toLowerCase();
  if (pill === "all") return nonArchivedStatus(item.status);

  if (!nonArchivedStatus(item.status)) return false;

  if (pill === "ready") return s === "ready_for_pickup";
  if (pill === "parts_waiting") return s === "waiting_for_parts" || (item.auto_tags ?? []).includes("czeka_na_czesc");
  if (pill === "urgent") return (item.auto_tags ?? []).includes("pilne") || priorityRank(item.priority) <= 1;

  // in_progress
  const inProgressStatuses = [
    "new",
    "accepted",
    "in_diagnostics",
    "diagnostics_done",
    "quote_pending",
    "quote_sent",
    "quote_accepted",
    "quote_rejected",
    "waiting_for_parts",
    "in_repair",
    "repair_done",
    "in_testing",
    "testing_passed",
    "testing_failed",
  ];
  return inProgressStatuses.includes(s);
}

function RepairsPageInner() {
  const { token, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const pill = (searchParams.get("status") as RepairsPillKey) ?? "all";
  const sort = (searchParams.get("sort") as RepairsSortKey) ?? "priority";

  const page = Number(searchParams.get("page") ?? "1") || 1;

  const assignedToId = user?.id ? String(user.id) : null;

  const repairsQuery = useQuery({
    queryKey: ["repairs", "staff", "list", assignedToId],
    enabled: Boolean(token && assignedToId),
    queryFn: async () => {
      if (!token || !assignedToId) throw new Error("Missing auth/user");
      return api.get<RepairRequestListItem[]>(`/staff/repairs/?assigned_to=${encodeURIComponent(assignedToId)}`, token);
    },
  });

  const allItems = repairsQuery.data ?? [];

  const pills: Array<{ key: RepairsPillKey; label: string; tone: "red" | "amber" | "gray" | "green" }> = [
    { key: "all", label: "Wszystkie moje", tone: "gray" },
    { key: "in_progress", label: "W naprawie", tone: "red" },
    { key: "parts_waiting", label: "Czeka na część", tone: "amber" },
    { key: "ready", label: "Gotowe", tone: "green" },
    { key: "urgent", label: "Pilne SLA", tone: "amber" },
  ];

  const counts = useMemo(() => {
    const base = allItems.filter((i) => nonArchivedStatus(i.status));
    const out: Record<RepairsPillKey, number> = { all: 0, in_progress: 0, parts_waiting: 0, ready: 0, urgent: 0 };
    out.all = base.length;
    for (const p of pills) {
      out[p.key] = base.filter((i) => derivePillFilter(i, p.key)).length;
    }
    return out;
  }, [allItems]);

  const filtered = useMemo(() => {
    const list = allItems.filter((i) => derivePillFilter(i, pill));
    const sorted = [...list];

    sorted.sort((a, b) => {
      if (sort === "priority") return priorityRank(a.priority) - priorityRank(b.priority);

      const da = parseDate(a.estimated_completion_date)?.getTime() ?? Number.POSITIVE_INFINITY;
      const db = parseDate(b.estimated_completion_date)?.getTime() ?? Number.POSITIVE_INFINITY;

      if (sort === "date") return da - db;

      // sla: overdue first, then soon, then ok
      const sa = slaMeta(a).kind;
      const sb = slaMeta(b).kind;
      const w = (k: typeof sa) => (k === "overdue" ? 0 : k === "tomorrow" ? 1 : k === "today" ? 2 : 3);
      const aw = w(sa);
      const bw = w(sb);
      if (aw !== bw) return aw - bw;
      return da - db;
    });

    return sorted;
  }, [allItems, pill, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const sliced = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const setQuery = (next: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === null || String(v).length === 0) params.delete(k);
      else params.set(k, String(v));
    });
    router.push(`/panel/repairs?${params.toString()}`);
  };

  const handleRefresh = async () => {
    // W React Query refresh robimy przez invalidation – tutaj używamy prostej instancji reload.
    // Panel pracownika ma mieć jednak auto-refresh w kolejnej iteracji.
    router.refresh();
  };

  return (
    <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-8">
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Pracownik</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Moje naprawy</h1>
            <p className="mt-1 text-sm text-[#9ca3af]">
              Przypisane do mnie · <span className="text-white font-semibold">{allItems.filter((i) => nonArchivedStatus(i.status)).length}</span>{" "}
              aktywnych
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/panel/all-repairs"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
            >
              Wszystkie naprawy
            </Link>
            <button type="button" onClick={handleRefresh} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white">
              <span className="inline-flex items-center gap-2">
                <RotateCcw size={16} />
                Odśwież
              </span>
            </button>
            <Link href="/panel/intake" className="rounded-2xl bg-[#dc1e1e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b81818]">
              Nowe przyjęcie
            </Link>
          </div>
        </header>

        <div className="worker-card-shimmer rounded-3xl border border-white/10 bg-[#0f1117] p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {pills.map((p) => {
                const on = pill === p.key;
                const base =
                  p.tone === "red"
                    ? { bg: "rgba(220,30,30,.14)", border: "rgba(220,30,30,.35)", text: "#dc1e1e" }
                    : p.tone === "amber"
                      ? { bg: "rgba(245,158,11,.16)", border: "rgba(245,158,11,.35)", text: "#f59e0b" }
                      : p.tone === "green"
                        ? { bg: "rgba(34,197,94,.14)", border: "rgba(34,197,94,.30)", text: "#22c55e" }
                        : { bg: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.12)", text: "#9ca3af" };

                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setQuery({ status: p.key, page: 1 })}
                    className="rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition"
                    style={{
                      background: on ? "rgba(59,130,246,.14)" : base.bg,
                      borderColor: on ? "rgba(59,130,246,.45)" : base.border,
                      color: on ? "#fff" : base.text,
                    }}
                  >
                    {p.label}({counts[p.key] ?? 0})
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Sortuj</label>
              <select
                value={sort}
                onChange={(e) => setQuery({ sort: e.target.value as RepairsSortKey, page: 1 })}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#3b82f6]"
              >
                <option value="priority">Priorytet</option>
                <option value="date">Data</option>
                <option value="sla">SLA</option>
              </select>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-[#0c0d12]">
            <div className="grid grid-cols-[110px_1fr_220px_140px_160px_240px_90px] gap-2 border-b border-white/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
              <div>Nr ref</div>
              <div>Urządzenie / Następny krok</div>
              <div>Klient</div>
              <div>Status</div>
              <div>Bloker</div>
              <div>ETA / SLA</div>
              <div>Akcja</div>
            </div>

            {repairsQuery.isLoading ? (
              <div className="px-4 py-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    // eslint-disable-next-line react/no-array-index-key
                    key={idx}
                    className="mt-2 grid animate-pulse grid-cols-[110px_1fr_220px_140px_160px_240px_90px] gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                  >
                    <div className="h-4 w-16 rounded bg-white/10" />
                    <div className="h-4 w-3/5 rounded bg-white/10" />
                    <div className="h-4 w-4/5 rounded bg-white/10" />
                    <div className="h-4 w-24 rounded bg-white/10" />
                    <div className="h-4 w-20 rounded bg-white/10" />
                    <div className="h-4 w-28 rounded bg-white/10" />
                    <div className="h-4 w-8 rounded bg-white/10" />
                  </div>
                ))}
              </div>
            ) : repairsQuery.error ? (
              <div className="px-4 py-6 text-sm text-[#fca5a5]">Nie udało się pobrać napraw.</div>
            ) : sliced.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-[#6b7280]">
                Brak przypisanych napraw 🔧 · Poczekaj na przypisanie od admina
              </div>
            ) : (
              <div className="px-4 py-2">
                {sliced.map((r) => {
                  const b = blockerText(r);
                  const sb = statusBadge(r);
                  const action = nextAction(r);
                  const actionStyle = nextActionBadgeStyle(action.tone);
                  const sla = slaMeta(r);
                  const overdue = sla.isOverdue;

                  return (
                    <Link
                      key={r.id}
                      href={`/panel/repairs/${r.id}`}
                      className="group relative mb-2 block rounded-2xl border border-white/10 bg-[#0b0c10] px-4 py-4 transition hover:bg-white/5 hover:border-white/20"
                    >
                      <div className="absolute left-0 top-0 h-full w-[2px] bg-transparent">
                        {/* always visible for overdue, animated grow on hover */}
                        <div
                          className={`h-full w-full origin-top transition-transform ${overdue ? "scale-y-100" : "scale-y-0"} group-hover:scale-y-100`}
                          style={{
                            background: "#ff6b6b",
                            transformOrigin: "top",
                            transitionDuration: "180ms",
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-[110px_1fr_220px_140px_160px_240px_90px] gap-2 items-center">
                        <div className="min-w-0">
                          <span
                            className="font-mono text-sm font-semibold"
                            style={{ color: overdue ? "#ff6b6b" : "#9ca3af" }}
                          >
                            {r.repair_number}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-white">{r.device_name}</div>
                          <div className="mt-1 truncate">
                            <span
                              className="inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                              style={{ background: actionStyle.bg, borderColor: actionStyle.border, color: actionStyle.text }}
                            >
                              {action.text}
                            </span>
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-sm text-[#e5e7eb]">{r.client_name}</div>
                          <div className="mt-1 text-xs text-[#9ca3af]">
                            {/* brak telefonu w list serializer — pokażemy placeholder */}
                            SLA:{" "}
                            <span className="font-semibold" style={{ color: overdue ? "#ff6b6b" : "#9ca3af" }}>
                              {sla.label}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span
                            className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold"
                            style={{ background: sb.bg, borderColor: sb.border, color: sb.text }}
                          >
                            {sb.label}
                          </span>
                        </div>

                        <div>
                          {b ? (
                            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-[#f59e0b]">
                              {b}
                            </span>
                          ) : (
                            <span className="text-xs text-[#6b7280]">—</span>
                          )}
                        </div>

                        <div>
                          <div className={`text-sm font-semibold ${overdue ? "text-[#ff6b6b]" : "text-white"}`}>
                            {r.estimated_completion_date ? parseDate(r.estimated_completion_date)?.toLocaleDateString("pl-PL") : "—"}
                          </div>
                          <div className="mt-1 text-xs text-[#9ca3af]">
                            {r.estimated_duration_days_min && r.estimated_duration_days_max ? `${r.estimated_duration_days_min}-${r.estimated_duration_days_max} dni` : "SLA —"}
                          </div>
                        </div>

                        <div className="flex items-center justify-end">
                          <Eye size={16} className="opacity-70 transition group-hover:opacity-100" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {!repairsQuery.isLoading && sliced.length > 0 ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <p className="text-sm text-[#9ca3af]">
                  Strona <span className="font-semibold text-white">{safePage}</span> / {pageCount}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuery({ page: Math.max(1, safePage - 1) })}
                    disabled={safePage <= 1}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white disabled:opacity-60"
                  >
                    <span className="inline-flex items-center gap-2">
                      <ChevronLeft size={16} />
                      Prev
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuery({ page: Math.min(pageCount, safePage + 1) })}
                    disabled={safePage >= pageCount}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white disabled:opacity-60"
                  >
                    <span className="inline-flex items-center gap-2">
                      Next
                      <ChevronRight size={16} />
                    </span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function RepairsPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-8">
          <div className="rounded-3xl border border-white/10 bg-[#0f1117] p-4">
            Ładowanie napraw...
          </div>
        </main>
      }
    >
      <RepairsPageInner />
    </Suspense>
  );
}

