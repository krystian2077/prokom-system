import type { PointKey } from "@/config/prokom";
import { towns } from "@/lib/tech/towns";

const PIN: Record<PointKey, { x: number; y: number }> = {
  rabka: { x: 289, y: 107 },
  zakopane: { x: 289, y: 451 },
};
/** Dashed links from a pin to the centre of each town dot (9 px dot at the town's x, centred on y). */
const DOT = 4.5;
function linksFor(key: PointKey) {
  const from = PIN[key];
  return towns
    .filter((t) => t.point === key && t.name !== POINT_TOWN[key])
    .map((t) => `M${from.x} ${from.y} ${Math.round((t.map.x / 100) * 640 + DOT)} ${Math.round((t.map.y / 100) * 560)}`)
    .join("");
}
const POINT_TOWN: Record<PointKey, string> = { rabka: "Rabka-Zdrój", zakopane: "Zakopane" };

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
              <ellipse cx={PIN[k].x} cy={PIN[k].y} rx="90" ry="60" />
              <ellipse cx={PIN[k].x} cy={PIN[k].y} rx="170" ry="110" />
              <ellipse cx={PIN[k].x} cy={PIN[k].y} rx="260" ry="168" />
            </g>
          ))}
        </g>
        <path d="M0 560 L0 520 L70 498 L130 512 L200 486 L262 506 L320 478 L384 500 L450 474 L520 498 L590 482 L640 496 L640 560 Z" fill="#2B2220" />
        <path d="M289 107 C309 159 319 199 339 251 C349 309 334 369 289 451" fill="none" stroke="#5A4A47" strokeWidth="5" strokeLinecap="round" />
        <g className="t-podhale__dash" fill="none" stroke="#8C7B78" strokeWidth="1.4" strokeDasharray="4 6">
          {keys.map((k) => (
            <path key={k} d={linksFor(k)} />
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
