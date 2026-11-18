/**
 * The same theme on every PRO-KOM line (docs/tech/MOTYW-PASEK-LINII.md §3). Each domain has its own
 * localStorage, so the choice travels in the address of a link to another of our domains — added
 * only for the moment of the click (the HTML and a copied link stay clean) — and the receiving page
 * reads it in the head script, then removes it from the address after hydration.
 */
import { lines } from "@/config/prokom";
import { THEME_PARAM, THEME_PARAM_VALUES, type ThemeChoice } from "./theme";

/** Our hosts: every line's domain, its www. form and a staging. host (config/prokom.ts → lines). */
export function ourHosts(domains: readonly string[] = lines.map((l) => l.domain)): Set<string> {
  return new Set(domains.flatMap((d) => [d, `www.${d}`, `staging.${d}`]));
}

/**
 * The href to follow with the choice added, or null when the link is not ours (other domains,
 * mailto:, tel:, same-host links — the same localStorage already holds the choice).
 */
export function carryHref(href: string, currentHost: string, choice: ThemeChoice, hosts: Set<string> = ourHosts()): string | null {
  let url: URL;
  try {
    url = new URL(href, `https://${currentHost}/`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.host === currentHost || !hosts.has(url.hostname)) return null;
  url.searchParams.set(THEME_PARAM, THEME_PARAM_VALUES[choice]);
  return url.toString();
}

/** The address without ?motyw (keeps the rest of the query and the #hash), or null if it had none. */
export function withoutThemeParam(href: string): string | null {
  const url = new URL(href);
  if (!url.searchParams.has(THEME_PARAM)) return null;
  url.searchParams.delete(THEME_PARAM);
  return `${url.pathname}${url.search}${url.hash}`;
}
