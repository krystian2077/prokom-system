/**
 * Shared materials of the device illustrations (feat/tech-kreator-wow, direction B):
 * brushed graphite metal, a rim light, deep glass screens, coated lenses, satin white
 * plastics. Colours are CSS custom properties (`--dv-*`, tech-wizard.css), so light and
 * dark themes get their own variant. Ids are prefixed per instance (several scenes on a page).
 */
export function Materials({ id }: { id: string }) {
  const s = (v: string, o?: number) => ({ stopColor: v, ...(o === undefined ? {} : { stopOpacity: o }) });
  return (
    <defs>
      <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" style={s("var(--dv-m1)")} />
        <stop offset="0.48" style={s("var(--dv-m2)")} />
        <stop offset="1" style={s("var(--dv-m3)")} />
      </linearGradient>
      <linearGradient id={`${id}-metalv`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={s("var(--dv-m1)")} />
        <stop offset="1" style={s("var(--dv-m2)")} />
      </linearGradient>
      <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" style={s("var(--dv-rim)", 0.95)} />
        <stop offset="0.35" style={s("var(--dv-rim)", 0.12)} />
        <stop offset="0.75" style={s("var(--dv-rim)", 0.06)} />
        <stop offset="1" style={s("var(--dv-rim)", 0.5)} />
      </linearGradient>
      <radialGradient id={`${id}-glass`} cx="0.22" cy="0.12" r="1.1">
        <stop offset="0" style={s("var(--dv-g1)")} />
        <stop offset="0.5" style={s("var(--dv-g2)")} />
        <stop offset="1" style={s("var(--dv-g3)")} />
      </radialGradient>
      <linearGradient id={`${id}-refl`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0.28" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.4" stopColor="#fff" stopOpacity="0.055" />
        <stop offset="0.52" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <radialGradient id={`${id}-lens`} cx="0.38" cy="0.34" r="0.7">
        <stop offset="0" stopColor="#3b4f7a" />
        <stop offset="0.28" stopColor="#141a2b" />
        <stop offset="0.7" stopColor="#050608" />
        <stop offset="1" stopColor="#1b1c20" />
      </radialGradient>
      <linearGradient id={`${id}-ring`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#c9cbd1" />
        <stop offset="0.5" stopColor="#4a4b52" />
        <stop offset="1" stopColor="#9ea0a7" />
      </linearGradient>
      <linearGradient id={`${id}-white`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={s("var(--dv-w1)")} />
        <stop offset="1" style={s("var(--dv-w2)")} />
      </linearGradient>
      <linearGradient id={`${id}-whitex`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" style={s("var(--dv-w2)")} />
        <stop offset="0.5" style={s("var(--dv-w1)")} />
        <stop offset="1" style={s("var(--dv-w3)")} />
      </linearGradient>
      <linearGradient id={`${id}-side`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" style={s("var(--dv-m2)")} />
        <stop offset="1" style={s("var(--dv-m4)")} />
      </linearGradient>
      <linearGradient id={`${id}-alu`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" style={s("var(--dv-a1)")} />
        <stop offset="0.55" style={s("var(--dv-a2)")} />
        <stop offset="1" style={s("var(--dv-a3)")} />
      </linearGradient>
      <linearGradient id={`${id}-aluv`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={s("var(--dv-a1)")} />
        <stop offset="1" style={s("var(--dv-a2)")} />
      </linearGradient>
      {/* edge shading: darker sides, a lit strip left of centre — gives a flat slab volume */}
      <linearGradient id={`${id}-vol`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity="0.32" />
        <stop offset="0.07" stopColor="#000" stopOpacity="0" />
        <stop offset="0.22" stopColor="#fff" stopOpacity="0.07" />
        <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.93" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.38" />
      </linearGradient>
      <linearGradient id={`${id}-volv`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.1" />
        <stop offset="0.12" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.9" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.25" />
      </linearGradient>
      <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <pattern id={`${id}-mesh`} width="7" height="7" patternUnits="userSpaceOnUse">
        <circle cx="3.5" cy="3.5" r="1.9" style={{ fill: "var(--dv-hole)" }} />
      </pattern>
    </defs>
  );
}

/** A coated camera lens with a metal ring and a glint. */
export function Lens({ id, cx, cy, r }: { id: string; cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-ring)`} />
      <circle cx={cx} cy={cy} r={r * 0.84} fill="#0b0c0f" />
      <circle cx={cx} cy={cy} r={r * 0.66} fill={`url(#${id}-lens)`} />
      <circle cx={cx} cy={cy} r={r * 0.3} fill="#06070a" />
      <circle cx={cx - r * 0.24} cy={cy - r * 0.26} r={r * 0.12} fill="#fff" opacity="0.7" />
      <circle cx={cx + r * 0.2} cy={cy + r * 0.22} r={r * 0.06} fill="#9fb4ff" opacity="0.55" />
    </g>
  );
}
