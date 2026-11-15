/**
 * "Jak sprawdzić model" helper of the repair form (/zgloszenie, step 1).
 *
 * Pure data + decisions, no DOM: which guides fit the chosen category and field
 * (model or IMEI / serial number), their steps with an illustrated scene each, what
 * exactly to type, which tab opens first (typed brand > category > the system the
 * visitor browses on), and whether a model read from the browser (UA Client Hints,
 * Chromium on Android) may be offered as a one-click proposal. The proposal is only
 * shown to the visitor; it is never sent or stored.
 * Texts: short, second person, no prices, no brand logos in the illustrations.
 */
import type { DeviceCategory } from "./contract";

export type HelperField = "model" | "imei";
export type Platform = "ios" | "android" | "mac" | "windows" | "other";

/* ---------- Scenes (drawn by components/tech/zgloszenie/HelperScene.tsx) ---------- */

/** Screen a scene is shown on. */
export type Frame = "phone" | "tablet" | "pc" | "mac" | "tv";
export type AppIcon = "settings" | "phone" | "watch" | "wearable";
/** Physical devices with a sticker, engraving or name plate. */
export type Thing = "laptop" | "tower" | "printer" | "printer-back" | "console" | "watch" | "box" | "drive" | "generic";
export type Pair = [label: string, value: string];

export type Scene =
  /** Home screen with the app to open. */
  | { kind: "home"; frame: Frame; app: string; icon: AppIcon }
  /** Settings list: the row to tap. */
  | { kind: "list"; frame: Frame; title: string; rows: string[]; hit: number }
  /** Information screen: the rows that answer the question (and an optional big name on top). */
  | { kind: "info"; frame: Frame; title: string; hero?: Pair; rows: Pair[]; hit: number[]; heroHit?: boolean; stack?: boolean }
  /** Mac menu bar with the system menu open. */
  | { kind: "menu"; rows: string[]; hit: number }
  /** Phone keypad: the code typed, then the window with the result. */
  | { kind: "dialer"; typed: string; result?: string }
  /** A device seen from outside; `zoom` = the sticker under a magnifier. */
  | { kind: "thing"; on: Thing; zoom?: { rows: Pair[]; hit: number[]; plate?: boolean } };

export type HelperStep = { title: string; text?: string; scene: Scene };
/** "Co wpisać": shown as an example, never inserted (it is not the visitor's value). */
export type HelperExample = { value: string; note?: string };

export type HelperVariant = {
  id: string;
  label: string;
  steps: HelperStep[];
  example?: HelperExample;
  /** Extra brand words picking this variant (besides the brand family = id). */
  match?: RegExp;
};

