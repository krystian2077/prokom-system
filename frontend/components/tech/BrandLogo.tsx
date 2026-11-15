import type { CSSProperties } from "react";
import { brandLogo, type BrandLogo as BrandLogoData } from "@/components/tech/brand-logos";

const symbolId = (slug: string) => `t-brand-${slug}`;

/** Width/height of a "x y w h" viewBox, so the SVG box is sized before paint (CLS 0). */
function logoAspect(box: string) {
  const [, , w, h] = box.split(" ").map(Number);
  return Math.round((w / h) * 1000) / 1000;
}

type Props = {
  /** Brand name as in `brands` ("Apple", "realme") or the logo record itself. */
  brand: string | BrandLogoData;
  /** "mono" (default): current text colour, brand colour when an ancestor hover rule asks for it. "color": always the brand colour. */
  variant?: "mono" | "color";
  /** Decorative copy (e.g. the marquee's second loop): aria-hidden instead of role="img". */
  hidden?: boolean;
  /** Draw via `<use>` from <BrandLogoSprite> (rendered once on the page) instead of an inline path. */
  sprite?: boolean;
  className?: string;
};

/**
 * One brand mark (components/tech/brand-logos.ts), inline SVG, no requests.
 * Height = the context's `--t-logo-h` (default 20px) × the logo's optical `size`; width
 * follows from the viewBox. Hover colours come from `--t-brand` / `--t-brand-dark`.
 */
export function BrandLogo({ brand, variant = "mono", hidden, sprite, className }: Props) {
  const logo = typeof brand === "string" ? brandLogo(brand) : brand;
  if (!logo) return null;
  const [x, y, w, h] = logo.box.split(" ").map(Number);
  const style = {
    "--t-logo-size": logo.size,
    "--t-logo-ar": logoAspect(logo.box),
    ...(logo.dy ? { "--t-logo-dy": logo.dy } : {}),
    "--t-brand": logo.color,
    "--t-brand-dark": logo.colorDark,
  } as CSSProperties;
  const cls = ["t-logo", variant === "color" ? "t-logo--color" : "", className ?? ""].filter(Boolean).join(" ");
  return (
    <svg
      className={cls}
      viewBox={logo.box}
      style={style}
      focusable="false"
      {...(hidden ? { "aria-hidden": true } : { role: "img", "aria-label": logo.title })}
    >
      {sprite ? (
        // explicit rect: a symbol is otherwise placed at 0,0, not at the box origin
        <use href={`#${symbolId(logo.slug)}`} x={x} y={y} width={w} height={h} />
      ) : (
        <LogoPath logo={logo} />
      )}
    </svg>
  );
}

/** potrace output relies on even-odd holes; Simple Icons on the default rule. */
function LogoPath({ logo }: { logo: BrandLogoData }) {
  return <path d={logo.path} fillRule={logo.source === "krystian" ? "evenodd" : undefined} />;
}

/** Hidden sprite with each path once, for <BrandLogo sprite />. Render at most once per page. */
export function BrandLogoSprite({ logos }: { logos: readonly BrandLogoData[] }) {
  return (
    <svg className="t-logo-sprite" aria-hidden="true" focusable="false">
      {logos.map((l) => (
        <symbol key={l.slug} id={symbolId(l.slug)} viewBox={l.box}>
          <LogoPath logo={l} />
        </symbol>
      ))}
    </svg>
  );
}
