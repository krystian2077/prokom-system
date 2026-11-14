/**
 * Illustrations in the scene style (PREMIUM §4) for devices without a photo with usage
 * rights: smartwatch, data recovery, other. Drawn in the same image-px space as the
 * crop in wizard-data.ts (watch 400×480, compositions 480×400), dark "device" bodies
 * with a soft top light, like the product photos. Decorative: role="img" lives on the frame.
 */
const BODY = "url(#t-art-body)";

function Defs() {
  return (
    <defs>
      <linearGradient id="t-art-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3a3533" />
        <stop offset="1" stopColor="#141110" />
      </linearGradient>
      <linearGradient id="t-art-screen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#1f2a3a" />
        <stop offset="0.55" stopColor="#0b0d12" />
        <stop offset="1" stopColor="#2a1512" />
      </linearGradient>
      <linearGradient id="t-art-strap" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#2b2725" />
        <stop offset="0.5" stopColor="#3b3634" />
        <stop offset="1" stopColor="#24201f" />
      </linearGradient>
      <filter id="t-art-shadow" x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#000" floodOpacity="0.35" />
      </filter>
    </defs>
  );
}

export function WatchArt() {
  return (
    <svg className="t-art" viewBox="0 0 400 480" aria-hidden="true" focusable="false">
      <Defs />
      <g filter="url(#t-art-shadow)">
        <path d="M130 0 L270 0 L262 104 L138 104 Z" fill="url(#t-art-strap)" />
        <path d="M138 376 L262 376 L270 480 L130 480 Z" fill="url(#t-art-strap)" />
        <rect x="100" y="95" width="200" height="290" rx="62" fill={BODY} />
        <rect x="104" y="99" width="192" height="282" rx="58" fill="none" stroke="#fff" strokeOpacity="0.14" strokeWidth="2" />
        <rect x="118" y="113" width="164" height="254" rx="44" fill="url(#t-art-screen)" />
        <path d="M150 128 C200 118 250 124 268 150" stroke="#fff" strokeOpacity="0.18" strokeWidth="6" fill="none" strokeLinecap="round" />
        <rect x="300" y="168" width="18" height="48" rx="7" fill="#4a4442" />
        <rect x="300" y="250" width="10" height="44" rx="4" fill="#3a3533" />
        <text x="200" y="232" textAnchor="middle" fill="#f6f1f0" fontSize="46" fontWeight="800" fontFamily="var(--t-font-head), sans-serif">
          10:09
        </text>
        <circle cx="200" cy="292" r="22" fill="none" stroke="#e2483a" strokeWidth="6" strokeDasharray="100 140" transform="rotate(-90 200 292)" />
      </g>
    </svg>
  );
}

export function DataArt() {
  return (
    <svg className="t-art" viewBox="0 0 480 400" aria-hidden="true" focusable="false">
      <Defs />
      <g filter="url(#t-art-shadow)">
        {/* folder */}
        <path d="M190 52 L228 52 L238 64 L290 64 L290 128 L190 128 Z" fill="#c4362b" />
        <path d="M190 74 L290 74 L290 128 L190 128 Z" fill="#e2483a" />
        {/* phone */}
        <rect x="44" y="140" width="92" height="180" rx="18" fill={BODY} />
        <rect x="52" y="150" width="76" height="160" rx="12" fill="url(#t-art-screen)" />
        {/* hdd */}
        <rect x="178" y="180" width="124" height="142" rx="14" fill={BODY} />
        <circle cx="240" cy="242" r="44" fill="#2a2523" stroke="#fff" strokeOpacity="0.12" strokeWidth="2" />
        <circle cx="240" cy="242" r="9" fill="#5a5250" />
        <path d="M240 242 L282 288" stroke="#8c7b78" strokeWidth="6" strokeLinecap="round" />
        {/* pendrive + card */}
        <rect x="352" y="146" width="44" height="100" rx="10" fill={BODY} />
        <rect x="362" y="122" width="24" height="26" rx="3" fill="#9a9290" />
        <path d="M372 236 L432 236 L446 250 L446 316 L372 316 Z" fill="#26211f" stroke="#fff" strokeOpacity="0.14" strokeWidth="2" />
        <path d="M388 244 L388 260 M400 244 L400 260 M412 244 L412 260" stroke="#c9a54a" strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function OtherArt() {
  return (
    <svg className="t-art" viewBox="0 0 480 400" aria-hidden="true" focusable="false">
      <Defs />
      <g filter="url(#t-art-shadow)">
        {/* screen */}
        <rect x="120" y="60" width="200" height="160" rx="14" fill={BODY} />
        <rect x="130" y="70" width="180" height="140" rx="8" fill="url(#t-art-screen)" />
        <path d="M200 220 L240 220 L250 246 L190 246 Z" fill="#2b2725" />
        {/* speaker */}
        <rect x="350" y="86" width="80" height="120" rx="16" fill={BODY} />
        <circle cx="390" cy="164" r="24" fill="#2a2523" stroke="#fff" strokeOpacity="0.12" strokeWidth="2" />
        <circle cx="390" cy="112" r="9" fill="#2a2523" />
        {/* plug + cable */}
        <path d="M90 360 C90 330 120 330 130 300" stroke="#3a3533" strokeWidth="10" fill="none" strokeLinecap="round" />
        <rect x="62" y="262" width="56" height="48" rx="10" fill={BODY} />
        <path d="M78 262 L78 242 M102 262 L102 242" stroke="#9a9290" strokeWidth="8" strokeLinecap="round" />
        {/* power button */}
        <circle cx="380" cy="300" r="40" fill={BODY} />
        <path d="M366 288 A20 20 0 1 0 394 288 M380 276 L380 300" stroke="#e2483a" strokeWidth="7" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
