/**
 * Data for the "Co się zepsuło?" wizard (design T.Main `DV`, SPEC §7, KONTRAKT §1.1/§1.4,
 * docs/tech/PREMIUM.md §4).
 *
 * Photo hotspots and effect regions are stored in % of the crop box (`crop`), so the
 * photo scales freely: the crop box is the visible frame, the image is positioned inside
 * it. They are written below in image px (like the prototype) and converted once.
 * Every fault of every device has a scene: effect family (E1–E17), region, and either a
 * spot on the photo (local fault) or "whole" (the whole device / screen).
 * Delivery: service points (published, or drafts on staging) + courier. No parcel locker
 * (KONTRAKT §1.1, decision 14.11).
 */
import type { PointKey } from "@/config/prokom";

/** Backend category codes (KONTRAKT §1.1 = types/repair.ts DEVICE_CATEGORIES). */
export type CategoryCode =
  | "phone"
  | "tablet"
  | "smartwatch"
  | "laptop"
  | "desktop"
  | "printer"
  | "console"
  | "data_recovery"
  | "other";

export type WizardIcon = "phone" | "tablet" | "watch" | "laptop" | "pc" | "printer" | "console" | "data" | "other";

/** Effect families (PREMIUM §4). */
export const EFFECT_FAMILIES = {
  E1: "Pęknięcie",
  E2: "Bateria",
  E3: "Ładowanie",
  E4: "Optyka",
  E5: "Dźwięk",
  E6: "Przyciski i obudowa",
  E7: "Zalanie",
  E8: "Zasilanie",
  E9: "Obraz",
  E10: "Temperatura",
  E11: "Wydajność",
  E12: "Klawiatura",
  E13: "Dane",
  E14: "System i błędy",
  E15: "Druk i papier",
  E16: "Łączność i porty",
  E17: "Sterowanie",
} as const;
export type EffectFamily = keyof typeof EFFECT_FAMILIES;

/** [x, y, w, h] in % of the crop box. */
export type Box = [number, number, number, number];

export type FaultScene = {
  effect: EffectFamily;
  /** Family variant (e.g. E15 "jam" | "streaks" | "blank" | "ink"). */
  variant?: string;
  /** Where the effect is drawn (and masked), % of the frame. */
  region: Box;
  /** Corner radius of the region mask, % of the region's shorter side. */
  radius: number;
  /** Local fault: hotspot on the photo, % of the frame. Null = whole device / screen. */
  spot: [number, number] | null;
  /** Camera target for the zoom (local faults), % of the frame. */
  focus: [number, number] | null;
  /** Optional mask polygon for non-rectangular parts (a laptop lid seen at an angle),
   * as a CSS `polygon()` in % of the region. */
  clip?: string;
};

/** Vector illustration of a device (components/tech/wizard/art). */
export type ArtKind = "phone" | "tablet" | "watch" | "laptop" | "pc" | "printer" | "console" | "data" | "other";

export type WizardPhoto = {
  /** Photo (WebP) — or `art` for an illustration drawn in the scene style. */
  src?: string;
  art?: ArtKind;
  width: number;
  height: number;
  /** Crop box in image px: [x, y, w, h]. */
  crop: [number, number, number, number];
  /** [fault, x%, y%] relative to the crop box (local faults only, derived from scenes). */
  spots: [string, number, number][];
};

export type WizardDevice = {
  id: string;
  label: string;
  category: CategoryCode;
  icon: WizardIcon;
  faults: string[];
  photo: WizardPhoto | null;
  scenes: Record<string, FaultScene>;
};

/**
 * Largest box the photo frame may take (px), per layout — single source for the CSS
 * (Scene sets them as custom properties) and for the collision test.
 * desktop: the stage beside the choices at 1180+; phone: the full-screen flow (390).
 */
