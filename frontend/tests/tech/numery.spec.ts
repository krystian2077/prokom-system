/** Boss 22.11: the points' own numbers are the main ones; the general line is only a quiet „Infolinia” note. */
import { expect, test } from "@playwright/test";
import { line, servicePoints, telHref } from "@/config/prokom";
import { pinDaylight } from "./zegar";

const points = servicePoints.filter((p) => p.published);
const general = telHref(line.phone);

for (const width of [1440, 390]) {
  test.describe(`${width}`, () => {
    test.use({ viewport: { width, height: 900 } });
    test.beforeEach(async ({ page }) => pinDaylight(page));

    test("home hero: one call button per point, no general number", async ({ page }) => {
      await page.goto("/");
      const hero = page.locator("#start");
      for (const p of points) await expect(hero.locator(`a[href="${telHref(p.phone)}"]`)).toBeVisible();
      await expect(hero.locator(`a[href="${general}"]`)).toHaveCount(0);
    });

    test("sub-page hero and CTA band: the points' numbers", async ({ page }) => {
      await page.goto("/uslugi");
      const hero = page.locator("#start");
      for (const p of points) await expect(hero.locator(`a[href="${telHref(p.phone)}"]`)).toBeVisible();
      await expect(hero.locator(`a[href="${general}"]`)).toHaveCount(0);
      const band = page.locator(".t-ctaband");
      for (const p of points) await expect(band.locator(`a[href="${telHref(p.phone)}"]`)).toHaveCount(1);
    });
  });
}

test.describe("1440 contact", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.beforeEach(async ({ page }) => pinDaylight(page));

  for (const path of ["/kontakt", "/punkty-serwisowe"]) {
    test(`${path}: big point numbers, the general line only as a small note`, async ({ page }) => {
      await page.goto(path);
      const big = page.locator(".t-bigphones").first();
      for (const p of points) await expect(big.locator(`a[href="${telHref(p.phone)}"]`)).toContainText(p.name);
      const note = page.locator(".t-genline").first();
      await expect(note).toContainText("Infolinia");
      await expect(note.locator(`a[href="${general}"]`)).toBeVisible();
      const bigSize = await big.locator("b").first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
      const noteSize = await note.evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
      expect(bigSize).toBeGreaterThan(noteSize * 2);
    });
  }

  test("footer: each point card carries its own number; the general line is a note", async ({ page }) => {
    await page.goto("/o-firmie");
    const footer = page.locator(".t-footer");
    for (const p of points) await expect(footer.locator(`.t-footer__card a[href="${telHref(p.phone)}"]`)).toHaveCount(1);
    await expect(footer.locator(".t-genline")).toContainText("Infolinia");
  });
});
