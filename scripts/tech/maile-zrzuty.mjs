// Screenshots of rendered e-mails (tmp/maile/*.html) at 375 and 680 px, light and dark scheme.
// Usage: node scripts/tech/maile-zrzuty.mjs [dir]   (called by scripts/tech/maile-podglad.py)
import { createRequire } from "node:module";
import { readdirSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const candidates = [
  process.env.PW,
  path.join(root, "frontend/node_modules/@playwright/test"),
  "D:/PRO-KOM/repos/prokom-system/frontend/node_modules/@playwright/test",
].filter(Boolean);
const { chromium } = require(candidates.find((p) => existsSync(p)));

const dir = process.argv[2] || path.join(root, "tmp/maile");
const out = path.join(dir, "png");
mkdirSync(out, { recursive: true });
const files = readdirSync(dir).filter((f) => f.endsWith(".html")).sort();

const browser = await chromium.launch();
for (const scheme of ["light", "dark"]) {
  for (const width of [375, 680]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, colorScheme: scheme });
    const page = await ctx.newPage();
    for (const f of files) {
      await page.goto(pathToFileURL(path.join(dir, f)).href, { waitUntil: "networkidle" }).catch(() => {});
      await page.evaluate(() => document.fonts.ready);
      const name = `${f.replace(/\.html$/, "")}-${width}${scheme === "dark" ? "-ciemny" : ""}.png`;
      await page.screenshot({ path: path.join(out, name), fullPage: true });
    }
    await ctx.close();
  }
}
await browser.close();
console.log(`Zrzuty: ${files.length} maili x 4 -> ${out}`);