export const FRAME_BOX = { desktop: [380, 310], tablet: [300, 290], phone: [300, 320] } as const;
/** Minimum distance between hotspot centres (px): 48 on desktop (1440), 44 on phones (390). */
export const SPOT_GAP = { desktop: 48, phone: 44 } as const;
/** Camera zoom on a local fault (mirrors `.t-scene.is-zoom .t-scene__cam` in tech-wizard.css). */
export const SCENE_ZOOM = 1.12;

/** Frame size in px for a crop aspect inside a box. */
export function frameSize(crop: [number, number, number, number], box: readonly [number, number]): [number, number] {
  const ar = crop[2] / crop[3];
  const w = Math.min(box[0], box[1] * ar);
  return [w, w / ar];
}

export type Px4 = [number, number, number, number];
type SceneDef = { e: EffectFamily; v?: string; r: Px4; s?: [number, number]; radius?: number; clip?: [number, number][] };

const r1 = (n: number) => Math.round(n * 10) / 10;

function pctPoint(crop: Px4, [x, y]: [number, number]): [number, number] {
  const [cx, cy, cw, ch] = crop;
  return [r1(((x - cx) / cw) * 100), r1(((y - cy) / ch) * 100)];
}
function pctBox(crop: Px4, [x, y, w, h]: Px4): Box {
  const [cx, cy, cw, ch] = crop;
  const x0 = Math.max(0, ((x - cx) / cw) * 100);
  const y0 = Math.max(0, ((y - cy) / ch) * 100);
  const x1 = Math.min(100, ((x + w - cx) / cw) * 100);
  const y1 = Math.min(100, ((y + h - cy) / ch) * 100);
  return [r1(x0), r1(y0), r1(x1 - x0), r1(y1 - y0)];
}

/** Image-px scene definitions → % scenes + derived photo spots. */
export function buildScenes(crop: Px4, faults: string[], defs: Record<string, SceneDef>) {
  const scenes: Record<string, FaultScene> = {};
  for (const f of faults) {
    const d = defs[f];
    if (!d) throw new Error(`wizard-data: no scene for "${f}"`);
    const spot = d.s ? pctPoint(crop, d.s) : null;
    const [rx, ry, rw, rh] = d.r;
    const clip = d.clip ? `polygon(${d.clip.map(([x, y]) => `${r1(((x - rx) / rw) * 100)}% ${r1(((y - ry) / rh) * 100)}%`).join(", ")})` : undefined;
    scenes[f] = { effect: d.e, variant: d.v, region: pctBox(crop, d.r), radius: d.radius ?? 8, spot, focus: spot, ...(clip ? { clip } : {}) };
  }
  const spots = faults.filter((f) => scenes[f].spot).map((f) => [f, ...scenes[f].spot!] as [string, number, number]);
  return { scenes, spots };
}

export const MOBILE = ["Pęknięty ekran", "Bateria", "Nie ładuje", "Aparat", "Głośnik lub mikrofon", "Przyciski i obudowa", "Po zalaniu", "Nie włącza się"];

// Direction B (feat/tech-kreator-wow): every device is a vector illustration
// (components/tech/wizard/art/*). Crops, spots and regions are in each illustration's
// viewBox units — exact, sharp at any size, the same in both themes.
const build = buildScenes;
const PHONE_CROP: Px4 = [32, 36, 418, 464];
const TABLET_CROP: Px4 = [16, 12, 412, 574];
const WATCH_CROP: Px4 = [88, 0, 236, 480];
const LAPTOP_CROP: Px4 = [14, 14, 572, 364];
const PC_CROP: Px4 = [40, 16, 290, 560];
const PRINTER_CROP: Px4 = [36, 30, 528, 318];
const CONSOLE_CROP: Px4 = [86, 24, 514, 524];
const DATA_CROP: Px4 = [34, 32, 430, 320];
const OTHER_CROP: Px4 = [46, 44, 398, 336];

