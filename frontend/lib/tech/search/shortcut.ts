/** What a key press needs to tell; `typing`: the focus is in a field. */
export type ShortcutKey = { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean; typing: boolean };

/**
 * Keys that open the search (as on the other PRO-KOM lines): Ctrl/⌘ + K anywhere — it is never
 * typed — and „/” outside fields, without modifiers.
 */
export function isSearchShortcut(e: ShortcutKey): boolean {
  if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "k") return true;
  return e.key === "/" && !e.typing && !e.ctrlKey && !e.metaKey && !e.altKey;
}

/** The focus is in a field: „/” is typed there, not a shortcut. */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(el?.closest?.('input, textarea, select, [contenteditable=""], [contenteditable="true"]'));
}
