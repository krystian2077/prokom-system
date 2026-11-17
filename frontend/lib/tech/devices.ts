/**
 * Device pages (docs/tech/SPEC.md §6, TD5 PR 1): /serwis-laptopow, -tabletow, -komputerow,
 * -drukarek, -konsol, -smartwatchy and /odzyskiwanie-danych, plus the /uslugi hub.
 *
 * Content moved from the old pages and cleaned up to SPEC §8: no prices, no messengers,
 * no parcel lockers, no unconfirmed time promises (those go through `claim()`).
 * Categories = KONTRAKT §1.1, faults = wizard-data (the "Zgłoś" links prefill the form).
 *
 * Texts (leads, repair rows, FAQ) accepted by Krystian on 15.11.2026.
 */
import type { ServicePoint } from "@/config/prokom";
import type { HomeIcon } from "@/components/tech/icons";
import type { DeviceIcon } from "./nav";
import { joinCities } from "./point-format";
import { computerDeviceExtra } from "@/config/tresci/urzadzenia-komputery";
import { mobileDeviceExtra } from "@/config/tresci/urzadzenia-mobilne";
import type { DeviceExtra } from "./content-types";
import type { FaqItem } from "./seo";
import { wizardDevices, type CategoryCode } from "./wizard-data";

export type DeviceRepair = {
  t: string;
  s: string;
  icon: HomeIcon;
  /** Fault from wizard-data for the device — the "Zgłoś" link prefills it. */
  fault: string | null;
  /** "pilne" for liquid damage; otherwise the time is known after diagnosis. */
  urgent?: boolean;
};

export type DeviceKind = { n: string; s: string };

export type DevicePhoto = { src: string; width: number; height: number; alt: string };

export type DevicePage = {
  slug: string;
  path: string;
  category: CategoryCode;
  icon: DeviceIcon;
  /** "Serwis laptopów" — H1 first line and menu label. */
  name: string;
  /** Short name used in cards ("Laptopy"). */
  short: string;
  /** "laptopa" — button "Zgłoś naprawę laptopa". */
  genitive: string;
  /** Description: "{descStart} Rabka-Zdrój[ i Zakopane]. {descEnd}" (120–155 chars, tests). */
  descStart: string;
  descEnd: string;
  lead: string;
  /** One line for hub cards. */
  card: string;
  photo: DevicePhoto | null;
  repairsTitle: string;
  repairsLead: string;
  repairs: DeviceRepair[];
  kindsEyebrow: string;
  kindsTitle: string;
  kindsLead: string;
  kinds: DeviceKind[];
  /** Highlighted note before FAQ (e.g. data recovery: stop using the drive). */
  note?: { title: string; text: string };
  faq: FaqItem[];
  /** Extended content (2026-11, config/tresci): intro, symptoms, intake, warranty. */
  extra: DeviceExtra;
};

const PRICE_ANSWER =
  "Kwota zależy od modelu, usterki i części, dlatego podajemy ją po diagnozie. Zanim zaczniemy naprawę, znasz wycenę. Jeśli się nie zdecydujesz, odbierasz sprzęt.";

