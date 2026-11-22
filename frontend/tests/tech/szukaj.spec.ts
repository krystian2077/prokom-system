/**
 * Site search (SearchDialog + /szukaj — the behaviour of the PRO-KOM lines' search window): opened
 * by Ctrl/⌘ K, „/”, the capsule and the Menu sheet; the field is a combobox (↑↓, Enter, Esc);
 * results grouped with the hit highlighted; focus comes back; /szukaj works without JavaScript
 * and is never indexed; the measurement carries no phrase. „Mega” search (Biznes pattern): quick
 * action tiles from config/prokom.ts, popular phrases, categories with counts from the index.
 * Screenshots for the PR: TECH_ZRZUTY=1 (docs/tech/wyszukiwarka/).
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { pinDaylight } from "./zegar";
import { line, pointPhone, servicePoints, telHref } from "../../config/prokom";

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
  // Ctrl K toggles the window, and on a cold server its lazy chunk can take longer than one try:
  // press again only while it is still closed, or a late window gets closed by the next press.
  await expect(async () => {
    if (!(await dialog(page).isVisible())) await page.keyboard.press("Control+k");
    await expect(dialog(page)).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 15_000 });
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
    await expect(dialog(page).locator('a.t-pcall[href^="tel:"]').first()).toBeVisible();
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

test.describe("mega wyszukiwanie: akcje, frazy, skróty (1440)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("quick action tiles take their data from config/prokom.ts", async ({ page }) => {
    await page.goto("/");
    await openWithKeys(page);
    const tiles = dialog(page).getByRole("group", { name: "Szybkie akcje" });
    await expect(tiles.locator("[data-qa]")).toHaveCount(6);
    await expect(tiles.locator('[data-qa="call"]')).toHaveAttribute("href", telHref(line.phone));
    await expect(tiles.locator('[data-qa="call"]')).toHaveAttribute("data-track", "telefon_klik");
    const zakopane = servicePoints.find((p) => p.key === "zakopane")!;
    // each point has its own number (runda 18.11 §1.2)
    await expect(tiles.locator('[data-qa="call2"]')).toHaveCount(2);
    await expect(tiles.locator('[data-qa="call2"]').filter({ hasText: "Zakopane" })).toHaveAttribute("href", telHref(pointPhone(zakopane)));
    const rabka = servicePoints.find((p) => p.key === "rabka")!;
    await expect(tiles.locator('[data-qa="call2"]').filter({ hasText: "Rabka-Zdrój" })).toHaveAttribute("href", telHref(pointPhone(rabka)));
    await expect(tiles.locator('[data-qa="mail"]')).toHaveCount(0);
    const route = tiles.locator('[data-qa="route"]');
    await expect(route).toHaveAttribute("href", /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=/);
    await expect(route).toHaveAttribute("target", "_blank");
    await expect(route).toHaveAttribute("data-track", "nawigacja_klik");
    await expect(tiles.locator('[data-qa="submit"]')).toHaveAttribute("href", "/zgloszenie");
    await expect(tiles.locator('[data-qa="track"]')).toHaveAttribute("href", "/track");
    await expect(tiles.locator('[data-qa="contact"]')).toHaveCount(0);
  });

  test("Kopiuj numer copies and says „Skopiowano”; Motyw switches the theme like the capsule", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await pinDaylight(page);
    await page.goto("/");
    await openWithKeys(page);
    // copy is no longer a tile: it answers the query „kopiuj”
    await field(page).fill("kopiuj");
    // by its kind: the accessible name itself turns into „Skopiowano” for a moment
    const copy = dialog(page).locator('button[data-qa="copy"]');
    await expect(copy).toHaveAccessibleName(/kopiuj numer/i);
    await copy.click();
    await expect(copy).toContainText("Skopiowano");
    await expect(dialog(page).getByRole("status").filter({ hasText: "Skopiowano numer" })).toHaveCount(1);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(line.phoneDisplay);
    await expect(copy).toContainText(/kopiuj numer/i, { timeout: 4000 });

    await expect(page.locator("html")).toHaveAttribute("data-tech-theme", "light");
    await field(page).fill("motyw");
    await dialog(page).locator('[data-qa="theme"]').click();
    await expect(page.locator("html")).toHaveAttribute("data-tech-theme", "dark");
    expect(await page.evaluate(() => localStorage.getItem("pk-theme"))).toBe("dark");
    await expect(dialog(page)).toBeVisible();
  });

  test("a popular phrase types itself and Enter opens its page", async ({ page }) => {
    await page.goto("/");
    await openWithKeys(page);
    await dialog(page).getByRole("button", { name: "Zalany telefon" }).click();
    await expect(field(page)).toHaveValue("zalany telefon");
    await expect(field(page)).toBeFocused();
    await expect(page.getByRole("listbox", { name: "Wyniki wyszukiwania" }).getByRole("option").first()).toContainText("Telefon po zalaniu");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/naprawy\/telefon-po-zalaniu$/);
  });

  test("categories show counts from the index; ↓ and Enter pick one, its results match the count", async ({ page }) => {
    await page.goto("/");
    await openWithKeys(page);
    const cats = page.getByRole("listbox", { name: "Na skróty" });
    await expect(cats.getByRole("option")).toHaveCount(11);
    await expect(cats.getByRole("option").first()).toContainText(/Telefony\s*\d+ wynik(i|ów)?/);
    // ↓ from the empty field activates the first category; Enter types its phrase
    await page.keyboard.press("ArrowDown");
    await expect(cats.getByRole("option").first()).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowDown");
    const laptops = cats.getByRole("option").nth(1);
    await expect(laptops).toHaveAttribute("aria-selected", "true");
    const count = Number((await laptops.textContent())!.match(/(\d+) wynik/)![1]);
    await page.keyboard.press("Enter");
    await expect(field(page)).toHaveValue("laptop");
    await expect(dialog(page).locator(".t-sdlg__all")).toContainText(`(${count})`);
  });

  test("typing an action word puts the action on top; Enter runs it", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    await openWithKeys(page);
    await field(page).fill("zadzwoń");
    const list = page.getByRole("listbox", { name: "Wyniki wyszukiwania" });
    await expect(list.getByRole("group", { name: "Szybkie akcje" })).toBeVisible();
    // boss 22.11: the first point's own number leads; the general line follows
    await expect(list.getByRole("option").first()).toHaveAttribute("href", telHref(pointPhone(servicePoints[0])));
    await field(page).fill("kopiuj numer");
    await expect(list.getByRole("option").first()).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Enter");
    await expect(list.getByRole("option").first()).toContainText("Skopiowano");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(line.phoneDisplay);
  });

  test("Tab walks from the field to the close button and the tiles; the clear button empties the field", async ({ page }) => {
    await page.goto("/");
    await openWithKeys(page);
    await page.keyboard.press("Tab");
    await expect(dialog(page).getByRole("button", { name: "Zamknij wyszukiwarkę" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(dialog(page).locator('[data-qa="call2"]').first()).toBeFocused();
    await field(page).fill("ekran");
    await dialog(page).getByRole("button", { name: "Wyczyść pole" }).click();
    await expect(field(page)).toHaveValue("");
    await expect(field(page)).toBeFocused();
    await expect(page.getByRole("listbox", { name: "Na skróty" })).toBeVisible();
  });

  test("nothing found: tips, call and form, popular phrases to try", async ({ page }) => {
    await page.goto("/");
    await openWithKeys(page);
    await field(page).fill("qwxzv");
    await expect(dialog(page).locator(".t-sdlg__tips li")).toHaveCount(3);
    await expect(dialog(page).locator("a.t-pcall").first()).toHaveAttribute("href", telHref(pointPhone(servicePoints[0])));
    await dialog(page).locator(".t-sdlg__nonepop").getByRole("button", { name: "Pęknięty ekran" }).click();
    await expect(field(page)).toHaveValue("pęknięty ekran");
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

  test("big targets: tiles scroll sideways, chips, categories and the close button are 44 px+", async ({ page }) => {
    // no entrance scale while measuring
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.locator(".t-capsule").getByRole("button", { name: "Szukaj" }).click();
    await expect(dialog(page)).toBeVisible();
    const row = dialog(page).locator(".t-qa");
    const sizes = await row.evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth }));
    expect(sizes.scroll).toBeGreaterThan(sizes.client);
    const targets = [
      dialog(page).getByRole("button", { name: "Zamknij wyszukiwarkę" }),
      dialog(page).locator('[data-qa="call"]'),
      dialog(page).getByRole("button", { name: "Kurier" }),
      page.getByRole("listbox", { name: "Na skróty" }).getByRole("option").first(),
    ];
    for (const t of targets) {
      const b = (await t.boundingBox())!;
      expect(b.height).toBeGreaterThanOrEqual(44);
      expect(b.width).toBeGreaterThanOrEqual(44);
    }
    // nothing sticks out sideways
    expect(await dialog(page).evaluate((d) => d.scrollWidth <= d.clientWidth + 1)).toBe(true);
    await dialog(page).getByRole("button", { name: "Zamknij wyszukiwarkę" }).click();
    await expect(dialog(page)).toBeHidden();
  });
});

/** Screenshots of the window for the PR (TECH_ZRZUTY=1): 1440 and 390, light and dark, three states. */
test.describe("zrzuty okna", () => {
  test.skip(!process.env.TECH_ZRZUTY, "TECH_ZRZUTY=1 only");
  const out = path.join(__dirname, "..", "..", "..", "docs", "tech", "wyszukiwarka");
  for (const width of [1440, 390] as const) {
    for (const theme of ["light", "dark"] as const) {
      test(`${width} ${theme}`, async ({ page }) => {
        fs.mkdirSync(out, { recursive: true });
        await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
        await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
        await page.addInitScript((t) => localStorage.setItem("pk-theme", t), theme);
        await page.goto("/serwis-telefonow");
        await openWithKeys(page);
        await expect(page.getByRole("listbox", { name: "Na skróty" }).getByRole("option").first()).toBeVisible();
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(out, `${width}-${theme}-pusty.png`) });
        await field(page).fill("ekran");
        await expect(page.getByRole("listbox", { name: "Wyniki wyszukiwania" }).getByRole("option").first()).toBeVisible();
        await page.keyboard.press("ArrowDown");
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(out, `${width}-${theme}-ekran.png`) });
        await field(page).fill("qwxzv");
        await expect(dialog(page)).toContainText("Nie znaleźliśmy");
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(out, `${width}-${theme}-brak.png`) });
      });
    }
  }
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