export type HelperGuide = {
  /** Tab id (stable: tests, analytics-free). */
  id: string;
  /** Tab label. */
  tab: string;
  /** One sentence under the tabs. */
  lead: string;
  steps: HelperStep[];
  example: HelperExample;
  /** Short extra hints in the second person. */
  tips?: string[];
  /** Brands whose path differs (Android makers, consoles). */
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
/** Form field the example goes to (label as in RepairForm). */
export const HELPER_FIELD_LABEL: Record<HelperField, string> = { model: "Model", imei: "IMEI albo numer seryjny" };

/** Steps of a guide, with the brand variant applied. */
export function guideSteps(guide: HelperGuide, variantId: string | null): HelperStep[] {
  return guide.variants?.find((v) => v.id === variantId)?.steps ?? guide.variants?.[0]?.steps ?? guide.steps;
}
export function guideExample(guide: HelperGuide, variantId: string | null): HelperExample {
  return guide.variants?.find((v) => v.id === variantId)?.example ?? guide.example;
}
/** Screen path ("Ustawienia › Ogólne › To urządzenie") of steps that open something. */
export function stepPath(steps: HelperStep[]): string[] {
  return steps.flatMap((s) => (s.scene.kind === "home" ? [s.scene.app] : s.scene.kind === "list" ? [s.scene.rows[s.scene.hit]] : s.scene.kind === "menu" ? [s.scene.rows[s.scene.hit]] : []));
}

/* ---------- Sample values (fictional where a real one could mislead) ---------- */

const IMEI = "35 209900 176148 1";
const IMEI_TYPED = "352099001761481";
const SERIAL = "5CD1234XYZ";

/* ---------- Building blocks ---------- */

type Noun = { loc: string; device: string; frame: Frame; storage: string };
const nounOf = (category: DeviceCategory | null): Noun =>
  category === "tablet" ? { loc: "tablecie", device: "iPad", frame: "tablet", storage: "Pamięć iPada" } : { loc: "telefonie", device: "iPhone", frame: "phone", storage: "Pamięć iPhone’a" };

const openSettings = (frame: Frame, text = "Szara ikona z kołem zębatym."): HelperStep => ({
  title: "Otwórz Ustawienia",
  text,
  scene: { kind: "home", frame, app: "Ustawienia", icon: "settings" },
});

function appleMobile(category: DeviceCategory | null, field: HelperField): HelperGuide {
  const n = nounOf(category);
  const tablet = category === "tablet";
  const model: Pair[] = tablet
    ? [["Nazwa", "iPad"], ["Wersja iPadOS", "18.1"], ["Nazwa modelu", "iPad (9. generacji)"], ["Numer modelu", "A2602"], ["Numer seryjny", "DMPXXXXXXX"]]
    : [["Nazwa", "iPhone"], ["Wersja iOS", "18.1"], ["Nazwa modelu", "iPhone 13"], ["Numer modelu", "A2633"], ["Numer seryjny", "F2LXXXXXXX"]];
  const imei: Pair[] = [["Numer seryjny", tablet ? "DMPXXXXXXX" : "F2LXXXXXXX"], ["EID", "8904…"], ["IMEI", IMEI], ["IMEI2", "35 209900 176149 9"]];
  return {
    id: "apple",
    tab: category === "phone" ? "iPhone" : tablet ? "iPad" : "iPhone i iPad",
    lead: field === "model" ? `Model ${tablet ? "iPada" : "iPhone’a"} sprawdzisz w Ustawieniach, w trzech stuknięciach.` : "IMEI jest w Ustawieniach, w tym samym miejscu co model.",
    steps: [
      openSettings(n.frame),
      { title: "Stuknij „Ogólne”", scene: { kind: "list", frame: n.frame, title: "Ustawienia", rows: ["Wi‑Fi", "Bluetooth", "Bateria", "Ogólne", "Ekran i jasność", "Prywatność i ochrona"], hit: 3 } },
      { title: "Stuknij „To urządzenie”", text: "To pierwsza pozycja na liście.", scene: { kind: "list", frame: n.frame, title: "Ogólne", rows: ["To urządzenie", "Uaktualnienia", "AirDrop", n.storage, "Data i czas"], hit: 0 } },
      field === "model"
        ? {
            title: "Odczytaj model",
            text: `Nazwa modelu jest na górze, np. ${tablet ? "iPad (9. generacji)" : "iPhone 13"}. Stuknij „Numer modelu”, a zobaczysz numer zaczynający się od A, np. ${tablet ? "A2602" : "A2633"}. Wpisz jedno albo drugie.`,
            scene: { kind: "info", frame: n.frame, title: "To urządzenie", rows: model, hit: [2, 3] },
          }
        : {
            title: "Przewiń do „IMEI”",
            text: "iPad bez karty SIM ma tylko „Numer seryjny”: wpisz go.",
            scene: { kind: "info", frame: n.frame, title: "To urządzenie", rows: imei, hit: [2] },
          },
    ],
    example: field === "model" ? { value: tablet ? "iPad (9. generacji)" : "iPhone 13", note: `albo numer modelu, np. ${tablet ? "A2602" : "A2633"}` } : { value: IMEI_TYPED, note: "15 cyfr, bez spacji" },
  };
}

/** Android: the path and the screen differ per maker, so each main brand has its own steps. */
function androidVariants(category: DeviceCategory | null, field: HelperField): HelperVariant[] {
  const n = nounOf(category);
  const frame = n.frame;
  const about = `Informacje o ${n.loc}`;
  const settings = openSettings(frame, "Ikona z kołem zębatym, na ekranie głównym albo w menu aplikacji.");
  const list = (rows: string[], hit: number): HelperStep => ({ title: `Stuknij „${rows[hit]}”`, scene: { kind: "list", frame, title: "Ustawienia", rows, hit } });
  const read = (title: string, rows: Pair[], modelHit: number[], imeiHit: number[], text?: string): HelperStep =>
    field === "model"
      ? { title: "Odczytaj model", text, scene: { kind: "info", frame, title, rows, hit: modelHit, stack: true } }
      : { title: "Odczytaj IMEI", text, scene: { kind: "info", frame, title, rows, hit: imeiHit, stack: true } };
  const imeiEx: HelperExample = { value: IMEI_TYPED, note: "15 cyfr, bez spacji" };
  return [
    {
      id: "general",
      label: "Ogólnie",
      steps: [
        settings,
        list(["Sieć i internet", "Połączone urządzenia", "Aplikacje", "Bateria", "Wyświetlacz", about], 5),
        read(
          about,
          [["Nazwa urządzenia", "Mój telefon"], ["Model", "Pixel 7"], ["Numer telefonu", "+48 •••"], ["IMEI", IMEI]],
          [1],
          [3],
          `Czasem ta pozycja nazywa się „O ${n.loc}” albo jest na dole, w „System”.`,
        ),
      ],
      example: field === "model" ? { value: "Pixel 7", note: "nazwa z pozycji „Model”" } : imeiEx,
    },
    {
      id: "samsung",
      label: "Samsung",
      steps: [
        settings,
        list(["Połączenia", "Wyświetlacz", "Bateria", "Aktualizacja oprogramowania", "Porady i podręcznik", about], 5),
        read(
          about,
          [["Nazwa modelu", "Galaxy S23"], ["Numer modelu", "SM-S911B/DS"], ["Numer seryjny", "R5CWXXXXXXX"], ["IMEI", IMEI]],
          [0, 1],
          [3],
          field === "model" ? "Zobaczysz nazwę, np. Galaxy S23, i numer modelu, np. SM-S911B." : "IMEI jest od razu na tej stronie.",
        ),
      ],
      example: field === "model" ? { value: "Galaxy S23", note: "albo numer modelu, np. SM-S911B" } : imeiEx,
    },
    {
      id: "xiaomi",
      label: "Xiaomi, Redmi, POCO",
      steps: [
        settings,
        list([`O ${n.loc}`, "Karty SIM i sieci", "Wi‑Fi", "Bluetooth", "Wyświetlacz", "Bateria"], 0),
        field === "model"
          ? read(`O ${n.loc}`, [["Nazwa urządzenia", "Redmi Note 12"], ["Wersja systemu", "HyperOS"], ["Szczegóły i dane techniczne", "›"]], [0], [], "Model jest na górze albo w szczegółach i danych technicznych.")
          : read("Szczegóły i dane techniczne", [["Model", "23021RAAEG"], ["Stan", "›"], ["IMEI", IMEI]], [], [2], "IMEI jest w szczegółach, czasem w „Stan”."),
      ],
      example: field === "model" ? { value: "Redmi Note 12", note: "nazwa z góry ekranu" } : imeiEx,
    },
    {
      id: "motorola",
      label: "Motorola",
      steps: [settings, list(["Sieć i internet", "Wyświetlacz", "Bateria", "Bezpieczeństwo", "System", about], 5), read(about, [["Nazwa urządzenia", "moto g54"], ["Model", "moto g54 5G"], ["IMEI", IMEI]], [1], [2])],
      example: field === "model" ? { value: "moto g54 5G" } : imeiEx,
    },
    {
      id: "oppo",
      label: "realme, OPPO",
      steps: [settings, list(["Wi‑Fi", "Bluetooth", "Wyświetlacz", "Bateria", "Aplikacje", "Informacje o urządzeniu"], 5), read("Informacje o urządzeniu", [["Nazwa urządzenia", "realme 11"], ["Model", "RMX3636"], ["IMEI", IMEI]], [0, 1], [2])],
      example: field === "model" ? { value: "realme 11", note: "albo model, np. RMX3636" } : imeiEx,
    },
    {
      id: "huawei",
      label: "Huawei, Honor",
      steps: [settings, list(["Wi‑Fi", "Bluetooth", "Wyświetlacz", "Bateria", "System i aktualizacje", about], 5), read(about, [["Nazwa urządzenia", "P30 Pro"], ["Model", "VOG-L29"], ["IMEI", IMEI]], [0, 1], [2])],
      example: field === "model" ? { value: "P30 Pro", note: "albo model, np. VOG-L29" } : imeiEx,
    },
  ];
}

function android(category: DeviceCategory | null, field: HelperField): HelperGuide {
  const variants = androidVariants(category, field);
  return {
    id: "android",
    tab: "Android",
    lead: field === "model" ? "Szukaj pozycji „Model” albo „Nazwa modelu”. Wybierz swoją markę, jeśli ścieżka wygląda inaczej." : "Szukaj pozycji „IMEI”, czasem w „Stan” albo „Status”.",
    steps: variants[0].steps,
    example: variants[0].example ?? { value: "" },
    variants,
  };
}

const zoomed = (title: string, text: string, on: Thing, rows: Pair[], hit: number[], plate = false): HelperStep => ({ title, text, scene: { kind: "thing", on, zoom: { rows, hit, plate } } });
const spot = (title: string, text: string, on: Thing): HelperStep => ({ title, text, scene: { kind: "thing", on } });

function genericLabel(tab = "Naklejka"): HelperGuide {
  return {
    id: "label",
    tab,
    lead: "Model jest zwykle na naklejce: na spodzie, z tyłu albo pod klapką baterii.",
    steps: [
      spot("Obejrzyj spód i tył", "Szukaj naklejki z kodem kreskowym albo napisu wytłoczonego w obudowie.", "generic"),
      zoomed("Znajdź słowo „Model”", "Przepisz to, co stoi przy „Model”, „Model No.” albo „Type”.", "generic", [["Model", "AB-1234"], ["S/N", SERIAL], ["Made in", "PRC"]], [0]),
    ],
    example: { value: "AB-1234", note: "dokładnie jak na naklejce" },
    tips: ["Nie możesz znaleźć? Wpisz nazwę z pudełka albo z dowodu zakupu."],
  };
}

function windowsGuide(laptop: boolean): HelperGuide {
  const name = laptop ? "Laptop 15 AB15-51" : "Komputer XY-500";
  return {
    id: "windows",
    tab: "Windows",
    lead: "Komputer się włącza? Model odczytasz w Ustawieniach systemu.",
    steps: [
      { title: "Otwórz Ustawienia › System", text: "Naciśnij Win + I albo kliknij Start › Ustawienia.", scene: { kind: "list", frame: "pc", title: "Ustawienia", rows: ["System", "Bluetooth i urządzenia", "Sieć i Internet", "Personalizacja", "Aplikacje", "Konta"], hit: 0 } },
      { title: "Przewiń do „Informacje”", text: "To ostatnia pozycja w „System”.", scene: { kind: "list", frame: "pc", title: "System", rows: ["Ekran", "Dźwięk", "Powiadomienia", "Zasilanie i bateria", "Magazyn", "Informacje"], hit: 5 } },
      {
        title: "Odczytaj model",
        text: "Producent i model są na górze tej strony.",
        scene: { kind: "info", frame: "pc", title: "Informacje", hero: [name, "Producent i model"], heroHit: true, rows: [["Nazwa urządzenia", "DESKTOP-7Q2K"], ["Procesor", "8 rdzeni, 3,2 GHz"], ["Zainstalowana pamięć RAM", "16 GB"]], hit: [] },
      },
    ],
    example: { value: name, note: "producenta wpisujesz w polu „Marka”" },
    tips: ["Nie widzisz modelu? Naciśnij Win + R, wpisz msinfo32 i znajdź „Model systemu”."],
  };
}

function macGuide(laptop: boolean, field: HelperField): HelperGuide {
  const hero: Pair = laptop ? ["MacBook Air", "13 cali, M1, 2020"] : ["iMac", "24 cale, M1, 2021"];
  return {
    id: "mac",
    tab: "Mac",
    lead: field === "model" ? "Nazwa i rok Maca są w oknie „Ten Mac”." : "Numer seryjny jest w tym samym oknie co nazwa modelu.",
    steps: [
      { title: "Kliknij logo Apple", text: "Menu Apple otwierasz logo w lewym górnym rogu ekranu.", scene: { kind: "menu", rows: ["Ten Mac", "Ustawienia systemowe…", "App Store…", "Ostatnie rzeczy", "Uśpij", "Uruchom ponownie…", "Wyłącz…"], hit: 0 } },
      field === "model"
        ? { title: "Wybierz „Ten Mac”", text: `Zobaczysz nazwę, np. ${hero[0]} (${hero[1].split(", ").slice(1).join(", ")}).`, scene: { kind: "info", frame: "mac", title: "Ten Mac", hero, heroHit: true, rows: [["Czip", "Apple M1"], ["Pamięć", "8 GB"], ["Numer seryjny", "C02XXXXXXXXX"], ["macOS", "Sequoia 15.1"]], hit: [] } }
        : { title: "Wybierz „Ten Mac”", text: "Numer seryjny jest pod nazwą modelu.", scene: { kind: "info", frame: "mac", title: "Ten Mac", hero, rows: [["Czip", "Apple M1"], ["Pamięć", "8 GB"], ["Numer seryjny", "C02XXXXXXXXX"], ["macOS", "Sequoia 15.1"]], hit: [2] } },
    ],
    example: field === "model" ? { value: `${hero[0]} (${hero[1].split(", ").slice(1).join(", ")})` } : { value: "C02XXXXXXXXX", note: "12 znaków, dokładnie jak w oknie" },
  };
}

function consoleVariants(field: HelperField): HelperVariant[] {
  const model = field === "model";
  const sticker = (rows: Pair[], hit: number[], text: string) => zoomed(model ? "Albo odwróć konsolę" : "Znajdź naklejkę", text, "console", rows, hit);
  return [
    {
      id: "playstation",
      label: "PlayStation",
      match: /\b(sony|playstation|ps ?[345])\b/,
      steps: [
        { title: "Otwórz Ustawienia › System", text: "Konsola się włącza? Ikona ustawień jest w prawym górnym rogu ekranu głównego.", scene: { kind: "list", frame: "tv", title: "Ustawienia", rows: ["Sieć", "Ekran i wideo", "Dźwięk", "Pamięć masowa", "System"], hit: 4 } },
        { title: "Oprogramowanie systemowe › Informacje o konsoli", text: "W PlayStation model jest w „Oprogramowanie systemowe”.", scene: { kind: "list", frame: "tv", title: "System", rows: ["Oprogramowanie systemowe", "Oszczędzanie energii", "Język", "Data i godzina"], hit: 0 } },
        { title: model ? "Odczytaj model" : "Odczytaj numer seryjny", scene: { kind: "info", frame: "tv", title: "Informacje o konsoli", rows: [["Nazwa modelu", "CFI-1216A"], ["Numer seryjny", "E0123456789"], ["Oprogramowanie systemowe", "24.06"]], hit: model ? [0] : [1] } },
        sticker([["MODEL NO.", "CFI-1216A"], ["S/N", "E0123456789"]], model ? [0] : [1], "Ta sama naklejka jest z tyłu albo pod spodem konsoli."),
      ],
      example: model ? { value: "PlayStation 5 CFI-1216A", note: "albo krótko: PS5" } : { value: "E0123456789" },
    },
    {
      id: "xbox",
      label: "Xbox",
      match: /\b(xbox|microsoft)\b/,
      steps: [
        { title: "Otwórz Ustawienia › System", text: "Naciśnij przycisk Xbox na padzie i wybierz Profil i system › Ustawienia.", scene: { kind: "list", frame: "tv", title: "Ustawienia", rows: ["Ogólne", "Konto", "Urządzenia i połączenia", "System"], hit: 3 } },
        { title: "Wybierz „Informacje o konsoli”", scene: { kind: "list", frame: "tv", title: "System", rows: ["Aktualizacje", "Magazyn", "Informacje o konsoli", "Język i lokalizacja"], hit: 2 } },
        { title: model ? "Odczytaj konsolę" : "Odczytaj numer seryjny", scene: { kind: "info", frame: "tv", title: "Informacje o konsoli", rows: [["Konsola", "Xbox Series X"], ["Numer seryjny konsoli", "012345678901"], ["Wersja systemu", "10.0.26100"]], hit: model ? [0] : [1] } },
        sticker([["Model", "1882"], ["S/N", "012345678901"]], model ? [0] : [1], "Naklejka z modelem jest z tyłu albo pod spodem konsoli."),
      ],
      example: model ? { value: "Xbox Series X", note: "albo model z naklejki, np. 1882" } : { value: "012345678901" },
    },
    {
      id: "switch",
      label: "Nintendo Switch",
      match: /\b(nintendo|switch)\b/,
      steps: [
        zoomed(model ? "Odwróć konsolę" : "Odwróć konsolę", model ? "Model jest na tylnej ściance, przy napisie „MODEL NO.”." : "Numer seryjny jest na spodzie, obok złącza stacji.", "console", [["MODEL NO.", "HEG-001"], ["S/N", "XTW12345678901"]], model ? [0] : [1]),
        { title: "Albo w menu: Ustawienia konsoli › System", text: "Numer seryjny zobaczysz na dole strony „System”.", scene: { kind: "list", frame: "tv", title: "Ustawienia konsoli", rows: ["Tryb samolotowy", "Ekran", "Internet", "System"], hit: 3 } },
      ],
      example: model ? { value: "Switch OLED HEG-001", note: "albo krótko: Switch, Switch Lite" } : { value: "XTW12345678901" },
    },
  ];
}

function consoleGuide(field: HelperField): HelperGuide {
  const variants = consoleVariants(field);
  return {
    id: "console",
    tab: "Konsola",
    lead: field === "model" ? "Model jest w menu konsoli i na naklejce z tyłu albo pod spodem. Wybierz swoją konsolę." : "Numer seryjny jest na naklejce z tyłu albo pod spodem konsoli.",
    steps: variants[0].steps,
    example: variants[0].example ?? { value: "" },
    variants,
    tips: field === "model" ? ["Naprawa pada? Wpisz nazwę konsoli i „pad”, np. „PS5, pad DualSense”."] : ["Pole jest opcjonalne: możesz je zostawić puste."],
  };
}

/* ---------- Guides per field and category ---------- */

function modelGuides(category: DeviceCategory | null): HelperGuide[] {
  switch (category) {
    case "phone":
    case "tablet":
      return [appleMobile(category, "model"), android(category, "model")];
    case "smartwatch":
      return [
        {
          id: "apple-watch",
          tab: "Apple Watch",
          lead: "Model sprawdzisz w aplikacji Watch na iPhonie, z którym zegarek jest połączony.",
          steps: [
            { title: "Otwórz aplikację Watch na iPhonie", scene: { kind: "home", frame: "phone", app: "Watch", icon: "watch" } },
            { title: "Stuknij „Ogólne”", text: "Na karcie „Mój zegarek”.", scene: { kind: "list", frame: "phone", title: "Mój zegarek", rows: ["Aplikacje", "Ogólne", "Ekran i jasność", "Dostępność", "Dźwięki i haptyka"], hit: 1 } },
            { title: "Stuknij „To urządzenie”", scene: { kind: "list", frame: "phone", title: "Ogólne", rows: ["To urządzenie", "Uaktualnienia", "Data i czas", "Język i region"], hit: 0 } },
            { title: "Odczytaj model", text: "Model jest w pozycji „Model”. Stuknij ją, żeby zobaczyć numer zaczynający się od A.", scene: { kind: "info", frame: "phone", title: "To urządzenie", rows: [["Nazwa", "Apple Watch"], ["Model", "A2473"], ["Numer seryjny", "H4XXXXXXXX"], ["Wersja", "11.1"]], hit: [1] } },
          ],
          example: { value: "Apple Watch Series 7 (A2473)", note: "albo sam numer zaczynający się od A" },
          tips: ["Na samym zegarku: Ustawienia › Ogólne › To urządzenie."],
        },
        {
          id: "galaxy-watch",
          tab: "Galaxy Watch",
          lead: "Aplikację Galaxy Wearable otwierasz na telefonie, z którym zegarek jest połączony.",
          steps: [
            { title: "Otwórz Galaxy Wearable", scene: { kind: "home", frame: "phone", app: "Galaxy Wearable", icon: "wearable" } },
            { title: "Stuknij „Ustawienia zegarka”", scene: { kind: "list", frame: "phone", title: "Galaxy Wearable", rows: ["Tarcze zegarka", "Kafelki", "Ustawienia zegarka", "Znajdź zegarek"], hit: 2 } },
            { title: "Stuknij „Informacje o zegarku”", text: "To ostatnia pozycja na liście.", scene: { kind: "list", frame: "phone", title: "Ustawienia zegarka", rows: ["Powiadomienia", "Aplikacje", "Wyświetlacz", "Bateria", "Informacje o zegarku"], hit: 4 } },
            { title: "Odczytaj model", scene: { kind: "info", frame: "phone", title: "Informacje o zegarku", rows: [["Nazwa modelu", "Galaxy Watch6"], ["Numer modelu", "SM-R930"], ["Numer seryjny", "RFAXXXXXXXX"]], hit: [0, 1], stack: true } },
          ],
          example: { value: "Galaxy Watch6 (SM-R930)" },
        },
        {
          id: "watch-other",
          tab: "Inny zegarek",
          lead: "Otwórz aplikację zegarka na telefonie i wejdź w informacje o urządzeniu.",
          steps: [
            { title: "Otwórz aplikację zegarka na telefonie", text: "Tę, w której parujesz zegarek i zmieniasz tarcze.", scene: { kind: "home", frame: "phone", app: "Aplikacja zegarka", icon: "watch" } },
            zoomed("Albo odwróć zegarek", "Model bywa też wygrawerowany na spodzie koperty.", "watch", [["Model", "W-2041"], ["S/N", "A1B2C3D4"]], [0], true),
          ],
          example: { value: "W-2041", note: "z aplikacji albo ze spodu koperty" },
        },
      ];
    case "laptop":
    case "desktop": {
      const laptop = category === "laptop";
      return [
        {
          id: "label",
          tab: "Naklejka",
          lead: laptop ? "Najpewniej: naklejka na spodzie laptopa." : "Naklejka z modelem jest zwykle z boku albo z tyłu obudowy.",
          steps: laptop
            ? [
                spot("Zamknij i odwróć laptopa", "Połóż go na miękkim, żeby nie porysować klapy.", "laptop"),
                zoomed("Znajdź „Model” albo „P/N”", "Odwróć laptopa: model jest na naklejce na spodzie, np. przy słowie „Model” albo „P/N”.", "laptop", [["Model", "AB15-51"], ["P/N", "NX.A1BCD.002"], ["S/N", SERIAL]], [0, 1]),
              ]
            : [
                spot("Obejrzyj bok i tył obudowy", "Naklejka bywa też na górze albo pod spodem.", "tower"),
                zoomed("Znajdź „Model”", "Przepisz to, co stoi przy „Model” albo „Product”.", "tower", [["Model", "XY-500"], ["Product", "XY500-01PL"], ["S/N", SERIAL]], [0]),
              ],
          example: laptop ? { value: "AB15-51", note: "albo P/N z naklejki" } : { value: "XY-500" },
          tips: laptop ? undefined : ["Komputer składany? Wpisz krótko, co to za zestaw, np. „składak, Ryzen 5, RTX 3060”."],
        },
        windowsGuide(laptop),
        macGuide(laptop, "model"),
      ];
    }
    case "console":
      return [consoleGuide("model")];
    case "printer":
      return [
        {
          id: "printer",
          tab: "Drukarka",
          lead: "Nazwa jest na przodzie, a pełny model na naklejce z tyłu albo pod klapą.",
          steps: [
            zoomed("Spójrz na przód drukarki", "Nazwa modelu jest zwykle na przodzie obudowy, przy panelu.", "printer", [["", "DeskJet 2720"]], [0], true),
            zoomed("Pełny model: z tyłu albo pod klapą", "Pełny model jest na naklejce z tyłu albo pod klapą (pokrywą skanera albo tuszów).", "printer-back", [["Model", "DeskJet 2720"], ["Product No.", "3XV18B"], ["S/N", "CN12A3B4C5"]], [0, 1]),
          ],
          example: { value: "DeskJet 2720", note: "nazwa z przodu wystarczy" },
        },
      ];
    case "data_recovery":
      return [
        {
          id: "drive",
          tab: "Dysk, pendrive, karta",
          lead: "Model i pojemność są na naklejce dysku albo na obudowie pendrive’a lub karty.",
          steps: [zoomed("Znajdź naklejkę na nośniku", "Model i pojemność są na naklejce dysku albo na obudowie pendrive’a lub karty, np. WD Blue 1 TB.", "drive", [["Model", "WD10SPZX"], ["Pojemność", "1 TB"], ["S/N", "WX12A3B4C5D6"]], [0, 1])],
          example: { value: "WD Blue 1 TB", note: "albo model z naklejki, np. WD10SPZX" },
          tips: ["Dane są w telefonie? Wybierz zakładkę telefonu i wpisz jego model."],
        },
        appleMobile(category, "model"),
        android(category, "model"),
      ];
    case "other":
      return [genericLabel(), appleMobile(category, "model"), android(category, "model")];
    default:
      return [appleMobile(category, "model"), android(category, "model"), genericLabel("Inne urządzenie")];
  }
}

function imeiGuides(category: DeviceCategory | null): HelperGuide[] {
  const optional = "Pole jest opcjonalne: możesz je zostawić puste.";
  const dialer: HelperGuide = {
    id: "dialer",
    tab: "Kod *#06#",
    lead: "Najszybciej: kod *#06# działa na każdym telefonie.",
    steps: [
      { title: "Otwórz aplikację Telefon", scene: { kind: "home", frame: "phone", app: "Telefon", icon: "phone" } },
      { title: "Wpisz *#06#", text: "Otwórz aplikację Telefon i wpisz *#06#. IMEI pojawi się od razu, bez dzwonienia.", scene: { kind: "dialer", typed: "*#06#" } },
      { title: "Przepisz IMEI", text: "Dwie karty SIM? Wpisz pierwszy numer.", scene: { kind: "dialer", typed: "*#06#", result: IMEI } },
    ],
    example: { value: IMEI_TYPED, note: "15 cyfr, bez spacji" },
  };
  const box: HelperGuide = {
    id: "box",
    tab: "Pudełko",
    lead: "IMEI jest na naklejce na pudełku, obok kodu kreskowego.",
    steps: [zoomed("Znajdź naklejkę na pudełku", "IMEI jest na naklejce na pudełku, obok kodu kreskowego.", "box", [["IMEI", IMEI_TYPED], ["S/N", "R5CWXXXXXXX"], ["Model", "SM-S911B/DS"]], [0])],
    example: { value: IMEI_TYPED, note: "15 cyfr, bez spacji" },
    tips: [optional],
  };
  const serialLabel = (on: Thing, where: string, id = "label", tab = "Naklejka"): HelperGuide => ({
    id,
    tab,
    lead: `Numer seryjny (S/N) jest na naklejce ${where}.`,
    steps: [zoomed("Znajdź „S/N” albo „Serial No.”", `Numer seryjny (S/N) jest na naklejce ${where}.`, on, [["Model", "AB-1234"], ["S/N", SERIAL]], [1])],
    example: { value: SERIAL, note: "litery i cyfry, dokładnie jak na naklejce" },
    tips: [optional],
  });
  switch (category) {
    case "phone":
      return [dialer, appleMobile(category, "imei"), android(category, "imei"), box];
    case "tablet":
      return [appleMobile(category, "imei"), android(category, "imei"), box];
    case "smartwatch":
      return [
        {
          id: "apple-watch",
          tab: "Apple Watch",
          lead: "Numer seryjny jest w aplikacji Watch na iPhonie.",
          steps: [
            { title: "Otwórz Watch › Ogólne › To urządzenie", scene: { kind: "list", frame: "phone", title: "Ogólne", rows: ["To urządzenie", "Uaktualnienia", "Data i czas"], hit: 0 } },
            { title: "Odczytaj numer seryjny", text: "Numer seryjny jest w pozycji „Numer seryjny”.", scene: { kind: "info", frame: "phone", title: "To urządzenie", rows: [["Nazwa", "Apple Watch"], ["Model", "A2473"], ["Numer seryjny", "H4XXXXXXXX"]], hit: [2] } },
          ],
          example: { value: "H4XXXXXXXX" },
          tips: [optional],
        },
        {
          id: "galaxy-watch",
          tab: "Galaxy Watch",
          lead: "Numer seryjny jest w Galaxy Wearable, w informacjach o zegarku.",
          steps: [
            { title: "Galaxy Wearable › Ustawienia zegarka › Informacje o zegarku", scene: { kind: "list", frame: "phone", title: "Ustawienia zegarka", rows: ["Powiadomienia", "Wyświetlacz", "Bateria", "Informacje o zegarku"], hit: 3 } },
            { title: "Odczytaj numer seryjny", text: "Numer seryjny jest na tej stronie, czasem w „Stan”.", scene: { kind: "info", frame: "phone", title: "Informacje o zegarku", rows: [["Nazwa modelu", "Galaxy Watch6"], ["Numer seryjny", "RFAXXXXXXXX"], ["Stan", "›"]], hit: [1], stack: true } },
          ],
          example: { value: "RFAXXXXXXXX" },
          tips: [optional],
        },
        { ...serialLabel("watch", "na spodzie koperty albo w aplikacji zegarka na telefonie", "watch-other", "Inny zegarek"), lead: "Numer seryjny jest zwykle na spodzie koperty albo w aplikacji zegarka na telefonie." },
      ];
    case "laptop":
    case "desktop":
      return [serialLabel(category === "laptop" ? "laptop" : "tower", category === "laptop" ? "na spodzie laptopa" : "z boku albo z tyłu obudowy"), macGuide(category === "laptop", "imei")];
    case "console":
      return [consoleGuide("imei")];
    case "printer":
      return [serialLabel("printer-back", "z tyłu drukarki albo pod klapą", "printer", "Drukarka")];
    case "data_recovery":
      return [serialLabel("drive", "dysku, pendrive’a albo na opakowaniu karty"), dialer];
    case "other":
      return [serialLabel("generic", "na spodzie albo z tyłu urządzenia"), dialer];
    default:
      return [dialer, appleMobile(category, "imei"), android(category, "imei"), box];
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

const normalize = (text: string) => text.toLocaleLowerCase("pl").normalize("NFKD").replace(/[̀-ͯ]/g, "");

/** Brand family from what the client typed in "Marka" (or "Model", e.g. "iPhone 13"). */
export function brandFamily(text: string): BrandFamily | null {
  const t = normalize(text);
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

/** First tab (and brand variant) to show: typed brand > category default > browsing system. */
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
  return { tab, variant: guide ? pickVariant(guide, ctx.brand, ctx.model) : null };
}

/** Brand variant of a guide that fits the typed brand/model (first variant otherwise). */
export function pickVariant(guide: HelperGuide, brand: string, model = ""): string | null {
  if (!guide.variants?.length) return null;
  const typed = normalize(`${brand} ${model}`);
  const fam = brandFamily(brand) ?? brandFamily(model);
  const byMatch = guide.variants.find((v) => v.match?.test(typed))?.id;
  const byFam = fam && guide.variants.some((v) => v.id === fam) ? fam : null;
  return byMatch ?? byFam ?? guide.variants[0].id;
}

/* ---------- Proposal from the browser (UA Client Hints) ---------- */

/** Categories where "this device" can be the one being reported. */
const SELF_CATEGORIES = new Set<DeviceCategory | null>(["phone", "tablet", null]);

/**
 * A model read by `navigator.userAgentData.getHighEntropyValues(['model'])` that may be
 * offered as "Wpisz do formularza". Only on Android, only for a phone, tablet or
 * not-yet-chosen category, never when the field already holds that value.
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
