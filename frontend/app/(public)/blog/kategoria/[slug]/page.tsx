import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/tech/Breadcrumbs";
import { CtaBand } from "@/components/tech/CtaBand";
import { JsonLd } from "@/components/tech/JsonLd";
import { BlogCard } from "@/components/tech/blog/BlogCard";
import { BlogCategoryBar } from "@/components/tech/blog/BlogCategoryBar";
import { CourierTeaser } from "@/components/tech/device/CourierTeaser";
import { IconArrow } from "@/components/tech/icons";
import { BLOG_CATEGORIES, categoryBySlug, categoryIntro, featuredInCategory, postsInCategory } from "@/lib/tech/blog-taxonomy";
import { SUBMIT_HREF } from "@/lib/tech/nav";
import { breadcrumbJsonLd, pageMetadata, type Crumb } from "@/lib/tech/seo";
import { SITE_URL } from "@/lib/site-config";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return BLOG_CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const cat = categoryBySlug((await params).slug);
  if (!cat) return {};
  return pageMetadata({ title: `${cat.name} — porady serwisu`, description: cat.description, path: `/blog/kategoria/${cat.slug}` });
}

export default async function BlogCategoryPage({ params }: Props) {
  const cat = categoryBySlug((await params).slug);
  if (!cat) notFound();
  const posts = postsInCategory(cat.slug);
  const featured = featuredInCategory(cat.slug)!;
  const rest = posts.filter((p) => p.slug !== featured.slug);
  const path = `/blog/kategoria/${cat.slug}`;
  const crumbs: Crumb[] = [
    { name: "Start", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: cat.name, path },
  ];

  return (
    <div className="t-ui t-page t-blog">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: cat.name,
          description: cat.description,
          url: `${SITE_URL}${path}`,
          mainEntity: {
            "@type": "ItemList",
            itemListElement: posts.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/blog/${p.slug}`, name: p.title })),
          },
        }}
      />

      <section className="t-section--hero" id="kategoria" data-rail={cat.name}>
        <div className="t-container">
          <div className="t-stage t-bhero">
            <Breadcrumbs items={crumbs} separator="/" />
            <h1 className="t-bhero__h1">{cat.name}</h1>
            <p className="t-bhero__lead t-bhero__lead--wide">{categoryIntro(cat)}</p>
          </div>
        </div>
      </section>

      <section className="t-section t-section--tight" id="wpisy" data-rail="Wpisy">
        <div className="t-container">
          <BlogCategoryBar current={cat.slug} />
          <div className="t-bfeat">
            <span className="t-eyebrow">Polecany wpis</span>
            <BlogCard post={featured} big showCategory={false} />
          </div>
          <ul className="t-bgrid">
            {rest.map((p) => (
              <li key={p.slug}>
                <BlogCard post={p} showCategory={false} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="t-section t-section--alt t-section--tight" id="problem" data-rail="Masz problem?">
        <div className="t-container t-bproblem">
          <div>
            <span className="t-eyebrow">Masz taki problem?</span>
            <h2 className="t-h2 t-h2--sm">Zgłoś naprawę</h2>
            <p className="t-lead">Opisz usterkę online. Diagnoza i wycena przed naprawą, naprawiamy dopiero po Twojej zgodzie.</p>
          </div>
          <ul className="t-dev-more__list">
            {cat.related.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className="t-chiplink">
                  {r.label}
                  <IconArrow size={14} />
                </Link>
              </li>
            ))}
          </ul>
          <CourierTeaser />
        </div>
      </section>

      <CtaBand eyebrow="Następny krok" title="Poradnik nie pomógł? Zgłoś naprawę online albo zadzwoń." primary={{ label: "Zgłoś naprawę", href: SUBMIT_HREF }} secondary={{ label: "Wszystkie wpisy", href: "/blog" }} />
    </div>
  );
}
