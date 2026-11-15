import { foldKeepLength, normalizeText, stem, STEM_MIN } from "./normalize";

/**
 * Search engine of the Tech site — a port of the lines' shared engine (prokom-web-hub
 * `lib/shared/search/engine.ts`) for a small static index: every token must match; a hit in the
 * title weighs 3, through a Polish stem 2 in the title; elsewhere 1, a stem 0.9, a synonym 1,
 * a typo 0.6; tokens under 4 letters count only at the start of a word; `popularity / 200` orders
 * equal hits. Runs on the client (dialog) and on the server (`/szukaj`) over the same index.
 */

const NAME_HIT = 3;
const HAY_HIT = 1;
const SYNONYM_HIT = 1;
const STEM_NAME_HIT = 2;
const STEM_HAY_HIT = 0.9;
const TYPO_HIT = 0.6;
/** Words shorter than this are not compared for typos. */
const TYPO_MIN_TOKEN = 4;

export type SearchText = { text: string; all: string[]; words: string[]; stems: string[] };

export type EngineEntry<T> = {
  item: T;
  /** Title: a hit there weighs the most. */
  name: string;
  /** All words that should find it, the title included. */
  hay: string;
  popularity?: number;
};

type Prepared<T> = { item: T; name: SearchText; own: SearchText; popularity: number };

export type PreparedIndex<T> = { entries: Prepared<T>[]; synonyms: Map<string, string[]>; stopWords: Set<string> };

/** Optimal string alignment distance: insertions, deletions, substitutions, adjacent swaps. */
export function damerauLevenshtein(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return Math.max(a.length, b.length);
  const rows: number[][] = [];
  for (let i = 0; i <= a.length; i++) rows.push([i]);
  for (let j = 1; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    const row = rows[i];
    const prev = rows[i - 1];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) value = Math.min(value, rows[i - 2][j - 2] + 1);
      row[j] = value;
    }
  }
  return rows[a.length][b.length];
}

const splitWords = (text: string) => text.split(/[^a-z0-9]+/).filter(Boolean);

/** Tokens of a query: normalized, split on non-alphanumerics, without stop words. */
export function tokenize(query: string, stopWords: Set<string> = new Set()): string[] {
  // One letter („z dysku”, „w laptopie”) would match nearly everything.
  return splitWords(normalizeText(query)).filter((t) => (t.length > 1 || /\d/.test(t)) && !stopWords.has(t));
}

export function searchText(text: string): SearchText {
  const words = splitWords(text);
  return { text, all: words, words: words.filter((w) => w.length > 2), stems: words.filter((w) => w.length >= STEM_MIN).map(stem) };
}

/** Synonym groups („bateria, akumulator”): every word of a group expands to the others. */
export function synonymMap(groups: readonly string[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const group of groups) {
    const words = group.split(",").map(normalizeText).filter(Boolean);
    for (const word of words) map.set(word, Array.from(new Set([...(map.get(word) ?? []), ...words.filter((o) => o !== word)])));
  }
  return map;
}

export function prepareIndex<T>(entries: readonly EngineEntry<T>[], synonyms: readonly string[] = [], stopWords: readonly string[] = []): PreparedIndex<T> {
  return {
    entries: entries.map((e) => ({
      item: e.item,
      name: searchText(normalizeText(e.name)),
      own: searchText(normalizeText(`${e.name} ${e.hay}`)),
      popularity: e.popularity ?? 0,
    })),
    synonyms: synonymMap(synonyms),
    stopWords: new Set(stopWords.map(normalizeText)),
  };
}

type Hit = "exact" | "synonym" | "stem" | "typo";

/** Shorter tokens („nie”, „ps5”) count only at the start of a word: inside „telefonie” „nie” says nothing. */
const SUBSTRING_MIN = 4;

const contains = ({ text, all }: SearchText, token: string) => (token.length >= SUBSTRING_MIN ? text.includes(token) : all.some((w) => w.startsWith(token)));

/** How a token hits a text: as is, through its stem, through a synonym, with a typo — or not. */
export function textHit(t: SearchText, token: string, synonyms: Map<string, string[]>): Hit | null {
  if (contains(t, token)) return "exact";
  if (token.length >= STEM_MIN) {
    const s = stem(token);
    if (s.length >= STEM_MIN && t.stems.some((w) => w.startsWith(s) || s.startsWith(w))) return "stem";
  }
  if (synonyms.get(token)?.some((x) => contains(t, x))) return "synonym";
  if (token.length >= TYPO_MIN_TOKEN) {
    const limit = token.length >= 7 ? 2 : 1;
    for (const word of t.words) {
      if (damerauLevenshtein(token, word.slice(0, token.length)) <= limit || damerauLevenshtein(token, word) <= limit) return "typo";
    }
  }
  return null;
}

function tokenScore<T>(entry: Prepared<T>, token: string, synonyms: Map<string, string[]>): number {
  // The title first: a hint or a text that also has the word must not hide a title hit.
  const inName = textHit(entry.name, token, synonyms);
  if (inName === "exact") return NAME_HIT;
  if (inName === "stem") return STEM_NAME_HIT;
  switch (textHit(entry.own, token, synonyms)) {
    case "exact":
      return HAY_HIT;
    case "synonym":
      return SYNONYM_HIT;
    case "stem":
      return STEM_HAY_HIT;
    case "typo":
      return TYPO_HIT;
    default:
      return 0;
  }
}

/** Items matching every token, best first (stable for equal scores); `null` for no tokens. */
export function searchIndex<T>(prepared: PreparedIndex<T>, query: string): T[] | null {
  const tokens = tokenize(query, prepared.stopWords);
  if (tokens.length === 0) return null;
  const scored: { item: T; score: number }[] = [];
  for (const entry of prepared.entries) {
    let score = 0;
    for (const token of tokens) {
      const hit = tokenScore(entry, token, prepared.synonyms);
      if (hit === 0) {
        score = 0;
        break;
      }
      score += hit;
    }
    if (score > 0) scored.push({ item: entry.item, score: score + entry.popularity / 200 });
  }
  return scored.sort((a, b) => b.score - a.score).map(({ item }) => item);
}

export type Mark = { text: string; hit: boolean };

/**
 * The title split into plain and highlighted parts: where a query token (or its stem) starts a
 * word or appears inside one. Positions come from a fold that keeps the length of the title.
 */
export function highlight(title: string, query: string): Mark[] {
  const folded = foldKeepLength(title);
  const marks = new Array<boolean>(title.length).fill(false);
  for (const token of tokenize(query)) {
    const needles = Array.from(new Set([token, token.length >= STEM_MIN ? stem(token) : token]));
    for (const needle of needles) {
      if (needle.length < 2) continue;
      let from = 0;
      let at = folded.indexOf(needle, from);
      while (at !== -1) {
        for (let i = at; i < at + needle.length; i++) marks[i] = true;
        from = at + needle.length;
        at = folded.indexOf(needle, from);
      }
    }
  }
  const out: Mark[] = [];
  for (let i = 0; i < title.length; i++) {
    const last = out[out.length - 1];
    if (last && last.hit === marks[i]) last.text += title[i];
    else out.push({ text: title[i], hit: marks[i] });
  }
  return out;
}
