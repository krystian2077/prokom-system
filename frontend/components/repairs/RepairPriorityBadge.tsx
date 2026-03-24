"use client";

import type { RepairPriority } from "@/types";

const CONFIG: Record<
  RepairPriority,
  { label: string; show: boolean; bg: string; color: string; border: string; glow: boolean }
> = {
  low: {
    label: "Niski",
    show: false,
    bg: "var(--s4)",
    color: "var(--muted)",
    border: "var(--border)",
    glow: false,
  },
  normal: { label: "", show: false, bg: "", color: "", border: "", glow: false },
  high: {
    label: "Wysoki",
    show: true,
    bg: "var(--al)",
    color: "var(--amber)",
    border: "var(--ab)",
    glow: false,
  },
  urgent: {
    label: "Pilne",
    show: true,
    bg: "rgba(220,30,30,.16)",
    color: "#ff4444",
    border: "rgba(220,30,30,.38)",
    glow: true,
  },
};

export function RepairPriorityBadge({ priority }: { priority: RepairPriority }) {
  const c = CONFIG[priority];
  if (!c.show) return null;
  return (
    <span
      className="inline-flex items-center rounded-[5px] px-1.5 py-[2px] text-[8.5px] font-black uppercase tracking-[.06em]"
      style={{
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        animation: c.glow ? "glowR 2s infinite" : "none",
      }}
    >
      {c.label}
    </span>
  );
}
