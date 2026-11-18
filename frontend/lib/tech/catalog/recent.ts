/**
 * „Ostatnio oglądane” (runda 18.11 v2 §3): the last model cards opened on this device, kept only in
 * localStorage (no tracking, nothing leaves the browser).
 */
export const RECENT_KEY = "pk-tech-ostatnie";
export const RECENT_MAX = 6;

/** Newest first, no duplicates, at most RECENT_MAX. */
export function addRecent(list: string[], slug: string): string[] {
  return [slug, ...list.filter((s) => s !== slug)].slice(0, RECENT_MAX);
}

export function readRecent(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((s): s is string => typeof s === "string").slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

export function rememberModel(slug: string): void {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(addRecent(readRecent(), slug)));
  } catch {
    // private mode: nothing to remember
  }
}
