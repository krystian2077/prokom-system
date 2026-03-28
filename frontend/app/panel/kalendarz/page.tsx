"use client";

import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { Plus, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CalendarCategoryKey, CalendarEventDTO, CalendarMonthResponse, DailySummary } from "@/types/calendar";
import { EMPTY_DAILY_SUMMARY } from "@/types/calendar";

type PopupState = {
  event: CalendarEventDTO;
  x: number;
  y: number;
} | null;

const CATEGORY_META: Record<
  CalendarCategoryKey,
  { label: string; color: string; bg: string; border: string; text: string }
> = {
  sla: {
    label: "Terminal SLA / iPhone",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.12)",
    border: "rgba(59, 130, 246, 0.35)",
    text: "#dde9ff",
  },
  delivery: {
    label: "Odbiór / Dostawa",
    color: "#22c55e",
    bg: "rgba(34, 197, 94, 0.12)",
    border: "rgba(34, 197, 94, 0.35)",
    text: "#ddffe9",
  },
  event: {
    label: "Zdarzenia",
    color: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.12)",
    border: "rgba(139, 92, 246, 0.30)",
    text: "#efe7ff",
  },
  intake: {
    label: "Przyjęcie naprawy",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.14)",
    border: "rgba(245, 158, 11, 0.32)",
    text: "#fff3da",
  },
  eta: {
    label: "ETA / termin oddania",
    color: "#60a5fa",
    bg: "rgba(96, 165, 250, 0.12)",
    border: "rgba(96, 165, 250, 0.28)",
    text: "#dbeafe",
  },
  parts: {
    label: "Planowana dostawa części",
    color: "#22d3ee",
    bg: "rgba(34, 211, 238, 0.10)",
    border: "rgba(34, 211, 238, 0.32)",
    text: "#cffafe",
  },
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(year: number, month0: number) {
  return new Date(year, month0 + 1, 0).getDate();
}

function addMonths(d: Date, delta: number) {
  const next = new Date(d);
  next.setMonth(next.getMonth() + delta);
  return next;
}

function getMonthGrid(view: Date) {
  const first = startOfMonth(view);
  const year = first.getFullYear();
  const month0 = first.getMonth();
  const jsDay = first.getDay();
  const offset = (jsDay + 6) % 7;
  const total = 42;
  const grid: Date[] = [];
  const start = new Date(year, month0, 1 - offset);

  for (let i = 0; i < total; i++) {
    const cell = new Date(start);
    cell.setDate(start.getDate() + i);
    grid.push(cell);
  }
  return grid;
}

function getPolishMonthLabel(d: Date) {
  return d.toLocaleDateString("pl-PL", { month: "long" }).replace(/^\w/, (m) => m.toUpperCase());
}

function getPolishMonthGenitive(d: Date) {
  const monthsGen: string[] = [
    "stycznia",
    "lutego",
    "marca",
    "kwietnia",
    "maja",
    "czerwca",
    "lipca",
    "sierpnia",
    "września",
    "października",
    "listopada",
    "grudnia",
  ];
  return monthsGen[d.getMonth()] ?? "";
}

function getSummaryForDay(summaries: Record<string, DailySummary> | undefined, iso: string): DailySummary {
  if (!summaries || !summaries[iso]) return { ...EMPTY_DAILY_SUMMARY };
  return { ...summaries[iso] };
}

/** Krótki opis podsumowania pod `title` (tooltip komórki). */
function formatSummaryTooltip(s: DailySummary): string {
  const lines: string[] = [];
  if (s.distinct_repairs_with_activity > 0) {
    lines.push(`Aktywne naprawy (łącznie w tym dniu): ${s.distinct_repairs_with_activity}`);
  }
  if (s.accepted) lines.push(`Przyjęcia: ${s.accepted}`);
  if (s.completed) lines.push(`Zakończone naprawy: ${s.completed}`);
  if (s.picked_up) lines.push(`Odbiory przez klienta: ${s.picked_up}`);
  if (s.ready_for_pickup) lines.push(`Gotowe do odbioru: ${s.ready_for_pickup}`);
  if (s.parts_incoming) lines.push(`Części w drodze (pozycje): ${s.parts_incoming}`);
  if (s.planned_work) lines.push(`Plan pracy (naprawy): ${s.planned_work}`);
  if (!lines.length) return "Brak zaplanowanych metryk na ten dzień.";
  return lines.join("\n");
}

