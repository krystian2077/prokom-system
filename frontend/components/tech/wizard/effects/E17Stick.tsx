import { Fx } from "./parts";
import type { EffectProps } from "./types";

/** E17 Sterowanie: on the real thumbstick — the cap drifts off centre by itself, leaving a trail; the crosshair stays put. */
export default function E17Stick(_p: EffectProps) {
  return (
    <Fx family="e17">
      <svg className="t-fx__layer" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" focusable="false" aria-hidden="true">
        <circle className="t-fx__base" cx="50" cy="50" r="44" />
        <path className="t-fx__cross" d="M50 40 L50 60 M40 50 L60 50" />
        <path className="t-fx__trail" d="M50 50 C55 47 61 45 67 40" pathLength={1} />
        <g className="t-fx__knob">
          <circle cx="67" cy="40" r="17" />
          <circle cx="67" cy="40" r="6" className="t-fx__knobdot" />
        </g>
      </svg>
    </Fx>
  );
}
