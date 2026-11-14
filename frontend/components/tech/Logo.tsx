/**
 * PRO-KOM TECH mark (design T.Logo). Stand-in drawing until the official SVG
 * (SPEC §10, [Krystian]) — replace this one file.
 */
type Props = { size?: number; dark?: boolean; className?: string };

export function Logo({ size = 28, dark = false, className }: Props) {
  const s = size;
  const style = {
    "--l-size": `${s}px`,
    "--l-gap": `${Math.round(s * 0.24)}px`,
    "--l-dash-w": `${Math.round(s * 0.4)}px`,
    "--l-dash-h": `${Math.max(2, Math.round(s * 0.125))}px`,
    "--l-dash-m": `${Math.round(s * 0.09)}px`,
    "--l-bar-h": `${Math.max(2, Math.round(s * 0.09))}px`,
    "--l-bar-gap": `${Math.round(s * 0.22)}px`,
    "--l-label": `${Math.max(8, Math.round(s * 0.36))}px`,
  } as React.CSSProperties;
  return (
    <span role="img" aria-label="PRO-KOM Tech" className={`t-logo${dark ? " t-logo--dark" : ""}${className ? ` ${className}` : ""}`} style={style}>
      <span className="t-logo__word" aria-hidden="true">
        PRO
        <span className="t-logo__dash" />
        KOM
      </span>
      <span className="t-logo__line" aria-hidden="true">
        <span className="t-logo__bar" />
        <span className="t-logo__label">TECH</span>
      </span>
    </span>
  );
}
