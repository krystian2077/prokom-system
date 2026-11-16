/**
 * TD3 PR 2: /zgloszenie end to end on the T0 fixtures (KONTRAKT §6 — without a local
 * backend the API is intercepted with recorded responses).
 */
import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page, type Route } from "@playwright/test";

const FIXTURES = path.resolve(__dirname, "../../../tests/tech/fixtures");
const fx = (name: string) => JSON.parse(fs.readFileSync(path.join(FIXTURES, `${name}.json`), "utf8"));

async function mockSubmit(page: Page, handler: (route: Route, body: Record<string, unknown>) => Promise<void> | void) {
  await page.route("**/api/v1/repairs/submit/", async (route) => {
    const body = JSON.parse(route.request().postData() || "{}");
    await handler(route, body);
  });
}
const reply = (route: Route, name: string) => {
  const f = fx(name);
  return route.fulfill({ status: f.response.status, contentType: "application/json", body: JSON.stringify(f.response.body) });
};

async function fillPhoneRabka(page: Page) {
  const form = page.locator(".t-zgl__form");
  await form.getByRole("radio", { name: "Telefon" }).click();
  await page.getByLabel("Marka *").fill("Samsung");
  await page.getByLabel("Model *").fill("Galaxy S23");
  await page.getByRole("radio", { name: "Tak" }).click();
  await page.getByLabel("Co się dzieje? *").fill("Pęknięty ekran po upadku.");
  await page.locator("[data-zgl-next]").click();
  await page.getByRole("radio", { name: /Osobiście · Rabka-Zdrój/ }).click();
  await page.locator("[data-zgl-next]").click();
  await page.locator("[data-zgl-next]").click();
  await page.getByLabel("Imię *").fill("Jan");
  await page.getByLabel("Nazwisko *").fill("Testowy");
  await page.getByLabel("E-mail *").fill("jan.testowy@example.com");
  await page.getByLabel("Telefon *").fill("+48 500 100 234");
  await page.locator("[data-zgl-next]").click();
  await page.getByLabel("Uwagi dla serwisu opcjonalnie").fill("Proszę o kontakt po 16.");
  await page.locator("label.t-check", { hasText: "regulamin" }).locator("input").check();
}

test.describe("desktop 1440", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("5 steps → payload as in the contract → success card with number and QR", async ({ page }) => {
    let sent: Record<string, unknown> | null = null;
    await mockSubmit(page, (route, body) => {
      sent = body;
      return reply(route, "submit-201-phone-rabka");
    });
    await page.goto("/zgloszenie");
    await expect(page.getByRole("heading", { level: 1, name: "Zgłoś naprawę" })).toBeVisible();
    await expect(page.locator(".t-steps__item")).toHaveCount(5);
    await fillPhoneRabka(page);
    await page.locator("[data-zgl-next]").click();

    await expect(page.getByRole("heading", { name: "Zgłoszenie przyjęte" })).toBeVisible();
    await expect(page.locator("[data-repair-number]")).toHaveText("PROKOM/RMA/2/2026");
    await expect(page.getByRole("img", { name: /Kod QR/ })).toBeVisible();
    await expect(page.locator(".t-success").getByRole("link", { name: "Sprawdź status", exact: true })).toHaveAttribute("href", "/track?ref=PROKOM%2FRMA%2F2%2F2026");
    await expect(page.locator(".t-success__point")).toContainText("Rabka-Zdrój");

    const expected = fx("submit-201-phone-rabka").request.body;
    expect(sent).toMatchObject(expected);
    expect(sent).toMatchObject({ accessory_interest: [], accessory_choose_for_me: false, accessory_wishlist: "" });
  });

  test("validation: empty step 1 shows errors and does not move on", async ({ page }) => {
    await page.goto("/zgloszenie");
    await page.locator("[data-zgl-next]").click();
    await expect(page.getByText("Wybierz rodzaj urządzenia.")).toBeVisible();
    await expect(page.locator("#zgl-step-1.is-open")).toBeVisible();
    await page.locator(".t-zgl__form").getByRole("radio", { name: "Laptop" }).click();
    await expect(page.getByText("Marka opcjonalnie")).toBeVisible();
  });

  test("backend 400 maps onto the field and jumps to its step", async ({ page }) => {
    await mockSubmit(page, (route) => reply(route, "submit-400-invalid-phone"));
    await page.goto("/zgloszenie");
    await fillPhoneRabka(page);
    await page.locator("[data-zgl-next]").click();
    await expect(page.locator("#zgl-step-4.is-open")).toBeVisible();
    await expect(page.getByText(/Nieprawidłowy numer telefonu/)).toBeVisible();
    await expect(page.getByLabel("Telefon *")).toHaveAttribute("aria-invalid", "true");
  });

  test("429 shows the phone message", async ({ page }) => {
    await mockSubmit(page, (route) => route.fulfill({ status: 429, contentType: "application/json", body: '{"detail":"throttled"}' }));
    await page.goto("/zgloszenie");
    await fillPhoneRabka(page);
    await page.locator("[data-zgl-next]").click();
    await expect(page.locator(".t-alert")).toContainText("Zbyt wiele zgłoszeń z tego urządzenia. Zadzwoń:");
  });

  test("wizard parameters prefill the form; unpublished point and paczkomat are ignored", async ({ page }) => {
    await page.goto("/zgloszenie?category=laptop&usterka=Nie%20%C5%82aduje%20si%C4%99&punkt=rabka&dostawa=punkt");
    await expect(page.locator(".t-zgl__form").getByRole("radio", { name: "Laptop" })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByLabel("Co się dzieje? *")).toHaveValue("Nie ładuje się");
    await expect(page.locator(".t-zgl__sum")).toContainText("Rabka-Zdrój, osobiście");

    await page.goto("/zgloszenie?category=drone&punkt=zakopane&dostawa=paczkomat");
    await expect(page.locator(".t-zgl__form [role=radio][aria-checked=true]")).toHaveCount(0);
    await expect(page.locator(".t-zgl__sum")).toContainText("do wyboru w kroku 2");

    // Zakopane is published (15.11.2026): accepted from a wizard link
    await page.goto("/zgloszenie?category=phone&punkt=zakopane");
    await expect(page.locator(".t-zgl__sum")).toContainText("Zakopane, osobiście");
  });

  test("courier: address fields, no parcel locker, 'Jak to działa?' links to the published courier page", async ({ page }) => {
    await page.goto("/zgloszenie?category=laptop&dostawa=kurier");
    await page.getByLabel("Model *").fill("ThinkPad");
    await page.getByLabel("Co się dzieje? *").fill("Nie działa");
    await page.locator("[data-zgl-next]").click();
    await expect(page.getByRole("radio", { name: /^Kurier/ }).first()).toHaveAttribute("aria-checked", "true");
    await expect(page.getByLabel("Ulica *")).toBeVisible();
    await expect(page.getByText(/paczkomat/i)).toHaveCount(0);
    await expect(page.locator('a[href="/naprawa-kurierem"]', { hasText: "Jak to działa?" })).toHaveCount(1);
    await page.locator("[data-zgl-next]").click();
    await expect(page.getByText("Przy wysyłce kurierem podaj adres (ulica i miasto).")).toBeVisible();
  });
});

