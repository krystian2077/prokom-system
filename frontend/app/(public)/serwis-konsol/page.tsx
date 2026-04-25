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
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-6 lg:px-4 lg:py-10">
      <h1 className="text-2xl font-bold text-prokom-black lg:text-3xl">Serwis konsol Rabka-Zdrój</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-prokom-gray lg:mt-4 lg:text-base">
        Naprawa konsol do gier w Rabce-Zdroju — PlayStation 4, PlayStation 5, Xbox One, Xbox Series X/S i inne.
        Wymiana napędu optycznego, naprawa złączy HDMI, problemy z zasilaniem i przegrzewaniem.
        Bezpłatna diagnoza i wycena przed każdą naprawą.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:mt-8 lg:gap-4">
        {[
          { title: "Naprawa PlayStation", desc: "PS4, PS4 Pro, PS5 — problemy z zasilaniem, złączem HDMI, napędem, wentylatorem." },
          { title: "Naprawa Xbox", desc: "Xbox One, Xbox Series — naprawa napędu, złączy, problemy z uruchamianiem." },
          { title: "Wymiana napędu", desc: "Konsola nie odczytuje płyt lub zgłasza błąd dysku — wymieniamy napędy optyczne." },
          { title: "Czyszczenie i konserwacja", desc: "Konsola głośno pracuje i się przegrzewa? Czyszczenie chłodzenia przedłuża żywotność sprzętu." },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border-0 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] lg:rounded-lg lg:border lg:border-gray-200 lg:p-4 lg:shadow-none">
            <h2 className="text-[15px] font-semibold text-prokom-black lg:text-base">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-prokom-gray">{item.desc}</p>
          </div>
        ))}
      </div>

      <Button href="/zgloszenie" size="lg" className="mt-6 w-full min-h-[48px] rounded-2xl lg:w-auto lg:min-h-0 lg:rounded-lg">Zgłoś naprawę konsoli</Button>
    </div>
  );
}