const WATCH_FAULTS = ["Pęknięte szkło", "Bateria", "Nie ładuje", "Przyciski i obudowa", "Po zalaniu", "Nie włącza się"];
export const LAPTOP_FAULTS = ["Matryca", "Klawiatura", "Bateria", "Nie ładuje", "Przegrzewa się", "Działa wolno", "Po zalaniu", "Nie włącza się"];
const PC_FAULTS = ["Nie włącza się", "Działa wolno", "Głośno pracuje, grzeje się", "System i wirusy", "Dysk i dane", "Brak obrazu", "Porty USB i audio", "Rozbudowa"];
const PRINTER_FAULTS = ["Nie drukuje", "Paski na wydruku", "Zacina papier", "Tusz i głowica", "Skaner", "Brak Wi-Fi", "Błąd na panelu", "Nie włącza się"];
const CONSOLE_FAULTS = ["Brak obrazu (HDMI)", "Nie czyta płyt", "Głośna, przegrzewa się", "Nie włącza się", "Dryf w padzie", "Pad nie ładuje", "Błąd systemu", "Po zalaniu"];
const DATA_FAULTS = ["Z telefonu", "Z dysku HDD lub SSD", "Z pendrive’a lub karty", "Usunięte pliki", "Sprzęt po zalaniu", "Sprzęt nie włącza się"];
const OTHER_FAULTS = ["Nie włącza się", "Nie ładuje", "Brak obrazu", "Brak dźwięku", "Po zalaniu", "Inny problem"];

// Screens (glass inside the bezel) and outlines, in illustration units.
const PHONE_SCREEN: Px4 = [253, 51, 178, 434];
const TABLET_SCREEN: Px4 = [36, 34, 368, 532];
const WATCH_SCREEN: Px4 = [118, 113, 164, 254];
const LAPTOP_SCREEN: Px4 = [106, 32, 388, 246];
const LAPTOP_DECK: Px4 = [18, 292, 564, 82];
const LAPTOP_DECK_CLIP: [number, number][] = [[78, 294], [522, 294], [582, 358], [578, 374], [22, 374], [18, 358]];
const PC_BODY: Px4 = [44, 20, 282, 552];
const PC_CLIP: [number, number][] = [[44, 20], [214, 20], [326, 52], [326, 540], [214, 566], [44, 568]];
const PRINTER_BODY: Px4 = [40, 34, 520, 310];
const PRINTER_CLIP: [number, number][] = [[74, 34], [526, 34], [552, 104], [560, 110], [560, 340], [40, 340], [40, 110], [48, 104]];
const PRINTER_OUT: Px4 = [210, 236, 300, 88];
const CONSOLE_BODY: Px4 = [92, 30, 176, 486];
const PAD: Px4 = [318, 380, 284, 166];
const PAD_CLIP: [number, number][] = [[352, 394], [420, 382], [500, 382], [568, 392], [594, 430], [596, 480], [586, 544], [520, 544], [500, 488], [420, 488], [400, 544], [334, 544], [322, 480], [326, 430]];
const DATA_ALL: Px4 = [36, 34, 426, 316];
const OTHER_ALL: Px4 = [48, 46, 394, 332];

