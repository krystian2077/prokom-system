/**
 * Brand service pages /serwis-apple, /serwis-samsung and the "Marki" row of the "Naprawy" mega
 * menu (round 18.11, T-R2c). Only the new pages — the full e2e runs at the end of a larger batch.
 *
 *   npm run build && TECH_PORT=3001 npx playwright test serwis-marek
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import { expect, test, type Page } from "@playwright/test";

const axeSource = fs.readFileSync(createRequire(__filename).resolve("axe-core/axe.min.js"), "utf8");

const PAGES = [
  { path: "/serwis-apple", h1: "Serwis iPhone, iPad i MacBook", model: "iPhone 15 Pro", older: true, category: "phone" },
  { path: "/serwis-samsung", h1: "Serwis Samsung Galaxy", model: "Galaxy S26", older: false, category: "phone" },
] as const;
const THEMES = ["light", "dark"] as const;

async function setTheme(page: Page, theme: (typeof THEMES)[number]) {
  // reduced motion = final state (no reveal mid-transition while axe measures contrast)
  await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("pk-theme", t);
    } catch {
      /* ignore */
    }
  }, theme);
}

for (const p of PAGES) {
  test.describe(p.path, () => {
    test("H1, JSON-LD Service + FAQPage + BreadcrumbList, one H1", async ({ page }) => {
      await page.goto(p.path);
      const h1 = page.locator("h1");
      await expect(h1).toHaveCount(1);
      await expect(h1).toContainText(p.h1);
      // Typeset glues "Rabka-" to "Zdrój" with a word joiner (U+2060).
      await expect(h1).toContainText(/Rabka-⁠?Zdrój/);
      const types = await page.locator('script[type="application/ld+json"]').evaluateAll((els) =>
        els.flatMap((e) => {
          const d = JSON.parse(e.textContent ?? "{}");
          return (Array.isArray(d) ? d : [d]).map((x) => x["@type"]);
        }),
      );
      expect(types).toEqual(expect.arrayContaining(["Service", "FAQPage", "BreadcrumbList"]));
      const faq = await page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.map((e) => JSON.parse(e.textContent ?? "{}")).find((d) => d["@type"] === "FAQPage"));
      expect(faq.mainEntity.length).toBeGreaterThanOrEqual(5);
      await expect(page).toHaveTitle(/^Serwis (Apple|Samsung) — .+ \| PRO-KOM Tech$/);
      const body = (await page.locator("main").innerText()).toLowerCase();
      expect(body).not.toMatch(/autoryzowan|certyfikowan|whatsapp|\d\s*zł/);
    });

    test("form links: hero, model chip (model in the description), repairs, points with phone", async ({ page }) => {
      await page.goto(p.path);
      await expect(page.locator(".t-shero__submit")).toHaveAttribute("href", `/zgloszenie?category=${p.category}`);
      const chip = page.getByRole("link", { name: `Zgłoś naprawę: ${p.model}`, exact: true });
      if (p.older) {
        await expect(chip).toBeHidden();
        await page.locator("#modele details summary").first().click();
      }
      await expect(chip).toBeVisible();
      const href = (await chip.getAttribute("href"))!;
      const q = new URL(href, "http://x").searchParams;
      expect(q.get("category")).toBe(p.category);
      expect(q.get("usterka")).toBe(`Model: ${p.model}. Usterka:`);
      for (const h of await page.locator("#naprawy a").evaluateAll((a) => a.map((x) => x.getAttribute("href") ?? ""))) expect(h).toMatch(/^\/(naprawy\/[a-z0-9-]+|zgloszenie\?category=)/);
      // salons with live status and their own phone
      const salons = page.locator("#jak-oddac .t-salon:not(.t-salon--courier)");
      await expect(salons).toHaveCount(2);
      await expect(salons.locator(".t-salon__tel")).toHaveCount(2);
      await expect(page.locator("#jak-oddac .t-lead")).toContainText(/tylko na adres salonu w\s+Rabce-⁠?Zdroju/);
      // the chip opens the form with the model in the description
      await chip.click();
      await expect(page).toHaveURL(/\/zgloszenie\?/);
      await expect(page.locator("textarea").first()).toHaveValue(`Model: ${p.model}. Usterka:`);
    });

    for (const theme of THEMES) {
      test(`360 px without sideways scroll, axe without critical (${theme})`, async ({ page }) => {
        await setTheme(page, theme);
        await page.setViewportSize({ width: 360, height: 780 });
        await page.goto(p.path, { waitUntil: "load" });
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 600) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 40));
          }
        });
        const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
        expect(o.sw, `${p.path} ${theme}`).toBeLessThanOrEqual(o.iw);
        await expect(page.locator("html")).toHaveAttribute("data-tech-theme", theme);

        for (const w of [360, 1440]) {
          await page.setViewportSize({ width: w, height: 900 });
          await page.addScriptTag({ content: axeSource });
          const res = await page.evaluate(async () => {
            const win = window as unknown as { axe: { run: (c: unknown, o: unknown) => Promise<{ violations: { id: string; impact: string | null; nodes: { target: string[] }[] }[] }> } };
            const out = await win.axe.run({ include: [".tech"], exclude: ['[aria-hidden="true"]'] }, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } });
            return out.violations.map((v) => ({ id: v.id, impact: v.impact, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) }));
          });
          const bad = res.filter((v) => v.impact === "critical" || v.impact === "serious");
          expect(bad, JSON.stringify(bad, null, 1)).toEqual([]);
        }
      });
    }
  });
}

test.describe("desktop 1440 — mega menu Naprawy", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test("row 'Marki: Apple · Samsung' leads to the brand pages", async ({ page }) => {
    await page.goto("/");
    await page.locator(".t-capsule").getByRole("button", { name: "Naprawy" }).click();
    const bar = page.locator('.t-mega[data-mega="naprawy"]').getByRole("navigation", { name: "Więcej o naprawach" });
    await expect(bar.locator(".t-mega__brands")).toContainText("Marki:");
    await expect(bar.getByRole("link", { name: "Serwis Apple" })).toHaveAttribute("href", "/serwis-apple");
    await expect(bar.getByRole("link", { name: "Serwis Samsung" })).toHaveAttribute("href", "/serwis-samsung");
    await bar.getByRole("link", { name: "Serwis Samsung" }).click();
    await expect(page).toHaveURL(/\/serwis-samsung$/);
    await expect(page.locator("h1")).toContainText("Serwis Samsung Galaxy");
  });
});

test("brand page links its salon (catalogue)", async ({ page }) => {
  for (const [path, salon] of [["/serwis-apple", "/apple"], ["/serwis-samsung", "/samsung"]] as const) {
    await page.goto(path);
    await expect(page.locator(".t-bmodels__salon a")).toHaveAttribute("href", salon);
  }
});
