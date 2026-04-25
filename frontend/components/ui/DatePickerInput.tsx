"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { format, isValid, parse } from "date-fns";
import { pl } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

interface DatePickerInputProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: Date;
  label?: string;
}

function parseIso(iso: string): Date | undefined {
  if (!iso) return undefined;
  const d = parse(iso, "yyyy-MM-dd", new Date());
  return isValid(d) ? d : undefined;
}

export default function DatePickerInput({
  value,
  onChange,
  placeholder = "Wybierz datę",
  minDate,
  label,
}: DatePickerInputProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(parseIso(value) ?? new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = parseIso(value);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Sync month when value changes externally
  useEffect(() => {
    const d = parseIso(value);
    if (d) setMonth(d);
  }, [value]);

  const displayValue = selected ? format(selected, "dd.MM.yyyy") : "";

  function handleSelect(day: Date | undefined) {
    if (!day) return;
    onChange(format(day, "yyyy-MM-dd"));
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
  }

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
          {label}
        </div>
      )}

      {/* Trigger input */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          "mt-1.5 flex w-full items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-sm transition",
          "bg-[#111318] outline-none",
          open
            ? "border-[#3b82f6]/70 ring-2 ring-[#3b82f6]/15"
            : "border-[var(--border)] hover:border-[#3b82f6]/40",
        ].join(" ")}
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-[#3b82f6]" />
        <span className={`flex-1 text-left ${displayValue ? "text-[var(--white)]" : "text-[var(--muted)]"}`}>
          {displayValue || placeholder}
        </span>
        {displayValue && (
          <span
            role="button"
            onClick={handleClear}
            className="flex h-5 w-5 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-white/10 hover:text-[var(--white)]"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {/* Calendar popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 z-50 mt-2 rounded-2xl border border-[var(--border)] bg-[#0d1117] p-4 shadow-2xl shadow-black/60 ring-1 ring-white/5"
            style={{ minWidth: 300 }}
          >
            {/* Subtle glow accent */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-[#3b82f6]/40 to-transparent" />

            <DayPicker
              mode="single"
              selected={selected}
              onSelect={handleSelect}
              month={month}
              onMonthChange={setMonth}
              locale={pl}
              disabled={minDate ? { before: minDate } : undefined}
              classNames={{
                root: "select-none",
                months: "",
                month: "",
                month_caption: "flex items-center justify-between mb-3 px-1",
                caption_label: "text-sm font-semibold text-[var(--white)] capitalize",
                nav: "flex items-center gap-1",
                button_previous: [
                  "flex h-7 w-7 items-center justify-center rounded-xl border border-[var(--border)]",
                  "text-[var(--muted)] transition hover:border-[#3b82f6]/40 hover:bg-[#3b82f6]/10 hover:text-[#3b82f6]",
                ].join(" "),
                button_next: [
                  "flex h-7 w-7 items-center justify-center rounded-xl border border-[var(--border)]",
                  "text-[var(--muted)] transition hover:border-[#3b82f6]/40 hover:bg-[#3b82f6]/10 hover:text-[#3b82f6]",
                ].join(" "),
                month_grid: "w-full border-collapse",
                weekdays: "",
                weekday: "pb-2 text-center text-[10px] font-medium uppercase tracking-wider text-[var(--muted)] w-10",
                weeks: "",
                week: "",
                day: "p-0.5 text-center",
                day_button: [
                  "relative flex h-8 w-8 items-center justify-center rounded-xl text-sm transition-all duration-100 mx-auto",
                  "text-[var(--white)] hover:bg-[#3b82f6]/15 hover:text-[#60a5fa]",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]/50",
                ].join(" "),
                selected:
                  "[&>button]:!bg-[#3b82f6] [&>button]:!text-white [&>button]:font-semibold [&>button]:shadow-lg [&>button]:shadow-[#3b82f6]/30 [&>button]:hover:!bg-[#2563eb]",
                today:
                  "[&>button]:border [&>button]:border-[#3b82f6]/50 [&>button]:text-[#60a5fa]",
                outside: "[&>button]:opacity-30",
                disabled: "[&>button]:cursor-not-allowed [&>button]:opacity-20 [&>button]:hover:bg-transparent",
              }}
              components={{
                Chevron: ({ orientation }) =>
                  orientation === "left" ? (
                    <ChevronLeft className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  ),
              }}
            />

            {/* Today shortcut */}
            <div className="mt-3 border-t border-[var(--border)] pt-3">
              <button
                type="button"
                onClick={() => handleSelect(new Date())}
                className="w-full rounded-xl py-1.5 text-xs font-medium text-[var(--muted)] transition hover:bg-[#3b82f6]/10 hover:text-[#60a5fa]"
              >
                Dzisiaj
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
