import { Materials } from "./materials";

/** Game console (upright, with a disc slot) and a controller (viewBox 600×560). Generic, no brand. */
export default function ConsoleArt({ uid }: { uid: string }) {
  const id = `${uid}cs`;
  return (
    <svg className="t-art" viewBox="0 0 600 560" aria-hidden="true" focusable="false">
      <Materials id={id} />
      {/* console: black core with white shells */}
      <rect x="92" y="30" width="176" height="486" rx="26" style={{ fill: "var(--dv-m4)" }} />
      <path d="M92 70 Q92 30 132 30 H170 V516 H118 Q92 516 92 490 Z" fill={`url(#${id}-whitex)`} />
      <path d="M268 70 Q268 30 228 30 H190 V516 H242 Q268 516 268 490 Z" fill={`url(#${id}-whitex)`} />
      <rect x="92" y="30" width="176" height="486" rx="26" fill="none" stroke="#000" strokeOpacity="0.12" strokeWidth="1.4" />
      <rect x="170" y="30" width="20" height="486" style={{ fill: "var(--dv-m4)" }} />
      <rect x="170" y="30" width="20" height="486" fill={`url(#${id}-vol)`} />
      {/* vents along the top */}
      {[46, 54, 62, 70, 78, 86].map((y) => (
        <rect key={y} x="173" y={y} width="14" height="3" rx="1.5" fill="#000" opacity="0.6" />
      ))}
      {/* disc slot, eject, power, USB */}
      <rect x="112" y="400" width="44" height="10" rx="5" fill="#000" opacity="0.18" />
      <rect x="116" y="403.5" width="36" height="3" rx="1.5" fill="#0a0a0c" />
      <rect x="114" y="378" width="12" height="3" rx="1.5" style={{ fill: "var(--dv-w3)" }} />
      <rect x="114" y="368" width="12" height="3" rx="1.5" style={{ fill: "var(--dv-w3)" }} />
      <rect x="176" y="420" width="8" height="12" rx="2" fill="#0a0a0c" />
      <rect x="176" y="440" width="8" height="12" rx="2" fill="#0a0a0c" />
      {/* stand */}
      <path d="M110 516 H250 L262 534 H98 Z" style={{ fill: "var(--dv-m2)" }} />
      <rect x="98" y="534" width="164" height="6" rx="3" style={{ fill: "var(--dv-m4)" }} />
      {/* controller */}
      <g>
        <path
          d="M352 396 Q380 380 420 384 L460 388 Q474 380 488 388 L528 384 Q568 380 590 410 Q604 440 592 500 Q584 544 556 544 Q536 544 520 516 L500 486 H420 L400 516 Q384 544 364 544 Q336 544 328 500 Q316 440 330 410 Q340 400 352 396 Z"
          fill={`url(#${id}-white)`}
        />
        <path d="M420 486 H500 L520 516 Q536 544 556 544 Q584 544 592 500 L580 470 Q548 470 520 456 H400 Q372 470 340 470 L328 500 Q336 544 364 544 Q384 544 400 516 Z" style={{ fill: "var(--dv-m4)" }} />
        <path d="M404 390 Q460 380 516 390 L512 446 H408 Z" style={{ fill: "var(--dv-w2)" }} />
        <path d="M410 392 L414 444 M510 392 L506 444" stroke="#3a7bd5" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
        <rect x="450" y="386" width="20" height="5" rx="2.5" fill="#0a0a0c" />
        {/* d-pad */}
        <g style={{ fill: "var(--dv-w3)" }}>
          <rect x="364" y="414" width="12" height="34" rx="3" />
          <rect x="353" y="425" width="34" height="12" rx="3" />
        </g>
        {/* face buttons */}
        {[
          [556, 416],
          [572, 431],
          [540, 431],
          [556, 446],
        ].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="7" style={{ fill: "var(--dv-w2)" }} stroke="#000" strokeOpacity="0.15" />
        ))}
        {/* sticks */}
        {[
          [418, 474],
          [502, 474],
        ].map(([x, y]) => (
          <g key={x}>
            <circle cx={x} cy={y} r="22" fill="#0b0b0d" />
            <circle cx={x} cy={y} r="16" fill="#2a2b30" />
            <circle cx={x} cy={y} r="11" fill="#1a1b1f" />
            <circle cx={x - 5} cy={y - 6} r="5" fill="#fff" opacity="0.12" />
          </g>
        ))}
      </g>
    </svg>
  );
}
