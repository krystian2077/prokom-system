import { Materials } from "./materials";

/** Smartwatch, front, on a sport band (viewBox 400×480). */
export default function WatchArt({ uid }: { uid: string }) {
  const id = `${uid}wt`;
  return (
    <svg className="t-art" viewBox="0 0 400 480" aria-hidden="true" focusable="false">
      <Materials id={id} />
      <defs>
        <linearGradient id={`${id}-band`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: "var(--dv-band2)" }} />
          <stop offset="0.5" style={{ stopColor: "var(--dv-band1)" }} />
          <stop offset="1" style={{ stopColor: "var(--dv-band2)" }} />
        </linearGradient>
      </defs>
      {/* band */}
      <path d="M134 0 H266 L258 104 H142 Z" fill={`url(#${id}-band)`} />
      <path d="M142 376 H258 L266 480 H134 Z" fill={`url(#${id}-band)`} />
      {[20, 44, 68].map((y) => (
        <rect key={y} x="146" y={y} width="108" height="2" rx="1" fill="#000" opacity="0.12" />
      ))}
      {[404, 428, 452].map((y) => (
        <rect key={y} x="146" y={y} width="108" height="2" rx="1" fill="#000" opacity="0.12" />
      ))}
      {/* case */}
      <rect x="296" y="166" width="20" height="50" rx="8" fill={`url(#${id}-ring)`} />
      {[172, 180, 188, 196, 204].map((y) => (
        <rect key={y} x="306" y={y} width="10" height="2" rx="1" fill="#000" opacity="0.25" />
      ))}
      <rect x="298" y="248" width="9" height="46" rx="4" style={{ fill: "var(--dv-m2)" }} />
      <rect x="100" y="95" width="200" height="290" rx="62" fill={`url(#${id}-metal)`} />
      <rect x="101" y="96" width="198" height="288" rx="61" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="2.2" />
      <rect x="106" y="101" width="188" height="278" rx="56" fill="#040405" />
      <rect x="118" y="113" width="164" height="254" rx="44" fill={`url(#${id}-glass)`} />
      {/* calm watch face */}
      <text x="200" y="226" textAnchor="middle" fill="#f6f1f0" fontSize="50" fontWeight="700" letterSpacing="-1" fontFamily="var(--t-font-head), system-ui, sans-serif">
        10:09
      </text>
      <text x="200" y="252" textAnchor="middle" fill="#a59c99" fontSize="14" fontWeight="700" letterSpacing="1.5" fontFamily="var(--t-font-body), system-ui, sans-serif">
        PON 16
      </text>
      <circle cx="166" cy="306" r="17" fill="none" stroke="#2a2a2e" strokeWidth="5" />
      <circle cx="166" cy="306" r="17" fill="none" stroke="#e2483a" strokeWidth="5" strokeLinecap="round" strokeDasharray="72 107" transform="rotate(-90 166 306)" />
      <circle cx="234" cy="306" r="17" fill="none" stroke="#2a2a2e" strokeWidth="5" />
      <circle cx="234" cy="306" r="17" fill="none" stroke="#7fd36a" strokeWidth="5" strokeLinecap="round" strokeDasharray="50 107" transform="rotate(-90 234 306)" />
      <rect x="118" y="113" width="164" height="254" rx="44" fill={`url(#${id}-refl)`} />
    </svg>
  );
}
