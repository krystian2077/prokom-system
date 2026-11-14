/**
 * TD3 PR 3: /track, "Moje naprawy" and /claim-repair on the T0 fixtures (KONTRAKT §3, SPEC §12.6).
 */
import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const FIXTURES = path.resolve(__dirname, "../../../tests/tech/fixtures");
const fx = (name: string) => JSON.parse(fs.readFileSync(path.join(FIXTURES, `${name}.json`), "utf8"));
const OK = fx("track-200-received").response.body;

/** Answers /track like the backend: right number + 0234 → 200, otherwise 404. Counts calls. */
async function mockTrack(page: Page, body: Record<string, unknown> = OK) {
  const calls: string[] = [];
  await page.route("**/api/v1/repairs/track/**", (route) => {
    const url = new URL(route.request().url());
    calls.push(url.search);
    const ok = url.searchParams.get("ref") === OK.repair_number && url.searchParams.get("phone_last4") === "0234";
    const f = ok ? { status: 200, body } : fx("track-404-wrong-phone").response;
    return route.fulfill({ status: f.status, contentType: "application/json", body: JSON.stringify(f.body) });
  });
  return calls;
}

test.describe("desktop 1440", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("check status → axis from stages, details without empty rows, service from the API", async ({ page }) => {
    await mockTrack(page);
    await page.goto("/track");
    await expect(page.getByRole("heading", { level: 1, name: "Status naprawy" })).toBeVisible();
    await page.getByLabel("Numer zgłoszenia").fill("PROKOM/RMA/2/2026");
    await page.getByLabel("4 ostatnie cyfry telefonu").fill("0234");
    await page.getByRole("button", { name: "Sprawdź", exact: true }).click();

    const card = page.locator(".t-trk__card");
    await expect(card.locator("[data-status]")).toHaveText("Zgłoszenie przyjęte");
    const stages = card.locator(".t-axis__item");
    await expect(stages).toHaveCount(5);
    await expect(stages.first()).toHaveClass(/is-current/);
    await expect(stages.first()).toContainText("Przyjęte");
    await expect(card.locator(".t-kv dt")).toHaveText(["Urządzenie", "Zgłoszony problem", "Zgłoszono", "Dostarczenie", "Zwrot"]);
    await expect(card).not.toContainText("—");
    await expect(card.locator(".t-trk__service")).toContainText(OK.service.address);
    await expect(card.locator(".t-hist li")).toHaveCount(1);
  });

  test("wrong data → one message that reveals nothing", async ({ page }) => {
    await mockTrack(page);
    await page.goto("/track");
    await page.getByLabel("Numer zgłoszenia").fill("PROKOM/RMA/2/2026");
    await page.getByLabel("4 ostatnie cyfry telefonu").fill("9999");
    await page.getByRole("button", { name: "Sprawdź", exact: true }).click();
    await expect(page.locator(".t-alert")).toContainText("Nie znaleźliśmy zgłoszenia");
  });

  test("interrupted repair: axis stops on its stage, in red, with the status label", async ({ page }) => {
    await mockTrack(page, { ...OK, stage_index: 2, is_interrupted: true, status: "Anulowane", status_code: "quote_rejected" });
    await page.goto(`/track?ref=${encodeURIComponent(OK.repair_number)}`);
    await expect(page.getByLabel("Numer zgłoszenia")).toHaveValue(OK.repair_number);
    await page.getByLabel("4 ostatnie cyfry telefonu").fill("0234");
    await page.getByRole("button", { name: "Sprawdź", exact: true }).click();
    const third = page.locator(".t-axis__item").nth(2);
    await expect(third).toHaveClass(/is-interrupted/);
    await expect(third).toContainText("Anulowane");
  });

  test("Moje naprawy: off by default → remember → come back → Odśwież → Usuń", async ({ page }) => {
    const calls = await mockTrack(page);
    await page.goto("/track");
    await expect(page.getByLabel("Zapamiętaj na tym urządzeniu")).not.toBeChecked();
    await page.getByLabel("Numer zgłoszenia").fill(OK.repair_number);
    await page.getByLabel("4 ostatnie cyfry telefonu").fill("0234");
    await page.getByRole("button", { name: "Sprawdź", exact: true }).click();
    await expect(page.locator(".t-trk__card")).toBeVisible();
    // not remembered without consent
    expect(await page.evaluate(() => localStorage.getItem("pk-tech-naprawy"))).toBeNull();
    await expect(page.locator(".t-trk [data-my-repairs]")).toHaveCount(0);

    await page.getByRole("button", { name: "Zapamiętaj tę naprawę na tym urządzeniu" }).click();
    const stored = JSON.parse((await page.evaluate(() => localStorage.getItem("pk-tech-naprawy"))) || "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ ref: OK.repair_number, last4: "0234", status: "Zgłoszenie przyjęte" });

    // come back: list visible, no request until the click
    await page.goto("/track");
    const before = calls.length;
    const mine = page.locator(".t-trk [data-my-repairs]");
    await expect(mine).toContainText("Samsung Galaxy S23");
    await page.waitForTimeout(300);
    expect(calls.length).toBe(before);
    await mine.getByRole("button", { name: /Odśwież status/ }).click();
    await expect(page.locator(".t-trk__card")).toBeVisible();
    expect(calls.length).toBe(before + 1);

    await mine.getByRole("button", { name: /Usuń z tego urządzenia/ }).click();
    await expect(page.locator(".t-trk [data-my-repairs]")).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("pk-tech-naprawy"))).toBeNull();
  });

  test("/track?ref= of a remembered repair checks it on entry", async ({ page }) => {
    const calls = await mockTrack(page);
    await page.goto("/track");
    await page.evaluate((ref) => {
      localStorage.setItem("pk-tech-naprawy", JSON.stringify([{ ref, last4: "0234", device: "Samsung Galaxy S23", savedAt: new Date().toISOString(), checkedAt: new Date().toISOString(), status: "Zgłoszenie przyjęte", endedAt: null }]));
    }, OK.repair_number);
    await page.goto(`/track?ref=${encodeURIComponent(OK.repair_number)}`);
    await expect(page.locator(".t-trk__card [data-status]")).toHaveText("Zgłoszenie przyjęte");
    expect(calls.length).toBe(1);
  });

  test("submitted repair → remember on the success card → visible on /track", async ({ page }) => {
    await page.route("**/api/v1/repairs/submit/", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(fx("submit-201-phone-rabka").response.body) }));
    await mockTrack(page);
    await page.goto("/zgloszenie?category=phone&punkt=rabka");
    await page.getByLabel("Marka *").fill("Samsung");
    await page.getByLabel("Model *").fill("Galaxy S23");
    await page.getByLabel("Co się dzieje? *").fill("Ekran");
    await page.locator("[data-zgl-next]").click();
    await page.locator("[data-zgl-next]").click();
    await page.locator("[data-zgl-next]").click();
    await page.getByLabel("Imię *").fill("Jan");
    await page.getByLabel("Nazwisko *").fill("Testowy");
    await page.getByLabel("E-mail *").fill("jan@example.com");
    await page.getByLabel("Telefon *").fill("500 100 234");
    await page.locator("[data-zgl-next]").click();
    await page.locator("label.t-check", { hasText: "regulamin" }).locator("input").check();
    await page.locator("[data-zgl-next]").click();
    const remember = page.locator(".t-remember input");
    await expect(remember).not.toBeChecked();
    await remember.check();
    await page.goto("/track");
    await expect(page.locator(".t-trk [data-my-repairs]")).toContainText("PROKOM/RMA/2/2026");
  });

  test("claim-repair without login redirects to the client login with returnUrl (logic unchanged)", async ({ page }) => {
    await page.goto("/claim-repair?token=abc");
    await page.waitForURL(/\/client\/login\?returnUrl=/);
    expect(decodeURIComponent(new URL(page.url()).searchParams.get("returnUrl") || "")).toBe("/claim-repair?token=abc");
  });
});

test.describe("phone 390", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("vertical axis, call button above the tab bar, no horizontal scroll, Moje naprawy in the Menu", async ({ page }) => {
    await mockTrack(page);
    await page.goto("/track");
    await page.getByLabel("Numer zgłoszenia").fill(OK.repair_number);
    await page.getByLabel("4 ostatnie cyfry telefonu").fill("0234");
    await page.getByLabel("Zapamiętaj na tym urządzeniu").check();
    await page.getByRole("button", { name: "Sprawdź", exact: true }).click();
    const call = page.getByRole("link", { name: "Zadzwoń do serwisu" });
    await expect(call).toBeVisible();
    const cb = (await call.boundingBox())!;
    const tb = (await page.locator("[data-t-tabbar]").boundingBox())!;
    expect(cb.y + cb.height).toBeLessThanOrEqual(tb.y + 1);
    const a = (await page.locator(".t-axis__item").nth(0).boundingBox())!;
    const b = (await page.locator(".t-axis__item").nth(1).boundingBox())!;
    expect(b.y).toBeGreaterThan(a.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);

    await page.locator("[data-t-tabbar]").getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("dialog", { name: "Menu" }).locator("[data-my-repairs]")).toContainText("Samsung Galaxy S23");
  });
});
