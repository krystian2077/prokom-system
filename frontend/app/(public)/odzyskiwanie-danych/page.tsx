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
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 max-lg:px-5 max-lg:py-8">
      <span className="hidden max-lg:mb-3 max-lg:inline-flex max-lg:items-center max-lg:gap-1.5 max-lg:rounded-full max-lg:border max-lg:border-red-100 max-lg:bg-red-50/60 max-lg:px-3 max-lg:py-1 max-lg:text-[11px] max-lg:font-semibold max-lg:uppercase max-lg:tracking-[0.12em] max-lg:text-red-700">
        Odzysk danych
      </span>
      <h1 className="text-3xl font-bold text-prokom-black max-lg:text-[24px] max-lg:leading-[1.2]">
        Odzyskiwanie danych Rabka-Zdrój
      </h1>
      <p className="mt-4 text-prokom-gray max-lg:mt-3 max-lg:text-[14px] max-lg:leading-[1.7]">
        Odzyskiwanie danych z dysków twardych HDD i SSD, pendrive, kart pamięci SD i microSD,
        telefonów i tabletów. Oferta indywidualna po wstępnej diagnozie i bezpłatnej wycenie.
        Obsługujemy klientów z Rabki-Zdroju i okolic.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 max-lg:mt-6 max-lg:grid-cols-1 max-lg:gap-3">
        {[
          { title: "Dyski twarde HDD", desc: "Uszkodzony, niewidoczny lub głośno pracujący dysk HDD — wycena po diagnozie." },
          { title: "Dyski SSD i pendrive", desc: "Dysk SSD nie jest wykrywany lub pendrive przestał działać — próba odzysku danych." },
          { title: "Karty pamięci", desc: "Karta SD lub microSD nie jest widoczna lub straciłeś zdjęcia — diagnozujemy i odzyskujemy pliki." },
          { title: "Telefony i tablety", desc: "Telefon nie uruchamia się, a masz ważne dane? Podejmujemy próbę odzysku danych z pamięci wewnętrznej." },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-lg border border-gray-200 p-4 max-lg:rounded-[20px] max-lg:border-white/80 max-lg:bg-white max-lg:p-5 max-lg:shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)]"
          >
            <h2 className="font-semibold text-prokom-black max-lg:text-[15px]">{item.title}</h2>
            <p className="mt-2 text-sm text-prokom-gray max-lg:mt-1.5 max-lg:text-[13px] max-lg:leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg bg-yellow-50 border border-yellow-200 p-4 max-lg:mt-5 max-lg:rounded-[20px] max-lg:border-amber-200/70 max-lg:bg-amber-50/60 max-lg:p-5 max-lg:shadow-[0_2px_8px_rgba(15,23,42,0.04),0_8px_20px_rgba(15,23,42,0.06)]">
        <p className="text-sm text-prokom-black font-semibold max-lg:text-[14px]">Ważne: im szybciej, tym lepiej</p>
        <p className="mt-1 text-sm text-prokom-gray max-lg:mt-1.5 max-lg:text-[13px] max-lg:leading-relaxed">
          Po utracie danych nie zapisuj nic na nośniku i przynieś go do serwisu jak najszybciej. Każde dalsze użytkowanie zmniejsza szanse na skuteczny odzysk.
        </p>
      </div>

      <Button
        href="/zgloszenie"
        size="lg"
        className="mt-6 max-lg:mt-7 max-lg:w-full max-lg:min-h-[48px] max-lg:rounded-2xl max-lg:text-base max-lg:font-semibold"
      >
        Zgłoś zapytanie o odzysk danych
      </Button>
    </div>
  );
}
