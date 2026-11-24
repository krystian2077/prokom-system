/**
 * Runda 18.11 v2 (T-R2b): sales catalogue, model card, brand salons and the enquiry list.
 * Not a shop: no prices anywhere; the enquiry goes through the contact API (KONTRAKT §4).
 */
import { expect, test, type Page } from "@playwright/test";
import { pinDaylight } from "./zegar";

const NO_PRICE = /\d[\d\s.,]*\s?(zł|PLN)\b/i;

async function noPrice(page: Page) {
  expect(await page.locator("main").innerText()).not.toMatch(NO_PRICE);
}

test.describe("desktop 1440", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.beforeEach(async ({ page }) => {
    await pinDaylight(page);
  });

  test("catalogue → filter → model → colour and storage → enquiry → sent through the contact API", async ({ page }) => {
    let body: Record<string, string> | null = null;
    await page.route("**/communications/inquiry/", async (route) => {
      body = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: "application/json", body: '{"detail":"ok"}' });
    });
    await page.goto("/sprzedaz");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Apple i Samsung");
    await noPrice(page);
    const all = await page.locator(".t-catb__grid > li:visible").count();
    expect(all).toBeGreaterThan(40);
    // filters: Samsung + phones
    await page.getByRole("group", { name: "Marka" }).getByRole("button", { name: "Samsung", exact: true }).click();
    await page.getByRole("group", { name: "Rodzaj" }).getByRole("button", { name: "Telefony" }).click();
    await expect(page).toHaveURL(/marka=samsung&rodzaj=phone/);
    const phones = page.locator(".t-catb__grid > li:visible");
    expect(await phones.count()).toBeLessThan(all);
    await expect(phones.first()).toContainText("Galaxy");
    // search
    await page.getByRole("searchbox", { name: "Szukaj modelu" }).fill("ultra");
    await expect(page.locator(".t-catb__grid > li:visible").first()).toContainText("Ultra");
    // model card
    await page.goto("/sprzedaz/apple/iphone-18-pro");
    await expect(page.getByRole("heading", { level: 1, name: "iPhone 18 Pro" })).toBeVisible();
    await noPrice(page);
    await page.getByRole("radiogroup", { name: "Kolor" }).getByRole("radio", { name: "Burgund" }).click();
    await expect(page).toHaveURL(/kolor=burgund/);
    await page.getByRole("radiogroup", { name: "Wersja" }).getByRole("radio", { name: "512 GB" }).click();
    await expect(page.locator(".t-mbar__what")).toContainText("Burgund · 512 GB");
    await page.getByRole("button", { name: "Dodaj do zapytania" }).click();
    await page.getByRole("link", { name: /Zobacz zapytanie \(1\)/ }).click();
    // enquiry list
    await expect(page).toHaveURL(/\/zapytanie$/);
    const item = page.locator(".t-enq__item");
    await expect(item).toContainText("iPhone 18 Pro");
    await expect(item).toContainText("Burgund · 512 GB");
    await item.getByRole("button", { name: "Więcej" }).click();
    await expect(item.locator("output")).toHaveText("2");
    // validation, then send
    await page.getByRole("button", { name: /Wyślij zapytanie/ }).click();
    await expect(page.locator("#enq-firstName")).toBeFocused();
    expect(body).toBeNull();
    await page.getByRole("button", { name: "Zakopane" }).click();
    await page.fill("#enq-firstName", "Anna");
    await page.fill("#enq-email", "anna@example.test");
    await page.check("#enq-consent");
    await page.getByRole("button", { name: /Wyślij zapytanie/ }).click();
    await expect(page.getByRole("heading", { name: "Zapytanie wysłane" })).toBeVisible();
    expect(body!.interest).toBe("Sprzedaż · 2 pozycje · punkt: Zakopane");
    expect(body!.message).toContain("iPhone 18 Pro · Burgund · 512 GB — 2 szt.");
    expect(body!.email).toBe("anna@example.test");
    // the list is cleared after sending
    expect(await page.evaluate(() => localStorage.getItem("pk-tech-zapytanie"))).toBeNull();
  });

  test("?kolor= opens the model in that colour; canonical stays clean; Product JSON-LD without offers", async ({ page }) => {
    await page.goto("/sprzedaz/samsung/galaxy-s26-ultra?kolor=czarny");
    await expect(page.locator(".t-mconf__set legend").first()).toContainText("Czarny");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/sprzedaz\/samsung\/galaxy-s26-ultra$/);
    const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((t) => JSON.parse(t));
    const product = ld.find((x) => x["@type"] === "Product");
    expect(product.name).toBe("Galaxy S26 Ultra");
    expect(product.offers).toBeUndefined();
  });

  test("salon: quiz gives 1–3 models with reasons; comparison marks differences", async ({ page }) => {
    await page.goto("/apple");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Salon Apple");
    await noPrice(page);
    const quiz = page.locator(".t-quiz");
    await quiz.getByRole("button", { name: "Duży ekran" }).click();
    await quiz.getByRole("button", { name: "Dużo fotografuję i nagrywam" }).click();
    await quiz.getByRole("button", { name: "Najlepszy, na kilka lat" }).click();
    const picks = quiz.locator(".t-quiz__pick");
    expect(await picks.count()).toBeGreaterThan(0);
    expect(await picks.count()).toBeLessThanOrEqual(3);
    await expect(picks.first()).toContainText("iPhone");
    await expect(picks.first().locator(".t-quiz__why")).toContainText("Duży ekran");
    // comparison
    const table = page.locator(".t-cmp__table");
    await expect(table.locator("thead th")).toHaveCount(3);
    expect(await table.locator("tr.is-diff").count()).toBeGreaterThan(0);
  });

  test("salon Samsung lists every department and links to the brand service", async ({ page }) => {
    await page.goto("/samsung");
    for (const name of ["Galaxy S", "Galaxy Z", "Galaxy A", "Galaxy Tab", "Galaxy Watch", "Galaxy Buds"]) await expect(page.getByRole("heading", { level: 3, name, exact: true })).toBeVisible();
    // the business band links to the brand service too (24.11), so look in the service section
    await expect(page.locator("#serwis").getByRole("link", { name: /Serwis Samsung/ })).toHaveAttribute("href", "/serwis-samsung");
  });
});

