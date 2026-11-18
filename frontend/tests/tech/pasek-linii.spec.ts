/** Runda 18.11 §1.4 (D11, MOTYW-PASEK-LINII §4): the brand bar — pill, living dash, description, entrance. */
import { expect, test, type Page } from "@playwright/test";
import { lines } from "../../config/prokom";
import { pinDaylight } from "./zegar";

const pillX = (page: Page) => page.locator(".t-brandbar__lines").evaluate((el) => (el as HTMLElement).style.getPropertyValue("--pill-x"));

test.describe("desktop 1440", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("height stays 38 px and the capsule does not move", async ({ page }) => {
    await pinDaylight(page);
    await page.goto("/");
    expect((await page.locator(".t-brandbar__in").boundingBox())!.height).toBe(38);
    // capsule right under the bar (8 px padding), as before
    const bar = (await page.locator(".t-brandbar").boundingBox())!;
    const cap = (await page.locator(".t-capsule").boundingBox())!;
    expect(cap.y - (bar.y + bar.height)).toBeLessThanOrEqual(10);
  });

  test("the pill follows the pointer and comes back under the current line", async ({ page }) => {
    await pinDaylight(page);
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Linie PRO-KOM" });
    const current = nav.locator('a[aria-current="page"]');
    await expect(current).toHaveText("Tech");
    await expect.poll(() => pillX(page)).not.toBe("");
    const atCurrent = await pillX(page);
    await nav.getByRole("link", { name: "Biznes" }).hover();
    await expect.poll(() => pillX(page)).not.toBe(atCurrent);
    await page.mouse.move(700, 600);
    await expect.poll(() => pillX(page)).toBe(atCurrent);
  });

  test("the dash grows to 18 px on hover; the current line keeps 18 px", async ({ page }) => {
    await pinDaylight(page);
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Linie PRO-KOM" });
    const biznes = nav.getByRole("link", { name: "Biznes" });
    await expect(nav.locator('a[aria-current="page"] .t-dash')).toHaveCSS("width", "18px");
    await expect(biznes.locator(".t-dash")).toHaveCSS("width", "11px");
    await biznes.hover();
    await expect(biznes.locator(".t-dash")).toHaveCSS("width", "18px");
  });

  test("description after 350 ms of pointing, at once on focus; tied with aria-describedby", async ({ page }) => {
    await pinDaylight(page);
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Linie PRO-KOM" });
    const software = nav.getByRole("link", { name: "Software" });
    await software.hover();
    await page.waitForTimeout(150);
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    const desc = lines.find((l) => l.key === "software")!.description;
    await expect(page.getByRole("tooltip")).toHaveText(desc);
    await expect(software).toHaveAttribute("aria-describedby", /.+/);
    await page.mouse.move(700, 600);
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    // keyboard
    await nav.getByRole("link", { name: "Instalacje" }).focus();
    await expect(page.getByRole("tooltip")).toHaveText(lines.find((l) => l.key === "instalacje")!.description);
    // the tip paints above the capsule: the header is lifted over the capsule while it shows
    // (elementFromPoint cannot be used: the tip has pointer-events: none)
    await expect(page.locator(".t-header")).toHaveCSS("z-index", "910");
    await page.mouse.move(700, 600);
    await nav.getByRole("link", { name: "Instalacje" }).blur();
    await expect(page.locator(".t-header")).toHaveCSS("z-index", "900");
  });

  test("general number with the „Infolinia” label on the right", async ({ page }) => {
    await pinDaylight(page);
    await page.goto("/");
    await expect(page.locator(".t-brandbar__phone")).toContainText("Infolinia:");
  });

  test("entrance once per visit", async ({ page }) => {
    await pinDaylight(page);
    await page.goto("/");
    await expect(page.locator(".t-brandbar__lines")).toHaveClass(/is-enter/);
    await page.goto("/kontakt");
    await expect(page.locator(".t-brandbar__lines")).not.toHaveClass(/is-enter/);
  });
});

test.describe("touch", () => {
  test.use({ viewport: { width: 1280, height: 800 }, hasTouch: true, isMobile: false });
  test("no description on a tap", async ({ page }) => {
    await pinDaylight(page);
    await page.goto("/");
    await page.route("https://prokombiznes.pl/**", (r) => r.abort());
    const biznes = page.getByRole("navigation", { name: "Linie PRO-KOM" }).getByRole("link", { name: "Biznes" });
    await biznes.dispatchEvent("pointerover", { pointerType: "touch", bubbles: true });
    await page.waitForTimeout(500);
    await expect(page.getByRole("tooltip")).toHaveCount(0);
  });
});
