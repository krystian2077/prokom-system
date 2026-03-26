import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Obsługiwane miejscowości — serwis telefonów Rabka-Zdrój i okolice | PRO-KOM",
  description:
    "PRO-KOM Serwis obsługuje klientów z Rabki-Zdroju, Mszany Dolnej, Jordanowa, Raby Wyżnej, Nowego Targu i Czarnego Dunajca. Naprawa telefonów, akcesoria GSM, Hammer Glass. ul. Orkana 16B, Rabka-Zdrój.",
  alternates: {
    canonical: "https://pro-kom.eu/obslugiwane-miejscowosci",
  },
  openGraph: {
    title: "Obsługiwane miejscowości | PRO-KOM Serwis Rabka-Zdrój",
    description:
      "Serwis telefonów i sklep GSM w Rabce-Zdroju. Obsługujemy klientów z Mszany Dolnej, Jordanowa, Raby Wyżnej, Nowego Targu i Czarnego Dunajca.",
    url: "https://pro-kom.eu/obslugiwane-miejscowosci",
  },
};

const LOCATIONS = [
  {
    city: "Rabka-Zdrój",
    primary: true,
    distance: "— siedziba serwisu",
    description:
      "PRO-KOM Serwis mieści się w centrum Rabki-Zdroju przy ul. Orkana 16B. Naprawiamy tu telefony, tablety, laptopy i inne urządzenia elektroniczne. W naszym sklepie znajdziesz akcesoria GSM: ładowarki GaN, kable, powerbanki, etui, szkła hartowane i folie Hammer Glass dostępne od ręki.",
    services: ["Naprawa telefonów", "Serwis laptopów", "Akcesoria GSM", "Hammer Glass CUT", "Serwis tabletów", "Odzyskiwanie danych"],
  },
  {
    city: "Mszana Dolna",
    primary: false,
    distance: "ok. 17 km od serwisu",
    description:
      "Klientów z Mszany Dolnej zapraszamy do naszego serwisu w Rabce-Zdroju lub zachęcamy do skorzystania z wysyłki kurierskiej. Naprawiamy telefony, tablety i laptopy klientów z Mszany Dolnej i całej gminy. Oferujemy też doradztwo w wyborze akcesoriów GSM i zakup szkieł ochronnych oraz etui.",
    services: ["Naprawa telefonów", "Akcesoria GSM", "Serwis tabletów", "Serwis laptopów"],
  },
  {
    city: "Jordanów",
    primary: false,
    distance: "ok. 15 km od serwisu",
    description:
      "Obsługujemy klientów z Jordanowa i gminy Jordanów. Naprawa smartfonów, wymiana ekranu lub baterii, serwis tabletów i laptopów — zapraszamy do serwisu lub możesz wysłać urządzenie kurierem. Odesłanie po naprawie realizujemy w ten sam sposób.",
    services: ["Naprawa telefonów", "Akcesoria GSM", "Serwis tabletów", "Serwis laptopów"],
  },
  {
    city: "Raba Wyżna",
    primary: false,
    distance: "ok. 8 km od serwisu",
    description:
      "Raba Wyżna leży bardzo blisko Rabki-Zdroju. Klientom z tej miejscowości i okolic radzimy wpaść do nas osobiście — jesteśmy 5–10 minut drogi. Naprawiamy telefony, sprzedajemy akcesoria GSM i montujemy folie Hammer Glass od ręki.",
    services: ["Naprawa telefonów", "Akcesoria GSM", "Hammer Glass CUT", "Serwis laptopów"],
  },
  {
    city: "Nowy Targ",
    primary: false,
    distance: "ok. 22 km od serwisu",
    description:
      "Klientów z Nowego Targu zapraszamy do serwisu w Rabce-Zdroju lub zachęcamy do wysyłki kurierskiej. Oferujemy naprawę telefonów, tabletów i laptopów, a także sprzedaż akcesoriów GSM. Wycena po bezpłatnej diagnozie.",
    services: ["Naprawa telefonów", "Akcesoria GSM", "Serwis tabletów", "Serwis laptopów"],
  },
  {
    city: "Czarny Dunajec",
    primary: false,
    distance: "ok. 28 km od serwisu",
    description:
      "Obsługujemy klientów z Czarnego Dunajca i okolic gminy. Naprawa smartfonów, serwis laptopów i sprzedaż akcesoriów GSM. Możesz przywieźć urządzenie osobiście lub skorzystać z przesyłki kurierskiej — po naprawie odsyłamy sprzęt bezpiecznie zapakowany.",
    services: ["Naprawa telefonów", "Akcesoria GSM", "Serwis tabletów", "Serwis laptopów"],
  },
];

export default function ObslugiowaneMiejscowosciPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-prokom-black">
        Obsługiwane miejscowości — serwis telefonów i sklep GSM
      </h1>
      <p className="mt-4 text-prokom-gray">
        PRO-KOM Serwis działa w centrum Rabki-Zdroju przy ul. Orkana 16B i obsługuje klientów
        z Rabki-Zdroju oraz okolicznych miejscowości: Mszany Dolnej, Jordanowa, Raby Wyżnej,
        Nowego Targu i Czarnego Dunajca. Możesz odwiedzić nas osobiście lub skorzystać
        z wysyłki kurierskiej.
      </p>

      <div className="mt-10 space-y-8">
        {LOCATIONS.map((loc) => (
          <div
            key={loc.city}
            className={`rounded-xl border p-6 ${loc.primary ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"}`}
          >
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="text-xl font-bold text-prokom-black">{loc.city}</h2>
              <span className="text-sm text-prokom-gray">{loc.distance}</span>
              {loc.primary && (
                <span className="rounded-full bg-red-600 px-3 py-0.5 text-xs font-semibold text-white">
                  Siedziba serwisu
                </span>
              )}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-prokom-gray">{loc.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {loc.services.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-medium text-prokom-black"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-xl bg-gray-900 p-8 text-white">
        <h2 className="text-xl font-bold">Jak skorzystać z naszych usług?</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="font-semibold text-red-400">Osobiście</p>
            <p className="mt-1 text-sm text-gray-300">
              Przyjedź do serwisu: ul. Orkana 16B, Rabka-Zdrój. Pon–Pt 9:00–17:00, Sob 9:00–14:00.
            </p>
          </div>
          <div>
            <p className="font-semibold text-red-400">Kurierem lub paczkomatem</p>
            <p className="mt-1 text-sm text-gray-300">
              Wyślij urządzenie — instrukcję i adres dostarczymy po zgłoszeniu online. Po naprawie odsyłamy.
            </p>
          </div>
          <div>
            <p className="font-semibold text-red-400">Telefonicznie</p>
            <p className="mt-1 text-sm text-gray-300">
              Zadzwoń: 883 200 151. Doradzimy, pomożemy wstępnie ocenić uszkodzenie i umówimy wizytę.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/zgloszenie"
            className="inline-block rounded-lg bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700"
          >
            Zgłoś naprawę online
          </Link>
          <Link
            href="/kontakt"
            className="inline-block rounded-lg border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/20"
          >
            Dane kontaktowe i mapa
          </Link>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-bold text-prokom-black">Nasze usługi</h2>
        <p className="mt-3 text-sm text-prokom-gray">
          Niezależnie od miejscowości, z której jesteś, oferujemy:
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            { label: "Naprawa telefonów", href: "/uslugi" },
            { label: "Serwis laptopów", href: "/serwis-laptopow" },
            { label: "Serwis tabletów", href: "/serwis-tabletow" },
            { label: "Hammer Glass CUT", href: "/hammer-glass" },
            { label: "Akcesoria GSM", href: "/akcesoria" },
            { label: "Odzyskiwanie danych", href: "/odzyskiwanie-danych" },
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-prokom-black hover:border-red-300 hover:text-red-600"
              >
                <span className="text-red-600">→</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
