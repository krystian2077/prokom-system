"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { format, isValid, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import "react-day-picker/style.css";
import "./panel-date-picker.css";

function parseIsoDate(v: string): Date | undefined {
  if (!v?.trim()) return undefined;
  const d = parseISO(v.slice(0, 10));
  return isValid(d) ? d : undefined;
}

export type PanelDatePickerProps = {
  /** Wartość w formacie YYYY-MM-DD lub pusty string. */
  value: string;
  onChange: (yyyyMmDd: string) => void;
  disabled?: boolean;
  /** Mniejszy przycisk (np. w wierszu tabeli). */
  compact?: boolean;
};

export function PanelDatePicker({ value, onChange, disabled, compact }: PanelDatePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
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

  const selected = parseIsoDate(value);
  const label = selected ? format(selected, "d.MM.yyyy", { locale: pl }) : "Wybierz datę…";

  const now = new Date();
  const startMonth = new Date(now.getFullYear() - 2, 0, 1);
  const endMonth = new Date(now.getFullYear() + 6, 11, 31);

  const btnClass = compact
    ? "flex min-w-[9.5rem] items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#0c0d12] px-2 py-1 text-left text-xs text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
    : "flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={btnClass}
      >
        <span className={selected ? "truncate text-white" : "truncate text-[#6b7280]"}>{label}</span>
        <CalendarDays className="h-4 w-4 shrink-0 text-[#9ca3af]" aria-hidden />
      </button>

      {open ? (
        <div
          className="panel-date-picker-popover absolute left-0 top-full z-[80] mt-2 min-w-[min(100vw-2rem,20rem)] rounded-2xl border border-white/10 bg-[#0f1117] p-3 shadow-2xl shadow-black/60"
          role="dialog"
          aria-label="Kalendarz — wybór daty"
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(d) => {
              if (d) onChange(format(d, "yyyy-MM-dd"));
              setOpen(false);
            }}
            locale={pl}
            weekStartsOn={1}
            captionLayout="dropdown"
            startMonth={startMonth}
            endMonth={endMonth}
            defaultMonth={selected ?? now}
          />
          {selected ? (
            <div className="mt-2 flex justify-end border-t border-white/10 pt-2">
              <button
                type="button"
                className="text-xs font-semibold text-[#9ca3af] transition hover:text-white"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                Wyczyść datę
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
