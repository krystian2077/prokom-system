import { Button } from "@/components/ui/Button";
import { BlogTeaser } from "@/components/blog/BlogTeaser";

export const metadata = {
  title: "Serwis drukarek Rabka-Zdrój — naprawa atramentowych i laserowych | PRO-KOM",
  description:
    "Naprawa drukarek w Rabce-Zdroju: drukarki atramentowe i laserowe, HP, Canon, Epson, Brother. Diagnoza, czyszczenie głowic, wymiana podzespołów. PRO-KOM, ul. Orkana 16B.",
  alternates: {
    canonical: "https://pro-kom.eu/serwis-drukarek",
  },
};

export default function Page() {
  return (
    <>
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-6 lg:px-4 lg:py-10">
        <h1 className="text-2xl font-bold text-prokom-black lg:text-3xl">Serwis drukarek Rabka-Zdrój</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-prokom-gray lg:mt-4 lg:text-base">
          Naprawa drukarek atramentowych i laserowych w Rabce-Zdroju. Obsługujemy drukarki HP, Canon, Epson,
          Brother i inne. Diagnoza, czyszczenie głowic drukujących, wymiana podzespołów mechanicznych i elektronicznych.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:mt-8 lg:gap-4">
          {[
            { title: "Drukarki atramentowe", desc: "Czyszczenie głowic, kalibracja, naprawa mechanizmów podawania papieru, konfiguracja." },
            { title: "Drukarki laserowe", desc: "Wymiana bębna, kasety tonera, naprawa problemów z wydrukiem i podawaniem papieru." },
            { title: "Drukarki wielofunkcyjne", desc: "Naprawa skanera, faksu i druku w urządzeniach wielofunkcyjnych." },
            { title: "Konfiguracja i sieć", desc: "Konfiguracja drukarki w sieci domowej lub biurowej, sterowniki, połączenie Wi-Fi." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border-0 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] lg:rounded-lg lg:border lg:border-gray-200 lg:p-4 lg:shadow-none">
              <h2 className="text-[15px] font-semibold text-prokom-black lg:text-base">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-prokom-gray">{item.desc}</p>
            </div>
          ))}
        </div>

        <Button href="/zgloszenie" size="lg" className="mt-6 w-full min-h-[48px] rounded-2xl lg:w-auto lg:min-h-0 lg:rounded-lg">Zgłoś naprawę drukarki</Button>
      </div>
      <BlogTeaser
        category="Drukarki"
        heading="Poradniki o drukarkach"
        limit={3}
      />
    </>
  );
}
