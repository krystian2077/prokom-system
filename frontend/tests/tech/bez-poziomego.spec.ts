/**
 * Audyt gotowości 16.11 — no page of the public site may scroll sideways on a phone.
 * Every URL from /sitemap.xml, at 360 and 390 px, in both themes:
 * document.documentElement.scrollWidth <= innerWidth, right after load and after scrolling
 * to the bottom (lazy sections and reveal animations are in place by then).
 */
import { expect, test, type Page } from "@playwright/test";

const WIDTHS = [360, 390];
const THEMES = ["light", "dark"] as const;

async function sitemapPaths(baseURL: string): Promise<string[]> {
  const xml = await (await fetch(new URL("/sitemap.xml", baseURL))).text();
  const paths = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (m) => new URL(m[1].trim()).pathname);
  return paths.filter((p, i) => paths.indexOf(p) === i);
}

async function overflow(page: Page) {
  return page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
}

test("sitemap has URLs to check", async ({ baseURL }) => {
  expect((await sitemapPaths(baseURL as string)).length).toBeGreaterThan(20);
});

test.describe("bez poziomego przewijania (360 i 390, oba motywy)", () => {
  test.describe.configure({ timeout: 30 * 60_000 });

  for (const theme of THEMES) {
    test(`every sitemap URL, ${theme}`, async ({ page, baseURL }) => {
      const paths = await sitemapPaths(baseURL as string);
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((t) => {
        try {
          localStorage.setItem("pk-theme", t);
        } catch {
          /* ignore */
        }
      }, theme);
      const failures: string[] = [];
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 800 });
        for (const path of paths) {
          await page.goto(path, { waitUntil: "load" });
          const atLoad = await overflow(page);
          await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
          await page.waitForTimeout(250);
          const atEnd = await overflow(page);
          for (const [when, o] of [["load", atLoad], ["end", atEnd]] as const) {
            if (o.scrollWidth > o.innerWidth) failures.push(`${path} @${width} ${theme} (${when}): ${o.scrollWidth} > ${o.innerWidth}`);
          }
        }
      }
      expect(failures, "strony z poziomym przewijaniem").toEqual([]);
    });
  }
});
