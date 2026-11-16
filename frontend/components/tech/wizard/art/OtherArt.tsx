import { Materials } from "./materials";

/** "Inne": a display, a speaker, a power button and a charger (viewBox 480×400). */
export default function OtherArt({ uid }: { uid: string }) {
  const id = `${uid}ot`;
  return (
    <svg className="t-art" viewBox="0 0 480 400" aria-hidden="true" focusable="false">
      <Materials id={id} />
      {/* display */}
      <rect x="196" y="222" width="48" height="40" style={{ fill: "var(--dv-a2)" }} />
      <path d="M168 262 H272 Q278 262 278 268 V272 H162 V268 Q162 262 168 262 Z" fill={`url(#${id}-aluv)`} />
      <rect x="112" y="52" width="216" height="172" rx="12" fill={`url(#${id}-aluv)`} />
      <rect x="117" y="57" width="206" height="162" rx="8" fill="#050506" />
      <rect x="124" y="64" width="192" height="148" rx="4" fill={`url(#${id}-glass)`} />
      <rect x="124" y="64" width="192" height="148" rx="4" fill={`url(#${id}-refl)`} />
      {/* speaker */}
      <rect x="348" y="78" width="88" height="128" rx="22" fill={`url(#${id}-metal)`} />
      <rect x="349" y="79" width="86" height="126" rx="21" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="1.4" />
      <rect x="356" y="86" width="72" height="112" rx="16" fill={`url(#${id}-mesh)`} />
      <circle cx="392" cy="142" r="22" fill="#000" opacity="0.18" />
      <circle cx="392" cy="142" r="10" fill="#000" opacity="0.2" />
      {/* power button */}
      <circle cx="380" cy="300" r="44" fill={`url(#${id}-alu)`} />
      <circle cx="380" cy="300" r="44" fill="none" stroke="#000" strokeOpacity="0.1" />
      <circle cx="380" cy="300" r="34" style={{ fill: "var(--dv-m2)" }} />
      <circle cx="380" cy="300" r="34" fill={`url(#${id}-refl)`} />
      <path d="M368 288 A17 17 0 1 0 392 288 M380 280 V298" fill="none" stroke="#e8e9ec" strokeWidth="4" strokeLinecap="round" />
      {/* charger and cable */}
      <path d="M90 330 Q90 372 150 372 H200" fill="none" stroke="#1d1e22" strokeWidth="6" strokeLinecap="round" />
      <rect x="54" y="236" width="72" height="92" rx="14" fill={`url(#${id}-white)`} />
      <rect x="54.6" y="236.6" width="70.8" height="90.8" rx="13.4" fill="none" stroke="#000" strokeOpacity="0.12" />
      <rect x="72" y="218" width="8" height="22" rx="2" fill="#a7abb2" />
      <rect x="100" y="218" width="8" height="22" rx="2" fill="#a7abb2" />
      <rect x="80" y="326" width="20" height="8" rx="2" fill="#d2d4d8" />
    </svg>
  );
}
