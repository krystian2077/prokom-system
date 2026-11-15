/**
 * "Jak sprawdzić model" helper of the repair form (/zgloszenie, step 1).
 *
 * Pure data + decisions, no DOM: which guides fit the chosen category and field
 * (model or IMEI / serial number), which tab opens first (typed brand > category >
 * the system the visitor browses on), and whether a model read from the browser
 * (UA Client Hints, Chromium on Android) may be offered as a one-click proposal.
 * The proposal is only shown to the visitor; it is never sent or stored.
 * Texts: short, second person, no prices, no brand logos in the illustrations.
 */
import type { DeviceCategory } from "./contract";

export type HelperField = "model" | "imei";
export type Platform = "ios" | "android" | "mac" | "windows" | "other";

/** Illustration of a guide (components/tech/zgloszenie/HelperArt.tsx). */
export type HelperArt =
  | { kind: "screens"; frame: "phone" | "watch" | "desktop" | "tv" }
  | { kind: "dialer" }
  | { kind: "sticker"; on: "laptop" | "desktop" | "printer" | "console" | "watch" | "box" | "drive" | "generic" };

export type HelperVariant = { id: string; label: string; path: string[]; note?: string };

export type HelperGuide = {
  /** Tab id (stable: tests, analytics-free). */
  id: string;
  /** Tab label. */
  tab: string;
  /** Screen path, rendered as "A › B › C" and drawn as mini screens. */
  path?: string[];
  /** Short sentences in the second person. */
  lines: string[];
  art: HelperArt;
  /** Android: overlays of the main brands (path differs per brand). */
  variants?: HelperVariant[];
};

/** Anchor of the static version on the prep guide page (works without JS). */
export const HELPER_FALLBACK_HREF = "/jak-przygotowac-sprzet#model";

export const HELPER_TITLE: Record<HelperField, string> = {
  model: "Jak sprawdzić model",
  imei: "Gdzie znaleźć IMEI albo numer seryjny",
};
export const HELPER_TRIGGER: Record<HelperField, string> = {
  model: "Jak sprawdzić model?",
  imei: "Gdzie go znaleźć?",
};

/* ---------- Guides ---------- */

const noun = (category: DeviceCategory | null) => (category === "tablet" ? "tablecie" : "telefonie");

function androidVariants(category: DeviceCategory | null, field: HelperField): HelperVariant[] {
  const n = noun(category);
  const last = field === "imei" ? "IMEI" : "Model";
  return [
    { id: "general", label: "Ogólnie", path: ["Ustawienia", `Informacje o ${n}`, last], note: `Czasem ta pozycja nazywa się „O ${n}” albo jest na dole, w „System”.` },
    { id: "samsung", label: "Samsung", path: ["Ustawienia", `Informacje o ${n}`], note: field === "imei" ? "IMEI jest od razu na tej stronie." : "Zobaczysz nazwę, np. Galaxy S23, i numer modelu, np. SM-S911B." },
    { id: "xiaomi", label: "Xiaomi, Redmi, POCO", path: ["Ustawienia", `O ${n}`], note: field === "imei" ? "IMEI jest w szczegółach, czasem w „Stan”." : "Model jest na górze albo w szczegółach i danych technicznych." },
    { id: "motorola", label: "Motorola", path: ["Ustawienia", `Informacje o ${n}`] },
    { id: "oppo", label: "realme, OPPO", path: ["Ustawienia", "Informacje o urządzeniu"] },
    { id: "huawei", label: "Huawei, Honor", path: ["Ustawienia", `Informacje o ${n}`] },
  ];
}

const APPLE_MOBILE_MODEL: HelperGuide = {
  id: "apple",
  tab: "iPhone i iPad",
  path: ["Ustawienia", "Ogólne", "To urządzenie"],
  lines: ["Nazwa modelu jest na górze, np. iPhone 13.", "Stuknij „Numer modelu”, a zobaczysz numer zaczynający się od A, np. A2633. Wpisz jedno albo drugie."],
  art: { kind: "screens", frame: "phone" },
};

