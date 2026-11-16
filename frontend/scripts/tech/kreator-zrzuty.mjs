/**
 * Wizard scene screenshots for visual review (feat/tech-kreator-wizual).
 * Usage: node scripts/tech/kreator-zrzuty.mjs <baseURL> <outDir> [--pairs=tablet:Pęknięty ekran,…] [--widths=1440,390] [--themes=light,dark] [--settle=1800]
 * Every device × fault by default. Desktop/tablet: the page scene; < 768: the full-screen flow.
 * Writes <outDir>/<width>-<theme>/<device>__<fault>.png and an index.html grid.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const [base = "http://localhost:3021", out = "../tmp/kw/zrzuty"] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const opt = Object.fromEntries(process.argv.filter((a) => a.startsWith("--")).map((a) => a.slice(2).split("=")));
const widths = (opt.widths ?? "1440,1024,768,390").split(",").map(Number);
const themes = (opt.themes ?? "light,dark").split(",");
const settle = Number(opt.settle ?? 2600);
const only = opt.pairs ? opt.pairs.split(",").map((p) => p.split(":")) : null;
const heights = { 1440: 900, 1024: 800, 768: 1024, 390: 844 };

const browser = await chromium.launch();
const rows = [];
for (const theme of themes) {
  for (const w of widths) {
    const ctx = await browser.newContext({ viewport: { width: w, height: heights[w] ?? 900 }, deviceScaleFactor: 2, locale: "pl-PL" });
    await ctx.addInitScript((t) => localStorage.setItem("pk-theme", t), theme);
    const page = await ctx.newPage();
    await page.goto(base + "/", { waitUntil: "networkidle" });
    const wiz = page.locator("#kreator");
    await wiz.scrollIntoViewIfNeeded();
    const devices = await wiz.locator(".t-wiz__devices [role=radio]").evaluateAll((els) => els.map((e) => [e.dataset.value, e.textContent.trim()]));
    const dir = path.join(out, `${w}-${theme}`);
    fs.mkdirSync(dir, { recursive: true });
    for (const [id, label] of devices) {
      if (only && !only.some(([d]) => d === id)) continue;
      const phone = w < 768;
      if (phone) {
        await page.keyboard.press("Escape").catch(() => {});
        await wiz.locator(`.t-wiz__devices [data-value="${id}"]`).click();
        await page.waitForTimeout(400);
      } else {
        await wiz.locator(`.t-wiz__devices [data-value="${id}"]`).click();
        await page.waitForTimeout(300);
      }
      const root = phone ? page.locator(".t-wizflow") : wiz;
      const faults = await root.locator(".t-wiz__faults [role=radio]").evaluateAll((els) => els.map((e) => e.dataset.value));
      for (const f of faults) {
        if (only && !only.some(([d, ff]) => d === id && (!ff || ff === f))) continue;
        await root.locator(`.t-wiz__faults [data-value="${f}"]`).click();
        await page.mouse.move(1, 1);
        await page.waitForTimeout(settle);
        if (phone) await page.locator(".t-wizflow .t-scene").evaluate((el) => el.scrollIntoView({ block: "start" }));
        if (phone) await page.waitForTimeout(150);
        const shot = phone ? page : wiz.locator(".t-wiz__stagewrap");
        const file = `${id}__${f.replace(/[^\p{L}\p{N}]+/gu, "-")}.png`;
        await shot.screenshot({ path: path.join(dir, file) });
        rows.push({ w, theme, id, f, file: `${w}-${theme}/${file}` });
      }
      if (phone) await page.keyboard.press("Escape");
    }
    await ctx.close();
  }
}
await browser.close();
const html = `<!doctype html><meta charset=utf-8><style>body{font:13px system-ui;background:#888}figure{display:inline-block;margin:6px;vertical-align:top}img{width:360px;display:block}</style>${rows
  .map((r) => `<figure><img src="${r.file}"><figcaption>${r.w} ${r.theme} · ${r.id} · ${r.f}</figcaption></figure>`)
  .join("")}`;
fs.writeFileSync(path.join(out, "index.html"), html);
console.log(`${rows.length} zrzutów → ${out}`);
