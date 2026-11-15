/**
 * "Pytania o wizytę w punkcie" (design #punkty-serwisowe, #kontakt). Only question 01 has
 * an answer in the design; the others are written from SPEC §12.3 and KONTRAKT §2
 * (answers accepted on 15.11.2026).
 * Questions depend on data: parking only when a point has `parkingNote`, the other point
 * only when two points are published.
 */
import type { ServicePoint } from "@/config/prokom";
import { inCity } from "./point-format";
import type { FaqItem } from "./seo";

export function visitFaq(published: Pick<ServicePoint, "city" | "parkingNote">[]): FaqItem[] {
  const items: FaqItem[] = [
    {
      q: "Czy muszę się umawiać?",
      a: "Nie. Możesz przyjść w godzinach otwarcia. Zgłoszenie online przed wizytą skraca przyjęcie sprzętu, bo dane mamy już w systemie.",
    },
    {
      q: "Co zabrać ze sobą do serwisu?",
      a: "Sprzęt, a do laptopa także ładowarkę. Zdejmij etui, wyjmij kartę SIM i kartę pamięci. Jeśli naprawa ma być na gwarancji, weź dowód zakupu. Zanim przyjdziesz, zrób kopię zapasową danych.",
    },
  ];
  const parking = published.filter((p) => p.parkingNote);
  if (parking.length) {
    items.push({
      q: `Gdzie zaparkować ${parking.map((p) => inCity(p.city)).join(" i ")}?`,
      a: parking.map((p) => (parking.length > 1 ? `${p.city}: ${p.parkingNote}` : p.parkingNote!)).join(" "),
    });
  }
  if (published.length > 1) {
    items.push({
      q: "Czy sprzęt oddany w jednym punkcie odbiorę w drugim?",
      a: "Tak. Przy zgłoszeniu online wybierz inny punkt odbioru albo powiedz o tym przy przyjęciu sprzętu.",
    });
  }
  items.push({
    q: "Czy muszę podać kod blokady ekranu?",
    a: "Najlepiej tak. Podajesz go przy przyjęciu, żebyśmy mogli sprawdzić telefon po naprawie. Możesz też oddać sprzęt bez kodu, ale wtedy test po naprawie jest ograniczony.",
  });
  return items;
}
