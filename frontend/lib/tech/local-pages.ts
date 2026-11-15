/**
 * Local pages "serwis telefonów <miejscowość>" (SPEC §6, §9, design #serwis-telefonow-zakopane).
 *
 * Doorway-page guard (SPEC §9): a local page is generated only when its point is published
 * AND it has its own content — intro, area text, a "how to get here" text, at least three
 * local questions and nearby towns. On staging (NEXT_PUBLIC_TECH_DRAFT=1) a page of an
 * unpublished point shows in draft frames; missing content is never invented.
 *
 * Contact data (address, hours, phone) comes from config/prokom.ts via the point.
 */
import { servicePoints, type PointKey, type ServicePoint } from "@/config/prokom";
import { isDraftMode } from "./points";
import type { FaqItem } from "./seo";
import { towns } from "./towns";

export type LocalSlug = "serwis-telefonow-rabka-zdroj" | "serwis-telefonow-zakopane";

export type LocalPage = {
  slug: LocalSlug;
  point: PointKey;
  /** City in the nominative ("Zakopane") and locative ("w Zakopanem"). */
  city: string;
  inCity: string;
  title: string;
  description: string;
  intro: string;
  /** "Skąd do nas przyjeżdżają": text about the area served from this point. */
  area: string;
  /**
   * How to get there and where to park, in our own words. null = missing → the page does
   * not publish (TODO(krystian) with the service). Shown next to the point's parkingNote.
   */
  access: string | null;
  faq: FaqItem[];
};

export const localPages: LocalPage[] = [
  {
    slug: "serwis-telefonow-rabka-zdroj",
    point: "rabka",
    city: "Rabka-Zdrój",
    inCity: "w Rabce-Zdroju",
    title: "Serwis telefonów Rabka-Zdrój",
    description:
      "Serwis telefonów w Rabce-Zdroju: wymiana wyświetlacza, baterii i gniazda ładowania, pomoc po zalaniu. Wycena przed naprawą, gwarancja i status online.",
    intro:
      "Naprawa telefonów w Rabce-Zdroju: wymiana wyświetlacza, baterii i gniazda ładowania, pomoc po zalaniu. Diagnoza i wycena przed naprawą, gwarancja na usługę i części.",
    area:
      "Punkt w Rabce-Zdroju to nasz punkt główny. Przyjeżdżają do nas klienci z Raby Wyżnej, Jordanowa, Mszany Dolnej, Nowego Targu i Czarnego Dunajca. Jeśli nie możesz przyjechać, zgłoś naprawę online i wyślij telefon kurierem.",
    // From the current site: "w centrum Rabki-Zdroju przy ul. Orkana" (the street itself comes from prokom.ts).
    // TODO(krystian): add parking (parkingNote in prokom.ts) after checking with the service.
    access:
      "Punkt jest w centrum Rabki-Zdroju, więc dojedziesz do niego z każdej strony miasta. Bez umawiania — wystarczy przyjść w godzinach otwarcia. Jeśli wcześniej zgłosisz naprawę online, przyjęcie telefonu zajmie chwilę, bo dane mamy już w systemie.",
    faq: [
      {
        q: "Ile kosztuje wymiana szybki w telefonie w Rabce-Zdroju?",
        a: "Cena zależy od modelu i rodzaju wyświetlacza. Po diagnozie dostajesz dokładną wycenę przed rozpoczęciem naprawy. Jeśli się nie zdecydujesz, rezygnujesz bez konsekwencji.",
      },
      {
        q: "Czy naprawicie telefon tego samego dnia?",
        a: "To zależy od naprawy i od tego, czy mamy część do Twojego modelu. Termin podamy po diagnozie, a postęp naprawy sprawdzisz online po numerze zgłoszenia.",
      },
      {
        q: "Mieszkam w Nowym Targu albo w Jordanowie. Muszę przyjeżdżać dwa razy?",
        a: "Nie musisz. Telefon możesz przywieźć osobiście albo zgłosić naprawę online i wysłać go kurierem. O wycenie poinformujemy Cię telefonicznie albo mailowo, a status sprawdzisz online.",
      },
      {
        q: "Czy używacie oryginalnych części?",
        a: "To zależy od modelu i dostępności części. Rodzaj części i kwotę poznasz przy wycenie, zanim zaczniemy naprawę.",
      },
      {
        q: "Telefon wpadł do wody. Co robić?",
        a: "Wyłącz go, nie ładuj i nie susz suszarką. Przynieś go do serwisu jak najszybciej — po zalaniu liczy się czas.",
      },
    ],
  },
  {
    slug: "serwis-telefonow-zakopane",
    point: "zakopane",
    city: "Zakopane",
    inCity: "w Zakopanem",
    title: "Serwis telefonów Zakopane",
    description:
      "Serwis telefonów w Zakopanem: wymiana wyświetlacza, baterii i gniazda ładowania, pomoc po zalaniu. Wycena przed naprawą, gwarancja i status online.",
    intro:
      "Naprawa telefonów w Zakopanem: wymiana wyświetlacza, baterii i gniazda ładowania, pomoc po zalaniu. Diagnoza i wycena przed naprawą, gwarancja na usługę i części.",
    area:
      "Punkt w Zakopanem obsługuje też Kościelisko, Poronin, Biały Dunajec, Bukowinę Tatrzańską i Szaflary. Jesteś na urlopie? Naprawiamy także telefony turystów.",
    // From the boss (14.11) and Krystian (15.11): town centre, near Krupówki and Równia Krupowa.
    // The street comes from config/prokom.ts on the page. TODO(krystian): parkingNote once the service confirms it.
    access:
      "Punkt jest w centrum Zakopanego, kilka kroków od Krupówek i Równi Krupowej. Przyjdź bez umawiania w godzinach otwarcia.",
    faq: [
      {
        q: "Ile kosztuje wymiana szybki w telefonie w Zakopanem?",
        a: "Cena zależy od modelu i rodzaju wyświetlacza. Po diagnozie dostajesz dokładną wycenę przed rozpoczęciem naprawy. Jeśli się nie zdecydujesz, rezygnujesz bez konsekwencji.",
      },
      {
        q: "Czy naprawicie telefon tego samego dnia?",
        a: "To zależy od naprawy i od tego, czy mamy część do Twojego modelu. Termin podamy po diagnozie, a postęp naprawy sprawdzisz online po numerze zgłoszenia.",
      },
      {
        q: "Zalałem telefon na wyjeździe. Co robić?",
        a: "Wyłącz go, nie ładuj i nie susz suszarką. Przynieś go do punktu jak najszybciej — po zalaniu liczy się czas.",
      },
      {
        q: "Czy w Zakopanem jest ta sama gwarancja co w Rabce-Zdroju?",
        a: "Tak. Oba punkty to jeden serwis i jeden system zgłoszeń, więc zasady wyceny i gwarancji są te same.",
      },
      {
        q: "Czy używacie oryginalnych części?",
        a: "To zależy od modelu i dostępności części. Rodzaj części i kwotę poznasz przy wycenie, zanim zaczniemy naprawę.",
      },
      {
        q: "Czy mogę zostawić telefon i odebrać go przed wyjazdem?",
        a: "Powiedz przy przyjęciu, do kiedy jesteś na miejscu. Jeśli naprawa się nie zmieści, telefon możesz odebrać w punkcie w Rabce-Zdroju albo umówić odesłanie kurierem.",
      },
    ],
  },
];

