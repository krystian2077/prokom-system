#!/usr/bin/env node
// Page at 1440 next to the design screenshot (docs/tech/RESPONSYWNOSC.md §6, SPEC §11 pt 1).
// Writes tmp/porownaj/<name>.html with side-by-side, overlay slider and a pixel-diff score.
//
//   node scripts/tech/porownaj.mjs [origin] --page=/ --wzorzec=glowna [--themes=light,dark]
//        [--region=header|footer|full] [--top=0 --height=126]  (crop of the design, px)
//
// Regions: header = top 126 px of the design; footer = bottom 760 px. In the page the same
// region is taken from [data-t-region="header"] / [data-t-region="footer"].
import fs from "node:fs";
import path from "node:path";
import { ROOT, chromium, list, parseArgs, scrollLikeUser, themedPage } from "./lib.mjs";

const { opts, pos } = parseArgs(process.argv.slice(2));
const origin = (pos[0] || "http://localhost:3002").replace(/\/$/, "");
const pagePath = opts.page || "/";
const wzorzec = opts.wzorzec || "glowna";
const themes = list(opts.themes, ["light", "dark"]);
const region = opts.region || "full";
const out = path.join(ROOT, "tmp/porownaj");
fs.mkdirSync(out, { recursive: true });

const REGIONS = { header: "[data-t-region=\"header\"]", footer: "[data-t-region=\"footer\"]", full: null };
if (!(region in REGIONS)) throw new Error(`nieznany region: ${region}`);

const browser = await chromium.launch();
const results = [];
for (const theme of themes) {
  const designFile = path.join(ROOT, "docs/design/tech/zrzuty", `1440-${wzorzec}-${theme === "dark" ? "ciemny" : "jasny"}.webp`);
  if (!fs.existsSync(designFile)) throw new Error(`brak wzorca ${designFile}`);
  const name = `${wzorzec}-${region}-${theme}`;

  // 1) crop the design with the browser (webp decode + canvas)
  const { ctx: dctx, page: dpage } = await themedPage(browser, { width: 1440, theme });
  const b64 = fs.readFileSync(designFile).toString("base64");
  const designUrl = await dpage.evaluate(
    async ({ b64, top, height, region }) => {
      const img = new Image();
      img.src = `data:image/webp;base64,${b64}`;
      await img.decode();
      const H = img.naturalHeight;
      const crop =
        top != null ? { t: top, h: height } : region === "header" ? { t: 0, h: 126 } : region === "footer" ? { t: H - 760, h: 760 } : { t: 0, h: H };
      const h = Math.min(crop.h, H - crop.t);
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = h;
      c.getContext("2d").drawImage(img, 0, crop.t, img.naturalWidth, h, 0, 0, img.naturalWidth, h);
      return c.toDataURL("image/png");
    },
    { b64, region, top: opts.top != null ? +opts.top : null, height: +(opts.height || 126) },
  );
  await dctx.close();

  // 2) screenshot of the page (region)
  const { ctx, page } = await themedPage(browser, { width: 1440, theme });
  await page.goto(origin + pagePath, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  await scrollLikeUser(page);
  const buf = REGIONS[region]
    ? await page.locator(REGIONS[region]).first().screenshot()
    : await page.screenshot({ fullPage: true });
  const pageUrl = `data:image/png;base64,${buf.toString("base64")}`;

  // 3) pixel diff in the browser (same width, overlapping height)
  const score = await page.evaluate(
    async ({ a, b }) => {
      const load = async (src) => {
        const i = new Image();
        i.src = src;
        await i.decode();
        return i;
      };
      const [ia, ib] = await Promise.all([load(a), load(b)]);
      const w = Math.min(ia.naturalWidth, ib.naturalWidth);
      const h = Math.min(ia.naturalHeight, ib.naturalHeight);
      const px = (img) => {
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const g = c.getContext("2d");
        g.drawImage(img, 0, 0);
        return g.getImageData(0, 0, w, h).data;
      };
      const da = px(ia);
      const db = px(ib);
      let diff = 0;
      for (let i = 0; i < da.length; i += 4) {
        const d = Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
        if (d > 60) diff++;
      }
      return { pct: (100 * diff) / (w * h), w, h, ha: ia.naturalHeight, hb: ib.naturalHeight };
    },
    { a: designUrl, b: pageUrl },
  );
  await ctx.close();

  fs.writeFileSync(
    path.join(out, `${name}.html`),
    `<!doctype html><meta charset="utf-8"><title>${name}</title>
<style>body{font:14px system-ui;margin:16px;background:#888}h1{font-size:16px}
.cols{display:flex;gap:12px;align-items:flex-start}.cols img{width:720px;display:block}
.ov{position:relative;width:1440px;margin-top:16px}.ov img{display:block;width:1440px}.ov .top{position:absolute;inset:0;overflow:hidden;width:50%}
.ov .top img{width:1440px}input{width:1440px}</style>
<h1>${name} — wzorzec (lewo) / strona (prawo) · różnych pikseli: ${score.pct.toFixed(2)}% (porównane ${score.w}×${score.h}; wysokość wzorca ${score.ha}, strony ${score.hb})</h1>
<div class="cols"><img src="${designUrl}"><img src="${pageUrl}"></div>
<p>Suwak: lewa część = wzorzec, prawa = strona</p><input type="range" min="0" max="100" value="50" oninput="document.querySelector('.top').style.width=this.value+'%'">
<div class="ov"><img src="${pageUrl}"><div class="top"><img src="${designUrl}"></div></div>`,
  );
  results.push({ name, ...score });
  console.log(`✓ ${name}: ${score.pct.toFixed(2)}% różnych pikseli (wzorzec ${score.ha}px, strona ${score.hb}px) → tmp/porownaj/${name}.html`);
}
await browser.close();
