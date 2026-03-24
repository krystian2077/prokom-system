"use client";

import type { Scope } from "@/types";
import { LiveBadge } from "@/components/layout/LiveBadge";

const LABELS: Record<Scope, string> = {
  today: "Dziś",
  tomorrow: "Jutro",
  week: "Ten tydzień",
  month: "Ten miesiąc",
};

export function ScopeBar({ value, onChange }: { value: Scope; onChange: (s: Scope) => void }) {
  return (
    <div className="mb-[18px] flex flex-wrap items-center gap-1 rounded-[11px] border border-[var(--border)] bg-[var(--s2)] p-1">
      {(["today", "tomorrow", "week", "month"] as const).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={[
            "rounded-[8px] px-4 py-[7px] text-[12px] font-semibold transition-all duration-150",
            value === s
              ? "bg-gradient-to-br from-[#3b82f6] to-[#2563eb] font-bold text-white shadow-[0_2px_8px_rgba(59,130,246,.3)]"
              : "text-[var(--muted)] hover:text-[var(--ink)]",
          ].join(" ")}
        >
          {LABELS[s]}
        </button>
      ))}
      <div className="flex-1" />
      <LiveBadge />
    </div>
  );
}
