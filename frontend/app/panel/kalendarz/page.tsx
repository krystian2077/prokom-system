"use client";

import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Plus, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

type CategoryKey = "sla" | "delivery" | "event" | "intake" | "eta";

type CalendarEvent = {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  category: CategoryKey;
  title: string;
  subtitle?: string;
};

const CATEGORY_META: Record<
  CategoryKey,
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
    label: "ETA / Historia",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.12)",
    border: "rgba(59, 130, 246, 0.28)",
    text: "#dde9ff",
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
  // Monday-first grid (7 cols) to match screenshot: Pon, Wt, Śr, ...
  const first = startOfMonth(view);
  const year = first.getFullYear();
  const month0 = first.getMonth();
  const dim = daysInMonth(year, month0);

  // JS: 0=Sun..6=Sat. Convert to Monday-first offset (Mon=0..Sun=6).
  const jsDay = first.getDay();
  const offset = (jsDay + 6) % 7;

  const total = 42; // 6 weeks x 7 days
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
  // For UI headers like "14 stycznia" (genitive case).
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

export default function CalendarPage() {
  const { user, token } = useAuth();

  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date(today));

  const events: CalendarEvent[] = useMemo(
    () => [
      { id: "e1", date: "2025-01-07", category: "eta", title: "Przyjęcie MacBooka", subtitle: "MBP / Naprawa" },
      { id: "e2", date: "2025-01-08", category: "sla", title: "SLA cutoff", subtitle: "Zam. baterii MBP" },

      { id: "e3", date: "2025-01-10", category: "intake", title: "Zam. naprawy", subtitle: "Odbiór PSS / Wiśniewski" },

      { id: "e4", date: "2025-01-11", category: "delivery", title: "Odbiór PSS", subtitle: "Przesyłka / przewoźnik" },
      { id: "e5", date: "2025-01-12", category: "eta", title: "ETA MBP baterii", subtitle: "Dostawa po 15:00" },

      { id: "e6", date: "2025-01-13", category: "event", title: "LCD iPhone dotrze rano", subtitle: "Dostawa + montaż" },
      { id: "e7", date: "2025-01-14", category: "sla", title: "SLA PK-54321 iPhone", subtitle: "Kuba" },
      { id: "e8", date: "2025-01-14", category: "delivery", title: "Bateria MacBooka dotrze", subtitle: "PK-54232 / Dominik" },
      { id: "e9", date: "2025-01-14", category: "delivery", title: "Odbiór PSS - Wiśniewski P.", subtitle: "PK-54321 / Serwis" },

      { id: "e10", date: "2025-01-15", category: "sla", title: "II SLA CUT OFF - PK-54321", subtitle: "17:00 / Zamknięcie" },
      { id: "e11", date: "2025-01-15", category: "eta", title: "LCD iPhone dotrze rano", subtitle: "Dostawa w godzinach porannych" },
    ],
    [],
  );

  const monthStartISO = useMemo(() => toISODate(startOfMonth(viewMonth)), [viewMonth]);
  const monthEndISO = useMemo(() => {
    const end = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
    return toISODate(end);
  }, [viewMonth]);

  const calendarQuery = useQuery({
    queryKey: ["calendar-month", user?.id, monthStartISO, monthEndISO],
    enabled: Boolean(token && user && monthStartISO && monthEndISO),
    queryFn: async () => {
      const employee = user?.id ? encodeURIComponent(String(user.id)) : "";
      return api.get<{ events: CalendarEvent[] }>(
        `/calendar/month/?from=${encodeURIComponent(monthStartISO)}&to=${encodeURIComponent(monthEndISO)}&employee=${employee}`,
        token,
      );
    },
    staleTime: 10_000,
  });

  const apiEvents = calendarQuery.data?.events ?? [];
  const effectiveEvents = calendarQuery.isSuccess ? apiEvents : events;
  const calendarLoading = calendarQuery.isLoading || calendarQuery.isFetching;

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
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

  const featuredHeaderCategory: CategoryKey = useMemo(() => {
    const hasSla = selectedEvents.some((e) => e.category === "sla");
    return hasSla ? "sla" : selectedEvents[0]?.category ?? "event";
  }, [selectedEvents]);

  const dayNumberLabel = selectedDate.toLocaleDateString("pl-PL", { day: "numeric" });
  const tomorrowLabel = (() => {
    const t = new Date(selectedDate);
    t.setDate(t.getDate() + 1);
    return t.toLocaleDateString("pl-PL", { day: "2-digit", month: "long" });
  })();

  return (
    <main className="mx-auto flex min-h-screen max-w-[1500px] flex-col gap-5 px-5 py-7">
      <header className="px-1">
        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#9ca3af]">
          <CalendarDays size={14} />
          {user?.role === "admin" ? "Panel Admina" : "Panel pracownika"} · Moduł
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Kalendarz</h1>
        <p className="mt-1 text-sm text-[#9ca3af]">
          {getPolishMonthLabel(viewMonth)} {viewMonth.getFullYear()} · terminy SLA, odbiory, dostawy
        </p>
      </header>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr,360px]">
        {/* Calendar */}
        <div className="rounded-3xl border border-white/5 bg-[#0b0c10]/55 p-5 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-[#d0d4de] transition hover:bg-white/10"
                onClick={() => setViewMonth((m) => addMonths(m, -1))}
                aria-label="Poprzedni miesiąc"
              >
                <ChevronLeft size={18} />
              </button>
              <div>
                <div className="mt-1 text-xl font-semibold text-white">
                  {getPolishMonthLabel(viewMonth)} {viewMonth.getFullYear()}
                </div>
              </div>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-[#d0d4de] transition hover:bg-white/10"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
                aria-label="Następny miesiąc"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#d0d4de] transition hover:bg-white/10"
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
                className="rounded-xl bg-[linear-gradient(135deg,#3b82f6,#1d4ed8)] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(59,130,246,.35)] transition hover:brightness-110"
                onClick={() => {
                  // Placeholder (UI-only).
                  // Next step: modal/route for creating event.
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <Plus size={16} /> Nowe wydarzenie
                </span>
              </button>
            </div>
          </div>

          <div className="mt-5 px-1">
            <div className="grid grid-cols-7 gap-1">
              {["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"].map((d) => (
                <div key={d} className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7280]">
                  {d}
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-1">
              {monthGrid.map((d) => {
                const iso = toISODate(d);
                const inMonth = d.getMonth() === viewMonth.getMonth();
                const isSelected = iso === selectedISO;
                const cellEvents = eventsByDate.get(iso) ?? [];
                const showEvents = cellEvents.slice(0, 3);

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSelectedDate(new Date(d))}
                    className={[
                      "relative min-h-[88px] rounded-2xl border border-transparent px-2 py-2 text-left transition",
                      inMonth ? "bg-[#0f1117]/70" : "bg-[#0f1117]/30",
                      isSelected ? "border-white/10 bg-white/5" : "hover:border-white/10 hover:bg-white/5",
                    ].join(" ")}
                    aria-label={`Wybierz dzień ${d.toLocaleDateString("pl-PL")}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      {isSelected ? (
                        <div
                        className="inline-flex items-center justify-center rounded-xl border border-[rgba(59,130,246,.35)] bg-[rgba(59,130,246,.18)] px-2 py-0.5 text-sm font-semibold text-white"
                        >
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

                    {showEvents.length ? (
                      <div className="mt-2 flex flex-col gap-1">
                        {showEvents.map((ev) => {
                          const meta = CATEGORY_META[ev.category];
                          return (
                            <div
                              key={ev.id}
                              className="flex items-start gap-2 rounded-xl px-2 py-1 text-[11px] leading-snug"
                              style={{
                                background: meta.bg,
                                border: `1px solid ${meta.border}`,
                                color: meta.text,
                              }}
                            >
                              <span
                                className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ background: meta.color, boxShadow: `0 0 0 3px ${meta.bg}` }}
                              />
                              <div className="min-w-0">
                                <div className="truncate font-semibold">{ev.title}</div>
                              </div>
                            </div>
                          );
                        })}
                        {cellEvents.length > showEvents.length ? (
                          <div className="text-[11px] font-semibold text-[#8b93a8]">+{cellEvents.length - showEvents.length}</div>
                        ) : null}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-3xl border border-white/5 bg-[#0b0c10]/55 p-4 backdrop-blur">
            <div className="text-sm font-semibold text-white">Legenda</div>
            <div className="mt-3 flex flex-col gap-2">
              {(Object.keys(CATEGORY_META) as CategoryKey[]).map((key) => {
                const meta = CATEGORY_META[key];
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: meta.color, boxShadow: `0 0 0 4px ${meta.bg}` }} />
                    <span className="text-xs font-semibold text-[#d0d4de]">{meta.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-[#0b0c10]/55 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: CATEGORY_META[featuredHeaderCategory].color, boxShadow: `0 0 0 4px ${CATEGORY_META[featuredHeaderCategory].bg}` }}
              />
              <div className="text-sm font-semibold text-white">
                Dzień · {dayNumberLabel} {getPolishMonthGenitive(selectedDate)}
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-3">
              {selectedEvents.length ? (
                selectedEvents.slice(0, 6).map((ev) => {
                  const meta = CATEGORY_META[ev.category];
                  return (
                    <div key={ev.id} className="flex items-start gap-3">
                      <span className="mt-1.5 h-2 w-2 rounded-full" style={{ background: meta.color }} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[#d0d4de]">{ev.title}</div>
                        {ev.subtitle ? <div className="truncate text-xs text-[#8b93a8]">{ev.subtitle}</div> : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-[#8b93a8]">{calendarLoading ? "Ładowanie…" : "Brak zdarzeń."}</div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-[#0b0c10]/55 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_META.sla.color, boxShadow: `0 0 0 4px ${CATEGORY_META.sla.bg}` }} />
              <div className="text-sm font-semibold text-white">
                Jutro · {tomorrowLabel}
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-3">
              {tomorrowEvents.length ? (
                tomorrowEvents.slice(0, 6).map((ev) => {
                  const meta = CATEGORY_META[ev.category];
                  return (
                    <div key={ev.id} className="flex items-start gap-3">
                      <span className="mt-1.5 h-2 w-2 rounded-full" style={{ background: meta.color }} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[#d0d4de]">{ev.title}</div>
                        {ev.subtitle ? <div className="truncate text-xs text-[#8b93a8]">{ev.subtitle}</div> : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-[#8b93a8]">{calendarLoading ? "Ładowanie…" : "Brak zdarzeń."}</div>
              )}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

