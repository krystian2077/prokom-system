import type { CSSProperties } from "react";
import { Fx, Layer, Masked } from "./parts";
import { seeded, type EffectProps } from "./types";

type P = [number, number];
const f1 = (n: number) => Math.round(n * 100) / 100;
const pts = (a: P[]) => a.map(([x, y]) => `${f1(x)},${f1(y)}`).join(" ");
const d = (ms: number) => ({ "--d": `${Math.round(ms)}ms` }) as CSSProperties;

/** Point at distance `t` along a polyline (clamped to its end). */
function along(line: P[], t: number): P {
  let left = t;
  for (let i = 1; i < line.length; i++) {
    const [x0, y0] = line[i - 1];
    const [x1, y1] = line[i];
    const seg = Math.hypot(x1 - x0, y1 - y0);
    if (left <= seg) return [x0 + ((x1 - x0) * left) / seg, y0 + ((y1 - y0) * left) / seg];
    left -= seg;
  }
  return line[line.length - 1];
}

/**
 * The broken glass, generated once from the impact point (deterministic): radial cracks
 * that taper (3 segments of falling width), branches, a spider web of bowed chords, faceted
 * shards, a crushed impact zone with splinters. Everything draws out from the impact with
 * `stroke-dashoffset`; then a glint runs along the crack edges (mask) — the light catching
 * the broken glass. Clipped to the screen by the region mask.
 */
export function crackGeometry(at: [number, number], aspect: number) {
  const W = 100 * aspect;
  const H = 100;
  const c: P = [(at[0] / 100) * W, (at[1] / 100) * H];
  const rnd = seeded(Math.round(at[0] * 131 + at[1] * 71 + aspect * 977));
  const R = Math.max(...[[0, 0], [W, 0], [0, H], [W, H]].map(([x, y]) => Math.hypot(x - c[0], y - c[1])));
  const N = 11;
  const rays = Array.from({ length: N }, (_, i) => {
    const a0 = (i / N) * Math.PI * 2 + (rnd() - 0.5) * 0.42;
    const len = R * (0.42 + rnd() * 0.66);
    const line: P[] = [c];
    let a = a0;
    let [x, y] = c;
    const steps = 7;
    for (let s = 1; s <= steps; s++) {
      a += (rnd() - 0.5) * 0.34;
      x += (Math.cos(a) * len) / steps;
      y += (Math.sin(a) * len) / steps;
      line.push([x, y]);
    }
    return { line, len, a0 };
  });
  // tapered segments: 0–2, 2–4, 4–7
  const segs = rays.flatMap(({ line }, i) =>
    [
      [0, 3, 0.62],
      [2, 5, 0.42],
      [4, 7, 0.24],
    ].map(([a, b, w], k) => ({ p: pts(line.slice(a, b + 1)), w, delay: 40 + i * 22 + k * 120 })),
  );
  const branches = rays.flatMap(({ line, a0 }, i) => {
    if (rnd() < 0.35) return [];
    const from = line[2 + Math.floor(rnd() * 3)];
    const side = rnd() < 0.5 ? -1 : 1;
    let a = a0 + side * (0.45 + rnd() * 0.4);
    let [x, y] = from;
    const out: P[] = [from];
    const l = 5 + rnd() * 9;
    for (let s = 0; s < 3; s++) {
      a += (rnd() - 0.5) * 0.4;
      x += (Math.cos(a) * l) / 3;
      y += (Math.sin(a) * l) / 3;
      out.push([x, y]);
    }
    return [{ p: pts(out), delay: 330 + i * 22 }];
  });
  const rings = [
    { r: 4.2 + rnd() * 1.4, keep: 0.95, w: 0.32, delay: 360 },
    { r: 10 + rnd() * 3, keep: 0.75, w: 0.26, delay: 470 },
    { r: 19 + rnd() * 5, keep: 0.45, w: 0.2, delay: 580 },
  ];
  const chords: { p: string; w: number; delay: number }[] = [];
  const shards: { p: string; o: number; delay: number }[] = [];
  rings.forEach((g, k) => {
    for (let i = 0; i < N; i++) {
      const A = rays[i];
      const B = rays[(i + 1) % N];
      if (A.len < g.r || B.len < g.r || rnd() > g.keep) continue;
      const pa = along(A.line, g.r * (0.92 + rnd() * 0.16));
      const pb = along(B.line, g.r * (0.92 + rnd() * 0.16));
      const m: P = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2];
      const bow: P = [m[0] + (c[0] - m[0]) * 0.1, m[1] + (c[1] - m[1]) * 0.1];
      chords.push({ p: `M${f1(pa[0])},${f1(pa[1])} Q${f1(bow[0])},${f1(bow[1])} ${f1(pb[0])},${f1(pb[1])}`, w: g.w, delay: g.delay + i * 14 });
      // facet between this chord and the previous ring (or the impact)
      if (k < 2 && rnd() < 0.7) {
        const inner = k === 0 ? [c, c] : [along(A.line, rings[k - 1].r), along(B.line, rings[k - 1].r)];
        shards.push({ p: pts([inner[0], pa, pb, inner[1]]), o: 0.03 + rnd() * 0.11, delay: g.delay + 80 });
      }
    }
  });
  const splinters = Array.from({ length: 9 }, () => {
    const a = rnd() * Math.PI * 2;
    const r = 1.2 + rnd() * 3.2;
    const s = 0.35 + rnd() * 0.7;
    const [x, y] = [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r];
    const b = rnd() * Math.PI;
    return pts([
      [x + Math.cos(b) * s, y + Math.sin(b) * s],
      [x + Math.cos(b + 2.2) * s * 0.7, y + Math.sin(b + 2.2) * s * 0.7],
      [x + Math.cos(b + 4.1) * s * 0.9, y + Math.sin(b + 4.1) * s * 0.9],
    ]);
  });
  return { W, H, c, segs, branches, chords, shards, splinters };
}

