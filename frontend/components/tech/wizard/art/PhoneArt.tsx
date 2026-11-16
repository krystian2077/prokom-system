import { Lens, Materials } from "./materials";

/** Phone, back and front side by side (viewBox 480×540). No brand marks. */
export default function PhoneArt({ uid }: { uid: string }) {
  const id = `${uid}ph`;
  return (
    <svg className="t-art" viewBox="0 0 480 540" aria-hidden="true" focusable="false">
      <Materials id={id} />
      {/* back */}
      <defs>
        <linearGradient id={`${id}-frost`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--dv-back2)" }} />
          <stop offset="0.55" style={{ stopColor: "var(--dv-back)" }} />
          <stop offset="1" style={{ stopColor: "var(--dv-back3)" }} />
        </linearGradient>
        <radialGradient id={`${id}-sweep`} cx="0.3" cy="0.2" r="0.9">
          <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.03" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-lift`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#000" floodOpacity="0.45" />
        </filter>
      </defs>
      <g>
        <rect x="35" y="104" width="5" height="18" rx="2" fill={`url(#${id}-ring)`} />
        <rect x="35" y="140" width="5" height="40" rx="2" fill={`url(#${id}-ring)`} />
        <rect x="35" y="190" width="5" height="40" rx="2" fill={`url(#${id}-ring)`} />
        {/* titanium frame */}
        <rect x="38" y="40" width="200" height="456" rx="46" fill={`url(#${id}-ring)`} />
        <rect x="40.5" y="42.5" width="195" height="451" rx="43.5" fill={`url(#${id}-metal)`} />
        {/* frosted back glass */}
        <rect x="44" y="46" width="188" height="444" rx="40" fill={`url(#${id}-frost)`} />
        <rect x="44" y="46" width="188" height="444" rx="40" fill={`url(#${id}-sweep)`} />
        <rect x="44" y="46" width="188" height="444" rx="40" fill={`url(#${id}-vol)`} />
        <rect x="44" y="46" width="188" height="444" rx="40" fill={`url(#${id}-volv)`} />
        {/* raised camera plateau */}
        <g filter={`url(#${id}-lift)`}>
          <rect x="56" y="60" width="106" height="110" rx="30" style={{ fill: "var(--dv-plateau)" }} />
        </g>
        <rect x="56" y="60" width="106" height="110" rx="30" fill={`url(#${id}-sweep)`} />
        <rect x="56.6" y="60.6" width="104.8" height="108.8" rx="29.4" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="1.4" />
        <Lens id={id} cx={84} cy={89} r={21} />
        <Lens id={id} cx={84} cy={141} r={21} />
        <Lens id={id} cx={133} cy={115} r={21} />
        <circle cx="134" cy="78" r="7" fill="#f3e6c8" />
        <circle cx="134" cy="78" r="9" fill={`url(#${id}-glow)`} />
        <circle cx="134" cy="153" r="6" fill="#0d0e11" />
        <circle cx="150" cy="98" r="2.2" fill="#0d0e11" />
      </g>
      {/* front */}
      <g>
        <rect x="441" y="150" width="5" height="62" rx="2" fill={`url(#${id}-ring)`} />
        <rect x="242" y="40" width="200" height="456" rx="46" fill={`url(#${id}-ring)`} />
        <rect x="244.5" y="42.5" width="195" height="451" rx="43.5" fill={`url(#${id}-metal)`} />
        <rect x="243" y="41" width="198" height="454" rx="45" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="2" />
        <rect x="246" y="44" width="192" height="448" rx="42" fill="#050506" />
        <rect x="253" y="51" width="178" height="434" rx="36" fill={`url(#${id}-glass)`} />
        <rect x="253" y="51" width="178" height="434" rx="36" fill={`url(#${id}-refl)`} />
        <rect x="313" y="64" width="58" height="18" rx="9" fill="#020203" />
        <circle cx="361" cy="73" r="3.2" fill="#10131c" />
        <rect x="322" y="42.5" width="40" height="2.4" rx="1.2" fill="#0a0a0c" opacity="0.8" />
        <rect x="331" y="493.6" width="22" height="3.4" rx="1.7" fill="#0a0a0c" />
      </g>
    </svg>
  );
}
