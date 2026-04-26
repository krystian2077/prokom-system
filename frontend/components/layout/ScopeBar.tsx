"use client";

import type { Scope } from "@/types";
import { LiveBadge } from "@/components/layout/LiveBadge";
import { motion } from "framer-motion";

const LABELS: Record<Scope, string> = {
  today: "Dziś",
  tomorrow: "Jutro",
  week: "Ten tydzień",
  month: "Ten miesiąc",
};

export function ScopeBar({ value, onChange }: { value: Scope; onChange: (s: Scope) => void }) {
  return (
    <div className="mb-[18px] rounded-[14px] border border-[var(--border)] bg-[var(--s2)] p-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
        <div className="grid w-full grid-cols-2 gap-1.5 sm:flex sm:w-auto sm:flex-1 sm:flex-wrap sm:items-center">
          {(["today", "tomorrow", "week", "month"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className={[
                "relative min-h-[40px] w-full rounded-[10px] px-3 py-2 text-center text-[12px] font-semibold transition-all duration-150 sm:min-h-[34px] sm:w-auto sm:px-4 sm:py-[7px]",
                value === s ? "font-bold text-white" : "text-[var(--muted)] hover:text-[var(--ink)]",
              ].join(" ")}
            >
              {value === s ? (
                <motion.span
                  layoutId="scope-active-pill"
                  className="absolute inset-0 rounded-[10px] bg-gradient-to-br from-[#3b82f6] to-[#2563eb] shadow-[0_2px_8px_rgba(59,130,246,.3)] sm:rounded-[8px]"
                  transition={{ type: "spring", stiffness: 450, damping: 34 }}
                />
              ) : null}
              <span className="relative z-[1] whitespace-nowrap">{LABELS[s]}</span>
            </button>
          ))}
        </div>
        <div className="flex justify-start sm:ml-auto sm:justify-end">
          <LiveBadge />
        </div>
      </div>
    </div>
  );
}
