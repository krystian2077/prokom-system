/**
 * /zgloszenie premium (feat/tech-formularz-premium): "Jak sprawdzić model" helper (a modal
 * with illustrated steps since feat/tech-pomocnik-modelu-popup), live validation, fault
 * chips, reduced motion, phone sheet, axe on the form states.
 * The full submit flows (point, courier, 400, 429) stay in zgloszenie.spec.ts.
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import { expect, test, type Page } from "@playwright/test";

const axeSource = fs.readFileSync(createRequire(__filename).resolve("axe-core/axe.min.js"), "utf8");

async function axeSerious(page: Page): Promise<string[]> {
  await page.addScriptTag({ content: axeSource });
  return page.evaluate(async () => {
    const w = window as unknown as { axe: { run: (c: unknown, o: unknown) => Promise<{ violations: { id: string; impact: string | null; nodes: { target: string[] }[] }[] }> } };
    const out = await w.axe.run({ include: [".tech"], exclude: ['[aria-hidden="true"]'] }, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } });
    return out.violations.filter((v) => v.impact === "critical" || v.impact === "serious").map((v) => `${v.impact} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  });
}

const form = (page: Page) => page.locator(".t-zgl__form");

test.describe("desktop 1440", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("helper: modal with the brand's steps, step by step, aria-modal, Esc closes and returns focus", async ({ page }) => {
    await page.goto("/zgloszenie");
    await form(page).getByRole("radio", { name: "Telefon" }).click();
    await page.getByLabel("Marka *").fill("Samsung");
    const trigger = page.locator('[data-help-trigger="model"]');
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toHaveAttribute("href", "/jak-przygotowac-sprzet#model");
    await trigger.click();
    const panel = page.locator('[data-help-panel="model"]');
    await expect(panel).toBeVisible();
    await expect(page).toHaveURL(/\/zgloszenie$/);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(trigger).toHaveAttribute("aria-controls", "zgl-help-model");
    await expect(panel).toHaveAttribute("aria-modal", "true");
    await expect(panel).toHaveClass(/t-hm--modal/);
    await expect(panel.getByRole("heading", { name: "Jak sprawdzić model" })).toBeVisible();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
    await expect(panel.locator('[data-help-tab="android"]')).toHaveAttribute("aria-selected", "true");
    await expect(panel.locator('[data-help-variant="samsung"]')).toHaveAttribute("aria-pressed", "true");
    // step by step: the illustration follows, the last step shows what to type
    await expect(panel.locator('[data-help-step="0"]')).toHaveAttribute("aria-current", "step");
    await expect(panel.locator(".t-hm__scene.is-in .t-hs--home")).toHaveCount(1);
    await panel.locator("[data-help-next]").click();
    await expect(panel.locator('[data-help-step="1"]')).toHaveAttribute("aria-current", "step");
    await expect(panel.locator(".t-hm__scene.is-in .t-hs__row.is-hit")).toContainText("Informacje o telefonie");
    await expect(panel.locator("[aria-live]")).toHaveText("Krok 2 z 3: Stuknij „Informacje o telefonie”");
    await panel.locator('[data-help-step="2"]').click();
    await expect(panel.locator(".t-hm__scene.is-in")).toContainText("SM-S911B/DS");
    await expect(panel.locator(".t-hm__example")).toContainText("Galaxy S23");
    await expect(panel.locator("[data-help-done]")).toBeVisible();
    await panel.locator("[data-help-prev]").click();
    await expect(panel.locator('[data-help-step="1"]')).toHaveAttribute("aria-current", "step");
    // another brand: its own steps from the start
    await panel.locator('[data-help-variant="xiaomi"]').click();
    await expect(panel.locator('[data-help-step="0"]')).toHaveAttribute("aria-current", "step");
    await panel.locator("[data-help-next]").click();
    await expect(panel.locator(".t-hm__scene.is-in .t-hs__row.is-hit")).toContainText("O telefonie");
    // tabs by keyboard
    await panel.locator('[data-help-tab="android"]').focus();
    await page.keyboard.press("ArrowLeft");
    await expect(panel.locator('[data-help-tab="apple"]')).toHaveAttribute("aria-selected", "true");
    await expect(panel.locator(".t-hm__steps")).toContainText("To urządzenie");
    await page.waitForTimeout(500);
    expect(await axeSerious(page)).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  });

  test("helper: tab follows the category, brand and system (laptop on Windows, PS5, IMEI → *#06#); focus trap; scrim closes", async ({ page }) => {
    await page.goto("/zgloszenie");
    await form(page).getByRole("radio", { name: "Laptop" }).click();
    const trigger = page.locator('[data-help-trigger="model"]');
    await trigger.click();
    const panel = page.locator('[data-help-panel="model"]');
    // Desktop Chrome in Playwright reports Windows: the visitor is probably on that laptop.
    await expect(panel.locator('[data-help-tab="windows"]')).toHaveAttribute("aria-selected", "true");
    await expect(panel.locator('[data-help-tab="label"]')).toHaveText("Naklejka");
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press(i % 7 === 6 ? "Shift+Tab" : "Tab");
      expect(await panel.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
    await page.mouse.click(30, 450);
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await form(page).getByRole("radio", { name: "Konsola" }).click();
    await page.locator("#zgl-brand").fill("Sony");
    await trigger.click();
    await expect(panel.locator('[data-help-variant="playstation"]')).toHaveAttribute("aria-pressed", "true");
    await expect(panel.locator(".t-hm__steps")).toContainText("Oprogramowanie systemowe");
    await page.keyboard.press("Escape");

    await form(page).getByRole("radio", { name: "Telefon" }).click();
    await page.locator('[data-help-trigger="imei"]').click();
    const imei = page.locator('[data-help-panel="imei"]');
    await expect(imei.locator('[data-help-tab="dialer"]')).toHaveAttribute("aria-selected", "true");
    await expect(imei).toContainText("*#06#");
    await imei.locator("[data-help-next]").click();
    await expect(imei.locator(".t-hm__scene.is-in .t-hs__typed")).toHaveText("*#06#");
  });

  test("helper on Chromium/Android proposes the model from UA Client Hints; nothing is sent", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, userAgent: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36" });
    await ctx.addInitScript(() => {
      Object.defineProperty(navigator, "userAgentData", {
        configurable: true,
        value: { platform: "Android", mobile: true, brands: [], getHighEntropyValues: async () => ({ model: "SM-S911B" }) },
      });
    });
    const page = await ctx.newPage();
    const requests: string[] = [];
    page.on("request", (r) => {
      if (r.postData()?.includes("SM-S911B") || r.url().includes("SM-S911B")) requests.push(r.url());
    });
    await page.goto("/zgloszenie");
    await page.locator('[data-help-trigger="model"]').click();
    await expect(page.locator('[data-help-tab="android"]')).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(".t-hm__propose")).toContainText("SM-S911B");
    const use = page.locator("[data-help-use]");
    await expect(use).toHaveText("Wpisz do formularza");
    await use.click();
    await expect(page.getByLabel("Model *")).toHaveValue("SM-S911B");
    await expect(page.getByLabel("Model *")).toBeFocused();
    await expect(page.locator('[data-help-panel="model"]')).toHaveCount(0);
    expect(requests).toEqual([]);
    await ctx.close();
  });

  test("live validation: e-mail checked on blur, message disappears once fixed; fault chips by category", async ({ page }) => {
    await page.goto("/zgloszenie?category=console");
    const chips = page.locator(".t-quick__chip");
    await expect(chips.filter({ hasText: "dryf w padzie" })).toHaveCount(1);
    await chips.filter({ hasText: "dryf w padzie" }).click();
    await expect(page.getByLabel("Co się dzieje? *")).toHaveValue("Dryf w padzie");
    await expect(chips.filter({ hasText: "dryf w padzie" })).toHaveAttribute("aria-pressed", "true");
    await chips.filter({ hasText: "nie czyta płyt" }).click();
    await expect(page.getByLabel("Co się dzieje? *")).toHaveValue("Dryf w padzie, nie czyta płyt");

    await page.getByLabel("Model *").fill("PS5");
    await page.locator("[data-zgl-next]").click();
    await page.getByRole("radio", { name: /Osobiście · Rabka/ }).click();
    await page.locator("[data-zgl-next]").click();
    await page.locator("[data-zgl-next]").click();
    const email = page.getByLabel("E-mail *");
    await email.fill("jan@zly");
    await email.blur();
    await expect(page.getByText("Podaj poprawny adres e-mail.")).toBeVisible();
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await email.fill("jan@example.com");
    await expect(page.getByText("Podaj poprawny adres e-mail.")).toHaveCount(0);
    await expect(email).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.locator(".t-stepper .is-on > button")).toContainText("Twoje dane");
  });

  test("stepper pill and summary follow the step; wizard parameters still prefill", async ({ page }) => {
    await page.goto("/zgloszenie?category=laptop&usterka=Nie%20%C5%82aduje%20si%C4%99&punkt=rabka&dostawa=punkt");
    await expect(page.locator(".t-zgl__sum")).toContainText("Laptop");
    await expect(page.locator(".t-zgl__sumstep")).toHaveText("Krok 1 z 5");
    await page.getByLabel("Model *").fill("ThinkPad T14");
    await page.locator("[data-zgl-next]").click();
    await expect(page.locator("#zgl-step-2.is-open")).toBeVisible();
    await expect(page.locator(".t-zgl__sumstep")).toHaveText("Krok 2 z 5");
    const pillX = await page.locator(".t-stepper").evaluate((el) => getComputedStyle(el).getPropertyValue("--pill-x"));
    expect(parseFloat(pillX)).toBeGreaterThan(50);
    await expect(page.getByRole("radio", { name: /Osobiście · Rabka/ })).toHaveAttribute("aria-checked", "true");
  });
});

test("dark theme: axe on step 1, the helper and the success screen", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "dark", reducedMotion: "reduce" });
  await ctx.addInitScript(() => localStorage.setItem("pk-theme", "dark"));
  const page = await ctx.newPage();
  await page.route("**/api/v1/repairs/submit/", (r) => r.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ repair_number: "PROKOM/RMA/2/2026", message: "", tracking_url: "/track?ref=PROKOM%2FRMA%2F2%2F2026" }) }));
  await page.goto("/zgloszenie?category=laptop&dostawa=punkt&punkt=rabka");
  await page.locator('[data-help-trigger="model"]').click();
  await page.locator('[data-help-tab="label"]').click();
  await page.locator("[data-help-next]").click();
  expect(await axeSerious(page)).toEqual([]);
  await page.keyboard.press("Escape");
  await page.getByLabel("Model *").fill("ThinkPad");
  await page.getByLabel("Co się dzieje? *").fill("Nie działa");
  for (let i = 0; i < 3; i++) await page.locator("[data-zgl-next]").click();
  await page.getByLabel("Imię *").fill("Jan");
  await page.getByLabel("Nazwisko *").fill("Testowy");
  await page.getByLabel("E-mail *").fill("jan.testowy@example.com");
  await page.getByLabel("Telefon *").fill("500 100 234");
  await page.locator("[data-zgl-next]").click();
  await page.locator("label.t-check", { hasText: "regulamin" }).locator("input").check();
  expect(await axeSerious(page)).toEqual([]);
  await page.locator("[data-zgl-next]").click();
  await expect(page.getByRole("heading", { name: "Zgłoszenie przyjęte" })).toBeVisible();
  expect(await axeSerious(page)).toEqual([]);
  await ctx.close();
});