function modelGuides(category: DeviceCategory | null): HelperGuide[] {
  const android = (): HelperGuide => ({
    id: "android",
    tab: "Android",
    lines: ["Szukaj pozycji „Model” albo „Nazwa modelu”. Wybierz swoją markę, jeśli ścieżka wygląda inaczej."],
    art: { kind: "screens", frame: "phone" },
    variants: androidVariants(category, "model"),
  });
  const generic: HelperGuide = {
    id: "label",
    tab: "Naklejka",
    lines: ["Model jest zwykle na naklejce: na spodzie, z tyłu albo pod klapką baterii.", "Nie możesz znaleźć? Wpisz nazwę z pudełka albo z dowodu zakupu."],
    art: { kind: "sticker", on: "generic" },
  };
  switch (category) {
    case "phone":
    case "tablet":
      return [APPLE_MOBILE_MODEL, android()];
    case "smartwatch":
      return [
        {
          id: "apple-watch",
          tab: "Apple Watch",
          path: ["Watch na iPhonie", "Ogólne", "To urządzenie"],
          lines: ["Model jest w pozycji „Model”. Stuknij ją, żeby zobaczyć numer zaczynający się od A.", "Na samym zegarku: Ustawienia › Ogólne › To urządzenie."],
          art: { kind: "screens", frame: "phone" },
        },
        {
          id: "galaxy-watch",
          tab: "Galaxy Watch",
          path: ["Galaxy Wearable", "Ustawienia zegarka", "Informacje o zegarku"],
          lines: ["Aplikację Galaxy Wearable otwierasz na telefonie, z którym zegarek jest połączony."],
          art: { kind: "screens", frame: "phone" },
        },
        {
          id: "watch-other",
          tab: "Inny zegarek",
          lines: ["Otwórz aplikację zegarka na telefonie i wejdź w informacje o urządzeniu.", "Model bywa też wygrawerowany na spodzie koperty."],
          art: { kind: "sticker", on: "watch" },
        },
      ];
    case "laptop":
    case "desktop":
      return [
        {
          id: "label",
          tab: "Naklejka",
          lines:
            category === "laptop"
              ? ["Odwróć laptopa: model jest na naklejce na spodzie, np. przy słowie „Model” albo „P/N”."]
              : ["Naklejka z modelem jest zwykle z boku albo z tyłu obudowy.", "Komputer składany? Wpisz krótko, co to za zestaw, np. „składak, Ryzen 5, RTX 3060”."],
          art: { kind: "sticker", on: category === "laptop" ? "laptop" : "desktop" },
        },
        {
          id: "windows",
          tab: "Windows",
          path: ["Ustawienia", "System", "Informacje"],
          lines: ["Producent i model są na górze tej strony."],
          art: { kind: "screens", frame: "desktop" },
        },
        {
          id: "mac",
          tab: "Mac",
          path: ["Menu Apple", "Ten Mac"],
          lines: ["Menu Apple otwierasz logo w lewym górnym rogu ekranu. Zobaczysz nazwę, np. MacBook Air (M1, 2020)."],
          art: { kind: "screens", frame: "desktop" },
        },
      ];
    case "console":
      return [
        {
          id: "console",
          tab: "Konsola",
          path: ["Ustawienia", "System", "Informacje o konsoli"],
          lines: ["Naklejka z modelem jest z tyłu albo pod spodem konsoli.", "Konsola się włącza? Model zobaczysz też w menu (w PlayStation w „Oprogramowanie systemowe”).", "Naprawa pada? Wpisz nazwę konsoli i „pad”."],
          art: { kind: "sticker", on: "console" },
        },
      ];
    case "printer":
      return [
        {
          id: "printer",
          tab: "Drukarka",
          lines: ["Nazwa modelu jest zwykle na przodzie obudowy, przy panelu.", "Pełny model jest na naklejce z tyłu albo pod klapą (pokrywą skanera albo tuszów)."],
          art: { kind: "sticker", on: "printer" },
        },
      ];
    case "data_recovery":
      return [
        {
          id: "drive",
          tab: "Dysk, pendrive, karta",
          lines: ["Model i pojemność są na naklejce dysku albo na obudowie pendrive’a lub karty, np. WD Blue 1 TB.", "Dane są w telefonie? Wpisz model telefonu."],
          art: { kind: "sticker", on: "drive" },
        },
        APPLE_MOBILE_MODEL,
        android(),
      ];
    case "other":
      return [generic, APPLE_MOBILE_MODEL, android()];
    default:
      return [APPLE_MOBILE_MODEL, android(), { ...generic, tab: "Inne urządzenie" }];
  }
}

