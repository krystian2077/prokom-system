import Link from "next/link";
import { BLOG_CATEGORIES, postsInCategory, type BlogCategorySlug } from "@/lib/tech/blog-taxonomy";
import { BLOG_POSTS } from "@/lib/blog-posts";

/** Category bar as real links (addresses, not a JS filter — SPEC §12.11). */
export function BlogCategoryBar({ current }: { current: BlogCategorySlug | null }) {
  const items = [
    { href: "/blog", label: "Wszystkie", n: BLOG_POSTS.length, on: current === null },
    ...BLOG_CATEGORIES.map((c) => ({ href: `/blog/kategoria/${c.slug}`, label: c.name, n: postsInCategory(c.slug).length, on: current === c.slug })),
  ];
  return (
    <nav aria-label="Kategorie bloga" className="t-bcats">
      <ul>
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className={`t-bcats__link${i.on ? " is-on" : ""}`} aria-current={i.on ? "page" : undefined} data-track={i.on ? undefined : "blog_kategoria"}>
              {i.label}
              <span>{i.n}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
