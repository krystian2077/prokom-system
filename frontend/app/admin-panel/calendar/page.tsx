"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

type CalendarEvent = {
  id: string | number;
  title: string;
  event_type: "repair_eta" | "pickup" | "part_arrival" | "task" | "availability" | "sla" | string;
  date: string;
  repair?: string | number;
  description?: string;
};

type AvailabilityItem = {
  id: string | number;
  user_name?: string;
  user_full_name?: string;
  user?: { full_name?: string; first_name?: string; last_name?: string };
  availability_type?: string;
  availability_type_display?: string;
  note?: string;
};

type PopupState = { ev: CalendarEvent; x: number; y: number } | null;

const DOW = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function monthGrid(viewMonth: Date): Date[] {
  const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const jsDay = first.getDay();
  const mondayOffset = (jsDay + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayOffset);
  const out: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push(d);
  }
  return out;
}

function eventClass(kind: string): string {
  if (kind === "pickup") return "bg-[rgba(34,197,94,.15)] text-[#22c55e]";
  if (kind === "task") return "bg-[rgba(245,158,11,.15)] text-[#f59e0b]";
  if (kind === "sla") return "bg-[rgba(220,30,30,.15)] text-[#dc1e1e]";
  if (kind === "repair_eta" || kind === "part_arrival") return "bg-[rgba(59,130,246,.15)] text-[#3b82f6]";
  if (kind === "availability") return "bg-[rgba(255,255,255,.06)] text-[#9ca3af]";
  return "bg-[rgba(255,255,255,.06)] text-[#9ca3af]";
}

function availabilityDotClass(item: AvailabilityItem): string {
  const v = (item.availability_type ?? item.availability_type_display ?? "").toLowerCase();
  if (v.includes("dost") || v.includes("available")) return "bg-[#22c55e]";
  if (v.includes("zaj") || v.includes("busy")) return "bg-[#f59e0b]";
  if (v.includes("zew") || v.includes("external")) return "bg-[#f97316]";
  return "bg-[#9ca3af]";
}

