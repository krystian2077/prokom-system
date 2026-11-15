import { notFound } from "next/navigation";
import { servicePoints } from "@/config/prokom";
import { RepairPage } from "@/components/tech/repair/RepairPage";
import { buildableRepairs, repairPath, repairSeo } from "@/lib/tech/naprawy";
import { publishedPoints } from "@/lib/tech/points";
import { pageMetadata } from "@/lib/tech/seo";

type Props = { params: Promise<{ slug: string }> };

// Only published && verified pages are built in production; drafts only on staging (SPEC §12.4).
export const dynamicParams = false;

export function generateStaticParams() {
  return buildableRepairs().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const page = buildableRepairs().find((p) => p.slug === slug);
  if (!page) return {};
  const meta = pageMetadata({ ...repairSeo(page, publishedPoints(servicePoints)), path: repairPath(page.slug) });
  return page.published && page.verified ? meta : { ...meta, robots: { index: false, follow: false } };
}

export default async function RepairRoute({ params }: Props) {
  const { slug } = await params;
  const page = buildableRepairs().find((p) => p.slug === slug);
  if (!page) notFound();
  return <RepairPage page={page} />;
}
