import { brands } from "@/lib/tech/wizard-data";

/** Brand strip (design T.Main). CSS-only marquee; the list is doubled for a seamless loop. */
export function BrandMarquee() {
  return (
    <section className="t-brands t-ui" aria-label="Marki, które naprawiamy">
      <ul className="t-brands__track">
        {brands.map((b) => (
          <li key={b}>
            {b}
            <i aria-hidden="true" />
          </li>
        ))}
        {brands.map((b) => (
          <li key={`dup-${b}`} aria-hidden="true">
            {b}
            <i />
          </li>
        ))}
      </ul>
    </section>
  );
}
