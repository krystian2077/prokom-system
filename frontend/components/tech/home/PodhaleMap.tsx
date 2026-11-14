import type { PointKey } from "@/config/prokom";
import { towns } from "@/lib/tech/towns";

const PIN: Record<PointKey, { x: number; y: number }> = {
  rabka: { x: 289, y: 107 },
  zakopane: { x: 289, y: 451 },
};
const LINES: Record<PointKey, string> = {
  rabka: "M300 118 130 58M300 118 500 88M300 118 180 168M300 118 150 310M300 118 350 262",
  zakopane: "M300 462 190 466M300 462 380 418M300 462 500 408M300 462 340 378M300 462 360 322",
};

/**
 * Illustrative map of Podhale (design T.Main PodhaleMap) — not geographic data.
 * Pins only for the points that may be shown; towns of a hidden point stay as plain dots.
 */
export function PodhaleMap({ points }: { points: { key: PointKey; name: string; draft: boolean }[] }) {
  const keys = points.map((p) => p.key);
  const pinTowns = new Set(points.map((p) => p.name));
  const label = `Mapa poglądowa Podhala z ${points.length > 1 ? "punktami" : "punktem"} PRO-KOM Tech (${points.map((p) => p.name).join(", ")}) i okolicznymi miejscowościami`;
  return (
    <div className="t-podhale" role="img" aria-label={label}>
      <svg className="t-podhale__svg" viewBox="0 0 640 560" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
        <g fill="none" stroke="#E2483A" strokeWidth="1" opacity="0.14">
          {keys.map((k) => (
            <g key={k}>
              <ellipse cx="300" cy={PIN[k].y + 11} rx="90" ry="60" />
              <ellipse cx="300" cy={PIN[k].y + 11} rx="170" ry="110" />
              <ellipse cx="300" cy={PIN[k].y + 11} rx="260" ry="168" />
            </g>
          ))}
        </g>
        <path d="M0 560 L0 520 L70 498 L130 512 L200 486 L262 506 L320 478 L384 500 L450 474 L520 498 L590 482 L640 496 L640 560 Z" fill="#2B2220" />
        <path d="M300 118 C320 170 330 210 350 262 C360 320 345 380 300 462" fill="none" stroke="#5A4A47" strokeWidth="5" strokeLinecap="round" />
        <g className="t-podhale__dash" fill="none" stroke="#8C7B78" strokeWidth="1.4" strokeDasharray="4 6">
          {keys.map((k) => (
            <path key={k} d={LINES[k]} />
          ))}
        </g>
      </svg>
      <span className="t-podhale__cap t-podhale__cap--tl">Podhale · mapa poglądowa</span>
      <span className="t-podhale__cap t-podhale__cap--br">Tatry</span>
      {towns
        .filter((t) => !pinTowns.has(t.name))
        .map((t) => (
          <span key={t.slug} className={`t-podhale__town${t.map.flip ? " is-flip" : ""}`} style={{ left: `${t.map.x}%`, top: `${t.map.y}%` }}>
            <i />
            {t.name}
          </span>
        ))}
      {points.map((p) => (
        <span key={p.key} className={`t-podhale__pin${p.draft ? " t-draft" : ""}`} style={{ left: `${(PIN[p.key].x / 640) * 100}%`, top: `${(PIN[p.key].y / 560) * 100}%` }}>
          <i />
          <b>{p.name}</b>
        </span>
      ))}
    </div>
  );
}
