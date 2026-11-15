#!/usr/bin/env node
// Full-page screenshots of the public site on every test width and theme
// (docs/tech/RESPONSYWNOSC.md §6) → tmp/zrzuty/*.png + tmp/zrzuty/index.html.
//
//   node scripts/tech/zrzuty.mjs [origin] [--widths=360,390,768,1024,1440,1920] [--themes=light,dark] [--pages=/,/track] [--lab] [--out=tmp/zrzuty]
//   --lab: the /lab pages (needs a build with NEXT_PUBLIC_TECH_DRAFT=1), output in tmp/zrzuty-lab
//   origin defaults to http://localhost:3002 (npx next start -p 3002 in frontend/)
import fs from "node:fs";
import path from "node:path";
import { ROOT, chromium, list, parseArgs, scrollLikeUser, slug, themedPage } from "./lib.mjs";

const { opts, pos } = parseArgs(process.argv.slice(2));
const origin = (pos[0] || "http://localhost:3002").replace(/\/$/, "");
const widths = list(opts.widths, ["360", "390", "768", "1024", "1440", "1920"]).map(Number);
const themes = list(opts.themes, ["light", "dark"]);
const LAB_PAGES = ["/lab", "/lab/kreator", "/lab/menu", "/lab/ruch"];
const pages = opts.lab ? list(opts.pages, LAB_PAGES) : list(opts.pages, ["/"]);
const out = path.join(ROOT, opts.out || (opts.lab ? "tmp/zrzuty-lab" : "tmp/zrzuty"));
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const shots = [];
for (const p of pages) {
  for (const theme of themes) {
    for (const width of widths) {
      const { ctx, page } = await themedPage(browser, { width, theme });
      await page.goto(origin + p, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      await scrollLikeUser(page);
      const file = `${slug(p)}-${width}-${theme}.png`;
      await page.screenshot({ path: path.join(out, file), fullPage: true });
      shots.push({ p, theme, width, file });
      console.log("✓", file);
      await ctx.close();
    }
  }
}
await browser.close();

const rows = pages
  .map((p) =>
    themes
      .map(
        (t) => `<h2>${p} · ${t}</h2><div class="row">${shots
          .filter((s) => s.p === p && s.theme === t)
          .map((s) => `<figure><a href="${s.file}"><img src="${s.file}" loading="lazy"></a><figcaption>${s.width}px</figcaption></figure>`)
          .join("")}</div>`,
      )
      .join(""),
  )
  .join("");
fs.writeFileSync(
  path.join(out, "index.html"),
  `<!doctype html><meta charset="utf-8"><title>Zrzuty PRO-KOM Tech</title>
<style>body{font:14px system-ui;margin:24px;background:#f4f5f1}.row{display:flex;gap:16px;align-items:flex-start;overflow-x:auto}
figure{margin:0}img{width:220px;border:1px solid #ccc;background:#fff}figcaption{text-align:center;color:#555}</style>
<h1>Zrzuty — ${origin} — ${new Date().toLocaleString("pl-PL")}</h1>${rows}`,
);
console.log(`\n${shots.length} zrzutów → ${path.relative(ROOT, out)}/index.html`);
