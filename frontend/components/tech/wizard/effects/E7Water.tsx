import { FillStage } from "./parts";
import type { EffectProps } from "./types";

/** E7 Zalanie: drops run down, the liquid rises with a wave, a haze settles. */
export default function E7Water(_props: EffectProps) {
  return (
    <FillStage family="e7">
      <rect className="t-fx__haze" x="0" y="0" width="100" height="100" />
      <g className="t-fx__liquid">
        <path d="M0 72 Q12 68 25 72 T50 72 T75 72 T100 72 L100 100 L0 100 Z" />
      </g>
      <g className="t-fx__drops">
        <ellipse cx="22" cy="18" rx="2.2" ry="3.4" />
        <ellipse cx="48" cy="10" rx="2.6" ry="4" />
        <ellipse cx="70" cy="24" rx="2" ry="3.2" />
        <ellipse cx="86" cy="12" rx="2.4" ry="3.6" />
      </g>
    </FillStage>
  );
}
