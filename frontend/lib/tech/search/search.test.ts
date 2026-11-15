import { describe, expect, it } from "vitest";
import { buildSearchIndex } from "./build-index";
import { highlight, searchIndex, prepareIndex, tokenize } from "./engine";
import { foldKeepLength, normalizeText, stem } from "./normalize";
import { GROUP_LIMIT, buildProvider, type SearchEntry } from "./provider";
import { RECENT_MAX, clearRecent, pushRecent, readRecent } from "./recent";
import { isSearchShortcut } from "./shortcut";

const index = buildSearchIndex(false);
const provider = buildProvider(index);
const titles = (q: string) => provider.query(q).flatMap((g) => g.results.map((r) => r.title));
const firstHref = (q: string) => provider.query(q)[0]?.results[0]?.href;

describe("normalizacja", () => {
  it("drops Polish diacritics, ł and case, collapses spaces", () => {
    expect(normalizeText("  Łódź  ŻÓŁTA   ĆMA ")).toBe("lodz zolta cma");
    expect(normalizeText("Wyświetlacz")).toBe("wyswietlacz");
  });
  it("folds a title keeping its length (for highlighting)", () => {
    const t = "Wymiana baterii — Zażółć";
    expect(foldKeepLength(t)).toHaveLength(t.length);
    expect(foldKeepLength("Łąka")).toBe("laka");
  });
  it("stems common Polish endings", () => {
    expect(stem("ekranu")).toBe("ekran");
    expect(stem("laptopow")).toBe("laptop");
    expect(stem("baterii")).toBe("bater");
    expect(stem("telefonem")).toBe("telefon");
    // short words stay whole
    expect(stem("dysk")).toBe("dysk");
  });
  it("tokenizes on non-letters", () => {
    expect(tokenize("Wymiana  ekranu, iPhone-13!")).toEqual(["wymiana", "ekranu", "iphone", "13"]);
  });
});

describe("ranking", () => {
  const sample: SearchEntry[] = [
    { id: "a", title: "Serwis laptopów", href: "/a", group: "urzadzenia", icon: "laptop", text: "matryca klawiatura" },
    { id: "b", title: "Jak dbać o baterię", href: "/b", group: "blog", icon: "doc", text: "laptop telefon ładowanie" },
    { id: "c", title: "Wymiana ekranu w telefonie", href: "/c", group: "naprawy", icon: "wrench", text: "pęknięta szybka" },
  ];
  const prepared = prepareIndex(sample.map((e) => ({ item: e.id, name: e.title, hay: e.text ?? "" })));

  it("a hit in the title ranks above a hit in the text", () => {
    expect(searchIndex(prepared, "laptop")).toEqual(["a", "b"]);
  });
  it("every token must match", () => {
    expect(searchIndex(prepared, "laptop matryca")).toEqual(["a"]);
    expect(searchIndex(prepared, "laptop drukarka")).toEqual([]);
  });
  it("finds inflected forms and words without diacritics", () => {
    expect(searchIndex(prepared, "ekranem")).toEqual(["c"]);
    expect(searchIndex(prepared, "pekniety ekran")).toEqual(["c"]);
    expect(searchIndex(prepared, "laptopa")).toEqual(["a", "b"]);
  });
  it("forgives a typo", () => {
    expect(searchIndex(prepared, "lapotp")).toEqual(["a", "b"]);
  });
  it("no tokens → null", () => {
    expect(searchIndex(prepared, " ,. ")).toBeNull();
  });
});

describe("indeks Tech", () => {
  it("has every kind of content and unique ids", () => {
    const groups = new Set(index.map((e) => e.group));
    for (const g of ["strony", "urzadzenia", "usterki", "punkty", "pytania", "blog"]) expect(groups).toContain(g);
    expect(new Set(index.map((e) => e.id)).size).toBe(index.length);
  });
  it("links stay inside the site and never into the panels", () => {
    for (const e of index) {
      expect(e.href.startsWith("/"), e.id).toBe(true);
      expect(e.href, e.id).not.toMatch(/^\/(panel|admin-panel|api)\b/);
    }
  });
  it("production index lists no drafts (unpublished points)", () => {
    const draft = buildSearchIndex(true).filter((e) => e.group === "punkty").length;
    const live = index.filter((e) => e.group === "punkty").length;
    expect(live).toBeLessThanOrEqual(draft);
  });
  it("stays small enough to fetch on idle", () => {
    expect(JSON.stringify(index).length).toBeLessThan(200_000);
  });
  it("faults lead to the form with the category and the fault filled in", () => {
    const fault = index.find((e) => e.group === "usterki")!;
    const url = new URL(fault.href, "https://x.pl");
    expect(url.pathname).toBe("/zgloszenie");
    expect(url.searchParams.get("category")).toBeTruthy();
    expect(url.searchParams.get("usterka")).toBeTruthy();
  });
});

