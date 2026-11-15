/**
 * Home page (TD2): wizard "Co się zepsuło?" → /zgloszenie URL (KONTRAKT §1.4),
 * phone full-screen flow (RESPONSYWNOSC §2), points shown per SPEC §5.
 */
import { expect, test, type Page } from "@playwright/test";

const params = async (page: Page, testId: string) => {
  const href = await page.getByTestId(testId).getAttribute("href");
  const url = new URL(href ?? "", "http://x");
  return { path: url.pathname, q: Object.fromEntries(url.searchParams) };
};

test.describe("desktop 1440", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("one H1, sections for the side rail", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("Serwis telefonów");
    await expect(page.locator("main section#start[data-rail]")).toHaveCount(1);
    await expect(page.locator("main section#naprawy[data-rail]")).toHaveCount(1);
  });

  test("wizard: device changes faults, hotspot selects fault, Dalej builds the URL", async ({ page }) => {
    await page.goto("/");
    const wiz = page.locator("#kreator");
    // default: phone · cracked screen · Rabka
    expect(await params(page, "wizard-next")).toEqual({
      path: "/zgloszenie",
      q: { category: "phone", usterka: "Pęknięty ekran", punkt: "rabka", dostawa: "punkt" },
    });

    // hotspot on the phone photo
    await wiz.locator(".t-scene__spot[aria-label='Bateria']").click();
    await expect(wiz.locator(".t-chp--fault.is-on")).toHaveText("Bateria");
    expect((await params(page, "wizard-next")).q.usterka).toBe("Bateria");

    // another device → its own faults, first one selected
    await wiz.getByRole("radio", { name: "Drukarka" }).click();
    await expect(wiz.locator(".t-chp--fault").first()).toHaveText("Nie drukuje");
    await expect(wiz.getByRole("radio", { name: "Pęknięty ekran" })).toHaveCount(0);
    await wiz.getByRole("radio", { name: "Zacina papier" }).click();

    // courier: no `punkt` parameter
    await wiz.getByRole("button", { name: /Kurier/ }).click();
    await expect(page.getByTestId("wizard-summary")).toHaveText("Drukarka · zacina papier · Kurier");
    expect(await params(page, "wizard-next")).toEqual({
      path: "/zgloszenie",
      q: { category: "printer", usterka: "Zacina papier", dostawa: "kurier" },
    });

    // devices without a photo show the icon fallback
    await wiz.getByRole("radio", { name: "Odzysk danych" }).click();
    await expect(wiz.locator(".t-scene__art")).toBeVisible();
    expect((await params(page, "wizard-next")).q.category).toBe("data_recovery");
  });

  // The "unpublished point is hidden" rule runs on injected test data in the unit tests
  // (lib/tech/points.test.ts, tests/tech/seo.test.ts); the real config has both points (15.11.2026).
  test("two published points: Rabka-Zdrój and Zakopane everywhere (SPEC §5)", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Serwis telefonów i komputerów — Rabka-Zdrój i Zakopane | PRO-KOM Tech");
    await expect(page.locator(".t-hero__points")).toContainText("Zakopane");
    await expect(page.locator(".t-podhale__pin", { hasText: "Zakopane" })).toHaveCount(1);
    await expect(page.locator(".t-ptile")).toHaveCount(2);
    await expect(page.locator(".t-cta-band__point")).toHaveCount(2);
    await expect(page.locator("#punkty")).toContainText("Dwa punkty");
    await expect(page.locator("#punkty")).toContainText("Oddajesz w jednym punkcie, odbierasz w drugim");
    await expect(page.locator(".t-near")).toHaveCount(1);
    await expect(page.locator("main")).not.toContainText("paczkomat");
    const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).join("\n");
    expect(ld).toContain("#punkt-rabka");
    expect(ld).toContain("#punkt-zakopane");
  });

  test("side rail lists the home sections, FAQ works with the keyboard", async ({ page }) => {
    await page.goto("/");
    const rail = page.locator("nav.t-rail");
    await expect(rail.locator("a[href^='#']")).toHaveCount(9);
    const faq = page.locator(".t-faq__item").nth(1);
    await expect(faq).not.toHaveAttribute("open", "");
    await faq.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(faq).toHaveAttribute("open", "");
  });

  // The hide/show rule itself is unit-tested on test data (lib/tech/wizard-data.test.ts, claim()).
  test("numbers confirmed on 15.11 are shown, still unconfirmed ones are not (SPEC §10)", async ({ page }) => {
    await page.goto("/");
    const main = page.locator("main");
    for (const t of ["często ok. 1 h", "10 000+", "0,1 mm", "około 5", "od 2004", "z całej Polski"]) {
      await expect(main).toContainText(t);
    }
    await expect(main).not.toContainText("Opinie Google");
  });

  test("Dalej navigates to the form", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("wizard-next").click();
    await expect(page).toHaveURL(/\/zgloszenie\?category=phone&usterka=/);
  });
});

test.describe("phone 390", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("picking a device opens the full-screen step flow", async ({ page }) => {
    await page.goto("/");
    const wiz = page.locator("#kreator");
    await expect(wiz.locator(".t-wiz__group--fault")).toBeHidden();
    await wiz.getByRole("radio", { name: "Laptop" }).click();

    const flow = page.getByTestId("wizard-flow");
    await expect(flow).toBeVisible();
    await expect(flow).toContainText("2 z 4");
    await flow.getByRole("radio", { name: "Klawiatura" }).click();
    await flow.getByRole("button", { name: "Dalej", exact: true }).click();
    await expect(flow).toContainText("3 z 4");
    await flow.getByRole("button", { name: /Kurier/ }).click();
    await flow.getByRole("button", { name: "Dalej", exact: true }).click();
    await expect(flow).toContainText("Sprawdź i przejdź dalej");
    await expect(flow).toContainText("Klawiatura");

    // sticky "Dalej" stays inside the viewport
    const next = page.getByTestId("wizard-flow-next");
    const box = await next.boundingBox();
    expect(box && box.y + box.height).toBeLessThanOrEqual(844);
    expect(await params(page, "wizard-flow-next")).toEqual({
      path: "/zgloszenie",
      q: { category: "laptop", usterka: "Klawiatura", dostawa: "kurier" },
    });

    // back, then Esc closes and focus returns to the device grid
    await flow.getByRole("button", { name: "Wstecz" }).click();
    await expect(flow).toContainText("3 z 4");
    await page.keyboard.press("Escape");
    await expect(flow).toHaveCount(0);
    await expect(wiz.getByRole("radio", { name: "Laptop" })).toBeFocused();
  });
});
