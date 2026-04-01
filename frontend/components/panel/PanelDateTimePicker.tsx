"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { format, isValid } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarClock } from "lucide-react";
import "react-day-picker/style.css";
import "./panel-date-picker.css";

function parseLocalDateTime(value: string): Date | undefined {
  if (!value?.trim()) return undefined;
  const d = new Date(value);
  return isValid(d) ? d : undefined;
}

function pad(v: number): string {
  return String(v).padStart(2, "0");
}

function toInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function mergeDateAndTime(date: Date, time: string): string {
  const [hh = "09", mm = "00"] = (time || "09:00").split(":");
  const next = new Date(date);
  next.setHours(Number(hh) || 0, Number(mm) || 0, 0, 0);
  return toInputValue(next);
}

export type PanelDateTimePickerProps = {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  compact?: boolean;
  placeholder?: string;
};

export function PanelDateTimePicker({ value, onChange, disabled, compact, placeholder }: PanelDateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<{ left: number; top: number; width: number } | null>(null);

  const updatePopoverPosition = () => {
    if (!rootRef.current || typeof window === "undefined") return;
    const rect = rootRef.current.getBoundingClientRect();
    const width = Math.min(352, Math.max(180, window.innerWidth - 16));
    const left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - width - 8));
    const estimatedHeight = 470;
    const topBelow = rect.bottom + 8;
    const topAbove = rect.top - estimatedHeight - 8;
    const top = topBelow + estimatedHeight > window.innerHeight - 8 && topAbove > 8 ? topAbove : topBelow;
    setPopoverStyle({ left, top: Math.max(8, top), width });
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    updatePopoverPosition();
    const onViewport = () => updatePopoverPosition();
    window.addEventListener("resize", onViewport);
    window.addEventListener("scroll", onViewport, true);
    return () => {
      window.removeEventListener("resize", onViewport);
      window.removeEventListener("scroll", onViewport, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const selected = parseLocalDateTime(value);
  const selectedDate = selected ? new Date(selected.getFullYear(), selected.getMonth(), selected.getDate()) : undefined;
  const timeValue = selected ? `${pad(selected.getHours())}:${pad(selected.getMinutes())}` : "09:00";
  const label = selected ? format(selected, "d.MM.yyyy, HH:mm", { locale: pl }) : placeholder ?? "Wybierz datę i godzinę…";

  const now = new Date();
  const startMonth = new Date(now.getFullYear() - 2, 0, 1);
  const endMonth = new Date(now.getFullYear() + 6, 11, 31);

  const btnClass = compact
    ? "flex min-w-[11rem] items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--s1)] px-2 py-1 text-left text-xs text-[var(--white)] transition hover:bg-[var(--row-active)] disabled:cursor-not-allowed disabled:opacity-50"
    : "flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-left text-sm text-[var(--white)] transition hover:bg-[var(--row-active)] disabled:cursor-not-allowed disabled:opacity-50";

  const quickPick = (next: Date) => {
    onChange(toInputValue(next));
    setOpen(false);
  };

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
        <span className={selected ? "truncate text-[var(--white)]" : "truncate text-[var(--muted)]"}>{label}</span>
        <CalendarClock className="h-4 w-4 shrink-0 text-[var(--ink2)]" aria-hidden />
      </button>

      {open ? (
        <div
          ref={popoverRef}
          className="panel-date-picker-popover fixed z-[420] rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-3 shadow-2xl shadow-black/60"
          style={popoverStyle ? { left: popoverStyle.left, top: popoverStyle.top, width: popoverStyle.width } : undefined}
          role="dialog"
          aria-label="Kalendarz — wybór daty i godziny"
        >
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={(d) => {
              if (d) onChange(mergeDateAndTime(d, timeValue));
            }}
            locale={pl}
            weekStartsOn={1}
            captionLayout="dropdown"
            startMonth={startMonth}
            endMonth={endMonth}
            defaultMonth={selectedDate ?? now}
          />

          <div className="mt-3 grid gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_120px] sm:items-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9fb1d3]">Godzina</p>
                <input
                  type="time"
                  value={timeValue}
                  onChange={(e) => {
                    if (selectedDate) onChange(mergeDateAndTime(selectedDate, e.target.value));
                    else {
                      const d = new Date();
                      onChange(mergeDateAndTime(d, e.target.value));
                    }
                  }}
                  className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[#111318] px-3 py-2 text-sm text-[var(--white)] outline-none focus:border-[#3b82f6]"
                />
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <button
                  type="button"
                  className="rounded-lg border border-[var(--border)] bg-[var(--row-hover)] px-2.5 py-2 text-xs font-semibold text-[var(--white)] hover:bg-[var(--row-active)]"
                  onClick={() => quickPick(new Date())}
                >
                  Teraz
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[var(--border)] bg-[var(--row-hover)] px-2.5 py-2 text-xs font-semibold text-[var(--white)] hover:bg-[var(--row-active)]"
                  onClick={() => {
                    const next = new Date();
                    next.setDate(next.getDate() + 1);
                    next.setHours(9, 0, 0, 0);
                    quickPick(next);
                  }}
                >
                  Jutro 09:00
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-2">
              <button
                type="button"
                className="text-xs font-semibold text-[var(--ink2)] transition hover:text-[var(--white)]"
                onClick={() => onChange("")}
              >
                Wyczyść
              </button>
              <button
                type="button"
                className="text-xs font-semibold text-[#93c5fd] transition hover:text-white"
                onClick={() => setOpen(false)}
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}



