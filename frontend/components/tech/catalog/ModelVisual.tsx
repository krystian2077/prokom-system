import Image from "next/image";
import type { CatalogModel } from "@/lib/tech/catalog/types";
import { silhouetteDataUri, silhouetteSize } from "@/lib/tech/catalog/silhouette";

/**
 * The model in the chosen colour: the manufacturer photo (images[].src; a 16:10 tile, since the
 * manufacturers' shots come on black or white backgrounds),
 * otherwise our silhouette drawn in the variant colour. A soft glow in the variant colour sits
 * behind it (--variant). Server-safe; the configurator swaps `color`.
 */
export function ModelVisual({ model, color, priority = false, size = "card", className = "", decorative = false }: { model: CatalogModel; color?: string | null; priority?: boolean; size?: "card" | "hero"; className?: string; decorative?: boolean }) {
  const c = model.colors.find((x) => x.key === color) ?? model.colors[0];
  const photo = model.images.find((i) => i.color === c?.key && i.src) ?? null;
  // In a card the name is the heading next to it — the picture adds nothing for a screen reader.
  const alt = decorative ? "" : `${model.name}${c ? ` — ${c.name}` : ""}`;
  const dims = silhouetteSize(model.kind);
  const box = size === "hero" ? 640 : 360;
  return (
    <span className={`t-mvis t-mvis--${model.kind} t-mvis--${size}${photo?.src && !photo.transparent ? " t-mvis--photo" : ""}${photo?.transparent ? " t-mvis--cutout" : ""} ${className}`} style={{ "--variant": c?.hex ?? "#888888", ...(photo?.bg ? { "--photo-bg": photo.bg } : {}) } as React.CSSProperties} data-color={c?.key}>
      <span className="t-mvis__glow" aria-hidden="true" />
      {photo?.src ? (
        <Image src={photo.src} alt={alt} width={box} height={photo.transparent ? box : Math.round(box * 0.625)} sizes={size === "hero" ? "(max-width: 768px) 90vw, 560px" : "(max-width: 768px) 45vw, 280px"} priority={priority} className="t-mvis__img" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- inline SVG data URI, nothing to optimise
        <img src={silhouetteDataUri(model.kind, c?.hex ?? "#888888", `${model.slug}-${c?.key ?? "x"}`)} alt={alt} width={dims.w} height={dims.h} className="t-mvis__img t-mvis__img--draw" />
      )}
    </span>
  );
}
