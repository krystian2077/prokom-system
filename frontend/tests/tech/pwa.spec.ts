/**
 * PWA e2e (SPEC §12.2): manifest only on public pages, the service worker caches nothing
 * but /offline, never takes over /api, /panel, /admin-panel, /client, and shows /offline
 * for public pages without network.
 */
import { expect, test, type Page } from "@playwright/test";

async function swReady(page: Page) {
  await page.goto("/", { waitUntil: "load" });
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // let the worker claim the page
  await page.reload({ waitUntil: "load" });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
}

const cacheEntries = (page: Page) =>
  page.evaluate(async () => {
    const out: string[] = [];
    for (const k of await caches.keys()) for (const r of await (await caches.open(k)).keys()) out.push(`${k} ${new URL(r.url).pathname}`);
    return out;
  });

test("manifest and theme-color only on public pages", async ({ page }) => {
  await page.goto("/", { waitUntil: "load" });
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
  await expect(page.locator('meta[name="theme-color"]')).toHaveCount(2);
  const res = await page.request.get("/manifest.webmanifest");
  expect(res.ok()).toBe(true);
  expect((await res.json()).start_url).toBe("/?src=pwa");

  for (const url of ["/panel/login", "/admin-panel", "/client/login"]) {
    await page.goto(url, { waitUntil: "load" });
    await expect(page.locator('link[rel="manifest"]'), url).toHaveCount(0);
  }
});

test("service worker caches only /offline and ignores panels and API", async ({ page }) => {
  await swReady(page);
  for (const url of ["/kontakt", "/blog", "/panel/login", "/client/login"]) await page.goto(url, { waitUntil: "load" });
  await page.evaluate(() => fetch("/api/v1/repairs/track/").catch(() => null));
  expect(await cacheEntries(page)).toEqual(["pk-tech-offline-v1 /offline"]);

  const offline = await page.evaluate(async () => {
    const r = await caches.match("/offline");
    return r ? await r.text() : "";
  });
  expect(offline).toContain("Brak połączenia");
  expect(offline).not.toMatch(/<script[^>]+src=/);
});

test("offline: public page → /offline, panel and client → no fallback", async ({ page, context }) => {
  await swReady(page);
  await context.setOffline(true);
  await page.goto("/kontakt");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Brak połączenia");

  for (const url of ["/panel/login", "/admin-panel", "/client/login"]) {
    const error = await page.goto(url).then(
      () => null,
      (e: Error) => e.message,
    );
    expect(error, `${url} nie może dostać strony offline`).toMatch(/ERR_INTERNET_DISCONNECTED|net::/);
  }
  await context.setOffline(false);
});

test("courier repair page is published (boss's answers 15.11): no draft frame, payment, sitemap, areaServed Polska", async ({ page, request }) => {
  const res = await page.goto("/naprawa-kurierem");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Naprawa wysyłkowa");
  await expect(page.locator(".t-courier.t-draft")).toHaveCount(0);
  await expect(page.locator("main")).toContainText("Nie wysyłamy za pobraniem.");
  await expect(page.locator("#kto-placi dd")).toHaveText(["Ty", "serwis", "serwis"]);
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(ld.some((s) => s.includes('"Country"') && s.includes('"Polska"'))).toBe(true);
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain("/naprawa-kurierem");
});

test("courier page is linked from /uslugi, device pages, FAQ, footer and /obslugiwane-miejscowosci", async ({ page }) => {
  for (const path of ["/uslugi", "/serwis-laptopow", "/faq", "/obslugiwane-miejscowosci"]) {
    await page.goto(path);
    await expect(page.locator('main a[href="/naprawa-kurierem"]').first(), path).toBeAttached();
  }
  await expect(page.locator('footer a[href="/naprawa-kurierem"]').first()).toBeAttached();
});

test("courier page: 'Gdzie wysłać' lists both salons with address and hours (15.11)", async ({ page }) => {
  await page.goto("/naprawa-kurierem");
  const cards = page.locator("#gdzie-wyslac .t-courier__addr");
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toContainText("Rabka-Zdrój");
  await expect(cards.nth(1)).toContainText("Zakopane");
  await expect(page.locator("#jak-to-dziala")).toContainText("Najlepiej przed wysyłką");
  await expect(page.locator("main")).not.toContainText("Nie wysyłaj sprzętu przed kontaktem");
});
