/**
 * Client account in the PRO-KOM Tech skin (docs/tech/WYJATKI.md, 15.11): sign-in screens,
 * accessibility and — with the local backend — register, log in, repairs and log out.
 *
 *   npm run build && TECH_PORT=3000 npx playwright test konto
 *
 * The logged-in part needs the backend on :8000 (docs/tech/LOKALNIE.md) and a verified
 * client account in tests/tech/.client-test.local.json ({ "email", "password" }, gitignored).
 * Without them those tests are skipped. The port must be one CORS allows (3000–3004).
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { randomBytes } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

const API = process.env.TECH_API_URL || "http://localhost:8000";
const credsFile = path.join(__dirname, ".client-test.local.json");
const creds: { email: string; password: string } | null = fs.existsSync(credsFile)
  ? JSON.parse(fs.readFileSync(credsFile, "utf8"))
  : null;

async function backendUp(): Promise<boolean> {
  try {
    const res = await fetch(`${API}/api/v1/accounts/me/`, { signal: AbortSignal.timeout(4000) });
    return res.status < 500;
  } catch {
    return false;
  }
}

const AUTH_SCREENS = [
  "/client/login",
  "/client/rejestracja",
  "/client/forgot-password",
  "/client/reset-password?token=e2e",
  "/client/reset-password",
  "/client/verify-email?email=jan%40example.com",
];

async function applyTheme(page: Page, theme: "light" | "dark") {
  await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("pk-theme", t);
    } catch {
      /* ignore */
    }
  }, theme);
}

