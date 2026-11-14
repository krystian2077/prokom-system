/**
 * Data for the "Co się zepsuło?" wizard (design T.Main `DV`, SPEC §7, KONTRAKT §1.1/§1.4).
 *
 * Photo hotspots are stored in % of the crop box (`crop`), so the photo scales freely:
 * the crop box is the visible frame, the image is positioned inside it.
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

export type WizardPhoto = {
  src: string;
  width: number;
  height: number;
  /** Crop box in image px: [x, y, w, h]. */
  crop: [number, number, number, number];
  /** [fault, x%, y%] relative to the crop box. */
  spots: [string, number, number][];
};

export type WizardDevice = {
  id: string;
  label: string;
  category: CategoryCode;
  icon: WizardIcon;
  faults: string[];
  photo: WizardPhoto | null;
};

/** Spots from the prototype are in image px; convert to % of the crop box (1 decimal). */
function spots(crop: [number, number, number, number], list: [string, number, number][]): [string, number, number][] {
  const [cx, cy, cw, ch] = crop;
  const r = (n: number) => Math.round(n * 10) / 10;
  return list.map(([t, x, y]) => [t, r(((x - cx) / cw) * 100), r(((y - cy) / ch) * 100)]);
}

const MOBILE = ["Pęknięty ekran", "Bateria", "Nie ładuje", "Aparat", "Głośnik lub mikrofon", "Przyciski i obudowa", "Po zalaniu", "Nie włącza się"];

const PHONE_CROP: [number, number, number, number] = [24, 50, 392, 486];
const TABLET_CROP: [number, number, number, number] = [33, 27, 512, 586];
const LAPTOP_CROP: [number, number, number, number] = [23, 86, 601, 407];
const PC_CROP: [number, number, number, number] = [149, 0, 343, 640];
const PRINTER_CROP: [number, number, number, number] = [49, 71, 544, 272];
const CONSOLE_CROP: [number, number, number, number] = [49, 0, 542, 640];

export const wizardDevices: WizardDevice[] = [
  {
    id: "telefon",
    label: "Telefon",
    category: "phone",
    icon: "phone",
    faults: MOBILE,
    photo: {
      src: "/tech/urzadzenia/iphone.webp",
      width: 433,
      height: 577,
      crop: PHONE_CROP,
      spots: spots(PHONE_CROP, [
        ["Głośnik lub mikrofon", 295, 74],
        ["Aparat", 96, 120],
        ["Pęknięty ekran", 295, 292],
        ["Przyciski i obudowa", 411, 216],
        ["Bateria", 96, 336],
        ["Nie ładuje", 295, 524],
      ]),
    },
  },
  {
    id: "tablet",
    label: "Tablet",
    category: "tablet",
    icon: "tablet",
    faults: MOBILE,
    photo: {
      src: "/tech/urzadzenia/tablet.webp",
      width: 577,
      height: 640,
      crop: TABLET_CROP,
      spots: spots(TABLET_CROP, [
        ["Aparat", 66, 76],
        ["Przyciski i obudowa", 347, 40],
        ["Pęknięty ekran", 347, 320],
        ["Bateria", 80, 360],
        ["Nie ładuje", 347, 594],
      ]),
    },
  },
  {
    id: "smartwatch",
    label: "Smartwatch",
    category: "smartwatch",
    icon: "watch",
    faults: ["Pęknięte szkło", "Bateria", "Nie ładuje", "Przyciski i obudowa", "Po zalaniu", "Nie włącza się"],
    photo: null,
  },
  {
    id: "laptop",
    label: "Laptop",
    category: "laptop",
    icon: "laptop",
    faults: ["Matryca", "Klawiatura", "Bateria", "Nie ładuje", "Przegrzewa się", "Działa wolno", "Po zalaniu", "Nie włącza się"],
    photo: {
      src: "/tech/urzadzenia/laptop.webp",
      width: 640,
      height: 640,
      crop: LAPTOP_CROP,
      spots: spots(LAPTOP_CROP, [
        ["Matryca", 250, 262],
        ["Przegrzewa się", 150, 404],
        ["Klawiatura", 492, 410],
        ["Nie ładuje", 418, 468],
      ]),
    },
  },
  {
    id: "komputer",
    label: "Komputer",
    category: "desktop",
    icon: "pc",
    faults: ["Nie włącza się", "Działa wolno", "Głośno pracuje, grzeje się", "System i wirusy", "Dysk i dane", "Brak obrazu", "Porty USB i audio", "Rozbudowa"],
    photo: {
      src: "/tech/urzadzenia/komputer.webp",
      width: 640,
      height: 640,
      crop: PC_CROP,
      spots: spots(PC_CROP, [
        ["Nie włącza się", 263, 44],
        ["Dysk i dane", 172, 142],
        ["Porty USB i audio", 264, 196],
        ["Głośno pracuje, grzeje się", 232, 446],
      ]),
    },
  },
  {
    id: "drukarka",
    label: "Drukarka",
    category: "printer",
    icon: "printer",
    faults: ["Nie drukuje", "Paski na wydruku", "Zacina papier", "Tusz i głowica", "Skaner", "Brak Wi-Fi", "Błąd na panelu", "Nie włącza się"],
    photo: {
      src: "/tech/urzadzenia/drukarka.webp",
      width: 640,
      height: 449,
      crop: PRINTER_CROP,
      spots: spots(PRINTER_CROP, [
        ["Skaner", 330, 112],
        ["Błąd na panelu", 100, 134],
        ["Tusz i głowica", 126, 298],
        ["Zacina papier", 372, 296],
      ]),
    },
  },
  {
    id: "konsola",
    label: "Konsola",
    category: "console",
    icon: "console",
    faults: ["Brak obrazu (HDMI)", "Nie czyta płyt", "Głośna, przegrzewa się", "Nie włącza się", "Dryf w padzie", "Pad nie ładuje", "Błąd systemu", "Po zalaniu"],
    photo: {
      src: "/tech/urzadzenia/konsola.webp",
      width: 640,
      height: 640,
      crop: CONSOLE_CROP,
      spots: spots(CONSOLE_CROP, [
        ["Nie czyta płyt", 258, 210],
        ["Głośna, przegrzewa się", 180, 330],
        ["Dryf w padzie", 414, 526],
        ["Pad nie ładuje", 470, 452],
      ]),
    },
  },
  {
    id: "odzysk",
    label: "Odzysk danych",
    category: "data_recovery",
    icon: "data",
    faults: ["Z telefonu", "Z dysku HDD lub SSD", "Z pendrive’a lub karty", "Usunięte pliki", "Sprzęt po zalaniu", "Sprzęt nie włącza się"],
    photo: null,
  },
  {
    id: "inne",
    label: "Inne",
    category: "other",
    icon: "other",
    faults: ["Nie włącza się", "Nie ładuje", "Brak obrazu", "Brak dźwięku", "Po zalaniu", "Inny problem"],
    photo: null,
  },
];

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

/** Brands in the marquee (design T.Main `brands`). */
export const brands = ["Apple", "Samsung", "Xiaomi", "Motorola", "realme", "Huawei", "Lenovo", "HP", "Dell", "ASUS", "Acer", "MSI", "PlayStation", "Xbox", "Nintendo", "Canon", "Epson", "Brother"];