const phone = build(PHONE_CROP, MOBILE, {
  "Pęknięty ekran": { e: "E1", r: PHONE_SCREEN, s: [330, 252], radius: 20 },
  Bateria: { e: "E2", r: [52, 196, 172, 280], s: [138, 360], radius: 14 },
  "Nie ładuje": { e: "E3", r: [296, 462, 92, 34], s: [342, 494] },
  Aparat: { e: "E4", v: "lens", r: [58, 62, 100, 104], s: [107, 114], radius: 28 },
  "Głośnik lub mikrofon": { e: "E5", r: [296, 40, 92, 30], s: [342, 45] },
  "Przyciski i obudowa": { e: "E6", r: [430, 140, 18, 84], s: [443, 181], radius: 40 },
  "Po zalaniu": { e: "E7", r: [38, 40, 404, 456], radius: 22 },
  "Nie włącza się": { e: "E8", r: PHONE_SCREEN, radius: 20 },
});
const tablet = build(TABLET_CROP, MOBILE, {
  "Pęknięty ekran": { e: "E1", r: TABLET_SCREEN, s: [240, 240], radius: 5 },
  Bateria: { e: "E2", r: [56, 320, 210, 220], s: [150, 430], radius: 6 },
  "Nie ładuje": { e: "E3", r: [170, 548, 100, 34], s: [220, 581] },
  Aparat: { e: "E4", v: "lens", r: [388, 270, 32, 60], s: [410, 300], radius: 40 },
  "Głośnik lub mikrofon": { e: "E5", r: [36, 14, 76, 28], s: [71, 19] },
  "Przyciski i obudowa": { e: "E6", r: [306, 8, 70, 22], s: [341, 17], radius: 40 },
  "Po zalaniu": { e: "E7", r: [20, 18, 400, 564], radius: 8 },
  "Nie włącza się": { e: "E8", r: TABLET_SCREEN, radius: 5 },
});
const watch = build(WATCH_CROP, WATCH_FAULTS, {
  "Pęknięte szkło": { e: "E1", r: WATCH_SCREEN, s: [174, 206], radius: 27 },
  Bateria: { e: "E2", r: [100, 95, 200, 290], radius: 31 },
  "Nie ładuje": { e: "E3", r: [140, 344, 120, 41], s: [200, 381] },
  "Przyciski i obudowa": { e: "E6", r: [290, 160, 30, 140], s: [306, 191], radius: 40 },
  "Po zalaniu": { e: "E7", r: [100, 95, 200, 290], radius: 31 },
  "Nie włącza się": { e: "E8", r: WATCH_SCREEN, radius: 27 },
});
const laptop = build(LAPTOP_CROP, LAPTOP_FAULTS, {
  Matryca: { e: "E9", r: LAPTOP_SCREEN, s: [300, 150], radius: 2 },
  Klawiatura: { e: "E12", r: [100, 299, 436, 42], s: [420, 320], radius: 4, clip: [[100, 299], [500, 299], [536, 341], [64, 341]] },
  Bateria: { e: "E2", r: LAPTOP_DECK, clip: LAPTOP_DECK_CLIP },
  "Nie ładuje": { e: "E3", r: [30, 354, 76, 22], s: [58, 365] },
  "Przegrzewa się": { e: "E10", r: [92, 230, 416, 70], s: [200, 290] },
  "Działa wolno": { e: "E11", r: LAPTOP_SCREEN, radius: 2 },
  "Po zalaniu": { e: "E7", r: LAPTOP_DECK, clip: LAPTOP_DECK_CLIP },
  "Nie włącza się": { e: "E8", r: LAPTOP_SCREEN, radius: 2 },
});
const pc = build(PC_CROP, PC_FAULTS, {
  "Nie włącza się": { e: "E8", v: "body", r: [110, 43, 38, 38], s: [129, 62], radius: 50 },
  "Działa wolno": { e: "E11", r: PC_BODY, clip: PC_CLIP },
  "Głośno pracuje, grzeje się": { e: "E10", r: [62, 288, 134, 258], s: [129, 420], radius: 6 },
  "System i wirusy": { e: "E14", r: PC_BODY, clip: PC_CLIP },
  "Dysk i dane": { e: "E13", v: "disc", r: [66, 226, 126, 26], s: [118, 242], radius: 20 },
  "Brak obrazu": { e: "E9", v: "nosignal", r: PC_BODY, clip: PC_CLIP },
  "Porty USB i audio": { e: "E16", v: "port", r: [82, 138, 94, 26], s: [129, 151], radius: 20 },
  Rozbudowa: { e: "E11", v: "upgrade", r: PC_BODY, clip: PC_CLIP },
});
const printer = build(PRINTER_CROP, PRINTER_FAULTS, {
  "Nie drukuje": { e: "E15", v: "blank", r: PRINTER_OUT },
  "Paski na wydruku": { e: "E15", v: "streaks", r: PRINTER_OUT },
  "Zacina papier": { e: "E15", v: "jam", r: PRINTER_OUT, s: [360, 290] },
  "Tusz i głowica": { e: "E15", v: "ink", r: [66, 236, 120, 74], s: [126, 273], radius: 12 },
  Skaner: { e: "E4", v: "scan", r: [52, 36, 496, 68], s: [300, 70], clip: [[74, 36], [526, 36], [552, 104], [48, 104]] },
  "Brak Wi-Fi": { e: "E16", v: "wifi", r: PRINTER_BODY, clip: PRINTER_CLIP },
  "Błąd na panelu": { e: "E14", v: "panel", r: [70, 124, 104, 40], s: [100, 144], radius: 20 },
  "Nie włącza się": { e: "E8", v: "body", r: PRINTER_BODY, clip: PRINTER_CLIP },
});
const consoleScenes = build(CONSOLE_CROP, CONSOLE_FAULTS, {
  "Brak obrazu (HDMI)": { e: "E9", v: "nosignal", r: CONSOLE_BODY, radius: 14 },
  "Nie czyta płyt": { e: "E13", v: "disc", r: [100, 386, 70, 38], s: [134, 405], radius: 30 },
  "Głośna, przegrzewa się": { e: "E10", r: [140, 36, 80, 180], s: [180, 66], radius: 10 },
  "Nie włącza się": { e: "E8", v: "body", r: CONSOLE_BODY, radius: 14 },
  "Dryf w padzie": { e: "E17", r: [394, 450, 48, 48], s: [418, 474], radius: 50 },
  "Pad nie ładuje": { e: "E3", r: [420, 376, 80, 26], s: [460, 388] },
  "Błąd systemu": { e: "E14", r: CONSOLE_BODY, radius: 14 },
  "Po zalaniu": { e: "E7", r: PAD, clip: PAD_CLIP },
});
const data = build(DATA_CROP, DATA_FAULTS, {
  "Z telefonu": { e: "E13", v: "phone", r: [42, 132, 104, 198], s: [94, 231], radius: 20 },
  "Z dysku HDD lub SSD": { e: "E13", v: "hdd", r: [178, 158, 146, 186], s: [251, 232], radius: 10 },
  "Z pendrive’a lub karty": { e: "E13", v: "card", r: [346, 118, 110, 208], s: [420, 284], radius: 10 },
  "Usunięte pliki": { e: "E13", v: "files", r: [182, 40, 122, 90], s: [243, 88], radius: 8 },
  "Sprzęt po zalaniu": { e: "E7", r: DATA_ALL, radius: 6 },
  "Sprzęt nie włącza się": { e: "E8", v: "body", r: DATA_ALL, radius: 6 },
});
const other = build(OTHER_CROP, OTHER_FAULTS, {
  "Nie włącza się": { e: "E8", v: "body", r: [336, 256, 88, 88], s: [380, 300], radius: 50 },
  "Nie ładuje": { e: "E3", r: [54, 218, 72, 110], s: [90, 282], radius: 14 },
  "Brak obrazu": { e: "E9", r: [124, 64, 192, 148], s: [220, 138], radius: 2 },
  "Brak dźwięku": { e: "E5", r: [348, 78, 88, 128], s: [392, 142], radius: 25 },
  "Po zalaniu": { e: "E7", r: OTHER_ALL, radius: 6 },
  "Inny problem": { e: "E14", v: "question", r: OTHER_ALL, radius: 6 },
});

