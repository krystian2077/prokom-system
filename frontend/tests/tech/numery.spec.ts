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

  for (const path of ["/kontakt"]) {
    test(`${path}: big point numbers, the general line only as a small note`, async ({ page }) => {
      await page.goto(path);
      const big = page.locator(".t-bigphones").first();
      for (const p of points) {
        const item = big.locator(".t-bigphones__item", { has: page.locator(`a[href="${telHref(p.phone)}"]`) });
        await expect(item).toContainText(p.name);
        // boss 22.11: each point's own mailbox under its number
        await expect(item.locator(`a[href="mailto:${p.email}"]`)).toBeVisible();
      }
      const note = page.locator(".t-genline").first();
      await expect(note).toContainText("Infolinia");
      await expect(note.locator(`a[href="${general}"]`)).toBeVisible();
      const bigSize = await big.locator(".t-bigphones__tel").first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
      const noteSize = await note.evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
      expect(bigSize).toBeGreaterThan(noteSize * 2);
    });
  }

  test("/punkty-serwisowe: each salon card has its own big number and mailbox; the general line is a note (23.11)", async ({ page }) => {
    await page.goto("/punkty-serwisowe");
    for (const p of points) {
      const card = page.locator(`#${p.key}`);
      await expect(card.locator(`.t-pccontact a[href="${telHref(p.phone)}"]`)).toBeVisible();
      await expect(card.locator(`.t-pccontact a[href="mailto:${p.email}"]`)).toBeVisible();
      await expect(card.locator(".t-pcmap")).toBeVisible();
    }
    await expect(page.locator("main .t-genline")).toContainText("Infolinia");
    // one path, no repeats: no hero phone cards and no phone CTA band on this page
    await expect(page.locator("main .t-bigphones")).toHaveCount(0);
    await expect(page.locator("main .t-ctaband")).toHaveCount(0);
  });

  test("footer: each point card carries its own number; the general line is a note", async ({ page }) => {
    await page.goto("/o-firmie");
    const footer = page.locator(".t-footer");
    for (const p of points) {
      await expect(footer.locator(`.t-footer__card a[href="${telHref(p.phone)}"]`)).toHaveCount(1);
      await expect(footer.locator(`.t-footer__card a[href="mailto:${p.email}"]`)).toHaveCount(1);
    }
    await expect(footer.locator(".t-genline")).toContainText("Infolinia");
  });
});

test.describe("1440 point pages", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.beforeEach(async ({ page }) => pinDaylight(page));
  const [rabka, zakopane] = points;
  for (const [path, own, other] of [
    ["/serwis-telefonow-rabka-zdroj", rabka, zakopane],
    ["/serwis-telefonow-zakopane", zakopane, rabka],
  ] as const) {
    test(`${path}: the point's own e-mail in the body, never the other point's`, async ({ page }) => {
      await page.goto(path);
      const main = page.locator("main");
      await expect(main.locator(`a[href="mailto:${own.email}"]`).first()).toBeVisible();
      await expect(main).not.toContainText(other.email!);
    });
  }
});