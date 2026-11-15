import type { PointKey } from "@/config/prokom";

/** Pin positions in % of the art box (illustrative, not geographic: Rabka north, Zakopane under the Tatras). */
const PIN: Record<PointKey, { x: number; y: number }> = {
  rabka: { x: 30, y: 26 },
  zakopane: { x: 62, y: 58 },
};

type Props = {
  /** Founding year from claims (null = hidden claim → no outline number). */
  year: string | null;
  yearDraft?: boolean;
  points: { key: PointKey; city: string; draft: boolean }[];
};

/**
 * Hero scene of /o-firmie: outline founding year behind layered Tatra ridges, the published
 * salons as pins joined by a route that draws in. Decorative (the H1 and the lead carry the
 * facts), so the whole art is aria-hidden. Pure SVG + CSS, final frame with reduced motion.
 */
export function AboutHeroArt({ year, yearDraft = false, points }: Props) {
  const pins = points.filter((p) => PIN[p.key]);
  const [a, b] = pins;
  const route =
    a && b
      ? `M${PIN[a.key].x * 5.6} ${PIN[a.key].y * 4.4} C ${PIN[a.key].x * 5.6 + 150} ${PIN[a.key].y * 4.4 + 10}, ${PIN[b.key].x * 5.6 - 150} ${PIN[b.key].y * 4.4 - 40}, ${PIN[b.key].x * 5.6} ${PIN[b.key].y * 4.4}`
      : null;
  return (
    <div className="t-ab-art" aria-hidden="true">
      <svg className="t-ab-art__svg" viewBox="0 0 560 440" preserveAspectRatio="xMidYMid meet" focusable="false">
        <defs>
          <linearGradient id="t-ab-yr" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f29185" stopOpacity="0.85" />
            <stop offset="0.55" stopColor="#e2483a" stopOpacity="0.5" />
            <stop offset="1" stopColor="#e2483a" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="t-ab-r1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3a2c2a" />
            <stop offset="1" stopColor="#1f1716" />
          </linearGradient>
          <linearGradient id="t-ab-r2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2b201f" />
            <stop offset="1" stopColor="#150f0e" />
          </linearGradient>
          <linearGradient id="t-ab-r3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1c1413" />
            <stop offset="1" stopColor="#100b0a" />
          </linearGradient>
          <radialGradient id="t-ab-sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#e2483a" stopOpacity="0.55" />
            <stop offset="1" stopColor="#e2483a" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle className="t-ab-art__sun" cx="380" cy="250" r="190" fill="url(#t-ab-sun)" />
        <g className="t-ab-art__orbits" fill="none" stroke="#ffffff" strokeOpacity="0.07">
          <ellipse cx="300" cy="250" rx="140" ry="92" />
          <ellipse cx="300" cy="250" rx="230" ry="150" />
          <ellipse cx="300" cy="250" rx="320" ry="210" />
        </g>

        {year ? (
          <text className={`t-ab-art__year${yearDraft ? " t-draft" : ""}`} x="552" y="296" textAnchor="end" fill="none" stroke="url(#t-ab-yr)" strokeWidth="1.6">
            {year}
          </text>
        ) : null}

        {/* back ridge: Tatra peaks with a light rim */}
        <path
          className="t-ab-art__ridge t-ab-art__ridge--1"
          d="M0 352 L48 322 L86 336 L132 290 L168 312 L212 262 L246 286 L284 236 L318 270 L352 246 L392 284 L430 252 L470 290 L512 268 L560 300 L560 440 L0 440 Z"
          fill="url(#t-ab-r1)"
        />
        <path
          className="t-ab-art__rim"
          d="M132 290 L168 312 L212 262 L246 286 L284 236 L318 270 L352 246 L392 284 L430 252"
          fill="none"
          stroke="#f29185"
          strokeOpacity="0.38"
          strokeWidth="1.2"
          strokeLinejoin="round"
          pathLength={1}
        />
        <path
          className="t-ab-art__ridge t-ab-art__ridge--2"
          d="M0 382 L60 350 L118 370 L176 334 L236 362 L300 326 L356 358 L420 330 L486 362 L560 340 L560 440 L0 440 Z"
          fill="url(#t-ab-r2)"
        />
        <path
          className="t-ab-art__ridge t-ab-art__ridge--3"
          d="M0 410 C 90 384, 170 404, 250 392 S 420 378, 560 398 L560 440 L0 440 Z"
          fill="url(#t-ab-r3)"
        />

        {route ? <path className="t-ab-art__route" d={route} fill="none" stroke="#f29185" strokeWidth="1.6" strokeDasharray="5 7" strokeLinecap="round" /> : null}
        {route ? <path className="t-ab-art__trace" d={route} fill="none" stroke="#f0584a" strokeWidth="2.2" strokeLinecap="round" pathLength={1} /> : null}
      </svg>

      {pins.map((p, i) => (
        <span
          key={p.key}
          className={`t-ab-art__pin${p.draft ? " t-draft" : ""}`}
          style={{ left: `${PIN[p.key].x}%`, top: `${PIN[p.key].y}%`, ["--i" as string]: i }}
        >
          <i className="t-ab-art__dot" />
          <span className="t-ab-art__chip">{p.city}</span>
        </span>
      ))}
    </div>
  );
}
