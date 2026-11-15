import { FillStage, IconStage } from "./parts";
import type { EffectProps } from "./types";

/** E4 Optyka: the lens focus "breathes" and blurs; scanner variant — a light bar stutters. */
export default function E4Optics({ variant }: EffectProps) {
  if (variant === "scan") {
    return (
      <FillStage family="e4" className="is-scan">
        <rect className="t-fx__scanbar" x="8" y="0" width="7" height="100" />
        <g className="t-fx__scanlines">
          <rect x="0" y="30" width="100" height="1.6" />
          <rect x="0" y="62" width="100" height="1.6" />
        </g>
      </FillStage>
    );
  }
  return (
    <IconStage family="e4" size={70}>
      <circle className="t-fx__line" cx="50" cy="50" r="30" />
      <circle className="t-fx__iris" cx="50" cy="50" r="16" />
      <circle className="t-fx__blur" cx="50" cy="50" r="24" />
      <g className="t-fx__brackets">
        <path d="M14 30 L14 14 L30 14" />
        <path d="M70 14 L86 14 L86 30" />
        <path d="M86 70 L86 86 L70 86" />
        <path d="M30 86 L14 86 L14 70" />
      </g>
    </IconStage>
  );
}
