import { Badge, Fx } from "./parts";
import type { EffectProps } from "./types";

function Source({ variant }: { variant?: string }) {
  switch (variant) {
    case "phone":
      return (
        <g>
          <rect className="t-fx__stroke" x="37" y="24" width="26" height="48" rx="6" />
          <path className="t-fx__stroke" d="M46 30 L54 30" />
        </g>
      );
    case "card":
      return <path className="t-fx__stroke" d="M38 26 L56 26 L64 34 L64 72 L38 72 Z M45 31 L45 38 M51 31 L51 38 M57 34 L57 38" />;
    case "files":
      return <path className="t-fx__stroke" d="M26 36 L42 36 L47 41 L74 41 L74 70 L26 70 Z" />;
    default:
      return (
        <g>
          <rect className="t-fx__stroke" x="28" y="26" width="44" height="46" rx="7" />
          <circle className="t-fx__stroke" cx="50" cy="45" r="11" />
          <path className="t-fx__stroke" d="M50 45 L60 60" />
        </g>
      );
  }
}

/** E13 Dane: the disc spins, slows and stops; files float away from the source and come back (recovery). */
export default function E13Data(p: EffectProps) {
  if (p.variant === "disc") {
    return (
      <Fx family="e13">
        <Badge p={p}>
          <g className="t-fx__disc">
            <circle className="t-fx__discface" cx="50" cy="50" r="30" />
            <circle className="t-fx__stroke" cx="50" cy="50" r="30" />
            <circle className="t-fx__stroke" cx="50" cy="50" r="7" />
            <path className="t-fx__shine" d="M50 24 A26 26 0 0 1 74 40" />
          </g>
          <path className="t-fx__x" d="M70 70 L84 84 M84 70 L70 84" />
        </Badge>
      </Fx>
    );
  }
  return (
    <Fx family="e13">
      <Badge p={p}>
        <Source variant={p.variant} />
        <g className="t-fx__files">
          <path d="M70 14 L79 14 L83 18 L83 29 L70 29 Z" />
          <path d="M80 46 L89 46 L93 50 L93 61 L80 61 Z" />
          <path d="M9 16 L18 16 L22 20 L22 31 L9 31 Z" />
        </g>
      </Badge>
    </Fx>
  );
}
