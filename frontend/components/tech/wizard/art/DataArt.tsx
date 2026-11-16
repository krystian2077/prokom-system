import { Materials } from "./materials";

/** Data recovery: phone, open hard drive, pendrive + memory card, folder (viewBox 480×400). */
export default function DataArt({ uid }: { uid: string }) {
  const id = `${uid}da`;
  return (
    <svg className="t-art" viewBox="0 0 480 400" aria-hidden="true" focusable="false">
      <Materials id={id} />
      <defs>
        <radialGradient id={`${id}-platter`} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#f4f6fa" />
          <stop offset="0.45" stopColor="#aeb4bf" />
          <stop offset="0.8" stopColor="#d9dde4" />
          <stop offset="1" stopColor="#8d939e" />
        </radialGradient>
        <linearGradient id={`${id}-folder`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0675a" />
          <stop offset="1" stopColor="#c4362b" />
        </linearGradient>
      </defs>
      {/* folder */}
      <path d="M190 40 H232 L244 52 H296 Q304 52 304 60 V122 Q304 130 296 130 H190 Q182 130 182 122 V48 Q182 40 190 40 Z" fill={`url(#${id}-folder)`} />
      <path d="M182 66 H304 V122 Q304 130 296 130 H190 Q182 130 182 122 Z" fill="#fff" opacity="0.12" />
      {/* phone */}
      <rect x="42" y="132" width="104" height="198" rx="22" fill={`url(#${id}-metal)`} />
      <rect x="43" y="133" width="102" height="196" rx="21" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="1.6" />
      <rect x="47" y="137" width="94" height="188" rx="18" fill="#050506" />
      <rect x="51" y="141" width="86" height="180" rx="15" fill={`url(#${id}-glass)`} />
      <rect x="51" y="141" width="86" height="180" rx="15" fill={`url(#${id}-refl)`} />
      <rect x="80" y="148" width="28" height="8" rx="4" fill="#020203" />
      {/* hard drive */}
      <rect x="178" y="158" width="146" height="186" rx="14" fill={`url(#${id}-alu)`} />
      <rect x="178.6" y="158.6" width="144.8" height="184.8" rx="13.4" fill="none" stroke="#000" strokeOpacity="0.12" />
      <circle cx="251" cy="232" r="56" fill={`url(#${id}-platter)`} />
      <circle cx="251" cy="232" r="56" fill="none" stroke="#000" strokeOpacity="0.15" />
      <circle cx="251" cy="232" r="13" fill="#7d838e" />
      <circle cx="251" cy="232" r="6" fill="#c9ced6" />
      <path d="M302 300 L264 246" stroke="#3c3f46" strokeWidth="7" strokeLinecap="round" />
      <circle cx="302" cy="302" r="10" fill="#4a4d55" />
      {[192, 312].map((x) => [172, 330].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="3" fill="#7c8089" />))}
      {/* pendrive + card */}
      <rect x="352" y="118" width="40" height="34" rx="4" fill="#c9ccd2" />
      <rect x="360" y="126" width="8" height="8" rx="1" fill="#2a2b30" />
      <rect x="376" y="126" width="8" height="8" rx="1" fill="#2a2b30" />
      <rect x="346" y="150" width="52" height="118" rx="12" fill={`url(#${id}-metal)`} />
      <rect x="347" y="151" width="50" height="116" rx="11" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="1.2" />
      <circle cx="372" cy="250" r="4" fill="#5fd1ff" opacity="0.8" />
      <path d="M402 230 H442 L456 244 V320 Q456 326 450 326 H402 Q396 326 396 320 V236 Q396 230 402 230 Z" fill="#1d1e22" />
      <path d="M402 230 H442 L456 244 V320 Q456 326 450 326 H402 Q396 326 396 320 V236 Q396 230 402 230 Z" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="1" />
      {[408, 418, 428, 438].map((x) => (
        <rect key={x} x={x} y="236" width="6" height="16" rx="1" fill="#d4a94a" />
      ))}
      <rect x="404" y="270" width="44" height="30" rx="4" fill="#e2483a" opacity="0.85" />
    </svg>
  );
}