/** Jedna linia metryk w komórce — tylko niezerowe wartości. */
function CellMetricsLine({ s }: { s: DailySummary }) {
  const parts: { label: string; value: number; color: string }[] = [];
  if (s.planned_work) parts.push({ label: "plan", value: s.planned_work, color: "#a78bfa" });
  if (s.parts_incoming) parts.push({ label: "cz.", value: s.parts_incoming, color: "#22d3ee" });
  if (s.completed) parts.push({ label: "zakoń.", value: s.completed, color: "#4ade80" });
  if (s.ready_for_pickup) parts.push({ label: "got.", value: s.ready_for_pickup, color: "#22c55e" });
  if (s.accepted) parts.push({ label: "prz.", value: s.accepted, color: "#fbbf24" });
  if (s.picked_up) parts.push({ label: "wyd.", value: s.picked_up, color: "#94a3b8" });
  if (!parts.length && s.distinct_repairs_with_activity > 0) {
    parts.push({ label: "napr.", value: s.distinct_repairs_with_activity, color: "#94a3b8" });
  }
  if (!parts.length) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-x-1.5 gap-y-0.5 text-[9px] font-semibold leading-tight text-[var(--ink2)]">
      {parts.map((p) => (
        <span key={p.label} style={{ color: p.color }}>
          {p.value}
          <span className="font-medium text-[var(--muted)]"> {p.label}</span>
        </span>
      ))}
    </div>
  );
}

