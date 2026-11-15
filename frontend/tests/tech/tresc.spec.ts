/**
 * Content rules on the RENDERED pages (SPEC §8, §11 pt 5) — TD6 QA.
 * literaly.test.ts checks source files; this test checks what a visitor really sees:
 * every URL from the sitemap plus pages left out of it (forms, status, 404, offline).
 *
 *   npm run build && npx playwright test tresc
 */
import { expect, test } from "@playwright/test";

const EXTRA = ["/zgloszenie", "/track", "/claim-repair", "/offline", "/nie-ma-takiej-strony"];

/** [label, pattern, allowed sentence (optional)] */
const RULES: [string, RegExp, RegExp?][] = [
  ["WhatsApp", /whats\s?app|wa\.me/i],
  ["paczkomat", /paczkomat/i, /nie\s+(obsługujemy|przyjmujemy|wysyłamy)[^.]{0,40}paczkomat|paczkomat[^.]{0,40}nie\s+(obsługujemy|przyjmujemy)/i],
  // No \b after "zł": "ł" is not a word character in JS regexes without the u flag.
  // Allowed: the storage fee in /regulamin (legal text, left for the lawyer — STAN).
  ["cena", /\d[\d\s]*(,\d{2})?\s?(zł(ot[a-zęy]*)?|pln)(?![a-ząćęłńóśźż])|cennik/i, /opłatę za przechowanie/i],
  ["sklep", /\bsklep(u|ie|em|y|ów)?\b/i, /(nie|bez)\s+(prowadzimy\s+)?sklep/i],
  ["zaślepka", /lorem ipsum|\bTODO\b|placeholder|\bxxx\b|\{\{|\}\}|\bundefined\b|\bNaN\b|\[object Object\]/i],
];

/**
 * Known pages that still say "sklep" (TD6, 15.11): old blog articles from lib/blog-posts.ts
 * (text = Krystian's decision, SPEC §8) and the privacy policy (left for the lawyer, STAN).
 * Only shrinks: a listed page without the word fails the test until removed from the list.
 */
const KNOWN_SKLEP = new Set([
  "/polityka-prywatnosci",
  "/blog",
  "/blog/kategoria/laptopy-i-komputery",
  "/blog/kategoria/porady-zakupowe",
  "/blog/dlaczego-warto-kupowac-akcesoria-gsm-w-sprawdzonym-sklepie",
  "/blog/gdzie-kupic-akcesoria-gsm-rabka-zdroj",
  "/blog/jak-dobrac-etui-do-telefonu",
  "/blog/jak-dobrac-ladowarke-do-telefonu",
  "/blog/jak-dobrac-ram-ssd-zasilacz-do-komputera",
  "/blog/jak-przygotowac-pc-do-grania-online-bez-lagow",
  "/blog/laptop-gamingowy-czy-komputer-stacjonarny",
  "/blog/oryginalne-podzespoly-w-komputerze-gamingowym-dlaczego-to-ma-znaczenie",
  "/blog/skladanie-komputera-gamingowego",
]);

async function sitemapPaths(baseURL: string): Promise<string[]> {
  const xml = await (await fetch(`${baseURL}/sitemap.xml`)).text();
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (m) => new URL(m[1]).pathname);
}

test("treść stron bez WhatsAppa, cen, paczkomatu, sklepu i zaślepek", async ({ page, baseURL }) => {
  test.setTimeout(10 * 60_000);
  const paths = Array.from(new Set([...(await sitemapPaths(baseURL!)), ...EXTRA]));
  expect(paths.length).toBeGreaterThan(20);
  const problems: string[] = [];
  const sklepSeen = new Set<string>();
  for (const p of paths) {
    await page.goto(p, { waitUntil: "load" });
    // textContent also covers closed sheets, accordions and hidden steps; scripts (JSON-LD, RSC payload) are not text.
    const text = (
      await page.evaluate(() => {
        const body = document.body.cloneNode(true) as HTMLElement;
        body.querySelectorAll("script, style, noscript, template").forEach((e) => e.remove());
        return body.textContent || "";
      })
    ).replace(/\s+/g, " ");
    const meta = await page.evaluate(() =>
      Array.from(document.querySelectorAll('title, meta[name="description"], meta[property^="og:"]'))
        .map((e) => e.getAttribute("content") || e.textContent || "")
        .join(" "),
    );
    for (const [label, re, allowed] of RULES) {
      const all = `${text} ${meta}`;
      const global = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
      for (const m of Array.from(all.matchAll(global))) {
        const ctx = all.slice(Math.max(0, m.index! - 60), m.index! + m[0].length + 60);
        if (allowed && allowed.test(ctx)) continue;
        if (label === "sklep" && KNOWN_SKLEP.has(p)) {
          sklepSeen.add(p);
          continue;
        }
        problems.push(`${p} · ${label}: …${ctx}…`);
      }
    }
  }
  expect(problems, problems.join("\n")).toEqual([]);
  const stale = Array.from(KNOWN_SKLEP).filter((p) => !sklepSeen.has(p));
  expect(stale, "KNOWN_SKLEP only shrinks — remove clean pages from it").toEqual([]);
});
