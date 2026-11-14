import type { EffectProps } from "./types";

/** E17 Sterowanie: the thumbstick drifts by itself, leaving a trail. */
export default function E17Stick(_props: EffectProps) {
  return (
    <svg className="t-fx t-fx--e17" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <circle className="t-fx__base" cx="50" cy="50" r="40" />
      <circle className="t-fx__cross" cx="50" cy="50" r="3" />
      <path className="t-fx__trail" d="M50 50 C56 46 62 44 68 40" pathLength={1} />
      <circle className="t-fx__knob" cx="68" cy="40" r="14" />
    </svg>
  );
}