function SummaryBlock({ title, summary }: { title: string; summary: DailySummary }) {
  const rows: { label: string; value: number; hint: string }[] = [
    { label: "Przyjęcia do serwisu", value: summary.accepted, hint: "Data przyjęcia urządzenia" },
    { label: "Zakończone naprawy", value: summary.completed, hint: "Data zakończenia prac" },
    { label: "Odbiory przez klienta", value: summary.picked_up, hint: "Data wydania sprzętu" },
    { label: "Gotowe do odbioru", value: summary.ready_for_pickup, hint: "Pierwszy dzień gotowości" },
    { label: "Części w drodze", value: summary.parts_incoming, hint: "Pozycje z planowaną dostawą" },
    { label: "Plan pracy (dzień)", value: summary.planned_work, hint: "Wewnętrzny planowany dzień pracy" },
    {
      label: "Naprawy z aktywnością",
      value: summary.distinct_repairs_with_activity,
      hint: "Unikalne naprawy z dowolnym wpisem tego dnia",
    },
  ];
  return (
    <div className="mb-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{title}</div>
      <dl className="mt-2 space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-2 text-xs">
            <dt className="min-w-0 text-[var(--ink2)]" title={r.hint}>
              {r.label}
            </dt>
            <dd className="shrink-0 font-semibold tabular-nums text-[var(--white)]">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function MonthGridSkeleton() {
  return (
    <div className="mt-2 grid grid-cols-7 gap-1">
      {Array.from({ length: 42 }).map((_, i) => (
        <Skeleton key={i} className="min-h-[80px] rounded-[10px]" />
      ))}
    </div>
  );
}

export default function CalendarPage() {
  const { user, token } = useAuth();

  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date(today));
  const [popup, setPopup] = useState<PopupState>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  const monthStartISO = useMemo(() => toISODate(startOfMonth(viewMonth)), [viewMonth]);
  const monthEndISO = useMemo(() => {
    const end = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
    return toISODate(end);
  }, [viewMonth]);

  const calendarQuery = useQuery({
    queryKey: ["calendar-month", "v2", user?.id, monthStartISO, monthEndISO],
    enabled: Boolean(token && user && monthStartISO && monthEndISO),
    queryFn: async () => {
      const employee = user?.id ? encodeURIComponent(String(user.id)) : "";
      return api.get<CalendarMonthResponse>(
        `/calendar/month/?from=${encodeURIComponent(monthStartISO)}&to=${encodeURIComponent(monthEndISO)}&employee=${employee}`,
        token,
      );
    },
    staleTime: 10_000,
  });

  const apiEvents = calendarQuery.data?.events ?? [];
  const dailySummaries = calendarQuery.data?.daily_summaries;
  const effectiveEvents: CalendarEventDTO[] = calendarQuery.isSuccess ? apiEvents : [];
  const calendarLoading = calendarQuery.isLoading || calendarQuery.isFetching;
  const calendarError = calendarQuery.isError;
  const showGridSkeleton = calendarLoading && !calendarQuery.data;

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEventDTO[]>();
    for (const ev of effectiveEvents) {
      const arr = map.get(ev.date) ?? [];
      arr.push(ev);
      map.set(ev.date, arr);
    }
    return map;
  }, [effectiveEvents]);

  const monthGrid = useMemo(() => getMonthGrid(viewMonth), [viewMonth]);

  const selectedISO = useMemo(() => toISODate(selectedDate), [selectedDate]);
  const tomorrowISO = useMemo(() => {
    const t = new Date(selectedDate);
    t.setDate(t.getDate() + 1);
    return toISODate(t);
  }, [selectedDate]);

  const selectedEvents = eventsByDate.get(selectedISO) ?? [];
  const tomorrowEvents = eventsByDate.get(tomorrowISO) ?? [];
  const selectedSummary = getSummaryForDay(dailySummaries, selectedISO);
  const tomorrowSummary = getSummaryForDay(dailySummaries, tomorrowISO);

  const featuredHeaderCategory: CalendarCategoryKey = useMemo(() => {
    const hasSla = selectedEvents.some((e) => e.category === "sla");
    if (hasSla) return "sla";
    return selectedEvents[0]?.category ?? "event";
  }, [selectedEvents]);

  const dayNumberLabel = selectedDate.toLocaleDateString("pl-PL", { day: "numeric" });
  const tomorrowLabel = (() => {
    const t = new Date(selectedDate);
    t.setDate(t.getDate() + 1);
    return t.toLocaleDateString("pl-PL", { day: "2-digit", month: "long" });
  })();

  useEffect(() => {
    const onClickOutside = (ev: MouseEvent) => {
      const target = ev.target as Node | null;
      if (!target) return;
      if (popupRef.current && !popupRef.current.contains(target)) {
        setPopup(null);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const eventClass = (category: CalendarCategoryKey) => {
    if (category === "delivery") return "border border-[rgba(34,197,94,.28)] bg-[rgba(34,197,94,.15)] text-[var(--green)]";
    if (category === "intake") return "border border-[rgba(245,158,11,.28)] bg-[rgba(245,158,11,.15)] text-[var(--amber)]";
    if (category === "sla") return "border border-[rgba(220,30,30,.30)] bg-[rgba(220,30,30,.15)] text-[var(--red)]";
    if (category === "eta") return "border border-[rgba(96,165,250,.28)] bg-[rgba(96,165,250,.15)] text-[#93c5fd]";
    if (category === "parts") return "border border-[rgba(34,211,238,.28)] bg-[rgba(34,211,238,.12)] text-[#22d3ee]";
    return "border border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)]";
  };

  const repairDetailHref = (ev: CalendarEventDTO) => {
    if (!ev.repair_id) return null;
    return `/panel/repairs/${ev.repair_id}`;
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-[1500px] flex-col gap-5 px-5 py-7">
      <header className="px-1">
        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--ink2)]">
          <CalendarDays size={14} />
          {user?.role === "admin" ? "Panel Admina" : "Panel pracownika"} · Moduł
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--white)]">Kalendarz</h1>
        <p className="mt-1 text-sm text-[var(--ink2)]">
          {getPolishMonthLabel(viewMonth)} {viewMonth.getFullYear()} · terminy SLA, odbiory, dostawy części, plan pracy
        </p>
      </header>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr,360px]">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)]/55 p-5 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--border)] bg-[var(--row-hover)] text-[#d0d4de] transition hover:bg-[var(--row-active)]"
                onClick={() => setViewMonth((m) => addMonths(m, -1))}
                aria-label="Poprzedni miesiąc"
              >
                <ChevronLeft size={18} />
              </button>
              <div>
                <div className="mt-1 text-xl font-semibold text-[var(--white)]">
                  {getPolishMonthLabel(viewMonth)} {viewMonth.getFullYear()}
                </div>
              </div>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--border)] bg-[var(--row-hover)] text-[#d0d4de] transition hover:bg-[var(--row-active)]"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
                aria-label="Następny miesiąc"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[#d0d4de] transition hover:bg-[var(--row-active)]"
                onClick={() => {
                  const d = new Date();
                  setSelectedDate(d);
                  setViewMonth(startOfMonth(d));
                }}
              >
                Dziś
              </button>
              <button
                type="button"
                className="rounded-xl bg-[linear-gradient(135deg,#3b82f6,#1d4ed8)] px-4 py-2 text-sm font-semibold text-[var(--white)] shadow-[0_8px_28px_rgba(59,130,246,.35)] transition hover:brightness-110"
                onClick={() => {}}
              >
                <span className="inline-flex items-center gap-2">
                  <Plus size={16} /> Nowe wydarzenie
                </span>
              </button>
            </div>
          </div>

          {calendarError ? (
            <div className="mt-6">
              <ErrorState
                error={calendarQuery.error instanceof Error ? calendarQuery.error : null}
                onRetry={() => void calendarQuery.refetch()}
                title="Nie udało się załadować kalendarza"
              />
            </div>
          ) : (
            <div className="mt-5 px-1">
              <div className="grid grid-cols-7 gap-1">
                {["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"].map((d, idx) => (
                  <div
                    key={d}
                    className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]"
                    style={{ opacity: idx === 5 ? 0.75 : idx === 6 ? 0.6 : 1 }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {showGridSkeleton ? (
                <MonthGridSkeleton />
              ) : (
                <div className="mt-2 grid grid-cols-7 gap-1">
                  {monthGrid.map((d) => {
                    const iso = toISODate(d);
                    const inMonth = d.getMonth() === viewMonth.getMonth();
                    const isSelected = iso === selectedISO;
                    const isToday = iso === toISODate(today);
                    const cellEvents = eventsByDate.get(iso) ?? [];
                    const showEvents = cellEvents.slice(0, 3);
                    const s = getSummaryForDay(dailySummaries, iso);

                    return (
                      <button
                        key={iso}
                        type="button"
                        title={formatSummaryTooltip(s)}
                        onClick={() => setSelectedDate(new Date(d))}
                        className={[
                          "relative min-h-[92px] rounded-[10px] border border-transparent px-[8px] py-[6px] text-left transition",
                          inMonth ? "bg-[var(--s1)]/70" : "bg-[var(--s1)]/30",
                          isToday ? "border-[rgba(220,30,30,.2)] bg-[rgba(220,30,30,.07)]" : "",
                          isSelected ? "border-[var(--border)] bg-[var(--row-hover)]" : "hover:border-[var(--border)] hover:bg-[var(--row-hover)]",
                          calendarLoading ? "opacity-90" : "",
                        ].join(" ")}
                        aria-label={`Wybierz dzień ${d.toLocaleDateString("pl-PL")}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          {isSelected ? (
                            <div className="inline-flex items-center justify-center rounded-xl border border-[rgba(59,130,246,.35)] bg-[rgba(59,130,246,.18)] px-2 py-0.5 text-sm font-semibold text-[var(--white)]">
                              {d.getDate()}
                            </div>
                          ) : (
                            <div
                              className={[
                                "text-sm font-semibold",
                                inMonth ? "text-[#d0d4de]" : "text-[#525b6e]",
                              ].join(" ")}
                            >
                              {d.getDate()}
                            </div>
                          )}
                        </div>

                        <CellMetricsLine s={s} />

                        {showEvents.length ? (
                          <div className="mt-1.5 flex flex-col gap-1">
                            {showEvents.map((ev) => (
                              <button
                                key={ev.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPopup({ event: ev, x: e.clientX, y: e.clientY });
                                }}
                                className={`block w-full truncate rounded-[5px] px-[6px] py-[2px] text-left text-[9.5px] font-semibold ${eventClass(ev.category)}`}
                              >
                                {ev.title}
                              </button>
                            ))}
                            {cellEvents.length > showEvents.length ? (
                              <div className="text-[11px] font-semibold text-[var(--ink2)]">
                                +{cellEvents.length - showEvents.length}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)]/55 p-4 backdrop-blur">
            <div className="text-sm font-semibold text-[var(--white)]">Legenda</div>
            <div className="mt-3 flex flex-col gap-2">
              {(Object.keys(CATEGORY_META) as CalendarCategoryKey[]).map((key) => {
                const meta = CATEGORY_META[key];
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ background: meta.color, boxShadow: `0 0 0 4px ${meta.bg}` }}
                    />
                    <span className="text-xs font-semibold text-[#d0d4de]">{meta.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)]/55 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  background: CATEGORY_META[featuredHeaderCategory].color,
                  boxShadow: `0 0 0 4px ${CATEGORY_META[featuredHeaderCategory].bg}`,
                }}
              />
              <div className="text-sm font-semibold text-[var(--white)]">
                Dzień · {dayNumberLabel} {getPolishMonthGenitive(selectedDate)}
              </div>
            </div>

            <div className="mt-3">
              {calendarError ? null : <SummaryBlock title="Podsumowanie dnia" summary={selectedSummary} />}
            </div>

            <div className="mt-1 flex flex-col gap-3">
              {selectedEvents.length ? (
                selectedEvents.slice(0, 8).map((ev) => {
                  const meta = CATEGORY_META[ev.category];
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={(e) => {
                        const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                        setPopup({ event: ev, x: r.left, y: r.bottom });
                      }}
                      className="flex w-full items-start gap-3 rounded-xl border border-transparent px-1 py-1 text-left transition hover:border-[var(--border)] hover:bg-[var(--row-hover)]"
                    >
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: meta.color }} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[#d0d4de]">{ev.title}</div>
                        {ev.subtitle ? <div className="truncate text-xs text-[var(--ink2)]">{ev.subtitle}</div> : null}
                      </div>
                    </button>
                  );
                })
              ) : showGridSkeleton || (calendarLoading && !calendarQuery.data) ? (
                <div className="flex flex-col gap-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton variant="circle" className="mt-1.5 h-2 w-2 shrink-0" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4 max-w-[200px]" />
                        <Skeleton className="h-3 w-1/2 max-w-[140px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : calendarError ? (
                <div className="text-sm text-[var(--ink2)]">Dane niedostępne — użyj przycisku ponowienia obok kalendarza.</div>
              ) : (
                <div className="text-sm text-[var(--ink2)]">Brak zdarzeń w tym dniu.</div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)]/55 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: CATEGORY_META.sla.color, boxShadow: `0 0 0 4px ${CATEGORY_META.sla.bg}` }}
              />
              <div className="text-sm font-semibold text-[var(--white)]">Jutro · {tomorrowLabel}</div>
            </div>

            <div className="mt-3">
              {calendarError ? null : <SummaryBlock title="Podsumowanie" summary={tomorrowSummary} />}
            </div>

            <div className="mt-1 flex flex-col gap-3">
              {tomorrowEvents.length ? (
                tomorrowEvents.slice(0, 8).map((ev) => {
                  const meta = CATEGORY_META[ev.category];
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={(e) => {
                        const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                        setPopup({ event: ev, x: r.left, y: r.bottom });
                      }}
                      className="flex w-full items-start gap-3 rounded-xl border border-transparent px-1 py-1 text-left transition hover:border-[var(--border)] hover:bg-[var(--row-hover)]"
                    >
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: meta.color }} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[#d0d4de]">{ev.title}</div>
                        {ev.subtitle ? <div className="truncate text-xs text-[var(--ink2)]">{ev.subtitle}</div> : null}
                      </div>
                    </button>
                  );
                })
              ) : showGridSkeleton || (calendarLoading && !calendarQuery.data) ? (
                <div className="flex flex-col gap-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton variant="circle" className="mt-1.5 h-2 w-2 shrink-0" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4 max-w-[200px]" />
                        <Skeleton className="h-3 w-1/2 max-w-[140px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : calendarError ? (
                <div className="text-sm text-[var(--ink2)]">Dane niedostępne — użyj przycisku ponowienia obok kalendarza.</div>
              ) : (
                <div className="text-sm text-[var(--ink2)]">Brak zdarzeń na jutro.</div>
              )}
            </div>
          </div>
        </aside>
      </section>
      {popup ? (
        <div
          ref={popupRef}
          className="fixed z-[300] w-[320px] rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4 shadow-2xl"
          style={{
            left: Math.min(popup.x + 10, typeof window !== "undefined" ? window.innerWidth - 340 : 0),
            top: Math.min(popup.y + 10, typeof window !== "undefined" ? window.innerHeight - 220 : 0),
          }}
        >
          <div className="text-sm font-semibold text-[var(--white)]">{popup.event.title}</div>
          <div className="mt-2">
            <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${eventClass(popup.event.category)}`}>
              {CATEGORY_META[popup.event.category].label}
            </span>
          </div>
          {popup.event.subtitle ? <p className="mt-2 text-xs text-[var(--ink2)]">{popup.event.subtitle}</p> : null}
          <div className="mt-3 text-xs text-[var(--ink2)]">
            {popup.event.date}
            {popup.event.time ? ` · ${popup.event.time}` : ""}
          </div>
          {repairDetailHref(popup.event) ? (
            <div className="mt-4">
              <Link
                href={repairDetailHref(popup.event)!}
                className="text-xs font-semibold text-[#3b82f6] hover:underline"
                onClick={() => setPopup(null)}
              >
                {popup.event.category === "event" ? "Otwórz zadanie →" : "Otwórz naprawę →"}
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