/** Minimal own content of a local page (SPEC §9 — no doorway pages). */
export function hasUniqueContent(p: LocalPage): boolean {
  return Boolean(p.intro.trim() && p.area.trim() && p.access?.trim() && p.faq.length >= 3 && nearbyTowns(p).length >= 2);
}

/** Towns served from the page's point (without the city itself). */
export function nearbyTowns(p: Pick<LocalPage, "point" | "city">) {
  return towns.filter((t) => t.point === p.point && t.name !== p.city);
}

export type LocalState = "published" | "draft" | "hidden";

/**
 * published — goes to production and the sitemap; draft — only on staging, with frames;
 * hidden — 404 everywhere.
 */
export function localPageState(p: LocalPage, draft: boolean = isDraftMode(), points: ServicePoint[] = servicePoints): LocalState {
  const point = points.find((x) => x.key === p.point);
  if (!point) return "hidden";
  if (point.published && hasUniqueContent(p)) return "published";
  return draft ? "draft" : "hidden";
}

export function localPage(slug: LocalSlug): LocalPage {
  const p = localPages.find((x) => x.slug === slug);
  if (!p) throw new Error(`unknown local page: ${slug}`);
  return p;
}

/** Local pages that may be linked to and listed in the sitemap (never drafts). */
export function publishedLocalPages(points: ServicePoint[] = servicePoints): LocalPage[] {
  return localPages.filter((p) => localPageState(p, false, points) === "published");
}

/** Local pages visible in the current build (published, plus drafts on staging). */
export function visibleLocalPages(draft: boolean = isDraftMode()): LocalPage[] {
  return localPages.filter((p) => localPageState(p, draft) !== "hidden");
}
