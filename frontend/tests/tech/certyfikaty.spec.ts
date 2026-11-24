/** Boss consent 23.11: Apple programmes (iLeader, DEP, CTO, AppleCare+) and manufacturer certificates. */
import { expect, test } from "@playwright/test";
import { certificates } from "@/lib/tech/certificates";
import { pinDaylight } from "./zegar";

test.use({ viewport: { width: 1440, height: 900 } });
test.beforeEach(async ({ page }) => pinDaylight(page));

test("/apple: „Apple dla firm i instytucji” with DEP, CTO and AppleCare+, sales only", async ({ page }) => {
  await page.goto("/apple");
  const band = page.locator("#dla-firm");
  await expect(band.getByRole("heading", { level: 2 })).toContainText("Sprzęt Apple gotowy do pracy");
  await expect(band.locator(".t-abiz__card")).toHaveCount(3);
  await expect(band).toContainText("iLeader");
  await expect(band.getByRole("link", { name: /Zapytaj o ofertę dla firmy/ })).toHaveAttribute("href", "/kontakt#formularz");
  // never suggests an Apple service authorisation, no Apple logo image
  await expect(band).not.toContainText(/autoryzowan|serwis apple/i);
  await expect(band.locator("img")).toHaveCount(0);
});

test("/samsung has no Apple business band", async ({ page }) => {
  await page.goto("/samsung");
  await expect(page.locator("#dla-firm")).toHaveCount(0);
});

test("/o-firmie: current Apple programme first, then every certificate with its years; the document opens and closes", async ({ page }) => {
  await page.goto("/o-firmie");
  const sec = page.locator("#certyfikaty");
  await expect(sec.locator(".t-certapple")).toContainText("Aktualnie");
  await expect(sec.locator(".t-certapple a")).toHaveAttribute("href", "/apple#dla-firm");
  const items = sec.locator(".t-cert");
  await expect(items).toHaveCount(certificates.length);
  for (const [i, c] of certificates.entries()) {
    await expect(items.nth(i).locator(".t-cert__chip")).toContainText(c.period);
    await expect(items.nth(i)).toContainText(c.title);
  }
  // partner statuses are labelled as statuses with years, never as current
  await expect(sec.locator(".t-certs")).not.toContainText(/aktualn/i);
  const thumb = items.first().locator("img");
  await thumb.scrollIntoViewIfNeeded();
  await expect.poll(() => thumb.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await items.first().getByRole("button", { name: /Powiększ dokument/ }).click();
  const dlg = page.locator("dialog.t-certdlg");
  await expect(dlg).toBeVisible();
  await expect(dlg.locator("img")).toHaveAttribute("alt", new RegExp(certificates[0].title));
  await page.keyboard.press("Escape");
  await expect(dlg).toBeHidden();
});

test("home: trust strip in „Dlaczego” leads to the certificates", async ({ page }) => {
  await page.goto("/");
  const strip = page.locator("#dlaczego .t-whytrust");
  await expect(strip).toHaveAttribute("href", "/o-firmie#certyfikaty");
  await expect(strip).toContainText("Apple iLeader");
  await expect(strip).toContainText("wcześniej");
});
