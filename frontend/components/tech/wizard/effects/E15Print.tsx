import { FillStage } from "./parts";
import type { EffectProps } from "./types";

/** E15 Druk i papier: jam (crumpled sheet), streaks, blank sheet, ink drops. */
export default function E15Print({ variant }: EffectProps) {
  if (variant === "ink") {
    return (
      <FillStage family="e15" className="is-ink">
        {[14, 38, 62, 86].map((x, i) => (
          <ellipse key={x} className="t-fx__drop" cx={x} cy="30" rx="4" ry="9" style={{ animationDelay: `${i * 180}ms` }} />
        ))}
        <rect className="t-fx__puddle" x="4" y="88" width="92" height="8" rx="4" />
      </FillStage>
    );
  }
  return (
    <FillStage family="e15" className={`is-${variant ?? "blank"}`}>
      <g className="t-fx__sheet">
        {variant === "jam" ? (
          <path className="t-fx__paper" d="M30 100 L30 40 L38 30 L46 44 L54 26 L62 42 L70 30 L70 100 Z" />
        ) : (
          <rect className="t-fx__paper" x="26" y="20" width="48" height="90" rx="1.5" />
        )}
        {variant === "streaks" ? (
          <g className="t-fx__streaks">
            <rect x="32" y="30" width="36" height="3" />
            <rect x="32" y="44" width="36" height="1.5" />
            <rect x="32" y="56" width="36" height="5" />
            <rect x="32" y="72" width="36" height="2" />
          </g>
        ) : null}
      </g>
      {variant === "jam" ? <path className="t-fx__x" d="M44 8 L56 20 M56 8 L44 20" /> : null}
    </FillStage>
  );
}
