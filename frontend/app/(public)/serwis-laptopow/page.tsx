import { Button } from "@/components/ui/Button";
import { BlogTeaser } from "@/components/blog/BlogTeaser";

export const metadata = {
  title: "Serwis laptopów Rabka-Zdrój — naprawa, matryca, diagnostyka | PRO-KOM",
  description:
    "Naprawa laptopów w Rabce-Zdroju: wymiana matrycy, klawiatury, czyszczenie, diagnostyka zasilania. Wszystkie marki — Lenovo, HP, Dell, Asus, Acer, Apple MacBook. Bezpłatna wycena. PRO-KOM, ul. Orkana 16B.",
  alternates: {
    canonical: "https://pro-kom.eu/serwis-laptopow",
  },
};

export default function Page() {
  return (
    <>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold text-prokom-black">Serwis laptopów Rabka-Zdrój</h1>
        <p className="mt-4 text-prokom-gray">
          Naprawiamy laptopy wszystkich popularnych marek w Rabce-Zdroju — Lenovo, HP, Dell, Asus, Acer, Apple MacBook i inne.
          Wymiana matrycy, klawiatury, czyszczenie z chłodzenia, diagnostyka zasilania, wymiana dysku i pamięci RAM.
          Bezpłatna diagnoza i wycena przed naprawą.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            { title: "Wymiana matrycy", desc: "Pęknięty ekran, martwe piksele, problemy z podświetleniem — wymieniamy matryce do większości modeli." },
            { title: "Wymiana klawiatury", desc: "Uszkodzone, zablane lub odpadające klawisze — dobieramy oryginalne zamienniki." },
            { title: "Czyszczenie z chłodzenia", desc: "Laptop się przegrzewa i wyłącza? Profesjonalne czyszczenie i wymiana pasty termoprzewodzącej." },
            { title: "Diagnostyka i zasilanie", desc: "Laptop nie ładuje się, nie uruchamia się lub ma problemy z baterią — diagnozy najczęściej tego samego dnia." },
            { title: "Wymiana dysku SSD/HDD", desc: "Przyspieszamy laptopa przez wymianę dysku HDD na SSD lub rozbudowę pamięci RAM." },
            { title: "Naprawa po zalaniu", desc: "Zalany laptop? Działamy szybko — liczy się czas. Przynieś sprzęt jak najszybciej." },
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
            Naprawiamy laptopy klientów z Rabki-Zdroju, Mszany Dolnej, Jordanowa, Raby Wyżnej, Nowego Targu i Czarnego Dunajca.
            Możesz przynieść sprzęt osobiście lub skorzystać z wysyłki kurierskiej.
          </p>
        </div>

        <Button href="/zgloszenie" size="lg" className="mt-6">Zgłoś naprawę laptopa</Button>
      </div>
      <BlogTeaser
        categories={["Laptopy", "Sprzęt biznesowy", "Poleasing"]}
        heading="Poradniki o laptopach"
        limit={3}
      />
    </>
  );
}
