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
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-prokom-black">Serwis smartwatchy Rabka-Zdrój</h1>
      <p className="mt-4 text-prokom-gray">
        Naprawiamy smartwatche i zegarki w Rabce-Zdroju — Apple Watch, Samsung Galaxy Watch, Garmin i inne marki.
        Diagnoza i wycena bez zobowiązań. Szybka realizacja napraw.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[
          { title: "Wymiana baterii", desc: "Bateria szybko się rozładowuje lub zegarek nie trzyma ładowania — wymiana baterii w większości modeli." },
          { title: "Naprawa ekranu", desc: "Pęknięte szkiełko lub uszkodzony wyświetlacz smartwatcha — wycena po diagnozie." },
          { title: "Naprawa po zalaniu", desc: "Smartwatch przestał działać po kontakcie z wodą — działamy szybko." },
          { title: "Diagnostyka", desc: "Zegarek nie synchronizuje się, ma problemy z oprogramowaniem lub nie uruchamia się — diagnozujemy problem." },
        ].map((item) => (
          <div key={item.title} className="rounded-lg border border-gray-200 p-4">
            <h2 className="font-semibold text-prokom-black">{item.title}</h2>
            <p className="mt-2 text-sm text-prokom-gray">{item.desc}</p>
          </div>
        ))}
      </div>

      <Button href="/zgloszenie" size="lg" className="mt-6">Zgłoś naprawę smartwatcha</Button>
    </div>
  );
}
