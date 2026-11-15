import { Badge, Fx, Tint } from "./parts";
import type { EffectProps } from "./types";

/** E11 Wydajność: the needle crawls up and falls back, the progress bar stalls; "upgrade" — both climb to green. */
export default function E11Perf(p: EffectProps) {
  const up = p.variant === "upgrade" ? " is-up" : "";
  return (
    <Fx family="e11" className={up}>
      <Tint className="t-fx__veil" />
      <Badge p={{ ...p, at: null }}>
        <path className="t-fx__track" d="M20 60 A30 30 0 0 1 80 60" />
        <g className={`t-fx__needle${up}`}>
          <path d="M50 60 L50 35" />
          <circle cx="50" cy="60" r="4.5" />
        </g>
        <rect className="t-fx__bartrack" x="24" y="72" width="52" height="6" rx="3" />
        <rect className={`t-fx__bar${up}`} x="24" y="72" width="52" height="6" rx="3" />
      </Badge>
    </Fx>
  );
}
