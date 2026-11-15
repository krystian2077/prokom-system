import { IconStage } from "./parts";
import type { EffectProps } from "./types";

function Glyph({ variant }: { variant?: string }) {
  switch (variant) {
    case "phone":
      return <rect className="t-fx__line t-fx__fill-ink" x="34" y="18" width="32" height="56" rx="7" />;
    case "card":
      return <path className="t-fx__line t-fx__fill-ink" d="M36 20 L58 20 L66 28 L66 74 L36 74 Z M44 26 L44 34 M50 26 L50 34 M56 26 L56 34" />;
    case "files":
      return <path className="t-fx__line t-fx__fill-ink" d="M20 30 L40 30 L46 36 L80 36 L80 74 L20 74 Z" />;
    default:
      return (
        <g>
          <rect className="t-fx__line t-fx__fill-ink" x="24" y="22" width="52" height="52" rx="8" />
          <circle className="t-fx__line" cx="50" cy="44" r="13" />
          <path className="t-fx__line" d="M50 44 L62 62" />
        </g>
      );
  }
}

/** E13 Dane: a disc spins and stops; files float away from the source and come back. */
export default function E13Data({ variant }: EffectProps) {
  if (variant === "disc") {
    return (
      <IconStage family="e13" size={70}>
        <g className="t-fx__disc">
          <circle className="t-fx__line t-fx__fill-ink" cx="50" cy="50" r="32" />
          <circle className="t-fx__line" cx="50" cy="50" r="8" />
          <path className="t-fx__shine" d="M50 18 A32 32 0 0 1 80 40" />
        </g>
        <path className="t-fx__x" d="M70 70 L86 86 M86 70 L70 86" />
      </IconStage>
    );
  }
  return (
    <IconStage family="e13" size={70}>
      <Glyph variant={variant} />
      <g className="t-fx__files">
        <path d="M70 14 L80 14 L84 18 L84 30 L70 30 Z" />
        <path d="M80 44 L90 44 L94 48 L94 60 L80 60 Z" />
        <path d="M8 12 L18 12 L22 16 L22 28 L8 28 Z" />
      </g>
    </IconStage>
  );
}
