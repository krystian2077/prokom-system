import { Badge, Fx, Tint } from "./parts";
import type { EffectProps } from "./types";

/** E2 Bateria: a warm swelling glow under the cover; the badge's level drains from green to red. */
export default function E2Battery(p: EffectProps) {
  return (
    <Fx family="e2">
      <Tint className="t-fx__swell" />
      <Badge p={p}>
        <rect className="t-fx__stroke" x="20" y="33" width="54" height="34" rx="9" />
        <rect className="t-fx__solid" x="76" y="43" width="6" height="14" rx="2.5" />
        <rect className="t-fx__lvl t-fx__lvl--ok" x="26" y="39" width="42" height="22" rx="4" />
        <rect className="t-fx__lvl t-fx__lvl--low" x="26" y="39" width="9" height="22" rx="3" />
        <path className="t-fx__warn" d="M51 42 L51 52 M51 58 L51 58.5" />
      </Badge>
    </Fx>
  );
}
