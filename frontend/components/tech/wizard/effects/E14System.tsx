import { Badge, Fx, Tint } from "./parts";
import type { EffectProps } from "./types";

/** E14 System i błędy: an error window pops and shakes, bugs crawl; "panel": a blinking error code; "question": a "?". */
export default function E14System(p: EffectProps) {
  if (p.variant === "question") {
    return (
      <Fx family="e14">
        <Badge p={{ ...p, at: null }}>
          <path className="t-fx__q" d="M38 39 C38 25 62 25 62 39 C62 50 50 50 50 60 M50 71 L50 71.5" />
        </Badge>
      </Fx>
    );
  }
  if (p.variant === "panel") {
    return (
      <Fx family="e14" className="is-panel">
        <Tint className="t-fx__led" />
        <Badge p={p}>
          <rect className="t-fx__err" x="24" y="30" width="52" height="40" rx="9" />
          <text className="t-fx__code" x="50" y="58" textAnchor="middle">
            E3
          </text>
        </Badge>
      </Fx>
    );
  }
  return (
    <Fx family="e14">
      <Badge p={{ ...p, at: null }} wide>
        <g className="t-fx__win">
          <rect className="t-fx__winbg" x="34" y="16" width="92" height="68" rx="9" />
          <path className="t-fx__winbar" d="M34 31 L126 31" />
          <circle cx="43" cy="23.5" r="2.4" className="t-fx__dot" />
          <circle cx="51" cy="23.5" r="2.4" className="t-fx__dot" />
          <circle className="t-fx__errbg" cx="80" cy="56" r="13" />
          <path className="t-fx__errx" d="M74.5 50.5 L85.5 61.5 M85.5 50.5 L74.5 61.5" />
        </g>
        <g className="t-fx__bugs">
          <ellipse cx="22" cy="80" rx="5" ry="3.6" />
          <ellipse cx="140" cy="18" rx="5" ry="3.6" />
        </g>
      </Badge>
    </Fx>
  );
}
