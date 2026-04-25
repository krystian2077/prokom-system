import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Serwis smartwatchy Rabka-Zdrój — naprawa zegarków | PRO-KOM",
  description:
    "Naprawa smartwatchy i zegarków w Rabce-Zdroju: Apple Watch, Samsung Galaxy Watch, Garmin. Wymiana baterii, naprawa ekranu, diagnostyka. PRO-KOM, ul. Orkana 16B.",
  alternates: {
    canonical: "https://pro-kom.eu/serwis-smartwatchy",
  },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-6 lg:px-4 lg:py-10">
      <h1 className="text-2xl font-bold text-prokom-black lg:text-3xl">Serwis smartwatchy Rabka-Zdrój</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-prokom-gray lg:mt-4 lg:text-base">
        Naprawiamy smartwatche i zegarki w Rabce-Zdroju — Apple Watch, Samsung Galaxy Watch, Garmin i inne marki.
        Diagnoza i wycena bez zobowiązań. Szybka realizacja napraw.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:mt-8 lg:gap-4">
        {[
          { title: "Wymiana baterii", desc: "Bateria szybko się rozładowuje lub zegarek nie trzyma ładowania — wymiana baterii w większości modeli." },
          { title: "Naprawa ekranu", desc: "Pęknięte szkiełko lub uszkodzony wyświetlacz smartwatcha — wycena po diagnozie." },
          { title: "Naprawa po zalaniu", desc: "Smartwatch przestał działać po kontakcie z wodą — działamy szybko." },
          { title: "Diagnostyka", desc: "Zegarek nie synchronizuje się, ma problemy z oprogramowaniem lub nie uruchamia się — diagnozujemy problem." },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border-0 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] lg:rounded-lg lg:border lg:border-gray-200 lg:p-4 lg:shadow-none">
            <h2 className="text-[15px] font-semibold text-prokom-black lg:text-base">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-prokom-gray">{item.desc}</p>
          </div>
        ))}
      </div>

      <Button href="/zgloszenie" size="lg" className="mt-6 w-full min-h-[48px] rounded-2xl lg:w-auto lg:min-h-0 lg:rounded-lg">Zgłoś naprawę smartwatcha</Button>
    </div>
  );
}
