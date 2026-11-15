import { Badge, Fx, Tint } from "./parts";
import type { EffectProps } from "./types";

/**
 * E8 Zasilanie: the screen goes dark (variant "body": only a light veil over a device body),
 * the power symbol tries to start three times — lights up, fades — and stays off.
 */
export default function E8Power(p: EffectProps) {
  return (
    <Fx family="e8" className={p.variant === "body" ? "is-body" : "is-screen"}>
      <Tint className="t-fx__dark" />
      <Badge p={p}>
        <circle className="t-fx__try" cx="50" cy="50" r="38" />
        <g className="t-fx__power">
          <path d="M35 31 A26 26 0 1 0 65 31" />
          <path d="M50 20 L50 49" />
        </g>
      </Badge>
    </Fx>
  );
}
