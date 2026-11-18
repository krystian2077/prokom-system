import { describe, expect, it } from "vitest";
import { parseThemeParam, resolveTheme, themeScript, type ThemeChoice } from "./theme";
import { carryHref, ourHosts, withoutThemeParam } from "./theme-carry";

describe("resolveTheme (MOTYW-PASEK-LINII §2.1)", () => {
  const cases: [string, { stored: ThemeChoice; systemDark: boolean; night: boolean }, "light" | "dark"][] = [
    ["a saved choice wins over a dark system", { stored: "light", systemDark: true, night: true }, "light"],
    ["a saved dark wins in daylight", { stored: "dark", systemDark: false, night: false }, "dark"],
    ["Auto + system dark → dark", { stored: "auto", systemDark: true, night: false }, "dark"],
    ["Auto + night in Rabka → dark", { stored: "auto", systemDark: false, night: true }, "dark"],
    ["Auto + day + light system → light", { stored: "auto", systemDark: false, night: false }, "light"],
  ];
  it.each(cases)("%s", (_, input, out) => expect(resolveTheme(input)).toBe(out));
});

describe("?motyw", () => {
  it("parses the three values, ignores the rest", () => {
    expect(parseThemeParam("jasny")).toBe("light");
    expect(parseThemeParam("ciemny")).toBe("dark");
    expect(parseThemeParam("auto")).toBe("auto");
    expect(parseThemeParam("dark")).toBeNull();
    expect(parseThemeParam(null)).toBeNull();
  });
  it("carries the choice only to our other domains, keeping query and #hash", () => {
    const here = "prokomserwis.pl";
    expect(carryHref("https://prokomsoftware.pl/oferta?x=1#cennik", here, "dark")).toBe("https://prokomsoftware.pl/oferta?x=1&motyw=ciemny#cennik");
    expect(carryHref("https://www.pro-kom.eu/", here, "auto")).toBe("https://www.pro-kom.eu/?motyw=auto");
    expect(carryHref("https://staging.prokombiznes.pl/", here, "light")).toBe("https://staging.prokombiznes.pl/?motyw=jasny");
    expect(carryHref("https://example.com/", here, "dark")).toBeNull();
    expect(carryHref("https://prokomsoftware.pl.evil.com/", here, "dark")).toBeNull();
    expect(carryHref("mailto:kontakt@prokomserwis.pl", here, "dark")).toBeNull();
    expect(carryHref("tel:+48883200151", here, "dark")).toBeNull();
    expect(carryHref("/kontakt", here, "dark")).toBeNull(); // same host: same localStorage
    expect(carryHref("https://prokomserwis.pl/", here, "dark")).toBeNull();
  });
  it("the host list comes from config/prokom.ts lines", () => {
    const hosts = ourHosts();
    for (const h of ["prokombiznes.pl", "www.prokominstalacje.pl", "prokomsoftware.pl", "pro-kom.eu", "prokomserwis.pl", "prokomgaming.pl"]) expect(hosts.has(h)).toBe(true);
  });
  it("cleans the address: only motyw goes, the rest stays", () => {
    expect(withoutThemeParam("https://prokomserwis.pl/kontakt?motyw=ciemny#formularz")).toBe("/kontakt#formularz");
    expect(withoutThemeParam("https://prokomserwis.pl/szukaj?q=ekran&motyw=nie-wiem")).toBe("/szukaj?q=ekran");
    expect(withoutThemeParam("https://prokomserwis.pl/")).toBeNull();
  });
});

/** Runs the real inline script against a fake page (node test environment, no DOM). */
function runScript(opts: { search?: string; stored?: string | null; systemDark?: boolean; now: string }) {
  const store = new Map<string, string>();
  if (opts.stored) store.set("pk-theme", opts.stored);
  const attrs = new Map<string, string>();
  const RealDate = Date;
  const fixed = new RealDate(opts.now).getTime();
  class FakeDate extends RealDate {
    constructor(...a: unknown[]) {
      super(...((a.length ? a : [fixed]) as [number]));
    }
    static now() {
      return fixed;
    }
  }
  const win: Record<string, unknown> = {
    matchMedia: (q: string) => ({ matches: q.includes("dark") ? !!opts.systemDark : false, addEventListener() {} }),
    dispatchEvent() {},
  };
  const doc = {
    documentElement: { setAttribute: (k: string, v: string) => attrs.set(k, v), getAttribute: (k: string) => attrs.get(k) ?? null, hasAttribute: () => false, style: {} as Record<string, string> },
    addEventListener() {},
    querySelector: () => null,
    visibilityState: "visible",
  };
  const localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k) };
  new Function("window", "document", "localStorage", "location", "Date", "CustomEvent", "URLSearchParams", themeScript)(
    win, doc, localStorage, { search: opts.search ?? "" }, FakeDate, class {}, URLSearchParams,
  );
  return { theme: attrs.get("data-tech-theme"), choice: attrs.get("data-tech-theme-choice"), stored: store.get("pk-theme") ?? null };
}

describe("themeScript (head, before the first paint)", () => {
  const NIGHT = "2026-11-18T21:00:00Z"; // 22:00 in Warsaw
  const DAY = "2026-11-18T11:00:00Z"; // 12:00
  it("Auto at 22:00 → dark, at 12:00 → light (light system)", () => {
    expect(runScript({ now: NIGHT }).theme).toBe("dark");
    expect(runScript({ now: DAY }).theme).toBe("light");
  });
  it("Auto with a dark system → dark at noon", () => {
    expect(runScript({ now: DAY, systemDark: true }).theme).toBe("dark");
  });
  it("a saved light wins at night", () => {
    expect(runScript({ now: NIGHT, stored: "light" })).toMatchObject({ theme: "light", choice: "light" });
  });
  it("?motyw=ciemny saves dark; ?motyw=auto removes the key; unknown is ignored", () => {
    expect(runScript({ now: DAY, search: "?motyw=ciemny" })).toMatchObject({ theme: "dark", stored: "dark" });
    expect(runScript({ now: NIGHT, search: "?motyw=auto", stored: "light" })).toMatchObject({ theme: "dark", stored: null, choice: "auto" });
    expect(runScript({ now: DAY, search: "?motyw=xyz", stored: "dark" })).toMatchObject({ theme: "dark", stored: "dark" });
  });
  it("always sets data-tech-theme", () => {
    expect(runScript({ now: DAY }).theme).toMatch(/^(light|dark)$/);
  });
});
