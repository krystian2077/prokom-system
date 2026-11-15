/**
 * RESPONSYWNOSC.md §1, §2, §6 — on every test width:
 * - no horizontal scroll,
 * - the phone tab bar never covers the last button on the page,
 * - touch targets ≥ 44 px on phones (new UI: .t-ui),
 * - [data-reveal] elements end up visible after scrolling.
 *
 * Pages: rebuilt pages are added to PAGES as TD2–TD5 land.
 */
import { expect, test, type Page } from "@playwright/test";

const WIDTHS = [360, 390, 414, 430, 768, 820, 1024, 1280, 1366, 1440, 1680, 1920, 2560];
const PAGES = ["/", "/punkty-serwisowe", "/kontakt", "/o-firmie", "/serwis-telefonow", "/serwis-telefonow-rabka-zdroj", "/obslugiwane-miejscowosci", "/uslugi", "/serwis-laptopow", "/serwis-tabletow", "/serwis-komputerow", "/serwis-drukarek", "/serwis-konsol", "/serwis-smartwatchy", "/odzyskiwanie-danych", "/hammer-glass", "/faq", "/blog", "/blog/kategoria/telefony", "/blog/kiedy-wymienic-baterie-w-telefonie", "/polityka-prywatnosci", "/regulamin", "/nie-ma-takiej-strony", "/jak-przygotowac-sprzet", "/naprawa-kurierem", "/offline"];
const THEMES = ["light", "dark"] as const;

async function open(page: Page, url: string, width: number, theme: (typeof THEMES)[number]) {
  await page.setViewportSize({ width, height: width < 768 ? 800 : 900 });
  await page.emulateMedia({ colorScheme: theme });
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("pk-theme", t);
    } catch {
      /* ignore */
    }
  }, theme);
  await page.goto(url, { waitUntil: "load" });
}

async function scrollThrough(page: Page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 600) {
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(500);
}

for (const url of PAGES) {
  for (const theme of THEMES) {
    for (const width of WIDTHS) {
      test(`${url} @${width} ${theme}`, async ({ page }) => {
        await open(page, url, width, theme);

        // 1. no horizontal scroll
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, "poziome przewijanie").toBeLessThanOrEqual(0);

        // 2. reveal-on-scroll elements become visible
        await scrollThrough(page);
        const hidden = await page.$$eval("[data-reveal]", (els) =>
          els.filter((e) => Number(getComputedStyle(e).opacity) < 1).map((e) => e.outerHTML.slice(0, 80)),
        );
        expect(hidden, "data-reveal z opacity < 1").toEqual([]);

        if (width < 768) {
          // 3. touch targets in the new UI
          const small = await page.$$eval(".tech .t-ui a, .tech .t-ui button", (els) =>
            els
              .filter((e) => {
                const r = e.getBoundingClientRect();
                const s = getComputedStyle(e);
                if (!r.width || !r.height || s.visibility === "hidden" || e.closest("[inert],[aria-hidden='true']")) return false;
                if (e.hasAttribute("data-t-inline")) return false; // links inside running text
                return r.width < 44 || r.height < 44;
              })
              .map((e) => `${e.tagName} "${(e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 30)}" ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`),
          );
          expect(small, "cele dotykowe < 44 px").toEqual([]);

          // 4. tab bar does not cover the last button
          const bar = page.locator("[data-t-tabbar]");
          if (await bar.count()) {
            await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
            await page.waitForTimeout(300);
            const covered = await page.evaluate(() => {
              const tab = document.querySelector("[data-t-tabbar]")!.getBoundingClientRect();
              const btns = Array.from(document.querySelectorAll<HTMLElement>(".tech main a, .tech main button, .tech footer a")).filter((b) => b.offsetParent);
              const last = btns[btns.length - 1];
              if (!last) return false;
              return last.getBoundingClientRect().bottom > tab.top + 1;
            });
            expect(covered, "dolny pasek zasłania ostatni przycisk").toBe(false);
          }
        }
      });
    }
  }
}
