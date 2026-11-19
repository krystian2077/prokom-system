/** Runda 18.11 §1.5 (D4): authorised ALSEN partner — home card, „O firmie”, footer, no badge yet. */
import { expect, test } from "@playwright/test";
import { pinDaylight } from "./zegar";

for (const theme of ["light", "dark"] as const) {
  test.describe(`1440 ${theme}`, () => {
    test.use({ viewport: { width: 1440, height: 900 } });
    test.beforeEach(async ({ page }) => {
      await pinDaylight(page);
      await page.addInitScript((t) => localStorage.setItem("pk-theme", t), theme);
    });

    test("home: ALSEN section with the logo, the network's categories and a link in a new tab", async ({ page }) => {
      await page.goto("/");
      const card = page.locator("#alsen");
      // the whole network's offer, not only Apple and Samsung (Krystian 19.11)
      await expect(card.getByRole("list", { name: "Oferta sieci ALSEN" }).getByRole("listitem")).toHaveCount(6);
      await expect(card).not.toContainText(/sklep/i);
      await expect(card).toContainText("Autoryzowany partner ALSEN");
      const logo = card.getByRole("img", { name: "ALSEN" });
      await logo.scrollIntoViewIfNeeded();
      await expect(logo).toBeVisible();
      await expect.poll(() => logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
      const link = card.getByRole("link", { name: /^alsen\.pl/ });
      await expect(link).toHaveAttribute("href", "https://www.alsen.pl/");
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", /noopener/);
    });

    test("footer: „Partnerzy” row with ALSEN above the legal bar", async ({ page }) => {
      await page.goto("/kontakt");
      const row = page.locator(".t-footer__partners");
      await expect(row).toContainText("Partnerzy");
      await expect(row.getByRole("link", { name: /ALSEN/ })).toHaveAttribute("href", "https://www.alsen.pl/");
      const rowBox = (await row.boundingBox())!;
      const legal = (await page.locator(".t-footer .t-legal").first().boundingBox())!;
      expect(rowBox.y).toBeLessThan(legal.y);
    });
  });
}

test.describe("1440", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test("„O firmie”: partnership block, no unconfirmed numbers", async ({ page }) => {
    await page.goto("/o-firmie");
    const block = page.locator("#partner");
    await expect(block.getByRole("heading", { level: 2, name: "Autoryzowany partner ALSEN" })).toBeVisible();
    await expect(block).not.toContainText(/\d+\s+(sklep|salon)/);
  });
  test("„Punkt partnerski ALSEN” badge only on the Rabka point (confirmed 19.11)", async ({ page }) => {
    await page.goto("/punkty-serwisowe");
    await expect(page.locator(".t-alsen-badge")).toHaveCount(1);
    await expect(page.locator(".t-pointcard", { has: page.locator(".t-alsen-badge") })).toContainText("Orkana 16B");
    await page.goto("/serwis-telefonow-rabka-zdroj");
    await expect(page.locator(".t-alsen-badge")).toHaveCount(1);
    await page.goto("/serwis-telefonow-zakopane");
    await expect(page.locator(".t-alsen-badge")).toHaveCount(0);
  });
  test("home and „O firmie”: everything from alsen.pl can be ordered, pickup at the partner point", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#alsen")).toContainText("zamówisz wszystko, co jest na alsen.pl");
    await expect(page.locator("#alsen")).toContainText("ul. Orkana 16B, Rabka-Zdrój");
    await page.goto("/o-firmie");
    await expect(page.locator("#partner")).toContainText("ul. Orkana 16B, Rabka-Zdrój");
  });
});
