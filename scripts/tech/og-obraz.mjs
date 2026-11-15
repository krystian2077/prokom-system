#!/usr/bin/env node
// Renders the default share image and the schema.org logo for the public site
// (referenced by app/(public)/layout.tsx, lib/tech/seo.ts, lib/tech/jsonld.ts):
//   frontend/public/images/og-prokom.jpg  1200×630
//   frontend/public/images/logo.png       512×512 (same mark as the PWA icon)
// Rerun after a change of the line name or the PWA icon.
//
//   node scripts/tech/og-obraz.mjs
import fs from "node:fs";
import path from "node:path";
import { ROOT, chromium } from "./lib.mjs";

const out = path.join(ROOT, "frontend/public/images");
const icon = fs.readFileSync(path.join(ROOT, "frontend/public/tech/pwa/icon-512.png")).toString("base64");

// Tokens from app/(public)/tech.css (dark theme): --bg #120d0c, --ink #f6f1f0, --acc #e2483a.
const og = `<!doctype html><meta charset="utf-8">
<style>
  html,body{margin:0;width:1200px;height:630px;background:#120d0c;color:#f6f1f0;font-family:"Segoe UI",Arial,sans-serif}
  .w{position:relative;box-sizing:border-box;height:100%;padding:72px 80px;display:flex;flex-direction:column;justify-content:space-between;
     background:radial-gradient(900px 500px at 85% 15%,rgba(226,72,58,.22),transparent 60%)}
  .top{display:flex;align-items:center;gap:24px}
  .top img{width:112px;height:112px;border-radius:24px}
  .brand{font-size:44px;font-weight:800;letter-spacing:-.01em}
  .brand b{color:#e2483a;font-weight:800}
  h1{margin:0;font-size:68px;line-height:1.05;font-weight:800;letter-spacing:-.02em;max-width:980px}
  .sub{font-size:32px;color:#d9cfcd}
  .bar{position:absolute;left:80px;bottom:56px;width:120px;height:10px;background:#e2483a}
</style>
<div class="w">
  <div class="top"><img src="data:image/png;base64,${icon}" alt=""><div class="brand">PRO-KOM <b>Tech</b></div></div>
  <h1>Serwis telefonów i&nbsp;komputerów</h1>
  <div class="sub">Rabka-Zdrój · wycena przed naprawą · status naprawy online</div>
  <i class="bar"></i>
</div>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(og, { waitUntil: "load" });
await page.screenshot({ path: path.join(out, "og-prokom.jpg"), type: "jpeg", quality: 86 });
await page.setViewportSize({ width: 512, height: 512 });
await page.setContent(`<style>html,body{margin:0}</style><img src="data:image/png;base64,${icon}" width="512" height="512">`);
await page.screenshot({ path: path.join(out, "logo.png"), omitBackground: true });
await browser.close();
console.log("✓ public/images/og-prokom.jpg, public/images/logo.png");
