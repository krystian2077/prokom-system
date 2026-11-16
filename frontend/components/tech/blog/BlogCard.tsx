import Link from "next/link";
import type { BlogPost } from "@/lib/blog-posts";
import { categoryOf } from "@/lib/tech/blog-taxonomy";
import { formatPostDate } from "@/lib/tech/blog-render";

export type BlogCardData = Pick<BlogPost, "slug" | "title" | "description" | "date" | "readingTime" | "category" | "tags">;

export function BlogCard({ post, big = false, showCategory = true }: { post: BlogCardData; big?: boolean; showCategory?: boolean }) {
  const cat = categoryOf(post);
  return (
    <Link href={`/blog/${post.slug}`} className={`t-card t-bcard${big ? " t-bcard--big" : ""}`}>
      <span className="t-bcard__meta">
        {showCategory ? <span className="t-bcard__cat">{cat.name}</span> : null}
        <span>
          {formatPostDate(post.date)} · {post.readingTime}
        </span>
      </span>
      <span className="t-bcard__title">{post.title}</span>
      <span className="t-bcard__desc">{post.description}</span>
      <span className="t-bcard__more">Czytaj →</span>
    </Link>
  );
}
