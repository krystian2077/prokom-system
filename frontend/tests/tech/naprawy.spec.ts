/**
 * TD5b: only `published && verified` repair pages are in the production build and the
 * sitemap (SPEC §12.4). Since 15.11.2026 all 12 texts are accepted, so they must be live;
 * any page without `verified` would still be a 404 in the Tech skin.
 */
import { expect, test } from "@playwright/test";
import { repairPages } from "@/config/naprawy";
import { liveRepairs, repairPath } from "@/lib/tech/naprawy";

test("verified repair pages: 200 in production and listed in sitemap.xml", async ({ page, request }) => {
  const live = liveRepairs();
  expect(live.length).toBeGreaterThan(0);
  for (const p of live.slice(0, 3)) {
    const res = await page.goto(repairPath(p.slug));
    expect(res?.status(), p.slug).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(p.h1);
  }
  const xml = await (await request.get("/sitemap.xml")).text();
  for (const p of live) expect(xml).toContain(repairPath(p.slug));
});

test("unverified repair pages: 404 in production and absent from sitemap.xml", async ({ page, request }) => {
  const live = new Set(liveRepairs().map((p) => p.slug));
  const drafts = repairPages.filter((p) => !live.has(p.slug));
  test.skip(process.env.NEXT_PUBLIC_TECH_DRAFT === "1", "staging build shows drafts");
  test.skip(drafts.length === 0, "all repair pages are accepted (15.11.2026)");
  for (const p of drafts.slice(0, 3)) {
    const res = await page.goto(repairPath(p.slug));
    expect(res?.status(), p.slug).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Nie ma takiej strony");
  }
  const xml = await (await request.get("/sitemap.xml")).text();
  for (const p of drafts) expect(xml).not.toContain(repairPath(p.slug));
});

test("every live repair page is linked from the hub /uslugi; device pages do not list them", async ({ page }) => {
  await page.goto("/uslugi");
  for (const p of liveRepairs()) await expect(page.locator(`#konkretne-naprawy a[href="${repairPath(p.slug)}"]`), p.slug).toHaveCount(1);
  for (const path of ["/serwis-laptopow", "/serwis-telefonow"]) {
    await page.goto(path);
    await expect(page.locator("#konkretne-naprawy")).toHaveCount(0);
  }
});
