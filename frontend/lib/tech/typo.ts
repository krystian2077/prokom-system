/**
 * Polish typesetting rules for rendered text (przegląd wizualny):
 * - no one-letter word at the end of a line ("sierotki": a, i, o, u, w, z) → the space after it
 *   becomes a no-break space;
 * - "ul." and a short house number stay with the street name ("Długa 8");
 * - no line break inside hyphenated names in headings ("Rabka-Zdrój") → an invisible
 *   word joiner (U+2060) follows the hyphen. Only text node values change, never the DOM
 *   structure, so React keeps updating these nodes safely.
 * Accepted copy stays word for word: only whitespace and wrapping change.
 */
export const NBSP = "\u00a0";

const ORPHAN = /(^|[\s(„"])([aiouwzAIOUWZ]) +/g;
/** "ul. Długa 16B," / "Polna 8" — the street abbreviation and a short house number stay with their word. */
const STREET = /(^|[\s,(])(ul\.|al\.|os\.|pl\.) +/g;
// RegExp constructor for the "u" flag: tsconfig targets ES5
const HOUSE_NO = new RegExp(String.raw`(\p{L}) +(\d{1,3}[A-Za-z]?)(?=,|\s·|\s*$)`, "gu");
export const WJ = "\u2060";
/** A hyphen inside a two-part place name ("Rabka-Zdrój", "Bielsko-Biała"); brand names in capitals
 * ("PRO-KOM") and codes ("USB-C") stay as they are. */
const HYPHEN = new RegExp(String.raw`(\p{Lu}\p{Ll}+)-(?=\p{Lu}\p{Ll})`, "gu");

export function polishText(text: string, noBreakHyphens = false): string {
  if (!text || text.length < 2) return text;
  // twice: in "i w domu" the first match eats the space the second one needs
  const out = text
    .replace(ORPHAN, `$1$2${NBSP}`)
    .replace(ORPHAN, `$1$2${NBSP}`)
    .replace(STREET, `$1$2${NBSP}`)
    .replace(HOUSE_NO, `$1${NBSP}$2`);
  return noBreakHyphens ? out.replace(HYPHEN, `$1-${WJ}`) : out;
}

/** Skipped: form fields, code, editable text and the repair wizard (its own session). */
export const TYPO_SKIP = "input, textarea, select, option, code, pre, script, style, [contenteditable], [data-no-typo], .t-wiz, .t-wizflow";
/** Where hyphenated words must not break: headings and short display lines. */
export const NOBREAK_IN = "h1, h2, h3, .t-lead, .t-eyb, .t-hero__sub";

function textNodes(root: Element): Text[] {
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      const p = n.parentElement;
      if (!p || !n.nodeValue || n.nodeValue.trim().length < 2) return NodeFilter.FILTER_REJECT;
      return p.closest(TYPO_SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    },
  });
  const out: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) out.push(n as Text);
  return out;
}

/** Applies the rules under root. Idempotent — safe to run after every render. */
export function typesetTree(root: Element) {
  for (const n of textNodes(root)) {
    const next = polishText(n.nodeValue as string, !!n.parentElement?.closest(NOBREAK_IN));
    if (next !== n.nodeValue) n.nodeValue = next;
  }
}
