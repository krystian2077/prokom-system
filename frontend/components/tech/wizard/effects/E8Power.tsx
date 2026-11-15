import type { EffectProps } from "./types";

/** E8 Zasilanie: the screen goes dark, the power symbol blinks and does not start. */
export default function E8Power(_props: EffectProps) {
  return (
    <div className="t-fx t-fx--e8" aria-hidden="true">
      <svg className="t-fx__layer" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
        <rect className="t-fx__dark" x="0" y="0" width="100" height="100" />
      </svg>
      {/* round symbol in its own box, so a stretched region never turns it into an ellipse */}
      <span className="t-fx__center">
        <svg viewBox="0 0 100 100" focusable="false">
          <circle className="t-fx__halo" cx="50" cy="50" r="40" />
          <g className="t-fx__power">
            <path d="M34 30 A28 28 0 1 0 66 30" />
            <path d="M50 18 L50 50" />
          </g>
        </svg>
      </span>
    </div>
  );
}
