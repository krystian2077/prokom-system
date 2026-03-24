"use client";

import type { RepairListItem } from "@/types";

export type NextAction =
  | "assign"
  | "diagnosis"
  | "send_quote"
  | "wait_decision"
  | "order_part"
  | "repair"
  | "mount_part"
  | "contact_client"
  | "notify_ready"
  | "done";

const ACTION_CONFIG: Record<NextAction, { label: string; bg: string; color: string; border: string }> = {
  assign: {
    label: "⚠ Przypisz pracownika",
    bg: "var(--al)",
    color: "var(--amber)",
    border: "var(--ab)",
  },
  diagnosis: {
    label: "🔍 Diagnostyka",
    bg: "var(--cl)",
    color: "var(--cyan)",
    border: "var(--cb)",
  },
  send_quote: {
    label: "→ Wyślij wycenę",
    bg: "var(--bl)",
    color: "var(--blue)",
    border: "var(--bb)",
  },
  wait_decision: {
    label: "⏳ Czekaj na decyzję",
    bg: "var(--pl)",
    color: "var(--purple)",
    border: "var(--pb)",
  },
  order_part: {
    label: "→ Zamów część",
    bg: "var(--al)",
    color: "var(--amber)",
    border: "var(--ab)",
  },
  repair: {
    label: "▶ Kontynuuj naprawę",
    bg: "rgba(34,197,94,.08)",
    color: "var(--green)",
    border: "rgba(34,197,94,.2)",
  },
  mount_part: {
    label: "▶ Zamontuj część",
    bg: "rgba(34,197,94,.12)",
    color: "var(--green)",
    border: "rgba(34,197,94,.3)",
  },
  contact_client: {
    label: "☎ Skontaktuj się",
    bg: "var(--rl)",
    color: "#ff6b6b",
    border: "var(--rb)",
  },
  notify_ready: {
    label: "✓ Poinformuj klienta",
    bg: "rgba(34,197,94,.12)",
    color: "var(--green)",
    border: "rgba(34,197,94,.3)",
  },
  done: {
    label: "✓ Zakończono",
    bg: "rgba(255,255,255,.04)",
    color: "var(--muted)",
    border: "var(--border)",
  },
};

export function getNextAction(r: Pick<RepairListItem, "status" | "assigned_to">): NextAction {
  if (!r.assigned_to) return "assign";
  if (r.status === "new") return "diagnosis";
  if (r.status === "diagnosis") return "send_quote";
  if (r.status === "waiting_for_quote_approval") return "wait_decision";
  if (r.status === "waiting_for_parts") return "order_part";
  if (r.status === "in_progress") return "repair";
  if (r.status === "ready_for_pickup") return "notify_ready";
  if (r.status === "delivered" || r.status === "cancelled") return "done";
  return "repair";
}

export function NextActionBadge({ repair }: { repair: Pick<RepairListItem, "status" | "assigned_to"> }) {
  const action = getNextAction(repair);
  const c = ACTION_CONFIG[action];
  if (action === "done") return null;
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-[6px] px-2 py-[3px] text-[10px] font-bold"
      style={{
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
      }}
    >
      {c.label}
    </span>
  );
}
