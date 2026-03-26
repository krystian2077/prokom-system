import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Odzyskiwanie danych Rabka-Zdrój — dyski, telefony, karty | PRO-KOM",
  description:
    "Odzyskiwanie danych w Rabce-Zdroju: dyski twarde HDD i SSD, pendrive, karty pamięci, telefony. Oferta indywidualna po wstępnej diagnozie. PRO-KOM, ul. Orkana 16B.",
  alternates: {
    canonical: "https://pro-kom.eu/odzyskiwanie-danych",
  },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-prokom-black">Odzyskiwanie danych Rabka-Zdrój</h1>
      <p className="mt-4 text-prokom-gray">
        Odzyskiwanie danych z dysków twardych HDD i SSD, pendrive, kart pamięci SD i microSD,
        telefonów i tabletów. Oferta indywidualna po wstępnej diagnozie i bezpłatnej wycenie.
        Obsługujemy klientów z Rabki-Zdroju i okolic.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[
          { title: "Dyski twarde HDD", desc: "Uszkodzony, niewidoczny lub głośno pracujący dysk HDD — wycena po diagnozie." },
          { title: "Dyski SSD i pendrive", desc: "Dysk SSD nie jest wykrywany lub pendrive przestał działać — próba odzysku danych." },
          { title: "Karty pamięci", desc: "Karta SD lub microSD nie jest widoczna lub straciłeś zdjęcia — diagnozujemy i odzyskujemy pliki." },
          { title: "Telefony i tablety", desc: "Telefon nie uruchamia się, a masz ważne dane? Podejmujemy próbę odzysku danych z pamięci wewnętrznej." },
        ].map((item) => (
          <div key={item.title} className="rounded-lg border border-gray-200 p-4">
            <h2 className="font-semibold text-prokom-black">{item.title}</h2>
            <p className="mt-2 text-sm text-prokom-gray">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
        <p className="text-sm text-prokom-black font-semibold">Ważne: im szybciej, tym lepiej</p>
        <p className="mt-1 text-sm text-prokom-gray">
          Po utracie danych nie zapisuj nic na nośniku i przynieś go do serwisu jak najszybciej. Każde dalsze użytkowanie zmniejsza szanse na skuteczny odzysk.
        </p>
      </div>

      <Button href="/zgloszenie" size="lg" className="mt-6">Zgłoś zapytanie o odzysk danych</Button>
    </div>
  );
}
