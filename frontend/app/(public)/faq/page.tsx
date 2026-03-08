import { Card, CardContent } from "@/components/ui/Card";

export const metadata = {
  title: "FAQ | PRO-KOM Serwis",
  description: "Najczęściej zadawane pytania — czas naprawy, diagnoza, wysyłka, wycena.",
};

const faq = [
  { q: "Jak długo trwa naprawa?", a: "Zależy od usterki i dostępności części. Proste naprawy (np. wymiana baterii) często w 1–2 dni; wymiana wyświetlacza zwykle do kilku dni. Po diagnozie podamy szacowany termin." },
  { q: "Czy najpierw jest diagnoza?", a: "Tak. Najpierw diagnozujemy urządzenie i przygotowujemy wycenę. Dopiero po Twojej akceptacji wyceny rozpoczynamy naprawę." },
  { q: "Czy mogę wysłać urządzenie?", a: "Tak. W formularzu zgłoszenia wybierz dostawę kurierem lub paczkomatem i podaj adres. Po naprawie możemy odesłać urządzenie w ten sam sposób." },
  { q: "Czy dostanę wycenę?", a: "Tak. Po diagnozie otrzymasz wycenę (e-mail lub telefon, w zależności od preferencji). Możesz ją zaakceptować lub odrzucić." },
  { q: "Czy mogę śledzić status naprawy?", a: "Tak. Po przyjęciu zgłoszenia możesz śledzić status w panelu klienta (link wysyłamy w wiadomości)." },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-prokom-black">FAQ</h1>
      <p className="mt-2 text-prokom-gray">Najczęściej zadawane pytania</p>
      <div className="mt-8 space-y-4">
        {faq.map(({ q, a }) => (
          <Card key={q}>
            <CardContent className="p-4">
              <h2 className="font-semibold text-prokom-black">{q}</h2>
              <p className="mt-2 text-prokom-gray">{a}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