describe("wyniki dla typowych fraz", () => {
  it("„drukarka” and „drukarki” find the printer service first", () => {
    expect(firstHref("drukarka")).toBe("/serwis-drukarek");
    expect(firstHref("drukarki")).toBe("/serwis-drukarek");
  });
  it("„status” leads to /track", () => {
    expect(firstHref("status")).toBe("/track");
  });
  it("„laptop” lists the laptop service", () => {
    expect(titles("laptop")).toContain("Serwis laptopów");
  });
  it("„zbita szybka telefon” reaches the screen fault (synonym + stem)", () => {
    const all = provider.query("szybka telefon").flatMap((g) => g.results);
    expect(all.some((r) => /ekran|wyświetlacz|szybk/i.test(r.title))).toBe(true);
  });
  it("„Zakopane” finds the point (draft points excluded only when unpublished)", () => {
    const hrefs = provider.query("rabka").flatMap((g) => g.results.map((r) => r.href));
    expect(hrefs.length).toBeGreaterThan(0);
  });
  it("groups never exceed the window limit", () => {
    for (const g of provider.query("serwis")) expect(g.results.length).toBeLessThanOrEqual(GROUP_LIMIT);
    expect(provider.count("serwis")).toBeGreaterThan(GROUP_LIMIT);
  });
  it("nonsense finds nothing", () => {
    expect(provider.query("qwxzv")).toEqual([]);
    expect(provider.count("qwxzv")).toBe(0);
  });
});

describe("podświetlenie", () => {
  it("marks the hit in the visible title, with diacritics", () => {
    const marks = highlight("Wymiana wyświetlacza", "wyswietlacz");
    expect(marks.filter((m) => m.hit).map((m) => m.text)).toEqual(["wyświetlacz"]);
    expect(marks.map((m) => m.text).join("")).toBe("Wymiana wyświetlacza");
  });
  it("marks the stem of an inflected query", () => {
    expect(highlight("Serwis laptopów", "laptopa").filter((m) => m.hit).map((m) => m.text)).toEqual(["laptop"]);
  });
  it("no hit → one plain part", () => {
    expect(highlight("Kontakt", "zzz")).toEqual([{ text: "Kontakt", hit: false }]);
  });
});

describe("skróty klawiszowe", () => {
  const k = (key: string, o: Partial<{ ctrlKey: boolean; metaKey: boolean; altKey: boolean; typing: boolean }> = {}) =>
    isSearchShortcut({ key, ctrlKey: false, metaKey: false, altKey: false, typing: false, ...o });
  it("Ctrl/⌘ K anywhere, „/” outside fields", () => {
    expect(k("k", { ctrlKey: true })).toBe(true);
    expect(k("K", { metaKey: true, typing: true })).toBe(true);
    expect(k("/")).toBe(true);
    expect(k("/", { typing: true })).toBe(false);
    expect(k("k")).toBe(false);
    expect(k("k", { ctrlKey: true, altKey: true })).toBe(false);
  });
});

describe("ostatnie wyszukiwania", () => {
  const memory = () => {
    const data = new Map<string, string>();
    return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k) };
  };
  it("keeps the newest first, without duplicates, at most RECENT_MAX", () => {
    const s = memory();
    for (const q of ["ekran", "bateria", "Ekran", "x", "laptop", "konsola", "drukarka", "status"]) pushRecent(q, s);
    expect(readRecent(s)).toEqual(["status", "drukarka", "konsola", "laptop", "Ekran"]);
    expect(readRecent(s)).toHaveLength(RECENT_MAX);
    clearRecent(s);
    expect(readRecent(s)).toEqual([]);
  });
  it("survives blocked or broken storage", () => {
    const broken = {
      getItem: () => "{oops",
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => {
        throw new Error("no");
      },
    };
    expect(readRecent(broken)).toEqual([]);
    expect(pushRecent("ekran", broken)).toEqual(["ekran"]);
    expect(() => clearRecent(broken)).not.toThrow();
    expect(readRecent(null)).toEqual([]);
  });
});
