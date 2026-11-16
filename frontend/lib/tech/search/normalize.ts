/**
 * Search form of a text (pattern: prokom-web-hub `lib/shared/search/normalize.ts`): lower case,
 * `ł → l` (NFD does not split it), no diacritics, single spaces. The index and the query are
 * normalized the same way, so „łatwo”, „Łatwo” and „latwo” are one word.
 */
/** Combining marks left by NFD (accents of ą, ć, ę, ń, ó, ś, ź, ż). */
const COMBINING = new RegExp("[\\u0300-\\u036f]", "g");

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(COMBINING, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * One character folded like `normalizeText`, but always to exactly one character, so a folded
 * title keeps the positions of the original one (highlighting the hit in the visible text).
 */
export function foldChar(ch: string): string {
  const lower = ch.toLowerCase();
  if (lower === "ł") return "l";
  const base = lower.normalize("NFD").replace(COMBINING, "");
  return base.length === 1 ? base : lower.length === 1 ? lower : " ";
}

export function foldKeepLength(text: string): string {
  return text.split("").map(foldChar).join("");
}

/**
 * Polish endings, longest first. Stripped from a normalized word to get a rough stem: „ekranu”,
 * „ekranem”, „ekrany” → „ekran”; „laptopów”, „laptopa” → „laptop”; „baterii” → „bater”.
 * Deliberately crude: the stem is only compared as a prefix of the indexed words, and a typo
 * check stays behind it for what it misses.
 */
const ENDINGS = [
  "owie", "ach", "ek", "ami", "iem", "iej", "ego", "emu", "ych", "ymi", "owi", "ow", "om", "ie", "ii", "ia", "iu", "ej", "em", "ym", "a", "e", "i", "o", "u", "y",
];
/** Below this the stem would find too much („do” → „d”). */
export const STEM_MIN = 4;

export function stem(word: string): string {
  for (const ending of ENDINGS) {
    if (word.length - ending.length >= STEM_MIN && word.endsWith(ending)) return word.slice(0, -ending.length);
  }
  return word;
}
