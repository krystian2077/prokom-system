import type { Titled } from "@/lib/tech/content-types";

/** Hub /uslugi — extended texts (2026-11), to be accepted by Krystian. No cities, no prices. */
export const hubExtra = {
  intro: [
    "W serwisie naprawiamy sprzęt, z którego korzystasz na co dzień: telefony, tablety, smartwatche, laptopy, komputery stacjonarne, konsole i drukarki, a gdy sprzęt jest już stracony, odzyskujemy z niego dane. Każde urządzenie ma tu swoją stronę z objawami usterek, listą napraw, markami i pytaniami, które słyszymy najczęściej.",
    "Niezależnie od tego, co się zepsuło, zasada jest jedna: najpierw sprawdzamy sprzęt i mówimy, co jest uszkodzone, potem podajemy kwotę, a naprawiamy dopiero po Twojej zgodzie. Jeśli zrezygnujesz, odbierasz sprzęt. Postęp naprawy sprawdzisz online po numerze zgłoszenia.",
  ],
  /** "Od czego zacząć" — three ways in, plain steps. */
  start: [
    { t: "Wiesz, co się zepsuło", s: "Wybierz urządzenie poniżej albo od razu zgłoś naprawę online. Opis usterki i dane trafią do systemu, więc przyjęcie w salonie trwa krócej." },
    { t: "Nie wiesz, co jest przyczyną", s: "Opisz objawy w zgłoszeniu albo zadzwoń. Przyczynę ustalimy podczas diagnozy, a Ty zdecydujesz po wycenie." },
    { t: "Mieszkasz dalej", s: "Wyślij sprzęt kurierem do jednego z salonów. Płacisz przelewem po diagnozie i akceptacji wyceny, a sprzęt wraca do Ciebie kurierem." },
  ] satisfies Titled[],
  intake:
    "Zabierz urządzenie z ładowarką lub zasilaczem, jeśli usterka dotyczy ładowania albo zasilania. Zapisz kod blokady albo przygotuj się, że podasz go przy przyjęciu, i zrób kopię ważnych danych, jeśli sprzęt jeszcze działa. Do wysyłki zapakuj sprzęt w folię bąbelkową i sztywny karton, a do środka włóż kartkę z numerem zgłoszenia.",
  warranty:
    "Na wykonaną usługę i wymienione części dostajesz gwarancję. Szczegóły i zakres gwarancji dostajesz razem z naprawionym sprzętem. Jeśli po odbiorze coś działa nie tak, jak powinno, zgłoś to w salonie albo telefonicznie, a sprawdzimy sprzęt ponownie.",
  faq: [
    {
      q: "Czy mogę oddać sprzęt w jednym salonie, a odebrać w drugim?",
      a: "Tak. Powiedz o tym przy przyjęciu albo zaznacz w zgłoszeniu, a przygotujemy sprzęt do odbioru w wybranym salonie.",
    },
    {
      q: "Co jeśli naprawa się nie opłaca?",
      a: "Po diagnozie powiemy wprost, czy naprawa ma sens w Twoim przypadku. Jeśli zrezygnujesz, odbierasz sprzęt, a gdy zależy Ci na danych, podpowiemy, jak je odzyskać.",
    },
    {
      q: "Czy naprawiacie sprzęt firmowy?",
      a: "Tak. Telefony, laptopy, komputery i drukarki z firm przyjmujemy na tych samych zasadach: diagnoza, wycena, naprawa po akceptacji. Jeśli potrzebujesz faktury, podaj dane firmy w zgłoszeniu.",
    },
  ],
};