function imeiGuides(category: DeviceCategory | null): HelperGuide[] {
  const dialer: HelperGuide = {
    id: "dialer",
    tab: "Kod *#06#",
    lines: ["Otwórz aplikację Telefon i wpisz *#06#. IMEI pojawi się od razu, bez dzwonienia.", "Dwie karty SIM? Wpisz pierwszy numer."],
    art: { kind: "dialer" },
  };
  const apple: HelperGuide = {
    id: "apple",
    tab: "iPhone i iPad",
    path: ["Ustawienia", "Ogólne", "To urządzenie"],
    lines: ["Przewiń w dół do pozycji „IMEI”. iPad bez karty SIM ma tylko „Numer seryjny”: wpisz go."],
    art: { kind: "screens", frame: "phone" },
  };
  const android: HelperGuide = {
    id: "android",
    tab: "Android",
    lines: ["Szukaj pozycji „IMEI”, czasem w „Stan” albo „Status”."],
    art: { kind: "screens", frame: "phone" },
    variants: androidVariants(category, "imei"),
  };
  const box: HelperGuide = {
    id: "box",
    tab: "Pudełko",
    lines: ["IMEI jest na naklejce na pudełku, obok kodu kreskowego.", "Pole jest opcjonalne: możesz je zostawić puste."],
    art: { kind: "sticker", on: "box" },
  };
  const serialLabel = (on: "laptop" | "desktop" | "printer" | "console" | "drive" | "generic", where: string): HelperGuide => ({
    id: "label",
    tab: "Naklejka",
    lines: [`Numer seryjny (S/N) jest na naklejce ${where}.`, "Pole jest opcjonalne: możesz je zostawić puste."],
    art: { kind: "sticker", on },
  });
  switch (category) {
    case "phone":
      return [dialer, apple, android, box];
    case "tablet":
      return [apple, android, box];
    case "smartwatch":
      return [
        { id: "apple-watch", tab: "Apple Watch", path: ["Watch na iPhonie", "Ogólne", "To urządzenie"], lines: ["Numer seryjny jest w pozycji „Numer seryjny”."], art: { kind: "screens", frame: "phone" } },
        { id: "galaxy-watch", tab: "Galaxy Watch", path: ["Galaxy Wearable", "Ustawienia zegarka", "Informacje o zegarku"], lines: ["Numer seryjny jest na tej stronie, czasem w „Stan”."], art: { kind: "screens", frame: "phone" } },
        { id: "watch-other", tab: "Inny zegarek", lines: ["Numer seryjny jest zwykle na spodzie koperty albo w aplikacji zegarka na telefonie."], art: { kind: "sticker", on: "watch" } },
      ];
    case "laptop":
    case "desktop":
      return [
        serialLabel(category === "laptop" ? "laptop" : "desktop", category === "laptop" ? "na spodzie laptopa" : "z boku albo z tyłu obudowy"),
        { id: "mac", tab: "Mac", path: ["Menu Apple", "Ten Mac"], lines: ["Numer seryjny jest w tym samym oknie co nazwa modelu."], art: { kind: "screens", frame: "desktop" } },
      ];
    case "console":
      return [{ ...serialLabel("console", "z tyłu albo pod spodem konsoli"), id: "console", tab: "Konsola", path: ["Ustawienia", "System", "Informacje o konsoli"] }];
    case "printer":
      return [{ ...serialLabel("printer", "z tyłu drukarki albo pod klapą"), id: "printer", tab: "Drukarka" }];
    case "data_recovery":
      return [serialLabel("drive", "dysku, pendrive’a albo na opakowaniu karty"), dialer];
    case "other":
      return [serialLabel("generic", "na spodzie albo z tyłu urządzenia"), dialer];
    default:
      return [dialer, apple, android, box];
  }
}

export function helperGuides(field: HelperField, category: DeviceCategory | null): HelperGuide[] {
  return field === "imei" ? imeiGuides(category) : modelGuides(category);
}

/* ---------- Picking the first tab ---------- */

export type BrandFamily = "apple" | "samsung" | "xiaomi" | "motorola" | "oppo" | "huawei" | "android" | "pc";

const BRAND_RULES: [RegExp, BrandFamily][] = [
  [/\b(apple|iphone|ipad|mac|macbook|imac|airpods)\b/, "apple"],
  [/\b(samsung|galaxy)\b/, "samsung"],
  [/\b(xiaomi|redmi|poco|mi)\b/, "xiaomi"],
  [/\b(motorola|moto)\b/, "motorola"],
  [/\b(realme|oppo|oneplus)\b/, "oppo"],
  [/\b(huawei|honor)\b/, "huawei"],
  [/\b(google|pixel|nokia|sony xperia|xperia|vivo|zte|nothing|tcl|alcatel)\b/, "android"],
  [/\b(lenovo|hp|dell|asus|acer|msi|toshiba|fujitsu|microsoft|surface|gigabyte)\b/, "pc"],
];

/** Brand family from what the client typed in "Marka" (or "Model", e.g. "iPhone 13"). */
export function brandFamily(text: string): BrandFamily | null {
  const t = text.toLocaleLowerCase("pl").normalize("NFKD").replace(/[̀-ͯ]/g, "");
  if (!t.trim()) return null;
  for (const [re, fam] of BRAND_RULES) if (re.test(t)) return fam;
  return null;
}

