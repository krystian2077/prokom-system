/**
 * Page-level SEO helpers (docs/tech/SPEC.md §9): metadata with canonical + Open Graph,
 * BreadcrumbList and FAQPage JSON-LD. Site-wide Organization/LocalBusiness stay in jsonld.ts.
 */
import type { Metadata } from "next";
import { line } from "@/config/prokom";
import { SITE_URL } from "@/lib/site-config";

export type Crumb = { name: string; path: string };
export type FaqItem = { q: string; a: string };

/**
 * Metadata for a public page. `title` is the part before " | PRO-KOM Tech"
 * (the layout template adds the suffix); keep the full title within 30–60 characters
 * and the description within 120–155 (tests/tech/seo.test.ts).
 */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  const url = `${SITE_URL}${path === "/" ? "" : path}`;
  const full = `${title} | ${line.name}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "pl_PL",
      url,
      siteName: line.name,
      title: full,
      description,
      images: [{ url: "/images/og-prokom.jpg", width: 1200, height: 630, alt: line.name }],
    },
    twitter: { card: "summary_large_image", title: full, description },
  };
}

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.path === "/" ? "/" : c.path}`,
    })),
  };
}

export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
