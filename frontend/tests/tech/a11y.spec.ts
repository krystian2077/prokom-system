/**
 * Accessibility of every public page (SPEC §9, §11; TD6 DoD: zero critical axe violations).
 * axe-core (WCAG 2 A + AA) on the sitemap and the pages left out of it, phone and laptop,
 * both themes. Only the public markup (.tech) is checked; aria-hidden decoration is skipped.
 * Critical → test fails. Serious and below are printed for the STAN list.
 *
 *   npm run build && npx playwright test a11y
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import { expect, test } from "@playwright/test";

// axe-core comes with eslint-config-next (jsx-a11y); no extra dependency.
const axeSource = fs.readFileSync(createRequire(__filename).resolve("axe-core/axe.min.js"), "utf8");
const EXTRA = ["/zgloszenie", "/track", "/claim-repair", "/offline", "/nie-ma-takiej-strony"];
const VIEWS = [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
];

type Violation = { id: string; impact: string | null; count: number; targets: string[] };

test("axe: zero krytycznych naruszeń na stronach publicznych", async ({ browser, baseURL }) => {
  test.setTimeout(20 * 60_000);
  const xml = await (await fetch(`${baseURL}/sitemap.xml`)).text();
  const paths = Array.from(new Set([...Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (m) => new URL(m[1]).pathname), ...EXTRA]));
  const critical: string[] = [];
  const other = new Map<string, number>();
  for (const theme of ["light", "dark"] as const) {
    for (const view of VIEWS) {
      const ctx = await browser.newContext({ viewport: view, colorScheme: theme, reducedMotion: "reduce", locale: "pl-PL" });
      await ctx.addInitScript((t) => {
        try {
          localStorage.setItem("pk-theme", t);
        } catch {
          /* ignore */
        }
      }, theme);
      const page = await ctx.newPage();
      for (const p of paths) {
        await page.goto(p, { waitUntil: "load" });
        await page.addScriptTag({ content: axeSource });
        const res: Violation[] = await page.evaluate(async () => {
          const w = window as unknown as { axe: { run: (c: unknown, o: unknown) => Promise<{ violations: { id: string; impact: string | null; nodes: { target: string[] }[] }[] }> } };
          const scope = document.querySelector(".tech") ? [".tech"] : ["body"];
          const out = await w.axe.run({ include: scope, exclude: ['[aria-hidden="true"]'] }, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } });
          return out.violations.map((v) => ({ id: v.id, impact: v.impact, count: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) }));
        });
        for (const v of res) {
          const key = `${v.impact} · ${v.id} · ${p} (${theme} ${view.width})`;
          if (v.impact === "critical") critical.push(`${key}: ${v.targets.join(" | ")}`);
          else other.set(`${key}: ${v.targets.join(" | ")}`, v.count);
        }
      }
      await ctx.close();
    }
  }
  if (other.size) console.log(`axe — inne naruszenia (${other.size}):\n${Array.from(other.keys()).join("\n")}`);
  expect(critical, critical.join("\n")).toEqual([]);
});
