"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { format, isValid, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarRange } from "lucide-react";
import "react-day-picker/style.css";
import "./panel-date-picker.css";

function parseIsoDate(v: string): Date | undefined {
  if (!v?.trim()) return undefined;
  const d = parseISO(v.slice(0, 10));
  return isValid(d) ? d : undefined;
}

type RangeValue = { from: string; to: string };

export type PanelDateRangePickerProps = {
  value: RangeValue;
  onChange: (next: RangeValue) => void;
  disabled?: boolean;
};

export function PanelDateRangePicker({ value, onChange, disabled }: PanelDateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const selected = useMemo<DateRange | undefined>(() => {
    const from = parseIsoDate(value.from);
    const to = parseIsoDate(value.to);
    if (!from && !to) return undefined;
    return { from, to };
  }, [value.from, value.to]);

  const label = useMemo(() => {
    const from = parseIsoDate(value.from);
    const to = parseIsoDate(value.to);
    if (!from && !to) return "Zakres dat";
    if (from && !to) return `${format(from, "d.MM.yyyy", { locale: pl })} - ...`;
    if (from && to) return `${format(from, "d.MM.yyyy", { locale: pl })} - ${format(to, "d.MM.yyyy", { locale: pl })}`;
    return "Zakres dat";
  }, [value.from, value.to]);

  const now = new Date();
  const startMonth = new Date(now.getFullYear() - 2, 0, 1);
  const endMonth = new Date(now.getFullYear() + 2, 11, 31);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className="flex min-w-[18rem] items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-left text-sm text-[var(--white)] transition hover:bg-[var(--row-active)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={(value.from || value.to) ? "truncate text-[var(--white)]" : "truncate text-[var(--muted)]"}>{label}</span>
        <CalendarRange className="h-4 w-4 shrink-0 text-[var(--ink2)]" aria-hidden />
      </button>

      {open ? (
        <div
          className="panel-date-picker-popover panel-date-range-picker-popover absolute right-0 top-full z-[90] mt-2 min-w-[min(100vw-2rem,24rem)] rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-3 shadow-2xl shadow-black/60"
          role="dialog"
          aria-label="Kalendarz - wybór zakresu dat"
        >
          <DayPicker
            mode="range"
            selected={selected}
            onSelect={(r) => {
              const from = r?.from ? format(r.from, "yyyy-MM-dd") : "";
              const to = r?.to ? format(r.to, "yyyy-MM-dd") : "";
              onChange({ from, to });
            }}
            locale={pl}
            weekStartsOn={1}
            captionLayout="dropdown"
            startMonth={startMonth}
            endMonth={endMonth}
            defaultMonth={selected?.from ?? now}
            numberOfMonths={2}
          />
          <div className="mt-2 flex items-center justify-between border-t border-[var(--border)] pt-2">
            <button
              type="button"
              className="text-xs font-semibold text-[var(--ink2)] transition hover:text-[var(--white)]"
              onClick={() => {
                onChange({ from: "", to: "" });
                setOpen(false);
              }}
            >
              Wyczyść zakres
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] bg-[var(--row-hover)] px-2.5 py-1 text-xs font-semibold text-[var(--white)] hover:bg-[var(--row-active)]"
              onClick={() => setOpen(false)}
            >
              Zamknij
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

