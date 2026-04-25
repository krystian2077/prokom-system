import { Card, CardContent } from "@/components/ui/Card";

export const metadata = {
  title: "FAQ — Najczęstsze pytania o serwis telefonów | PRO-KOM Rabka-Zdrój",
  description:
    "Odpowiedzi na najczęstsze pytania o serwis telefonów i elektroniki w Rabce-Zdroju: czas naprawy, diagnoza, wycena, wysyłka kurierem, gwarancja. PRO-KOM, ul. Orkana 16B.",
  alternates: {
    canonical: "https://pro-kom.eu/faq",
  },
};

const faq = [
  {
    q: "Jak długo trwa naprawa telefonu?",
    a: "Proste naprawy, takie jak wymiana baterii lub tylnej szyby, często realizujemy tego samego dnia lub w ciągu 1–2 dni roboczych. Wymiana wyświetlacza lub naprawa po zalaniu zależy od dostępności części i skali uszkodzeń. Po diagnozie zawsze podajemy szacowany termin.",
  },
  {
    q: "Czy diagnoza jest bezpłatna?",
    a: "Tak. Diagnoza urządzenia jest bezpłatna i niezobowiązująca. Dopiero po przedstawieniu wyceny i Twojej akceptacji przystępujemy do naprawy.",
  },
  {
    q: "Czy mogę wysłać telefon kurierem lub paczkomatem?",
    a: "Tak. W formularzu zgłoszenia wybierz dostawę kurierem lub paczkomatem — instrukcje pakowania i adres serwisu wysyłamy automatycznie. Po naprawie odsyłamy urządzenie w ten sam sposób.",
  },
  {
    q: "Czy dostanę wycenę przed naprawą?",
    a: "Zawsze. Po diagnozie otrzymasz wycenę przez e-mail lub telefon, zależnie od Twoich preferencji. Możesz ją zaakceptować lub zrezygnować bez żadnych kosztów.",
  },
  {
    q: "Czy mogę śledzić status naprawy?",
    a: "Tak. Po przyjęciu zgłoszenia możesz śledzić jego status w panelu klienta na stronie. Link do panelu wysyłamy automatycznie.",
  },
  {
    q: "Jakie urządzenia naprawiacie?",
    a: "Naprawiamy smartfony (Samsung, iPhone, Xiaomi, Motorola, Huawei i inne), tablety (iPad, Samsung Galaxy Tab, Lenovo), laptopy, komputery stacjonarne, smartwatche, drukarki i konsole do gier. Obsługujemy klientów z Rabki-Zdroju i okolic.",
  },
  {
    q: "Czy sprzedajecie akcesoria do telefonów?",
    a: "Tak. W naszym sklepie w Rabce-Zdroju (ul. Orkana 16B) mamy dostępne od ręki: ładowarki GaN, kable USB-C i Lightning, powerbanki, etui, szkła hartowane, folie Hammer Glass i uchwyty samochodowe.",
  },
  {
    q: "Co to jest Hammer Glass CUT?",
    a: "Hammer Glass CUT to folia ochronna na ekran telefonu, wycinana precyzyjnie laserowo na ploterze dla konkretnego modelu telefonu. Mamy ponad 10 000 modeli w bazie. Montaż trwa około 5 minut. To lepsze rozwiązanie niż standardowe szkło hartowane, bo idealnie dopasowuje się do kształtu ekranu.",
  },
  {
    q: "Czy jesteście blisko Mszany Dolnej, Jordanowa, Nowego Targu?",
    a: "Tak. Nasz serwis mieści się w centrum Rabki-Zdroju przy ul. Orkana 16B. Obsługujemy klientów z Mszany Dolnej, Jordanowa, Raby Wyżnej, Nowego Targu i Czarnego Dunajca — zarówno osobiście, jak i wysyłkowo.",
  },
  {
    q: "Czy dacie gwarancję na naprawę?",
    a: "Tak. Na wykonane naprawy i wbudowane części udzielamy gwarancji. Szczegóły zależą od rodzaju naprawy — informujemy o tym przy wydaniu sprzętu.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 lg:px-4 lg:py-10">
      <h1 className="text-2xl font-bold text-prokom-black lg:text-3xl">FAQ — Najczęstsze pytania o serwis telefonów w Rabce-Zdroju</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-prokom-gray lg:text-base">Odpowiadamy na najczęstsze pytania klientów z Rabki-Zdroju i okolic dotyczące naprawy telefonów, akcesoriów GSM i naszego serwisu.</p>
      <div className="mt-6 space-y-3 lg:mt-8 lg:space-y-4">
        {faq.map(({ q, a }) => (
          <Card key={q} className="!rounded-2xl !border-0 !shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] lg:!rounded-lg lg:!border lg:!border-gray-200 lg:!shadow-sm">
            <CardContent className="p-5 lg:p-4">
              <h2 className="text-[15px] font-semibold text-prokom-black lg:text-base">{q}</h2>
              <p className="mt-2 text-sm leading-relaxed text-prokom-gray">{a}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
