/**
 * Brand service pages /serwis-apple and /serwis-samsung (round 18.11.2026, T-R2c).
 *
 * Content rules (SPEC §8 + round 18.11):
 * - never "autoryzowany / certyfikowany serwis / partner Apple / Samsung" — the certificates
 *   expired; we are an independent service and say so when asked,
 * - no prices, no WhatsApp, no photos of people, the word "serwis" stays,
 * - contact data only from config/prokom.ts (points and phones render from there),
 * - no city × brand pages (doorway risk, SPEC §9) — one page per brand.
 *
 * Model lists: current models come from the catalogue (content/katalog, families below — checked
 * with the manufacturers in T-R2a, so a new model shows up here with the catalogue); `older` =
 * popular older models people still bring in. TODO(krystian): confirm the older lists with the
 * service (which models we take, parts availability) and which repairs we do on MacBooks,
 * Galaxy Z and Apple Watch (runda-1811-tech-marki.md §7.6).
 *
 * Tests: tests/tech/serwis-marek.test.ts (data, banned words, no prices, live repair links).
 */
import type { FaqItem } from "@/lib/tech/seo";
import type { DeviceIcon } from "@/lib/tech/nav";
import type { CategoryCode } from "@/lib/tech/wizard-data";

export type BrandKey = "apple" | "samsung";

export type ModelGroup = {
  key: string;
  /** Family name shown on the card ("iPhone", "Galaxy S"). */
  title: string;
  /** One line under the title. */
  sub: string;
  icon: DeviceIcon;
  /** Backend category for /zgloszenie (KONTRAKT §1.1). */
  category: CategoryCode;
  /** Catalogue family keys (content/katalog/rodziny.json) — their models are the current ones. */
  families: string[];
  /** TODO(krystian): older models — confirm with the service which ones we still take. */
  older: string[];
};

/** A repair card: a page from config/naprawy.ts (linked only when published && verified),
 * or a plain card that leads to the form with the category and fault filled in. */
export type BrandRepair =
  | { slug: string; s: string }
  | { t: string; s: string; category: CategoryCode; usterka: string };

export type BrandPage = {
  key: BrandKey;
  /** Brand name as text in the site font (no logo with the apple — fix/tech-znak-apple). */
  brand: string;
  path: `/serwis-${BrandKey}`;
  /** SEO title before " — <cities> | PRO-KOM Tech" (full title 30–60 chars). */
  title: string;
  /** H1 before the cities line. */
  h1: string;
  /** Short name for the rail and breadcrumbs. */
  short: string;
  /** Hero lead, 1–2 sentences. */
  lead: string;
  /** Meta description start; " <cities>." is added, then descEnd (total 120–155). */
  descStart: string;
  descEnd: string;
  /** Category of the main "Zgłoś naprawę" button. */
  category: CategoryCode;
  /** Two short paragraphs under the hero ("Co warto wiedzieć"). */
  intro: string[];
  groups: ModelGroup[];
  repairs: BrandRepair[];
  /** Brand-specific notes for "Części i gwarancja" (2–3 short cards). */
  partsNotes: { t: string; s: string }[];
  faq: FaqItem[];
};