export default function E1Crack({ at, aspect, nudge, uid = "e1" }: EffectProps) {
  // the impact sits just beside the hotspot (towards the device's centre), so the dot never hides it
  const [ax, ay] = at ?? [58, 40];
  const [nx, ny] = nudge ?? [-0.7, -0.7];
  const k = 9; // % of the region height
  const g = crackGeometry([ax + (nx * k) / aspect, ay + ny * k], aspect);
  const id = `t-fx-${uid}`;
  const cracks = (
    <>
      {g.segs.map((s, i) => (
        <polyline key={`s${i}`} className="t-fx__c" points={s.p} pathLength={1} strokeWidth={s.w} style={d(s.delay)} />
      ))}
      {g.branches.map((s, i) => (
        <polyline key={`b${i}`} className="t-fx__c" points={s.p} pathLength={1} strokeWidth={0.2} style={d(s.delay)} />
      ))}
      {g.chords.map((s, i) => (
        <path key={`r${i}`} className="t-fx__c" d={s.p} pathLength={1} strokeWidth={s.w} style={d(s.delay)} />
      ))}
    </>
  );
  return (
    <Fx family="e1">
      <Masked>
        <Layer aspect={aspect}>
          <defs>
            <radialGradient id={`${id}-hit`}>
              <stop offset="0" stopColor="#fff" stopOpacity="0.75" />
              <stop offset="0.45" stopColor="#dfe8ff" stopOpacity="0.22" />
              <stop offset="1" stopColor="#dfe8ff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`${id}-glint`} x1="0" y1="0" x2="1" y2="0.35">
              <stop offset="0.38" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#fff" stopOpacity="1" />
              <stop offset="0.62" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width={g.W} height={g.H}>
              <g className="t-fx__maskc">{cracks}</g>
              {g.shards.map((s, i) => (
                <polygon key={i} points={s.p} fill="#fff" opacity={s.o * 3} />
              ))}
            </mask>
          </defs>
          <g className="t-fx__shards">
            {g.shards.map((s, i) => (
              <polygon key={i} points={s.p} opacity={s.o} style={d(s.delay)} />
            ))}
          </g>
          <g className="t-fx__shadow" transform="translate(0.22 0.32)">
            {cracks}
          </g>
          <g className="t-fx__cracks">{cracks}</g>
          <circle className="t-fx__hit" cx={g.c[0]} cy={g.c[1]} r="5.5" fill={`url(#${id}-hit)`} />
          <g className="t-fx__splinters">
            {g.splinters.map((p, i) => (
              <polygon key={i} points={p} style={d(120 + i * 30)} />
            ))}
          </g>
          <g mask={`url(#${id}-m)`}>
            <rect className="t-fx__glint" x={-g.W} y="0" width={g.W} height={g.H} fill={`url(#${id}-glint)`} style={{ "--gw": g.W } as CSSProperties} />
          </g>
          <rect className="t-fx__sheen" x={-g.W} y="0" width={g.W} height={g.H} fill={`url(#${id}-glint)`} style={{ "--gw": g.W } as CSSProperties} />
        </Layer>
      </Masked>
    </Fx>
  );
}
