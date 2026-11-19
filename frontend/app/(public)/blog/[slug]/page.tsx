import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { line, telHref } from "@/config/prokom";
import { Breadcrumbs } from "@/components/tech/Breadcrumbs";
import { CtaBand } from "@/components/tech/CtaBand";
import { Faq } from "@/components/tech/Faq";
import { JsonLd } from "@/components/tech/JsonLd";
import { BlogCard } from "@/components/tech/blog/BlogCard";
import { IconArrow, IconCheck } from "@/components/tech/icons";
import { getAllSlugs, getPostBySlug } from "@/lib/blog-posts";
import { categoryOf, relatedPosts, serviceLinkOf } from "@/lib/tech/blog-taxonomy";
import { repairForPost, repairPath } from "@/lib/tech/naprawy";
import { formatPostDate, renderPostContent } from "@/lib/tech/blog-render";
import { SUBMIT_HREF } from "@/lib/tech/nav";
import { breadcrumbJsonLd, faqJsonLd, POST_TITLE_SUFFIX_MAX, type Crumb } from "@/lib/tech/seo";
import { SITE_URL } from "@/lib/site-config";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPostBySlug((await params).slug);
  if (!post) return {};
  const url = `${SITE_URL}/blog/${post.slug}`;
  const image = { url: "/images/og-prokom.jpg", width: 1200, height: 630, alt: post.title };
  return {
    // Post titles are kept as they are (SPEC §12.11); `absolute` skips the suffix only when
    // the title is already long, so the full title stays readable in search results.
    title: post.title.length > POST_TITLE_SUFFIX_MAX ? { absolute: post.title } : post.title,
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: url },
    openGraph: { type: "article", locale: "pl_PL", url, siteName: line.name, title: post.title, description: post.description, publishedTime: post.date, images: [image] },
    twitter: { card: "summary_large_image", title: post.title, description: post.description, images: [image.url] },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = getPostBySlug((await params).slug);
  if (!post) notFound();
  const cat = categoryOf(post);
  const catPath = `/blog/kategoria/${cat.slug}`;
  const service = serviceLinkOf(post);
  const related = relatedPosts(post, 3);
  const repair = repairForPost(post, cat.slug);
  const url = `${SITE_URL}/blog/${post.slug}`;
  const crumbs: Crumb[] = [
    { name: "Start", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: cat.name, path: catPath },
    { name: post.title, path: `/blog/${post.slug}` },
  ];

  return (
    <div className="t-ui t-page t-blog">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "@id": url,
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          dateModified: post.date,
          keywords: post.tags?.join(", "),
          articleSection: cat.name,
          image: `${SITE_URL}/images/og-prokom.jpg`,
          author: { "@type": "Organization", name: line.name, url: SITE_URL },
          publisher: { "@id": `${SITE_URL}/#organization` },
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
          ...(post.areaServed ? { contentLocation: post.areaServed.map((name) => ({ "@type": "City", name })) } : {}),
        }}
      />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      {post.faq?.length ? <JsonLd data={faqJsonLd(post.faq)} /> : null}

      <section className="t-section--hero" id="wpis" data-rail="Wpis">
        <div className="t-container">
          <div className="t-stage t-bhero t-bhero--post">
            <Breadcrumbs items={crumbs} separator="/" />
            <div className="t-bhero__meta">
              <Link href={catPath} className="t-bhero__cat">
                {cat.name}
              </Link>
              <span>
                {formatPostDate(post.date)} · {post.readingTime} czytania
              </span>
            </div>
            <h1 className="t-bhero__h1 t-bhero__h1--post">{post.title}</h1>
            <p className="t-bhero__lead t-bhero__lead--wide">{post.description}</p>
          </div>
        </div>
      </section>

      <section className="t-section t-section--tight" data-rail="Treść" id="tresc-wpisu">
        <div className="t-container t-post">
          <article className="t-post__main">
            {post.keyTakeaways?.length ? (
              <div className="t-post__keys">
                <span className="t-eyebrow">Najważniejsze informacje</span>
                <ul>
                  {post.keyTakeaways.map((k) => (
                    <li key={k}>
                      <IconCheck size={14} />
                      <span>{k}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="t-prose" dangerouslySetInnerHTML={{ __html: renderPostContent(post.content) }} />
            {post.tags?.length ? (
              <ul className="t-post__tags" aria-label="Tematy">
                {post.tags.map((t) => (
                  <li key={t}>#{t}</li>
                ))}
              </ul>
            ) : null}
            {post.faq?.length ? (
              <div className="t-post__faq">
                <h2 className="t-h2 t-h2--sm">Najczęstsze pytania</h2>
                <Faq items={post.faq} openFirst={false} />
              </div>
            ) : null}
          </article>
          <aside className="t-post__side">
            {service ? (
              <div className="t-card t-post__box">
                <span className="t-eyebrow">Powiązana usługa</span>
                <Link href={service.href} className="t-post__service">
                  {service.label}
                  <IconArrow size={16} />
                </Link>
              </div>
            ) : null}
            {repair ? (
              <div className="t-card t-post__box">
                <span className="t-eyebrow">Powiązana naprawa</span>
                <Link href={repairPath(repair.slug)} className="t-post__service" data-track="blog_powiazana_naprawa_klik">
                  {repair.h1}
                  <IconArrow size={16} />
                </Link>
              </div>
            ) : null}
            <div className="t-card t-post__box">
              <span className="t-eyebrow">Masz taki problem?</span>
              <p>Zgłoś naprawę online. Wycenę dostaniesz przed rozpoczęciem pracy.</p>
              <Link href={SUBMIT_HREF} className="t-pbtn t-pbtn--acc t-pbtn--m" data-track="zgloszenie_start" data-track-zrodlo="blog">
                Zgłoś naprawę
              </Link>
              <a href={telHref(line.phone)} className="t-post__tel" data-track="telefon_klik" data-track-miejsce="blog">
                {line.phoneDisplay}
              </a>
            </div>
            <Link href={catPath} className="t-post__back">
              ← Więcej: {cat.name}
            </Link>
          </aside>
        </div>
      </section>

      {related.length ? (
        <section className="t-section t-section--alt t-section--tight" id="powiazane" data-rail="Powiązane">
          <div className="t-container">
            <h2 className="t-h2 t-h2--sm">Powiązane wpisy</h2>
            <ul className="t-bgrid t-bgrid--related">
              {related.map((r) => (
                <li key={r.slug}>
                  <BlogCard post={r} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <CtaBand eyebrow="Następny krok" title="Masz pytanie albo potrzebujesz naprawy? Zgłoś ją online." primary={{ label: "Zgłoś naprawę", href: SUBMIT_HREF }} secondary={{ label: "Wróć do bloga", href: "/blog" }} />
    </div>
  );
}
