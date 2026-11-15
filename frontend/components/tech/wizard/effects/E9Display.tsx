import { FillStage, IconStage } from "./parts";
import type { EffectProps } from "./types";

/** E9 Obraz: flicker and colour bands; "nosignal" — a "brak sygnału" card. */
export default function E9Display({ variant }: EffectProps) {
  if (variant === "nosignal") {
    return (
      <IconStage family="e9" size={74}>
        <rect className="t-fx__line" x="12" y="18" width="76" height="48" rx="5" />
        <path className="t-fx__line" d="M40 76 L60 76 M50 66 L50 76" />
        <path className="t-fx__nosig" d="M40 32 L60 52 M60 32 L40 52" />
        <text className="t-fx__label" x="50" y="93" textAnchor="middle">
          brak sygnału
        </text>
      </IconStage>
    );
  }
  return (
    <FillStage family="e9">
      <rect className="t-fx__flicker" x="0" y="0" width="100" height="100" />
      <g className="t-fx__bands">
        <rect x="0" y="18" width="100" height="5" fill="#e2483a" />
        <rect x="0" y="40" width="100" height="2.5" fill="#4fb3ff" />
        <rect x="0" y="58" width="100" height="7" fill="#7bd36a" />
        <rect x="0" y="80" width="100" height="3" fill="#f2d14b" />
      </g>
      <rect className="t-fx__vline" x="62" y="0" width="1.4" height="100" />
    </FillStage>
  );
}
