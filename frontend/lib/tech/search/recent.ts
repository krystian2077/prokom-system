/**
 * Recent phrases of the search window, kept in this browser only (`localStorage`, max 5). Only
 * what the visitor chose to search for, never sent anywhere. Storage may be blocked (private
 * window, settings): every access is guarded and the window works without it.
 */
export const RECENT_KEY = "pk-tech-szukaj";
export const RECENT_MAX = 5;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function storage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readRecent(store: StorageLike | null = storage()): string[] {
  try {
    const raw = store?.getItem(RECENT_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string").slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

/** Puts the phrase first (case-insensitive duplicates removed); returns the new list. */
export function pushRecent(phrase: string, store: StorageLike | null = storage()): string[] {
  const clean = phrase.trim().slice(0, 60);
  if (clean.length < 2) return readRecent(store);
  const next = [clean, ...readRecent(store).filter((x) => x.toLowerCase() !== clean.toLowerCase())].slice(0, RECENT_MAX);
  try {
    store?.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: the list lasts until the window closes.
  }
  return next;
}

export function clearRecent(store: StorageLike | null = storage()): void {
  try {
    store?.removeItem(RECENT_KEY);
  } catch {
    // Nothing to clear.
  }
}
