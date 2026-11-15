#!/usr/bin/env node
// Video recordings of the key TP animations (docs/tech/PREMIUM.md §6) with Playwright
// recordVideo → tmp/nagrania/*.webm (+ index.html to watch them side by side).
//
//   node scripts/tech/nagrania.mjs [origin] [--only=mega,arkusz,motyw,kreator-telefon,…] [--theme=light|dark]
//   origin defaults to http://localhost:3002 (npx next start -p 3002 in frontend/)
//
// Clips: mega menu (laptop 1440), Menu sheet (phone 390), theme switch (1440),
// wizard: telefon, laptop, drukarka, konsola (1440, device → fault → camera → Esc).
import fs from "node:fs";
import path from "node:path";
import { ROOT, chromium, list, parseArgs } from "./lib.mjs";

const { opts, pos } = parseArgs(process.argv.slice(2));
const origin = (pos[0] || "http://localhost:3002").replace(/\/$/, "");
const theme = opts.theme || "dark";
const out = path.join(ROOT, "tmp/nagrania");
fs.mkdirSync(out, { recursive: true });

const desktop = { viewport: { width: 1440, height: 900 } };
const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

const wizard = (device, faults) => async (page) => {
  await page.goto(origin + "/");
  const wiz = page.locator("#kreator");
  await wiz.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await wiz.getByRole("radio", { name: device }).click();
  await page.waitForTimeout(900);
  for (const f of faults) {
    await wiz.getByRole("radio", { name: f, exact: true }).hover();
    await page.waitForTimeout(700);
    await wiz.getByRole("radio", { name: f, exact: true }).click();
    await page.waitForTimeout(2600);
  }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1200);
};

const CLIPS = {
  mega: {
    ctx: desktop,
    run: async (page) => {
      await page.goto(origin + "/");
      await page.waitForTimeout(800);
      const n = page.locator(".t-capsule").getByRole("button", { name: "Naprawy" });
      const p = page.locator(".t-capsule").getByRole("button", { name: "Punkty serwisowe" });
      const nb = await n.boundingBox();
      const pb = await p.boundingBox();
      await page.mouse.move(nb.x + nb.width / 2, nb.y + nb.height / 2, { steps: 12 });
      await page.waitForTimeout(1400);
      await page.mouse.move(nb.x + 200, nb.y + 160, { steps: 16 });
      await page.waitForTimeout(800);
      await page.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2, { steps: 16 });
      await page.waitForTimeout(1400);
      await page.mouse.move(700, 700, { steps: 12 });
      await page.waitForTimeout(900);
      await n.focus();
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(500);
      for (const k of ["ArrowDown", "ArrowDown", "ArrowRight"]) {
        await page.keyboard.press(k);
        await page.waitForTimeout(500);
      }
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
      await page.mouse.wheel(0, 700);
      await page.waitForTimeout(1200);
    },
  },
  arkusz: {
    ctx: phone,
    run: async (page) => {
      await page.goto(origin + "/");
      await page.waitForTimeout(900);
      await page.locator("[data-t-tabbar]").getByRole("button", { name: "Menu" }).click();
      await page.waitForTimeout(1300);
      const h = await page.locator(".t-sheet__handle").boundingBox();
      await page.mouse.move(h.x + h.width / 2, h.y + 2);
      await page.mouse.down();
      await page.mouse.move(h.x + h.width / 2, h.y + 220, { steps: 18 });
      await page.mouse.up();
      await page.waitForTimeout(900);
      await page.locator("[data-t-tabbar]").getByRole("button", { name: "Naprawy" }).click();
      await page.waitForTimeout(1300);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(800);
    },
  },
  motyw: {
    ctx: desktop,
    run: async (page) => {
      await page.goto(origin + "/");
      await page.waitForTimeout(900);
      for (let i = 0; i < 2; i++) {
        await page.locator("[data-tech-theme-toggle]").click();
        await page.waitForTimeout(1300);
      }
    },
  },
  "kreator-telefon": { ctx: desktop, run: wizard("Telefon", ["Pęknięty ekran", "Aparat", "Po zalaniu"]) },
  "kreator-laptop": { ctx: desktop, run: wizard("Laptop", ["Matryca", "Klawiatura", "Przegrzewa się"]) },
  "kreator-drukarka": { ctx: desktop, run: wizard("Drukarka", ["Zacina papier", "Skaner", "Tusz i głowica"]) },
  "kreator-konsola": { ctx: desktop, run: wizard("Konsola", ["Dryf w padzie", "Nie czyta płyt", "Głośna, przegrzewa się"]) },
  "kreator-telefon-mobile": {
    ctx: phone,
    run: async (page) => {
      await page.goto(origin + "/");
      await page.locator("#kreator").scrollIntoViewIfNeeded();
      await page.waitForTimeout(700);
      await page.locator("#kreator").getByRole("radio", { name: "Telefon" }).click();
      await page.waitForTimeout(1400);
      const flow = page.getByTestId("wizard-flow");
      await flow.locator(".t-scene__spot[aria-label='Bateria']").click();
      await page.waitForTimeout(2400);
      const box = await flow.locator(".t-wizflow__scene").boundingBox();
      await page.mouse.move(box.x + box.width - 30, box.y + 80);
      await page.mouse.down();
      await page.mouse.move(box.x + 30, box.y + 90, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(1800);
    },
  },
};

const only = list(opts.only, Object.keys(CLIPS));
const browser = await chromium.launch();
const done = [];
for (const name of only) {
  const clip = CLIPS[name];
  if (!clip) continue;
  const size = clip.ctx.viewport;
  const ctx = await browser.newContext({
    ...clip.ctx,
    locale: "pl-PL",
    timezoneId: "Europe/Warsaw",
    colorScheme: theme,
    recordVideo: { dir: out, size },
  });
  await ctx.addInitScript((t) => {
    try {
      localStorage.setItem("pk-theme", t);
    } catch {}
  }, theme);
  const page = await ctx.newPage();
  await clip.run(page);
  const video = page.video();
  await ctx.close();
  const file = `${name}-${theme}.webm`;
  fs.renameSync(await video.path(), path.join(out, file));
  done.push(file);
  console.log("✓", file);
}
await browser.close();

const all = fs.readdirSync(out).filter((f) => f.endsWith(".webm")).sort();
fs.writeFileSync(
  path.join(out, "index.html"),
  `<!doctype html><meta charset="utf-8"><title>Nagrania TP</title>
<style>body{font:14px system-ui;margin:24px;background:#111;color:#eee}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:18px}video{width:100%;border-radius:12px;background:#000}</style>
<h1>Nagrania TP — ${origin} — ${new Date().toLocaleString("pl-PL")}</h1><div class="g">${all
    .map((f) => `<figure><video src="${f}" controls loop muted playsinline></video><figcaption>${f}</figcaption></figure>`)
    .join("")}</div>`,
);
console.log(`\n${done.length} nagrań → ${path.relative(ROOT, out)}/index.html`);