export const wizardDevices: WizardDevice[] = [
  {
    id: "telefon",
    label: "Telefon",
    category: "phone",
    icon: "phone",
    faults: MOBILE,
    photo: { art: "phone", width: 480, height: 540, crop: PHONE_CROP, spots: phone.spots },
    scenes: phone.scenes,
  },
  {
    id: "tablet",
    label: "Tablet",
    category: "tablet",
    icon: "tablet",
    faults: MOBILE,
    photo: { art: "tablet", width: 440, height: 600, crop: TABLET_CROP, spots: tablet.spots },
    scenes: tablet.scenes,
  },
  {
    id: "smartwatch",
    label: "Smartwatch",
    category: "smartwatch",
    icon: "watch",
    faults: WATCH_FAULTS,
    photo: { art: "watch", width: 400, height: 480, crop: WATCH_CROP, spots: watch.spots },
    scenes: watch.scenes,
  },
  {
    id: "laptop",
    label: "Laptop",
    category: "laptop",
    icon: "laptop",
    faults: LAPTOP_FAULTS,
    photo: { art: "laptop", width: 600, height: 400, crop: LAPTOP_CROP, spots: laptop.spots },
    scenes: laptop.scenes,
  },
  {
    id: "komputer",
    label: "Komputer",
    category: "desktop",
    icon: "pc",
    faults: PC_FAULTS,
    photo: { art: "pc", width: 360, height: 580, crop: PC_CROP, spots: pc.spots },
    scenes: pc.scenes,
  },
  {
    id: "drukarka",
    label: "Drukarka",
    category: "printer",
    icon: "printer",
    faults: PRINTER_FAULTS,
    photo: { art: "printer", width: 600, height: 380, crop: PRINTER_CROP, spots: printer.spots },
    scenes: printer.scenes,
  },
  {
    id: "konsola",
    label: "Konsola",
    category: "console",
    icon: "console",
    faults: CONSOLE_FAULTS,
    photo: { art: "console", width: 600, height: 560, crop: CONSOLE_CROP, spots: consoleScenes.spots },
    scenes: consoleScenes.scenes,
  },
  {
    id: "odzysk",
    label: "Odzysk danych",
    category: "data_recovery",
    icon: "data",
    faults: DATA_FAULTS,
    photo: { art: "data", width: 480, height: 400, crop: DATA_CROP, spots: data.spots },
    scenes: data.scenes,
  },
  {
    id: "inne",
    label: "Inne",
    category: "other",
    icon: "other",
    faults: OTHER_FAULTS,
    photo: { art: "other", width: 480, height: 400, crop: OTHER_CROP, spots: other.spots },
    scenes: other.scenes,
  },
];

