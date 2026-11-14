/** TP PR 2: premium navigation (docs/tech/PREMIUM.md §3). */
import { expect, test } from "@playwright/test";

test.describe("desktop 1440 — capsule and mega menu", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("keyboard: ↓ opens and focuses the panel, ↑/↓ inside, →/← between items, Esc returns focus, Tab out closes", async ({ page }) => {
    await page.goto("/");
    const naprawy = page.locator(".t-capsule").getByRole("button", { name: "Naprawy" });
    const punkty = page.locator(".t-capsule").getByRole("button", { name: "Punkty serwisowe" });
    await naprawy.focus();
    await page.keyboard.press("ArrowDown");
    await expect(naprawy).toHaveAttribute("aria-expanded", "true");
    const panel = page.locator('.t-mega[data-mega="naprawy"]');
    await expect(panel.getByRole("link", { name: /Serwis telefonów/ })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(panel.getByRole("link", { name: /Serwis laptopów/ })).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    await expect(naprawy).toBeFocused();
    // → moves to the next item and the open menu follows
    await page.keyboard.press("ArrowRight");
    await expect(punkty).toBeFocused();
    await expect(punkty).toHaveAttribute("aria-expanded", "true");
    await expect(naprawy).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("ArrowLeft");
    await expect(naprawy).toBeFocused();
    await expect(naprawy).toHaveAttribute("aria-expanded", "true");
    // Esc closes and the focus stays on the trigger
    await page.keyboard.press("Escape");
    await expect(naprawy).toHaveAttribute("aria-expanded", "false");
    await expect(naprawy).toBeFocused();
    // Enter opens, Tab through the panel, then out of the header → closed
    await page.keyboard.press("Enter");
    await expect(naprawy).toHaveAttribute("aria-expanded", "true");
    for (let i = 0; i < 30; i++) await page.keyboard.press("Tab");
    await expect(naprawy).toHaveAttribute("aria-expanded", "false");
  });

  test("hover intent: a quick pass does not open, resting does", async ({ page }) => {
    await page.goto("/");
    const naprawy = page.locator(".t-capsule").getByRole("button", { name: "Naprawy" });
    const box = (await naprawy.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.move(box.x + box.width / 2, box.y - 60); // left within a few ms
    await page.waitForTimeout(200);
    await expect(naprawy).toHaveAttribute("aria-expanded", "false");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(naprawy).toHaveAttribute("aria-expanded", "true");
  });

  test("safe triangle: moving diagonally into the panel across another trigger keeps the panel", async ({ page }) => {
    await page.goto("/");
    const naprawy = page.locator(".t-capsule").getByRole("button", { name: "Naprawy" });
    const punkty = page.locator(".t-capsule").getByRole("button", { name: "Punkty serwisowe" });
    const n = (await naprawy.boundingBox())!;
    const p = (await punkty.boundingBox())!;
    await page.mouse.move(n.x + n.width - 6, n.y + n.height / 2);
    await expect(naprawy).toHaveAttribute("aria-expanded", "true");
    // cross the lower part of "Punkty" on the way down-right…
    await page.mouse.move(p.x + 8, p.y + p.height - 3, { steps: 3 });
    await page.waitForTimeout(60);
    await expect(naprawy).toHaveAttribute("aria-expanded", "true");
    // …and land in the open panel: still "Naprawy"
    const panel = (await page.locator('.t-mega[data-mega="naprawy"] .t-mega__panel').boundingBox())!;
    await page.mouse.move(p.x + 30, panel.y + 40, { steps: 3 });
    await page.waitForTimeout(300);
    await expect(naprawy).toHaveAttribute("aria-expanded", "true");
    await expect(punkty).toHaveAttribute("aria-expanded", "false");
    // a plain sideways move along the row switches at once
    await page.mouse.move(n.x + n.width / 2, n.y + n.height / 2, { steps: 4 });
    await page.mouse.move(p.x + p.width / 2, p.y + p.height / 2, { steps: 2 });
    await expect(punkty).toHaveAttribute("aria-expanded", "true");
  });

  test("repairs mega menu: devices with top faults and the submit card; page dims", async ({ page }) => {
    await page.goto("/");
    await page.locator(".t-capsule").getByRole("button", { name: "Naprawy" }).click();
    const panel = page.locator('.t-mega[data-mega="naprawy"]');
    await expect(panel.getByText("Pęknięty ekran · Bateria · Nie ładuje").first()).toBeVisible();
    await expect(panel.getByRole("link", { name: "Zgłoś naprawę", exact: true })).toHaveAttribute("href", "/zgloszenie");
    await expect(page.locator(".t-capwrap")).toHaveClass(/is-mega/);
    await expect(page.locator(".t-megascrim")).toHaveCSS("opacity", "1");
  });

  test("points mega menu: published only, Nawiguj and Zadzwoń", async ({ page }) => {
    await page.goto("/");
    await page.locator(".t-capsule").getByRole("button", { name: "Punkty serwisowe" }).click();
    const panel = page.locator('.t-mega[data-mega="punkty"]');
    await expect(panel.locator(".t-mega__point")).toHaveCount(1);
    await expect(panel.getByRole("link", { name: /Nawiguj/ })).toHaveAttribute("href", /google\.com\/maps\/dir/);
    await expect(panel.getByRole("link", { name: /Zadzwoń/ })).toHaveAttribute("href", /^tel:/);
    await expect(panel).not.toContainText(/Zakopane|Staszica/);
  });

  test("capsule sticks and narrows on scroll (transform only)", async ({ page }) => {
    await page.goto("/");
    const capsule = page.locator(".t-capsule");
    const h = (await capsule.boundingBox())!.height;
    await page.mouse.wheel(0, 900);
    await expect(page.locator(".t-capwrap")).toHaveClass(/is-compact/);
    const after = (await capsule.boundingBox())!;
    expect(after.y).toBeLessThan(20);
    expect(await capsule.evaluate((el) => (el as HTMLElement).offsetHeight)).toBe(Math.round(h)); // layout untouched
  });

  test("without JavaScript the mega triggers are plain links", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page.locator(".t-capsule").getByRole("link", { name: "Naprawy" })).toHaveAttribute("href", "/uslugi");
    await expect(page.locator(".t-capsule").getByRole("link", { name: "Punkty serwisowe" })).toHaveAttribute("href", "/punkty-serwisowe");
    await ctx.close();
  });

  test("reduced motion: menu opens at once and content is never hidden", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.locator(".t-capsule").getByRole("button", { name: "Naprawy" }).click();
    await expect(page.locator('.t-mega[data-mega="naprawy"]')).toBeVisible();
    expect(await page.locator("[data-t-reveal]:not(.is-in)").count()).toBe(0);
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(200);
    const hidden = await page.evaluate(() => Array.from(document.querySelectorAll(".t-main .t-hd")).filter((el) => getComputedStyle(el).opacity !== "1").length);
    expect(hidden).toBe(0);
  });
});

