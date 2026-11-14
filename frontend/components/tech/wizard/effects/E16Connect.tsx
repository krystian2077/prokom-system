import { IconStage } from "./parts";
import type { EffectProps } from "./types";

/** E16 Łączność i porty: Wi-Fi arcs fade one by one; port — sparks at the socket. */
export default function E16Connect({ variant }: EffectProps) {
  if (variant === "port") {
    return (
      <svg className="t-fx t-fx--e16 is-port" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
        <g className="t-fx__sparks">
          <path d="M50 42 L50 18" />
          <path d="M57 46 L78 34" />
          <path d="M57 54 L78 66" />
          <path d="M43 54 L22 66" />
          <path d="M43 46 L22 34" />
          <path d="M50 58 L50 82" />
        </g>
        <circle className="t-fx__core" cx="50" cy="50" r="6" />
      </svg>
    );
  }
  return (
    <IconStage family="e16" size={46}>
      <g className="t-fx__arcs">
        <path d="M14 42 Q50 10 86 42" />
        <path d="M26 56 Q50 34 74 56" />
        <path d="M38 70 Q50 60 62 70" />
      </g>
      <circle className="t-fx__dot" cx="50" cy="82" r="5" />
      <path className="t-fx__x" d="M64 64 L84 84 M84 64 L64 84" />
    </IconStage>
  );
}
