"use client";

import { getStatusBadgeProps } from "@/types/panel";
import type { RepairStatus } from "@/types/panel";

interface StatusBadgeProps {
  status: RepairStatus;
  large?: boolean;
}

export function StatusBadge({ status, large }: StatusBadgeProps) {
  const { label, className } = getStatusBadgeProps(status);
  const showDot = className === "progress" || className === "ready";

  return (
    <span
      className={`
        status-badge ${className}
        inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium
        ${large ? "px-3 py-1.5 text-[13px]" : ""}
      `}
      style={{
        fontFamily: "var(--font-unbounded, inherit)",
      }}
    >
      {showDot && <span className="status-dot h-1.5 w-1.5 shrink-0 rounded-full bg-current" />}
      {label}
    </span>
  );
}
