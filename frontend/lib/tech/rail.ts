/**
 * Side rail logic (pattern: prokom-web-hub `lib/site/railActive.ts`, `lib/shared/rail.ts`,
 * `lib/shared/smoothScroll.ts`): which section is being read, how far the progress line goes,
 * which icon a section gets, and the gliding jump. Pure functions are unit-tested; `glideTo`
 * needs a browser.
 */

/** Share of the screen height a section's top must pass to count as the one being read. */
export const RAIL_LINE = 0.4;
/** Fewer marked sections than this and the rail shows no „Na tej stronie” list. */
export const RAIL_MIN_SECTIONS = 3;
/** Layout with the rail (tech-rail.css: from 1424 px the margin fits it clear of the content). */
export const RAIL_QUERY = "(min-width: 1424px)";

/**
 * The section the rail marks: the last one whose top has passed 40% of the screen, the first
 * before any has, the last at the bottom of the page (a short last section never reaches the line).
 */
export function activeSection(sections: { id: string; top: number }[], viewportHeight: number, atBottom: boolean): string | null {
  if (sections.length === 0) return null;
  if (atBottom) return sections[sections.length - 1].id;
  const line = viewportHeight * RAIL_LINE;
  let current = sections[0].id;
  for (const s of sections) if (s.top <= line) current = s.id;
  return current;
}

/**
 * Where the progress line ends, as a position in the list: the index of the section being read
 * plus the share of it read so far (its top to the next one's top past the 40% line).
 */
export function railProgress(tops: number[], viewportHeight: number, atBottom: boolean): number {
  if (tops.length === 0) return 0;
  const last = tops.length - 1;
  if (atBottom) return last;
  const line = viewportHeight * RAIL_LINE;
  let index = -1;
  tops.forEach((top, i) => {
    if (top <= line) index = i;
  });
  if (index < 0) return 0;
  if (index === last) return last;
  const span = tops[index + 1] - tops[index];
  const read = span > 0 ? (line - tops[index]) / span : 0;
  return index + Math.min(1, Math.max(0, read));
}

/** Filled share of a line drawn from the first entry's centre to the last one's (px centres). */
export function railLineEnd(position: number, centers: number[]): number {
  if (centers.length < 2) return 0;
  const first = centers[0];
  const length = centers[centers.length - 1] - first;
  if (length <= 0) return 0;
  const index = Math.min(centers.length - 1, Math.max(0, Math.floor(position)));
  const next = centers[Math.min(centers.length - 1, index + 1)];
  const end = centers[index] + (next - centers[index]) * (position - index);
  return Math.min(1, Math.max(0, (end - first) / length));
}

/** Icons of the rail (drawn by `RailIcon`, the Tech stroke set). */
export type RailIconName =
  | "start"
  | "flag"
  | "devices"
  | "wrench"
  | "pin"
  | "steps"
  | "shield"
  | "star"
  | "map"
  | "help"
  | "clock"
  | "check"
  | "list"
  | "box"
  | "truck"
  | "doc"
  | "chat"
  | "symptom"
  | "data"
  | "tag"
  | "bulb"
  | "info"
  | "layers"
  | "link"
  | "user"
  | "form"
  | "warning";

/** Section ids of every Tech page (and of the repair page templates) → icon. */
const BY_ID: Record<string, RailIconName> = {
  start: "start",
  // sales catalogue on the home page and the ALSEN partner section (19.11)
  sprzedaz: "box",
  alsen: "link",
  katalog: "box",
  dobor: "check",
  porownaj: "list",
  zapytanie: "form",
  naprawy: "devices",
  urzadzenia: "devices",
  "inne-urzadzenia": "devices",
  usterki: "wrench",
  serwis: "wrench",
  czesci: "layers",
  punkty: "pin",
  salony: "pin",
  "konkretne-naprawy": "wrench",
  kategoria: "tag",
  "gdzie-oddac": "pin",
  "gdzie-wyslac": "pin",
  "jak-oddac": "pin",
  wizytowka: "pin",
  proces: "steps",
  przebieg: "steps",
  kroki: "steps",
  "jak-to-dziala": "steps",
  "jak-wycinamy": "steps",
  jak: "steps",
  "od-czego-zaczac": "steps",
  hammer: "shield",
  "hammer-glass": "shield",
  folie: "shield",
  gwarancja: "shield",
  dane: "shield",
  dlaczego: "star",
  sprawdz: "star",
  "sprawdz-sam": "star",
  "co-dostajesz": "star",
  "o-firmie": "info",
  "o-serwisie": "info",
  zasady: "check",
  okolice: "map",
  okolica: "map",
  miejscowosci: "map",
  faq: "help",
  pytania: "help",
  problem: "warning",
  godziny: "clock",
  "bez-umawiania": "clock",
  "zanim-przyjdziesz": "list",
  przygotuj: "list",
  poradnik: "bulb",
  poradniki: "bulb",
  "jak-spakowac": "box",
  "kto-placi": "tag",
  oplacalnosc: "tag",
  objawy: "symptom",
  przyczyny: "symptom",
  "po-naprawie": "check",
  kontakt: "chat",
  formularz: "form",
  blog: "doc",
  wpisy: "doc",
  wpis: "doc",
  "tresc-dokumentu": "doc",
  powiazane: "link",
  wiecej: "link",
  marki: "tag",
  "z-czym": "devices",
  offline: "warning",
  "404": "warning",
};

