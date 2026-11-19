/**
 * The Tech search index (server only: built at build time into `/szukaj/indeks.json` and used by
 * `/szukaj`). Everything comes from the data the pages already render — no backend, no external
 * service: pages of the sitemap, devices, repair pages, faults from the wizard (→ the form with
 * the fault filled in), points, FAQ, blog posts and categories. Visibility follows the pages:
 * production never lists a draft (unpublished point, unverified repair, courier page before it
 * is published).
 */
import { line } from "@/config/prokom";
import { BLOG_POSTS } from "@/lib/blog-posts";
import { catalog, modelPath } from "../catalog";
import { BLOG_CATEGORIES } from "../blog-taxonomy";
import { brandPages } from "@/config/serwis-marek";
import { courierPageHref } from "../courier";
import { groupModels } from "../serwis-marek";
import { devicePages } from "../devices";
import { faqGroups } from "../faq-data";
import { POINTS_HREF, PREP_GUIDE_HREF, PREP_GUIDE_READY, REPAIRS_HREF, SUBMIT_HREF, TRACK_HREF, repairLinks, type DeviceIcon } from "../nav";
import { buildableRepairs, repairPath } from "../naprawy";
import { visibleLocalPages } from "../local-pages";
import { isDraftMode, visiblePoints } from "../points";
import { faultMeaning, submitHref, wizardDevices, type WizardIcon } from "../wizard-data";
import type { SearchEntry, SearchIconName } from "./provider";

const wizardIcon = (icon: WizardIcon): SearchIconName => (icon === "other" ? "wrench" : icon);
const deviceIcon = (icon: DeviceIcon): SearchIconName => icon;
const clip = (text: string, max = 400) => (text.length > max ? `${text.slice(0, max)}…` : text);

/** Pages without their own data module (titles as in the menu and the footer). */
const PAGES: { title: string; href: string; hint: string; text: string; icon: SearchIconName; popularity: number }[] = [
  { title: "Zgłoś naprawę online", href: SUBMIT_HREF, hint: "Formularz zgłoszenia — kilka minut", text: "zgloszenie formularz naprawa online zamow", icon: "wrench", popularity: 100 },
  { title: "Status naprawy", href: TRACK_HREF, hint: "Sprawdź po numerze zgłoszenia", text: "sledzenie status gdzie jest moj telefon numer zgloszenia track", icon: "track", popularity: 95 },
  { title: "Punkty serwisowe", href: POINTS_HREF, hint: "Adresy, godziny otwarcia, dojazd", text: "adres godziny otwarcia dojazd mapa salon punkt", icon: "pin", popularity: 90 },
  { title: "Wszystkie naprawy", href: REPAIRS_HREF, hint: "Co naprawiamy", text: "uslugi oferta naprawy serwis", icon: "wrench", popularity: 70 },
  { title: "Hammer Glass — folie na wymiar", href: "/hammer-glass", hint: "Folia wycinana pod model, zakładana na miejscu", text: "folia ochronna szklo ploter telefon tablet smartwatch", icon: "shield", popularity: 80 },
  { title: "Kontakt", href: "/kontakt", hint: "Telefon, e-mail, formularz", text: `telefon mail napisz zadzwon ${line.phoneDisplay}`, icon: "call", popularity: 75 },
  { title: "O firmie", href: "/o-firmie", hint: "PRO-KOM od 2004 roku", text: "firma historia kim jestesmy zasady", icon: "page", popularity: 40 },
  { title: "FAQ — najczęstsze pytania", href: "/faq", hint: "Wycena, gwarancja, status, kurier", text: "pytania odpowiedzi faq", icon: "help", popularity: 60 },
  { title: "Blog", href: "/blog", hint: "Porady serwisu", text: "porady poradnik artykuly", icon: "doc", popularity: 35 },
  { title: "Obsługiwane miejscowości", href: "/obslugiwane-miejscowosci", hint: "Skąd do nas przyjeżdżają", text: "miejscowosci okolice dojazd podhale", icon: "map", popularity: 35 },
  { title: "Konto klienta", href: "/client/login", hint: "Twoje zgłoszenia w jednym miejscu", text: "logowanie konto klient zaloguj", icon: "user", popularity: 30 },
  { title: "Polityka prywatności", href: "/polityka-prywatnosci", hint: "Dokument", text: "rodo cookies prywatnosc dane osobowe", icon: "doc", popularity: 5 },
  { title: "Regulamin", href: "/regulamin", hint: "Dokument", text: "regulamin zasady", icon: "doc", popularity: 5 },
];