test.describe("konto klienta — ekrany logowania", () => {
  test("logowanie w powłoce Tech: nagłówek, zakładki, hasło, linki", async ({ page }) => {
    await applyTheme(page, "dark");
    await page.goto("/client/login");
    await expect(page.locator(".tech .t-header")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-tech-theme", "dark");
    await expect(page.getByRole("heading", { level: 1, name: "Zaloguj się" })).toBeVisible();
    // No emoji anywhere in the account card (SPEC: icons only).
    expect(await page.locator(".t-ck-auth").innerText()).not.toMatch(/[\uD83C-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]/);

    const pw = page.locator("#login-password");
    await expect(pw).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Pokaż hasło" }).click();
    await expect(pw).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Ukryj hasło" }).click();
    await expect(pw).toHaveAttribute("type", "password");

    await page.getByRole("tab", { name: "Rejestracja" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Załóż konto" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Rejestracja" })).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#reg-email")).toBeVisible();
    await page.getByRole("tab", { name: "Logowanie" }).click();

    await expect(page.getByRole("link", { name: "Nie pamiętasz hasła?" })).toHaveAttribute("href", "/client/forgot-password");
    await expect(page.locator(".t-ck-back")).toHaveAttribute("href", "/");
    await expect(page.locator(".t-ck-auth__track")).toHaveAttribute("href", "/track");
  });

  test("motyw konta to motyw strony publicznej, panel pracownika bez zmian", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.addInitScript(() => {
      try {
        if (!sessionStorage.getItem("seeded")) {
          localStorage.setItem("prokom-theme", "light");
          localStorage.setItem("prokom-client-panel-theme", "light");
          sessionStorage.setItem("seeded", "1");
        }
      } catch {
        /* ignore */
      }
    });
    await page.goto("/client/login");
    await page.locator("[data-tech-theme-toggle]").first().click();
    await expect(page.locator("html")).toHaveAttribute("data-tech-theme", "dark");
    const state = await page.evaluate(() => ({
      dataTheme: document.documentElement.getAttribute("data-theme"),
      panel: localStorage.getItem("prokom-theme"),
      client: localStorage.getItem("prokom-client-panel-theme"),
      pk: localStorage.getItem("pk-theme"),
    }));
    expect(state).toEqual({ dataTheme: "light", panel: "light", client: "light", pk: "dark" });
  });

  test("weryfikacja e-mail: 6 pól, adres widoczny", async ({ page }) => {
    await page.goto("/client/verify-email?email=jan%40example.com");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Wpisz kod z e-maila");
    await expect(page.getByRole("group", { name: "Kod weryfikacyjny" }).locator("input")).toHaveCount(6);
    await expect(page.locator(".t-ck-mailto")).toContainText("jan@example.com");
  });

  test("axe: zero krytycznych i poważnych naruszeń na ekranach konta", async ({ browser }) => {
    test.setTimeout(6 * 60_000);
    const axeSource = fs.readFileSync(createRequire(__filename).resolve("axe-core/axe.min.js"), "utf8");
    const found: string[] = [];
    for (const theme of ["light", "dark"] as const) {
      for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
        const ctx = await browser.newContext({ viewport, colorScheme: theme, reducedMotion: "reduce", locale: "pl-PL" });
        const page = await ctx.newPage();
        await applyTheme(page, theme);
        for (const url of AUTH_SCREENS) {
          await page.goto(url, { waitUntil: "networkidle" });
          await page.locator(".t-ck").first().waitFor();
          await page.addScriptTag({ content: axeSource });
          const violations = await page.evaluate(async () => {
            // @ts-expect-error axe is injected above
            const r = await window.axe.run({ include: [".t-ck"] }, { runOnly: ["wcag2a", "wcag2aa", "wcag21aa"] });
            return r.violations
              .filter((v: { impact: string }) => v.impact === "critical" || v.impact === "serious")
              .map((v: { id: string; nodes: { target: string[] }[] }) => `${v.id} → ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
          });
          for (const v of violations) found.push(`${url} ${viewport.width} ${theme}: ${v}`);
        }
        await ctx.close();
      }
    }
    expect(found, found.join("\n")).toEqual([]);
  });
});

test.describe("konto klienta — z lokalnym backendem", () => {
  test.beforeEach(async () => {
    test.skip(!(await backendUp()), "backend na :8000 nie działa (docs/tech/LOKALNIE.md)");
  });

  test("rejestracja nowego konta prowadzi do weryfikacji e-mail", async ({ page }) => {
    const email = `konto-e2e-${Date.now()}@prokom.test`;
    await page.goto("/client/rejestracja");
    await page.locator("#reg-fname").fill("Test");
    await page.locator("#reg-lname").fill("Rejestracja");
    await page.locator("#reg-email").fill(email);
    await page.locator("#reg-phone").fill("600100200");
    await page.locator("#reg-password").fill(`${randomBytes(12).toString("base64url")}9a!`);
    await page.getByRole("button", { name: "Zarejestruj się" }).click();
    await page.waitForURL(/\/client\/verify-email\?email=/, { timeout: 60_000 });
    await expect(page.locator(".t-ck-mailto")).toContainText(email);
  });

  test("błędne hasło pokazuje komunikat z backendu", async ({ page }) => {
    test.skip(!creds, "brak tests/tech/.client-test.local.json");
    await page.goto("/client/login");
    await page.locator("#login-email").fill(creds!.email);
    await page.locator("#login-password").fill("zle-haslo-e2e");
    await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(/\/client\/login/);
  });

  test("logowanie, lista napraw i wylogowanie", async ({ page }) => {
    test.skip(!creds, "brak tests/tech/.client-test.local.json");
    await page.goto("/client/login");
    await page.locator("#login-email").fill(creds!.email);
    await page.locator("#login-password").fill(creds!.password);
    // Enter submits the form (it used to need a click).
    await page.locator("#login-password").press("Enter");
    await page.waitForURL(/\/client\/dashboard/, { timeout: 30_000 });

    const accountNav = page.getByRole("navigation", { name: "Konto klienta" });
    await expect(accountNav.locator('[aria-current="page"]')).toHaveText("Pulpit");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Witaj");
    expect(await page.locator(".t-ck-acct").innerText()).not.toMatch(/[\uD83C-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]/);

    await accountNav.getByRole("link", { name: "Moje naprawy" }).click();
    await expect(page).toHaveURL(/\/client\/naprawy$/);
    await expect(page.getByRole("heading", { level: 1, name: "Moje naprawy" })).toBeVisible();
    const firstRepair = page.locator("a.t-ck-row").first();
    if (await firstRepair.count()) {
      await firstRepair.click();
      await page.waitForURL(/\/client\/naprawy\/[^/]+$/, { timeout: 30_000 });
      await expect(page.getByRole("list", { name: "Etapy naprawy" })).toBeVisible();
      await expect(page.getByRole("heading", { level: 2, name: "Szczegóły zgłoszenia" })).toBeVisible();
    }

    await accountNav.getByRole("link", { name: "Profil" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Profil" })).toBeVisible();
    await expect(page.locator("#pf-email")).toHaveValue(creds!.email);

    await page.getByRole("button", { name: /wyloguj/i }).first().click();
    await page.waitForURL(/\/client\/login/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { level: 1, name: "Zaloguj się" })).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem("prokom_auth_token"))).toBeNull();
  });

  test("axe: zalogowane ekrany konta bez krytycznych i poważnych naruszeń", async ({ browser }) => {
    test.skip(!creds, "brak tests/tech/.client-test.local.json");
    test.setTimeout(6 * 60_000);
    const login = await (await fetch(`${API}/api/v1/accounts/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creds),
    })).json();
    const token: string = login.token;
    const list = await (await fetch(`${API}/api/v1/repairs/`, { headers: { Authorization: `Token ${token}` } })).json();
    const first = (Array.isArray(list) ? list : list.results ?? [])[0];
    const urls = ["/client/dashboard", "/client/naprawy", "/client/profil", ...(first ? [`/client/naprawy/${first.id}`] : [])];
    const axeSource = fs.readFileSync(createRequire(__filename).resolve("axe-core/axe.min.js"), "utf8");
    const found: string[] = [];
    for (const theme of ["light", "dark"] as const) {
      for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
        const ctx = await browser.newContext({ viewport, colorScheme: theme, reducedMotion: "reduce", locale: "pl-PL" });
        // The auth token lives in sessionStorage (lib/auth-storage.ts).
        await ctx.addInitScript(([t, tok]) => {
          try {
            localStorage.setItem("pk-theme", t);
            sessionStorage.setItem("prokom_auth_token", tok);
            sessionStorage.setItem("prokom_user_role", "client");
          } catch {
            /* ignore */
          }
        }, [theme, token]);
        const page = await ctx.newPage();
        for (const url of urls) {
          await page.goto(url, { waitUntil: "networkidle" });
          await page.locator(".t-ck-acct__main .t-ck-page").first().waitFor();
          await page.addScriptTag({ content: axeSource });
          const violations = await page.evaluate(async () => {
            // @ts-expect-error axe is injected above
            const r = await window.axe.run({ include: [".t-ck"] }, { runOnly: ["wcag2a", "wcag2aa", "wcag21aa"] });
            return r.violations
              .filter((v: { impact: string }) => v.impact === "critical" || v.impact === "serious")
              .map((v: { id: string; nodes: { target: string[] }[] }) => `${v.id} → ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
          });
          for (const v of violations) found.push(`${url} ${viewport.width} ${theme}: ${v}`);
        }
        await ctx.close();
      }
    }
    expect(found, found.join("\n")).toEqual([]);
  });
});
