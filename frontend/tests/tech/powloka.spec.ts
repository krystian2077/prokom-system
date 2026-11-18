/** TD1 PR 2: shell behaviour (SPEC §6–§7, §12.1, RESPONSYWNOSC §2–§4). */
import { expect, test } from "@playwright/test";
import { pinDaylight } from "./zegar";

test.describe("desktop 1440", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("mega menu: hover with bridge and close delay, click, Esc", async ({ page }) => {
    await page.goto("/");
    const trigger = page.locator(".t-capsule").getByRole("button", { name: "Naprawy" });
    const panel = page.locator(".t-mega").first();
    await trigger.hover();
    await expect(panel).toBeVisible();
    // move down across the bridge into the panel — stays open
    const box = (await trigger.boundingBox())!;
    await page.mouse.move(box.x + 20, box.y + box.height + 12, { steps: 4 });
    await page.mouse.move(box.x + 60, box.y + box.height + 60, { steps: 4 });
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("link", { name: "Serwis laptopów" })).toBeVisible();
    // leave (under the full-width panel) → closes after the delay, not immediately
    const below = (await panel.locator(".t-mega__panel").boundingBox())!;
    await page.mouse.move(700, Math.min(890, below.y + below.height + 60));
    await expect(panel).toBeVisible();
    await expect(panel).toBeHidden({ timeout: 1500 });
    // click + Esc
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("points mega menu and footer show both published points", async ({ page }) => {
    await page.goto("/");
    await page.locator(".t-capsule").getByRole("button", { name: "Punkty serwisowe" }).click();
    const panel = page.locator(".t-mega").nth(1);
    await expect(panel.getByText("Rabka-Zdrój", { exact: true })).toBeVisible();
    await expect(panel.getByText("Zakopane", { exact: true })).toBeVisible();
    await expect(page.locator(".t-footer")).toContainText("Zakopane");
  });

  test("brand bar opening status appears after hydration with the literal from SPEC §12.1", async ({ page }) => {
    await page.goto("/");
    const status = page.locator(".t-brandbar .t-status").first();
    // two published points → each status starts with the point name, e.g. "Rabka-Zdrój: Otwarte do 17:00"
    await expect(status).toHaveText(/^(?:(?:Rabka-Zdrój|Zakopane): )?(Otwarte do \d{1,2}:\d{2}|Zamykamy za \d+ min|Otwieramy dziś o \d{1,2}:\d{2}|Zamknięte( dziś \(.+\))? · otwieramy .+ o \d{1,2}:\d{2})$/);
  });

  test("theme toggle switches data-tech-theme only", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await pinDaylight(page);
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-tech-theme", "light");
    const before = await html.getAttribute("data-theme");
    await page.locator("[data-tech-theme-toggle]").click();
    await expect(html).toHaveAttribute("data-tech-theme", "dark");
    expect(await html.getAttribute("data-theme")).toBe(before);
    expect(await page.evaluate(() => localStorage.getItem("pk-theme"))).toBe("dark");
    expect(await page.evaluate(() => localStorage.getItem("prokom-theme"))).toBeNull();
  });

  test("no tab bar on desktop, footer and legal bar present", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-t-tabbar]")).toBeHidden();
    await expect(page.locator('[data-t-region="footer"]')).toContainText("Jedna firma — linie PRO-KOM");
    await expect(page.locator('[data-t-region="footer"] a[aria-current="page"]', { hasText: "prokomserwis.pl" })).toBeVisible();
  });
});

test.describe("phone 390", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("Menu sheet: opens, focus inside, Esc closes and focus returns", async ({ page }) => {
    await page.goto("/");
    const menuBtn = page.locator("[data-t-tabbar]").getByRole("button", { name: "Menu" });
    await menuBtn.click();
    const dialog = page.getByRole("dialog", { name: "Menu" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Hammer Glass" })).toBeVisible();
    await expect(dialog.getByRole("radiogroup", { name: "Motyw" })).toBeVisible();
    // focus moves into the sheet after a short timer — poll instead of a one-shot check
    await expect.poll(() => page.evaluate(() => document.activeElement?.closest("[role=dialog]") !== null)).toBe(true);
    // focus trap: many Tabs stay inside
    for (let i = 0; i < 30; i++) await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.closest("[role=dialog]") !== null)).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(menuBtn).toBeFocused();
  });

  test("Menu sheet: theme Jasny / Ciemny / Auto", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await pinDaylight(page);
    await page.goto("/");
    await page.locator("[data-t-tabbar]").getByRole("button", { name: "Menu" }).click();
    await page.getByRole("radio", { name: "Ciemny" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-tech-theme", "dark");
    await page.getByRole("radio", { name: "Auto" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-tech-theme", "light");
    expect(await page.evaluate(() => localStorage.getItem("pk-theme"))).toBeNull();
  });

  test("Menu sheet: phone number in 2 taps", async ({ page }) => {
    await page.goto("/");
    await page.locator("[data-t-tabbar]").getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("dialog").locator('a[href^="tel:"]')).toBeVisible();
  });

  test("Naprawy tab opens the repairs sheet; the capsule loupe opens the search window", async ({ page }) => {
    await page.goto("/");
    await page.locator("[data-t-tabbar]").getByRole("button", { name: "Naprawy" }).click();
    await expect(page.getByRole("dialog", { name: "Naprawy" }).getByRole("link", { name: "Laptopy" })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.locator(".t-capsule").getByRole("button", { name: "Szukaj" }).click();
    const dialog = page.getByRole("dialog", { name: "Szukaj na stronie" });
    await dialog.getByRole("combobox").fill("drukar");
    await expect(dialog.getByRole("option", { name: /Serwis drukarek/ }).first()).toBeVisible();
    await expect(dialog.getByRole("option", { name: /^Blog$/ })).toHaveCount(0);
  });

  test("capsule hides on scroll down and returns on scroll up", async ({ page }) => {
    await page.goto("/");
    const cap = page.locator(".t-capwrap");
    await page.mouse.wheel(0, 900);
    await expect(cap).toHaveClass(/is-hidden/);
    await page.mouse.wheel(0, -300);
    await expect(cap).not.toHaveClass(/is-hidden/);
  });

  test("tab bar: Start is current on /", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-t-tabbar]").getByRole("link", { name: "Start" })).toHaveAttribute("aria-current", "page");
  });
});
