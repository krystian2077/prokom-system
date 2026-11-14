/**
 * SEO of rendered public pages (SPEC §9): one H1, title 30–60, description 120–155,
 * canonical, JSON-LD parses; 301s; unpublished local page is 404; sitemap content.
 * Old pages not rebuilt yet (TD5) are in LEGACY_SEO — the list may only shrink.
 */
import { expect, test } from "@playwright/test";
import { STATIC_ROUTES } from "../../lib/tech/sitemap";

const LEGACY_SEO = new Set<string>([
  "/hammer-glass",
  "/faq",
  "/blog",
  "/polityka-prywatnosci",
  "/regulamin",
]);
const PAGES = [...STATIC_ROUTES.map((r) => r.path), "/serwis-telefonow-rabka-zdroj"];

type Seo = { h1: number; title: string; description: string; canonical: string | null; ld: string[] };

for (const path of PAGES) {
  test(`SEO ${path}`, async ({ page }) => {
    await page.goto(path);
    const seo: Seo = await page.evaluate(() => ({
      h1: document.querySelectorAll("h1").length,
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null,
      ld: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((s) => s.textContent ?? ""),
    }));
    for (const s of seo.ld) expect(() => JSON.parse(s), "JSON-LD").not.toThrow();
    const ok =
      seo.h1 === 1 &&
      seo.title.length >= 30 &&
      seo.title.length <= 60 &&
      seo.description.length >= 120 &&
      seo.description.length <= 155 &&
      !!seo.canonical &&
      new URL(seo.canonical, page.url()).pathname.replace(/\/$/, "") === path.replace(/\/$/, "");
    if (LEGACY_SEO.has(path)) {
      // Rebuilt in TD5: once the page meets the norms, drop it from LEGACY_SEO.
      expect(ok, `${path} spełnia już normy — usuń go z LEGACY_SEO`).toBe(false);
      return;
    }
    expect(seo.h1, "jeden H1").toBe(1);
    expect(seo.title.length, `tytuł „${seo.title}”`).toBeGreaterThanOrEqual(30);
    expect(seo.title.length, `tytuł „${seo.title}”`).toBeLessThanOrEqual(60);
    expect(seo.description.length, `opis „${seo.description}”`).toBeGreaterThanOrEqual(120);
    expect(seo.description.length, `opis „${seo.description}”`).toBeLessThanOrEqual(155);
    expect(seo.canonical).toBeTruthy();
    expect(new URL(seo.canonical!, page.url()).pathname.replace(/\/$/, "")).toBe(path.replace(/\/$/, ""));
  });
}

test("301: /akcesoria → /hammer-glass, /oferta → /", async ({ request }) => {
  for (const [from, to] of [
    ["/akcesoria", "/hammer-glass"],
    ["/oferta", "/"],
  ]) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), from).toBe(308);
    expect(new URL(res.headers()["location"], "http://x").pathname).toBe(to);
  }
  const phones = await request.get("/serwis-telefonow", { maxRedirects: 0 });
  expect(phones.status()).toBe(200);
});

test("unpublished Zakopane local page is 404 in production", async ({ request }) => {
  expect((await request.get("/serwis-telefonow-zakopane")).status()).toBe(404);
});

test("sitemap.xml: no removed or unpublished pages", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain("/serwis-telefonow-rabka-zdroj</loc>");
  expect(xml).toContain("/punkty-serwisowe</loc>");
  expect(xml).not.toMatch(/\/(akcesoria|oferta|serwis-telefonow-zakopane)<\/loc>/);
  expect(xml).not.toMatch(/\/(panel|admin-panel|client)\//);
});

test("local page: point card, repairs with prefilled report, local FAQ, Service JSON-LD", async ({ page }) => {
  await page.goto("/serwis-telefonow-rabka-zdroj");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Serwis telefonów\s*Rabka-Zdrój/);
  await expect(page.locator(".t-pointcard")).toHaveCount(1);
  const report = page.getByRole("link", { name: "Zgłoś: Wymiana baterii" });
  await expect(report).toHaveAttribute("href", /^\/zgloszenie\?category=phone&usterka=S%C5%82aba\+bateria&punkt=rabka$/);
  await expect(page.locator(".t-phrep__time").first()).toHaveText(/po diagnozie/); // quickRepair unconfirmed
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(ld.some((s) => s.includes('"Service"'))).toBe(true);
  expect(ld.some((s) => s.includes('"FAQPage"'))).toBe(true);
  await expect(page.locator("main").getByText(/Zakopane|Staszica/)).toHaveCount(0);
});
