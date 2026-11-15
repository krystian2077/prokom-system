/** TD4 PR 1: /punkty-serwisowe, /kontakt, /o-firmie (SPEC §5, §6, §12.1, §12.8; KONTRAKT §4). Production build (no draft). */
import { expect, test, type Page } from "@playwright/test";

const PAGES = ["/punkty-serwisowe", "/kontakt", "/o-firmie"];

async function noZakopane(page: Page) {
  await expect(page.locator("main").getByText(/Zakopane|Staszica/)).toHaveCount(0);
}

test.describe("desktop 1440", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const path of PAGES) {
    test(`${path}: one H1, canonical, no unpublished point, no draft frames`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${path}$`));
      await noZakopane(page);
      await expect(page.locator("main .t-draft, main .t-draft-badge")).toHaveCount(0);
      const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
      for (const s of ld) expect(() => JSON.parse(s)).not.toThrow();
      expect(ld.some((s) => s.includes('"BreadcrumbList"'))).toBe(true);
    });
  }

  test("points page: card with live status, hours, phone and route to Google Maps", async ({ page }) => {
    await page.goto("/punkty-serwisowe");
    const card = page.locator(".t-pointcard");
    await expect(card).toHaveCount(1);
    await expect(card.locator(".t-status")).toHaveText(/^(Otwarte do|Zamykamy za|Otwieramy dziś|Zamknięte)/);
    await expect(card.locator(".t-hours li")).toHaveCount(3);
    await expect(card.locator(".t-hours li.is-today")).toHaveCount(1);
    await expect(card.locator('a[data-track="telefon_klik"]')).toHaveAttribute("href", /^tel:\+48/);
    await expect(card.locator(".t-navto__desktop")).toHaveAttribute("href", /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=49\.\d+,19\.\d+$/);
    await expect(card.getByRole("link", { name: "Zgłoś naprawę tutaj" })).toHaveAttribute("href", "/zgloszenie?punkt=rabka");
    // FAQPage only here, first question open
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.some((s) => s.includes('"FAQPage"'))).toBe(true);
    await expect(page.locator(".t-faq__item").first()).toHaveAttribute("open", "");
    await expect(page.getByText("Czy sprzęt oddany w jednym punkcie odbiorę w drugim?")).toHaveCount(0);
  });

  test("about page: 2004 shown (confirmed 15.11), unconfirmed numbers hidden in production", async ({ page }) => {
    await page.goto("/o-firmie");
    await expect(page.locator("main")).toContainText("Na Podhalu od 2004 roku.");
    await expect(page.locator("main").getByText("4 + 1")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Twoje dane są bezpieczne" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Wycena przed naprawą" })).toBeVisible();
  });

  test("contact form: validation, payload and success", async ({ page }) => {
    let body: Record<string, string> | null = null;
    await page.route("**/communications/inquiry/", async (route) => {
      body = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ detail: "Wiadomosc zostala wyslana." }) });
    });
    await page.goto("/kontakt");
    const form = page.getByRole("form", { name: "Formularz kontaktowy" });
    await form.getByRole("button", { name: "Wyślij wiadomość" }).click();
    await expect(form.locator(".t-fld__err")).toHaveCount(4); // imię, e-mail, wiadomość, zgoda
    await expect(page.locator('[name="firstName"]')).toBeFocused();
    expect(body).toBeNull();

    // one published point → no point choice
    await expect(form.getByRole("group", { name: "Punkt" })).toHaveCount(0);
    await form.getByRole("button", { name: "Folia Hammer Glass" }).click();
    await page.fill('[name="firstName"]', "Anna");
    await page.fill('[name="email"]', "anna@example.test");
    await page.fill('[name="phone"]', "600 100 200");
    await page.fill('[name="message"]', "Folia na iPhone 13");
    await page.check('[name="consent"]');
    await form.getByRole("button", { name: "Wyślij wiadomość" }).click();
    await expect(page.getByRole("heading", { name: "Wiadomość wysłana" })).toBeVisible();
    expect(body).toEqual({ first_name: "Anna", last_name: "", phone: "600 100 200", email: "anna@example.test", interest: "Folia Hammer Glass", message: "Folia na iPhone 13" });
  });

  test("contact form: server error shows the phone", async ({ page }) => {
    await page.route("**/communications/inquiry/", (route) => route.fulfill({ status: 500, contentType: "application/json", body: '{"detail":"x"}' }));
    await page.goto("/kontakt");
    await page.fill('[name="firstName"]', "Anna");
    await page.fill('[name="email"]', "anna@example.test");
    await page.fill('[name="message"]', "Pytanie");
    await page.check('[name="consent"]');
    await page.getByRole("button", { name: "Wyślij wiadomość" }).click();
    await expect(page.locator(".t-inq__general")).toContainText(/Nie udało się wysłać\. Zadzwoń: \d{3} \d{3} \d{3}/);
  });
});

test.describe("phone 390", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  for (const path of PAGES) {
    test(`${path}: no horizontal scroll`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("points page: 'Nawiguj' opens Google / Apple / Waze", async ({ page }) => {
    await page.goto("/punkty-serwisowe");
    const btn = page.locator(".t-pointcard").getByRole("button", { name: "Nawiguj" });
    await btn.click();
    const list = page.locator(".t-navto__list");
    await expect(list).toBeVisible();
    await expect(list.getByRole("link")).toHaveText([/Mapy Google/, /Mapy Apple/, /Waze/]);
    await expect(list.getByRole("link", { name: /Waze/ })).toHaveAttribute("href", /^https:\/\/waze\.com\/ul\?ll=49\.\d+,19\.\d+&navigate=yes$/);
    await expect(list.getByRole("link", { name: /Mapy Apple/ })).toHaveAttribute("href", /^https:\/\/maps\.apple\.com\/\?daddr=/);
  });
});
