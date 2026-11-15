/**
 * FAQ answers (accepted by Krystian on 15.11.2026) — one source for /faq and the site search.
 * Old FAQ promised free diagnosis, parcel lockers and a shop — removed (SPEC §8, §10).
 */
import { servicePoints } from "@/config/prokom";
import { courierPageHref } from "./courier";
import { PREP_GUIDE_HREF, PREP_GUIDE_READY, SUBMIT_HREF, TRACK_HREF } from "./nav";
import { inCity } from "./point-format";
import { publishedPoints } from "./points";
import type { FaqItem } from "./seo";

const published = publishedPoints(servicePoints);
const where = published.map((p) => inCity(p.city)).join(" i ");

export type FaqGroup = { id: string; title: string; items: FaqItem[]; links?: { href: string; label: string }[] };

export function faqGroups(): FaqGroup[] {
  const courier = courierPageHref();
  return [
    {
      id: "naprawa",
      title: "Naprawa",
      items: [
        { q: "Jakie urządzenia naprawiacie?", a: "Telefony, tablety, smartwatche, laptopy, komputery stacjonarne, drukarki i konsole do gier. Odzyskujemy też dane z dysków, pendrive’ów, kart pamięci i telefonów." },
        { q: "Czy muszę się umawiać?", a: `Nie. Możesz przyjść z urządzeniem w godzinach otwarcia ${published.length > 1 ? "punktów" : "punktu"} ${where}. Zgłoszenie online przyspiesza przyjęcie.` },
        { q: "Ile trwa naprawa?", a: "Zależy od usterki i dostępności części. Po diagnozie podajemy, ile potrwa naprawa w Twoim przypadku." },
        {
          q: "Jak przygotować sprzęt do serwisu?",
          a: "Zrób kopię zapasową danych, przygotuj kod odblokowania, zdejmij etui i wyjmij kartę SIM oraz kartę pamięci. Do laptopa dołącz ładowarkę.",
        },
      ],
      links: PREP_GUIDE_READY ? [{ href: PREP_GUIDE_HREF, label: "Jak przygotować sprzęt do serwisu" }] : undefined,
    },
    {
      id: "wycena",
      title: "Wycena i gwarancja",
      items: [
        { q: "Czy dostanę wycenę przed naprawą?", a: "Zawsze. Po diagnozie przekazujemy wycenę — naprawiamy dopiero po Twojej zgodzie." },
        { q: "Co, jeśli wycena mi nie odpowiada?", a: "Możesz zrezygnować z naprawy i odebrać sprzęt." },
        { q: "Czy dajecie gwarancję?", a: "Tak, na wykonaną usługę i na wymienione części. Szczegóły dostajesz przy odbiorze sprzętu." },
        { q: "Jakich części używacie?", a: "Rodzaj części zależy od modelu i dostępności. Przed naprawą mówimy, jaką część proponujemy." },
      ],
    },
    {
      id: "status",
      title: "Zgłoszenie i status",
      items: [
        { q: "Jak zgłosić naprawę online?", a: "Wypełnij formularz zgłoszenia: urządzenie, opis usterki, dane kontaktowe i sposób dostarczenia. Dostaniesz e-mail z numerem zgłoszenia." },
        { q: "Jak sprawdzę status naprawy?", a: "Na stronie statusu naprawy, po numerze zgłoszenia i 4 ostatnich cyfrach telefonu podanego w zgłoszeniu." },
        { q: "Czy muszę mieć konto?", a: "Nie. Konto klienta przydaje się, jeśli chcesz mieć wszystkie zgłoszenia w jednym miejscu." },
      ],
      links: [
        { href: SUBMIT_HREF, label: "Zgłoś naprawę" },
        { href: TRACK_HREF, label: "Sprawdź status naprawy" },
      ],
    },
    {
      id: "kurier",
      title: "Wysyłka kurierem",
      items: [
        { q: "Czy mogę wysłać sprzęt kurierem?", a: "Tak, na adres jednego z naszych salonów. Najlepiej najpierw zgłoś naprawę online (wybierz „Kurier”), napisz albo zadzwoń, a numer zgłoszenia włóż do paczki." },
        { q: "Czy mogę wysłać sprzęt przez paczkomat?", a: "Nie, nie obsługujemy paczkomatów. Nadaj paczkę kurierem pod adres salonu." },
      ],
      links: courier ? [{ href: courier, label: "Naprawa wysyłkowa — jak to działa" }] : undefined,
    },
    {
      id: "hammer-glass",
      title: "Hammer Glass",
      items: [
        { q: "Co to jest Hammer Glass?", a: "Folia ochronna wycinana na ploterze pod konkretny model telefonu, tabletu albo smartwatcha. Wycinamy ją i zakładamy na miejscu." },
        { q: "Czy mogę założyć folię przy odbiorze naprawy?", a: "Tak. W zgłoszeniu zaznacz, że chcesz folię, a założymy ją przy odbiorze." },
      ],
      links: [{ href: "/hammer-glass", label: "Hammer Glass — folie na wymiar" }],
    },
  ];
}
