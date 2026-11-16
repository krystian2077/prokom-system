#!/usr/bin/env node
// axe-core check of public pages in both themes (TP DoD: "axe kontrast zielony").
// Injects axe-core from frontend/node_modules; reports violations per page/theme/width.
//
//   node scripts/tech/axe.mjs [origin] [--pages=/,/zgloszenie,/punkty-serwisowe] [--widths=390,1440] [--rules=color-contrast] [--out=tmp/axe.json]
//   --rules: comma list of axe rule ids (default: color-contrast); --rules=all runs WCAG 2 A/AA tags.
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { ROOT, chromium, list, parseArgs, scrollLikeUser, themedPage } from "./lib.mjs";

const { opts, pos } = parseArgs(process.argv.slice(2));
const origin = (pos[0] || "http://localhost:3002").replace(/\/$/, "");
const pages = list(opts.pages, ["/", "/zgloszenie", "/punkty-serwisowe", "/kontakt", "/o-firmie", "/track"]);
const widths = list(opts.widths, ["390", "1440"]).map(Number);
const rules = opts.rules === "all" ? null : list(opts.rules, ["color-contrast"]);
const require = createRequire(path.join(ROOT, "frontend/package.json"));
const axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const browser = await chromium.launch();
const report = [];
let total = 0;
for (const p of pages) {
  for (const theme of ["light", "dark"]) {
    for (const width of widths) {
      const { ctx, page } = await themedPage(browser, { width, theme });
      await page.goto(origin + p, { waitUntil: "load" });
      await scrollLikeUser(page); // reveal everything before measuring
      await page.waitForTimeout(800);
      await page.addScriptTag({ content: axeSource });
      const res = await page.evaluate(async (r) => {
        const options = r ? { runOnly: { type: "rule", values: r } } : { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } };
        // only the public site, never panel markup; decorative text hidden from assistive tech (aria-hidden) is skipped
        const out = await window.axe.run({ include: [".tech"], exclude: ["[aria-hidden=\"true\"]"] }, options);
        return out.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 5).map((n) => ({ target: n.target.join(" "), summary: n.failureSummary?.split("\n")[1]?.trim() })) , count: v.nodes.length }));
      }, rules);
      const n = res.reduce((s, v) => s + v.count, 0);
      total += n;
      report.push({ page: p, theme, width, violations: res });
      console.log(`${n ? "✗" : "✓"} ${p} ${theme} ${width}: ${n} ${res.map((v) => `${v.id}×${v.count}`).join(", ")}`);
      for (const v of res) for (const node of v.nodes) console.log(`    ${v.id}: ${node.target} — ${node.summary ?? ""}`);
      await ctx.close();
    }
  }
}
await browser.close();
if (opts.out) fs.writeFileSync(path.join(ROOT, opts.out), JSON.stringify({ origin, at: new Date().toISOString(), rules, report }, null, 2));
console.log(`\nRazem naruszeń: ${total}`);
process.exitCode = total ? 1 : 0;
