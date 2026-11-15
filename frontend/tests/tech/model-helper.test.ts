/** "Jak sprawdzić model" helper (feat/tech-formularz-premium): guides, first tab, proposal, faults. */
import { describe, expect, it } from "vitest";
import { DEVICE_CATEGORIES } from "@/types/repair";
import { buildSubmitPayload, emptyRepairForm } from "@/lib/tech/contract";
import { brandFamily, detectPlatform, helperGuides, modelProposal, pickHelperTab, HELPER_FALLBACK_HREF } from "@/lib/tech/model-helper";
import { faultSuggestions, hasFault, QUICK_FAULTS } from "@/lib/tech/repair-form";

const UA = {
  iphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  ipad: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  android: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
  windows: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
};

describe("detectPlatform", () => {
  it("reads iOS, Android, Mac and Windows from the user agent", () => {
    expect(detectPlatform(UA.iphone)).toBe("ios");
    expect(detectPlatform(UA.android)).toBe("android");
    expect(detectPlatform(UA.windows)).toBe("windows");
    expect(detectPlatform(UA.ipad, null, 0)).toBe("mac");
  });
  it("iPadOS pretends to be a Mac: touch points mean an iPad", () => {
    expect(detectPlatform(UA.ipad, null, 5)).toBe("ios");
  });
  it("prefers navigator.userAgentData.platform", () => {
    expect(detectPlatform(UA.windows, { platform: "Android", mobile: true })).toBe("android");
  });
});

describe("brandFamily", () => {
  it("recognises typed brands and model names", () => {
    expect(brandFamily("Apple")).toBe("apple");
    expect(brandFamily("iPhone 13")).toBe("apple");
    expect(brandFamily(" SAMSUNG ")).toBe("samsung");
    expect(brandFamily("Redmi Note 12")).toBe("xiaomi");
    expect(brandFamily("POCO")).toBe("xiaomi");
    expect(brandFamily("moto g54")).toBe("motorola");
    expect(brandFamily("realme")).toBe("oppo");
    expect(brandFamily("Honor")).toBe("huawei");
    expect(brandFamily("Lenovo")).toBe("pc");
    expect(brandFamily("")).toBeNull();
    expect(brandFamily("coś innego")).toBeNull();
  });
});

describe("helperGuides", () => {
  it("every category has guides for model and IMEI, each with text", () => {
    for (const c of [...DEVICE_CATEGORIES.map((d) => d.value), null]) {
      for (const field of ["model", "imei"] as const) {
        const g = helperGuides(field, c);
        expect(g.length, `${field}/${c}`).toBeGreaterThan(0);
        for (const guide of g) expect(guide.lines.length).toBeGreaterThan(0);
        expect(new Set(g.map((x) => x.id)).size).toBe(g.length);
      }
    }
  });
  it("phone: iPhone path and Android overlays of the main brands", () => {
    const [apple, android] = helperGuides("model", "phone");
    expect(apple.path).toEqual(["Ustawienia", "Ogólne", "To urządzenie"]);
    expect(android.variants?.map((v) => v.id)).toEqual(["general", "samsung", "xiaomi", "motorola", "oppo", "huawei"]);
    expect(android.variants?.find((v) => v.id === "samsung")?.path).toEqual(["Ustawienia", "Informacje o telefonie"]);
    expect(android.variants?.find((v) => v.id === "xiaomi")?.path).toEqual(["Ustawienia", "O telefonie"]);
  });
  it("tablet speaks about a tablet", () => {
    const android = helperGuides("model", "tablet").find((g) => g.id === "android");
    expect(android?.variants?.[1].path[1]).toBe("Informacje o tablecie");
  });
  it("IMEI of a phone starts with *#06#; no texts with prices, WhatsApp or parcel lockers", () => {
    expect(helperGuides("imei", "phone")[0].lines[0]).toContain("*#06#");
    const all = JSON.stringify([...DEVICE_CATEGORIES.map((d) => d.value), null].flatMap((c) => [...helperGuides("model", c), ...helperGuides("imei", c)]));
    expect(all).not.toMatch(/zł|whatsapp|paczkomat|cena/i);
  });
  it("fallback link goes to the prep guide anchor", () => {
    expect(HELPER_FALLBACK_HREF).toBe("/jak-przygotowac-sprzet#model");
  });
});

