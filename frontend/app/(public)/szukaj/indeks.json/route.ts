import { buildSearchIndex } from "@/lib/tech/search/build-index";

/**
 * The search index of the window (`SearchDialog`) as JSON, built once at build time from the Tech
 * data — no backend, no external service. Fetched when the browser is idle. Not a page: never
 * in the sitemap; `noindex` header so a crawler that finds it does not list it.
 */
export const dynamic = "force-static";

export function GET() {
  return Response.json(buildSearchIndex(), {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400", "X-Robots-Tag": "noindex" },
  });
}
