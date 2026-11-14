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
    await wiz.locator(".t-wiz__spot[aria-label='Bateria']").click();
    await expect(wiz.locator(".t-chp--fault.is-on")).toHaveText("Bateria");
    expect((await params(page, "wizard-next")).q.usterka).toBe("Bateria");

    // another device → its own faults, first one selected
    await wiz.getByRole("button", { name: "Drukarka" }).click();
    await expect(wiz.locator(".t-chp--fault").first()).toHaveText("Nie drukuje");
    await expect(wiz.getByRole("button", { name: "Pęknięty ekran" })).toHaveCount(0);
    await wiz.getByRole("button", { name: "Zacina papier" }).first().click();

    // courier: no `punkt` parameter
    await wiz.getByRole("button", { name: /Kurier/ }).click();
    await expect(page.getByTestId("wizard-summary")).toHaveText("Drukarka · zacina papier · Kurier");
    expect(await params(page, "wizard-next")).toEqual({
      path: "/zgloszenie",
      q: { category: "printer", usterka: "Zacina papier", dostawa: "kurier" },
    });

    // devices without a photo show the icon fallback
    await wiz.getByRole("button", { name: "Odzysk danych" }).click();
    await expect(wiz.locator(".t-wiz__nophoto")).toBeVisible();
    expect((await params(page, "wizard-next")).q.category).toBe("data_recovery");
  });

  test("unpublished Zakopane is not offered anywhere (SPEC §5)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#kreator").getByRole("button", { name: /Zakopane/ })).toHaveCount(0);
    await expect(page.locator("main")).not.toContainText("Zakopane");
    await expect(page.locator("main")).not.toContainText("paczkomat");
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
    await wiz.getByRole("button", { name: "Laptop" }).click();

    const flow = page.getByTestId("wizard-flow");
    await expect(flow).toBeVisible();
    await expect(flow).toContainText("2 z 4");
    await flow.getByRole("button", { name: "Klawiatura" }).first().click();
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
    await expect(wiz.getByRole("button", { name: "Laptop" })).toBeFocused();
  });
});
