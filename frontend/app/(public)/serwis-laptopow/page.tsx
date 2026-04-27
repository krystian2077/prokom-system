import { Button } from "@/components/ui/Button";
import { SITE_URL } from "@/lib/site-config";
import { BlogTeaser } from "@/components/blog/BlogTeaser";

export const metadata = {
  title: "Serwis laptopów Rabka-Zdrój — naprawa, matryca, diagnostyka | PRO-KOM",
  description:
    "Naprawa laptopów w Rabce-Zdroju: wymiana matrycy, klawiatury, czyszczenie, diagnostyka zasilania. Wszystkie marki — Lenovo, HP, Dell, Asus, Acer, Apple MacBook. Bezpłatna wycena. PRO-KOM, ul. Orkana 16B.",
  alternates: {
    canonical: `${SITE_URL}/serwis-laptopow`,
  },
};

export default function Page() {
  return (
    <>
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-6 lg:px-4 lg:py-10">
        <h1 className="text-2xl font-bold text-prokom-black lg:text-3xl">Serwis laptopów Rabka-Zdrój</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-prokom-gray lg:mt-4 lg:text-base">
          Naprawiamy laptopy wszystkich popularnych marek w Rabce-Zdroju — Lenovo, HP, Dell, Asus, Acer, Apple MacBook i inne.
          Wymiana matrycy, klawiatury, czyszczenie z chłodzenia, diagnostyka zasilania, wymiana dysku i pamięci RAM.
          Bezpłatna diagnoza i wycena przed naprawą.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:mt-8 lg:gap-4">
          {[
            { title: "Wymiana matrycy", desc: "Pęknięty ekran, martwe piksele, problemy z podświetleniem — wymieniamy matryce do większości modeli." },
            { title: "Wymiana klawiatury", desc: "Uszkodzone, zablane lub odpadające klawisze — dobieramy oryginalne zamienniki." },
            { title: "Czyszczenie z chłodzenia", desc: "Laptop się przegrzewa i wyłącza? Profesjonalne czyszczenie i wymiana pasty termoprzewodzącej." },
            { title: "Diagnostyka i zasilanie", desc: "Laptop nie ładuje się, nie uruchamia się lub ma problemy z baterią — diagnozy najczęściej tego samego dnia." },
            { title: "Wymiana dysku SSD/HDD", desc: "Przyspieszamy laptopa przez wymianę dysku HDD na SSD lub rozbudowę pamięci RAM." },
            { title: "Naprawa po zalaniu", desc: "Zalany laptop? Działamy szybko — liczy się czas. Przynieś sprzęt jak najszybciej." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border-0 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] lg:rounded-lg lg:border lg:border-gray-200 lg:p-4 lg:shadow-none">
              <h2 className="text-[15px] font-semibold text-prokom-black lg:text-base">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-prokom-gray">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-gray-50 p-5 shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] lg:mt-8 lg:rounded-lg lg:shadow-none">
          <h2 className="text-[15px] font-semibold text-prokom-black lg:text-base">Obsługujemy klientów z Rabki-Zdroju i okolic</h2>
          <p className="mt-2 text-sm leading-relaxed text-prokom-gray">
            Naprawiamy laptopy klientów z Rabki-Zdroju, Mszany Dolnej, Jordanowa, Raby Wyżnej, Nowego Targu i Czarnego Dunajca.
            Możesz przynieść sprzęt osobiście lub skorzystać z wysyłki kurierskiej.
          </p>
        </div>

        <Button href="/zgloszenie" size="lg" className="mt-6 w-full min-h-[48px] rounded-2xl lg:w-auto lg:min-h-0 lg:rounded-lg">Zgłoś naprawę laptopa</Button>
      </div>
      <BlogTeaser
        categories={["Laptopy", "Sprzęt biznesowy", "Poleasing"]}
        heading="Poradniki o laptopach"
        limit={3}
      />
    </>
  );
}
