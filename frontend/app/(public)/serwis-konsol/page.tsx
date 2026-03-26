import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Serwis konsol Rabka-Zdrój — naprawa PlayStation, Xbox | PRO-KOM",
  description:
    "Naprawa konsol do gier w Rabce-Zdroju: PlayStation 4, PS5, Xbox One, Xbox Series. Wymiana napędu, naprawa złączy HDMI, problemy z zasilaniem. Bezpłatna diagnoza. PRO-KOM, ul. Orkana 16B.",
  alternates: {
    canonical: "https://pro-kom.eu/serwis-konsol",
  },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-prokom-black">Serwis konsol Rabka-Zdrój</h1>
      <p className="mt-4 text-prokom-gray">
        Naprawa konsol do gier w Rabce-Zdroju — PlayStation 4, PlayStation 5, Xbox One, Xbox Series X/S i inne.
        Wymiana napędu optycznego, naprawa złączy HDMI, problemy z zasilaniem i przegrzewaniem.
        Bezpłatna diagnoza i wycena przed każdą naprawą.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[
          { title: "Naprawa PlayStation", desc: "PS4, PS4 Pro, PS5 — problemy z zasilaniem, złączem HDMI, napędem, wentylatorem." },
          { title: "Naprawa Xbox", desc: "Xbox One, Xbox Series — naprawa napędu, złączy, problemy z uruchamianiem." },
          { title: "Wymiana napędu", desc: "Konsola nie odczytuje płyt lub zgłasza błąd dysku — wymieniamy napędy optyczne." },
          { title: "Czyszczenie i konserwacja", desc: "Konsola głośno pracuje i się przegrzewa? Czyszczenie chłodzenia przedłuża żywotność sprzętu." },
        ].map((item) => (
          <div key={item.title} className="rounded-lg border border-gray-200 p-4">
            <h2 className="font-semibold text-prokom-black">{item.title}</h2>
            <p className="mt-2 text-sm text-prokom-gray">{item.desc}</p>
          </div>
        ))}
      </div>

      <Button href="/zgloszenie" size="lg" className="mt-6">Zgłoś naprawę konsoli</Button>
    </div>
  );
}
