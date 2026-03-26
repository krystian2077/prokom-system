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
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold text-prokom-black">Serwis drukarek Rabka-Zdrój</h1>
        <p className="mt-4 text-prokom-gray">
          Naprawa drukarek atramentowych i laserowych w Rabce-Zdroju. Obsługujemy drukarki HP, Canon, Epson,
          Brother i inne. Diagnoza, czyszczenie głowic drukujących, wymiana podzespołów mechanicznych i elektronicznych.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            { title: "Drukarki atramentowe", desc: "Czyszczenie głowic, kalibracja, naprawa mechanizmów podawania papieru, konfiguracja." },
            { title: "Drukarki laserowe", desc: "Wymiana bębna, kasety tonera, naprawa problemów z wydrukiem i podawaniem papieru." },
            { title: "Drukarki wielofunkcyjne", desc: "Naprawa skanera, faksu i druku w urządzeniach wielofunkcyjnych." },
            { title: "Konfiguracja i sieć", desc: "Konfiguracja drukarki w sieci domowej lub biurowej, sterowniki, połączenie Wi-Fi." },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-gray-200 p-4">
              <h2 className="font-semibold text-prokom-black">{item.title}</h2>
              <p className="mt-2 text-sm text-prokom-gray">{item.desc}</p>
            </div>
          ))}
        </div>

        <Button href="/zgloszenie" size="lg" className="mt-6">Zgłoś naprawę drukarki</Button>
      </div>
      <BlogTeaser
        category="Drukarki"
        heading="Poradniki o drukarkach"
        limit={3}
      />
    </>
  );
}