const baseDevicePages: Omit<DevicePage, "extra">[] = [
  {
    slug: "serwis-laptopow",
    path: "/serwis-laptopow",
    category: "laptop",
    icon: "laptop",
    name: "Serwis laptopów",
    short: "Laptopy",
    genitive: "laptopa",
    descStart: "Naprawa laptopów w PRO-KOM Tech —",
    descEnd: "Matryca, klawiatura, czyszczenie, dysk SSD i zasilanie. Wycena przed naprawą.",
    lead: "Naprawiamy laptopy wszystkich popularnych marek: wymiana matrycy i klawiatury, czyszczenie układu chłodzenia, dysk SSD i pamięć RAM, problemy z ładowaniem. Najpierw diagnoza i wycena, naprawa dopiero po Twojej zgodzie.",
    card: "Matryca, klawiatura, czyszczenie, dysk SSD, zasilanie.",
    photo: { src: "/tech/urzadzenia/laptop-bez-logo.webp", width: 640, height: 640, alt: "Laptop w serwisie" },
    repairsTitle: "Co naprawiamy w laptopach",
    repairsLead: "Kwota zależy od modelu i części, dlatego podajemy ją po diagnozie. Zanim zaczniemy, znasz wycenę.",
    repairs: [
      { t: "Wymiana matrycy", s: "Pęknięty ekran, martwe piksele, brak podświetlenia.", icon: "crack", fault: "Matryca" },
      { t: "Wymiana klawiatury", s: "Zalane, niedziałające albo odpadające klawisze.", icon: "list", fault: "Klawiatura" },
      { t: "Czyszczenie i pasta termoprzewodząca", s: "Laptop się grzeje, głośno pracuje albo sam się wyłącza.", icon: "spk", fault: "Przegrzewa się" },
      { t: "Zasilanie i bateria", s: "Nie ładuje, nie włącza się, bateria szybko się rozładowuje.", icon: "batt", fault: "Nie ładuje" },
      { t: "Dysk SSD i pamięć RAM", s: "Wymiana dysku HDD na SSD i rozbudowa pamięci — laptop działa szybciej.", icon: "dots", fault: "Działa wolno" },
      { t: "Naprawa po zalaniu", s: "Liczy się czas: wyłącz laptopa i przynieś go od razu.", icon: "drop", fault: "Po zalaniu", urgent: true },
    ],
    kindsEyebrow: "Marki",
    kindsTitle: "Jakie laptopy naprawiamy",
    kindsLead: "Nie widzisz swojej marki? Zadzwoń. Sprawdzimy dostępność części do Twojego modelu.",
    kinds: [
      { n: "Lenovo", s: "IdeaPad, ThinkPad, Legion: matryca, klawiatura, zasilanie." },
      { n: "HP", s: "Pavilion, ProBook, EliteBook: ekran, bateria, czyszczenie." },
      { n: "Dell", s: "Inspiron, Latitude, Vostro: zasilanie, dysk, klawiatura." },
      { n: "ASUS", s: "VivoBook, ZenBook, ROG: matryca, chłodzenie, gniazdo." },
      { n: "Acer", s: "Aspire, Nitro, Swift: ekran, klawiatura, dysk SSD." },
      { n: "Apple", s: "MacBook Air i Pro: diagnoza, bateria, czyszczenie." },
    ],
    faq: [
      { q: "Ile kosztuje naprawa laptopa?", a: PRICE_ANSWER },
      { q: "Laptop się przegrzewa i wyłącza. Co robić?", a: "Najczęściej winny jest zakurzony układ chłodzenia i wyschnięta pasta termoprzewodząca. Czyszczenie i wymiana pasty zwykle przywracają normalną temperaturę. Nie używaj laptopa na kocu ani poduszce, bo zasłaniają wloty powietrza." },
      { q: "Czy opłaca się wymiana dysku na SSD?", a: "W starszych laptopach z dyskiem HDD to zwykle najbardziej odczuwalna zmiana: system i programy uruchamiają się dużo szybciej. Przy wymianie możemy przenieść system i dane na nowy dysk." },
      { q: "Czy stracę dane przy naprawie?", a: "Większość napraw nie dotyka danych, ale przed oddaniem sprzętu zrób kopię ważnych plików. Jeśli naprawa wymaga ingerencji w dysk lub system, powiemy o tym przed rozpoczęciem pracy." },
      { q: "Zalałem laptopa. Co zrobić od razu?", a: "Wyłącz go, odłącz zasilacz, nie próbuj włączać i nie susz suszarką. Przynieś laptopa jak najszybciej — im krócej ciecz działa na płytę, tym większa szansa na naprawę." },
    ],
  },
  {
    slug: "serwis-tabletow",
    path: "/serwis-tabletow",
    category: "tablet",
    icon: "tablet",
    name: "Serwis tabletów",
    short: "Tablety",
    genitive: "tabletu",
    descStart: "Naprawa tabletów —",
    descEnd: "Wymiana ekranu i dotyku, baterii, gniazda ładowania, pomoc po zalaniu. Wycena przed naprawą.",
    lead: "Naprawiamy tablety: wymiana wyświetlacza i szybki dotykowej, baterii i gniazda ładowania, pomoc po zalaniu. Diagnoza i wycena przed naprawą, gwarancja na usługę i części.",
    card: "Ekran i dotyk, bateria, gniazdo, system.",
    photo: { src: "/tech/urzadzenia/tablet.webp", width: 577, height: 640, alt: "Tablet w serwisie" },
    repairsTitle: "Co naprawiamy w tabletach",
    repairsLead: "Kwota zależy od modelu i części, dlatego podajemy ją po diagnozie. Zanim zaczniemy, znasz wycenę.",
    repairs: [
      { t: "Wymiana wyświetlacza i szybki", s: "Pęknięty ekran, niedziałający dotyk, brak obrazu.", icon: "crack", fault: "Pęknięty ekran" },
      { t: "Wymiana baterii", s: "Tablet słabo trzyma ładowanie albo wyłącza się podczas pracy.", icon: "batt", fault: "Bateria" },
      { t: "Gniazdo ładowania", s: "USB-C i Lightning: nie ładuje albo ładuje tylko pod kątem.", icon: "plug", fault: "Nie ładuje" },
      { t: "Głośnik, mikrofon, aparat", s: "Cichy dźwięk, rozmówca nie słyszy, nieostre zdjęcia.", icon: "spk", fault: "Głośnik lub mikrofon" },
      { t: "Naprawa po zalaniu", s: "Wyłącz tablet i przynieś go od razu — liczy się czas.", icon: "drop", fault: "Po zalaniu", urgent: true },
    ],
    kindsEyebrow: "Marki",
    kindsTitle: "Jakie tablety naprawiamy",
    kindsLead: "Nie widzisz swojej marki? Zadzwoń. Sprawdzimy dostępność części do Twojego modelu.",
    kinds: [
      { n: "Apple", s: "iPad, iPad Air, iPad Pro i mini: ekran, bateria, gniazdo." },
      { n: "Samsung", s: "Galaxy Tab A i S: wyświetlacz, bateria, ładowanie." },
      { n: "Lenovo", s: "Tab M i P: ekran, gniazdo, bateria." },
      { n: "Xiaomi", s: "Xiaomi Pad i Redmi Pad: wyświetlacz, ładowanie." },
      { n: "Huawei", s: "MatePad: ekran, bateria, obudowa." },
    ],
    faq: [
      { q: "Ile kosztuje wymiana ekranu w tablecie?", a: PRICE_ANSWER },
      { q: "Pękła tylko szybka, a obraz działa. Czy trzeba naprawiać?", a: "Warto. Pęknięcia się powiększają, odpryski mogą skaleczyć, a przez szczeliny do środka dostaje się kurz i wilgoć. W wielu tabletach szybka i wyświetlacz tworzą jedną część — powiemy, co trzeba wymienić w Twoim modelu." },
      { q: "Tablet nie ładuje. Czy to gniazdo, czy bateria?", a: "Najpierw sprawdź inny kabel i ładowarkę. Jeśli to nie pomaga, w serwisie sprawdzimy gniazdo, baterię i układ ładowania i powiemy, co jest przyczyną." },
      { q: "Czy muszę podać kod do tabletu?", a: "Kod pozwala sprawdzić po naprawie, czy wszystko działa. Możesz oddać tablet bez kodu — wtedy test po naprawie jest ograniczony." },
    ],
  },
  {
    slug: "serwis-komputerow",
    path: "/serwis-komputerow",
    category: "desktop",
    icon: "pc",
    name: "Serwis komputerów",
    short: "Komputery",
    genitive: "komputera",
    descStart: "Naprawa komputerów stacjonarnych —",
    descEnd: "Diagnostyka, wymiana podzespołów, rozbudowa i system Windows. Wycena przed naprawą.",
    lead: "Naprawiamy komputery stacjonarne: diagnostyka, wymiana i rozbudowa podzespołów, czyszczenie, instalacja i naprawa systemu Windows. Najpierw diagnoza i wycena, naprawa po Twojej zgodzie.",
    card: "Windows, dysk, RAM, czyszczenie, płyta główna.",
    photo: { src: "/tech/urzadzenia/komputer.webp", width: 640, height: 640, alt: "Komputer stacjonarny w serwisie" },
    repairsTitle: "Co naprawiamy w komputerach",
    repairsLead: "Kwota zależy od usterki i części, dlatego podajemy ją po diagnozie. Zanim zaczniemy, znasz wycenę.",
    repairs: [
      { t: "Diagnostyka sprzętowa", s: "Komputer się nie włącza, wyświetla błędy albo sam się restartuje.", icon: "help", fault: "Nie włącza się" },
      { t: "Wymiana podzespołów", s: "Dysk, pamięć RAM, karta graficzna, zasilacz, płyta główna.", icon: "dots", fault: "Brak obrazu" },
      { t: "Rozbudowa i modernizacja", s: "Dobieramy części i rozbudowujemy komputer do pracy lub grania.", icon: "star", fault: "Rozbudowa" },
      { t: "Czyszczenie i chłodzenie", s: "Głośna praca, wysokie temperatury, wyłączanie pod obciążeniem.", icon: "spk", fault: "Głośno pracuje, grzeje się" },
      { t: "System Windows i wirusy", s: "Instalacja, naprawa systemu, sterowniki, usuwanie wirusów.", icon: "shield", fault: "System i wirusy" },
      { t: "Dysk i dane", s: "Dysk nie jest widoczny albo zgłasza błędy — zabezpieczamy dane.", icon: "back", fault: "Dysk i dane" },
    ],
    kindsEyebrow: "Komputery",
    kindsTitle: "Jakie komputery naprawiamy",
    kindsLead: "Naprawiamy zarówno komputery markowe, jak i składane z części. Nie wiesz, co masz? Opisz objawy w zgłoszeniu.",
    kinds: [
      { n: "Składaki", s: "Komputery składane z części: diagnoza, wymiana, rozbudowa." },
      { n: "Do gier", s: "Karta graficzna, chłodzenie, zasilacz, stabilność pod obciążeniem." },
      { n: "Biurowe", s: "Dell, HP, Lenovo: dysk SSD, pamięć, system." },
      { n: "All-in-One", s: "Komputery z wbudowanym monitorem: diagnoza i naprawa." },
    ],
    faq: [
      { q: "Ile kosztuje naprawa komputera?", a: PRICE_ANSWER },
      { q: "Komputer działa coraz wolniej. Co pomoże?", a: "Często wystarczy wymiana dysku HDD na SSD, dołożenie pamięci RAM albo uporządkowanie systemu. Po diagnozie doradzimy, co da największą różnicę w Twoim komputerze." },
      { q: "Czy muszę przynosić monitor, klawiaturę i myszkę?", a: "Zwykle wystarczy sama jednostka (obudowa z podzespołami). Jeśli usterka dotyczy obrazu albo konkretnego urządzenia, przynieś też monitor lub to urządzenie." },
      { q: "Czy zachowacie moje pliki przy reinstalacji systemu?", a: "Przed reinstalacją pytamy, co zabezpieczyć. Mimo to zrób kopię najważniejszych plików przed oddaniem komputera." },
    ],
  },
  {
    slug: "serwis-drukarek",
    path: "/serwis-drukarek",
    category: "printer",
    icon: "printer",
    name: "Serwis drukarek",
    short: "Drukarki",
    genitive: "drukarki",
    descStart: "Naprawa drukarek —",
    descEnd: "Atramentowe, laserowe i wielofunkcyjne — głowice, podawanie papieru, Wi-Fi. Wycena przed naprawą.",
    lead: "Naprawiamy drukarki atramentowe, laserowe i urządzenia wielofunkcyjne: czyszczenie głowic, podawanie papieru, skaner, konfiguracja w sieci i Wi-Fi. Wycena przed naprawą.",
    card: "Głowice, podajnik papieru, skaner, sieć Wi-Fi.",
    photo: { src: "/tech/urzadzenia/drukarka.webp", width: 640, height: 449, alt: "Drukarka w serwisie" },
    repairsTitle: "Co naprawiamy w drukarkach",
    repairsLead: "Kwota zależy od modelu i usterki, dlatego podajemy ją po diagnozie. Zanim zaczniemy, znasz wycenę.",
    repairs: [
      { t: "Drukarki atramentowe", s: "Czyszczenie głowic, kalibracja, paski i smugi na wydruku.", icon: "drop", fault: "Tusz i głowica" },
      { t: "Drukarki laserowe", s: "Bęben, utrwalacz, problemy z jakością wydruku.", icon: "list", fault: "Paski na wydruku" },
      { t: "Podawanie papieru", s: "Drukarka zacina albo pobiera kilka kartek naraz.", icon: "back", fault: "Zacina papier" },
      { t: "Skaner i urządzenia wielofunkcyjne", s: "Skaner nie działa albo kopie wychodzą z błędami.", icon: "dots", fault: "Skaner" },
      { t: "Sieć i Wi-Fi", s: "Konfiguracja w domu lub biurze, sterowniki, połączenie bezprzewodowe.", icon: "plug", fault: "Brak Wi-Fi" },
      { t: "Błędy na panelu", s: "Drukarka pokazuje błąd i nie chce drukować.", icon: "help", fault: "Błąd na panelu" },
    ],
    kindsEyebrow: "Marki",
    kindsTitle: "Jakie drukarki naprawiamy",
    kindsLead: "Nie widzisz swojej marki? Zadzwoń. Powiemy, czy naprawa ma sens w Twoim modelu.",
    kinds: [
      { n: "HP", s: "DeskJet, OfficeJet, LaserJet: głowice, papier, sieć." },
      { n: "Canon", s: "PIXMA i i-SENSYS: głowice, podawanie, skaner." },
      { n: "Epson", s: "EcoTank i WorkForce: głowice, czyszczenie, Wi-Fi." },
      { n: "Brother", s: "Laserowe i atramentowe: bęben, utrwalacz, papier." },
    ],
    faq: [
      { q: "Ile kosztuje naprawa drukarki?", a: PRICE_ANSWER },
      { q: "Czy naprawa drukarki się opłaca?", a: "Zależy od modelu i usterki. Po diagnozie powiemy wprost, czy naprawa ma sens, czy lepiej rozważyć inne rozwiązanie." },
      { q: "Drukarka drukuje paski. Co mogę sprawdzić sam?", a: "Uruchom czyszczenie głowic z menu drukarki i sprawdź poziom tuszu. Jeśli po dwóch, trzech próbach nic się nie zmienia, głowica może być zaschnięta albo uszkodzona — wtedy zgłoś naprawę." },
      { q: "Czy przynieść kable i tusze?", a: "Przynieś drukarkę z zasilaczem (jeśli jest osobny). Wkłady zostaw w drukarce — pomagają sprawdzić, gdzie jest problem." },
    ],
  },
  {
    slug: "serwis-konsol",
    path: "/serwis-konsol",
    category: "console",
    icon: "console",
    name: "Serwis konsol",
    short: "Konsole",
    genitive: "konsoli",
    descStart: "Naprawa konsol PlayStation, Xbox i Nintendo —",
    descEnd: "HDMI, napęd, czyszczenie i dryf w padzie. Wycena przed naprawą.",
    lead: "Naprawiamy konsole PlayStation, Xbox i Nintendo oraz pady: złącze HDMI, napęd, przegrzewanie i głośna praca, dryf joysticka. Diagnoza i wycena przed naprawą.",
    card: "HDMI, napęd, czyszczenie, dryf joysticka w padzie.",
    photo: { src: "/tech/urzadzenia/konsola.webp", width: 640, height: 640, alt: "Konsola do gier w serwisie" },
    repairsTitle: "Co naprawiamy w konsolach",
    repairsLead: "Kwota zależy od modelu i usterki, dlatego podajemy ją po diagnozie. Zanim zaczniemy, znasz wycenę.",
    repairs: [
      { t: "Złącze HDMI", s: "Brak obrazu, migający obraz, uszkodzone gniazdo.", icon: "plug", fault: "Brak obrazu (HDMI)" },
      { t: "Napęd", s: "Konsola nie czyta płyt albo zgłasza błąd napędu.", icon: "dots", fault: "Nie czyta płyt" },
      { t: "Czyszczenie i chłodzenie", s: "Konsola głośno pracuje, grzeje się albo wyłącza.", icon: "spk", fault: "Głośna, przegrzewa się" },
      { t: "Zasilanie", s: "Konsola się nie włącza albo wyłącza zaraz po starcie.", icon: "batt", fault: "Nie włącza się" },
      { t: "Pady", s: "Dryf joysticka, przyciski, ładowanie pada.", icon: "star", fault: "Dryf w padzie" },
    ],
    kindsEyebrow: "Konsole",
    kindsTitle: "Jakie konsole naprawiamy",
    kindsLead: "Nie widzisz swojej konsoli? Zadzwoń. Powiemy, czy naprawimy Twój model.",
    kinds: [
      { n: "PlayStation", s: "PS5, PS4 i PS4 Pro: HDMI, napęd, czyszczenie, pady DualSense." },
      { n: "Xbox", s: "Xbox Series i One: napęd, złącza, uruchamianie." },
      { n: "Nintendo", s: "Switch: gniazdo ładowania, Joy-Con, ekran." },
    ],
    faq: [
      { q: "Ile kosztuje naprawa konsoli?", a: PRICE_ANSWER },
      { q: "Konsola jest bardzo głośna. Czy to awaria?", a: "Najczęściej to kurz w układzie chłodzenia. Czyszczenie i wymiana pasty termoprzewodzącej obniżają temperaturę i hałas, a konsola rzadziej się wyłącza." },
      { q: "Postać sama chodzi w grze. Co to jest?", a: "To dryf joysticka w padzie. Zwykle pomaga wymiana modułu analogowej gałki. Przynieś sam pad — konsola nie jest potrzebna." },
      { q: "Czy stracę zapisy gier?", a: "Większość napraw nie dotyka danych. Jeśli to możliwe, włącz kopię zapisów w chmurze przed oddaniem konsoli, zwłaszcza przy naprawie dysku lub zasilania." },
    ],
  },
  {
    slug: "serwis-smartwatchy",
    path: "/serwis-smartwatchy",
    category: "smartwatch",
    icon: "watch",
    name: "Serwis smartwatchy",
    short: "Smartwatche",
    genitive: "smartwatcha",
    descStart: "Naprawa smartwatchy —",
    descEnd: "Pęknięte szkło i ekran, bateria, ładowanie, pomoc po zalaniu. Diagnoza i wycena przed naprawą.",
    lead: "Naprawiamy smartwatche: pęknięte szkło i wyświetlacz, bateria, która szybko się rozładowuje, problemy z ładowaniem i pomoc po zalaniu. Na nowe szkło możemy założyć folię Hammer Glass wyciętą na wymiar.",
    card: "Szkło, bateria, folia ochronna na wymiar.",
    photo: null,
    repairsTitle: "Co naprawiamy w smartwatchach",
    repairsLead: "Kwota zależy od modelu i części, dlatego podajemy ją po diagnozie. Zanim zaczniemy, znasz wycenę.",
    repairs: [
      { t: "Szkło i wyświetlacz", s: "Pęknięte szkiełko, brak obrazu, niedziałający dotyk.", icon: "crack", fault: "Pęknięte szkło" },
      { t: "Wymiana baterii", s: "Zegarek szybko się rozładowuje albo nie trzyma ładowania.", icon: "batt", fault: "Bateria" },
      { t: "Ładowanie", s: "Zegarek nie ładuje się na stacji albo ładuje z przerwami.", icon: "plug", fault: "Nie ładuje" },
      { t: "Diagnostyka", s: "Nie włącza się, nie łączy z telefonem, problemy z oprogramowaniem.", icon: "help", fault: "Nie włącza się" },
      { t: "Naprawa po zalaniu", s: "Zegarek przestał działać po kontakcie z wodą — przynieś go od razu.", icon: "drop", fault: "Po zalaniu", urgent: true },
    ],
    kindsEyebrow: "Marki",
    kindsTitle: "Jakie smartwatche naprawiamy",
    kindsLead: "Nie widzisz swojego zegarka? Zadzwoń. Sprawdzimy dostępność części do Twojego modelu.",
    kinds: [
      { n: "Apple Watch", s: "Szkło, wyświetlacz, bateria." },
      { n: "Samsung", s: "Galaxy Watch: szkło, bateria, ładowanie." },
      { n: "Huawei", s: "Watch GT i Fit: ekran, bateria." },
      { n: "Xiaomi", s: "Mi Band i Watch: ekran, ładowanie." },
    ],
    faq: [
      { q: "Ile kosztuje naprawa smartwatcha?", a: PRICE_ANSWER },
      { q: "Zegarek jest wodoszczelny, a po kąpieli przestał działać. Dlaczego?", a: "Wodoszczelność słabnie z czasem i po uderzeniach, a ciepła woda, mydło czy sauna szybciej ją niszczą. Nie ładuj zegarka po zalaniu i przynieś go jak najszybciej." },
      { q: "Czy po wymianie szkła zegarek będzie wodoszczelny?", a: "Wodoszczelności po naprawie nie da się zagwarantować tak jak w fabryce. Powiemy, czego można się spodziewać w Twoim modelu, zanim zaczniemy." },
      { q: "Czy mogę zabezpieczyć nowe szkło?", a: "Tak. Folię Hammer Glass wycinamy na miejscu pod konkretny model zegarka." },
    ],
  },
  {
    slug: "odzyskiwanie-danych",
    path: "/odzyskiwanie-danych",
    category: "data_recovery",
    icon: "data",
    name: "Odzyskiwanie danych",
    short: "Odzysk danych",
    genitive: "odzysku danych",
    descStart: "Odzyskiwanie danych w PRO-KOM Tech —",
    descEnd: "Dyski HDD i SSD, pendrive, karty pamięci i telefony. Wycena po wstępnej diagnozie.",
    lead: "Odzyskujemy dane z dysków HDD i SSD, pendrive’ów, kart pamięci oraz telefonów i tabletów. Wycenę podajemy po wstępnej diagnozie nośnika, a odzysk zaczynamy po Twojej zgodzie.",
    card: "Z telefonu, dysku, pendrive’a i karty pamięci.",
    photo: null,
    repairsTitle: "Skąd odzyskujemy dane",
    repairsLead: "Szansa na odzysk zależy od nośnika i rodzaju uszkodzenia. Po wstępnej diagnozie powiemy, co da się zrobić i ile to kosztuje.",
    repairs: [
      { t: "Dyski twarde HDD", s: "Dysk niewidoczny, stuka albo głośno pracuje.", icon: "dots", fault: "Z dysku HDD lub SSD" },
      { t: "Dyski SSD", s: "Dysk SSD nie jest wykrywany albo system się nie uruchamia.", icon: "back", fault: "Z dysku HDD lub SSD" },
      { t: "Pendrive i karty pamięci", s: "Karta SD lub microSD niewidoczna, zniknęły zdjęcia.", icon: "plug", fault: "Z pendrive’a lub karty" },
      { t: "Telefony i tablety", s: "Telefon się nie włącza, a w środku są ważne zdjęcia i kontakty.", icon: "crack", fault: "Z telefonu" },
      { t: "Usunięte pliki", s: "Skasowane przez pomyłkę albo po sformatowaniu nośnika.", icon: "help", fault: "Usunięte pliki" },
      { t: "Sprzęt po zalaniu", s: "Nośnik lub urządzenie po kontakcie z wodą — przynieś je od razu.", icon: "drop", fault: "Sprzęt po zalaniu", urgent: true },
    ],
    kindsEyebrow: "Nośniki",
    kindsTitle: "Z jakich nośników odzyskujemy dane",
    kindsLead: "Nie wiesz, jaki masz nośnik? Przynieś go albo opisz w zgłoszeniu. Sprawdzimy go przed wyceną.",
    kinds: [
      { n: "HDD", s: "Dyski talerzowe z komputerów, laptopów i obudów zewnętrznych." },
      { n: "SSD", s: "Dyski SATA i M.2 z laptopów i komputerów." },
      { n: "Pendrive", s: "Pamięci USB, które przestały być widoczne." },
      { n: "Karty SD", s: "Karty z aparatów, telefonów, kamer i dronów." },
      { n: "Telefony", s: "Pamięć wewnętrzna telefonów i tabletów." },
    ],
    note: {
      title: "Ważne: im szybciej, tym lepiej",
      text: "Po utracie danych nie zapisuj niczego na nośniku, nie instaluj programów do odzysku na tym samym dysku i nie formatuj go. Każde dalsze użycie zmniejsza szansę na odzyskanie plików.",
    },
    faq: [
      { q: "Ile kosztuje odzyskiwanie danych?", a: "Kwota zależy od nośnika i rodzaju uszkodzenia, dlatego podajemy ją po wstępnej diagnozie. Odzysk zaczynamy dopiero po Twojej zgodzie." },
      { q: "Czy zawsze da się odzyskać dane?", a: "Nie zawsze. Szansa zależy od uszkodzenia i tego, co działo się z nośnikiem po awarii. Po diagnozie powiemy uczciwie, czego można się spodziewać." },
      { q: "Dysk stuka. Czy mogę go jeszcze podłączać?", a: "Nie. Stukanie oznacza zwykle uszkodzenie mechaniczne, a każde kolejne uruchomienie może zniszczyć dane. Odłącz dysk i przynieś go do serwisu." },
      { q: "Czy ktoś będzie oglądał moje pliki?", a: "Pracujemy tylko na plikach potrzebnych do odzysku i sprawdzenia, czy się otwierają. Możesz wskazać, które foldery są najważniejsze." },
      { q: "Na co dostanę odzyskane dane?", a: "Na nośnik, który ustalimy przy wycenie — np. Twój dysk zewnętrzny albo nowy nośnik." },
    ],
  },
];

