import type { SearchEntry } from "./provider";

/** Built at build time from the Tech data (app/(public)/szukaj/indeks.json/route.ts). */
export const INDEX_URL = "/szukaj/indeks.json";

/**
 * One fetch per page load, shared by every caller (the shell stays mounted across pages).
 * Lives outside the window's chunk so LazySearchDialog can start it in parallel with the chunk.
 */
let indexRequest: Promise<SearchEntry[]> | null = null;
export function loadIndex(): Promise<SearchEntry[]> {
  indexRequest ??= fetch(INDEX_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`index ${r.status}`);
      return r.json() as Promise<SearchEntry[]>;
    })
    .catch(() => {
      // A passing error is not kept: the next request to search tries again.
      indexRequest = null;
      return Promise.reject(new Error("index"));
    });
  return indexRequest;
}
