import { Badge, Fx, Layer, Masked } from "./parts";
import type { EffectProps } from "./types";

const wave = (y: number, a: number) => `M0 ${y} Q12.5 ${y - a} 25 ${y} T50 ${y} T75 ${y} T100 ${y} T125 ${y} T150 ${y} T175 ${y} T200 ${y} L200 100 L0 100 Z`;

/**
 * E7 Zalanie: water rises from the bottom in two layered waves (drifting sideways), bubbles
 * climb, drops run down the glass, a cold haze settles; a drop badge in the middle.
 */
export default function E7Water(p: EffectProps) {
  return (
    <Fx family="e7">
      <Masked>
        <span className="t-fx__tint t-fx__haze" />
        <Layer aspect={p.aspect} stretch className="t-fx__water">
          <g className="t-fx__level">
            <path className="t-fx__wave t-fx__wave--back" d={wave(70, 3)} />
            <path className="t-fx__wave t-fx__wave--front" d={wave(73, 2.4)} />
          </g>
          <g className="t-fx__bubbles">
            {[18, 37, 58, 81].map((x, i) => (
              <circle key={x} cx={x} cy={94} r={0.9 + (i % 2) * 0.5} style={{ animationDelay: `${600 + i * 260}ms` }} />
            ))}
          </g>
          <g className="t-fx__drops">
            {[
              [16, 10],
              [44, 4],
              [69, 14],
              [88, 6],
            ].map(([x, y], i) => (
              <path key={x} d={`M${x} ${y} q1.6 3.2 0 4.6 q-1.6 -1.4 0 -4.6 Z`} style={{ animationDelay: `${i * 280}ms` }} />
            ))}
          </g>
        </Layer>
      </Masked>
      <Badge p={{ ...p, at: null }}>
        <path className="t-fx__droplet" d="M50 20 C40 36 30 46 30 59 A20 20 0 0 0 70 59 C70 46 60 36 50 20 Z" />
        <path className="t-fx__glare" d="M41 58 A9 9 0 0 0 48 69" />
      </Badge>
    </Fx>
  );
}
