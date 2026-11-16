import { prepareIndex, searchIndex } from "./engine";

/**
 * What the search window and `/szukaj` show (pattern: prokom-web-hub `lineProvider.ts`): groups of
 * results over the Tech index (`build-index.ts`). Client-safe: no data imports, so the window's
 * bundle stays small and the index itself comes as JSON when the browser is idle.
 */

export type SearchGroupKey = "akcje" | "strony" | "urzadzenia" | "naprawy" | "usterki" | "punkty" | "pytania" | "blog";

export const GROUP_TITLES: Record<SearchGroupKey, string> = {
  akcje: "Szybkie akcje",
  strony: "Strony",
  urzadzenia: "Urządzenia",
  naprawy: "Naprawy",
  usterki: "Zgłoś usterkę",
  punkty: "Punkty serwisowe",
  pytania: "Pytania",
  blog: "Blog",
};

/** Icons of results (drawn by `SearchIcon`, the Tech stroke set). */
export type SearchIconName =
  | "page"
  | "phone"
  | "laptop"
  | "tablet"
  | "pc"
  | "console"
  | "printer"
  | "watch"
  | "data"
  | "wrench"
  | "pin"
  | "help"
  | "doc"
  | "track"
  | "call"
  | "truck"
  | "shield"
  | "user"
  | "map"
  // Quick actions and the sections of the empty window.
  | "copy"
  | "mail"
  | "route"
  | "chat"
  | "moon"
  | "sun"
  | "check"
  | "trend";

export type SearchEntry = {
  id: string;
  title: string;
  /** Second line: kind, short description. */
  hint?: string;
  href: string;
  group: SearchGroupKey;
  icon: SearchIconName;
  /** More words that should find it (description, answer, tags) — not shown. */
  text?: string;
  /** Other names that weigh like the title („Drukarka” for „Serwis drukarek”) — not shown. */
  aliases?: string;
  /** 0–100: orders equal hits. */
  popularity?: number;
};

export type SearchResult = Omit<SearchEntry, "text" | "popularity" | "aliases">;
export type SearchGroup = { key: SearchGroupKey; title: string; results: SearchResult[] };

/** Results per group in the window; `/szukaj` shows more. */
export const GROUP_LIMIT = 6;
export const PAGE_GROUP_LIMIT = 20;
/** A phrase of reasonable length only: the field is for words, not for pasted text. */
export const MAX_QUERY = 120;

/** Words that mean the same in a service (spelling, slang, English names). */
export const SYNONYMS: readonly string[] = [
  "bateria, akumulator, ogniwo",
  "ekran, wyswietlacz, szybka, lcd, oled, matryca, dotyk",
  "telefon, smartfon, komorka, smartphone",
  "laptop, notebook, macbook",
  "komputer, pc, stacjonarny, desktop",
  "konsola, playstation, xbox, nintendo",
  "smartwatch, zegarek, watch",
  "zalanie, zalany, woda, wilgoc, plyn",
  "ladowanie, ladowarka, gniazdo, port, usb",
  "status, sledzenie",
  "folia, szklo, hammer, ochrona",
  "kurier, wysylka, paczka",
  "dane, odzyskiwanie, dysk, pendrive, karta",
  "godziny, otwarte, czynne",
];

/** Words that say nothing on their own in a query. */
export const STOP_WORDS: readonly string[] = ["na", "do", "od", "ze", "we", "sie", "jak", "czy", "mi", "mam", "moj", "moja", "mojego", "jest"];

/** Phrases of „Najczęściej szukane” with their target pages: `shortcuts.ts` (`POPULAR_PHRASES`). */

export type Provider = {
  /** Groups for a query; an empty list means nothing found. */
  query(q: string, limit?: number): SearchGroup[];
  /** Count of all matches (for the measurement and „Pokaż wszystkie”). */
  count(q: string): number;
};

const strip = ({ text: _text, popularity: _popularity, aliases: _aliases, ...rest }: SearchEntry): SearchResult => rest;

export function buildProvider(entries: readonly SearchEntry[]): Provider {
  const prepared = prepareIndex(
    entries.map((e) => ({ item: e, name: e.aliases ? `${e.title} ${e.aliases}` : e.title, hay: [e.hint, e.text].filter(Boolean).join(" "), popularity: e.popularity })),
    SYNONYMS,
    STOP_WORDS,
  );
  const found = (q: string) => searchIndex(prepared, q.slice(0, MAX_QUERY)) ?? [];
  return {
    count: (q) => found(q).length,
    query(q, limit = GROUP_LIMIT) {
      const groups = new Map<SearchGroupKey, SearchResult[]>();
      for (const entry of found(q)) {
        const list = groups.get(entry.group) ?? [];
        if (list.length < limit) list.push(strip(entry));
        groups.set(entry.group, list);
      }
      // Group of the best hit first (Map keeps the order of the first result of each group).
      return Array.from(groups, ([key, results]) => ({ key, title: GROUP_TITLES[key], results }));
    },
  };
}
