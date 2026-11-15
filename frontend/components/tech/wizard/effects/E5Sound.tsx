import { Badge, Fx } from "./parts";
import type { EffectProps } from "./types";

/** E5 Dźwięk: sound waves leave the speaker, break up and fade; then it is crossed out. */
export default function E5Sound(p: EffectProps) {
  return (
    <Fx family="e5">
      <Badge p={p}>
        <path className="t-fx__solid" d="M18 41 L31 41 L46 28 L46 72 L31 59 L18 59 Z" />
        <g className="t-fx__waves">
          <path d="M57 41 Q62 50 57 59" />
          <path d="M65 33 Q74 50 65 67" />
          <path d="M73 25 Q86 50 73 75" />
        </g>
        <path className="t-fx__x" d="M60 38 L82 62 M82 38 L60 62" />
      </Badge>
    </Fx>
  );
}
