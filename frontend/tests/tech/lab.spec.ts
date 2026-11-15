/**
 * TP PR 4: /lab exists only with NEXT_PUBLIC_TECH_DRAFT=1 (docs/tech/PREMIUM.md §6).
 * The e2e suite runs against a production build (no draft flag) → every /lab route is 404,
 * noindex and outside the sitemap. With TECH_LAB=1 (draft build) the pages are checked instead.
 */
import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const LAB = ["/lab", "/lab/kreator", "/lab/menu", "/lab/ruch"];
const draftBuild = process.env.TECH_LAB === "1";

test.describe("production build", () => {
  test.skip(draftBuild, "draft build");
  for (const route of LAB) {
    test(`${route} → 404`, async ({ page }) => {
      const res = await page.goto(route);
      expect(res?.status()).toBe(404);
      await expect(page.locator(".t-lab")).toHaveCount(0);
    });
  }

  test("sitemap never lists /lab", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).not.toContain("/lab");
    for (const f of ["app/sitemap.ts", "lib/tech/sitemap.ts"]) {
      const file = path.resolve(__dirname, "../..", f);
      if (fs.existsSync(file)) expect(fs.readFileSync(file, "utf8"), f).not.toMatch(/\/lab/);
    }
  });
});

test.describe("draft build (TECH_LAB=1)", () => {
  test.skip(!draftBuild, "production build");
  test.use({ viewport: { width: 1440, height: 900 } });

  test("lab pages render with noindex", async ({ page }) => {
    for (const route of LAB) {
      const res = await page.goto(route);
      expect(res?.status(), route).toBe(200);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    }
  });

  test("/lab/kreator shows all 66 pairs as posters and plays one", async ({ page }) => {
    await page.goto("/lab/kreator");
    await expect(page.locator("[data-pair]")).toHaveCount(66);
    await expect(page.locator("[data-pair] .t-scene.is-poster")).toHaveCount(66);
    const first = page.locator("[data-pair]").first();
    await first.getByRole("button", { name: /Odtwórz/ }).click();
    await expect(first.locator(".t-scene")).not.toHaveClass(/is-poster/);
  });
});
