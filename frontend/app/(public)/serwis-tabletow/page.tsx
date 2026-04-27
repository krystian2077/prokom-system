import { Button } from "@/components/ui/Button";
import { SITE_URL } from "@/lib/site-config";

export const metadata = {
  title: "Serwis tabletów Rabka-Zdrój — naprawa iPad, Galaxy Tab | PRO-KOM",
  description:
    "Naprawa tabletów w Rabce-Zdroju: wymiana wyświetlacza, baterii, gniazda ładowania. iPad, Samsung Galaxy Tab, Lenovo, Huawei i inne. Bezpłatna diagnoza i wycena. PRO-KOM, ul. Orkana 16B.",
  alternates: {
    canonical: `${SITE_URL}/serwis-tabletow`,
  },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-6 lg:px-4 lg:py-10">
      <h1 className="text-2xl font-bold text-prokom-black lg:text-3xl">Serwis tabletów Rabka-Zdrój</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-prokom-gray lg:mt-4 lg:text-base">
        Naprawiamy tablety wszystkich popularnych marek w Rabce-Zdroju — iPad, Samsung Galaxy Tab, Lenovo Tab, Huawei MatePad i inne.
        Diagnoza i wycena bez zobowiązań. Po akceptacji wyceny realizujemy naprawę tak szybko, jak to możliwe.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:mt-8 lg:gap-4">
        {[
          { title: "Wymiana wyświetlacza", desc: "Pęknięty ekran lub uszkodzony digitizer tabletu — wymieniamy wyświetlacze do najpopularniejszych modeli." },
          { title: "Wymiana baterii", desc: "Tablet słabo trzyma ładowanie lub wyłącza się podczas pracy? Wymieniamy baterie na nowe." },
          { title: "Naprawa gniazda ładowania", desc: "Tablet nie ładuje się lub ładuje się tylko w określonej pozycji — naprawiamy gniazda USB-C i Lightning." },
          { title: "Naprawa po zalaniu", desc: "Zalany tablet wymaga natychmiastowego działania. Przynieś sprzęt jak najszybciej do serwisu." },
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
          Dowozimy lub odsyłamy sprzęt kurierem. Klientów z Rabki-Zdroju, Mszany Dolnej, Jordanowa, Raby Wyżnej, Nowego Targu i Czarnego Dunajca zapraszamy osobiście lub zachęcamy do skorzystania ze zgłoszenia online.
        </p>
      </div>

      <Button href="/zgloszenie" size="lg" className="mt-6 w-full min-h-[48px] rounded-2xl lg:w-auto lg:min-h-0 lg:rounded-lg">Zgłoś naprawę tabletu</Button>
    </div>
  );
}
