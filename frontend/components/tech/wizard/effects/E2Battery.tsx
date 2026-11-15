import { IconStage } from "./parts";
import type { EffectProps } from "./types";

/** E2 Bateria: the level drains to red, the outline swells. */
export default function E2Battery(_props: EffectProps) {
  return (
    <IconStage family="e2">
      <g className="t-fx__swell">
        <rect className="t-fx__line" x="18" y="30" width="58" height="40" rx="8" />
        <rect className="t-fx__line t-fx__fill-ink" x="78" y="42" width="6" height="16" rx="2" />
      </g>
      <rect className="t-fx__level" x="24" y="36" width="12" height="28" rx="3" />
      <path className="t-fx__warn" d="M52 40 L52 52 M52 58 L52 59" />
    </IconStage>
  );
}
