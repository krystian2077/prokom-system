import type { CSSProperties, ReactNode } from "react";
import type { EffectProps } from "./types";

/**
 * Building blocks of the effects (PREMIUM §4, feat/tech-kreator-wizual).
 * - `Masked`: a layer clipped to the region (rounded box or polygon from `--fx-clip`).
 * - `Layer`: an SVG drawn over the region in its real aspect (no stretched strokes).
 * - `Badge`: a small round glass badge (fixed px, never stretched) with a pictogram; for a
 *   local fault it floats next to the hotspot (towards the device's centre), so the dot never
 *   covers it. Badges are not clipped by the region.
 */
export function Masked({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`t-fx__masked ${className}`}>{children}</div>;
}

/** SVG over the region: viewBox `0 0 (100·aspect) 100` (or 0–100 stretched with `stretch`). */
export function Layer({ aspect, children, className = "", stretch = false }: { aspect: number; children: ReactNode; className?: string; stretch?: boolean }) {
  const w = stretch ? 100 : Math.round(100 * aspect * 10) / 10;
  return (
    <svg className={`t-fx__layer ${className}`} viewBox={`0 0 ${w} 100`} preserveAspectRatio="none" focusable="false" aria-hidden="true">
      {children}
    </svg>
  );
}

/** Where a badge goes (region %) and in which direction it is nudged off the hotspot. */
export function badgePos(p: EffectProps): CSSProperties {
  if (!p.at) return p.badgeAt ? { left: `${p.badgeAt[0]}%`, top: `${p.badgeAt[1]}%` } : { left: "50%", top: "50%" };
  const [dx, dy] = p.nudge ?? [-0.7, -0.7];
  return { left: `${p.at[0]}%`, top: `${p.at[1]}%`, "--bx": dx, "--by": dy } as CSSProperties;
}

export function Badge({ p, children, wide = false, className = "" }: { p: EffectProps; children: ReactNode; wide?: boolean; className?: string }) {
  return (
    <span className={`t-fx__badge${wide ? " is-wide" : ""}${p.at ? " is-nudged" : ""} ${className}`} style={badgePos(p)}>
      <svg viewBox={wide ? "0 0 160 100" : "0 0 100 100"} focusable="false" aria-hidden="true">
        {children}
      </svg>
    </span>
  );
}

/** Root of every effect: one `.t-fx` per scene (tests rely on it). */
export function Fx({ family, children, className = "" }: { family: string; children: ReactNode; className?: string }) {
  return (
    <div className={`t-fx t-fx--${family} ${className}`} aria-hidden="true">
      {children}
    </div>
  );
}

/** Soft tint over the region (a glow or a veil), clipped to it. */
export function Tint({ className }: { className: string }) {
  return (
    <Masked>
      <span className={`t-fx__tint ${className}`} />
    </Masked>
  );
}