/** Minimal shape of navigator.userAgentData we read (Chromium only). */
export type UaData = { platform?: string; mobile?: boolean } | null | undefined;

/**
 * The system the visitor browses on. iPadOS 13+ pretends to be a Mac: a "Macintosh"
 * user agent with touch points means an iPad.
 */
export function detectPlatform(ua: string, uaData?: UaData, maxTouchPoints = 0): Platform {
  const p = (uaData?.platform ?? "").toLowerCase();
  if (p === "android") return "android";
  if (p === "ios") return "ios";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  if (/macintosh|mac os x/i.test(ua)) return maxTouchPoints > 1 ? "ios" : "mac";
  if (p === "macos") return "mac";
  if (p === "windows" || /windows nt/i.test(ua)) return "windows";
  return "other";
}

const FAMILY_TABS: Record<BrandFamily, string[]> = {
  apple: ["apple", "apple-watch", "mac"],
  samsung: ["android", "galaxy-watch"],
  xiaomi: ["android", "watch-other"],
  motorola: ["android", "watch-other"],
  oppo: ["android", "watch-other"],
  huawei: ["android", "watch-other"],
  android: ["android", "watch-other"],
  pc: ["windows", "label", "android"],
};
const PLATFORM_TABS: Record<Platform, string[]> = {
  ios: ["apple", "apple-watch"],
  android: ["android"],
  mac: ["mac"],
  windows: ["windows"],
  other: [],
};

export type HelperContext = { field: HelperField; category: DeviceCategory | null; brand: string; model?: string; platform: Platform };

/** First tab (and Android brand) to show: typed brand > category default > browsing system. */
export function pickHelperTab(ctx: HelperContext): { tab: string; variant: string | null } {
  const guides = helperGuides(ctx.field, ctx.category);
  const ids = guides.map((g) => g.id);
  const fam = brandFamily(ctx.brand) ?? brandFamily(ctx.model ?? "");
  const first = (cands: string[]) => cands.find((c) => ids.includes(c));
  let tab: string | undefined;
  // *#06# works on every phone, so it stays first for the IMEI of a phone.
  if (ctx.field === "imei" && ctx.category === "phone") tab = "dialer";
  if (!tab && fam) tab = first(FAMILY_TABS[fam]);
  // No brand tab here: the system the visitor browses on (often the very device).
  if (!tab) tab = first(PLATFORM_TABS[ctx.platform]);
  tab = tab ?? ids[0];
  const guide = guides.find((g) => g.id === tab);
  let variant: string | null = null;
  if (guide?.variants) {
    const byFam = fam && guide.variants.some((v) => v.id === fam) ? fam : null;
    variant = byFam ?? guide.variants[0].id;
  }
  return { tab, variant };
}

/* ---------- Proposal from the browser (UA Client Hints) ---------- */

/** Categories where "this device" can be the one being reported. */
const SELF_CATEGORIES = new Set<DeviceCategory | null>(["phone", "tablet", null]);

/**
 * A model read by `navigator.userAgentData.getHighEntropyValues(['model'])` that may be
 * offered as "Zgłaszasz to urządzenie? Wpisz: …". Only on Android, only for a phone,
 * tablet or not-yet-chosen category, never when the field already holds that value.
 */
export function modelProposal(raw: string | null | undefined, ctx: { category: DeviceCategory | null; platform: Platform; current: string }): string | null {
  if (ctx.platform !== "android" || !SELF_CATEGORIES.has(ctx.category)) return null;
  const m = (raw ?? "").replace(/\s+/g, " ").trim();
  // "K" = the frozen value of the reduced user agent; very short/long values are noise.
  if (m.length < 2 || m.length > 40 || m === "K" || !/[a-z0-9]/i.test(m)) return null;
  if (ctx.current.trim().toLocaleLowerCase("pl") === m.toLocaleLowerCase("pl")) return null;
  return m;
}

/** Reads the model hint in the browser; null anywhere it is not available (iOS, Firefox, desktop). */
export async function readDeviceModel(): Promise<string | null> {
  if (typeof navigator === "undefined") return null;
  const nav = navigator as Navigator & { userAgentData?: { getHighEntropyValues?: (h: string[]) => Promise<{ model?: string }> } };
  const get = nav.userAgentData?.getHighEntropyValues;
  if (typeof get !== "function") return null;
  try {
    const v = await get.call(nav.userAgentData, ["model"]);
    return typeof v?.model === "string" ? v.model : null;
  } catch {
    return null;
  }
}

/** Platform of the current browser (client only; "other" on the server). */
export function currentPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const nav = navigator as Navigator & { userAgentData?: UaData };
  return detectPlatform(navigator.userAgent ?? "", nav.userAgentData, navigator.maxTouchPoints ?? 0);
}
