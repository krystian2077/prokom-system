import Link from "next/link";
import { BRAND_NAMES, modelPath } from "@/lib/tech/catalog";
import type { CatalogModel } from "@/lib/tech/catalog/types";
import { ModelVisual } from "./ModelVisual";

/** Catalogue/salon card: visual, name, colour dots, storage range, „Nowość”. No price — ever. */
export function ModelCard({ model, headingLevel = 3 }: { model: CatalogModel; headingLevel?: 2 | 3 | 4 }) {
  const H = headingLevel === 2 ? "h2" : headingLevel === 4 ? "h4" : "h3";
  const range = model.storage.length ? (model.storage.length > 1 ? `${model.storage[0].label} – ${model.storage[model.storage.length - 1].label}` : model.storage[0].label) : null;
  return (
    <article className="t-mcard" data-model={model.slug}>
      <Link href={modelPath(model)} className="t-mcard__link">
        <span className="t-mcard__top">
          <span className="t-mcard__brand">{BRAND_NAMES[model.brand]}</span>
          {model.isNew ? <span className="t-mcard__new">Nowość</span> : null}
        </span>
        <ModelVisual model={model} decorative />
        <H className="t-mcard__name">{model.name}</H>
        <span className="t-mcard__dots" aria-label={`Kolory: ${model.colors.map((c) => c.name).join(", ")}`}>
          {model.colors.slice(0, 7).map((c) => (
            <i key={c.key} style={{ background: c.hex }} />
          ))}
          {model.colors.length > 7 ? <b>+{model.colors.length - 7}</b> : null}
        </span>
        {range ? <span className="t-mcard__range">{range}</span> : null}
        <span className="t-mcard__go">Wybierz kolor i wersję →</span>
      </Link>
    </article>
  );
}
