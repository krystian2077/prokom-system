/**
 * Site search (SearchDialog + /szukaj — the behaviour of the PRO-KOM lines' search window): opened
 * by Ctrl/⌘ K, „/”, the capsule and the Menu sheet; the field is a combobox (↑↓, Enter, Esc);
 * results grouped with the hit highlighted; focus comes back; /szukaj works without JavaScript
 * and is never indexed; the measurement carries no phrase.
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import { expect, test, type Page } from "@playwright/test";

const axeSource = fs.readFileSync(createRequire(__filename).resolve("axe-core/axe.min.js"), "utf8");
/** axe (WCAG 2 A + AA) on a part of the page; serious and critical violations returned. */
async function axe(page: Page, selector: string) {
  await page.addScriptTag({ content: axeSource });
  return page.evaluate(async (sel) => {
    const w = window as unknown as { axe: { run: (c: unknown, o: unknown) => Promise<{ violations: { id: string; impact: string | null; nodes: { target: string[] }[] }[] }> } };
    const out = await w.axe.run({ include: [sel] }, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } });
    return out.violations.filter((v) => v.impact === "critical" || v.impact === "serious").map((v) => `${v.impact} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
  }, selector);
}

const dialog = (page: Page) => page.getByRole("dialog", { name: "Szukaj na stronie" });
const field = (page: Page) => page.getByRole("combobox", { name: "Szukaj na stronie" });
/** Ctrl K once the page is hydrated (a key pressed before that is lost, as for any visitor). */
async function openWithKeys(page: Page) {
  await expect(async () => {
    await page.keyboard.press("Control+k");
    await expect(dialog(page)).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 10_000 });
}

test.describe("okno wyszukiwania (1440)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Ctrl K and „/” open it, Esc closes it and gives the focus back", async ({ page }) => {
    await page.goto("/");
    const opener = page.locator(".t-capsearch");
    await opener.focus();
    await page.keyboard.press("Control+k");
    await expect(dialog(page)).toBeVisible();
    await expect(field(page)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
    await expect(opener).toBeFocused();
    // „/” outside a field
    await page.locator("body").click({ position: { x: 700, y: 600 } });
    await page.keyboard.press("/");
    await expect(dialog(page)).toBeVisible();
    await expect(field(page)).toHaveValue("");
  });

  test("„/” typed in a field stays in the field", async ({ page }) => {
    await page.goto("/szukaj");
    await page.locator('input[name="q"]').focus();
    await page.keyboard.type("a/b");
    await expect(page.locator('input[name="q"]')).toHaveValue("a/b");
    await expect(dialog(page)).toBeHidden();
  });

  test("capsule button, grouped results, highlight, ↑↓ and Enter open the page", async ({ page }) => {
    await page.goto("/");
    await page.locator(".t-capsearch").click();
    await field(page).fill("drukarki");
    const list = page.getByRole("listbox", { name: "Wyniki wyszukiwania" });
    await expect(list.getByRole("option").first()).toContainText("Serwis drukarek");
    await expect(list.getByRole("group").first()).toBeVisible();
    await expect(list.locator("mark").first()).toBeVisible();
    // the first result is active; ↓ moves, ↑ comes back
    const first = list.getByRole("option").first();
    await expect(first).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowDown");
    await expect(first).toHaveAttribute("aria-selected", "false");
    const activeId = await field(page).getAttribute("aria-activedescendant");
    await expect(page.locator(`[id="${activeId}"]`)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowUp");
    await expect(first).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/serwis-drukarek$/);
    await expect(dialog(page)).toBeHidden();
  });

  test("Polish letters and inflection: „wyswietlacza”, „baterii” find results", async ({ page }) => {
    await page.goto("/");
    await openWithKeys(page);
    for (const q of ["wyswietlacza", "baterii", "zalany telefon", "lapotp"]) {
      await field(page).fill(q);
      await expect(page.getByRole("listbox").getByRole("option").first(), q).toBeVisible();
    }
  });

  test("nothing found: phone, form and contact", async ({ page }) => {
    await page.goto("/");
    await openWithKeys(page);
    await field(page).fill("qwxzv");
    await expect(dialog(page)).toContainText("Nie znaleźliśmy „qwxzv”");
    await expect(dialog(page).locator('a[href^="tel:"]')).toBeVisible();
    await expect(dialog(page).getByRole("link", { name: "Zgłoś naprawę" })).toHaveAttribute("href", "/zgloszenie");
  });

  test("a fault leads to the form with the device and the fault filled in", async ({ page }) => {
    await page.goto("/");
    await openWithKeys(page);
    await field(page).fill("nie czyta płyt");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/zgloszenie\?category=console&usterka=Nie\+czyta\+p%C5%82yt/);
  });

  test("recent phrases are kept in this browser and can be cleared", async ({ page }) => {
    await page.goto("/");
    await openWithKeys(page);
    await field(page).fill("hammer");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/hammer-glass/);
    await openWithKeys(page);
    const recent = dialog(page).getByRole("button", { name: "hammer", exact: true });
    await expect(recent).toBeVisible();
    await dialog(page).getByRole("button", { name: "Wyczyść" }).click();
    await expect(recent).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("pk-tech-szukaj"))).toBeNull();
  });

  test("the measurement sends the length and the count, never the phrase", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __events: unknown[] }).__events = [];
      (window as unknown as { umami: unknown }).umami = { track: (n: string, d: unknown) => (window as unknown as { __events: unknown[] }).__events.push([n, d]) };
    });
    await page.goto("/");
    await openWithKeys(page);
    await field(page).fill("bateria");
    await expect.poll(() => page.evaluate(() => JSON.stringify((window as unknown as { __events: unknown[] }).__events)), { timeout: 5000 }).toContain("szukaj");
    const events = await page.evaluate(() => JSON.stringify((window as unknown as { __events: unknown[] }).__events));
    expect(events).toContain('"dlugosc":7');
    expect(events).not.toContain("bateria");
  });
});

test.describe("dostępność (axe)", () => {
  for (const theme of ["light", "dark"] as const) {
    test(`open window with results and the open rail have no serious violations (${theme})`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.addInitScript((t) => localStorage.setItem("pk-theme", t), theme);
      await page.goto("/serwis-laptopow");
      await page.locator(".t-rail__list a").first().focus();
      expect(await axe(page, ".t-rail")).toEqual([]);
      await openWithKeys(page);
      expect(await axe(page, ".t-sdlg")).toEqual([]);
      await field(page).fill("bateria");
      await expect(page.getByRole("option").first()).toBeVisible();
      expect(await axe(page, ".t-sdlg")).toEqual([]);
      await field(page).fill("qwxzv");
      await expect(dialog(page)).toContainText("Nie znaleźliśmy");
      expect(await axe(page, ".t-sdlg")).toEqual([]);
    });
  }
});

test.describe("telefon (390)", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("full-screen window from the capsule loupe and from the Menu sheet", async ({ page }) => {
    await page.goto("/");
    await page.locator(".t-capsule").getByRole("button", { name: "Szukaj" }).click();
    await expect(dialog(page)).toBeVisible();
    const box = await dialog(page).boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(389);
    await page.keyboard.press("Escape");
    await page.locator("[data-t-tabbar]").getByRole("button", { name: "Menu" }).click();
    await page.getByRole("dialog", { name: "Menu" }).getByRole("button", { name: "Szukaj na stronie" }).click();
    await expect(dialog(page)).toBeVisible();
    await expect(field(page)).toBeFocused();
    await field(page).fill("status");
    await page.getByRole("listbox").getByRole("option").first().click();
    await expect(page).toHaveURL(/\/track$/);
  });
});

test.describe("/szukaj", () => {
  test("works without JavaScript and is not indexed", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await ctx.newPage();
    await page.goto("/szukaj");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await page.locator('input[name="q"]').fill("laptop");
    await page.locator('form[role="search"] button[type="submit"]').click();
    await expect(page).toHaveURL(/\/szukaj\?q=laptop/);
    await expect(page.locator(".t-szukaj__result", { hasText: "Serwis laptopów" }).first()).toBeVisible();
    await expect(page.locator("mark").first()).toHaveText(/laptop/i);
    await page.goto("/szukaj?q=qwxzv");
    await expect(page.locator("main")).toContainText("Nie znaleźliśmy");
    await ctx.close();
  });

  test("index JSON is static, not indexed, and lists no panels", async ({ request }) => {
    const res = await request.get("/szukaj/indeks.json");
    expect(res.ok()).toBe(true);
    expect(res.headers()["x-robots-tag"]).toContain("noindex");
    const list = (await res.json()) as { href: string }[];
    expect(list.length).toBeGreaterThan(50);
    expect(list.some((e) => /^\/(panel|admin-panel|client\/(?!login))/.test(e.href))).toBe(false);
  });

  test("not in the sitemap", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).not.toContain("/szukaj");
  });
});
