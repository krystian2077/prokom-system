import type { CSSProperties } from "react";
import { Badge, Fx, Layer, Masked } from "./parts";
import type { EffectProps } from "./types";

/** E10 Temperatura: a red-hot glow breathes, heat shimmer rises, the fan in the badge spins flat out. */
export default function E10Heat(p: EffectProps) {
  const [x] = p.at ?? [50, 55];
  return (
    <Fx family="e10">
      <Masked>
        <span className="t-fx__tint t-fx__glow" style={{ "--gx": `${x}%` } as CSSProperties} />
        <Layer aspect={p.aspect} stretch>
          <g className="t-fx__shimmer">
            {[x - 22, x - 8, x + 8, x + 22].map((cx, i) => (
              <path key={i} d={`M${cx} 100 C${cx - 5} 86 ${cx + 5} 74 ${cx} 60 S${cx - 5} 40 ${cx} 28`} style={{ animationDelay: `${i * 240}ms` }} />
            ))}
          </g>
        </Layer>
      </Masked>
      <Badge p={p}>
        <g className="t-fx__fan">
          <path d="M50 50 C41 33 46 18 57 17 C61 30 58 41 50 50 Z" />
          <path d="M50 50 C67 41 82 46 83 57 C70 61 59 58 50 50 Z" />
          <path d="M50 50 C59 67 54 82 43 83 C39 70 42 59 50 50 Z" />
          <path d="M50 50 C33 59 18 54 17 43 C30 39 41 42 50 50 Z" />
        </g>
        <circle className="t-fx__hub" cx="50" cy="50" r="5" />
      </Badge>
    </Fx>
  );
}