test.describe("dodatki (1440)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test("„Ostatnio oglądane” remembers model cards on this device only", async ({ page }) => {
    await pinDaylight(page);
    await page.goto("/sprzedaz");
    await expect(page.getByRole("navigation", { name: "Ostatnio oglądane" })).toHaveCount(0);
    await page.goto("/sprzedaz/apple/iphone-air");
    await page.goto("/sprzedaz/samsung/galaxy-z-flip8");
    await page.goto("/sprzedaz");
    const recent = page.getByRole("navigation", { name: "Ostatnio oglądane" });
    await expect(recent.getByRole("link")).toHaveText(["Galaxy Z Flip8", "iPhone Air"]);
  });
  test("„Zapytaj o całość” adds the model, fitting models and accessories at once", async ({ page }) => {
    await pinDaylight(page);
    await page.goto("/sprzedaz/apple/iphone-18-pro");
    await page.getByRole("button", { name: "Dodaj zestaw do zapytania" }).click();
    await page.getByRole("link", { name: "Dodano · Zobacz zapytanie" }).click();
    const items = page.locator(".t-enq__item");
    await expect(items.nth(2)).toBeVisible();
    await expect(items.first()).toContainText("iPhone 18 Pro");
    await expect(page.locator(".t-enq__items")).toContainText("Folia ochronna Hammer Glass — do: iPhone 18 Pro");
  });
});

test.describe("przechył kart (1440)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test("a card tilts towards the mouse; reduced motion keeps it flat", async ({ page }) => {
    await pinDaylight(page);
    await page.goto("/sprzedaz");
    const card = page.locator(".t-mcard__link").first();
    await card.scrollIntoViewIfNeeded();
    const box = (await card.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.2);
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.15);
    await expect(card).toHaveAttribute("data-tilt", "");
    expect(await card.evaluate((el) => getComputedStyle(el).getPropertyValue("--ry").trim())).toMatch(/^\d/);
    // off the card (the gap between cards / the page) → flat again
    await page.mouse.move(box.x + box.width / 2, box.y - 30, { steps: 5 });
    await expect(card).not.toHaveAttribute("data-tilt", "");
  });
  test("reduced motion: no tilt", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await pinDaylight(page);
    await page.goto("/sprzedaz");
    const card = page.locator(".t-mcard__link").first();
    await card.scrollIntoViewIfNeeded();
    const box = (await card.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.2);
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.15);
    await page.waitForTimeout(200);
    await expect(card).not.toHaveAttribute("data-tilt", "");
  });
});

