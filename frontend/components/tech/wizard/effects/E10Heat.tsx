import type { EffectProps } from "./types";

/** E10 Temperatura: a red glow pulses, heat waves rise, a fan spins. */
export default function E10Heat({ at }: EffectProps) {
  const [x, y] = at ?? [50, 55];
  return (
    <div className="t-fx t-fx--e10" aria-hidden="true">
      <svg className="t-fx__layer" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
        <defs>
          <radialGradient id="t-fx-heat" cx="50%" cy="60%" r="60%">
            <stop offset="0" stopColor="#ff5a3c" stopOpacity="0.7" />
            <stop offset="1" stopColor="#ff5a3c" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect className="t-fx__glow" x="0" y="0" width="100" height="100" fill="url(#t-fx-heat)" />
        <g className="t-fx__waves">
          <path d={`M${x - 18} 96 C${x - 26} 80 ${x - 10} 70 ${x - 18} 54`} />
          <path d={`M${x} 96 C${x - 8} 78 ${x + 8} 66 ${x} 46`} />
          <path d={`M${x + 18} 96 C${x + 10} 80 ${x + 26} 70 ${x + 18} 54`} />
        </g>
      </svg>
      <span className="t-fx__pin" style={{ left: `${x}%`, top: `${y}%` }}>
        <svg viewBox="0 0 100 100" focusable="false">
          <circle className="t-fx__chip" cx="50" cy="50" r="46" />
          <g className="t-fx__fan">
            <path d="M50 50 C40 30 46 14 58 14 C62 28 58 40 50 50 Z" />
            <path d="M50 50 C70 40 86 46 86 58 C72 62 60 58 50 50 Z" />
            <path d="M50 50 C60 70 54 86 42 86 C38 72 42 60 50 50 Z" />
            <path d="M50 50 C30 60 14 54 14 42 C28 38 40 42 50 50 Z" />
          </g>
        </svg>
      </span>
    </div>
  );
}