/** Parts of an id that tell enough on their own (new sections of the content sessions). */
const BY_PART: [RegExp, RailIconName][] = [
  [/pytan|faq/, "help"],
  [/punkt|blizej|gdzie/, "pin"],
  [/krok|jak-|proces|przebieg/, "steps"],
  [/gwaranc|bezpiecz|ochron/, "shield"],
  [/objaw|przyczyn|usterk/, "symptom"],
  [/miejscow|okolic|dojazd/, "map"],
  [/godzin|czas/, "clock"],
  [/kurier|wysyl|paczk/, "truck"],
  [/dane|dysk/, "data"],
  [/blog|wpis|porad/, "bulb"],
  [/kontakt|zadzwon/, "chat"],
  [/marki|cen|koszt/, "tag"],
];

/** Icon of a section by its id: exact id, then a telling part of it, else a plain document. */
export function railIcon(id: string): RailIconName {
  if (BY_ID[id]) return BY_ID[id];
  for (const [re, icon] of BY_PART) if (re.test(id)) return icon;
  return "doc";
}

/** Home page sections (the „Strona główna” group on subpages); checked against `/` in szyna.spec. */
export const HOME_SECTIONS: { id: string; label: string }[] = [
  { id: "start", label: "Start" },
  { id: "naprawy", label: "Co naprawiamy" },
  { id: "usterki", label: "Najczęstsze naprawy" },
  { id: "punkty", label: "Punkty serwisowe" },
  { id: "proces", label: "Jak to działa" },
  { id: "hammer", label: "Hammer Glass" },
  { id: "sprzedaz", label: "Sprzedaż" },
  { id: "alsen", label: "Partner ALSEN" },
  { id: "dlaczego", label: "Dlaczego" },
  { id: "okolice", label: "Miejscowości" },
  { id: "faq", label: "Pytania" },
];

/** „9 sekcji”, „3 sekcje”, „1 sekcja”. */
export function sectionsCount(count: number): string {
  const tens = count % 100;
  const ones = count % 10;
  const word = count === 1 ? "sekcja" : ones >= 2 && ones <= 4 && (tens < 12 || tens > 14) ? "sekcje" : "sekcji";
  return `${count} ${word}`;
}

/* ---------- Gliding jump ---------- */

/** Room for the sticky capsule when a section has no `scroll-margin-top` of its own. */
export const HEADER_OFFSET = 104;
const STOP_EVENTS = ["wheel", "touchstart", "keydown"] as const;

/** Duration of the glide for a distance in px: longer for a longer way (520–1100 ms). */
export function scrollDuration(distance: number): number {
  return Math.round(Math.min(1100, Math.max(520, Math.abs(distance) * 0.35)));
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function sectionOffset(scrollMarginTop: string): number {
  const margin = Number.parseFloat(scrollMarginTop);
  return Number.isFinite(margin) && margin > 0 ? margin : HEADER_OFFSET;
}

/**
 * Glides to the element (easing in and out), then marks it as arrived for a moment
 * (`data-arrive`, tech-rail.css). Reduced motion: a plain jump. The visitor's own wheel, touch
 * or key stops the glide where it is.
 */
export function glideTo(element: HTMLElement, reduced: boolean): void {
  const offset = sectionOffset(getComputedStyle(element).scrollMarginTop);
  // Read again on every frame: lazy images on the way may change the page height.
  const target = () => element.getBoundingClientRect().top + window.scrollY - offset;
  const from = window.scrollY;
  const distance = target() - from;
  // `instant`: the page has `scroll-behavior: smooth`, which would smooth every frame again.
  const jump = (y: number) => window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
  if (reduced || Math.abs(distance) < 4) {
    jump(target());
    return;
  }
  const duration = scrollDuration(distance);
  const start = performance.now();
  let done = false;
  const stop = () => {
    done = true;
    STOP_EVENTS.forEach((type) => window.removeEventListener(type, stop));
  };
  const finish = () => {
    if (done) return;
    stop();
    jump(target());
    arrive(element);
  };
  const step = (now: number) => {
    if (done) return;
    const t = Math.min(1, (now - start) / duration);
    jump(from + (target() - from) * easeInOutCubic(t));
    if (t < 1) requestAnimationFrame(step);
    else finish();
  };
  STOP_EVENTS.forEach((type) => window.addEventListener(type, stop, { passive: true }));
  requestAnimationFrame(step);
  // A tab that paints no frames (in the background) still ends up at the section.
  window.setTimeout(finish, duration + 150);
}

function arrive(element: HTMLElement) {
  element.removeAttribute("data-arrive");
  void element.offsetWidth; // restart the animation when the same section is picked twice
  element.setAttribute("data-arrive", "");
  window.setTimeout(() => element.removeAttribute("data-arrive"), 1400);
}
