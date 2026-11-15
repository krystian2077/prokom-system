import { Fx, Layer, Masked } from "./parts";
import type { EffectProps } from "./types";

const COLS = 6;
const ROWS = 3;

/** E12 Klawiatura: keys light up and press unevenly; one stays down (red). */
export default function E12Keys({ aspect }: EffectProps) {
  const W = 100 * aspect;
  const kw = W / COLS;
  const kh = 100 / ROWS;
  const keys = Array.from({ length: COLS * ROWS }, (_, i) => ({ i, x: (i % COLS) * kw, y: Math.floor(i / COLS) * kh }));
  return (
    <Fx family="e12">
      <Masked>
        <Layer aspect={aspect}>
          {keys.map((k) => (
            <rect
              key={k.i}
              className={`t-fx__key${k.i === 8 ? " is-stuck" : ""}`}
              x={k.x + kw * 0.1}
              y={k.y + kh * 0.12}
              width={kw * 0.8}
              height={kh * 0.76}
              rx={Math.min(kw, kh) * 0.16}
              style={{ animationDelay: `${(k.i * 113) % 1000}ms`, transformOrigin: `${k.x + kw / 2}px ${k.y + kh / 2}px` }}
            />
          ))}
        </Layer>
      </Masked>
    </Fx>
  );
}
