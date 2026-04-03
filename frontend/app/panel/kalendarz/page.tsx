"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { usePanelBasePath } from "@/lib/panelPaths";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import type { CalendarCategoryKey, CalendarEventDTO, CalendarMonthResponse } from "@/types/calendar";

type PopupState = { event: CalendarEventDTO; x: number; y: number } | null;
type ScopeType = "team" | "mine";
type StaffOption = { id: string; full_name: string; role: string; staff_profile?: { calendar_color?: string } | null };
type DropdownOption = { value: string; label: string };

function PremiumDropdown({
  label,
  value,
  options,
  onChange,
  disabled = false,
  placeholder = "Wybierz",
}: {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">{label}</div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen((v) => !v);
        }}
        className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.02))] px-4 py-3 text-left text-sm font-semibold text-white shadow-[0_12px_28px_rgba(0,0,0,.18)] transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_18px_36px_rgba(0,0,0,.28)] focus:outline-none focus:ring-4 focus:ring-[rgba(59,130,246,.18)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="truncate">{current?.label ?? placeholder}</span>
        <ChevronDown size={16} className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-[80] mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0f1117] shadow-[0_24px_60px_rgba(0,0,0,.45)] backdrop-blur-xl">
          <div className="max-h-[280px] overflow-auto p-2">
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={[
                    "flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold transition",
                    active
                      ? "bg-[rgba(59,130,246,.16)] text-white shadow-[0_0_0_1px_rgba(59,130,246,.18)]"
                      : "text-[#cbd5e1] hover:bg-white/[.05] hover:text-white",
                  ].join(" ")}
                >
                  <span className="truncate">{opt.label}</span>
                  {active ? <span className="ml-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#93c5fd]">Wybrane</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const DOW = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

const CATEGORY_META: Record<CalendarCategoryKey, { label: string; className: string }> = {
  sla: { label: "SLA / blokady", className: "border border-[rgba(220,38,38,.3)] bg-[rgba(220,38,38,.15)] text-[#fca5a5]" },
  delivery: { label: "Odbiory", className: "border border-[rgba(34,197,94,.28)] bg-[rgba(34,197,94,.15)] text-[#86efac]" },
  event: { label: "Zdarzenia", className: "border border-[rgba(139,92,246,.3)] bg-[rgba(139,92,246,.13)] text-[#ddd6fe]" },
  intake: { label: "Przyjęcia", className: "border border-[rgba(245,158,11,.28)] bg-[rgba(245,158,11,.15)] text-[#fde68a]" },
  eta: { label: "Planowany termin oddania", className: "border border-[rgba(59,130,246,.28)] bg-[rgba(59,130,246,.15)] text-[#bfdbfe]" },
  parts: { label: "Części", className: "border border-[rgba(34,211,238,.28)] bg-[rgba(34,211,238,.12)] text-[#a5f3fc]" },
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function monthGrid(viewMonth: Date): Date[] {
  const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayOffset);
  return Array.from({ length: 42 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function CalendarPage() {
  const panelPaths = usePanelBasePath();
  const { token, user } = useAuth();
  const popupRef = useRef<HTMLDivElement | null>(null);
  const today = useMemo(() => new Date(), []);
  const isStaffOrAdmin = user?.role === "staff" || user?.role === "admin";

  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(new Date(today));
  const [scope, setScope] = useState<ScopeType>("team");
  const [employee, setEmployee] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [popup, setPopup] = useState<PopupState>(null);

  const monthStartISO = useMemo(() => toISODate(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)), [viewMonth]);
  const monthEndISO = useMemo(() => toISODate(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0)), [viewMonth]);
  const selectedISO = useMemo(() => toISODate(selectedDate), [selectedDate]);
  const tomorrowISO = useMemo(() => {
    const t = new Date(selectedDate);
    t.setDate(t.getDate() + 1);
    return toISODate(t);
  }, [selectedDate]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 280);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const onClickOutside = (ev: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(ev.target as Node)) {
        setPopup(null);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const staffQuery = useQuery({
    queryKey: ["staff-calendar-staff"],
    enabled: Boolean(token && user?.role === "admin"),
    queryFn: () => api.get<StaffOption[]>("/accounts/staff/?is_active=true", token),
    staleTime: 60_000,
  });

  const calendarQuery = useQuery({
    queryKey: ["staff-calendar-month", monthStartISO, monthEndISO, scope, employee, category, debouncedSearch, user?.id],
    enabled: Boolean(token && isStaffOrAdmin),
    queryFn: async () => {
      const params = new URLSearchParams({ from: monthStartISO, to: monthEndISO, scope });
      if (scope === "team" && employee && employee !== "all") params.set("employee", employee);
      if (category !== "all") params.set("category", category);
      if (debouncedSearch) params.set("q", debouncedSearch);
      return api.get<CalendarMonthResponse>(`/calendar/month/?${params.toString()}`, token);
    },
    staleTime: 10_000,
  });

  const events = calendarQuery.data?.events ?? [];
  const grid = useMemo(() => monthGrid(viewMonth), [viewMonth]);
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEventDTO[]>();
    for (const ev of events) {
      const arr = map.get(ev.date) ?? [];
      arr.push(ev);
      map.set(ev.date, arr);
    }
    return map;
  }, [events]);

  const selectedEvents = eventsByDate.get(selectedISO) ?? [];
  const tomorrowEvents = eventsByDate.get(tomorrowISO) ?? [];
  const workload = calendarQuery.data?.workload_by_employee ?? [];

  const summary = calendarQuery.data?.summary ?? {
    total_events: events.length,
    days_with_events: new Set(events.map((e) => e.date)).size,
    today_events: events.filter((e) => e.date === toISODate(today)).length,
    tomorrow_events: events.filter((e) => e.date === toISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1))).length,
    by_category: {},
  };

  if (!isStaffOrAdmin) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
        <p className="text-sm text-[#fca5a5]">Brak uprawnień.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[1550px] flex-col gap-5 px-5 py-7">
      <header className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,.18),transparent_45%),#0d1119] p-5">
        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#94a3b8]">
          <CalendarDays size={14} /> Panel pracownika · operacyjny kalendarz zespołu
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Kalendarz premium</h1>
        <p className="mt-1 text-sm text-[#9fb0c8]">Widok SLA, odbiorów, przyjęć i dostaw części z filtrowaniem po pracowniku i szybkim podsumowaniem.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#0d1119] p-4"><div className="text-xs text-[#94a3b8]">Wydarzenia w miesiącu</div><div className="mt-1 text-2xl font-semibold text-white">{summary.total_events}</div></div>
        <div className="rounded-2xl border border-white/10 bg-[#0d1119] p-4"><div className="text-xs text-[#94a3b8]">Dni z aktywnością</div><div className="mt-1 text-2xl font-semibold text-white">{summary.days_with_events}</div></div>
        <div className="rounded-2xl border border-white/10 bg-[#0d1119] p-4"><div className="text-xs text-[#94a3b8]">Dziś</div><div className="mt-1 text-2xl font-semibold text-[#93c5fd]">{summary.today_events}</div></div>
        <div className="rounded-2xl border border-white/10 bg-[#0d1119] p-4"><div className="text-xs text-[#94a3b8]">Jutro</div><div className="mt-1 text-2xl font-semibold text-[#86efac]">{summary.tomorrow_events}</div></div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0d1119] p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <PremiumDropdown
            label="Zakres"
            value={scope}
            onChange={(next) => {
              const cast = next as ScopeType;
              setScope(cast);
              if (cast === "mine") setEmployee("all");
            }}
            options={[
              { value: "team", label: "Cały zespół" },
              { value: "mine", label: "Tylko moje" },
            ]}
          />
          <PremiumDropdown
            label="Pracownik"
            value={employee}
            onChange={setEmployee}
            disabled={scope === "mine"}
            placeholder="Wszyscy"
            options={[
              { value: "all", label: "Wszyscy" },
              ...(staffQuery.data ?? []).map((s) => ({ value: s.id, label: s.full_name })),
            ]}
          />
          <PremiumDropdown
            label="Kategoria"
            value={category}
            onChange={setCategory}
            options={[
              { value: "all", label: "Wszystkie" },
              ...(Object.keys(CATEGORY_META) as CalendarCategoryKey[]).map((c) => ({ value: c, label: CATEGORY_META[c].label })),
            ]}
          />
          <label className="text-xs text-[#94a3b8]">Szukaj
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nr naprawy, klient, pracownik..." className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-[#6b7280]" />
          </label>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr,380px]">
        <div className="rounded-3xl border border-white/10 bg-[#0d1119] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-[#cbd5e1]"><ChevronLeft size={18} /></button>
              <div className="text-xl font-semibold text-white">{viewMonth.toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}</div>
              <button type="button" onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-[#cbd5e1]"><ChevronRight size={18} /></button>
            </div>
            <button type="button" onClick={() => { const now = new Date(); setSelectedDate(now); setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1)); }} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#cbd5e1]">Dziś</button>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-1">
            {DOW.map((d, idx) => <div key={d} className="text-center text-xs font-semibold uppercase tracking-[.14em] text-[#6b7280]" style={{ opacity: idx > 4 ? 0.75 : 1 }}>{d}</div>)}
          </div>

          {calendarQuery.isLoading && !calendarQuery.data ? (
            <div className="mt-2 grid grid-cols-7 gap-1">{Array.from({ length: 42 }).map((_, i) => <Skeleton key={i} className="min-h-[90px] rounded-[10px]" />)}</div>
          ) : calendarQuery.isError ? (
            <div className="mt-5"><ErrorState error={calendarQuery.error} onRetry={() => void calendarQuery.refetch()} title="Nie udało się załadować kalendarza" /></div>
          ) : (
            <div className="mt-2 grid grid-cols-7 gap-1">
              {grid.map((d) => {
                const iso = toISODate(d);
                const inMonth = d.getMonth() === viewMonth.getMonth();
                const isSelected = iso === selectedISO;
                const isToday = iso === toISODate(today);
                const dayEvents = eventsByDate.get(iso) ?? [];
                return (
                  <button key={iso} type="button" onClick={() => setSelectedDate(new Date(d))} className={["min-h-[95px] rounded-[10px] border px-2 py-1 text-left transition", inMonth ? "bg-white/[.03]" : "bg-white/[.015] opacity-40", isToday ? "border-[#dc2626]/40" : "border-white/5", isSelected ? "ring-1 ring-[#3b82f6]/50" : "hover:bg-white/[.06]"].join(" ")}>
                    <div className="text-sm font-semibold text-[#d0d4de]">{d.getDate()}</div>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <button key={ev.id} type="button" onClick={(e) => { e.stopPropagation(); setPopup({ event: ev, x: e.clientX, y: e.clientY }); }} className={`block w-full truncate rounded-[6px] px-1.5 py-0.5 text-left text-[10px] font-semibold ${CATEGORY_META[ev.category].className}`}>
                          {ev.title}
                        </button>
                      ))}
                      {dayEvents.length > 3 ? <div className="text-[10px] font-semibold text-[#94a3b8]">+{dayEvents.length - 3}</div> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-[#0d1119] p-4">
            <h2 className="text-sm font-semibold text-white">Dzień · {selectedDate.toLocaleDateString("pl-PL")}</h2>
            <div className="mt-3 space-y-2">
              {selectedEvents.length === 0 ? <p className="text-xs text-[#6b7280]">Brak zdarzeń.</p> : selectedEvents.slice(0, 8).map((ev) => (
                <button key={`selected-${ev.id}`} type="button" onClick={(e) => { const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect(); setPopup({ event: ev, x: r.left, y: r.bottom }); }} className="flex w-full items-start gap-3 rounded-xl border border-transparent px-1 py-1 text-left transition hover:border-white/10 hover:bg-white/[.04]">
                  <span className="mt-1.5 h-2 w-2 rounded-full" style={{ background: ev.employee_color || "#64748b" }} />
                  <span className="min-w-0 truncate text-xs font-semibold text-[#d0d4de]">{ev.title} {ev.employee_name ? `· ${ev.employee_name}` : ""}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0d1119] p-4">
            <h2 className="text-sm font-semibold text-white">Jutro</h2>
            <div className="mt-3 space-y-2">
              {tomorrowEvents.length === 0 ? <p className="text-xs text-[#6b7280]">Brak zdarzeń na jutro.</p> : tomorrowEvents.slice(0, 6).map((ev) => <div key={`tomorrow-${ev.id}`} className="truncate text-xs text-[#cbd5e1]">{ev.title}</div>)}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0d1119] p-4">
            <h2 className="text-sm font-semibold text-white">Obciążenie zespołu</h2>
            <div className="mt-3 space-y-2">
              {workload.length === 0 ? <p className="text-xs text-[#6b7280]">Brak danych dla wybranych filtrów.</p> : workload.slice(0, 8).map((row) => (
                <div key={row.employee_id} className="rounded-xl border border-white/10 bg-white/[.03] px-3 py-2">
                  <div className="flex items-center justify-between gap-2"><div className="truncate text-xs font-semibold text-[#e2e8f0]">{row.employee_name}</div><div className="text-xs font-semibold text-[#93c5fd]">{row.total_events}</div></div>
                  <div className="mt-1 text-[11px] text-[#94a3b8]">plan: {row.planned_work} · odbiory: {row.ready_for_pickup} · zakończone: {row.completed}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0d1119] p-4">
            <h2 className="text-sm font-semibold text-white">Legenda</h2>
            <div className="mt-3 space-y-2">
              {(Object.keys(CATEGORY_META) as CalendarCategoryKey[]).map((key) => <div key={key} className="flex items-center gap-2 text-xs text-[#cbd5e1]"><span className={`inline-block h-2.5 w-2.5 rounded ${CATEGORY_META[key].className}`} />{CATEGORY_META[key].label} ({summary.by_category[key] ?? 0})</div>)}
            </div>
          </div>
        </aside>
      </section>

      {popup ? (
        <div ref={popupRef} className="fixed z-[300] w-[340px] rounded-2xl border border-white/10 bg-[#0d1119] p-4 shadow-2xl" style={{ left: Math.min(popup.x + 10, typeof window !== "undefined" ? window.innerWidth - 360 : 0), top: Math.min(popup.y + 10, typeof window !== "undefined" ? window.innerHeight - 220 : 0) }}>
          <div className="text-sm font-semibold text-white">{popup.event.title}</div>
          <div className="mt-2 text-xs text-[#94a3b8]">{popup.event.date}{popup.event.time ? ` · ${popup.event.time}` : ""}</div>
          {popup.event.subtitle ? <p className="mt-2 text-xs text-[#cbd5e1]">{popup.event.subtitle}</p> : null}
          {popup.event.employee_name ? <p className="mt-2 text-xs text-[#93c5fd]">Odpowiedzialny: {popup.event.employee_name}</p> : null}
          {popup.event.repair_id ? <Link href={panelPaths.repairDetailPath(popup.event.repair_id)} className="mt-3 inline-block text-xs font-semibold text-[#3b82f6] hover:underline">Otwórz naprawę →</Link> : null}
        </div>
      ) : null}
    </main>
  );
}
