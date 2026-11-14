import { FillStage } from "./parts";
import { seeded, type EffectProps } from "./types";

/** E1 Pęknięcie: cracks draw out from the impact point, a glint runs over the shards. */
export default function E1Crack({ at, aspect }: EffectProps) {
  const [cx, cy] = at ?? [58, 42];
  const rnd = seeded(Math.round(cx * 31 + cy * 17));
  const k = 1 / Math.max(0.35, aspect); // y units per x unit, so rays look even on tall regions
  const rays = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2 + rnd() * 0.5;
    let x = cx;
    let y = cy;
    const pts = [`${x.toFixed(1)},${y.toFixed(1)}`];
    const len = 22 + rnd() * 34;
    for (let s = 1; s <= 4; s++) {
      const aa = a + (rnd() - 0.5) * 0.6;
      x += (Math.cos(aa) * len) / 4;
      y += ((Math.sin(aa) * len) / 4) * Math.min(k, 1.6);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(" ");
  });
  const ring = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2;
    const r = 6 + rnd() * 3;
    return `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r * Math.min(k, 1.6)).toFixed(1)}`;
  }).join(" ");
  return (
    <FillStage family="e1">
      <defs>
        <linearGradient id="t-fx-glint" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.4" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect className="t-fx__frost" x="0" y="0" width="100" height="100" />
      <g className="t-fx__cracks">
        {rays.map((p, i) => (
          <polyline key={i} points={p} pathLength={1} style={{ animationDelay: `${i * 40}ms` }} />
        ))}
        <polygon points={ring} pathLength={1} />
      </g>
      <circle className="t-fx__impact" cx={cx} cy={cy} r="2.2" />
      <rect className="t-fx__glint" x="-100" y="0" width="100" height="100" fill="url(#t-fx-glint)" />
    </FillStage>
  );
}
