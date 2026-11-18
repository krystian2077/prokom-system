import Image from "next/image";
import type { BrandKey } from "@/config/serwis-marek";

/**
 * Hero visual of a brand page: device photos with transparent background on the dark stage.
 * Apple: no photo shows the apple mark (laptop-bez-logo, the iPad and the iPhone from the front).
 * Decorative (aria-hidden) — the models are listed in "Wybierz model". Images are eager and
 * never start at opacity 0 (PREMIUM §0, LCP).
 */
const ART: Record<BrandKey, { src: string; w: number; h: number; cls: string }[]> = {
  apple: [
    { src: "/tech/urzadzenia/laptop-bez-logo.webp", w: 640, h: 640, cls: "laptop" },
    { src: "/tech/urzadzenia/hero-tablet.webp", w: 519, h: 592, cls: "tablet" },
    { src: "/tech/urzadzenia/hero-iphone.webp", w: 242, h: 493, cls: "phone" },
  ],
  samsung: [{ src: "/tech/urzadzenia/samsung.webp", w: 454, h: 549, cls: "galaxy" }],
};

export function BrandArt({ brand }: { brand: BrandKey }) {
  return (
    <div className={`t-brandart t-brandart--${brand}`} aria-hidden="true">
      {ART[brand].map((it, i) => (
        <span key={it.cls} className={`t-brandart__item t-brandart__item--${it.cls}`} style={{ animationDelay: `${i * -1.6}s` }}>
          <Image src={it.src} width={it.w} height={it.h} alt="" priority sizes="(min-width: 1024px) 320px, 50vw" className="t-brandart__img" />
        </span>
      ))}
    </div>
  );
}
