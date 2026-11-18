import { describe, expect, it } from "vitest";
import { GENERAL_PHONE_LABEL, line, pointPhone, servicePoints, telHref, type ServicePoint } from "@/config/prokom";
import { SUBMIT_HREF, TRACK_HREF, directionsUrl } from "../nav";
import { buildSearchIndex } from "./build-index";
import { buildProvider } from "./provider";
import { MATCHED_ACTIONS_MAX, matchActions, quickActions, routeActions, routePoint } from "./quick-actions";
import { POPULAR_PHRASES, SEARCH_CATEGORIES, countCategories, plural, resultsLabel } from "./shortcuts";

const index = buildSearchIndex(false);
const provider = buildProvider(index);
const hrefs = new Set(index.map((e) => e.href));
const rabka = servicePoints.find((p) => p.key === "rabka")!;
const zakopane = servicePoints.find((p) => p.key === "zakopane")!;

describe("polska odmiana liczby wyników", () => {
  it.each([
    [0, "0 wyników"],
    [1, "1 wynik"],
    [2, "2 wyniki"],
    [4, "4 wyniki"],
    [5, "5 wyników"],
    [11, "11 wyników"],
    [12, "12 wyników"],
    [14, "14 wyników"],
    [21, "21 wyników"],
    [22, "22 wyniki"],
    [104, "104 wyniki"],
    [112, "112 wyników"],
  ])("%i → %s", (n, label) => {
    expect(resultsLabel(n)).toBe(label);
  });
  it("takes any word forms", () => {
    expect(plural(3, ["punkt", "punkty", "punktów"])).toBe("punkty");
  });
});

describe("„Najczęściej szukane”", () => {
  it("has the service phrases and no shop, prices or parcel lockers", () => {
    expect(POPULAR_PHRASES.length).toBeGreaterThanOrEqual(8);
    for (const p of POPULAR_PHRASES) expect(p.label + p.query).not.toMatch(/cen[ay]|sklep|paczkomat|whatsapp/i);
  });
  it.each(POPULAR_PHRASES.map((p) => [p.label, p] as const))("„%s” finds results and its best one is an existing page", (_label, phrase) => {
    expect(provider.count(phrase.query)).toBeGreaterThan(0);
    expect(hrefs.has(phrase.href)).toBe(true);
    expect(provider.query(phrase.query)[0].results[0].href).toBe(phrase.href);
  });
});

describe("„Na skróty”", () => {
  const counted = countCategories(provider);
  it("lists every category with a count from the real index", () => {
    expect(counted.map((c) => c.key)).toEqual(SEARCH_CATEGORIES.map((c) => c.key));
    for (const c of counted) {
      expect(c.count).toBeGreaterThan(0);
      expect(c.count).toBe(provider.count(c.query));
    }
  });
  it("the number is what the category's phrase shows", () => {
    const phones = counted.find((c) => c.key === "telefony")!;
    const shown = provider.query(phones.query, 1000).reduce((n, g) => n + g.results.length, 0);
    expect(shown).toBe(phones.count);
  });
  it("leaves out a category that finds nothing", () => {
    expect(countCategories(provider, [{ key: "x", label: "X", query: "qwxzv", icon: "page" }])).toEqual([]);
  });
});

describe("szybkie akcje", () => {
  const actions = quickActions({ points: servicePoints });
  const byKind = (kind: string) => actions.filter((a) => a.kind === kind);

  it("come in the order of the pattern and every one is unique", () => {
    expect(actions.map((a) => a.kind)).toEqual(["call", "call2", "call2", "copy", "mail", "route", "submit", "track", "contact", "theme"]);
    expect(new Set(actions.map((a) => a.id)).size).toBe(actions.length);
  });

  it("take the phone, the e-mail and the second number from config/prokom.ts", () => {
    expect(byKind("call")[0].href).toBe(telHref(line.phone));
    expect(byKind("copy")[0].value).toBe(line.phoneDisplay);
    expect(byKind("mail")[0].href).toBe(`mailto:${line.email}`);
    // runda 18.11 §1.2: every point has its own number, the general one is the „Infolinia”
    expect(byKind("call")[0].sub).toBe(GENERAL_PHONE_LABEL);
    expect(byKind("call2").map((a) => a.href)).toEqual([telHref(pointPhone(rabka)), telHref(pointPhone(zakopane))]);
    expect(byKind("call2").map((a) => a.sub)).toEqual([rabka.name, zakopane.name]);
  });

  it("lead to the form, the status page and contact", () => {
    expect(byKind("submit")[0].href).toBe(SUBMIT_HREF);
    expect(byKind("track")[0].href).toBe(TRACK_HREF);
    expect(byKind("contact")[0].href).toBe("/kontakt");
    expect(byKind("theme")[0].href).toBeUndefined();
  });

  it("measure with the SPEC §12.5 events", () => {
    expect(byKind("call")[0].track).toEqual({ event: "telefon_klik", params: { miejsce: "szukaj" } });
    expect(byKind("route")[0].track?.event).toBe("nawigacja_klik");
    expect(byKind("submit")[0].track).toEqual({ event: "zgloszenie_start", params: { zrodlo: "przycisk" } });
  });

  it("show an unpublished point nowhere (no second number, no route)", () => {
    const hidden: ServicePoint = { ...zakopane, published: false };
    const list = quickActions({ points: [rabka, hidden] });
    expect(list.filter((a) => a.kind === "call2").map((a) => a.sub)).toEqual([rabka.name]);
    expect(list.filter((a) => a.kind === "route").map((a) => a.href)).toEqual([directionsUrl(rabka.geo!)]);
    expect(routeActions([rabka, hidden]).map((a) => a.id)).toEqual(["route:rabka"]);
  });

  it("route to the point that is open, else the one opening soonest", () => {
    // Saturday 11:00 (Warsaw): Rabka open, Zakopane closed.
    expect(routePoint([zakopane, rabka], new Date("2026-11-21T10:00:00Z"))?.key).toBe("rabka");
    // Monday 16:00: Zakopane closes 16:30, Rabka 17:00 — both open, the first open wins.
    expect(["rabka", "zakopane"]).toContain(routePoint([zakopane, rabka], new Date("2026-11-23T15:00:00Z"))?.key);
    // No clock: the first point with a pin.
    expect(routePoint([rabka, zakopane])?.key).toBe("rabka");
    expect(routePoint([{ ...rabka, geo: null }])).toBeNull();
  });

  it("match a query by their words, at most a few", () => {
    expect(matchActions(actions, "zadzwoń").map((a) => a.kind)).toEqual(["call", "call2", "call2"]);
    expect(matchActions(actions, "kopiuj").map((a) => a.kind)).toEqual(["copy"]);
    expect(matchActions(actions, "motyw ciemny").map((a) => a.kind)).toEqual(["theme"]);
    expect(matchActions(actions, "dojazd zakopane").map((a) => a.id)).toEqual(["route:zakopane"]);
    expect(matchActions(actions, "numer").length).toBeLessThanOrEqual(MATCHED_ACTIONS_MAX);
    // a repair word is a search, not an action
    expect(matchActions(actions, "ekran")).toEqual([]);
    expect(matchActions(actions, "telefon")).toEqual([]);
    expect(matchActions(actions, "")).toEqual([]);
  });
});
