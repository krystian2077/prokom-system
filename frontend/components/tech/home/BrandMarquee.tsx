import type { CSSProperties } from "react";
import { brands } from "@/lib/tech/wizard-data";
import { brandLogo } from "@/components/tech/brand-logos";

/** Width/height of a "x y w h" viewBox, so the SVG box is sized before paint (CLS 0). */
function logoAspect(box: string) {
  const [, , w, h] = box.split(" ").map(Number);
  return Math.round((w / h) * 1000) / 1000;
}

/** One brand: inline monochrome SVG (Simple Icons) or, when no mark exists, a text wordmark. */
function Brand({ name, hidden }: { name: string; hidden?: boolean }) {
  const logo = brandLogo(name);
  if (!logo) {
    return (
      <span className="t-brands__word" aria-hidden={hidden || undefined}>
        {name}
      </span>
    );
  }
  return (
    <svg
      className="t-brands__logo"
      viewBox={logo.box}
      style={{ "--t-logo-size": logo.size, "--t-logo-ar": logoAspect(logo.box) } as CSSProperties}
      xmlns="http://www.w3.org/2000/svg"
      focusable="false"
      {...(hidden ? { "aria-hidden": true } : { role: "img", "aria-label": logo.title })}
    >
      <path d={logo.path} />
    </svg>
  );
}

/** Brand strip (design T.Main). CSS-only marquee; the list is doubled for a seamless loop. */
export function BrandMarquee() {
  return (
    <section className="t-brands t-ui" aria-label="Marki, które naprawiamy">
      <ul className="t-brands__track">
        {brands.map((b) => (
          <li key={b}>
            <Brand name={b} />
          </li>
        ))}
        {brands.map((b) => (
          <li key={`dup-${b}`} aria-hidden="true">
            <Brand name={b} hidden />
          </li>
        ))}
      </ul>
    </section>
  );
}
