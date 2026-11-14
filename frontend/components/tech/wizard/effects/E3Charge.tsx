import { IconStage } from "./parts";
import type { EffectProps } from "./types";

/** E3 Ładowanie: the plug goes in, the bolt flickers and dies. */
export default function E3Charge(_props: EffectProps) {
  return (
    <IconStage family="e3">
      <g className="t-fx__plug">
        <path className="t-fx__line" d="M50 92 L50 74" />
        <rect className="t-fx__line t-fx__fill-ink" x="40" y="60" width="20" height="14" rx="3" />
        <path className="t-fx__line" d="M45 60 L45 52 M55 60 L55 52" />
      </g>
      <path className="t-fx__bolt" d="M54 10 L38 34 L50 34 L44 50 L62 24 L50 24 Z" />
      <path className="t-fx__x" d="M30 18 L70 46 M70 18 L30 46" />
    </IconStage>
  );
}
