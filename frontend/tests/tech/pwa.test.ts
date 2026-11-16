/**
 * TD5 PR 3: PWA manifest and service worker rules (SPEC §12.2), courier page gating
 * (SPEC §12.10), preparation guide data (SPEC §12.3).
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { courierService, servicePoints } from "@/config/prokom";
import sitemap from "@/app/sitemap";
import { courierDestination, courierPoints, courierWhereText } from "@/lib/tech/courier";
import { courierInSitemap, courierPageVisible, courierPaymentText, courierPayRows } from "@/lib/tech/courier-page";
import { footerColumns } from "@/lib/tech/nav";
import { PREP_TABS, tabForCategory } from "@/lib/tech/prep-guide";
import { SW_EXCLUDED_PREFIXES, webManifest } from "@/lib/tech/pwa";

const FRONTEND = path.resolve(__dirname, "../..");
const read = (rel: string) => fs.readFileSync(path.join(FRONTEND, rel), "utf8");

describe("PWA — manifest", () => {
  const m = webManifest();
  it("name, start_url with src=pwa, standalone, scope /", () => {
    expect(m.name).toBe("PRO-KOM Tech");
    expect(m.start_url).toBe("/?src=pwa");
    expect(m.scope).toBe("/");
    expect(m.display).toBe("standalone");
  });
  it("icons 192, 512 and maskable exist in public/", () => {
    expect(m.icons.map((i) => `${i.sizes}:${i.purpose}`)).toEqual(["192x192:any", "512x512:any", "512x512:maskable"]);
    for (const i of m.icons) expect(fs.existsSync(path.join(FRONTEND, "public", i.src))).toBe(true);
    expect(fs.existsSync(path.join(FRONTEND, "public/tech/pwa/apple-touch-icon.png"))).toBe(true);
    for (const f of ["favicon.svg", "favicon.ico"]) expect(fs.existsSync(path.join(FRONTEND, "public/tech/pwa", f)), f).toBe(true);
  });
  it("shortcuts: Zgłoś naprawę, Status naprawy, Punkty", () => {
    expect(m.shortcuts.map((s) => [s.name, s.url.split("?")[0]])).toEqual([
      ["Zgłoś naprawę", "/zgloszenie"],
      ["Status naprawy", "/track"],
      ["Punkty", "/punkty-serwisowe"],
    ]);
  });
  it("manifest is linked only from the public layout (never the root layout)", () => {
    expect(read("app/(public)/layout.tsx")).toMatch(/manifest: MANIFEST_PATH/);
    expect(read("app/layout.tsx")).not.toMatch(/manifest/i);
    expect(fs.existsSync(path.join(FRONTEND, "app/manifest.ts"))).toBe(false);
  });
});

describe("PWA — service worker (static rules)", () => {
  const sw = read("public/sw.js");
  it("excludes /api, /panel, /admin-panel, /client and /_next", () => {
    for (const p of ["/api", "/panel", "/admin-panel", "/client", "/_next"]) {
      expect(sw).toContain(`"${p}"`);
      expect(SW_EXCLUDED_PREFIXES).toContain(p);
    }
  });
  it("handles navigations only, stores only the offline page", () => {
    expect(sw).toMatch(/req\.mode !== "navigate"/);
    expect(sw.match(/cache\.put\(/g)?.length).toBe(1);
    expect(sw).toMatch(/cache\.put\(OFFLINE_URL/);
    expect(sw).not.toMatch(/cache\.add|addAll/);
  });
  it("registered only from the public layout", () => {
    expect(read("app/(public)/layout.tsx")).toMatch(/<SwRegister \/>/);
    expect(read("app/layout.tsx")).not.toMatch(/serviceWorker|SwRegister/);
  });
});

describe("naprawa kurierem — publikacja (SPEC §12.10)", () => {
  it("published:false → not in production, visible only on staging, never in sitemap", () => {
    const off = { ...courierService, published: false };
    expect(courierPageVisible(off, false)).toBe(false);
    expect(courierPageVisible(off, true)).toBe(true);
    expect(courierInSitemap(off)).toBe(false);
    expect(courierInSitemap({ ...off, published: true })).toBe(true);
  });
  it("current config (published 15.11): page in production, sitemap and footer", () => {
    expect(courierService.published).toBe(true);
    expect(courierPageVisible(courierService, false)).toBe(true);
    const urls = sitemap().map((u) => u.url);
    expect(urls.some((u) => u.endsWith("/naprawa-kurierem"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/jak-przygotowac-sprzet"))).toBe(true);
    const footer = footerColumns.flatMap((c) => c.items.map((i) => i.href));
    expect(footer).toContain("/naprawa-kurierem");
    expect(footer).toContain("/jak-przygotowac-sprzet");
  });
  it("boss's answers (15.11): client pays inbound, service pays return and return after declining, transfer, whole country", () => {
    expect(courierPayRows().map((r) => `${r.k}: ${r.v}`)).toEqual([
      "Wysyłka do serwisu: Ty",
      "Odesłanie po naprawie: serwis",
      "Odesłanie po rezygnacji z naprawy: serwis",
    ]);
    expect(courierService.area).toBe("polska");
    expect(courierPaymentText()).toBe(
      "Za naprawę płacisz przelewem — po diagnozie urządzenia i dopiero wtedy, gdy zaakceptujesz naprawę. Nie wysyłamy za pobraniem.",
    );
    expect(courierPaymentText({ ...courierService, payment: null })).toBeNull();
    expect(courierPaymentText({ ...courierService, payment: ["gotówka przy odbiorze"] })).toBe("Płatność za naprawę: gotówka przy odbiorze. Nie wysyłamy za pobraniem.");
  });
  it("null fields hide their rows", () => {
    expect(courierPayRows({ ...courierService, inboundPaidBy: "client", returnPaidBy: null, returnIfDeclined: null }).map((r) => r.k)).toEqual(["Wysyłka do serwisu"]);
  });
  it("parcels go only to published points listed in parcelPoints", () => {
    const both = servicePoints.map((p) => ({ ...p, published: true }));
    const all = { ...courierService, parcelPoints: ["rabka", "zakopane"] as typeof courierService.parcelPoints };
    expect(courierPoints(both, all).map((p) => p.key)).toEqual(["rabka", "zakopane"]);
    expect(courierWhereText(courierPoints(both, all))).toBe("Wyślij sprzęt na adres jednego z naszych salonów: Rabka-Zdrój lub Zakopane.");
    const draft = servicePoints.map((p) => (p.key === "zakopane" ? { ...p, published: false } : p));
    expect(courierPoints(draft, all).map((p) => p.key)).toEqual(["rabka"]);
    const rabkaDraft = servicePoints.map((p) => (p.key === "rabka" ? { ...p, published: false } : { ...p, published: true }));
    expect(courierPoints(rabkaDraft)).toEqual([]);
    expect(courierWhereText([])).toBeNull();
  });
  it("parcels go to the Rabka salon only — no courier to Zakopane (16.11)", () => {
    expect(courierService.parcelPoints).toEqual(["rabka"]);
    const both = servicePoints.map((p) => ({ ...p, published: true }));
    expect(courierPoints(both).map((p) => p.key)).toEqual(["rabka"]);
    expect(courierPoints().map((p) => p.key)).toEqual(["rabka"]);
    expect(courierDestination()).toBe("na adres salonu w Rabce-Zdroju");
    expect(courierWhereText()).toBe("Wyślij sprzęt na adres salonu w Rabce-Zdroju.");
  });
});

describe("poradnik — jak przygotować sprzęt (SPEC §12.3)", () => {
  it("4 tabs, every step has a 'why'", () => {
    expect(PREP_TABS.map((t) => t.label)).toEqual(["Telefon / Tablet", "Laptop / Komputer", "Konsola", "Smartwatch"]);
    for (const t of PREP_TABS) for (const s of t.steps) expect(s.why.length).toBeGreaterThan(20);
  });
  it("categories map to tabs", () => {
    expect(tabForCategory("laptop").id).toBe("laptop");
    expect(tabForCategory("smartwatch").id).toBe("smartwatch");
    expect(tabForCategory(null).id).toBe("telefon");
  });
  it("no prices or time promises", () => {
    expect(JSON.stringify(PREP_TABS)).not.toMatch(/\d\s*zł|minut|godzin|tego samego dnia/i);
  });
});
