import { IconStage } from "./parts";
import type { EffectProps } from "./types";

/** E11 Wydajność: the needle hangs low and the progress bar stalls; "upgrade" — both climb. */
export default function E11Perf({ variant }: EffectProps) {
  const up = variant === "upgrade" ? " is-up" : "";
  return (
    <IconStage family="e11" size={70}>
      <path className="t-fx__line" d="M16 62 A34 34 0 0 1 84 62" />
      <g className={`t-fx__needle${up}`}>
        <path d="M50 62 L50 34" />
        <circle cx="50" cy="62" r="4" />
      </g>
      <rect className="t-fx__track" x="18" y="76" width="64" height="6" rx="3" />
      <rect className={`t-fx__bar${up}`} x="18" y="76" width="64" height="6" rx="3" />
    </IconStage>
  );
}
