import type { ReactNode } from "react";

/** Round-safe stage: a centred square (meet) for icon-like effects. */
export function IconStage({ family, children, size = 58 }: { family: string; children: ReactNode; size?: number }) {
  const o = (100 - size) / 2;
  return (
    <svg className={`t-fx t-fx--${family}`} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <rect className="t-fx__chip" x={o} y={o} width={size} height={size} rx={size * 0.28} />
      <g transform={`translate(${o} ${o}) scale(${size / 100})`}>{children}</g>
    </svg>
  );
}

/** Stretch stage: fills the region (lines, liquids, overlays). */
export function FillStage({ family, children, className = "" }: { family: string; children: ReactNode; className?: string }) {
  return (
    <svg className={`t-fx t-fx--${family} ${className}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}