/**
 * "Co to zwykle znaczy" — one plain sentence per fault (PREMIUM §5, to be approved by
 * Krystian): no prices, no repair times, no promises. Key: "<device id>:<fault>" wins
 * over the plain fault label.
 */
export const FAULT_MEANING: Record<string, string> = {
  "Pęknięty ekran": "Zwykle pęka szybka, a czasem też wyświetlacz pod nią — po diagnozie powiemy, co trzeba wymienić.",
  "Pęknięte szkło": "Zwykle pęka samo szkło tarczy; sprawdzamy, czy ekran pod nim i szczelność są w porządku.",
  Bateria: "Szybkie rozładowanie, wyłączanie przy kilkunastu procentach albo spuchnięta obudowa zwykle oznaczają zużytą baterię.",
  "laptop:Bateria": "Krótka praca bez zasilacza albo nagłe wyłączanie zwykle oznaczają zużytą baterię — sprawdzamy jej stan.",
  "Nie ładuje": "Najczęściej winne jest zabrudzone albo uszkodzone gniazdo, kabel lub ładowarka — rzadziej układ ładowania.",
  "laptop:Nie ładuje": "Zwykle to zasilacz, gniazdo albo układ ładowania na płycie — diagnoza pokaże, który element.",
  "Pad nie ładuje": "Najczęściej to gniazdo USB-C w padzie albo zużyta bateria pada.",
  Aparat: "Rozmyte zdjęcia, czarny obraz albo drgający obiektyw to zwykle uszkodzony moduł aparatu lub jego szkiełko.",
  "Głośnik lub mikrofon": "Cichy, trzeszczący dźwięk albo brak głosu w rozmowie to często zabrudzona siateczka lub uszkodzony głośnik czy mikrofon.",
  "Przyciski i obudowa": "Zacinające się przyciski, wgniecenia i luzy zwykle da się usunąć wymianą przycisku albo elementu obudowy.",
  "Po zalaniu": "Im szybciej sprzęt trafi do serwisu, tym lepiej — nie ładuj go i nie włączaj, zanim go nie sprawdzimy.",
  "Sprzęt po zalaniu": "Nie włączaj nośnika po zalaniu — wilgoć i korozja mogą utrudnić odzyskanie danych.",
  "Nie włącza się": "Przyczyną może być bateria, zasilanie albo płyta główna — diagnoza wskaże, co dokładnie.",
  "Sprzęt nie włącza się": "Dane często da się odzyskać, nawet gdy urządzenie nie startuje — sprawdzamy sam nośnik.",
  Matryca: "Pasy, plamy, migotanie albo czarny ekran zwykle oznaczają uszkodzoną matrycę lub jej taśmę.",
  Klawiatura: "Niedziałające albo zacinające się klawisze to zwykle zabrudzenie, zalanie lub zużyta klawiatura.",
  "Przegrzewa się": "Głośny wentylator i gorąca obudowa to najczęściej kurz w układzie chłodzenia i stara pasta termoprzewodząca.",
  "Działa wolno": "Spowolnienie to zwykle zapchany system, za mało pamięci albo starzejący się dysk.",
  "Głośno pracuje, grzeje się": "Hałas i wysoka temperatura to najczęściej zakurzone chłodzenie albo zużyty wentylator.",
  "System i wirusy": "Wyskakujące okna, błędy i dziwne zachowanie zwykle wymagają porządków w systemie albo jego reinstalacji.",
  "Dysk i dane": "Trzaski, zawieszanie i znikające pliki mogą oznaczać kończący się dysk — warto zrobić kopię jak najszybciej.",
  "Brak obrazu": "Komputer działa, a monitor jest czarny? Najczęściej to karta graficzna, pamięć RAM albo kabel.",
  "other:Brak obrazu": "Czarny ekran przy działającym urządzeniu to zwykle podświetlenie, wyświetlacz albo jego taśma.",
  "Porty USB i audio": "Luźne albo martwe gniazda zwykle da się wymienić lub przylutować na nowo.",
  Rozbudowa: "Więcej pamięci RAM albo szybki dysk SSD to często najprostszy sposób, żeby komputer znów działał sprawnie.",
  "Nie drukuje": "Zwykle to zaschnięta głowica, pusty zbiornik albo problem z połączeniem lub sterownikiem.",
  "Paski na wydruku": "Pasy i blade fragmenty to najczęściej zatkane dysze głowicy albo brudny przesuw.",
  "Zacina papier": "Zacięcia to zwykle zużyte rolki pobierające albo coś, co utknęło w środku drukarki.",
  "Tusz i głowica": "Kolory nie te albo brak jednego koloru to zwykle głowica, przewody tuszu lub zapowietrzony zbiornik.",
  Skaner: "Pasy na skanach albo błąd skanera to najczęściej brudna szyba, lampa lub taśma czujnika.",
  "Brak Wi-Fi": "Drukarka nie widzi sieci albo gubi połączenie — zwykle to ustawienia, rzadziej moduł sieciowy.",
  "Błąd na panelu": "Kod błędu na panelu podpowiada, który element drukarki wymaga sprawdzenia.",
  "Brak obrazu (HDMI)": "Konsola działa, a telewizor nie ma obrazu? Najczęściej uszkodzone jest gniazdo HDMI albo jego układ.",
  "Nie czyta płyt": "Napęd, który nie wciąga albo nie czyta płyt, to zwykle zużyty laser lub mechanizm.",
  "Głośna, przegrzewa się": "Głośna praca i wyłączanie się to zwykle kurz w chłodzeniu i zaschnięta pasta lub ciekły metal.",
  "Dryf w padzie": "Postać albo kamera ruszają się same? To typowe zużycie modułu gałki analogowej.",
  "Błąd systemu": "Błędy przy starcie i aktualizacji często da się usunąć bez utraty danych — sprawdzamy dysk i system.",
  "Z telefonu": "Zdjęcia i kontakty z telefonu, który nie działa albo ma rozbity ekran, często da się jeszcze odzyskać.",
  "Z dysku HDD lub SSD": "Niewidoczny, stukający albo uszkodzony dysk — nie podłączaj go wielokrotnie, żeby nie pogorszyć sprawy.",
  "Z pendrive’a lub karty": "Karta lub pendrive, który prosi o formatowanie, często nadal ma dane — nie formatuj go.",
  "Usunięte pliki": "Usunięte pliki można często przywrócić, jeśli nośnik nie był potem używany — przestań na nim zapisywać.",
  "Brak dźwięku": "Brak dźwięku to zwykle głośnik, gniazdo albo wzmacniacz — sprawdzimy, który element.",
  "Inny problem": "Opisz w zgłoszeniu, co się dzieje — po diagnozie powiemy, co da się zrobić.",
};

