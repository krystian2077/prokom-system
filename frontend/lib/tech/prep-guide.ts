/**
 * "Jak przygotować sprzęt do serwisu" (docs/tech/SPEC.md §12.3). Steps with a short "why",
 * per device tab. No prices, no time promises (SPEC §8).
 *
 * TODO(krystian): every step to check with the service before publishing (list in TD5 PR 3).
 */
import type { DeviceCategory } from "./contract";

export type PrepStep = { t: string; why: string };
export type PrepTab = { id: string; label: string; categories: DeviceCategory[]; steps: PrepStep[] };

const BACKUP_PHONE: PrepStep = {
  t: "Zrób kopię zapasową",
  why: "iCloud, Konto Google albo kopia na komputer. Większość napraw nie dotyka danych, ale przy usterce płyty albo pamięci kopia jest jedynym zabezpieczeniem zdjęć i kontaktów.",
};
const DESCRIBE: PrepStep = {
  t: "Opisz usterkę i kiedy występuje",
  why: "Np. „gaśnie przy 30% baterii” albo „nie ładuje na jednym kablu”. Dokładny opis skraca diagnozę i pozwala odtworzyć problem.",
};
const RECEIPT: PrepStep = {
  t: "Przy naprawie gwarancyjnej weź dowód zakupu",
  why: "Paragon albo fakturę. Bez niego nie sprawdzimy, czy sprzęt jest jeszcze na gwarancji producenta.",
};

export const PREP_TABS: PrepTab[] = [
  {
    id: "telefon",
    label: "Telefon / Tablet",
    categories: ["phone", "tablet"],
    steps: [
      BACKUP_PHONE,
      {
        t: "Przygotuj kod odblokowania albo wzór",
        why: "Podajesz go przy przyjęciu. Dzięki niemu po naprawie sprawdzimy aparat, dotyk, głośniki i ładowanie. Bez kodu naprawa jest możliwa, ale test po naprawie jest ograniczony.",
      },
      {
        t: "„Znajdź mój iPhone” i ochrona przed kradzieżą — tylko gdy poprosimy",
        why: "Nie wyłączaj ich na zapas. Jeśli naprawa tego wymaga, serwis powie o tym wprost — bez wyłączenia niektóre naprawy są niemożliwe.",
      },
      {
        t: "Android: znaj login i hasło do Konta Google",
        why: "Po niektórych naprawach telefon prosi o konto, na którym był skonfigurowany (ochrona FRP). Bez tych danych nie uruchomisz go ponownie.",
      },
      { t: "Wyjmij kartę SIM i kartę pamięci", why: "Zostają u Ciebie — nie zginą i nie trzeba ich przekładać przy odbiorze." },
      { t: "Zdejmij etui i szkło ochronne", why: "Pod nimi widać uszkodzenia obudowy. Przy wymianie ekranu i tak założymy nowe szkło — możesz od razu wybrać folię Hammer Glass." },
      DESCRIBE,
      RECEIPT,
    ],
  },
  {
    id: "laptop",
    label: "Laptop / Komputer",
    categories: ["laptop", "desktop"],
    steps: [
      { t: "Zrób kopię ważnych plików", why: "Jeśli komputer działa — na dysk zewnętrzny albo do chmury. Przy naprawie dysku lub systemu to najważniejszy krok." },
      { t: "Przygotuj hasło do konta w systemie", why: "Pozwala sprawdzić komputer po naprawie: Wi-Fi, dźwięk, kamerę, ładowanie. Możesz je też podać tylko na czas testu." },
      { t: "Do laptopa weź ładowarkę", why: "Oryginalna ładowarka pomaga sprawdzić zasilanie i baterię. Przy komputerze stacjonarnym wystarczy sama jednostka." },
      { t: "Odłącz pendrive’y, płyty i akcesoria", why: "Nie są potrzebne do naprawy, a łatwo o nich zapomnieć przy odbiorze." },
      DESCRIBE,
      RECEIPT,
    ],
  },
  {
    id: "konsola",
    label: "Konsola",
    categories: ["console"],
    steps: [
      { t: "Włącz kopię zapisów gier w chmurze", why: "PS Plus, Xbox Cloud albo Nintendo Online — zapisy będą bezpieczne, nawet gdy naprawa dotyczy dysku." },
      { t: "Znaj login do konta (PSN, Xbox, Nintendo)", why: "Po niektórych naprawach trzeba zalogować się ponownie." },
      { t: "Wyjmij płytę z napędu", why: "Chyba że konsola nie chce jej wysunąć — wtedy zaznacz to w zgłoszeniu." },
      { t: "Pad i przewód zasilający tylko wtedy, gdy usterka ich dotyczy", why: "Przy dryfie joysticka przynieś sam pad — konsola nie jest potrzebna." },
      DESCRIBE,
    ],
  },
  {
    id: "smartwatch",
    label: "Smartwatch",
    categories: ["smartwatch"],
    steps: [
      { t: "Zsynchronizuj zegarek z telefonem", why: "Aplikacja na telefonie robi kopię danych zegarka (treningi, ustawienia)." },
      { t: "Przygotuj kod odblokowania zegarka", why: "Bez kodu po naprawie sprawdzimy tylko podstawowe funkcje." },
      { t: "Weź ładowarkę lub stację", why: "Pozwala sprawdzić ładowanie — w zegarkach to częsta usterka." },
      { t: "Nie ładuj zegarka po zalaniu", why: "Wyłącz go i przynieś jak najszybciej. Ładowanie mokrego urządzenia może pogłębić uszkodzenie." },
      DESCRIBE,
    ],
  },
];

export function tabForCategory(category: DeviceCategory | null): PrepTab {
  return PREP_TABS.find((t) => category && t.categories.includes(category)) ?? PREP_TABS[0];
}
