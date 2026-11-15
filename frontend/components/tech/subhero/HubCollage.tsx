import Image from "next/image";

/** Device photos with transparent background (public/tech/urzadzenia), largest first. */
const ITEMS = [
  { src: "/tech/urzadzenia/laptop.webp", w: 640, h: 640, cls: "laptop", label: "Laptopy" },
  { src: "/tech/urzadzenia/iphone.webp", w: 433, h: 577, cls: "phone", label: "Telefony" },
  { src: "/tech/urzadzenia/konsola.webp", w: 640, h: 640, cls: "console", label: "Konsole" },
  { src: "/tech/urzadzenia/tablet.webp", w: 577, h: 640, cls: "tablet", label: "Tablety" },
] as const;

/**
 * Hub /uslugi visual: a constellation of devices on the dark stage (same photos as the
 * wizard and the home hero). Decorative — the device list is the section below.
 * Images are eager (above the fold) and never start at opacity 0 (PREMIUM §0).
 */
export function HubCollage() {
  return (
    <div className="t-hubart" aria-hidden="true">
      {ITEMS.map((it, i) => (
        <span key={it.cls} className={`t-hubart__item t-hubart__item--${it.cls}`} style={{ animationDelay: `${i * -1.4}s` }}>
          <Image src={it.src} width={it.w} height={it.h} alt="" priority sizes="(min-width: 1024px) 260px, 40vw" className="t-hubart__img" />
          <em>{it.label}</em>
        </span>
      ))}
    </div>
  );
}
