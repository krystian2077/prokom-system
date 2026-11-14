/**
 * Address map (SPEC §7): static schematic SVG in the OpenStreetMap style from the
 * design (T.Mapa) — no Google iframe, no external requests. Colours follow the theme;
 * `dark` forces the dark palette (footer).
 */
type Props = {
  sub: string;
  label?: boolean;
  height?: number;
  radius?: number;
  dark?: boolean;
  className?: string;
};

const ROADS = "M120 -20 L172 520 M640 -20 C620 200 660 330 610 520 M-20 420 C200 400 500 442 820 430 M252 212 L302 58 M470 232 C520 300 560 332 642 332 M402 118 L622 98";

export function OsmMap({ sub, label = true, height = 420, radius = 24, dark = false, className }: Props) {
  return (
    <div
      role="img"
      aria-label={`Mapa: PRO-KOM Tech, ${sub}`}
      className={`t-map${dark ? " t-map--dark" : ""}${className ? ` ${className}` : ""}`}
      style={{ height, borderRadius: radius }}
    >
      <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className="t-map__svg">
        <rect className="m-land" x="0" y="0" width="800" height="500" />
        <path className="m-park" d="M520 30 C610 20 700 60 730 125 C750 175 705 215 640 210 C575 205 535 170 515 115 Z" />
        <path className="m-park" d="M70 360 C125 335 190 355 205 410 C212 452 155 476 102 460 C58 446 44 388 70 360 Z" />
        <path className="m-water" d="M-20 305 C120 272 205 335 322 322 C442 310 474 382 602 392 C702 400 762 362 820 372" />
        <g className="m-building">
          <rect x="190" y="70" width="46" height="34" rx="4" /><rect x="246" y="96" width="30" height="40" rx="4" /><rect x="200" y="122" width="38" height="28" rx="4" />
          <rect x="430" y="70" width="52" height="30" rx="4" /><rect x="492" y="132" width="40" height="36" rx="4" /><rect x="430" y="118" width="44" height="40" rx="4" />
          <rect x="300" y="250" width="56" height="40" rx="4" /><rect x="430" y="262" width="38" height="30" rx="4" /><rect x="478" y="250" width="44" height="34" rx="4" />
          <rect x="250" y="440" width="60" height="36" rx="4" /><rect x="460" y="452" width="52" height="30" rx="4" /><rect x="660" y="250" width="48" height="40" rx="4" />
          <rect x="40" y="150" width="48" height="36" rx="4" /><rect x="560" y="440" width="46" height="34" rx="4" /><rect x="700" y="440" width="54" height="36" rx="4" />
        </g>
        <g className="m-roads">
          <path className="m-casing" d={ROADS} strokeWidth="14" />
          <path className="m-street" d={ROADS} strokeWidth="10" />
          <path className="m-casing" d="M400 -20 C394 120 410 300 390 520" strokeWidth="19" />
          <path className="m-street" d="M400 -20 C394 120 410 300 390 520" strokeWidth="14" />
          <path className="m-casing" d="M-20 214 C200 200 420 244 820 222" strokeWidth="25" />
          <path className="m-main" d="M-20 214 C200 200 420 244 820 222" strokeWidth="19" />
        </g>
      </svg>
      <span className="t-map__halo" aria-hidden="true" />
      <span className="t-map__ring" aria-hidden="true" />
      <span className="t-map__pin" aria-hidden="true">
        <span />
      </span>
      {label ? (
        <span className="t-map__label">
          <b>PRO-KOM Tech</b>
          <span>{sub}</span>
        </span>
      ) : null}
      {/* No "© OpenStreetMap" from the design: this is a drawing, not OSM data. Add it with real tiles. */}
    </div>
  );
}
