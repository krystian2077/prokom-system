import { Materials } from "./materials";

/** Tablet, front, portrait (viewBox 440×600). Landscape front camera on the long edge. */
export default function TabletArt({ uid }: { uid: string }) {
  const id = `${uid}tb`;
  return (
    <svg className="t-art" viewBox="0 0 440 600" aria-hidden="true" focusable="false">
      <Materials id={id} />
      <rect x="318" y="15" width="46" height="5" rx="2" style={{ fill: "var(--dv-m2)" }} />
      <rect x="420" y="58" width="5" height="34" rx="2" style={{ fill: "var(--dv-m2)" }} />
      <rect x="420" y="98" width="5" height="34" rx="2" style={{ fill: "var(--dv-m2)" }} />
      <rect x="20" y="18" width="400" height="564" rx="34" fill={`url(#${id}-metal)`} />
      <rect x="21" y="19" width="398" height="562" rx="33" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="2" />
      <rect x="24" y="22" width="392" height="556" rx="30" fill="#050506" />
      <rect x="36" y="34" width="368" height="532" rx="20" fill={`url(#${id}-glass)`} />
      <rect x="36" y="34" width="368" height="532" rx="20" fill={`url(#${id}-refl)`} />
      <circle cx="410" cy="300" r="3.2" fill="#121521" />
      <circle cx="409.2" cy="299.2" r="1" fill="#5d6a8c" />
      {/* speaker grilles on the short edges */}
      {[56, 62, 68, 74, 80, 86].map((x) => (
        <circle key={`t${x}`} cx={x} cy="19.5" r="1.1" fill="#0b0b0d" />
      ))}
      {[354, 360, 366, 372, 378, 384].map((x) => (
        <circle key={`b${x}`} cx={x} cy="580.5" r="1.1" fill="#0b0b0d" />
      ))}
      <rect x="206" y="579" width="28" height="4" rx="2" fill="#0b0b0d" />
    </svg>
  );
}
