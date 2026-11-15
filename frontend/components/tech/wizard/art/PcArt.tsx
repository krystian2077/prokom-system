import { Materials } from "./materials";

/** Desktop tower in three-quarter view (viewBox 360×580). Front: power, ports, drive slot, mesh. */
export default function PcArt({ uid }: { uid: string }) {
  const id = `${uid}pc`;
  return (
    <svg className="t-art" viewBox="0 0 360 580" aria-hidden="true" focusable="false">
      <Materials id={id} />
      {/* side panel (receding) */}
      <path d="M212 26 L326 52 V540 L212 566 Z" fill={`url(#${id}-side)`} />
      <path d="M212 26 L326 52 V540 L212 566 Z" fill={`url(#${id}-volv)`} />
      <path d="M226 88 L312 106 V486 L226 504 Z" fill="#000" opacity="0.16" />
      <path d="M212.5 26.5 L325.5 52.5" stroke="#fff" strokeOpacity="0.35" strokeWidth="1" />
      {/* front */}
      <rect x="44" y="20" width="170" height="548" rx="12" fill={`url(#${id}-metalv)`} />
      <rect x="44.6" y="20.6" width="168.8" height="546.8" rx="11.4" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="1.4" />
      <rect x="50" y="26" width="158" height="536" rx="8" fill={`url(#${id}-vol)`} />
      {/* power */}
      <circle cx="129" cy="62" r="15" fill={`url(#${id}-ring)`} />
      <circle cx="129" cy="62" r="11.5" style={{ fill: "var(--dv-m2)" }} />
      <path d="M124.5 57.5 A6.4 6.4 0 1 0 133.5 57.5 M129 54 V61" fill="none" stroke="#cfd1d6" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="152" cy="62" r="2" fill="#5fd1ff" />
      {/* ports */}
      <rect x="82" y="138" width="94" height="26" rx="6" fill="#000" opacity="0.22" />
      <circle cx="96" cy="151" r="4.4" fill="#0a0a0c" stroke="#55565c" strokeWidth="1" />
      <circle cx="112" cy="151" r="4.4" fill="#0a0a0c" stroke="#55565c" strokeWidth="1" />
      <rect x="126" y="146" width="18" height="10" rx="1.5" fill="#0a0a0c" stroke="#55565c" strokeWidth="1" />
      <rect x="150" y="146" width="18" height="10" rx="1.5" fill="#0a0a0c" stroke="#3a7bd5" strokeWidth="1" />
      {/* drive slot */}
      <rect x="66" y="226" width="126" height="26" rx="5" fill="#000" opacity="0.2" />
      <rect x="74" y="236" width="94" height="5" rx="2.5" fill="#050506" />
      <circle cx="180" cy="238.5" r="3" style={{ fill: "var(--dv-m1)" }} />
      {/* mesh */}
      <rect x="62" y="288" width="134" height="258" rx="8" fill="#000" opacity="0.25" />
      <rect x="62" y="288" width="134" height="258" rx="8" fill={`url(#${id}-mesh)`} />
      <rect x="62" y="288" width="134" height="258" rx="8" fill={`url(#${id}-volv)`} />
      {/* feet */}
      <rect x="58" y="566" width="30" height="6" rx="3" fill="#0d0d0f" />
      <rect x="170" y="566" width="30" height="6" rx="3" fill="#0d0d0f" />
    </svg>
  );
}
