import { Badge, Fx, Layer, Masked } from "./parts";
import type { EffectProps } from "./types";

/** E16 Łączność i porty: Wi-Fi arcs go out one by one; port — sparks at the socket. */
export default function E16Connect(p: EffectProps) {
  if (p.variant === "port") {
    const W = 100 * p.aspect;
    const [ax, y] = p.at ?? [50, 50];
    const x = (ax / 100) * W;
    const r = Math.min(W, 100) * 0.42;
    const o = { transformOrigin: `${x}px ${y}px` };
    return (
      <Fx family="e16" className="is-port">
        <Masked>
          <Layer aspect={p.aspect}>
            <circle className="t-fx__flash" cx={x} cy={y} r={r * 0.9} style={o} />
            <g className="t-fx__sparks" style={o}>
              {[0, 60, 120, 180, 240, 300].map((a) => (
                <path key={a} d={`M${x + Math.cos((a * Math.PI) / 180) * r * 0.25} ${y + Math.sin((a * Math.PI) / 180) * r * 0.25} L${x + Math.cos((a * Math.PI) / 180) * r * 0.7} ${y + Math.sin((a * Math.PI) / 180) * r * 0.7}`} />
              ))}
            </g>
            <circle className="t-fx__core" cx={x} cy={y} r={r * 0.12} />
          </Layer>
        </Masked>
      </Fx>
    );
  }
  return (
    <Fx family="e16">
      <Badge p={{ ...p, at: null }}>
        <g className="t-fx__arcs">
          <path d="M18 45 Q50 16 82 45" />
          <path d="M29 57 Q50 38 71 57" />
          <path d="M40 69 Q50 61 60 69" />
        </g>
        <circle className="t-fx__solid" cx="50" cy="79" r="4.5" />
        <path className="t-fx__x" d="M66 66 L82 82 M82 66 L66 82" />
      </Badge>
    </Fx>
  );
}
