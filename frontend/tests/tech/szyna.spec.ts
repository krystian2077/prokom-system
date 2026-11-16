/**
 * Side rail (SectionRail — the mechanics of the PRO-KOM lines' SiteRail): from 1424 px, in the margin
 * left of the content (never over it), folded to 64 px and opened with labels on hover or focus;
 * a gliding marker follows the section being read, a click glides to the section; on subpages
 * „Na tej stronie” (from 3 sections) and the home page folded into one row; search on top.
 */
import { expect, test } from "@playwright/test";
import { HOME_SECTIONS } from "../../lib/tech/rail";

const RAIL = "nav.t-rail";
/** Visible width of the rail: the clip-path also clips hit testing, so probe it across the first row. */
const visibleWidth = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const rail = document.querySelector(".t-rail") as HTMLElement;
    const r = rail.getBoundingClientRect();
    const y = (rail.querySelector(".t-rail__search") as HTMLElement).getBoundingClientRect().top + 20;
    let w = 0;
    for (let x = r.left + 2; x < r.right; x += 4) if (rail.contains(document.elementFromPoint(x, y))) w = x - r.left;
    return w;
  });

for (const width of [1440, 1680, 1920]) {
  test(`rail sits in the margin, clear of the content @${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const url of ["/", "/punkty-serwisowe", "/hammer-glass", "/o-firmie"]) {
      await page.goto(url);
      await expect(page.locator(RAIL)).toBeVisible();
      const gap = await page.evaluate(() => {
        const r = document.querySelector(".t-rail")!.getBoundingClientRect();
        const folded = r.left + 64;
        const c = document.querySelector("main .t-container") as HTMLElement;
        const left = c.getBoundingClientRect().left + parseFloat(getComputedStyle(c).paddingLeft);
        return { before: r.left, after: left - folded };
      });
      expect(gap.after, url).toBeGreaterThanOrEqual(8);
      expect(Math.abs(gap.before - gap.after), `${url}: centred in the margin`).toBeLessThan(12);
    }
  });
}

test("no rail below 1424 px; on short pages only search, home page and the action", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/");
  await expect(page.locator(RAIL)).toBeHidden();
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const url of ["/blog", "/regulamin", "/nie-ma-takiej-strony"]) {
    await page.goto(url);
    const rail = page.locator(RAIL);
    await expect(rail, url).toBeVisible();
    await expect(rail.getByRole("group", { name: "Na tej stronie" }), url).toHaveCount(0);
    await expect(rail.getByRole("button", { name: /Strona główna/ }), url).toBeVisible();
    await expect(rail.getByRole("link", { name: "Zgłoś naprawę" }), url).toHaveAttribute("href", "/zgloszenie");
  }
});

test("home page: every section in the list, each with an icon, the home group list matches /", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const ids = await page.locator("main [data-rail][id]").evaluateAll((els) => els.map((e) => e.id));
  expect(ids).toEqual(HOME_SECTIONS.map((s) => s.id));
  const links = page.locator(`${RAIL} .t-rail__list a`);
  await expect(links).toHaveCount(ids.length);
  for (const link of await links.all()) await expect(link.locator(".t-rail__icon svg")).toHaveCount(1);
});

test("folded to 64 px, opens with labels on hover, Esc folds it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const rail = page.locator(RAIL);
  await page.mouse.move(900, 600);
  await expect.poll(() => visibleWidth(page)).toBeLessThan(70);
  await page.locator(`${RAIL} .t-rail__search .t-rail__icon`).hover();
  await expect.poll(() => visibleWidth(page)).toBeGreaterThan(240);
  await expect(rail.locator(".t-rail__list a").first().locator(".t-rail__label")).toHaveCSS("opacity", "1");
  // Esc with the focus in the rail (keyboard) folds it and leaves the focus where it is
  await page.mouse.move(900, 600);
  await rail.locator(".t-rail__list a").first().focus();
  await expect.poll(() => visibleWidth(page)).toBeGreaterThan(240);
  await page.keyboard.press("Escape");
  await expect(rail.locator(".t-rail__list a").first()).toBeFocused();
  await expect(rail).toHaveAttribute("data-collapsed");
  await expect.poll(() => visibleWidth(page)).toBeLessThan(70);
});

test("current section follows scrolling; a click glides there and moves the marker", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/o-firmie");
  const rail = page.locator(RAIL);
  await expect(rail.locator('a[aria-current="location"]')).toHaveAttribute("href", "#o-firmie");
  const markerBefore = await rail.locator(".t-rail__marker").boundingBox();
  // keyboard: Tab into the rail opens it, Enter on a section glides to it
  await rail.locator('a[href="#zasady"]').focus();
  await expect.poll(() => visibleWidth(page)).toBeGreaterThan(240);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#zasady$/);
  await expect.poll(() => page.evaluate(() => Math.round(document.getElementById("zasady")!.getBoundingClientRect().top))).toBeLessThan(140);
  await expect(rail.locator('a[aria-current="location"]')).toHaveAttribute("href", "#zasady");
  await expect.poll(async () => (await rail.locator(".t-rail__marker").boundingBox())!.y).toBeGreaterThan(markerBefore!.y + 30);
  await expect(page.locator("#zasady")).toBeFocused();
  // the bottom of the page marks the last section and shows „Do góry”
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" as ScrollBehavior }));
  const last = await rail.getByRole("group", { name: "Na tej stronie" }).locator("a").last().getAttribute("href");
  await expect(rail.locator('a[aria-current="location"]')).toHaveAttribute("href", last!);
  await expect(rail.locator(".t-rail__up")).toHaveAttribute("data-shown", "");
});

test("subpage: „Na tej stronie” and the folded home page group (remembered for the visit)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/serwis-laptopow");
  const rail = page.locator(RAIL);
  await expect(rail.getByRole("group", { name: "Na tej stronie" })).toBeVisible();
  const toggle = rail.getByRole("button", { name: /Strona główna/ });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  const home = rail.getByRole("group", { name: "Strona główna" });
  await expect(home.locator("a")).toHaveCount(HOME_SECTIONS.length);
  await expect(home.locator("a").first()).toHaveAttribute("href", "/#start");
  await page.goto("/hammer-glass");
  await expect(rail.getByRole("button", { name: /Strona główna/ })).toHaveAttribute("aria-expanded", "true");
});

test("„Szukaj” on top opens the search window", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.locator(`${RAIL} .t-rail__search`).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Szukaj na stronie" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Szukaj na stronie" })).toBeFocused();
});