test("courier: parcels go to the Rabka salon only (audit 16.11, variant a); address in additional_notes and on the success card", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  let sent: Record<string, unknown> | null = null;
  await mockSubmit(page, (route, body) => {
    sent = body;
    return reply(route, "submit-201-phone-rabka");
  });
  await page.goto("/zgloszenie?category=laptop&dostawa=kurier");
  await page.getByLabel("Model *").fill("ThinkPad");
  await page.getByLabel("Co się dzieje? *").fill("Nie włącza się.");
  await page.locator("[data-zgl-next]").click();
  await expect(page.getByRole("radio", { name: /^Kurier/ }).first()).toContainText(/Wyślij sprzęt na adres salonu w\sRabce-\u2060?Zdroju\./);
  // one parcel address → no "which salon" question
  await expect(page.locator('[data-field="courierPoint"]')).toHaveCount(0);
  await page.getByLabel("Ulica *").fill("Testowa 1");
  await page.getByLabel("Miasto *").fill("Kraków");
  await page.locator("[data-zgl-next]").click();
  await page.locator("[data-zgl-next]").click();
  await page.getByLabel("Imię *").fill("Jan");
  await page.getByLabel("Nazwisko *").fill("Testowy");
  await page.getByLabel("E-mail *").fill("jan.testowy@example.com");
  await page.getByLabel("Telefon *").fill("+48 500 100 234");
  await page.locator("[data-zgl-next]").click();
  await expect(page.locator("main")).toContainText("Kurier · na adres: Rabka-Zdrój");
  await page.locator("label.t-check", { hasText: "regulamin" }).locator("input").check();
  await page.locator("[data-zgl-next]").click();
  const box = page.locator(".t-success__point");
  await expect(box).toContainText("Możesz wysłać sprzęt na adres salonu w Rabce-Zdroju.");
  await expect(box).toContainText("Numer zgłoszenia PROKOM/RMA/2/2026 włóż do paczki.");
  await expect(box).toContainText("Rabka-Zdrój");
  await expect(box).not.toContainText("Zakopane");
  await expect(box).not.toContainText("Nie wysyłaj");
  expect(sent).toMatchObject({ delivery_method: "courier", return_method: "in_person" });
  // parcel goes to Rabka and is picked up there → no second, identical point line (audit 16.11)
  expect(sent!.additional_notes).toBe("Wysyłka na adres: Rabka-Zdrój");
  expect(Object.keys(sent!)).not.toContain("courier_point");
});

test.describe("phone 390", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("one step per screen, sticky Dalej above the tab bar, no horizontal scroll", async ({ page }) => {
    await page.goto("/zgloszenie");
    await expect(page.getByText("Zgłoś naprawę · 1 z 5")).toBeVisible();
    await expect(page.locator(".t-zgl__collapsed").first()).toBeHidden();
    const next = page.locator("[data-zgl-next]");
    await expect(next).toBeVisible();
    const nb = (await next.boundingBox())!;
    const tb = (await page.locator("[data-t-tabbar]").boundingBox())!;
    expect(nb.y + nb.height).toBeLessThanOrEqual(tb.y + 1);
    expect(nb.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    await expect(page.getByLabel("Telefon *")).toHaveCount(0);
  });
});
