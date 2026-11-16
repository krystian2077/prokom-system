import { Badge, Fx, Tint } from "./parts";
import type { EffectProps } from "./types";

/** E3 Ładowanie: the plug slides in, the bolt flickers and dies — no current gets through. */
export default function E3Charge(p: EffectProps) {
  return (
    <Fx family="e3">
      <Tint className="t-fx__spark" />
      <Badge p={p}>
        <g className="t-fx__plug">
          <path className="t-fx__stroke" d="M50 90 L50 76" />
          <rect className="t-fx__solid" x="40" y="62" width="20" height="15" rx="4" />
          <path className="t-fx__stroke" d="M45 62 L45 54 M55 62 L55 54" />
        </g>
        <path className="t-fx__bolt" d="M55 12 L38 36 L50 36 L44 52 L63 26 L51 26 Z" />
        <path className="t-fx__slash" d="M32 50 L70 14" />
      </Badge>
    </Fx>
  );
}
