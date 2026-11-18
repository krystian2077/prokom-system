/**
 * Quick actions of the search window (pattern: prokom-web `lib/shared/search/palette.ts`, the
 * Biznes line's „Zadzwoń · Drugi numer · Kopiuj numer · E-mail · Trasa · Zapytanie · Kontakt ·
 * Motyw”) for the Tech service. Every value comes from `config/prokom.ts` and the existing helpers
 * (`telHref`, `pointPhone`, `directionsUrl`); an action without its data is left out, and a point
 * appears only when published (never a draft, also on staging). Client-safe and pure: the window
 * and `/szukaj` render the same list.
 */
import { GENERAL_PHONE_LABEL, line, pointPhone, servicePoints, telHref, type ServicePoint } from "@/config/prokom";
import { getOpeningStatus } from "../hours";
import { SUBMIT_HREF, TRACK_HREF, directionsUrl } from "../nav";
import { publishedPoints } from "../points";
import { normalizeText } from "./normalize";
import type { SearchIconName } from "./provider";

export type QuickKind = "call" | "call2" | "copy" | "mail" | "route" | "submit" | "track" | "contact" | "theme";

export type QuickAction = {
  /** Unique: `route:zakopane` for the routes to each point. */
  id: string;
  kind: QuickKind;
  /** Full name (a result row, the accessible name of a tile). */
  label: string;
  /** Word on the tile („Zadzwoń”, „Trasa”). */
  short: string;
  /** Small line under it on the tile („Zakopane”, the number). */
  sub: string;
  /** Second line: the number, the point, what happens. */
  hint: string;
  icon: SearchIconName;
  /** Link to open; `copy` and `theme` run in the window instead. */
  href?: string;
  /** Opens outside the site (Google Maps): a new tab. */
  external?: boolean;
  /** What `copy` puts on the clipboard. */
  value?: string;
  /** Measurement through `data-track` (TrackClicks), SPEC §12.5 names only. */
  track?: { event: "telefon_klik" | "nawigacja_klik" | "zgloszenie_start"; params: Record<string, string> };
  /** Normalized key words that bring the action into the results. */
  words: string[];
};

const words = (...list: string[]) => list.map(normalizeText);
const pointName = (p: ServicePoint) => p.name;

/**
 * The point the „Trasa” tile leads to: open now, else the one opening soonest (the visitor is
 * likely to go there next); without hours or `now` — the first published point.
 */
export function routePoint(points: readonly ServicePoint[], now?: Date): ServicePoint | null {
  const withGeo = points.filter((p) => p.geo);
  if (!withGeo.length) return null;
  if (!now) return withGeo[0];
  let best = withGeo[0];
  let bestMinutes = Number.POSITIVE_INFINITY;
  for (const p of withGeo) {
    const minutes = getOpeningStatus(p, now)?.minutesToOpen ?? Number.POSITIVE_INFINITY;
    if (minutes < bestMinutes) {
      best = p;
      bestMinutes = minutes;
    }
  }
  return best;
}

const routeAction = (p: ServicePoint, id: string): QuickAction => ({
  id,
  kind: "route",
  label: `Trasa do punktu ${pointName(p)}`,
  short: "Trasa",
  sub: pointName(p),
  hint: [p.street, p.city].filter(Boolean).join(", "),
  icon: "route",
  href: directionsUrl(p.geo!),
  external: true,
  track: { event: "nawigacja_klik", params: { punkt: p.key, aplikacja: "google" } },
  words: words("trasa", "dojazd", "mapa", "nawigacja", "adres", "gdzie", "dojechac", normalizeText(p.city)),
});

export type QuickActionsInput = { points?: readonly ServicePoint[]; now?: Date };