test.describe("nawigacja sprzedaży (1440)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test("„Sprzedaż” mega menu: both salons, enquiry card; the count badge appears after adding", async ({ page }) => {
    await pinDaylight(page);
    await page.goto("/");
    const cap = page.locator(".t-capsule");
    await expect(cap.locator(".t-navbadge")).toHaveCount(0); // nothing on the list yet
    await cap.getByRole("button", { name: "Sprzedaż" }).click();
    const panel = page.locator('.t-mega[data-mega="sprzedaz"]');
    // redesign 19.11: salon tiles with departments, the whole catalogue as the main call to action
    await expect(panel.getByRole("list", { name: "Działy: Apple" }).getByRole("link", { name: "iPhone Pro" })).toHaveAttribute("href", "/apple#iphone-pro");
    await expect(panel.getByRole("list", { name: "Działy: Samsung" }).getByRole("link", { name: "Galaxy S", exact: true })).toHaveAttribute("href", "/samsung#galaxy-s");
    await expect(panel.locator(".t-msalon__main").first()).toHaveAttribute("href", "/apple");
    await expect(panel.locator(".t-msales__all")).toHaveAttribute("href", "/sprzedaz");
    await expect(panel.locator(".t-msales__all")).toContainText(/\d+ modeli/);
    expect(await panel.locator(".t-msales__new li").count()).toBeGreaterThan(0);
    await page.keyboard.press("Escape");
    await page.goto("/sprzedaz/apple/iphone-17");
    await page.getByRole("button", { name: "Dodaj do zapytania" }).click();
    await expect(cap.locator(".t-navbadge")).toHaveText(/1/);
    await expect(cap.getByRole("button", { name: /Sprzedaż \(w zapytaniu: 1\)/ })).toBeVisible();
  });
  test("search finds a model and the salons", async ({ page }) => {
    await pinDaylight(page);
    await page.goto("/");
    const dialog = page.getByRole("dialog", { name: "Szukaj na stronie" });
    // Ctrl K once the page is hydrated (a key pressed before that is lost) — same as szukaj.spec
    await expect(async () => {
      if (!(await dialog.isVisible())) await page.keyboard.press("Control+k");
      await expect(dialog).toBeVisible({ timeout: 1500 });
    }).toPass({ timeout: 15_000 });
    await dialog.getByRole("combobox").fill("galaxy s26 ultra");
    await expect(dialog.getByRole("option", { name: /Galaxy S26 Ultra/ }).first()).toBeVisible();
    await dialog.getByRole("combobox").fill("salon apple");
    await expect(dialog.getByRole("option", { name: /Salon Apple/ }).first()).toBeVisible();
  });
});

test.describe("strona główna: sprzedaż (1440)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test("the home page shows both salons, the newest models and the way into the whole catalogue — no prices", async ({ page }) => {
    await pinDaylight(page);
    await page.goto("/");
    const sec = page.locator("#sprzedaz");
    await expect(sec.getByRole("heading", { level: 2 })).toContainText("Wybierz go u nas");
    await expect(sec.locator(".t-hsalon")).toHaveCount(2);
    await expect(sec.locator(".t-hsalon").first()).toHaveAttribute("href", "/apple");
    expect(await sec.locator(".t-hnew").count()).toBeGreaterThan(3);
    await expect(sec.getByRole("link", { name: /Zobacz cały katalog/ })).toHaveAttribute("href", "/sprzedaz");
    expect(await sec.innerText()).not.toMatch(NO_PRICE);
    // the Apple tile shows the silver iPhone (Krystian 19.11)
    await expect(sec.locator(".t-hsalon--apple img")).toHaveAttribute("src", /iphone-18-pro%2Fsrebrny|iphone-18-pro\/srebrny/);
  });
  test("„Sprzedaż” and „Partner ALSEN” come right after „Najczęstsze naprawy” (Krystian 19.11)", async ({ page }) => {
    await page.goto("/");
    const ids = await page.$$eval("main section[id]", (s) => s.map((e) => e.id));
    const at = ids.indexOf("usterki");
    expect(ids.slice(at, at + 4)).toEqual(["usterki", "sprzedaz", "alsen", "punkty"]);
  });
});

test.describe("salon hero: devices on the stage (1440)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  for (const brand of ["apple", "samsung"] as const) {
    test(`/${brand}: cut-out devices next to the title, decorative only`, async ({ page }) => {
      await page.goto(`/${brand}`);
      const stage = page.locator("[data-salon-stage]");
      await expect(stage).toHaveAttribute("aria-hidden", "true");
      const imgs = stage.locator("img");
      expect(await imgs.count()).toBeGreaterThanOrEqual(3);
      await expect.poll(() => imgs.evaluateAll((list) => list.every((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0))).toBe(true);
      const h1 = (await page.locator("h1").boundingBox())!;
      const box = (await stage.boundingBox())!;
      expect(box.x).toBeGreaterThan(h1.x + 200); // beside the title, not under it
    });
  }
});

test.describe("phone 360", () => {
  test.use({ viewport: { width: 360, height: 780 }, hasTouch: true, isMobile: true });
  for (const path of ["/sprzedaz", "/apple", "/samsung", "/sprzedaz/apple/iphone-air", "/sprzedaz/samsung/galaxy-z-fold8", "/zapytanie"]) {
    for (const theme of ["light", "dark"] as const) {
      test(`${path} ${theme}: no horizontal scroll, sticky bar above the tab bar`, async ({ page }) => {
        await pinDaylight(page);
        await page.addInitScript((t) => localStorage.setItem("pk-theme", t), theme);
        await page.goto(path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);
        if (path.startsWith("/sprzedaz/")) {
          const bar = (await page.locator(".t-mbar__in").boundingBox())!;
          const tabs = (await page.locator("[data-t-tabbar]").boundingBox())!;
          expect(bar.y + bar.height).toBeLessThanOrEqual(tabs.y + 1);
        }
      });
    }
  }
});