/** Sentence for a fault on a device (device-specific wins). */
export function faultMeaning(deviceId: string, fault: string): string {
  return FAULT_MEANING[`${deviceId}:${fault}`] ?? FAULT_MEANING[fault] ?? "";
}

/** Scene of a fault on a device (falls back to the first fault). */
export function sceneOf(device: WizardDevice, fault: string): FaultScene {
  return device.scenes[fault] ?? device.scenes[device.faults[0]];
}

export function deviceById(id: string): WizardDevice {
  return wizardDevices.find((d) => d.id === id) ?? wizardDevices[0];
}

/** How the customer hands the device over. */
export type Delivery = { kind: "point"; point: PointKey } | { kind: "courier" };

export type WizardState = { device: string; fault: string; delivery: Delivery };

/** "Pęknięty ekran" → "pęknięty ekran" (summary line). */
export function lowerFirst(s: string): string {
  return s ? s.charAt(0).toLocaleLowerCase("pl-PL") + s.slice(1) : s;
}

/**
 * Wizard result → /zgloszenie (KONTRAKT §1.4):
 * `?category=<kod>&usterka=<tekst>&punkt=rabka|zakopane&dostawa=punkt|kurier`.
 * Courier carries no `punkt` (the form asks for the return point itself).
 */
export function buildWizardHref(state: WizardState): string {
  const device = deviceById(state.device);
  const fault = device.faults.includes(state.fault) ? state.fault : device.faults[0];
  const q = new URLSearchParams();
  q.set("category", device.category);
  q.set("usterka", fault);
  if (state.delivery.kind === "point") {
    q.set("punkt", state.delivery.point);
    q.set("dostawa", "punkt");
  } else {
    q.set("dostawa", "kurier");
  }
  return `/zgloszenie?${q.toString()}`;
}

/** Plain link to the form with a category and, optionally, a fault (KONTRAKT §1.4). */
export function submitHref(category: CategoryCode, fault?: string, extra: Record<string, string> = {}): string {
  const q = new URLSearchParams({ category });
  if (fault) q.set("usterka", fault);
  for (const [k, v] of Object.entries(extra)) q.set(k, v);
  return `/zgloszenie?${q.toString()}`;
}

/** Brands in the marquee (design T.Main `brands`). */
export const brands = ["Apple", "Samsung", "Xiaomi", "Motorola", "realme", "Huawei", "Lenovo", "HP", "Dell", "ASUS", "Acer", "MSI", "PlayStation", "Xbox", "Nintendo", "Canon", "Epson", "Brother"];
