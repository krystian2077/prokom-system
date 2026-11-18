/**
 * Runda 18.11 §1.1 (D13): the capsule stays on screen while the page scrolls — on the home page
 * and on a subpage, on desktop and on a phone. Scrolling down hides it, scrolling up brings it back
 * (like the other PRO-KOM lines). The capsule used to sit inside `.t-header`, so its `sticky`
 * only held within that short box and it scrolled away with the brand bar.
 */
import { expect, test, type Page } from "@playwright/test";

const PAGES = ["/", "/punkty-serwisowe"];

/** Top edge of the capsule once its transitions settle (hide/show 260 ms, narrowing 320 ms). */
async function capsuleTop(page: Page): Promise<number> {
  await page.waitForTimeout(450);
  return (await page.locator(".t-capsule").boundingBox())!.y;
}

async function scrollTo(page: Page, y: number) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
}

for (const viewport of [
  { name: "desktop 1440", width: 1440, height: 900 },
  { name: "telefon 390", width: 390, height: 844 },
]) {
  test.describe(viewport.name, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const path of PAGES) {
      test(`${path}: capsule stays in view after scrolling, hides going down, returns going up`, async ({ page }) => {
        await page.goto(path);
        const wrap = page.locator(".t-capwrap");

        // 1500 px down the page, then a nudge up: the capsule is parked at the top of the viewport
        // (before the fix it had scrolled away with the brand bar, ~1450 px above the viewport)
        await scrollTo(page, 1500);
        await page.mouse.move(viewport.width / 2, viewport.height / 2);
        await page.mouse.wheel(0, -120);
        await expect(wrap).not.toHaveClass(/is-hidden/);
        const parked = await capsuleTop(page);
        expect(parked).toBeGreaterThanOrEqual(0);
        expect(parked).toBeLessThanOrEqual(16);

        // reading on: scrolling down hides it above the viewport
        await page.mouse.wheel(0, 400);
        await expect(wrap).toHaveClass(/is-hidden/);
        const box = (await page.locator(".t-capsule").boundingBox())!;
        await page.waitForTimeout(450);
        expect((await page.locator(".t-capsule").boundingBox())!.y + box.height).toBeLessThanOrEqual(1);

        // scrolling up brings it back where it was parked
        await page.mouse.wheel(0, -200);
        await expect(wrap).not.toHaveClass(/is-hidden/);
        const back = await capsuleTop(page);
        expect(back).toBeGreaterThanOrEqual(0);
        expect(back).toBeLessThanOrEqual(16);
      });
    }
  });
}

test.describe("desktop 1440 — mega menu", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("an open mega menu keeps the capsule on screen while scrolling down", async ({ page }) => {
    await page.goto("/");
    await scrollTo(page, 1500);
    await page.locator(".t-capsule").getByRole("button", { name: "Naprawy" }).click();
    await expect(page.locator(".t-capwrap")).toHaveClass(/is-mega/);
    await page.evaluate(() => window.scrollBy({ top: 300, behavior: "instant" }));
    await page.waitForTimeout(200);
    await expect(page.locator(".t-capwrap")).not.toHaveClass(/is-hidden/);
  });

  test("anchors land below the capsule", async ({ page }) => {
    await page.goto("/#dlaczego");
    await page.waitForTimeout(450);
    const cap = (await page.locator(".t-capsule").boundingBox())!;
    const section = (await page.locator("#dlaczego").boundingBox())!;
    expect(section.y).toBeGreaterThanOrEqual(cap.y + cap.height - 1);
  });
});
