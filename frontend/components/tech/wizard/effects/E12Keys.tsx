import { FillStage } from "./parts";
import type { EffectProps } from "./types";

const KEYS = Array.from({ length: 18 }, (_, i) => ({ i, x: 4 + (i % 6) * 16, y: 8 + Math.floor(i / 6) * 30 }));

/** E12 Klawiatura: keys press unevenly, one sticks (red). */
export default function E12Keys(_props: EffectProps) {
  return (
    <FillStage family="e12">
      {KEYS.map((k) => (
        <rect
          key={k.i}
          className={`t-fx__key${k.i === 8 ? " is-stuck" : ""}`}
          x={k.x}
          y={k.y}
          width="13"
          height="24"
          rx="3"
          style={{ animationDelay: `${(k.i * 97) % 900}ms` }}
        />
      ))}
    </FillStage>
  );
}
