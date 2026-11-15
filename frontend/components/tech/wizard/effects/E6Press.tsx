import { Fx, Layer, Masked } from "./parts";
import type { EffectProps } from "./types";

/** E6 Przyciski i obudowa: the button is pressed (rings spread) but nothing responds; a hairline scratch on the edge. */
export default function E6Press({ at, aspect }: EffectProps) {
  const W = 100 * aspect;
  const [x0, y] = at ?? [50, 50];
  const x = (x0 / 100) * W;
  const r = Math.max(W, 100) * 0.42;
  const o = { transformOrigin: `${x}px ${y}px` };
  return (
    <Fx family="e6">
      <Masked>
        <Layer aspect={aspect}>
          <circle className="t-fx__press" cx={x} cy={y} r={r * 0.3} style={o} />
          <circle className="t-fx__ring" cx={x} cy={y} r={r} style={o} />
          <circle className="t-fx__ring t-fx__ring--2" cx={x} cy={y} r={r} style={o} />
          <path className="t-fx__scratch" d={`M${x - r * 0.9} ${y + r * 0.55} Q${x - r * 0.2} ${y + r * 0.1} ${x + r * 0.7} ${y - r * 0.6}`} pathLength={1} />
        </Layer>
      </Masked>
    </Fx>
  );
}
