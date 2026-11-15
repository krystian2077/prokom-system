/**
 * TD5b: repair pages without `published && verified` are not in the production build
 * (404 in the Tech skin) and not in the sitemap (SPEC §12.4).
 */
import { expect, test } from "@playwright/test";
import { repairPages } from "@/config/naprawy";
import { liveRepairs, repairPath } from "@/lib/tech/naprawy";

test("unverified repair pages: 404 in production and absent from sitemap.xml", async ({ page, request }) => {
  const live = new Set(liveRepairs().map((p) => p.slug));
  const drafts = repairPages.filter((p) => !live.has(p.slug));
  test.skip(process.env.NEXT_PUBLIC_TECH_DRAFT === "1", "staging build shows drafts");
  for (const p of drafts.slice(0, 3)) {
    const res = await page.goto(repairPath(p.slug));
    expect(res?.status(), p.slug).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Nie ma takiej strony");
  }
  const xml = await (await request.get("/sitemap.xml")).text();
  for (const p of drafts) expect(xml).not.toContain(repairPath(p.slug));
});
