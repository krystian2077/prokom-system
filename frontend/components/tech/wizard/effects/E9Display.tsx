import { Badge, Fx, Layer, Masked } from "./parts";
import type { EffectProps } from "./types";

/**
 * E9 Obraz: a broken panel — the picture flickers, thin colour bands tear sideways, a dead
 * pixel column stays lit. "nosignal": a glass card "Brak sygnału" over the device.
 */
export default function E9Display(p: EffectProps) {
  if (p.variant === "nosignal") {
    return (
      <Fx family="e9" className="is-nosignal">
        <Badge p={{ ...p, at: null }} wide>
          <rect className="t-fx__stroke" x="56" y="16" width="48" height="32" rx="5" />
          <path className="t-fx__stroke" d="M72 58 L88 58 M80 48 L80 58" />
          <path className="t-fx__nosig" d="M72 26 L88 38 M88 26 L72 38" />
          <text className="t-fx__text" x="80" y="82" textAnchor="middle">
            Brak sygnału
          </text>
        </Badge>
      </Fx>
    );
  }
  return (
    <Fx family="e9">
      <Masked>
        <span className="t-fx__tint t-fx__flicker" />
        <Layer aspect={p.aspect} stretch>
          <g className="t-fx__bands">
            <rect x="0" y="21" width="100" height="2.4" className="t-fx__b1" />
            <rect x="0" y="23.4" width="100" height="0.8" className="t-fx__b2" />
            <rect x="0" y="47" width="100" height="1.4" className="t-fx__b3" />
            <rect x="0" y="63" width="100" height="3.2" className="t-fx__b4" />
            <rect x="0" y="66.2" width="100" height="0.7" className="t-fx__b1" />
          </g>
          <rect className="t-fx__vline" x="71" y="0" width="0.7" height="100" />
        </Layer>
        <span className="t-fx__tint t-fx__scan" />
      </Masked>
    </Fx>
  );
}
