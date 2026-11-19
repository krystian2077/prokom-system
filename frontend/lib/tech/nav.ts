/**
 * Navigation of the PRO-KOM Tech shell (docs/tech/SPEC.md §6, design T.Naglowek / T.Stopka).
 * Some targets are created in later sessions (TD4: /punkty-serwisowe, /o-firmie,
 * /serwis-telefonow; TD5: legal pages) — the URLs are final.
 */
import { courierService } from "@/config/prokom";

export type NavKey = "naprawy" | "sprzedaz" | "punkty" | "hammer" | "ofirmie" | "kontakt";
/** `short`: the label in the capsule when the full one does not fit (the full one stays the accessible name). */
export type NavItem = { key: NavKey; label: string; short?: string; href: string; mega?: "naprawy" | "sprzedaz" | "punkty"; match: string[] };

export const mainNav: NavItem[] = [
  {
    key: "naprawy",
    label: "Naprawy",
    href: "/uslugi",
    mega: "naprawy",
    match: ["/uslugi", "/serwis-", "/odzyskiwanie-danych", "/naprawy", "/naprawa-kurierem"],
  },
  // Sales catalogue (runda 18.11 v2): Apple and Samsung salons, enquiry list — no prices.
  { key: "sprzedaz", label: "Sprzedaż", href: "/sprzedaz", mega: "sprzedaz", match: ["/sprzedaz", "/apple", "/samsung", "/zapytanie"] },
  { key: "punkty", label: "Punkty serwisowe", short: "Punkty", href: "/punkty-serwisowe", mega: "punkty", match: ["/punkty-serwisowe", "/obslugiwane-miejscowosci"] },
  { key: "hammer", label: "Hammer Glass", href: "/hammer-glass", match: ["/hammer-glass"] },
  // Blog left the capsule 18.11.2026 (Krystian): room for the labelled theme button; it stays in the footer and search.
  { key: "ofirmie", label: "O firmie", href: "/o-firmie", match: ["/o-firmie"] },
  { key: "kontakt", label: "Kontakt", href: "/kontakt", match: ["/kontakt"] },
];

export type DeviceIcon = "phone" | "laptop" | "tablet" | "pc" | "console" | "printer" | "watch" | "data";
/** `short`: nominative label for tight grids (phone menu sheet). */
export type RepairLink = { label: string; short: string; href: string; icon: DeviceIcon };

/** Device pages (SPEC §6, TD4–TD5). */
export const repairLinks: RepairLink[] = [
  { label: "Serwis telefonów", short: "Telefony", href: "/serwis-telefonow", icon: "phone" },
  { label: "Serwis laptopów", short: "Laptopy", href: "/serwis-laptopow", icon: "laptop" },
  { label: "Serwis tabletów", short: "Tablety", href: "/serwis-tabletow", icon: "tablet" },
  { label: "Serwis komputerów", short: "Komputery", href: "/serwis-komputerow", icon: "pc" },
  { label: "Serwis konsol", short: "Konsole", href: "/serwis-konsol", icon: "console" },
  { label: "Serwis drukarek", short: "Drukarki", href: "/serwis-drukarek", icon: "printer" },
  { label: "Serwis smartwatchy", short: "Smartwatche", href: "/serwis-smartwatchy", icon: "watch" },
  { label: "Odzyskiwanie danych", short: "Odzysk danych", href: "/odzyskiwanie-danych", icon: "data" },
];

export const footerColumns: { title: string; items: { label: string; href: string }[] }[] = [
  {
    title: "Naprawy",
    items: [
      { label: "Serwis telefonów", href: "/serwis-telefonow" },
      { label: "Serwis laptopów", href: "/serwis-laptopow" },
      { label: "Serwis tabletów", href: "/serwis-tabletow" },
      { label: "Serwis komputerów", href: "/serwis-komputerow" },
      { label: "Konsole i drukarki", href: "/uslugi" },
      { label: "Odzyskiwanie danych", href: "/odzyskiwanie-danych" },
    ],
  },
  {
    title: "Hammer Glass",
    items: [
      { label: "Folie na telefon", href: "/hammer-glass#telefon" },
      { label: "Folie na tablet", href: "/hammer-glass#tablet" },
      { label: "Folie na smartwatch", href: "/hammer-glass#smartwatch" },
      { label: "Jak wycinamy folię", href: "/hammer-glass#jak-wycinamy" },
    ],
  },
  {
    title: "Informacje",
    items: [
      { label: "O firmie", href: "/o-firmie" },
      { label: "Kontakt", href: "/kontakt" },
      { label: "Blog", href: "/blog" },
      { label: "Obsługiwane miejscowości", href: "/obslugiwane-miejscowosci" },
      { label: "Jak przygotować sprzęt", href: "/jak-przygotowac-sprzet" },
      // Courier page only once published (SPEC §12.10) — no dead link before that.
      ...(courierService.published ? [{ label: "Naprawa wysyłkowa", href: "/naprawa-kurierem" }] : []),
      { label: "Status naprawy", href: "/track" },
      { label: "Konto klienta", href: "/client/login" },
    ],
  },
];

export const legalLinks: { label: string; href: string }[] = [
  { label: "Polityka prywatności", href: "/polityka-prywatnosci" },
  { label: "Cookies", href: "/polityka-prywatnosci#cookies" },
  // TODO(krystian): "Dostępność" from the design needs a page (TD5) — hidden until it exists.
  // No HTML sitemap page: /sitemap.xml is raw XML for crawlers (audit 16.11).
  { label: "Wszystkie naprawy", href: "/uslugi" },
];

export const ACCOUNT_HREF = "/client/login";
export const SUBMIT_HREF = "/zgloszenie";
export const TRACK_HREF = "/track";
export const POINTS_HREF = "/punkty-serwisowe";
export const REPAIRS_HREF = "/uslugi";
/** Preparation guide (SPEC §12.3, TD5 PR 3). */
export const PREP_GUIDE_HREF = "/jak-przygotowac-sprzet";
export const PREP_GUIDE_READY = true;

export function isActive(item: { match: string[] }, pathname: string): boolean {
  return item.match.some((m) => (m.endsWith("-") ? pathname.startsWith(m) : pathname === m || pathname.startsWith(`${m}/`)));
}

/** Google Maps directions to a point (SPEC §12.8). */
export function directionsUrl(geo: { lat: number; lng: number }): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${geo.lat},${geo.lng}`;
}

export type Pt = { x: number; y: number };
const side = (p1: Pt, p2: Pt, p3: Pt) => (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
/**
 * Mega-menu safe triangle (PREMIUM §3): is `p` inside the triangle a–b–c, where `a` is
 * where the pointer left the open trigger and b, c are the top corners of the open panel?
 * Then the pointer is on its way into the panel and must not switch menus.
 */
export function inTriangle(p: Pt, a: Pt, b: Pt, c: Pt): boolean {
  const d1 = side(p, a, b);
  const d2 = side(p, b, c);
  const d3 = side(p, c, a);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}