/** Extended texts by page slug (phones: /serwis-telefonow has its own page). */
export const deviceExtra: Record<string, DeviceExtra> = { ...mobileDeviceExtra, ...computerDeviceExtra };

/** Accepted base + extended texts: FAQ appended, `kinds` replaced when the extra has them. */
export const devicePages: DevicePage[] = baseDevicePages.map((d) => {
  const extra = deviceExtra[d.slug];
  if (!extra) throw new Error(`No extended content for ${d.slug}`);
  return { ...d, extra, kinds: extra.kinds ?? d.kinds, faq: [...d.faq, ...extra.faq] };
});

export function devicePageBySlug(slug: string): DevicePage {
  const page = devicePages.find((d) => d.slug === slug);
  if (!page) throw new Error(`Unknown device page: ${slug}`);
  return page;
}

/** "Rabka-Zdrój" or "Rabka-Zdrój i Zakopane" — published points only (SPEC §5). */
export function citiesTitle(points: Pick<ServicePoint, "city">[]): string {
  return joinCities(points);
}

/** SEO title (before " | PRO-KOM Tech") and description for a device page. */
export function deviceSeo(page: DevicePage, points: Pick<ServicePoint, "city">[]): { title: string; description: string } {
  const cities = citiesTitle(points);
  return {
    title: `${page.name} — ${cities}`,
    description: `${page.descStart} ${cities}. ${page.descEnd}`,
  };
}

/** Fault exists in wizard-data for the category (tests). */
export function faultExists(category: CategoryCode, fault: string): boolean {
  return wizardDevices.some((d) => d.category === category && d.faults.includes(fault));
}

/** Hub cards: phones (TD4 page) + all device pages. */
export type HubCard = { t: string; s: string; href: string; icon: DeviceIcon; photo: DevicePhoto | null };
export const hubCards: HubCard[] = [
  {
    t: "Serwis telefonów",
    s: "Ekran, bateria, gniazdo ładowania, pomoc po zalaniu.",
    href: "/serwis-telefonow",
    icon: "phone",
    photo: { src: "/tech/urzadzenia/iphone.webp", width: 433, height: 577, alt: "Telefon w serwisie" },
  },
  ...devicePages.map((d) => ({ t: d.name, s: d.card, href: d.path, icon: d.icon, photo: d.photo })),
];
