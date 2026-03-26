import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Serwis tabletów Rabka-Zdrój — naprawa iPad, Galaxy Tab | PRO-KOM",
  description:
    "Naprawa tabletów w Rabce-Zdroju: wymiana wyświetlacza, baterii, gniazda ładowania. iPad, Samsung Galaxy Tab, Lenovo, Huawei i inne. Bezpłatna diagnoza i wycena. PRO-KOM, ul. Orkana 16B.",
  alternates: {
    canonical: "https://pro-kom.eu/serwis-tabletow",
  },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-prokom-black">Serwis tabletów Rabka-Zdrój</h1>
      <p className="mt-4 text-prokom-gray">
        Naprawiamy tablety wszystkich popularnych marek w Rabce-Zdroju — iPad, Samsung Galaxy Tab, Lenovo Tab, Huawei MatePad i inne.
        Diagnoza i wycena bez zobowiązań. Po akceptacji wyceny realizujemy naprawę tak szybko, jak to możliwe.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[
          { title: "Wymiana wyświetlacza", desc: "Pęknięty ekran lub uszkodzony digitizer tabletu — wymieniamy wyświetlacze do najpopularniejszych modeli." },
          { title: "Wymiana baterii", desc: "Tablet słabo trzyma ładowanie lub wyłącza się podczas pracy? Wymieniamy baterie na nowe." },
          { title: "Naprawa gniazda ładowania", desc: "Tablet nie ładuje się lub ładuje się tylko w określonej pozycji — naprawiamy gniazda USB-C i Lightning." },
          { title: "Naprawa po zalaniu", desc: "Zalany tablet wymaga natychmiastowego działania. Przynieś sprzęt jak najszybciej do serwisu." },
        ].map((item) => (
          <div key={item.title} className="rounded-lg border border-gray-200 p-4">
            <h2 className="font-semibold text-prokom-black">{item.title}</h2>
            <p className="mt-2 text-sm text-prokom-gray">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg bg-gray-50 p-5">
        <h2 className="font-semibold text-prokom-black">Obsługujemy klientów z Rabki-Zdroju i okolic</h2>
        <p className="mt-2 text-sm text-prokom-gray">
          Dowozimy lub odsyłamy sprzęt kurierem. Klientów z Rabki-Zdroju, Mszany Dolnej, Jordanowa, Raby Wyżnej, Nowego Targu i Czarnego Dunajca zapraszamy osobiście lub zachęcamy do skorzystania ze zgłoszenia online.
        </p>
      </div>

      <Button href="/zgloszenie" size="lg" className="mt-6">Zgłoś naprawę tabletu</Button>
    </div>
  );
}
