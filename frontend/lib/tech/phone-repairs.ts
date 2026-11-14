/**
 * Phone repair content shared by /serwis-telefonow and the local pages
 * (design #serwis-telefonow-zakopane: rows, brands, steps). No prices (SPEC §8);
 * times only as confirmed claims, otherwise "po diagnozie".
 */
import type { ClaimKey } from "@/config/prokom";
import type { PageIcon } from "@/components/tech/page-icons";

export type RepairRow = { t: string; s: string; icon: PageIcon; usterka: string; time: { claim: ClaimKey; fallback: string } | string };

export const PHONE_REPAIRS: RepairRow[] = [
  { t: "Wymiana wyświetlacza i szybki", s: "Pęknięty ekran, brak obrazu, niedziałający dotyk.", icon: "crack", usterka: "Pęknięty ekran", time: { claim: "quickRepair", fallback: "po diagnozie" } },
  { t: "Wymiana baterii", s: "Szybkie rozładowywanie, nagrzewanie, spuchnięta bateria.", icon: "batt", usterka: "Słaba bateria", time: "po diagnozie" },
  { t: "Gniazdo ładowania USB-C i Lightning", s: "Telefon nie ładuje albo kabel wypada z gniazda.", icon: "plug", usterka: "Nie ładuje się", time: "po diagnozie" },
  { t: "Naprawa po zalaniu", s: "Czyszczenie i diagnoza. Liczy się czas, przynieś od razu.", icon: "drop", usterka: "Zalany telefon", time: "pilne" },
  { t: "Głośnik, mikrofon, aparat", s: "Słaby dźwięk, rozmówca nie słyszy, nieostre zdjęcia.", icon: "spk", usterka: "Głośnik, mikrofon albo aparat", time: "po diagnozie" },
  { t: "Tylna klapka i obudowa", s: "Pęknięte plecki, wygięta ramka, przyciski.", icon: "back", usterka: "Pęknięta obudowa", time: "po diagnozie" },
];

export const PHONE_BRANDS: { n: string; s: string }[] = [
  { n: "Apple", s: "iPhone: ekran, bateria, gniazdo Lightning i USB-C." },
  { n: "Samsung", s: "Galaxy S i A: wyświetlacz, bateria, tylna klapka." },
  { n: "Xiaomi", s: "Xiaomi, Redmi i POCO: ekran, gniazdo, bateria." },
  { n: "Motorola", s: "Seria moto g i edge: wyświetlacz, ładowanie." },
  { n: "realme", s: "Ekran, bateria, gniazdo ładowania." },
  { n: "Huawei", s: "Wyświetlacz, bateria, obudowa." },
];

/** "Cztery kroki do sprawnego telefonu". `cityName` makes step 1 local ("z wyborem punktu Zakopane"). */
export function phoneSteps(cityName: string | null, sameDay: string | null): { t: string; s: string }[] {
  return [
    {
      t: "Zgłaszasz",
      s: cityName ? `Online z wyborem punktu ${cityName} albo po prostu przychodzisz.` : "Online w kilka minut albo po prostu przychodzisz do punktu.",
    },
    { t: "Diagnoza i wycena", s: sameDay ? `${sameDay} Kwotę znasz przed naprawą.` : "Kwotę znasz przed naprawą." },
    { t: "Naprawa i testy", s: "Po Twojej zgodzie. Status widzisz online." },
    { t: "Odbiór", s: "W punkcie albo kurierem, z gwarancją na usługę i części." },
  ];
}
