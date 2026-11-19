import { brands } from "@/lib/tech/wizard-data";
import { brandLogo, type BrandLogo as BrandLogoData } from "@/components/tech/brand-logos";
import { BrandLogo, BrandLogoSprite } from "@/components/tech/BrandLogo";

const logos = brands.map((b) => brandLogo(b)).filter((l): l is BrandLogoData => Boolean(l));

/**
 * Brand strip (design T.Main). CSS-only marquee; the list is doubled for a seamless loop.
 * Paths live once in the sprite, both loop copies only `<use>` them.
 * TODO(krystian): the strip keeps the Apple mark (and the Samsung wordmark) — open decision
 * (runda-1811-tech-marki.md §7.7); service, catalogue and salon pages show names as text
 * (TEXT_MARK_BRANDS in brand-logos.ts).
 */
export function BrandMarquee() {
  return (
    <section className="t-brands t-ui" aria-label="Marki, które naprawiamy">
      <BrandLogoSprite logos={logos} />
      <ul className="t-brands__track">
        {logos.map((l) => (
          <li key={l.slug}>
            <BrandLogo brand={l} sprite />
          </li>
        ))}
        {logos.map((l) => (
          <li key={`dup-${l.slug}`} aria-hidden="true">
            <BrandLogo brand={l} sprite hidden />
          </li>
        ))}
      </ul>
    </section>
  );
}
