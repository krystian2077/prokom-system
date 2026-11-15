/**
 * PWA (docs/tech/SPEC.md §12.2). The manifest is served by a route handler in the public
 * group and linked only from the public layout — panels never get it.
 */
import { line } from "@/config/prokom";

export const MANIFEST_PATH = "/manifest.webmanifest";
export const SW_PATH = "/sw.js";
export const OFFLINE_PATH = "/offline";

/** Theme colors = tokens --bg (light) and --bg (dark) from SPEC §4. */
export const THEME_LIGHT = "#F4F5F1";
export const THEME_DARK = "#120D0C";

/** Paths the service worker must never handle (SPEC §12.2) — also checked by tests. */
export const SW_EXCLUDED_PREFIXES = ["/api", "/panel", "/admin-panel", "/client", "/_next", "/admin"];

export function webManifest() {
  return {
    name: line.name,
    short_name: line.name,
    description: "Serwis telefonów i komputerów — zgłoszenie naprawy, status i punkty serwisowe.",
    id: "/?src=pwa",
    start_url: "/?src=pwa",
    scope: "/",
    display: "standalone",
    lang: "pl",
    dir: "ltr",
    background_color: THEME_LIGHT,
    theme_color: THEME_LIGHT,
    icons: [
      { src: "/tech/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/tech/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/tech/pwa/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Zgłoś naprawę", url: "/zgloszenie?src=pwa", icons: [{ src: "/tech/pwa/icon-192.png", sizes: "192x192" }] },
      { name: "Status naprawy", url: "/track?src=pwa", icons: [{ src: "/tech/pwa/icon-192.png", sizes: "192x192" }] },
      { name: "Punkty", url: "/punkty-serwisowe?src=pwa", icons: [{ src: "/tech/pwa/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
