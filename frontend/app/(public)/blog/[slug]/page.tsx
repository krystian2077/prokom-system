import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlug, getAllSlugs, getRelatedPosts } from "@/lib/blog-posts";
import { getCategoryStyle } from "@/lib/blog-categories";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const ogImage = {
    url: "/images/og-prokom.jpg",
    width: 1200,
    height: 630,
    alt: `${post.title} — PRO-KOM Serwis Rabka-Zdrój`,
  };

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: {
      canonical: `https://pro-kom.eu/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://pro-kom.eu/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
      authors: ["PRO-KOM Serwis"],
      images: [ogImage],
      locale: "pl_PL",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [ogImage.url],
    },
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Renders markdown content to HTML with premium blog typography.
 * Handles: ##, ###, **bold**, - list items, numbered lists, paragraphs, links, horizontal rules.
 * Bold inside article body is styled dark (not red) to avoid conflict with globals.css `strong { color: primary }`.
 */
function renderContent(raw: string): string {
  const lines = raw.split("\n");
  const htmlLines: string[] = [];
  let inList = false;
  let inOrderedList = false;
  let inParagraph = false;

  const closeParagraph = () => {
    if (inParagraph) {
      htmlLines.push("</p>");
      inParagraph = false;
    }
  };
  const closeList = () => {
    if (inList) {
      htmlLines.push("</ul>");
      inList = false;
    }
    if (inOrderedList) {
      htmlLines.push("</ol>");
      inOrderedList = false;
    }
  };

  const escapeHtml = (text: string): string =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const processInline = (text: string): string => {
    const safeText = escapeHtml(text);
    return safeText
      .replace(/\*\*(.+?)\*\*/g, '<span class="font-bold text-prokom-black">$1</span>')
      .replace(/`(.+?)`/g, '<code class="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-mono text-prokom-black">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="font-medium text-primary underline underline-offset-2 hover:text-red-700">$1</a>');
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      closeParagraph();
      closeList();
      htmlLines.push(
        `<h2 class="mt-10 mb-4 text-xl font-extrabold leading-tight text-prokom-black sm:text-2xl">${processInline(line.slice(3))}</h2>`
      );
      continue;
    }

    if (line.startsWith("### ")) {
      closeParagraph();
      closeList();
      htmlLines.push(
        `<h3 class="mt-8 mb-3 text-lg font-bold text-prokom-black">${processInline(line.slice(4))}</h3>`
      );
      continue;
    }

    const orderedMatch = line.match(/^(\d+)\. (.+)$/);
    if (orderedMatch) {
      closeParagraph();
      if (!inOrderedList) {
        htmlLines.push('<ol class="mt-4 space-y-2 pl-5">');
        inOrderedList = true;
      }
      htmlLines.push(
        `<li class="list-decimal text-base leading-relaxed text-prokom-gray">${processInline(orderedMatch[2])}</li>`
      );
      continue;
    }

    if (line.startsWith("- ")) {
      closeParagraph();
      if (!inList) {
        htmlLines.push('<ul class="mt-4 space-y-2 pl-1">');
        inList = true;
      }
      htmlLines.push(
        `<li class="flex items-start gap-2.5 text-base leading-relaxed text-prokom-gray"><span class="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-primary"></span><span>${processInline(line.slice(2))}</span></li>`
      );
      continue;
    }

    if (line.trim() === "---") {
      closeParagraph();
      closeList();
      htmlLines.push('<hr class="my-8 border-gray-200" />');
      continue;
    }

    if (line.trim() === "") {
      closeParagraph();
      closeList();
      continue;
    }

    // Regular paragraph line
    closeList();
    if (!inParagraph) {
      htmlLines.push('<p class="mt-4 text-base leading-[1.8] text-prokom-gray">');
      inParagraph = true;
    } else {
      htmlLines.push(" ");
    }
    htmlLines.push(processInline(line));
  }

  closeParagraph();
  closeList();
  return htmlLines.join("");
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const related = getRelatedPosts(post.slug, post, 3);
  const cs = getCategoryStyle(post.category);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `https://pro-kom.eu/blog/${post.slug}`,
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    keywords: post.tags?.join(", "),
    articleSection: post.category,
    image: "https://pro-kom.eu/images/og-prokom.jpg",
    author: {
      "@type": "Organization",
      name: "PRO-KOM Serwis",
      url: "https://pro-kom.eu",
    },
    publisher: {
      "@type": "Organization",
      name: "PRO-KOM Serwis",
      url: "https://pro-kom.eu",
      logo: {
        "@type": "ImageObject",
        url: "https://pro-kom.eu/images/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://pro-kom.eu/blog/${post.slug}`,
    },
    ...(post.areaServed && {
      contentLocation: post.areaServed.map((city) => ({
        "@type": "City",
        name: city,
      })),
    }),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Strona główna", item: "https://pro-kom.eu" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://pro-kom.eu/blog" },
      { "@type": "ListItem", position: 3, name: post.title, item: `https://pro-kom.eu/blog/${post.slug}` },
    ],
  };

  const faqLd = post.faq && post.faq.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: post.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      }
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      )}

      {/* Article hero */}
      <section className="relative overflow-hidden border-b border-gray-100 bg-white max-lg:border-b-0">
        <div className="pointer-events-none absolute inset-0 max-lg:hidden">
          <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-red-50 opacity-50 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 max-lg:px-5 max-lg:pb-6 max-lg:pt-6">

          {/* Breadcrumbs */}
          <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-prokom-gray max-lg:mb-4 max-lg:text-[11px]">
            <Link href="/" className="hover:text-prokom-black min-h-[44px] inline-flex items-center lg:min-h-0">Strona główna</Link>
            <span className="text-gray-300">/</span>
            <Link href="/blog" className="hover:text-prokom-black min-h-[44px] inline-flex items-center lg:min-h-0">Blog</Link>
            <span className="text-gray-300">/</span>
            <span className="text-prokom-black line-clamp-1">{post.title}</span>
          </nav>

          {/* Meta row */}
          <div className="mb-5 flex flex-wrap items-center gap-3 max-lg:mb-3 max-lg:gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold max-lg:px-3 max-lg:py-1.5 ${cs.pill}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${cs.dot}`} />
              {post.category}
            </span>
            <span className="text-xs text-prokom-gray">{formatDate(post.date)}</span>
            <span className="text-xs text-prokom-gray">· {post.readingTime} czytania</span>
          </div>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-prokom-black sm:text-4xl max-lg:text-[24px] max-lg:leading-[1.2]">
            {post.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-prokom-gray max-lg:mt-3 max-lg:text-[15px] max-lg:leading-[1.65]">{post.description}</p>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2 max-lg:mt-4 max-lg:gap-1.5">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs text-prokom-gray max-lg:px-2.5 max-lg:py-1 max-lg:text-[11px]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 max-lg:px-5 max-lg:py-6">

        {/* Key Takeaways */}
        {post.keyTakeaways && post.keyTakeaways.length > 0 && (
          <div className="mb-10 rounded-2xl border border-red-100 bg-red-50/60 p-6 max-lg:mb-6 max-lg:rounded-[20px] max-lg:border-red-100/60 max-lg:bg-red-50/40 max-lg:p-4">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-red-600 max-lg:mb-3 max-lg:text-[10px]">
              Najważniejsze informacje
            </p>
            <ul className="space-y-3 max-lg:space-y-2">
              {post.keyTakeaways.map((point) => (
                <li key={point} className="flex items-start gap-3 max-lg:gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    ✓
                  </span>
                  <span className="text-sm leading-relaxed text-prokom-black max-lg:text-[13px]">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Article body */}
        <div
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: renderContent(post.content) }}
        />

        {/* FAQ */}
        {post.faq && post.faq.length > 0 && (
          <div className="mt-14 max-lg:mt-8">
            <h2 className="mb-6 text-xl font-extrabold text-prokom-black max-lg:mb-4 max-lg:text-lg">Najczęstsze pytania</h2>
            <div className="space-y-4 max-lg:space-y-3">
              {post.faq.map((item, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card max-lg:rounded-[20px] max-lg:p-4 max-lg:shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)]"
                >
                  <p className="font-bold text-prokom-black max-lg:text-[15px]">{item.q}</p>
                  <p className="mt-2 text-sm leading-relaxed text-prokom-gray max-lg:mt-1.5 max-lg:text-[13px]">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related service link */}
        {post.relatedServiceHref && post.relatedServiceLabel && (
          <div className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-5 max-lg:mt-6 max-lg:rounded-[20px] max-lg:p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-prokom-gray max-lg:text-[10px]">
              Powiązana usługa
            </p>
            <Link
              href={post.relatedServiceHref}
              className="mt-2 inline-flex min-h-[44px] items-center gap-2 text-base font-bold text-primary hover:text-red-700 lg:min-h-0"
            >
              {post.relatedServiceLabel}
              <span>→</span>
            </Link>
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 rounded-2xl bg-prokom-black p-8 text-white max-lg:mt-6 max-lg:rounded-[20px] max-lg:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40 max-lg:text-[10px]">
            PRO-KOM Serwis
          </p>
          <p className="mt-3 text-xl font-extrabold max-lg:mt-2 max-lg:text-lg max-lg:leading-snug">Masz pytanie lub potrzebujesz naprawy?</p>
          <p className="mt-2 text-sm leading-relaxed text-white/70 max-lg:text-[13px]">
            Jesteśmy w centrum Rabki-Zdroju przy ul. Orkana 16B. Diagnoza bezpłatna — wycena przed naprawą.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 max-lg:mt-4 max-lg:flex-col max-lg:gap-2.5">
            <a
              href="tel:883200151"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700 max-lg:min-h-[48px] max-lg:rounded-[14px] max-lg:text-[14px]"
            >
              Zadzwoń: 883 200 151
            </a>
            <Link
              href="/zgloszenie"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20 max-lg:min-h-[48px] max-lg:rounded-[14px] max-lg:text-[14px]"
            >
              Zgłoś naprawę online
            </Link>
            <Link
              href="/kontakt"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20 max-lg:min-h-[48px] max-lg:rounded-[14px] max-lg:text-[14px]"
            >
              Dane i mapa
            </Link>
          </div>
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <div className="mt-14 max-lg:mt-8">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-prokom-gray max-lg:mb-3 max-lg:text-[11px]">
              Powiązane artykuły
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-lg:grid-cols-1 max-lg:gap-3">
              {related.map((r) => {
                const rcs = getCategoryStyle(r.category);
                return (
                  <Link
                    key={r.slug}
                    href={`/blog/${r.slug}`}
                    className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-card transition-all hover:border-red-200 hover:shadow-md max-lg:rounded-[20px] max-lg:p-4 max-lg:shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)]"
                  >
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${rcs.pill}`}>
                      <span className={`h-1 w-1 rounded-full ${rcs.dot}`} />
                      {r.category}
                    </span>
                    <p className="mt-3 text-sm font-bold leading-snug text-prokom-black transition-colors group-hover:text-primary max-lg:mt-2">
                      {r.title}
                    </p>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-prokom-gray max-lg:text-[12px]">
                      {r.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="mt-10 border-t border-gray-100 pt-8 max-lg:mt-6 max-lg:pt-5">
          <Link
            href="/blog"
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-primary hover:text-red-700 lg:min-h-0"
          >
            ← Wróć do bloga
          </Link>
        </div>

      </div>
    </>
  );
}
