"use client";

import type { ReactNode } from "react";

/**
 * Pointer spotlight for a group of cards: sets --mx/--my on the hovered `[data-spot]` card,
 * tech-about.css draws a soft glow there. Mouse/pen only (touch has no hover), one listener
 * for the whole group, no re-renders.
 */
export function Spotlight({ className, children, ...rest }: { className?: string; children: ReactNode } & Record<`data-${string}`, string>) {
  return (
    <div
      {...rest}
      className={className}
      onPointerMove={(e) => {
        if (e.pointerType === "touch") return;
        const card = (e.target as HTMLElement).closest<HTMLElement>("[data-spot]");
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </div>
  );
}