export const brandPages: BrandPage[] = [
  {
    key: "apple",
    brand: "Apple",
    path: "/serwis-apple",
    title: "Serwis Apple",
    h1: "Serwis iPhone, iPad i MacBook",
    short: "Serwis Apple",
    lead: "Naprawiamy iPhone’y, iPady, MacBooki i Apple Watch. Najpierw diagnoza i wycena, naprawa dopiero po Twojej zgodzie.",
    descStart: "Serwis iPhone, iPad, MacBook i Apple Watch w salonach PRO-KOM Tech:",
    descEnd: "Ekran, bateria, gniazdo, zalanie. Wycena przed naprawą.",
    category: "phone",
    intro: [
      "Sprzęt Apple jest zbudowany ciasno i precyzyjnie: ekran iPhone’a to jeden sklejony moduł, bateria w MacBooku bywa przyklejona do obudowy, a część podzespołów jest sparowana z płytą główną. Dlatego zaczynamy od diagnozy — sprawdzamy, co naprawdę jest uszkodzone, zanim zaproponujemy wymianę.",
      "Po diagnozie dostajesz wycenę i informację, jakiej części użyjemy. Decydujesz Ty: możesz się zgodzić albo zrezygnować. O postępie naprawy informuje status online.",
    ],
    groups: [
      {
        key: "iphone",
        title: "iPhone",
        sub: "Ekran, bateria, tylna szybka, gniazdo, aparat",
        icon: "phone",
        category: "phone",
        families: ["iphone-pro", "iphone-duo", "iphone-air", "iphone"],
        older: [
          "iPhone 17 Pro Max",
          "iPhone 17 Pro",
          "iPhone 16e",
          "iPhone 16 Pro Max",
          "iPhone 16 Pro",
          "iPhone 16 Plus",
          "iPhone 15 Pro Max",
          "iPhone 15 Pro",
          "iPhone 15 Plus",
          "iPhone 15",
          "iPhone 14 Pro Max",
          "iPhone 14 Pro",
          "iPhone 14 Plus",
          "iPhone 14",
          "iPhone 13 Pro Max",
          "iPhone 13 Pro",
          "iPhone 13",
          "iPhone 13 mini",
          "iPhone 12 Pro Max",
          "iPhone 12 Pro",
          "iPhone 12",
          "iPhone 12 mini",
          "iPhone 11 Pro Max",
          "iPhone 11 Pro",
          "iPhone 11",
          "iPhone SE (2. i 3. generacja)",
          "iPhone XS / XR / X",
        ],
      },
      {
        key: "ipad",
        title: "iPad",
        sub: "Szybka i wyświetlacz, bateria, gniazdo ładowania",
        icon: "tablet",
        category: "tablet",
        families: ["ipad-pro", "ipad-air", "ipad"],
        older: [
          "iPad Pro (M4)",
          "iPad Air (M3)",
          "iPad Air (M2)",
          "iPad mini (A17 Pro)",
          "iPad 10. generacji",
          "iPad 9. generacji",
          "iPad 8. generacji",
          "iPad Air 5. i 4. generacji",
          "iPad Pro 11″ i 12,9″ (2018–2022)",
          "iPad mini 6. generacji",
        ],
      },
      {
        key: "macbook",
        title: "MacBook",
        sub: "Matryca, klawiatura, bateria, zalanie, przegrzewanie",
        icon: "laptop",
        category: "laptop",
        families: ["macbook-pro", "macbook-neo", "macbook-air"],
        older: [
          "MacBook Air 13″ i 15″ (M4)",
          "MacBook Air 13″ i 15″ (M3)",
          "MacBook Air 13″ i 15″ (M2)",
          "MacBook Air (M1)",
          "MacBook Pro 14″ i 16″ (M1–M4)",
          "MacBook Pro 13″ (M1, M2)",
          "MacBook Pro z procesorem Intel (2016–2020)",
          "MacBook Air z procesorem Intel (2018–2020)",
        ],
      },
      {
        key: "watch",
        title: "Apple Watch",
        sub: "Szkło i wyświetlacz, bateria, ładowanie",
        icon: "watch",
        category: "smartwatch",
        families: ["apple-watch"],
        older: [
          "Apple Watch Series 11",
          "Apple Watch Ultra 3",
          "Apple Watch Series 10",
          "Apple Watch Series 9",
          "Apple Watch Series 8",
          "Apple Watch Series 7",
          "Apple Watch Ultra 2",
          "Apple Watch Ultra",
          "Apple Watch SE (2. generacja)",
        ],
      },
    ],
    repairs: [
      { slug: "wymiana-ekranu-iphone", s: "Pęknięta szyba, zielone linie albo martwy dotyk — wymieniamy cały moduł wyświetlacza." },
      { slug: "wymiana-tylnej-szybki-iphone", s: "Pęknięte szkło na pleckach iPhone’a, także wokół aparatów." },
      { slug: "wymiana-baterii-w-telefonie", s: "Kondycja poniżej 80%, wyłączanie przy kilkunastu procentach, spuchnięta bateria." },
      { slug: "naprawa-gniazda-ladowania", s: "Kabel wypada, ładuje tylko pod kątem albo wcale — często wystarczy czyszczenie." },
      { slug: "telefon-po-zalaniu", s: "Wyłącz telefon i nie ładuj go. Im szybciej trafi do serwisu, tym większa szansa." },
      { slug: "wymiana-ekranu-w-tablecie", s: "Pęknięta szybka albo ekran, który nie reaguje na dotyk w iPadzie." },
      { slug: "wymiana-matrycy-w-laptopie", s: "Pęknięta matryca, pasy albo ciemny obraz w MacBooku." },
      { slug: "laptop-sie-przegrzewa", s: "Głośny wentylator, spadki wydajności, gorąca obudowa MacBooka." },
      { slug: "naprawa-smartwatcha", s: "Pęknięte szkło, słaba bateria albo problem z ładowaniem Apple Watch." },
    ],
    partsNotes: [
      {
        t: "Komunikat o nieznanej części",
        s: "W nowszych iPhone’ach system może pokazać w ustawieniach informację o części po wymianie ekranu, baterii albo aparatu. Telefon działa normalnie — przed naprawą mówimy, czy przy wybranej części taki komunikat się pojawi.",
      },
      {
        t: "Face ID i Touch ID",
        s: "Czujniki Face ID i Touch ID są sparowane z płytą główną. Przy wymianie ekranu i obudowy pracujemy tak, żeby ich nie naruszyć, a gdy usterka dotyczy samego czujnika, po diagnozie mówimy wprost, co da się zrobić.",
      },
    ],
    faq: [
      {
        q: "Czy jesteście serwisem producenta, czyli Apple?",
        a: "Nie — PRO-KOM Tech to niezależny serwis z salonami na Podhalu. Sprzęt Apple naprawiamy z wyceną przed naprawą i z naszą gwarancją na usługę i części. Jeśli urządzenie jest jeszcze na gwarancji producenta, powiedz nam o tym przy przyjęciu — doradzimy, czy lepiej zgłosić je najpierw do Apple.",
      },
      {
        q: "Czy po wymianie ekranu albo baterii iPhone pokaże komunikat o części?",
        a: "W nowszych modelach może. iOS sprawdza numer seryjny niektórych części i po wymianie pokazuje informację w ustawieniach. Telefon działa normalnie, a przed naprawą mówimy, jakiej części użyjemy i czego się spodziewać.",
      },
      {
        q: "Czy muszę podać kod do iPhone’a albo wylogować się z Apple ID?",
        a: "Nie musisz się wylogowywać. Przed oddaniem zrób kopię w iCloud albo na komputerze. Kod podajesz przy przyjęciu — dzięki niemu po naprawie sprawdzimy aparat, dotyk, głośniki i ładowanie. Bez kodu naprawa jest możliwa, ale test po naprawie jest ograniczony. „Znajdź mój iPhone” wyłącz tylko wtedy, gdy o to poprosimy.",
      },
      {
        q: "Naprawiacie MacBooki z procesorami Apple (M1 i nowsze)?",
        a: "Tak, przyjmujemy MacBooki Air i Pro z procesorami Apple i Intel. W nowszych modelach wiele podzespołów jest wlutowanych w płytę, dlatego zawsze zaczynamy od diagnozy i dopiero potem mówimy, co i jak da się naprawić.",
      },
      {
        q: "Zalałem MacBooka. Co zrobić?",
        a: "Od razu go wyłącz, odłącz zasilacz i nie próbuj włączać „na próbę”. Postaw go otwartego, odwróconego klawiaturą w dół, i jak najszybciej przynieś do salonu. Ciecz w środku powoduje korozję, która postępuje z każdą godziną.",
      },
      {
        q: "Ile kosztuje naprawa iPhone’a albo iPada?",
        a: "Cenę podajemy po diagnozie, bo zależy od modelu, rodzaju części i tego, co naprawdę jest uszkodzone. Wycenę dostajesz przed naprawą — bez Twojej zgody nic nie wymieniamy.",
      },
      {
        q: "Naprawiacie Apple Watch?",
        a: "Tak. Najczęściej wymieniamy szkło lub wyświetlacz i baterię oraz sprawdzamy problemy z ładowaniem. Zegarek przynieś razem z ładowarką — ułatwi to diagnozę.",
      },
    ],
  },
  {
    key: "samsung",
    brand: "Samsung",
    path: "/serwis-samsung",
    title: "Serwis Samsung",
    h1: "Serwis Samsung Galaxy",
    short: "Serwis Samsung",
    lead: "Naprawiamy smartfony Galaxy S, A i Z oraz tablety Galaxy Tab. Najpierw diagnoza i wycena, naprawa dopiero po Twojej zgodzie.",
    descStart: "Serwis Samsung Galaxy S, A, Z i Galaxy Tab w salonach PRO-KOM Tech:",
    descEnd: "Ekran AMOLED, bateria, gniazdo, zalanie. Wycena przed naprawą.",
    category: "phone",
    intro: [
      "W smartfonach Galaxy ekran AMOLED często tworzy jeden moduł z ramką, a czytnik linii papilarnych siedzi pod wyświetlaczem. Pęknięcie, zielona linia albo czarne plamy to sygnał, że moduł jest uszkodzony — sprawdzamy to w diagnozie, zanim zaproponujemy wymianę.",
      "Po diagnozie dostajesz wycenę i informację, jakiej części użyjemy. Decydujesz Ty: możesz się zgodzić albo zrezygnować. O postępie naprawy informuje status online.",
    ],
    groups: [
      {
        key: "galaxy-s",
        title: "Galaxy S",
        sub: "Ekran AMOLED, tylna szybka, bateria, gniazdo",
        icon: "phone",
        category: "phone",
        families: ["galaxy-s"],
        older: [
          "Galaxy S25 Ultra",
          "Galaxy S25 Edge",
          "Galaxy S25+",
          "Galaxy S25",
          "Galaxy S25 FE",
          "Galaxy S24 Ultra",
          "Galaxy S24+",
          "Galaxy S24",
          "Galaxy S24 FE",
          "Galaxy S23 Ultra",
          "Galaxy S23+",
          "Galaxy S23",
          "Galaxy S23 FE",
          "Galaxy S22 Ultra",
          "Galaxy S22",
          "Galaxy S21 / S21 FE",
          "Galaxy S20 FE",
        ],
      },
      {
        key: "galaxy-a",
        title: "Galaxy A",
        sub: "Ekran, bateria, gniazdo ładowania, aparat",
        icon: "phone",
        category: "phone",
        families: ["galaxy-a"],
        older: [
          "Galaxy A56",
          "Galaxy A36",
          "Galaxy A26",
          "Galaxy A16",
          "Galaxy A55",
          "Galaxy A54",
          "Galaxy A53",
          "Galaxy A52 / A52s",
          "Galaxy A35",
          "Galaxy A34",
          "Galaxy A25",
          "Galaxy A15",
          "Galaxy A14",
          "Galaxy A13",
          "Galaxy A12",
        ],
      },
      {
        key: "galaxy-z",
        title: "Galaxy Z",
        sub: "Składane: ekran zewnętrzny i wewnętrzny, zawias, bateria",
        icon: "phone",
        category: "phone",
        families: ["galaxy-z"],
        older: [
          "Galaxy Z Fold7",
          "Galaxy Z Flip7",
          "Galaxy Z Flip7 FE",
          "Galaxy Z Fold6",
          "Galaxy Z Flip6",
          "Galaxy Z Fold5",
          "Galaxy Z Flip5",
          "Galaxy Z Fold4",
          "Galaxy Z Flip4",
        ],
      },
      {
        key: "galaxy-tab",
        title: "Galaxy Tab",
        sub: "Szybka i wyświetlacz, bateria, gniazdo ładowania",
        icon: "tablet",
        category: "tablet",
        families: ["galaxy-tab"],
        older: [
          "Galaxy Tab S11 Ultra",
          "Galaxy Tab S11",
          "Galaxy Tab S10 FE",
          "Galaxy Tab A9+",
          "Galaxy Tab S10 Ultra / S10+",
          "Galaxy Tab S9 Ultra / S9+ / S9",
          "Galaxy Tab S9 FE",
          "Galaxy Tab S8",
          "Galaxy Tab S7 / S7 FE",
          "Galaxy Tab A9",
          "Galaxy Tab A8",
          "Galaxy Tab A7 / A7 Lite",
        ],
      },
    ],
    repairs: [
      { slug: "wymiana-ekranu-samsung", s: "Pęknięty ekran, zielona linia, czarne plamy albo martwy dotyk w Galaxy." },
      { slug: "wymiana-baterii-w-telefonie", s: "Telefon szybko się rozładowuje, wyłącza przy kilkunastu procentach albo bateria puchnie." },
      { slug: "naprawa-gniazda-ladowania", s: "USB-C luźne, ładuje pod kątem albo nie ładuje szybko — sprawdzamy gniazdo i taśmę." },
      { slug: "telefon-po-zalaniu", s: "IP68 nie chroni przed wszystkim. Wyłącz telefon i nie ładuj go przed diagnozą." },
      { t: "Składane Galaxy Z", s: "Pęknięty ekran zewnętrzny, uszkodzony ekran wewnętrzny albo zawias, który przestał trzymać.", category: "phone", usterka: "Pęknięty ekran" },
      { slug: "wymiana-ekranu-w-tablecie", s: "Pęknięta szybka albo ekran Galaxy Tab, który nie reaguje na dotyk." },
    ],
    partsNotes: [
      {
        t: "Czytnik linii papilarnych",
        s: "W wielu Galaxy czytnik jest pod ekranem. Po wymianie wyświetlacza odcisk palca zwykle trzeba dodać od nowa w ustawieniach — przypominamy o tym przy odbiorze.",
      },
      {
        t: "Ekran z ramką",
        s: "W wielu modelach Galaxy S ekran AMOLED wymienia się razem z ramką. Przed naprawą mówimy, jak to wygląda w Twoim modelu i jakiej części użyjemy.",
      },
    ],
    faq: [
      {
        q: "Czy jesteście serwisem producenta, czyli Samsunga?",
        a: "Nie — PRO-KOM Tech to niezależny serwis z salonami na Podhalu. Sprzęt Samsung naprawiamy z wyceną przed naprawą i z naszą gwarancją na usługę i części. Jeśli telefon jest jeszcze na gwarancji producenta, powiedz nam o tym przy przyjęciu — doradzimy, czy lepiej zgłosić go najpierw do Samsunga.",
      },
      {
        q: "Na ekranie pojawiła się zielona linia. Czy da się to naprawić?",
        a: "Pionowa zielona lub różowa linia na ekranie AMOLED to zwykle uszkodzenie samego wyświetlacza, często po upadku albo ucisku. Pomaga wymiana ekranu — oprogramowanie ani reset jej nie usuną. Przed naprawą sprawdzamy, czy reszta telefonu działa poprawnie.",
      },
      {
        q: "Czy po wymianie ekranu będzie działał czytnik linii papilarnych?",
        a: "Tak, po naprawie sprawdzamy czytnik. Odcisk palca zwykle trzeba jednak zapisać od nowa w ustawieniach, bo czytnik pod nowym ekranem uczy się palca jeszcze raz.",
      },
      {
        q: "Naprawiacie składane Galaxy Z Fold i Z Flip?",
        a: "Tak, przyjmujemy składane Galaxy. Części do nich bywają trudniej dostępne niż do zwykłych smartfonów, dlatego po diagnozie mówimy, co trzeba wymienić i kiedy możemy to zrobić.",
      },
      {
        q: "Mój Galaxy ma IP68, a i tak się zalał. Jak to możliwe?",
        a: "Szczelność słabnie z czasem, po upadku albo po wcześniejszej naprawie, a ciepła woda, para i woda morska szkodzą bardziej niż czysta. Jeśli telefon się zalał, wyłącz go, nie ładuj i przynieś do salonu — im szybciej, tym większa szansa na uratowanie płyty.",
      },
      {
        q: "Czy stracę dane w telefonie podczas naprawy?",
        a: "Większość napraw, takich jak wymiana ekranu, baterii czy gniazda, nie dotyka danych. Mimo to przed oddaniem zrób kopię w Samsung Cloud, na Koncie Google albo przez Smart Switch na komputer — przy usterce płyty kopia jest jedynym zabezpieczeniem.",
      },
      {
        q: "Ile kosztuje naprawa telefonu Samsung?",
        a: "Cenę podajemy po diagnozie, bo zależy od modelu, rodzaju części i tego, co naprawdę jest uszkodzone. Wycenę dostajesz przed naprawą — bez Twojej zgody nic nie wymieniamy.",
      },
    ],
  },
];

export function brandPage(key: BrandKey): BrandPage {
  const p = brandPages.find((b) => b.key === key);
  if (!p) throw new Error(`Unknown brand page: ${key}`);
  return p;
}
