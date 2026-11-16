import { Fx, Layer, Masked } from "./parts";
import type { EffectProps } from "./types";

/**
 * E4 Optyka: on the real lens — a soft haze breathes over it and focus brackets hunt in and
 * out without locking. Scanner: a light bar runs under the lid, stutters, leaves bad lines.
 */
export default function E4Optics({ variant, at, aspect }: EffectProps) {
  if (variant === "scan") {
    return (
      <Fx family="e4" className="is-scan">
        <Masked>
          <Layer aspect={aspect} stretch>
            <defs>
              <linearGradient id="t-fx-scanbar" x1="0" x2="1">
                <stop offset="0" stopColor="#9fe3ff" stopOpacity="0" />
                <stop offset="0.5" stopColor="#e9fbff" stopOpacity="1" />
                <stop offset="1" stopColor="#9fe3ff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect className="t-fx__scanglow" x="-2" y="0" width="16" height="100" fill="url(#t-fx-scanbar)" />
            <rect className="t-fx__scanbar" x="5.4" y="0" width="1.2" height="100" />
            <g className="t-fx__scanlines">
              <rect x="0" y="34" width="100" height="1.4" />
              <rect x="0" y="66" width="100" height="0.9" />
            </g>
          </Layer>
        </Masked>
      </Fx>
    );
  }
  const [x, y] = at ?? [50, 50];
  const W = 100 * aspect;
  const cx = (x / 100) * W;
  const s = Math.min(W, 100) * 0.34; // half-size of the bracket box
  const k = s * 0.42;
  return (
    <Fx family="e4">
      <Masked>
        <Layer aspect={aspect}>
          <defs>
            <radialGradient id="t-fx-haze">
              <stop offset="0" stopColor="#fff" stopOpacity="0.42" />
              <stop offset="0.6" stopColor="#cfe6ff" stopOpacity="0.16" />
              <stop offset="1" stopColor="#cfe6ff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle className="t-fx__haze" cx={cx} cy={y} r={s * 1.05} fill="url(#t-fx-haze)" style={{ transformOrigin: `${cx}px ${y}px` }} />
          <g className="t-fx__brackets" style={{ transformOrigin: `${cx}px ${y}px` }}>
            <path d={`M${cx - s} ${y - s + k} V${y - s} H${cx - s + k}`} />
            <path d={`M${cx + s - k} ${y - s} H${cx + s} V${y - s + k}`} />
            <path d={`M${cx + s} ${y + s - k} V${y + s} H${cx + s - k}`} />
            <path d={`M${cx - s + k} ${y + s} H${cx - s} V${y + s - k}`} />
          </g>
        </Layer>
      </Masked>
    </Fx>
  );
}
