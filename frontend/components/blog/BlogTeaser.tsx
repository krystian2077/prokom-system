import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog-posts";
import { getCategoryStyle } from "@/lib/blog-categories";

interface BlogTeaserProps {
  /** Filtruj wpisy po kategorii. Brak = wszystkie. */
  category?: string;
  /** Wiele kategorii — alternatywa do `category` */
  categories?: string[];
  /** Ile wpisów pokazać (domyślnie 3) */
  limit?: number;
  /** Nagłówek sekcji */
  heading?: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function BlogTeaser({
  category,
  categories,
  limit = 3,
  heading = "Poradniki i blog",
}: BlogTeaserProps) {
  const posts = [...BLOG_POSTS]
    .filter((p) => {
      if (categories && categories.length > 0) return categories.includes(p.category);
      if (category) return p.category === category;
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);

  if (posts.length === 0) return null;

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-prokom-gray">
            Z naszego bloga
          </p>
          <h2 className="text-2xl font-extrabold text-prokom-black">{heading}</h2>
        </div>
        <Link
          href="/blog"
          className="hidden items-center gap-1.5 text-sm font-bold text-primary hover:text-red-700 sm:inline-flex"
        >
          Wszystkie artykuły →
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => {
          const cs = getCategoryStyle(post.category);
          return (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
              <article className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-card transition-all hover:border-red-200 hover:shadow-md">
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cs.pill}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${cs.dot}`} />
                    {post.category}
                  </span>
                </div>
                <h3 className="flex-1 text-sm font-bold leading-snug text-prokom-black transition-colors group-hover:text-primary">
                  {post.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-prokom-gray">
                  {post.description}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-xs text-prokom-gray">{formatDate(post.date)}</span>
                  <span className="text-xs font-bold text-primary">Czytaj →</span>
                </div>
              </article>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 sm:hidden">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-red-700"
        >
          Wszystkie artykuły →
        </Link>
      </div>
    </section>
  );
}