describe("pickHelperTab: brand > category > browsing system", () => {
  it("typed brand wins", () => {
    expect(pickHelperTab({ field: "model", category: "phone", brand: "Samsung", platform: "ios" })).toEqual({ tab: "android", variant: "samsung" });
    expect(pickHelperTab({ field: "model", category: "phone", brand: "Apple", platform: "android" })).toEqual({ tab: "apple", variant: null });
    expect(pickHelperTab({ field: "model", category: "phone", brand: "", model: "Redmi Note 12", platform: "other" })).toEqual({ tab: "android", variant: "xiaomi" });
    expect(pickHelperTab({ field: "model", category: "laptop", brand: "Apple", platform: "windows" }).tab).toBe("mac");
    expect(pickHelperTab({ field: "model", category: "smartwatch", brand: "Samsung", platform: "ios" }).tab).toBe("galaxy-watch");
  });
  it("a Lenovo phone is Android, a Lenovo laptop is Windows", () => {
    expect(pickHelperTab({ field: "model", category: "phone", brand: "Lenovo", platform: "other" }).tab).toBe("android");
    expect(pickHelperTab({ field: "model", category: "laptop", brand: "Lenovo", platform: "other" }).tab).toBe("windows");
  });
  it("without a brand: the system the visitor browses on", () => {
    expect(pickHelperTab({ field: "model", category: "phone", brand: "", platform: "ios" }).tab).toBe("apple");
    expect(pickHelperTab({ field: "model", category: "phone", brand: "", platform: "android" })).toEqual({ tab: "android", variant: "general" });
    expect(pickHelperTab({ field: "model", category: null, brand: "", platform: "android" }).tab).toBe("android");
    expect(pickHelperTab({ field: "model", category: "laptop", brand: "", platform: "mac" }).tab).toBe("mac");
    expect(pickHelperTab({ field: "model", category: "laptop", brand: "", platform: "windows" }).tab).toBe("windows");
    expect(pickHelperTab({ field: "model", category: "smartwatch", brand: "", platform: "ios" }).tab).toBe("apple-watch");
  });
  it("otherwise the category default", () => {
    expect(pickHelperTab({ field: "model", category: "laptop", brand: "", platform: "other" }).tab).toBe("label");
    expect(pickHelperTab({ field: "model", category: "console", brand: "Sony", platform: "ios" }).tab).toBe("console");
    expect(pickHelperTab({ field: "model", category: "printer", brand: "", platform: "android" }).tab).toBe("printer");
  });
  it("IMEI of a phone: *#06# first, whatever the brand", () => {
    expect(pickHelperTab({ field: "imei", category: "phone", brand: "Apple", platform: "ios" }).tab).toBe("dialer");
    expect(pickHelperTab({ field: "imei", category: "tablet", brand: "Apple", platform: "android" }).tab).toBe("apple");
  });
});

describe("modelProposal (UA Client Hints, only as a suggestion)", () => {
  const ctx = { category: "phone" as const, platform: "android" as const, current: "" };
  it("offers a real model on Android for a phone, tablet or unchosen category", () => {
    expect(modelProposal("SM-S911B", ctx)).toBe("SM-S911B");
    expect(modelProposal("  Pixel  7 ", { ...ctx, category: null })).toBe("Pixel 7");
    expect(modelProposal("SM-X200", { ...ctx, category: "tablet" })).toBe("SM-X200");
  });
  it("never on iOS / desktop, for other devices, frozen or empty values, or when already typed", () => {
    expect(modelProposal("SM-S911B", { ...ctx, platform: "ios" })).toBeNull();
    expect(modelProposal("SM-S911B", { ...ctx, platform: "windows" })).toBeNull();
    expect(modelProposal("SM-S911B", { ...ctx, category: "laptop" })).toBeNull();
    expect(modelProposal("K", ctx)).toBeNull();
    expect(modelProposal("", ctx)).toBeNull();
    expect(modelProposal(null, ctx)).toBeNull();
    expect(modelProposal("SM-S911B", { ...ctx, current: "sm-s911b" })).toBeNull();
  });
});

describe("fault suggestions under the description", () => {
  it("use the wizard faults of the chosen device, in lower case", () => {
    expect(faultSuggestions("phone")).toContain("pęknięty ekran");
    expect(faultSuggestions("console")).toContain("dryf w padzie");
    expect(faultSuggestions("other")).not.toContain("inny problem");
    expect(faultSuggestions(null)).toEqual([...QUICK_FAULTS]);
  });
  it("hasFault ignores case (also for abbreviations like HDMI)", () => {
    expect(hasFault("Brak obrazu (HDMI), głośna", "brak obrazu (HDMI)")).toBe(true);
    expect(hasFault("Pęknięty ekran", "pęknięty ekran")).toBe(true);
    expect(hasFault("", "bateria")).toBe(false);
  });
});

describe("request shape unchanged (KONTRAKT §1–§2)", () => {
  it("buildSubmitPayload has the same top-level and device keys as before", () => {
    const p = buildSubmitPayload({ ...emptyRepairForm(), category: "phone", brand: "Samsung", model: "Galaxy S23", problem: "Ekran", dropoff: "rabka" }) as unknown as Record<string, Record<string, unknown>>;
    expect(Object.keys(p).sort()).toMatchSnapshot();
    expect(Object.keys(p.device).sort()).toMatchSnapshot();
  });
});
