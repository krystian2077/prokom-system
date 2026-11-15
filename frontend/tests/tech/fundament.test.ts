/** TD1 PR 1: measurement, JSON-LD, theme isolation (SPEC §3, §9, §12.5). */
import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { servicePoints } from "@/config/prokom";
import { jsonLdString, siteJsonLd } from "@/lib/tech/jsonld";
import { themeScript, THEME_STORAGE_KEY } from "@/lib/tech/theme";
import { sanitizeParams, trackEvent } from "@/lib/tech/track-event";

const FRONTEND = path.resolve(__dirname, "../..");
const read = (rel: string) => fs.readFileSync(path.join(FRONTEND, rel), "utf8");

describe("trackEvent — no personal data", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("no-op without Umami (and on the server)", () => {
    expect(() => trackEvent("pwa_start")).not.toThrow();
    vi.stubGlobal("window", {});
    expect(() => trackEvent("telefon_klik", { miejsce: "pasek_marki" })).not.toThrow();
  });

  it("sends allowed params", () => {
    const track = vi.fn();
    vi.stubGlobal("window", { umami: { track } });
    trackEvent("zgloszenie_wyslane", { kategoria: "phone", dostawa: "personal", punkt: "rabka" });
    trackEvent("zgloszenie_krok", { nr: 3 });
    trackEvent("pwa_start");
    expect(track).toHaveBeenCalledWith("zgloszenie_wyslane", { kategoria: "phone", dostawa: "personal", punkt: "rabka" });
    expect(track).toHaveBeenCalledWith("zgloszenie_krok", { nr: 3 });
    expect(track).toHaveBeenCalledWith("pwa_start", undefined);
  });

  it.each([
    ["e-mail", "jan.kowalski@example.com"],
    ["phone", "883 200 151"],
    ["phone compact", "+48600100200"],
    ["repair number", "PROKOM/RMA/4/2026"],
    ["free text", "x".repeat(61)],
  ])("drops the whole event when a value looks like %s", (_label, value) => {
    const track = vi.fn();
    vi.stubGlobal("window", { umami: { track } });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    trackEvent("kontakt_wyslany", { temat: value });
    expect(track).not.toHaveBeenCalled();
  });

  it("sanitizeParams rejects non-primitive values", () => {
    expect(sanitizeParams({ a: { nested: 1 } })).toBeNull();
    expect(sanitizeParams({ a: "ok", b: 2 })).toEqual({ a: "ok", b: 2 });
  });
});

describe("Umami only on the public site", () => {
  it("script tag only in app/(public)/layout.tsx, behind NEXT_PUBLIC_UMAMI_WEBSITE_ID", () => {
    const pub = read("app/(public)/layout.tsx");
    expect(pub).toMatch(/NEXT_PUBLIC_UMAMI_WEBSITE_ID/);
    expect(pub).toMatch(/umamiId \?/);
    for (const f of ["app/layout.tsx", "app/panel/layout.tsx", "app/admin-panel/layout.tsx"]) {
      expect(read(f), f).not.toMatch(/umami|_s\/script/i);
    }
  });
});

describe("JSON-LD from prokom.ts", () => {
  const graph = siteJsonLd()["@graph"] as Array<Record<string, unknown>>;

  it("Organization + one LocalBusiness per published point only", () => {
    expect(graph[0]["@type"]).toBe("Organization");
    const businesses = graph.filter((n) => n["@type"] === "LocalBusiness");
    expect(businesses).toHaveLength(servicePoints.filter((p) => p.published).length);
    expect(JSON.stringify(graph)).not.toMatch(/Staszica|Zakopane"/); // Zakopane is a draft
  });

  it("includes Zakopane once it is published", () => {
    const all = servicePoints.map((p) => ({ ...p, published: true }));
    const g = siteJsonLd(all)["@graph"] as Array<Record<string, unknown>>;
    expect(g.filter((n) => n["@type"] === "LocalBusiness")).toHaveLength(2);
  });

  it("opening hours come from the same data", () => {
    const rabka = graph.find((n) => n["@id"] === "https://prokomserwis.pl/#punkt-rabka") ?? graph[1];
    expect(rabka.openingHoursSpecification).toEqual([
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "17:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Saturday"], opens: "09:00", closes: "14:00" },
    ]);
  });

  it("escapes < so the JSON cannot close the script tag", () => {
    expect(jsonLdString({ a: "</script>" })).not.toContain("</script>");
  });

  it("root layout no longer carries JSON-LD", () => {
    expect(read("app/layout.tsx")).not.toMatch(/application\/ld\+json/);
  });
});

describe("theme isolation", () => {
  it("public theme script never touches panel attributes or keys", () => {
    expect(THEME_STORAGE_KEY).toBe("pk-theme");
    expect(themeScript).toContain("data-tech-theme");
    expect(themeScript).not.toMatch(/prokom-theme|'data-theme'|"data-theme"|prokom-worker|prokom-client/);
  });

  const publicCss = fs.readdirSync(path.join(FRONTEND, "app/(public)")).filter((f) => /^tech.*\.css$/.test(f));

  it("public CSS: tech.css plus the TP layers, each imported by the public layout", () => {
    expect(publicCss).toEqual(expect.arrayContaining(["tech.css", "tech-theme.css", "tech-motion.css"]));
    const layout = read("app/(public)/layout.tsx");
    for (const f of publicCss) expect(layout, f).toContain(`import "./${f}";`);
  });

  it.each(publicCss)("%s: every rule is scoped under .tech, no data-theme", (file) => {
    const css = read(`app/(public)/${file}`).replace(/\/\*[\s\S]*?\*\//g, "");
    expect(css).not.toMatch(/data-theme|prokom-theme/);
    // selectors = text before "{" that is not an at-rule
    const selectors = Array.from(css.matchAll(/([^{}]+)\{/g))
      .map((m) => m[1].trim())
      .filter((s) => s && !s.startsWith("@") && !/^(from|to|\d+%)$/.test(s));
    const splitTop = (s: string) => {
      const out: string[] = [];
      let depth = 0;
      let cur = "";
      for (const ch of s) {
        if (ch === "(") depth++;
        if (ch === ")") depth--;
        if (ch === "," && depth === 0) {
          out.push(cur.trim());
          cur = "";
        } else cur += ch;
      }
      return [...out, cur.trim()];
    };
    const unscoped = selectors.flatMap(splitTop).filter((x) => !/^(html\[data-tech-theme="dark"\] )?\.tech\b/.test(x));
    expect(unscoped).toEqual([]);
  });
});
