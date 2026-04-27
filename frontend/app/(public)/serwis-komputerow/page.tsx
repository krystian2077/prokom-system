import { Button } from "@/components/ui/Button";
import { SITE_URL } from "@/lib/site-config";
import { BlogTeaser } from "@/components/blog/BlogTeaser";

export const metadata = {
  title: "Serwis komputerów Rabka-Zdrój — diagnostyka i naprawa PC | PRO-KOM",
  description:
    "Naprawa komputerów stacjonarnych w Rabce-Zdroju: diagnostyka, wymiana podzespołów, rozbudowa, czyszczenie, reinstalacja systemu. Szybka realizacja. PRO-KOM, ul. Orkana 16B.",
  alternates: {
    canonical: `${SITE_URL}/serwis-komputerow`,
  },
};

export default function Page() {
  return (
    <>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 max-lg:px-5 max-lg:py-8">
        <span className="hidden max-lg:mb-3 max-lg:inline-flex max-lg:items-center max-lg:gap-1.5 max-lg:rounded-full max-lg:border max-lg:border-red-100 max-lg:bg-red-50/60 max-lg:px-3 max-lg:py-1 max-lg:text-[11px] max-lg:font-semibold max-lg:uppercase max-lg:tracking-[0.12em] max-lg:text-red-700">
          Serwis PC
        </span>
        <h1 className="text-3xl font-bold text-prokom-black max-lg:text-[24px] max-lg:leading-[1.2]">
          Serwis komputerów Rabka-Zdrój
        </h1>
        <p className="mt-4 text-prokom-gray max-lg:mt-3 max-lg:text-[14px] max-lg:leading-[1.7]">
          Diagnostyka i naprawa komputerów stacjonarnych PC w Rabce-Zdroju. Wymiana podzespołów,
          rozbudowa pamięci RAM i dysków SSD, czyszczenie, reinstalacja systemu Windows.
          Bezpłatna diagnoza przed naprawą.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 max-lg:mt-6 max-lg:grid-cols-1 max-lg:gap-3">
          {[
            { title: "Diagnostyka sprzętowa", desc: "Komputer nie uruchamia się, wyświetla błędy lub restartuje? Diagnozujemy problem i przedstawiamy wycenę." },
            { title: "Wymiana podzespołów", desc: "Wymiana dysku, pamięci RAM, karty graficznej, zasilacza i innych podzespołów." },
            { title: "Rozbudowa i modernizacja", desc: "Chcesz przyspieszyć komputer? Dobieramy odpowiednie komponenty i przeprowadzamy rozbudowę." },
            { title: "Reinstalacja systemu", desc: "Instalacja i konfiguracja systemu Windows, sterowników i programów." },
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

        <Button
          href="/zgloszenie"
          size="lg"
          className="mt-6 max-lg:mt-7 max-lg:w-full max-lg:min-h-[48px] max-lg:rounded-2xl max-lg:text-base max-lg:font-semibold"
        >
          Zgłoś naprawę komputera
        </Button>
      </div>
      <BlogTeaser
        categories={["Komputery", "Gaming"]}
        heading="Poradniki o komputerach"
        limit={3}
      />
    </>
  );
}
