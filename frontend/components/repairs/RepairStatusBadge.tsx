"use client";

import type { RepairStatus } from "@/types";

const CONFIG: Record<
  RepairStatus,
  { label: string; bg: string; color: string; border: string; pulse: boolean }
> = {
  new: {
    label: "Nowe",
    bg: "rgba(255,255,255,.05)",
    color: "var(--ink2)",
    border: "var(--border2)",
    pulse: false,
  },
  diagnosis: {
    label: "Diagnostyka",
    bg: "var(--cl)",
    color: "var(--cyan)",
    border: "var(--cb)",
    pulse: false,
  },
  waiting_for_quote_approval: {
    label: "Czeka na wycenę",
    bg: "var(--pl)",
    color: "var(--purple)",
    border: "var(--pb)",
    pulse: false,
  },
  in_progress: {
    label: "W naprawie",
    bg: "var(--al)",
    color: "var(--amber)",
    border: "var(--ab)",
    pulse: true,
  },
  waiting_for_parts: {
    label: "Czeka na część",
    bg: "var(--bl)",
    color: "var(--blue)",
    border: "var(--bb)",
    pulse: false,
  },
  ready_for_pickup: {
    label: "Gotowe",
    bg: "var(--gl)",
    color: "var(--green)",
    border: "var(--gb)",
    pulse: true,
  },
  delivered: {
    label: "Wydano",
    bg: "rgba(255,255,255,.04)",
    color: "var(--muted)",
    border: "var(--border)",
    pulse: false,
  },
  cancelled: {
    label: "Anulowano",
    bg: "var(--rl)",
    color: "#ff6b6b",
    border: "var(--rb)",
    pulse: false,
  },
};

interface Props {
  status: RepairStatus;
  size?: "sm" | "md";
}

export function RepairStatusBadge({ status, size = "md" }: Props) {
  const c = CONFIG[status];
  const textSize = size === "sm" ? "text-[8.5px]" : "text-[9.5px]";
  return (
    <span
      className={`inline-flex items-center gap-1 ${textSize} whitespace-nowrap rounded-full px-2 py-[3px] font-bold uppercase tracking-[.04em]`}
      style={{
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
      }}
    >
      <span
        className="h-1 w-1 flex-shrink-0 rounded-full"
        style={{
          background: c.color,
          animation: c.pulse ? "pulse 1.5s infinite" : "none",
        }}
      />
      {c.label}
    </span>
  );
}
