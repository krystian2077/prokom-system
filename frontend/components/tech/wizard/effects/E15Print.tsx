import { Badge, Fx, Layer, Masked } from "./parts";
import type { EffectProps } from "./types";

/** E15 Druk i papier: jam (the sheet buckles), streaks, a blank sheet, ink drops under the tanks. */
export default function E15Print(p: EffectProps) {
  const { variant, aspect } = p;
  if (variant === "ink") {
    const W = 100 * aspect;
    return (
      <Fx family="e15" className="is-ink">
        <Masked>
          <Layer aspect={aspect}>
            {[0.14, 0.38, 0.62, 0.86].map((x, i) => (
              <path key={x} className="t-fx__drop" d={`M${x * W} 18 q4 9 0 13 q-4 -4 0 -13 Z`} style={{ animationDelay: `${i * 200}ms` }} />
            ))}
            <ellipse className="t-fx__puddle" cx={W / 2} cy="93" rx={W * 0.44} ry="5" />
          </Layer>
        </Masked>
      </Fx>
    );
  }
  const W = 100 * aspect;
  const pw = Math.min(W * 0.46, 120);
  const x0 = (W - pw) / 2;
  return (
    <Fx family="e15" className={`is-${variant ?? "blank"}`}>
      <Masked>
        <Layer aspect={aspect}>
          <g className="t-fx__sheet">
            {variant === "jam" ? (
              <path
                className="t-fx__paper"
                d={`M${x0} 104 L${x0} 46 L${x0 + pw * 0.16} 30 L${x0 + pw * 0.34} 48 L${x0 + pw * 0.52} 24 L${x0 + pw * 0.7} 46 L${x0 + pw * 0.86} 30 L${x0 + pw} 44 L${x0 + pw} 104 Z`}
              />
            ) : (
              <rect className="t-fx__paper" x={x0} y="16" width={pw} height="96" rx="1.5" />
            )}
            {variant === "jam" ? (
              <path className="t-fx__fold" d={`M${x0 + pw * 0.16} 30 L${x0 + pw * 0.2} 100 M${x0 + pw * 0.52} 24 L${x0 + pw * 0.5} 100 M${x0 + pw * 0.86} 30 L${x0 + pw * 0.82} 100`} />
            ) : null}
            {variant === "streaks" ? (
              <g className="t-fx__streaks">
                <rect x={x0 + pw * 0.1} y="30" width={pw * 0.8} height="3.5" />
                <rect x={x0 + pw * 0.1} y="44" width={pw * 0.8} height="1.6" />
                <rect x={x0 + pw * 0.1} y="56" width={pw * 0.8} height="6" />
                <rect x={x0 + pw * 0.1} y="74" width={pw * 0.8} height="2.2" />
              </g>
            ) : null}
          </g>
        </Layer>
      </Masked>
      {variant === "jam" || variant === "blank" ? (
        <Badge p={p} className="is-small">
          {variant === "jam" ? <path className="t-fx__x" d="M36 36 L64 64 M64 36 L36 64" /> : <path className="t-fx__q" d="M38 39 C38 25 62 25 62 39 C62 50 50 50 50 60 M50 71 L50 71.5" />}
        </Badge>
      ) : null}
    </Fx>
  );
}