export default function AdminCalendarPage() {
  const { token, user } = useAuth();
  const popupRef = useRef<HTMLDivElement | null>(null);
  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(new Date(today));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [availability, setAvailability] = useState<AvailabilityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<PopupState>(null);

  const monthStart = useMemo(() => isoDate(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)), [viewMonth]);
  const monthEnd = useMemo(() => isoDate(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0)), [viewMonth]);
  const selectedIso = useMemo(() => isoDate(selectedDate), [selectedDate]);
  const tomorrowIso = useMemo(() => {
    const t = new Date(selectedDate);
    t.setDate(t.getDate() + 1);
    return isoDate(t);
  }, [selectedDate]);

  useEffect(() => {
    if (!token || user?.role !== "admin") return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const [eventRes, availRes] = await Promise.all([
          api.get<CalendarEvent[] | { results?: CalendarEvent[] }>(
            `/calendar/events/?start=${encodeURIComponent(monthStart)}&end=${encodeURIComponent(monthEnd)}&assigned_to=all`,
            token,
          ),
          api.get<AvailabilityItem[] | { results?: AvailabilityItem[] }>(
            `/availability/?date=${encodeURIComponent(isoDate(today))}`,
            token,
          ),
        ]);
        if (cancelled) return;
        setEvents(Array.isArray(eventRes) ? eventRes : eventRes?.results ?? []);
        setAvailability(Array.isArray(availRes) ? availRes : availRes?.results ?? []);
      } catch {
        if (cancelled) return;
        setEvents([]);
        setAvailability([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [token, user?.role, monthStart, monthEnd, today]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) setPopup(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const arr = map.get(ev.date) ?? [];
      arr.push(ev);
      map.set(ev.date, arr);
    }
    return map;
  }, [events]);

  const grid = useMemo(() => monthGrid(viewMonth), [viewMonth]);
  const todayEvents = byDate.get(selectedIso) ?? [];
  const tomorrowEvents = byDate.get(tomorrowIso) ?? [];

  if (user?.role !== "admin") {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
        <p className="text-sm text-[#fca5a5]">Tylko administrator.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-8">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Panel Admina</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Kalendarz</h1>
      </header>

      <section className="mt-4 grid gap-5 lg:grid-cols-[1fr,360px]">
        <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-[#cbd5e1]"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="text-lg font-semibold text-white">
                {viewMonth.toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}
              </div>
              <button
                type="button"
                onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-[#cbd5e1]"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setSelectedDate(now);
                setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#cbd5e1]"
            >
              Dziś
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1">
            {DOW.map((d, idx) => (
              <div key={d} className="text-center text-xs font-semibold uppercase tracking-[.14em] text-[#6b7280]" style={{ opacity: idx === 5 ? 0.75 : idx === 6 ? 0.6 : 1 }}>
                {d}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {grid.map((d) => {
              const iso = isoDate(d);
              const inMonth = d.getMonth() === viewMonth.getMonth();
              const isToday = iso === isoDate(today);
              const dayEvents = byDate.get(iso) ?? [];
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelectedDate(new Date(d))}
                  className={`cal-day min-h-[80px] rounded-[10px] border px-2 py-1 text-left ${
                    isToday ? "border-[rgba(220,30,30,.2)] bg-[rgba(220,30,30,.07)]" : "border-white/5 bg-white/[.02] hover:bg-white/[.035]"
                  } ${inMonth ? "" : "opacity-35"}`}
                >
                  <div className="text-sm font-semibold text-[#d0d4de]">{d.getDate()}</div>
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <button
                        key={String(ev.id)}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPopup({ ev, x: e.clientX, y: e.clientY });
                        }}
                        className={`cal-event block w-full truncate rounded-[5px] px-1.5 py-0.5 text-left text-[9.5px] font-semibold ${eventClass(ev.event_type)}`}
                      >
                        {ev.title}
                      </button>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
            <h2 className="text-sm font-semibold text-white">Legenda</h2>
            <div className="mt-3 space-y-2 text-xs text-[#9ca3af]">
              <div>pickup - zielony</div>
              <div>task - amber</div>
              <div>repair/sla - niebieski/czerwony</div>
              <div>availability - szary</div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
            <h2 className="text-sm font-semibold text-white">Dziś</h2>
            <div className="mt-3 space-y-2">
              {loading ? <p className="text-xs text-[#9ca3af]">Ładowanie...</p> : null}
              {!loading && todayEvents.length === 0 ? <p className="text-xs text-[#6b7280]">Brak zdarzeń.</p> : null}
              {todayEvents.map((ev) => (
                <div key={`today-${ev.id}`} className="text-xs text-[#cbd5e1]">
                  {ev.title}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
            <h2 className="text-sm font-semibold text-white">Jutro</h2>
            <div className="mt-3 space-y-2">
              {!loading && tomorrowEvents.length === 0 ? <p className="text-xs text-[#6b7280]">Brak zdarzeń.</p> : null}
              {tomorrowEvents.map((ev) => (
                <div key={`tom-${ev.id}`} className="text-xs text-[#cbd5e1]">
                  {ev.title}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
            <h2 className="text-sm font-semibold text-white">Dostępność zespołu</h2>
            <div className="mt-3 space-y-2">
              {availability.length === 0 ? <p className="text-xs text-[#6b7280]">Brak danych.</p> : null}
              {availability.map((a) => {
                const name =
                  a.user_full_name || a.user_name || a.user?.full_name || `${a.user?.first_name ?? ""} ${a.user?.last_name ?? ""}`.trim() || "Pracownik";
                return (
                  <div key={String(a.id)} className="flex items-start gap-2">
                    <span className={`mt-1.5 h-2 w-2 rounded-full ${availabilityDotClass(a)}`} />
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-[#d0d4de]">{name}</div>
                      <div className="truncate text-[11px] text-[#8b93a8]">
                        {a.availability_type_display || a.availability_type || "status nieznany"}
                        {a.note ? ` · ${a.note}` : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </section>

      {popup ? (
        <div
          ref={popupRef}
          className="fixed z-[300] w-[320px] rounded-2xl border border-white/10 bg-[#0c0d12] p-4 shadow-2xl"
          style={{ left: popup.x + 10, top: popup.y + 10 }}
        >
          <div className="text-sm font-semibold text-white">{popup.ev.title}</div>
          {popup.ev.description ? <p className="mt-2 text-xs text-[#9ca3af]">{popup.ev.description}</p> : null}
          <p className="mt-2 text-xs text-[#8b93a8]">
            {popup.ev.date} · {popup.ev.event_type}
          </p>
          {popup.ev.repair ? (
            <Link href={`/admin-panel/repairs/${popup.ev.repair}`} className="mt-3 inline-block text-xs font-semibold text-[#3b82f6] hover:underline">
              Otwórz naprawę →
            </Link>
          ) : popup.ev.event_type === "task" ? (
            <Link href="/admin-panel/tasks" className="mt-3 inline-block text-xs font-semibold text-[#3b82f6] hover:underline">
              Otwórz zadanie →
            </Link>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}

