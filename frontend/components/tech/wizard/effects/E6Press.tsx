import { FillStage } from "./parts";
import type { EffectProps } from "./types";

/** E6 Przyciski i obudowa: a press ripple with no response, a scratch on the edge. */
export default function E6Press({ at }: EffectProps) {
  const [x, y] = at ?? [50, 50];
  return (
    <FillStage family="e6">
      <ellipse className="t-fx__ripple" cx={x} cy={y} rx="40" ry="18" />
      <ellipse className="t-fx__ripple t-fx__ripple--2" cx={x} cy={y} rx="40" ry="18" />
      <path className="t-fx__scratch" d={`M${x - 30} ${y + 34} L${x + 18} ${y - 22}`} pathLength={1} />
      <ellipse className="t-fx__press" cx={x} cy={y} rx="24" ry="9" />
    </FillStage>
  );
}