export function buildSearchIndex(draft: boolean = isDraftMode()): SearchEntry[] {
  const out: SearchEntry[] = [];
  const add = (e: SearchEntry) => out.push(e);

  for (const p of PAGES) add({ id: `strona:${p.href}`, group: "strony", ...p });
  if (PREP_GUIDE_READY) {
    add({ id: `strona:${PREP_GUIDE_HREF}`, group: "strony", title: "Jak przygotować sprzęt do serwisu", href: PREP_GUIDE_HREF, hint: "Kopia danych, kod, akcesoria", text: "przygotowanie kopia zapasowa haslo kod blokady poradnik", icon: "doc", popularity: 50 });
  }
  const courier = courierPageHref();
  if (courier) add({ id: `strona:${courier}`, group: "strony", title: "Naprawa wysyłkowa", href: courier, hint: "Wyślij sprzęt kurierem", aliases: "kurier wysyłka", text: "kurier wysylka paczka cala polska", icon: "truck", popularity: 55 });
  for (const lp of visibleLocalPages(draft)) {
    add({ id: `strona:/${lp.slug}`, group: "strony", title: lp.title, href: `/${lp.slug}`, hint: lp.inCity, text: clip(`${lp.description} ${lp.area}`), icon: "phone", popularity: 60 });
  }

  // Devices: the menu list (phones have their own page) with the device page texts.
  for (const link of repairLinks) {
    const page = devicePages.find((d) => d.path === link.href);
    const text = page ? clip(`${page.short} ${page.card} ${page.repairs.map((r) => r.t).join(" ")} ${page.kinds.map((k) => k.n).join(" ")}`) : "ekran bateria gniazdo ladowania zalanie";
    const device = wizardDevices.find((d) => d.icon === link.icon);
    const aliases = [page?.short, device?.label].filter(Boolean).join(" ");
    add({ id: `urzadzenie:${link.href}`, group: "urzadzenia", title: link.label, href: link.href, hint: page?.card ?? "Ekran, bateria, gniazdo ładowania, pomoc po zalaniu.", text, aliases, icon: deviceIcon(link.icon), popularity: 85 });
  }

  // Brand service pages (round 18.11): models and repairs in the text, so "iphone 13" finds them.
  for (const b of brandPages) {
    const models = b.groups
      .flatMap((g) => {
        const m = groupModels(g);
        return [g.title, ...m.current, ...m.older];
      })
      .join(" ");
    add({ id: `marka:${b.path}`, group: "urzadzenia", title: b.h1, href: b.path, hint: b.short, aliases: `${b.brand} ${b.groups.map((g) => g.title).join(" ")}`, text: clip(`${b.lead} ${models}`, 600), icon: "phone", popularity: 80 });
  }

  // Repair pages and wizard faults: a fault with its own page leads there, the rest to the form.
  const repairs = buildableRepairs(draft);
  for (const r of repairs) {
    add({ id: `naprawa:${r.slug}`, group: "naprawy", title: r.h1, href: repairPath(r.slug), hint: r.usterka, aliases: r.usterka, text: clip(`${r.title} ${r.description}`), icon: "wrench", popularity: 75 });
  }
  for (const device of wizardDevices) {
    for (const fault of device.faults) {
      if (repairs.some((r) => r.device === device.category && r.usterka === fault)) continue;
      add({
        id: `usterka:${device.id}:${fault}`,
        group: "usterki",
        // The device goes to the hint: „drukarka” must rank the printer service above its faults.
        title: fault,
        href: submitHref(device.category, fault),
        hint: `${device.label} · zgłoś naprawę z wpisaną usterką`,
        text: faultMeaning(device.id, fault),
        icon: wizardIcon(device.icon),
        popularity: 45,
      });
    }
  }

  // Sales catalogue (runda 18.11 v2): both salons, the catalogue and every model (no prices).
  add({ id: "sprzedaz:/sprzedaz", group: "sprzedaz", title: "Sprzedaż Apple i Samsung — katalog", href: "/sprzedaz", hint: "Wybierz model, kolor i pamięć, wyślij zapytanie", text: "sprzedaz kup nowy telefon katalog zapytanie cena dostepnosc", icon: "phone", popularity: 70 });
  add({ id: "sprzedaz:/apple", group: "sprzedaz", title: "Salon Apple", href: "/apple", hint: "iPhone, iPad, Mac, Apple Watch, AirPods", text: "apple iphone ipad mac macbook watch airpods salon", icon: "phone", popularity: 65 });
  add({ id: "sprzedaz:/samsung", group: "sprzedaz", title: "Salon Samsung", href: "/samsung", hint: "Galaxy S, Z, A, Tab, Watch, Buds", text: "samsung galaxy salon tablet zegarek sluchawki", icon: "phone", popularity: 65 });
  for (const m of catalog.models) {
    add({
      id: `model:${m.slug}`,
      group: "sprzedaz",
      title: m.name,
      href: modelPath(m),
      hint: `${m.brand === "apple" ? "Apple" : "Samsung"} · ${m.colors.length} ${m.colors.length === 1 ? "kolor" : "kolory"} · zapytaj o cenę`,
      text: clip(`${m.keyFacts.join(" ")} ${m.colors.map((c) => c.name).join(" ")} ${m.storage.map((s) => s.label).join(" ")}`, 240),
      icon: m.kind === "laptop" ? "laptop" : m.kind === "tablet" ? "tablet" : m.kind === "desktop" ? "pc" : m.kind === "watch" ? "watch" : "phone",
      popularity: 40 + Math.min(20, Math.round((m.order - 800) / 10)),
    });
  }

  for (const p of visiblePoints(draft)) {
    add({
      id: `punkt:${p.key}`,
      group: "punkty",
      title: `Punkt ${p.name}`,
      href: POINTS_HREF,
      hint: [p.street, p.city].filter(Boolean).join(", "),
      text: `${p.city} ${p.postal} adres godziny otwarcia dojazd parking salon`,
      icon: "pin",
      popularity: 80,
    });
  }

  for (const g of faqGroups()) {
    g.items.forEach((item, i) => {
      add({ id: `pytanie:${g.id}:${i}`, group: "pytania", title: item.q, href: `/faq#${g.id}`, hint: g.title, text: clip(item.a, 300), icon: "help", popularity: 30 });
    });
  }

  for (const c of BLOG_CATEGORIES) {
    add({ id: `blog:kategoria:${c.slug}`, group: "blog", title: `Blog: ${c.name}`, href: `/blog/kategoria/${c.slug}`, hint: "Kategoria bloga", text: clip(c.description, 240), icon: "doc", popularity: 25 });
  }
  const seen = new Set<string>();
  for (const post of BLOG_POSTS) {
    if (seen.has(post.slug)) continue;
    seen.add(post.slug);
    add({ id: `blog:${post.slug}`, group: "blog", title: post.title, href: `/blog/${post.slug}`, hint: post.readingTime ? `Wpis · ${post.readingTime}` : "Wpis", text: clip(`${post.description} ${(post.tags ?? []).join(" ")}`, 300), icon: "doc", popularity: 20 });
  }
  return out;
}