/** The tiles of the empty window, in a fixed order. */
export function quickActions({ points = publishedPoints(servicePoints), now }: QuickActionsInput = {}): QuickAction[] {
  const published = points.filter((p) => p.published);
  const out: QuickAction[] = [];
  const main = published.find((p) => pointPhone(p) === line.phone) ?? null;
  out.push({
    id: "call",
    kind: "call",
    label: `Zadzwoń · ${line.phoneDisplay}`,
    short: "Zadzwoń",
    sub: main ? pointName(main) : GENERAL_PHONE_LABEL,
    hint: main ? `${line.phoneDisplay} · ${pointName(main)}` : `${line.phoneDisplay} · ${GENERAL_PHONE_LABEL.toLowerCase()}`,
    icon: "call",
    href: telHref(line.phone),
    track: { event: "telefon_klik", params: { miejsce: "szukaj" } },
    words: words("zadzwon", "dzwon", "tel", "numer", "kontakt", "infolinia", ...(main ? [main.city] : [])),
  });
  // Another published point with its own number („Drugi numer” of the pattern).
  for (const p of published) {
    if (pointPhone(p) === line.phone) continue;
    out.push({
      id: `call2:${p.key}`,
      kind: "call2",
      label: `Zadzwoń · ${pointName(p)}`,
      short: "Zadzwoń",
      sub: pointName(p),
      hint: `${pointPhone(p).replace(/^\+48\s?/, "")} · punkt ${pointName(p)}`,
      icon: "call",
      href: telHref(pointPhone(p)),
      track: { event: "telefon_klik", params: { miejsce: `szukaj_${p.key}` } },
      words: words("zadzwon", "dzwon", "tel", "numer", "drugi", p.city),
    });
  }
  out.push({
    id: "copy",
    kind: "copy",
    label: "Skopiuj numer",
    short: "Kopiuj numer",
    sub: line.phoneDisplay,
    hint: line.phoneDisplay,
    icon: "copy",
    value: line.phoneDisplay,
    words: words("kopiuj", "skopiuj", "numer", "tel"),
  });
  out.push({
    id: "mail",
    kind: "mail",
    label: `Napisz e-mail · ${line.email}`,
    short: "E-mail",
    sub: "Napisz",
    hint: line.email,
    icon: "mail",
    href: `mailto:${line.email}`,
    words: words("mail", "email", "e-mail", "napisz", "poczta", "wiadomosc"),
  });
  const route = routePoint(published, now);
  if (route) out.push(routeAction(route, "route"));
  out.push({
    id: "submit",
    kind: "submit",
    label: "Zgłoś naprawę online",
    short: "Zgłoś naprawę",
    sub: "Online",
    hint: "Formularz — kilka minut",
    icon: "wrench",
    href: SUBMIT_HREF,
    track: { event: "zgloszenie_start", params: { zrodlo: "przycisk" } },
    words: words("zglos", "zgloszenie", "naprawa", "formularz", "zamow", "oddaj"),
  });
  out.push({
    id: "track",
    kind: "track",
    label: "Sprawdź status naprawy",
    short: "Status",
    sub: "Po numerze",
    hint: "Po numerze zgłoszenia",
    icon: "track",
    href: TRACK_HREF,
    words: words("status", "sledzenie", "sprawdz", "gdzie", "numer", "zgloszenia"),
  });
  out.push({
    id: "contact",
    kind: "contact",
    label: "Kontakt",
    short: "Kontakt",
    sub: "Formularz",
    hint: "Telefon, e-mail, formularz",
    icon: "chat",
    href: "/kontakt",
    words: words("kontakt", "formularz", "napisz", "wiadomosc"),
  });
  out.push({
    id: "theme",
    kind: "theme",
    label: "Motyw jasny / ciemny",
    short: "Motyw",
    sub: "Jasny / ciemny",
    hint: "Przełącz wygląd strony",
    icon: "moon",
    words: words("motyw", "ciemny", "jasny", "tryb", "noc", "dark"),
  });
  return out;
}

/** Routes to every published point (the results of „trasa”, „dojazd zakopane”). */
export function routeActions(points: readonly ServicePoint[] = publishedPoints(servicePoints)): QuickAction[] {
  return points.filter((p) => p.published && p.geo).map((p) => routeAction(p, `route:${p.key}`));
}

/**
 * Kinds shown as tiles in the empty window (Krystian 17.11: nine tiles were too much). The rest
 * (copy, e-mail, contact, theme) still answer a query such as „kopiuj” or „motyw”.
 */
export const TILE_KINDS: ReadonlySet<QuickAction["kind"]> = new Set<QuickAction["kind"]>(["call", "call2", "route", "submit", "track"]);

/** Most actions shown above the results. */
export const MATCHED_ACTIONS_MAX = 3;

/**
 * Actions for a query: every token (2+ letters) must start one of the action's words or its
 * label; the „Trasa” tile is replaced by the routes to each point.
 */
export function matchActions(actions: readonly QuickAction[], query: string, routes: readonly QuickAction[] = routeActions()): QuickAction[] {
  const tokens = normalizeText(query)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
  if (!tokens.length) return [];
  const pool = [...actions.filter((a) => a.kind !== "route"), ...routes];
  const hits = pool.filter((a) => {
    const own = [...a.words, ...normalizeText(a.label).split(/[^a-z0-9]+/)];
    return tokens.every((t) => own.some((w) => w.startsWith(t)));
  });
  return hits.slice(0, MATCHED_ACTIONS_MAX);
}