test.describe("phone 390 — tab bar and menu sheet", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("tab bar pill sits under the active tab", async ({ page }) => {
    await page.goto("/");
    const bar = page.locator("[data-t-tabbar]");
    await expect(bar).toHaveAttribute("data-pill-ready", "");
    const pill = await bar.evaluate((el) => getComputedStyle(el).getPropertyValue("--pill-w"));
    expect(parseFloat(pill)).toBeGreaterThan(40);
  });

  test("menu sheet: iOS card behind, drag down closes, focus returns", async ({ page }) => {
    await page.goto("/");
    const menuBtn = page.locator("[data-t-tabbar]").getByRole("button", { name: "Menu" });
    await menuBtn.click();
    const sheet = page.locator(".t-sheet");
    await expect(sheet).toHaveClass(/is-open/);
    await expect(page.locator(".tech")).toHaveClass(/t-sheet-open/);
    await expect(page.locator(".t-main")).toHaveCSS("transform", /matrix\(0\.94/);
    // drag the handle down (after the spring settles, so the handle is where we measure it)
    await page.waitForTimeout(450);
    const grab = (await page.locator(".t-sheet__handle").boundingBox())!;
    await page.mouse.move(grab.x + grab.width / 2, grab.y + 2);
    await page.mouse.down();
    await page.mouse.move(grab.x + grab.width / 2, grab.y + 80, { steps: 4 });
    await page.mouse.move(grab.x + grab.width / 2, grab.y + 180, { steps: 4 });
    await page.mouse.up();
    await expect(sheet).not.toHaveClass(/is-open/);
    await expect(page.locator(".tech")).not.toHaveClass(/t-sheet-open/);
    await expect(menuBtn).toBeFocused();
  });

  test("menu sheet: a small drag snaps back", async ({ page }) => {
    await page.goto("/");
    await page.locator("[data-t-tabbar]").getByRole("button", { name: "Menu" }).click();
    await page.waitForTimeout(450);
    const grab = (await page.locator(".t-sheet__handle").boundingBox())!;
    await page.mouse.move(grab.x + grab.width / 2, grab.y + 2);
    await page.mouse.down();
    await page.waitForTimeout(250);
    await page.mouse.move(grab.x + grab.width / 2, grab.y + 50, { steps: 6 });
    await page.waitForTimeout(250);
    await page.mouse.up();
    await expect(page.locator(".t-sheet")).toHaveClass(/is-open/);
  });

  test("theme segmented control has a sliding pill and switches the theme", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.locator("[data-t-tabbar]").getByRole("button", { name: "Menu" }).click();
    const seg = page.locator(".t-segmented");
    await seg.getByRole("radio", { name: "Ciemny" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-tech-theme", "dark");
    await expect(seg).toHaveAttribute("data-pill-ready", "");
  });
});
