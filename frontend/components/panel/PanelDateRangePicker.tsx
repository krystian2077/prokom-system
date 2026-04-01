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

function ymd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function lastDaysRange(days: number): RangeValue {
  const to = startOfDay(new Date());
  const from = new Date(to);
  from.setDate(to.getDate() - (days - 1));
  return { from: ymd(from), to: ymd(to) };
}

type RangeValue = { from: string; to: string };

export type PanelDateRangePickerProps = {
  value: RangeValue;
  onChange: (next: RangeValue) => void;
  disabled?: boolean;
};

export function PanelDateRangePicker({ value, onChange, disabled }: PanelDateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RangeValue>(value);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(value);
  }, [open, value]);

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
    const from = parseIsoDate(draft.from);
    const to = parseIsoDate(draft.to);
    if (!from && !to) return undefined;
    return { from, to };
  }, [draft.from, draft.to]);

  const canApply = Boolean((draft.from && draft.to) || (!draft.from && !draft.to));

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
          <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <div className="text-xs text-[#9fb1d3]">
              <span className="font-semibold text-[#dbeafe]">Od:</span> {draft.from || "-"}
            </div>
            <div className="text-xs text-[#9fb1d3]">
              <span className="font-semibold text-[#dbeafe]">Do:</span> {draft.to || "-"}
            </div>
          </div>

          <div className="mb-2 flex flex-wrap gap-2">
            {[
              { key: "7", label: "7 dni", range: lastDaysRange(7) },
              { key: "14", label: "14 dni", range: lastDaysRange(14) },
              { key: "30", label: "30 dni", range: lastDaysRange(30) },
              { key: "today", label: "Dzisiaj", range: lastDaysRange(1) },
            ].map((p) => (
              <button
                key={p.key}
                type="button"
                className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-[#bcd0ef] transition hover:border-[#3b82f6]/50 hover:bg-[#3b82f6]/18"
                onClick={() => setDraft(p.range)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <DayPicker
            mode="range"
            selected={selected}
            onSelect={(r) => {
              const from = r?.from ? format(r.from, "yyyy-MM-dd") : "";
              const to = r?.to ? format(r.to, "yyyy-MM-dd") : "";
              setDraft({ from, to });
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
                setDraft({ from: "", to: "" });
              }}
            >
              Wyczyść
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-lg border border-[var(--border)] bg-[var(--row-hover)] px-2.5 py-1 text-xs font-semibold text-[var(--white)] hover:bg-[var(--row-active)]"
                onClick={() => {
                  setDraft(value);
                setOpen(false);
              }}
            >
                Anuluj
              </button>
              <button
                type="button"
                className="rounded-lg border border-[#3b82f6]/40 bg-[#3b82f6]/20 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-[#3b82f6]/30 disabled:opacity-50"
                onClick={() => {
                  onChange(draft);
                  setOpen(false);
                }}
                disabled={!canApply}
              >
                Zastosuj
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

