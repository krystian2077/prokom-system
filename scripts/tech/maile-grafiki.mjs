// Renders the PNG assets used by backend e-mails (frontend/public/tech/mail/):
// PRO-KOM Tech horizontal logo (colour + negative) from the brand book SVGs and simple line icons.
// Usage: node scripts/tech/maile-grafiki.mjs [brand-svg-dir]
// Playwright comes from frontend/node_modules (PW env var overrides the path).
import { createRequire } from "node:module";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const candidates = [
  process.env.PW,
  path.join(root, "frontend/node_modules/@playwright/test"),
  "D:/PRO-KOM/repos/prokom-system/frontend/node_modules/@playwright/test",
].filter(Boolean);
const { chromium } = require(candidates.find((p) => existsSync(p)));

const brandDir = process.argv[2] || "D:/PRO-KOM/marka/PRO-KOM_znak_2026-10/01_wektor/SVG/tech";
const out = path.join(root, "frontend/public/tech/mail");
mkdirSync(out, { recursive: true });

// Lucide-style 24×24 line icons (ISC licence), stroke in Tech red.
const ICONS = {
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  box: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  device: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  quote: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
};

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });

async function shoot(html, w, h, file) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<html><body style="margin:0;background:transparent">${html}</body></html>`);
  await page.locator("#x").screenshot({ path: path.join(out, file), omitBackground: true });
}

// Logo: displayed at 180×36 px, rendered at 2× (360×72).
for (const [variant, file] of [["kolor", "logo-tech.png"], ["negatyw", "logo-tech-negatyw.png"]]) {
  const svg = readFileSync(path.join(brandDir, `prokom-tech_poziome_${variant}.svg`), "utf8")
    .replace(/<\?xml[^>]*>/, "")
    .replace(/width="[^"]*" height="[^"]*"/, 'width="180" height="36" preserveAspectRatio="xMidYMid meet"');
  await shoot(`<div id="x" style="width:180px;height:36px;line-height:0">${svg}</div>`, 180, 36, file);
}

// Icons: displayed at 20–24 px, rendered at 48×48.
for (const [name, body] of Object.entries(ICONS)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D13A2E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  await shoot(`<div id="x" style="width:24px;height:24px;line-height:0">${svg}</div>`, 24, 24, `ic-${name}.png`);
}
await browser.close();
console.log("OK ->", out);
