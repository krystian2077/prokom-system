/*
 * PRO-KOM Tech — minimal service worker (docs/tech/SPEC.md §12.2).
 *
 * The ONLY job: when a navigation to a public page fails (no network), show /offline.
 * - caches one self-contained copy of /offline (styles inlined, no scripts) — no other HTML,
 * - never handles /api, /panel, /admin-panel, /client, /admin, /_next or non-GET requests,
 * - never handles non-navigation requests (images, scripts, data, fetch()).
 *
 * Bump VERSION on every change. Unregister procedure: docs/tech/WDROZENIE.md ("Service worker").
 */
const VERSION = "pk-tech-offline-v1";
const OFFLINE_URL = "/offline";
const EXCLUDED = ["/api", "/panel", "/admin-panel", "/client", "/admin", "/_next"];

function isExcluded(pathname) {
  return EXCLUDED.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const res = await fetch(OFFLINE_URL, { cache: "reload", credentials: "omit" });
      if (!res.ok) throw new Error("offline page unavailable");
      let html = await res.text();
      // Self-contained copy: stylesheets inlined, scripts removed — so the fallback never
      // needs /_next and the worker never has to intercept anything but navigations.
      const links = Array.from(html.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g), (m) => m[0]);
      for (const tag of links) {
        const href = (tag.match(/href="([^"]+)"/) || [])[1];
        let css = "";
        if (href && href.startsWith("/_next/static/css/")) {
          try {
            const r = await fetch(href, { credentials: "omit" });
            if (r.ok) css = await r.text();
          } catch (e) {
            css = "";
          }
        }
        html = html.replace(tag, css ? "<style>" + css + "</style>" : "");
      }
      html = html.replace(/<script\b[^>]*src="[^"]*"[^>]*><\/script>/g, "").replace(/<link[^>]+rel="(preload|modulepreload)"[^>]*>/g, "");
      const cache = await caches.open(VERSION);
      await cache.put(OFFLINE_URL, new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } }));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("pk-tech-") && k !== VERSION).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode !== "navigate" || isExcluded(url.pathname)) return;

  // Network first, nothing is stored; the cached /offline page only when the network fails.
  event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL, { cacheName: VERSION }).then((r) => r || Response.error())));
});
