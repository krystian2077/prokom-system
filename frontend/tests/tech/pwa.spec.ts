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
