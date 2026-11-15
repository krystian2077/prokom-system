/**
 * Blog taxonomy (SPEC §12.11): every post in exactly one of 4 categories, ≥ 6 per category,
 * no duplicate slugs, no links to removed pages, Zakopane in intros only when published.
 */
import { describe, expect, it } from "vitest";
import { servicePoints } from "@/config/prokom";
import { BLOG_POSTS } from "@/lib/blog-posts";
import { BLOG_CATEGORIES, categoryIntro, categoryOf, postsInCategory, relatedPosts, serviceLinkOf } from "@/lib/tech/blog-taxonomy";

describe("blog — taksonomia", () => {
  it("no duplicate slugs in BLOG_POSTS (the second copy is removed)", () => {
    const slugs = BLOG_POSTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toContain("na-co-uwazac-przy-zakupie-sprzetu-poleasingowego");
    expect(BLOG_POSTS.length).toBe(48);
  });

  it("every post belongs to exactly one category", () => {
    for (const p of BLOG_POSTS) {
      const hits = BLOG_CATEGORIES.filter((c) => postsInCategory(c.slug).some((x) => x.slug === p.slug));
      expect(hits.length, p.slug).toBe(1);
      expect(hits[0].slug).toBe(categoryOf(p).slug);
    }
  });

  it("no category has fewer than 6 posts (16 / 15 / 8 / 9)", () => {
    const counts = Object.fromEntries(BLOG_CATEGORIES.map((c) => [c.slug, postsInCategory(c.slug).length]));
    for (const n of Object.values(counts)) expect(n).toBeGreaterThanOrEqual(6);
    expect(counts).toEqual({ telefony: 16, "laptopy-i-komputery": 15, drukarki: 8, "porady-zakupowe": 9 });
  });

  it("service links never point to removed /akcesoria or /oferta", () => {
    for (const p of BLOG_POSTS) {
      const link = serviceLinkOf(p);
      if (link) expect(["/akcesoria", "/oferta"], p.slug).not.toContain(link.href);
    }
    // links to existing pages are kept as they are
    const keep = BLOG_POSTS.find((p) => p.relatedServiceHref === "/serwis-drukarek")!;
    expect(serviceLinkOf(keep)).toEqual({ href: "/serwis-drukarek", label: keep.relatedServiceLabel });
  });

  it("category page descriptions fit 120–155 and titles fit 60", () => {
    for (const c of BLOG_CATEGORIES) {
      expect(c.description.length, c.slug).toBeGreaterThanOrEqual(120);
      expect(c.description.length, c.slug).toBeLessThanOrEqual(155);
      expect(`${c.name} — porady serwisu | PRO-KOM Tech`.length).toBeLessThanOrEqual(60);
    }
  });

  it("intros mention Zakopane only when the point is published", () => {
    const rabka = servicePoints.map((p) => ({ ...p, published: p.key === "rabka" }));
    const both = servicePoints.map((p) => ({ ...p, published: true }));
    for (const c of BLOG_CATEGORIES) {
      expect(categoryIntro(c, rabka)).not.toMatch(/Zakopan|\{punkty\}/);
    }
    expect(categoryIntro(BLOG_CATEGORIES[0], both)).toMatch(/Zakopanem/);
  });

  it("related posts fall back to the same new category", () => {
    const post = BLOG_POSTS.find((p) => !p.relatedSlugs?.length) ?? { ...BLOG_POSTS[0], relatedSlugs: [] };
    for (const r of relatedPosts({ ...post, relatedSlugs: [] })) expect(categoryOf(r).slug).toBe(categoryOf(post).slug);
  });
});
