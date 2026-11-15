import { Lens, Materials } from "./materials";

/** Phone, back and front side by side (viewBox 480×540). No brand marks. */
export default function PhoneArt({ uid }: { uid: string }) {
  const id = `${uid}ph`;
  return (
    <svg className="t-art" viewBox="0 0 480 540" aria-hidden="true" focusable="false">
      <Materials id={id} />
      {/* back */}
      <g>
        <rect x="35" y="104" width="5" height="18" rx="2" style={{ fill: "var(--dv-m2)" }} />
        <rect x="35" y="140" width="5" height="40" rx="2" style={{ fill: "var(--dv-m2)" }} />
        <rect x="35" y="190" width="5" height="40" rx="2" style={{ fill: "var(--dv-m2)" }} />
        <rect x="38" y="40" width="200" height="456" rx="46" fill={`url(#${id}-metal)`} />
        <rect x="39" y="41" width="198" height="454" rx="45" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="2" />
        <rect x="44" y="46" width="188" height="444" rx="40" style={{ fill: "var(--dv-back)" }} />
        <rect x="44" y="46" width="188" height="444" rx="40" fill={`url(#${id}-vol)`} />
        <rect x="44" y="46" width="188" height="444" rx="40" fill={`url(#${id}-volv)`} />
        {/* camera plateau */}
        <rect x="58" y="62" width="100" height="104" rx="28" style={{ fill: "var(--dv-plateau)" }} />
        <rect x="58.5" y="62.5" width="99" height="103" rx="27.5" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="1.2" />
        <Lens id={id} cx={84} cy={89} r={19} />
        <Lens id={id} cx={84} cy={139} r={19} />
        <Lens id={id} cx={131} cy={114} r={19} />
        <circle cx="131" cy="78" r="7" fill="#f3e6c8" />
        <circle cx="131" cy="78" r="7" fill={`url(#${id}-glow)`} />
        <circle cx="131" cy="150" r="5.5" fill="#0d0e11" />
        <circle cx="146" cy="96" r="2.2" fill="#0d0e11" />
      </g>
      {/* front */}
      <g>
        <rect x="441" y="150" width="5" height="62" rx="2" style={{ fill: "var(--dv-m2)" }} />
        <rect x="242" y="40" width="200" height="456" rx="46" fill={`url(#${id}-metal)`} />
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
