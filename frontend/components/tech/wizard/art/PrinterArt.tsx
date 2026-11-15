import { Materials } from "./materials";

/** Ink-tank multifunction printer, front, slightly from above (viewBox 600×380). */
export default function PrinterArt({ uid }: { uid: string }) {
  const id = `${uid}pr`;
  const tanks = ["#1d1d1f", "#1fa2d6", "#c2338a", "#f2c94c"];
  return (
    <svg className="t-art" viewBox="0 0 600 380" aria-hidden="true" focusable="false">
      <Materials id={id} />
      {/* scanner lid (top face) */}
      <path d="M86 34 H514 Q522 34 526 40 L552 104 H48 L74 40 Q78 34 86 34 Z" fill={`url(#${id}-metalv)`} />
      <path d="M100 44 H500 L520 94 H80 Z" fill="#000" opacity="0.1" />
      <path d="M86 34.6 H514" stroke="#fff" strokeOpacity="0.5" strokeWidth="1" />
      {/* body */}
      <rect x="40" y="104" width="520" height="236" rx="18" fill={`url(#${id}-white)`} />
      <rect x="40" y="104" width="520" height="236" rx="18" fill={`url(#${id}-vol)`} opacity="0.55" />
      <rect x="40.6" y="104.6" width="518.8" height="234.8" rx="17.4" fill="none" stroke="#000" strokeOpacity="0.08" strokeWidth="1.2" />
      <path d="M44 106 H556" stroke="#000" strokeOpacity="0.16" strokeWidth="3" />
      {/* control panel */}
      <rect x="70" y="124" width="104" height="40" rx="9" style={{ fill: "var(--dv-m2)" }} />
      <rect x="78" y="131" width="52" height="26" rx="4" fill={`url(#${id}-glass)`} />
      <circle cx="146" cy="137" r="4" fill="#3a3b41" />
      <circle cx="160" cy="137" r="4" fill="#3a3b41" />
      <circle cx="153" cy="152" r="4.5" fill="#5fd1ff" opacity="0.85" />
      {/* ink tanks window */}
      <rect x="66" y="236" width="120" height="74" rx="10" style={{ fill: "var(--dv-m2)" }} opacity="0.92" />
      {tanks.map((c, i) => (
        <g key={c}>
          <rect x={76 + i * 27} y={246} width={20} height={54} rx={5} fill="#0e0f12" />
          <rect x={78 + i * 27} y={262} width={16} height={36} rx={4} fill={c} opacity="0.9" />
          <rect x={79 + i * 27} y={264} width={3} height={30} rx={1.5} fill="#fff" opacity="0.35" />
        </g>
      ))}
      {/* paper output */}
      <rect x="210" y="236" width="300" height="34" rx="8" fill="#0d0e10" />
      <rect x="220" y="244" width="280" height="6" rx="3" fill="#000" />
      <path d="M220 270 H500 L512 318 Q513 324 507 324 H213 Q207 324 208 318 Z" style={{ fill: "var(--dv-m2)" }} />
      <path d="M232 270 H488 L494 302 H226 Z" fill="#fafaf7" />
      <path d="M232 270 H488 L494 302 H226 Z" fill="#000" opacity="0.06" />
      {/* feet */}
      <rect x="62" y="338" width="44" height="6" rx="3" fill="#0d0d0f" opacity="0.8" />
      <rect x="494" y="338" width="44" height="6" rx="3" fill="#0d0d0f" opacity="0.8" />
    </svg>
  );
}
