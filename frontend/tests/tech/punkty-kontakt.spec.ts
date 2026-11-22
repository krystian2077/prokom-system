/** TD4 PR 1: /punkty-serwisowe, /kontakt, /o-firmie (SPEC §5, §6, §12.1, §12.8; KONTRAKT §4). Production build (no draft). */
import { expect, test, type Page } from "@playwright/test";
import { GENERAL_EMAIL_LABEL, GENERAL_PHONE_LABEL, line, pointPhone, servicePoints, telHref } from "../../config/prokom";
import { pointPhoneDisplay } from "../../lib/tech/point-format";

const PAGES = ["/punkty-serwisowe", "/kontakt", "/o-firmie"];

async function noDraftPoints(page: Page) {
  // both points are published (15.11.2026): no "do uzupełnienia" frame on any point
  await expect(page.locator("main").getByText("do uzupełnienia")).toHaveCount(0);
}

test.describe("desktop 1440", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const path of PAGES) {
    test(`${path}: one H1, canonical, no draft points or frames`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${path}$`));
      await noDraftPoints(page);
      await expect(page.locator("main .t-draft, main .t-draft-badge")).toHaveCount(0);
      const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
      for (const s of ld) expect(() => JSON.parse(s)).not.toThrow();
      expect(ld.some((s) => s.includes('"BreadcrumbList"'))).toBe(true);
    });
  }

  test("points page: card with live status, hours, phone and route to Google Maps", async ({ page }) => {
    await page.goto("/punkty-serwisowe");
    await expect(page.locator("h1")).toHaveText(/Dwa punkty serwisowe: Rabka-\u2060?Zdrój i\s+Zakopane/); // headings get a word joiner after the hyphen (components/tech/Typeset.tsx)
    await expect(page.locator(".t-pointcard")).toHaveCount(2);
    const zak = page.locator(".t-pointcard").nth(1);
    await expect(zak).toContainText("Staszica");
    await expect(zak.getByRole("link", { name: "Zgłoś naprawę tutaj" })).toHaveAttribute("href", "/zgloszenie?punkt=zakopane");
    await expect(zak.locator(".t-navto__desktop")).toHaveAttribute("href", /destination=49\.2978,19\.9539$/);
    const card = page.locator(".t-pointcard").first();
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
    await expect(page.getByText("Czy sprzęt oddany w jednym punkcie odbiorę w drugim?")).toHaveCount(1);
  });

  test("about page: 2004 shown (confirmed 15.11), unconfirmed numbers hidden in production", async ({ page }) => {
    await page.goto("/o-firmie");
    await expect(page.locator("main")).toContainText("Na Podhalu od 2004 roku.");
    await expect(page.locator("main").getByText("4 + 1")).toHaveCount(0);
    await expect(page.locator("main")).toContainText("Nie przeglądamy zawartości urządzeń bez potrzeby.");
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

    // two published points → point choice (KONTRAKT §4: point goes into interest)
    const pointGroup = form.getByRole("group", { name: "Punkt" });
    await expect(pointGroup.getByRole("button")).toHaveText(["Rabka-Zdrój", "Zakopane", "Obojętnie"]);
    await pointGroup.getByRole("button", { name: "Zakopane" }).click();
    await form.getByRole("button", { name: "Folia Hammer Glass" }).click();
    await page.fill('[name="firstName"]', "Anna");
    await page.fill('[name="email"]', "anna@example.test");
    await page.fill('[name="phone"]', "600 100 200");
    await page.fill('[name="message"]', "Folia na iPhone 13");
    await page.check('[name="consent"]');
    await form.getByRole("button", { name: "Wyślij wiadomość" }).click();
    await expect(page.getByRole("heading", { name: "Wiadomość wysłana" })).toBeVisible();
    expect(body).toEqual({ first_name: "Anna", last_name: "", phone: "600 100 200", email: "anna@example.test", interest: "Folia Hammer Glass · punkt: Zakopane", message: "Folia na iPhone 13" });
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
    const card = page.locator(".t-pointcard").first();
    await card.getByRole("button", { name: "Nawiguj" }).click();
    const list = card.locator(".t-navto__list");
    await expect(list).toBeVisible();
    await expect(list.getByRole("link")).toHaveText([/Mapy Google/, /Mapy Apple/, /Waze/]);
    await expect(list.getByRole("link", { name: /Waze/ })).toHaveAttribute("href", /^https:\/\/waze\.com\/ul\?ll=49\.\d+,19\.\d+&navigate=yes$/);
    await expect(list.getByRole("link", { name: /Mapy Apple/ })).toHaveAttribute("href", /^https:\/\/maps\.apple\.com\/\?daddr=/);
  });
});

test("free parking at both salons comes from parkingNote (15.11)", async ({ page }) => {
  await page.goto("/punkty-serwisowe");
  const main = page.locator("main");
  await expect(main).toContainText("Dojazd, parking i to, co warto zabrać ze sobą.");
  await expect(main).toContainText("Bezpłatny parking przy salonie.");
  await expect(main).toContainText("Bezpłatny parking.");
  await expect(page.getByText(/Gdzie zaparkować/)).toHaveCount(1);
  await page.goto("/serwis-telefonow-zakopane");
  await expect(page.locator("main")).toContainText("Bezpłatny parking.");
});

/** Runda 18.11 §1.2 (D5): a page about one point shows only that point's contact. */
test.describe("kontakt punktów (runda 18.11)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  const rabka = servicePoints.find((p) => p.key === "rabka")!;
  const zakopane = servicePoints.find((p) => p.key === "zakopane")!;
  const shows = (p: typeof rabka) => `a[href="${telHref(pointPhone(p))}"]`;

  for (const [path, own, other] of [
    ["/serwis-telefonow-rabka-zdroj", rabka, zakopane],
    ["/serwis-telefonow-zakopane", zakopane, rabka],
  ] as const) {
    test(`${path}: only the ${own.name} phone in the page body, never the other point's`, async ({ page }) => {
      await page.goto(path);
      const main = page.locator("main");
      await expect(main.locator(shows(own)).first()).toBeVisible();
      await expect(main.locator(shows(other))).toHaveCount(0);
      await expect(main).not.toContainText(pointPhoneDisplay(other));
      // the general number is not the point's number on its own page
      await expect(main.locator(`.t-loc-hero a[href="${telHref(line.phone)}"]`)).toHaveCount(0);
    });
  }

  test("/punkty-serwisowe and /kontakt: both points with their own phone + the general number labelled", async ({ page }) => {
    for (const path of ["/punkty-serwisowe", "/kontakt"]) {
      await page.goto(path);
      const main = page.locator("main");
      await expect(main.locator(shows(rabka)).first()).toBeVisible();
      await expect(main.locator(shows(zakopane)).first()).toBeVisible();
      await expect(main.locator(`a[href="${telHref(line.phone)}"]`).first()).toBeVisible();
      await expect(main).toContainText(GENERAL_PHONE_LABEL);
      await expect(main).toContainText(GENERAL_EMAIL_LABEL);
    }
  });

  test("brand bar and footer: the general number with its label", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".t-brandbar__phone")).toContainText(`${GENERAL_PHONE_LABEL}: ${line.phoneDisplay}`);
    // boss 22.11: in the footer the general number is only a note; each point card has its own
    await expect(page.locator(".t-footer .t-genline")).toContainText(GENERAL_PHONE_LABEL);
  });

  test("JSON-LD: each LocalBusiness carries its own point's phone", async ({ page }) => {
    await page.goto("/");
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const graph = blocks.flatMap((t) => (JSON.parse(t)["@graph"] ?? []) as { "@type": string; "@id": string; telephone?: string }[]);
    const tel = (key: string) => graph.find((n) => n["@type"] === "LocalBusiness" && n["@id"].endsWith(`#punkt-${key}`))?.telephone;
    expect(tel("rabka")).toBe(pointPhone(rabka).replace(/[^\d+]/g, ""));
    expect(tel("zakopane")).toBe(pointPhone(zakopane).replace(/[^\d+]/g, ""));
  });
});
