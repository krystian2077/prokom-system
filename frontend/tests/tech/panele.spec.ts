/**
 * Panels must look exactly as before the PRO-KOM Tech rebuild (SPEC §2, §11 pt 3).
 * Baselines were taken in TD1 from `develop` before any visual change.
 *
 * Local only (screenshots are OS-specific; baselines are win32):
 *   npm run build && npx playwright test panele
 * The logged-in /panel screen needs the local backend on :8000 and a staff account
 * in tests/tech/.panel-test.local.json ({ "email", "password" }, gitignored,
 * see docs/tech/LOKALNIE.md §4). Without it that test is skipped.
 */
import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { pinDaylight } from "./zegar";

type PanelTheme = "light" | "dark";
const THEMES: PanelTheme[] = ["light", "dark"];
const PANEL_KEYS = ["prokom-theme", "prokom-worker-panel-theme", "prokom-client-panel-theme"] as const;

const credsFile = path.join(__dirname, ".panel-test.local.json");
const creds: { email: string; password: string } | null = fs.existsSync(credsFile)
  ? JSON.parse(fs.readFileSync(credsFile, "utf8"))
  : null;

/** Same theme in every panel mechanism: system scheme, prokom-theme, worker and client keys. */
async function usePanelTheme(page: Page, theme: PanelTheme) {
  await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
  // /client uses the public theme script: in Auto a night hour would turn the light shot dark
  await pinDaylight(page);
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("prokom-theme", t);
      localStorage.setItem("prokom-worker-panel-theme", t);
      localStorage.setItem("prokom-client-panel-theme", t);
    } catch {
      /* ignore */
    }
  }, theme);
}

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
}

// Panel tabs inherit the root default title — it must not change (SPEC §2).
const PANEL_TITLE = "PRO-KOM Serwis — Naprawa telefonów i akcesoria GSM | Rabka-Zdrój";

test("tytuły stron paneli bez zmian", async ({ page }) => {
  // /client/login is left out: already on develop its <title> disappears after hydration (STAN, P2).
  for (const url of ["/panel/login", "/admin-panel"]) {
    await page.goto(url, { waitUntil: "networkidle" });
    await expect(page, url).toHaveTitle(PANEL_TITLE, { timeout: 15_000 });
  }
});

for (const theme of THEMES) {
  test.describe(`panele — motyw ${theme}`, () => {
    test(`/panel/login (${theme})`, async ({ page }) => {
      await usePanelTheme(page, theme);
      await page.goto("/panel/login");
      await settle(page);
      await expect(page).toHaveScreenshot(`panel-login-${theme}.png`, { fullPage: true });
    });

    test(`/client/login (${theme})`, async ({ page }) => {
      await usePanelTheme(page, theme);
      await page.goto("/client/login");
      await settle(page);
      // the live opening status ("Otwarte do 17:00" / "Otwieramy jutro…") depends on the clock → masked
      await expect(page).toHaveScreenshot(`client-login-${theme}.png`, { fullPage: true, mask: [page.locator(".t-status")] });
    });

    test(`/admin-panel bez logowania (${theme})`, async ({ page }) => {
      await usePanelTheme(page, theme);
      await page.goto("/admin-panel");
      await settle(page);
      await expect(page).toHaveScreenshot(`admin-panel-${theme}.png`, { fullPage: true });
    });

    test(`/panel po zalogowaniu (${theme})`, async ({ page }) => {
      test.skip(!creds, "brak tests/tech/.panel-test.local.json (konto testowe pracownika)");
      await usePanelTheme(page, theme);
      await page.goto("/panel/login");
      await page.locator('input[type="email"]').fill(creds!.email);
      await page.locator('input[type="password"]').fill(creds!.password);
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(/\/panel\/(dashboard|change-password)/, { timeout: 20_000 });
      await settle(page);
      await expect(page).toHaveScreenshot(`panel-dashboard-${theme}.png`, {
        // Clock, greeting and date change every minute/day.
        // Counts depend on the local SQLite data — re-take the baseline after changing it.
        mask: [page.locator("time"), page.getByText(/Auto-refresh za/)],
        maxDiffPixelRatio: 0.01,
      });
    });
  });
}

test("zmiana motywu strony publicznej nie zmienia data-theme ani kluczy paneli", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await pinDaylight(page);
  await page.addInitScript(() => {
    try {
      if (!sessionStorage.getItem("seeded")) {
        localStorage.setItem("prokom-theme", "light");
        localStorage.setItem("prokom-worker-panel-theme", "light");
        localStorage.setItem("prokom-client-panel-theme", "light");
        sessionStorage.setItem("seeded", "1");
      }
    } catch {
      /* ignore */
    }
  });
  await page.goto("/");
  const snapshot = () =>
    page.evaluate((keys) => ({
      dataTheme: document.documentElement.getAttribute("data-theme"),
      storage: Object.fromEntries(keys.map((k) => [k, localStorage.getItem(k)])),
    }), [...PANEL_KEYS]);
  const before = await snapshot();
  expect(before.dataTheme).toBe("light");

  for (const choice of ["dark", "light", "auto"] as const) {
    // Public theme API (lib/tech/theme.ts); the toggle UI calls the same function.
    await page.evaluate((c) => window.__pkSetTheme?.(c), choice);
    const toggle = page.locator("[data-tech-theme-toggle]").first();
    if (await toggle.count()) await toggle.click();
    await page.reload();
    expect(await snapshot()).toEqual(before);
  }

  await page.evaluate(() => window.__pkSetTheme?.("dark"));
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-tech-theme", "dark");
  expect(await snapshot()).toEqual(before);
});

declare global {
  interface Window {
    __pkSetTheme?: (choice: "light" | "dark" | "auto") => void;
  }
}
