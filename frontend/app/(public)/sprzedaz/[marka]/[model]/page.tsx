import { ModelPage } from "@/components/tech/catalog/ModelPage";
import { catalog, findModel, modelPath } from "@/lib/tech/catalog";
import { modelDescription, modelTitle } from "@/lib/tech/catalog/seo";
import { pageMetadata } from "@/lib/tech/seo";

type Props = { params: { marka: string; model: string } };

export const dynamicParams = false;

export function generateStaticParams() {
  return catalog.models.map((m) => ({ marka: m.brand, model: m.slug }));
}

export function generateMetadata({ params }: Props) {
  const m = findModel(params.marka, params.model);
  if (!m) return {};
  return pageMetadata({ title: modelTitle(m), description: modelDescription(m), path: modelPath(m) });
}

export default function Page({ params }: Props) {
  return <ModelPage brand={params.marka} slug={params.model} />;
}
