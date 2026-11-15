import type { CSSProperties } from "react";
import { brands } from "@/lib/tech/wizard-data";
import { brandLogo, type BrandLogo } from "@/components/tech/brand-logos";

const logos = brands.map((b) => brandLogo(b)).filter((l): l is BrandLogo => Boolean(l));
const symbolId = (slug: string) => `t-brand-${slug}`;

/** Width/height of a "x y w h" viewBox, so the SVG box is sized before paint (CLS 0). */
function logoAspect(box: string) {
  const [, , w, h] = box.split(" ").map(Number);
  return Math.round((w / h) * 1000) / 1000;
}

/** One brand mark; the path lives once in the sprite, both loop copies only `<use>` it. */
function Brand({ logo, hidden }: { logo: BrandLogo; hidden?: boolean }) {
  const [x, y, w, h] = logo.box.split(" ").map(Number);
  const style = {
    "--t-logo-size": logo.size,
    "--t-logo-ar": logoAspect(logo.box),
    ...(logo.dy ? { "--t-logo-dy": logo.dy } : {}),
    "--t-brand": logo.color,
    "--t-brand-dark": logo.colorDark,
  } as CSSProperties;
  return (
    <svg
      className="t-brands__logo"
      viewBox={logo.box}
      style={style}
      focusable="false"
      {...(hidden ? { "aria-hidden": true } : { role: "img", "aria-label": logo.title })}
    >
      {/* explicit rect: a symbol is otherwise placed at 0,0, not at the box origin */}
      <use href={`#${symbolId(logo.slug)}`} x={x} y={y} width={w} height={h} />
    </svg>
  );
}

/** Brand strip (design T.Main). CSS-only marquee; the list is doubled for a seamless loop. */
export function BrandMarquee() {
  return (
    <section className="t-brands t-ui" aria-label="Marki, które naprawiamy">
      <svg className="t-brands__sprite" aria-hidden="true" focusable="false">
        {logos.map((l) => (
          <symbol key={l.slug} id={symbolId(l.slug)} viewBox={l.box}>
            {/* potrace output relies on even-odd holes; Simple Icons on the default rule */}
            <path d={l.path} fillRule={l.source === "krystian" ? "evenodd" : undefined} />
          </symbol>
        ))}
      </svg>
      <ul className="t-brands__track">
        {logos.map((l) => (
          <li key={l.slug}>
            <Brand logo={l} />
          </li>
        ))}
        {logos.map((l) => (
          <li key={`dup-${l.slug}`} aria-hidden="true">
            <Brand logo={l} hidden />
          </li>
        ))}
      </ul>
    </section>
  );
}
