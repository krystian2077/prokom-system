#!/usr/bin/env node
// Lab performance probe without Lighthouse (TP): phone viewport, CPU 4× slower and
// "Fast 3G"-like network through CDP, then LCP, CLS, TBT (sum of long-task time over
// 50 ms) and the longest task — read from PerformanceObserver in the page.
// Optional --wizard: on "/" also click through the wizard (device → fault) and count
// long tasks during the interaction (TP PR 3: no frames > 50 ms at CPU 4×).
//
//   node scripts/tech/wydajnosc.mjs [origin] [--pages=/,/zgloszenie,/punkty-serwisowe] [--runs=3] [--wizard] [--out=tmp/wydajnosc.json]
//
// Not a Lighthouse score — a repeatable proxy for before/after comparisons on one machine.
import fs from "node:fs";
import path from "node:path";
import { ROOT, chromium, list, parseArgs } from "./lib.mjs";

const { opts, pos } = parseArgs(process.argv.slice(2));
const origin = (pos[0] || "http://localhost:3002").replace(/\/$/, "");
const pages = list(opts.pages, ["/", "/zgloszenie", "/punkty-serwisowe"]);
const runs = Number(opts.runs || 3);

const OBSERVE = () => {
  window.__perf = { lcp: 0, cls: 0, tasks: [] };
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) window.__perf.lcp = e.startTime;
  }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) if (!e.hadRecentInput) window.__perf.cls += e.value;
  }).observe({ type: "layout-shift", buffered: true });
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) window.__perf.tasks.push([e.startTime, e.duration]);
  }).observe({ type: "longtask", buffered: true });
};

async function probe(browser, p) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "pl-PL" });
  await ctx.addInitScript(OBSERVE);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  const t0 = Date.now();
  await page.goto(origin + p, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => {
    const t = window.__perf.tasks;
    return { lcp: window.__perf.lcp, cls: window.__perf.cls, tbt: t.reduce((s, [, d]) => s + Math.max(0, d - 50), 0), longest: t.reduce((m, [, d]) => Math.max(m, d), 0) };
  });
  r.load = Date.now() - t0;
  if (opts.wizard && p === "/") {
    await page.evaluate(() => (window.__perf.tasks = []));
    await page.locator("#kreator").scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.evaluate(() => (window.__perf.tasks = []));
    const dev = page.locator("#kreator .t-chp--dev").nth(3);
    await dev.click();
    await page.waitForTimeout(1200);
    const chip = page.locator("[data-testid=wizard-flow] .t-chp--fault").nth(1);
    if (await chip.count()) await chip.click();
    await page.waitForTimeout(1500);
    r.wizardLongest = await page.evaluate(() => window.__perf.tasks.reduce((m, [, d]) => Math.max(m, d), 0));
  }
  await ctx.close();
  return r;
}

const browser = await chromium.launch();
const out = {};
for (const p of pages) {
  const all = [];
  for (let i = 0; i < runs; i++) all.push(await probe(browser, p));
  const med = (k) => {
    const v = all.map((x) => x[k]).filter((x) => x !== undefined).sort((a, b) => a - b);
    return v.length ? v[Math.floor(v.length / 2)] : undefined;
  };
  out[p] = { lcp: Math.round(med("lcp")), cls: Number(med("cls").toFixed(3)), tbt: Math.round(med("tbt")), longest: Math.round(med("longest")), wizardLongest: med("wizardLongest") && Math.round(med("wizardLongest")) };
  console.log(p, JSON.stringify(out[p]));
}
await browser.close();
if (opts.out) {
  fs.mkdirSync(path.dirname(path.join(ROOT, opts.out)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, opts.out), JSON.stringify({ origin, at: new Date().toISOString(), runs, pages: out }, null, 2));
}
