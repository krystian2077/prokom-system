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

export type WizardPhoto = {
  /** Photo (WebP) — or `art` for an illustration drawn in the scene style. */
  src?: string;
  art?: "watch" | "data" | "other";
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

type Px4 = [number, number, number, number];
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
function build(crop: Px4, faults: string[], defs: Record<string, SceneDef>) {
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

const MOBILE = ["Pęknięty ekran", "Bateria", "Nie ładuje", "Aparat", "Głośnik lub mikrofon", "Przyciski i obudowa", "Po zalaniu", "Nie włącza się"];

const PHONE_CROP: Px4 = [24, 50, 392, 486];
/** Tablet: front only, whole (kreator-tablet.webp, scripts/tech/urzadzenia-kadry.py); units = image px / 2. */
const TABLET_CROP: Px4 = [0, 0, 416, 582];
const WATCH_CROP: Px4 = [0, 0, 400, 480];
const LAPTOP_CROP: Px4 = [23, 86, 601, 407];
const PC_CROP: Px4 = [149, 0, 343, 640];
const PRINTER_CROP: Px4 = [49, 71, 544, 272];
const CONSOLE_CROP: Px4 = [49, 0, 542, 640];
const ART_CROP: Px4 = [0, 0, 480, 400];

const WATCH_FAULTS = ["Pęknięte szkło", "Bateria", "Nie ładuje", "Przyciski i obudowa", "Po zalaniu", "Nie włącza się"];
const LAPTOP_FAULTS = ["Matryca", "Klawiatura", "Bateria", "Nie ładuje", "Przegrzewa się", "Działa wolno", "Po zalaniu", "Nie włącza się"];
const PC_FAULTS = ["Nie włącza się", "Działa wolno", "Głośno pracuje, grzeje się", "System i wirusy", "Dysk i dane", "Brak obrazu", "Porty USB i audio", "Rozbudowa"];
const PRINTER_FAULTS = ["Nie drukuje", "Paski na wydruku", "Zacina papier", "Tusz i głowica", "Skaner", "Brak Wi-Fi", "Błąd na panelu", "Nie włącza się"];
const CONSOLE_FAULTS = ["Brak obrazu (HDMI)", "Nie czyta płyt", "Głośna, przegrzewa się", "Nie włącza się", "Dryf w padzie", "Pad nie ładuje", "Błąd systemu", "Po zalaniu"];
const DATA_FAULTS = ["Z telefonu", "Z dysku HDD lub SSD", "Z pendrive’a lub karty", "Usunięte pliki", "Sprzęt po zalaniu", "Sprzęt nie włącza się"];
const OTHER_FAULTS = ["Nie włącza się", "Nie ładuje", "Brak obrazu", "Brak dźwięku", "Po zalaniu", "Inny problem"];

// Screens inside the bezel (image px).
const PHONE_SCREEN: Px4 = [191, 59, 216, 468];
const TABLET_SCREEN: Px4 = [16, 16, 384, 550];
// Outlines of parts seen at an angle (image px) → clip polygons, so effects stay on the device.
const LAPTOP_LID: [number, number][] = [[140, 88], [506, 116], [513, 132], [402, 476], [388, 488], [32, 402], [25, 386]];
const LAPTOP_BASE: [number, number][] = [[436, 352], [612, 381], [621, 393], [404, 489], [396, 470]];
const PC_CASE: [number, number][] = [[152, 22], [286, 2], [487, 100], [489, 590], [306, 640], [152, 640]];
const PRINTER_BODY: [number, number][] = [[55, 162], [104, 75], [552, 74], [590, 162], [590, 340], [58, 340]];
const CONSOLE_BODY: [number, number][] = [[74, 88], [216, 2], [318, 22], [300, 622], [58, 622], [53, 560]];
const PAD: [number, number][] = [[350, 448], [555, 448], [588, 560], [580, 636], [520, 636], [452, 560], [400, 636], [326, 636], [318, 560]];

const phone = build(PHONE_CROP, MOBILE, {
  "Pęknięty ekran": { e: "E1", r: PHONE_SCREEN, s: [318, 232], radius: 12 },
  Bateria: { e: "E2", r: [36, 226, 150, 300], s: [104, 392], radius: 10 },
  "Nie ładuje": { e: "E3", r: [244, 486, 110, 50], s: [299, 527] },
  Aparat: { e: "E4", v: "lens", r: [38, 56, 124, 132], s: [99, 121], radius: 26 },
  "Głośnik lub mikrofon": { e: "E5", r: [244, 52, 110, 46], s: [299, 61] },
  "Przyciski i obudowa": { e: "E6", r: [396, 176, 26, 96], s: [413, 222], radius: 30 },
  "Po zalaniu": { e: "E7", r: [28, 52, 390, 484], radius: 9 },
  "Nie włącza się": { e: "E8", r: PHONE_SCREEN, radius: 12 },
});
const tablet = build(TABLET_CROP, MOBILE, {
  "Pęknięty ekran": { e: "E1", r: TABLET_SCREEN, s: [254, 226], radius: 4 },
  Bateria: { e: "E2", r: [40, 300, 220, 240], s: [140, 430], radius: 6 },
  "Nie ładuje": { e: "E3", r: [150, 530, 116, 52], s: [208, 575] },
  Aparat: { e: "E4", v: "lens", r: [360, 251, 56, 80], s: [407, 291], radius: 30 },
  "Głośnik lub mikrofon": { e: "E5", r: [20, 0, 120, 48], s: [74, 8] },
  "Przyciski i obudowa": { e: "E6", r: [290, 0, 100, 34], s: [340, 6], radius: 30 },
  "Po zalaniu": { e: "E7", r: [2, 2, 412, 578], radius: 7 },
  "Nie włącza się": { e: "E8", r: TABLET_SCREEN, radius: 4 },
});
const watch = build(WATCH_CROP, WATCH_FAULTS, {
  "Pęknięte szkło": { e: "E1", r: [118, 113, 164, 254], s: [172, 214], radius: 22 },
  Bateria: { e: "E2", r: [100, 95, 200, 290], radius: 24 },
  "Nie ładuje": { e: "E3", r: [130, 318, 140, 66], s: [200, 370] },
  "Przyciski i obudowa": { e: "E6", r: [292, 160, 40, 140], s: [309, 192], radius: 30 },
  "Po zalaniu": { e: "E7", r: [100, 95, 200, 290], radius: 24 },
  "Nie włącza się": { e: "E8", r: [118, 113, 164, 254], radius: 22 },
});
const laptop = build(LAPTOP_CROP, LAPTOP_FAULTS, {
  Matryca: { e: "E9", r: [25, 88, 490, 400], s: [300, 250], clip: LAPTOP_LID },
  Klawiatura: { e: "E12", r: [408, 392, 112, 52], s: [498, 413], radius: 10 },
  Bateria: { e: "E2", r: [396, 352, 225, 137], clip: LAPTOP_BASE },
  "Nie ładuje": { e: "E3", r: [398, 448, 100, 40], s: [426, 468] },
  "Przegrzewa się": { e: "E10", r: [30, 330, 372, 160], s: [210, 432], clip: [[44, 330], [400, 330], [402, 476], [388, 488], [32, 402], [25, 386]] },
  "Działa wolno": { e: "E11", r: [25, 88, 490, 400], clip: LAPTOP_LID },
  "Po zalaniu": { e: "E7", r: [396, 352, 225, 137], clip: LAPTOP_BASE },
  "Nie włącza się": { e: "E8", v: "body", r: [25, 88, 490, 400], clip: LAPTOP_LID },
});
const pc = build(PC_CROP, PC_FAULTS, {
  "Nie włącza się": { e: "E8", v: "body", r: [232, 20, 54, 54], s: [259, 46], radius: 50 },
  "Działa wolno": { e: "E11", r: [150, 0, 340, 640], clip: PC_CASE },
  "Głośno pracuje, grzeje się": { e: "E10", r: [154, 300, 132, 330], s: [222, 424], radius: 4 },
  "System i wirusy": { e: "E14", r: [150, 0, 340, 640], clip: PC_CASE },
  "Dysk i dane": { e: "E13", v: "disc", r: [152, 44, 82, 236], s: [166, 146], radius: 4 },
  "Brak obrazu": { e: "E9", v: "nosignal", r: [150, 0, 340, 640], clip: PC_CASE },
  "Porty USB i audio": { e: "E16", v: "port", r: [236, 104, 52, 140], s: [262, 202], radius: 10 },
  Rozbudowa: { e: "E11", v: "upgrade", r: [150, 0, 340, 640], clip: PC_CASE },
});
const printer = build(PRINTER_CROP, PRINTER_FAULTS, {
  "Nie drukuje": { e: "E15", v: "blank", r: [195, 258, 290, 82] },
  "Paski na wydruku": { e: "E15", v: "streaks", r: [195, 258, 290, 82] },
  "Zacina papier": { e: "E15", v: "jam", r: [195, 258, 290, 82], s: [344, 296] },
  "Tusz i głowica": { e: "E15", v: "ink", r: [70, 270, 116, 60], s: [128, 300] },
  Skaner: { e: "E4", v: "scan", r: [128, 76, 448, 72], s: [380, 112], radius: 4 },
  "Brak Wi-Fi": { e: "E16", v: "wifi", r: [50, 72, 542, 270], clip: PRINTER_BODY },
  "Błąd na panelu": { e: "E14", v: "panel", r: [70, 104, 66, 46], s: [100, 124] },
  "Nie włącza się": { e: "E8", v: "body", r: [50, 72, 542, 270], clip: PRINTER_BODY },
});
const consoleScenes = build(CONSOLE_CROP, CONSOLE_FAULTS, {
  "Brak obrazu (HDMI)": { e: "E9", v: "nosignal", r: [50, 0, 540, 640], clip: CONSOLE_BODY },
  "Nie czyta płyt": { e: "E13", v: "disc", r: [60, 330, 190, 280], s: [150, 470], radius: 6 },
  "Głośna, przegrzewa się": { e: "E10", r: [212, 24, 100, 300], s: [262, 120], radius: 6 },
  "Nie włącza się": { e: "E8", v: "body", r: [50, 0, 270, 640], clip: CONSOLE_BODY },
  "Dryf w padzie": { e: "E17", r: [366, 494, 66, 66], s: [398, 530], radius: 50 },
  "Pad nie ładuje": { e: "E3", r: [400, 436, 112, 46], s: [458, 444] },
  "Błąd systemu": { e: "E14", r: [50, 0, 270, 640], clip: CONSOLE_BODY },
  "Po zalaniu": { e: "E7", r: [316, 444, 274, 196], clip: PAD },
});
const data = build(ART_CROP, DATA_FAULTS, {
  "Z telefonu": { e: "E13", v: "phone", r: [30, 130, 120, 200], s: [90, 230] },
  "Z dysku HDD lub SSD": { e: "E13", v: "hdd", r: [170, 170, 140, 160], s: [240, 250] },
  "Z pendrive’a lub karty": { e: "E13", v: "card", r: [330, 140, 120, 180], s: [390, 230] },
  "Usunięte pliki": { e: "E13", v: "files", r: [180, 30, 120, 110], s: [240, 85] },
  "Sprzęt po zalaniu": { e: "E7", r: [20, 20, 440, 360], radius: 6 },
  "Sprzęt nie włącza się": { e: "E8", v: "body", r: [20, 20, 440, 360], radius: 6 },
});
const other = build(ART_CROP, OTHER_FAULTS, {
  "Nie włącza się": { e: "E8", v: "body", r: [336, 256, 88, 88], s: [380, 300], radius: 50 },
  "Nie ładuje": { e: "E3", r: [40, 240, 100, 120], s: [90, 300] },
  "Brak obrazu": { e: "E9", r: [124, 64, 192, 152], s: [220, 140], radius: 4 },
  "Brak dźwięku": { e: "E5", r: [345, 85, 90, 120], s: [390, 140] },
  "Po zalaniu": { e: "E7", r: [20, 20, 440, 360], radius: 6 },
  "Inny problem": { e: "E14", v: "question", r: [20, 20, 440, 360], radius: 6 },
});

export const wizardDevices: WizardDevice[] = [
  {
    id: "telefon",
    label: "Telefon",
    category: "phone",
    icon: "phone",
    faults: MOBILE,
    photo: { src: "/tech/urzadzenia/kreator-iphone.webp", width: 433, height: 577, crop: PHONE_CROP, spots: phone.spots },
    scenes: phone.scenes,
  },
  {
    id: "tablet",
    label: "Tablet",
    category: "tablet",
    icon: "tablet",
    faults: MOBILE,
    photo: { src: "/tech/urzadzenia/kreator-tablet.webp", width: 416, height: 582, crop: TABLET_CROP, spots: tablet.spots },
    scenes: tablet.scenes,
  },
  {
    id: "smartwatch",
    label: "Smartwatch",
    category: "smartwatch",
    icon: "watch",
    faults: WATCH_FAULTS,
    // No photo with usage rights → illustration in the scene style (PREMIUM §4).
    photo: { art: "watch", width: 400, height: 480, crop: WATCH_CROP, spots: watch.spots },
    scenes: watch.scenes,
  },
  {
    id: "laptop",
    label: "Laptop",
    category: "laptop",
    icon: "laptop",
    faults: LAPTOP_FAULTS,
    photo: { src: "/tech/urzadzenia/laptop.webp", width: 640, height: 640, crop: LAPTOP_CROP, spots: laptop.spots },
    scenes: laptop.scenes,
  },
  {
    id: "komputer",
    label: "Komputer",
    category: "desktop",
    icon: "pc",
    faults: PC_FAULTS,
    photo: { src: "/tech/urzadzenia/komputer.webp", width: 640, height: 640, crop: PC_CROP, spots: pc.spots },
    scenes: pc.scenes,
  },
  {
    id: "drukarka",
    label: "Drukarka",
    category: "printer",
    icon: "printer",
    faults: PRINTER_FAULTS,
    photo: { src: "/tech/urzadzenia/drukarka.webp", width: 640, height: 449, crop: PRINTER_CROP, spots: printer.spots },
    scenes: printer.scenes,
  },
  {
    id: "konsola",
    label: "Konsola",
    category: "console",
    icon: "console",
    faults: CONSOLE_FAULTS,
    photo: { src: "/tech/urzadzenia/konsola.webp", width: 640, height: 640, crop: CONSOLE_CROP, spots: consoleScenes.spots },
    scenes: consoleScenes.scenes,
  },
  {
    id: "odzysk",
    label: "Odzysk danych",
    category: "data_recovery",
    icon: "data",
    faults: DATA_FAULTS,
    photo: { art: "data", width: 480, height: 400, crop: ART_CROP, spots: data.spots },
    scenes: data.scenes,
  },
  {
    id: "inne",
    label: "Inne",
    category: "other",
    icon: "other",
    faults: OTHER_FAULTS,
    photo: { art: "other", width: 480, height: 400, crop: ART_CROP, spots: other.spots },
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

/**
 * Brands in the marquee (design T.Main `brands`), every one shown as a logo
 * (components/tech/brand-logos.ts). Xbox, Nintendo, Canon and Brother were dropped on
 * 15.11.2026: no clean mark in Simple Icons nor among the files Krystian sent, and text
 * between logos broke the strip's rhythm.
 */
export const brands = ["Apple", "Samsung", "Xiaomi", "Motorola", "realme", "Huawei", "Lenovo", "HP", "Dell", "ASUS", "Acer", "MSI", "PlayStation", "Epson"];
