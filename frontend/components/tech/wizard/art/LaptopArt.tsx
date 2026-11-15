import { Materials } from "./materials";

/** Open laptop seen from the front, a touch from above (viewBox 600×400). No brand marks. */
export default function LaptopArt({ uid }: { uid: string }) {
  const id = `${uid}lp`;
  const keys: JSX.Element[] = [];
  // keyboard in perspective: 5 rows narrowing to the back
  for (let r = 0; r < 5; r++) {
    const t0 = r / 5;
    const t1 = (r + 0.82) / 5;
    const y0 = 302 + t0 * 34;
    const y1 = 302 + t1 * 34;
    const x0a = 132 - t0 * 32;
    const x1a = 468 + t0 * 32;
    const x0b = 132 - t1 * 32;
    const x1b = 468 + t1 * 32;
    const n = 14;
    for (let k = 0; k < n; k++) {
      const a = k / n;
      const b = (k + 0.86) / n;
      const p = (xa: number, xb: number, t: number) => xa + (xb - xa) * t;
      keys.push(
        <polygon
          key={`${r}-${k}`}
          points={`${p(x0a, x1a, a)},${y0} ${p(x0a, x1a, b)},${y0} ${p(x0b, x1b, b)},${y1} ${p(x0b, x1b, a)},${y1}`}
          style={{ fill: "var(--dv-key)" }}
        />,
      );
    }
  }
  return (
    <svg className="t-art" viewBox="0 0 600 400" aria-hidden="true" focusable="false">
      <Materials id={id} />
      {/* lid */}
      <rect x="92" y="18" width="416" height="272" rx="16" fill={`url(#${id}-aluv)`} />
      <rect x="93" y="19" width="414" height="270" rx="15" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="1.6" />
      <rect x="98" y="24" width="404" height="262" rx="11" fill="#050506" />
      <rect x="106" y="32" width="388" height="246" rx="5" fill={`url(#${id}-glass)`} />
      <rect x="106" y="32" width="388" height="246" rx="5" fill={`url(#${id}-refl)`} />
      <rect x="282" y="24" width="36" height="9" rx="4.5" fill="#050506" />
      <circle cx="300" cy="28.5" r="2" fill="#141826" />
      {/* hinge */}
      <rect x="112" y="287" width="376" height="7" rx="3" style={{ fill: "var(--dv-hinge)" }} />
      {/* base deck */}
      <path d="M78 294 H522 L582 358 H18 Z" fill={`url(#${id}-alu)`} />
      <path d="M78 294 H522 L582 358 H18 Z" fill={`url(#${id}-volv)`} />
      <path d="M78 294 H522 L582 358 H18 Z" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="1.4" />
      <path d="M100 299 H500 L536 341 H64 Z" fill="#000" opacity="0.12" />
      <g>{keys}</g>
      <path d="M236 344 H364 L371 356 H229 Z" fill="#000" opacity="0.07" />
      <path d="M236 344 H364 L371 356 H229 Z" fill="none" stroke="#000" strokeOpacity="0.12" strokeWidth="0.8" />
      {/* front lip with the opening notch and ports on the left */}
      <path d="M18 358 H582 L578 370 Q576 374 570 374 H30 Q24 374 22 370 Z" fill={`url(#${id}-aluv)`} />
      <path d="M18 358 H582 L578 370 Q576 374 570 374 H30 Q24 374 22 370 Z" fill="#000" opacity="0.18" />
      <path d="M20 358.6 H580" stroke="#fff" strokeOpacity="0.55" strokeWidth="1" />
      <path d="M270 358 H330 Q328 364 322 364 H278 Q272 364 270 358 Z" fill="#000" opacity="0.18" />
      <rect x="44" y="362.5" width="14" height="5" rx="2.5" fill="#0b0b0d" />
      <rect x="64" y="362.5" width="14" height="5" rx="2.5" fill="#0b0b0d" />
      <circle cx="88" cy="365" r="2.6" fill="#0b0b0d" />
    </svg>
  );
}
