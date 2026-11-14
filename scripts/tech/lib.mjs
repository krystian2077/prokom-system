// Shared helpers for scripts/tech/*.mjs (Playwright from frontend/node_modules).
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(path.join(ROOT, "frontend/package.json"));
export const { chromium } = require("@playwright/test");

/** --key=value and positional args */
export function parseArgs(argv) {
  const opts = {};
  const pos = [];
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (m) opts[m[1]] = m[2] ?? "1";
    else pos.push(a);
  }
  return { opts, pos };
}

export const list = (v, def) => (v ? String(v).split(",").map((s) => s.trim()).filter(Boolean) : def);
export const slug = (p) => (p === "/" ? "glowna" : p.replace(/^\//, "").replace(/[^\w-]+/g, "_"));

/** New context with the public theme preset (pk-theme) before any script runs. */
export async function themedPage(browser, { width, height = 900, theme }) {
  const isPhone = width < 768;
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    locale: "pl-PL",
    timezoneId: "Europe/Warsaw",
    colorScheme: theme === "dark" ? "dark" : "light",
    hasTouch: isPhone,
    isMobile: isPhone,
  });
  await ctx.addInitScript((t) => {
    try {
      localStorage.setItem("pk-theme", t);
    } catch {}
  }, theme);
  return { ctx, page: await ctx.newPage() };
}

/** Scroll like a user (wheel steps), so reveal-on-scroll and lazy images trigger; then back to top. */
export async function scrollLikeUser(page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 500) {
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
}