test("reduced motion: step change runs no animation, the form still works", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("/zgloszenie?category=laptop");
  const running = () => page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && (a.effect as KeyframeEffect | null)?.target?.closest?.(".t-zgl, .t-hm") && ((a.effect?.getComputedTiming().duration as number) ?? 0) > 1).length);
  // the helper: no slide between steps, no pulsing ring, the final picture at once
  await page.locator('[data-help-trigger="model"]').click();
  await page.locator('[data-help-tab="label"]').click();
  await page.locator("[data-help-next]").click();
  await expect(page.locator(".t-hm__scene.is-out")).toHaveCount(0);
  await expect(page.locator(".t-hm__scene.is-in .t-hs__loupe")).toBeVisible();
  expect(await running()).toBe(0);
  await page.keyboard.press("Escape");
  // the form: step change without animation
  await page.getByLabel("Model *").fill("ThinkPad");
  await page.getByLabel("Co się dzieje? *").fill("Nie działa");
  await page.locator("[data-zgl-next]").click();
  await expect(page.locator("#zgl-step-2.is-open")).toBeVisible();
  expect(await running()).toBe(0);
  await ctx.close();
});

test.describe("phone 390", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("helper opens as a bottom sheet above the tab bar: swipe between steps, focus trap, Esc, focus back", async ({ page }) => {
    await page.goto("/zgloszenie");
    await form(page).getByRole("radio", { name: "Smartwatch" }).click();
    const trigger = page.locator('[data-help-trigger="model"]');
    await trigger.click();
    const sheet = page.locator('[data-help-panel="model"]');
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveAttribute("aria-modal", "true");
    await expect(sheet).toHaveClass(/t-hm--sheet/);
    // above the tab bar
    const z = await sheet.evaluate((el) => Number(getComputedStyle(el.parentElement!).zIndex));
    const tz = await page.locator("[data-t-tabbar]").evaluate((el) => Number(getComputedStyle(el).zIndex));
    expect(z).toBeGreaterThan(tz);
    // the sheet fits the screen; "Dalej" is always at hand
    await expect.poll(async () => { const b = (await sheet.boundingBox())!; return b.y + b.height; }).toBeLessThanOrEqual(845);
    await expect(sheet.locator("[data-help-next]")).toBeInViewport();
    // swipe left = next step
    await sheet.locator(".t-hm__stage").evaluate((el) => {
      const r = el.getBoundingClientRect();
      const ev = (type: string, x: number) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: "touch", clientX: x, clientY: r.top + 100 }));
      ev("pointerdown", r.right - 40);
      ev("pointerup", r.left + 60);
    });
    await expect(sheet.locator('[data-help-step="1"]')).toHaveAttribute("aria-current", "step");
    for (const sel of [".t-hm__close", "[data-help-tab]", "[data-help-next]", "[data-help-prev]"]) {
      const b = (await sheet.locator(sel).first().boundingBox())!;
      expect(b.height, sel).toBeGreaterThanOrEqual(44);
    }
    // trap: 25 tabs never leave the sheet
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");
      expect(await sheet.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    await page.waitForTimeout(500);
    expect(await axeSerious(page)).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test("tiles, segmented switch and helper trigger are at least 44 px; no horizontal scroll", async ({ page }) => {
    await page.goto("/zgloszenie");
    for (const sel of [".t-dtile", ".t-seg__opt", ".t-help__trigger", ".t-quick__chip", "[data-zgl-next]"]) {
      const box = (await page.locator(sel).first().boundingBox())!;
      expect(box.height, sel).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    expect(await axeSerious(page)).toEqual([]);
  });
});

test("no-JS target: /jak-przygotowac-sprzet#model has the static guide", async ({ page }) => {
  await page.goto("/jak-przygotowac-sprzet#model");
  const section = page.locator("#model");
  await expect(section.getByRole("heading", { level: 2, name: "Jak sprawdzić model i IMEI" })).toBeVisible();
  await expect(section).toContainText("*#06#");
  await expect(section).toContainText("Galaxy Wearable");
  await expect(section).toContainText("Samsung: Ustawienia › Informacje o telefonie");
  await expect(section.locator(".t-mguide__art .t-hs").first()).toBeVisible();
});
