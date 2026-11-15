/**
 * Side rail (SectionRail, przegląd wizualny): only on wide screens and pages with ≥ 3 sections,
 * centred in the margin left of the content (never over it), current section follows scrolling.
 */
import { expect, test } from "@playwright/test";

for (const width of [1440, 1680, 1920]) {
  test(`rail sits in the margin, clear of the content @${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const url of ["/", "/punkty-serwisowe", "/hammer-glass", "/o-firmie"]) {
      await page.goto(url);
      const rail = page.locator("nav.t-rail");
      await expect(rail).toBeVisible();
      const gap = await page.evaluate(() => {
        const r = document.querySelector(".t-rail")!.getBoundingClientRect();
        const c = document.querySelector("main .t-container") as HTMLElement;
        const left = c.getBoundingClientRect().left + parseFloat(getComputedStyle(c).paddingLeft);
        return { before: r.left, after: left - r.right };
      });
      expect(gap.after, url).toBeGreaterThanOrEqual(8);
      expect(Math.abs(gap.before - gap.after), `${url}: centred in the margin`).toBeLessThan(12);
    }
  });
}

test("no rail below 1424 px and on pages with fewer than 3 sections", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/");
  await expect(page.locator("nav.t-rail")).toBeHidden();
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const url of ["/blog", "/regulamin", "/offline", "/nie-ma-takiej-strony"]) {
    await page.goto(url);
    await expect(page.locator("nav.t-rail"), url).toHaveCount(0);
  }
});

test("current section follows scrolling and clicks; labels show on focus", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/o-firmie");
  const rail = page.locator("nav.t-rail");
  await expect(rail.locator('a[aria-current="location"]')).toHaveAttribute("href", "#o-firmie");
  await rail.locator('a[href="#zasady"]').click();
  await expect(rail.locator('a[aria-current="location"]')).toHaveAttribute("href", "#zasady");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const last = await rail.locator("a[href^='#']").last().getAttribute("href");
  await expect(rail.locator('a[aria-current="location"]')).toHaveAttribute("href", last!);
  // keyboard focus (Tab), so :focus-visible applies
  await rail.locator('a[href="#o-firmie"]').focus();
  await page.keyboard.press("Tab");
  const link = rail.locator('a[href="#wizytowka"]');
  await expect(link).toBeFocused();
  await expect(link.locator(".t-rail__label")).toHaveCSS("opacity", "1");
});
