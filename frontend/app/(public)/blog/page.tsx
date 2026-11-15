import { line } from "@/config/prokom";
import { Breadcrumbs } from "@/components/tech/Breadcrumbs";
import { CtaBand } from "@/components/tech/CtaBand";
import { JsonLd } from "@/components/tech/JsonLd";
import { BlogCard } from "@/components/tech/blog/BlogCard";
import { BlogCategoryBar } from "@/components/tech/blog/BlogCategoryBar";
import { BlogSearch } from "@/components/tech/blog/BlogSearch";
import { BLOG_POSTS } from "@/lib/blog-posts";
import { categoryOf } from "@/lib/tech/blog-taxonomy";
import { SUBMIT_HREF } from "@/lib/tech/nav";
import { breadcrumbJsonLd, pageMetadata, type Crumb } from "@/lib/tech/seo";
import { SITE_URL } from "@/lib/site-config";

export const metadata = pageMetadata({
  title: "Blog — porady serwisu telefonów i komputerów",
  description:
    "Poradniki serwisu PRO-KOM Tech: telefony i tablety, laptopy i komputery, drukarki oraz porady zakupowe. Co sprawdzić samemu i kiedy naprawa ma sens.",
  path: "/blog",
});

const CRUMBS: Crumb[] = [
  { name: "Start", path: "/" },
  { name: "Blog", path: "/blog" },
];

export default function BlogPage() {
  const posts = [...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date));
  const featured = posts.find((p) => p.featured) ?? posts[0];
  const rest = posts.filter((p) => p.slug !== featured.slug);
  const items = rest.map((p) => ({
    slug: p.slug,
    haystack: [p.title, ...(p.tags ?? []), categoryOf(p).name].join(" ").toLocaleLowerCase("pl-PL"),
  }));
  const cards = Object.fromEntries(rest.map((p) => [p.slug, <BlogCard key={p.slug} post={p} />]));

  return (
    <div className="t-ui t-page t-blog">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          "@id": `${SITE_URL}/blog`,
          name: `Blog ${line.name}`,
          url: `${SITE_URL}/blog`,
          publisher: { "@id": `${SITE_URL}/#organization` },
        }}
      />

      <section className="t-section--hero" id="blog" data-rail="Blog">
        <div className="t-container">
          <div className="t-stage t-bhero">
            <Breadcrumbs items={CRUMBS} separator="/" />
            <h1 className="t-bhero__h1">
              Blog <span>Porady z codziennej pracy serwisu</span>
            </h1>
            <p className="t-bhero__lead">Co możesz sprawdzić sam, kiedy naprawa ma sens i jak dbać o sprzęt, żeby rzadziej trafiał do serwisu.</p>
          </div>
        </div>
      </section>

      <section className="t-section t-section--tight" id="wpisy" data-rail="Wpisy">
        <div className="t-container">
          <BlogCategoryBar current={null} />
          <div className="t-bfeat">
            <span className="t-eyebrow">Polecany wpis</span>
            <BlogCard post={featured} big />
          </div>
          <BlogSearch items={items} cards={cards} />
        </div>
      </section>

      <CtaBand eyebrow="Masz taki problem?" title="Poradnik nie pomógł? Zgłoś naprawę — wycenę dostaniesz przed rozpoczęciem pracy." primary={{ label: "Zgłoś naprawę", href: SUBMIT_HREF }} secondary={{ label: "Naprawy", href: "/uslugi" }} />
    </div>
  );
}
