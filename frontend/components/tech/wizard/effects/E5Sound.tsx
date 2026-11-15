import { IconStage } from "./parts";
import type { EffectProps } from "./types";

/** E5 Dźwięk: sound waves break up, then the speaker is crossed out. */
export default function E5Sound(_props: EffectProps) {
  return (
    <IconStage family="e5">
      <path className="t-fx__line t-fx__fill-ink" d="M18 40 L32 40 L48 26 L48 74 L32 60 L18 60 Z" />
      <g className="t-fx__waves">
        <path d="M58 40 Q64 50 58 60" />
        <path d="M66 32 Q76 50 66 68" />
        <path d="M74 24 Q88 50 74 76" />
      </g>
      <path className="t-fx__x" d="M60 36 L84 64 M84 36 L60 64" />
    </IconStage>
  );
}
