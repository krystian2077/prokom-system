import { IconStage } from "./parts";
import type { EffectProps } from "./types";

/** E14 System i błędy: an error window pops (panel: error dot), bugs crawl, or a "?". */
export default function E14System({ variant }: EffectProps) {
  if (variant === "question") {
    return (
      <IconStage family="e14" size={62}>
        <circle className="t-fx__line" cx="50" cy="50" r="32" />
        <path className="t-fx__q" d="M38 40 C38 26 62 26 62 40 C62 50 50 50 50 60 M50 70 L50 71" />
      </IconStage>
    );
  }
  return (
    <IconStage family="e14" size={variant === "panel" ? 80 : 66}>
      <g className="t-fx__win">
        <rect className="t-fx__line t-fx__fill-ink" x="14" y="22" width="72" height="56" rx="6" />
        <path className="t-fx__line" d="M14 34 L86 34" />
        <circle className="t-fx__err" cx="50" cy="56" r="11" />
        <path className="t-fx__errx" d="M45 51 L55 61 M55 51 L45 61" />
      </g>
      {variant === "panel" ? null : (
        <g className="t-fx__bugs">
          <ellipse cx="22" cy="86" rx="5" ry="3.4" />
          <ellipse cx="80" cy="14" rx="5" ry="3.4" />
        </g>
      )}
    </IconStage>
  );
}
