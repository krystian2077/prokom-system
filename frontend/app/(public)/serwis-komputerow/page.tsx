import { Button } from "@/components/ui/Button";
import { BlogTeaser } from "@/components/blog/BlogTeaser";

export const metadata = {
  title: "Serwis komputerów Rabka-Zdrój — diagnostyka i naprawa PC | PRO-KOM",
  description:
    "Naprawa komputerów stacjonarnych w Rabce-Zdroju: diagnostyka, wymiana podzespołów, rozbudowa, czyszczenie, reinstalacja systemu. Szybka realizacja. PRO-KOM, ul. Orkana 16B.",
  alternates: {
    canonical: "https://pro-kom.eu/serwis-komputerow",
  },
};

export default function Page() {
  return (
    <>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold text-prokom-black">Serwis komputerów Rabka-Zdrój</h1>
        <p className="mt-4 text-prokom-gray">
          Diagnostyka i naprawa komputerów stacjonarnych PC w Rabce-Zdroju. Wymiana podzespołów,
          rozbudowa pamięci RAM i dysków SSD, czyszczenie, reinstalacja systemu Windows.
          Bezpłatna diagnoza przed naprawą.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            { title: "Diagnostyka sprzętowa", desc: "Komputer nie uruchamia się, wyświetla błędy lub restartuje? Diagnozujemy problem i przedstawiamy wycenę." },
            { title: "Wymiana podzespołów", desc: "Wymiana dysku, pamięci RAM, karty graficznej, zasilacza i innych podzespołów." },
            { title: "Rozbudowa i modernizacja", desc: "Chcesz przyspieszyć komputer? Dobieramy odpowiednie komponenty i przeprowadzamy rozbudowę." },
            { title: "Reinstalacja systemu", desc: "Instalacja i konfiguracja systemu Windows, sterowników i programów." },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-gray-200 p-4">
              <h2 className="font-semibold text-prokom-black">{item.title}</h2>
              <p className="mt-2 text-sm text-prokom-gray">{item.desc}</p>
            </div>
          ))}
        </div>

        <Button href="/zgloszenie" size="lg" className="mt-6">Zgłoś naprawę komputera</Button>
      </div>
      <BlogTeaser
        categories={["Komputery", "Gaming"]}
        heading="Poradniki o komputerach"
        limit={3}
      />
    </>
  );
}
