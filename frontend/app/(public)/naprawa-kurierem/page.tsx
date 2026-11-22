import Link from "next/link";
import { notFound } from "next/navigation";
import { courierService, line, pointPhone, telHref, type ServicePoint } from "@/config/prokom";
import { Breadcrumbs } from "@/components/tech/Breadcrumbs";
import { CtaBand } from "@/components/tech/CtaBand";
import { DataSafety } from "@/components/tech/DataSafety";
import { Faq } from "@/components/tech/Faq";
import { JsonLd } from "@/components/tech/JsonLd";
import { PrepChecklist } from "@/components/tech/PrepChecklist";
import { courierDestination, courierPoints } from "@/lib/tech/courier";
import { courierPayRows, courierPageVisible, courierPaymentText } from "@/lib/tech/courier-page";
import { PREP_GUIDE_HREF, TRACK_HREF } from "@/lib/tech/nav";
import { hoursLong, inCity, pointAddress, pointPhoneDisplay } from "@/lib/tech/point-format";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata, type Crumb, type FaqItem } from "@/lib/tech/seo";
import { serviceJsonLd } from "@/lib/tech/service-jsonld";
import { PointPhonesInline } from "@/components/tech/PointCalls";

const PATH = "/naprawa-kurierem";
const DESCRIPTION =
  "Naprawa wysyłkowa w PRO-KOM Tech: zgłoś naprawę online, wyślij telefon lub laptop dowolnym kurierem, a po naprawie odeślemy go na Twój adres.";

export const metadata = pageMetadata({ title: "Naprawa wysyłkowa — serwis kurierem", description: DESCRIPTION, path: PATH });

const CRUMBS: Crumb[] = [
  { name: "Start", path: "/" },
  { name: "Naprawy", path: "/uslugi" },
  { name: "Naprawa wysyłkowa", path: PATH },
];

const SUBMIT_COURIER = "/zgloszenie?dostawa=kurier";

// The boss's answers (SPEC §10, §12.10) passed on by Krystian on 15.11.2026 — data in courierService.
function faqItems(points: ServicePoint[]): FaqItem[] {
  const payment = courierPaymentText();
  const items: FaqItem[] = [
    {
      q: "Na jaki adres wysłać sprzęt?",
      a: `${points.length > 1 ? "Na adres jednego z naszych salonów" : "Na adres salonu"}: ${points.map((p) => `${line.name} ${p.city}, ${pointAddress(p)}`).join(" albo ")}.${points.length > 1 ? " Wybierz ten, który Ci pasuje." : ""}`,
    },
    {
      q: "Czy muszę zgłosić naprawę przed wysyłką?",
      a: "Nie musisz, ale najlepiej to zrób: wypełnij formularz zgłoszenia online, napisz e-mail albo zadzwoń. Wtedy wiemy, że paczka jest w drodze, a po zgłoszeniu online dostaniesz numer zgłoszenia — włóż go do paczki.",
    },
    { q: "Czy mogę wysłać sprzęt przez paczkomat?", a: `Nie, nie obsługujemy paczkomatów — nie odbieramy z nich i nie nadajemy do nich paczek. Wyślij sprzęt kurierem ${courierDestination(points)}.` },
    { q: "Ile trwa naprawa wysyłkowa?", a: "To czas samej naprawy (zależy od usterki i części) plus dni przesyłki w obie strony. Termin naprawy podamy po diagnozie." },
  ];
  if (courierService.returnIfDeclined) {
    items.push({
      q: "Co, jeśli nie zgodzę się na wycenę?",
      a: `Odsyłamy sprzęt bez naprawy, a odesłanie jest ${courierService.returnIfDeclined === "service" ? "na nasz koszt" : "na Twój koszt"}.`,
    });
  }
  if (payment) items.push({ q: "Jak zapłacę za naprawę?", a: payment });
  items.push(
    { q: "Czy sprzęt jest ubezpieczony w drodze?", a: "Ubezpieczenie przesyłki zależy od przewoźnika i zadeklarowanej wartości. Przy droższym sprzęcie warto zadeklarować wartość przy nadaniu." },
    { q: "Jak sprawdzę status naprawy?", a: "Na stronie statusu naprawy, po numerze zgłoszenia i 4 ostatnich cyfrach telefonu podanego w zgłoszeniu." },
    { q: "Czy muszę mieć konto?", a: "Nie. Konto klienta pozwala dodać numer przesyłki, żebyśmy wiedzieli, że paczka jest w drodze." },
  );
  return items;
}

export default function CourierPage() {
  if (!courierPageVisible()) notFound();
  const draft = !courierService.published;
  const points = courierPoints();
  const pays = courierPayRows();
  const faq = faqItems(points);
  const payment = courierPaymentText();
  const steps = [
    {
      t: "Zgłoś naprawę, napisz albo zadzwoń",
      s: "Najlepiej przed wysyłką: formularz online (wybierz „Kurier”), e-mail albo telefon. To nie warunek, ale wtedy wiemy, że paczka jest w drodze.",
    },
    { t: "Numer zgłoszenia", s: "Po zgłoszeniu online dostaniesz go od razu na ekranie i w e-mailu." },
    { t: "Zapakuj sprzęt", s: "Włóż do paczki kartkę z numerem zgłoszenia (albo imieniem i nazwiskiem) i swoim telefonem." },
    {
      t: "Nadaj dowolnym kurierem",
      s: `${courierDestination(points).replace(/^n/, "N")} — nie obsługujemy paczkomatów. Numer przesyłki możesz dodać w koncie klienta.`,
    },
    { t: "Diagnoza i wycena", s: "Naprawiamy dopiero po Twojej zgodzie." },
    {
      t: "Odsyłamy sprzęt",
      s: `Na adres ze zgłoszenia.${payment ? ` ${payment}` : ""}`,
    },
  ];

  return (
    <div className={`t-ui t-page t-courier${draft ? " t-draft" : ""}`}>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <JsonLd data={faqJsonLd(faq)} />
      <JsonLd
        data={serviceJsonLd({
          name: `Naprawa wysyłkowa · ${line.name}`,
          serviceType: "Naprawa wysyłkowa elektroniki",
          path: PATH,
          description: DESCRIPTION,
          areaServed: courierService.area === "polska" ? ["Polska"] : undefined,
        })}
      />

      <section className="t-section--hero" id="start" data-rail="Naprawa wysyłkowa">
        <div className="t-container">
          <div className="t-stage t-bhero">
            <Breadcrumbs items={CRUMBS} separator="/" />
            <h1 className="t-bhero__h1">Naprawa wysyłkowa — wyślij sprzęt kurierem</h1>
            <p className="t-bhero__lead t-bhero__lead--wide">
              Mieszkasz daleko od naszych punktów albo nie masz czasu przyjechać? Zgłoś naprawę online i wyślij sprzęt kurierem — po naprawie odeślemy go na
              Twój adres.
            </p>
            <div className="t-btnrow">
              <Link href={SUBMIT_COURIER} className="t-pbtn t-pbtn--stage" data-track="zgloszenie_start" data-track-zrodlo="kurier">
                Zgłoś naprawę kurierem
              </Link>
              <a href="#jak-spakowac" className="t-pbtn t-pbtn--ghost-dark">
                Jak spakować
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="t-section t-section--tight" id="jak-to-dziala" data-rail="Jak to działa">
        <div className="t-container">
          <div className="t-sechead">
            <div>
              <span className="t-eyebrow">Jak to działa</span>
              <h2 className="t-h2">Sześć kroków</h2>
            </div>
          </div>
          <ol className="t-prepsteps t-prepsteps--grid">
            {steps.map((s, i) => (
              <li key={s.t} className="t-card t-prepsteps__item">
                <span className="t-prepsteps__n" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <h3 className="t-h3 t-h3--sm">{s.t}</h3>
                  <p>{s.s}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {pays.length ? (
        <section className="t-section t-section--alt t-section--tight" id="kto-placi" data-rail="Kto płaci">
          <div className="t-container t-courier__pay">
            <h2 className="t-h2 t-h2--sm">Kto płaci za przesyłki</h2>
            <div className="t-card t-paytable">
              <dl>
                {pays.map((r) => (
                  <div key={r.k}>
                    <dt>{r.k}</dt>
                    <dd>{r.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      ) : null}

      <section className="t-section t-section--tight" id="jak-spakowac" data-rail="Jak spakować">
        <div className="t-container t-courier__cols">
          <div>
            <span className="t-eyebrow">Jak spakować</span>
            <h2 className="t-h2 t-h2--sm">Bezpieczna paczka</h2>
            <ul className="t-ticklist">
              <li>Telefon lub tablet w pudełku albo sztywnym kartonie, owinięty folią bąbelkową, bez luzu — potrząśnij, nic nie może się przesuwać.</li>
              <li>Laptop zamknięty, w kartonie z wypełnieniem ok. 5 cm z każdej strony. Nie w samej kopercie ani torbie.</li>
              <li>Ładowarka tylko wtedy, gdy usterka dotyczy ładowania.</li>
              <li>Bez etui, karty SIM i karty pamięci.</li>
              <li>W środku kartka z numerem zgłoszenia i telefonem.</li>
              <li>Przy droższym sprzęcie warto zadeklarować wartość przesyłki u przewoźnika.</li>
            </ul>
          </div>
          <div id="czego-nie-wysylac">
            <span className="t-eyebrow">Uwaga</span>
            <h2 className="t-h2 t-h2--sm">Czego nie wysyłać</h2>
            <ul className="t-ticklist t-ticklist--warn">
              <li>
                Urządzenia ze spuchniętą albo uszkodzoną baterią — przewoźnicy zwykle nie przyjmują uszkodzonych baterii litowych.{" "}
                Zadzwoń, doradzimy: <PointPhonesInline track="kurier" />.
              </li>
              <li>Sprzętu po świeżym zalaniu bez wcześniejszego kontaktu — liczy się czas, lepiej zadzwonić.</li>
              <li>Akcesoriów niezwiązanych z usterką.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="t-section t-section--alt t-section--tight" id="przygotuj" data-rail="Przygotuj sprzęt">
        <div className="t-container t-courier__cols">
          <PrepChecklist category={null} title="Przygotuj sprzęt" />
          <p className="t-lead">
            Pełna lista dla telefonu, laptopa, konsoli i smartwatcha:{" "}
            <Link href={PREP_GUIDE_HREF} className="t-inline-link" data-t-inline="">
              jak przygotować sprzęt do serwisu
            </Link>
            .
          </p>
        </div>
      </section>
      <DataSafety />

      {points.length ? (
        <section className="t-section t-section--tight" id="gdzie-wyslac" data-rail="Gdzie wysłać">
          <div className="t-container">
            <span className="t-eyebrow">Gdzie wysłać</span>
            <h2 className="t-h2 t-h2--sm">{points.length > 1 ? "Wyślij do jednego z salonów" : "Adres salonu"}</h2>
            <p className="t-lead">Nie obsługujemy paczkomatów — tylko przesyłka kurierska pod adres salonu.</p>
            <div className="t-courier__addrs">
              {points.map((p) => (
                <div key={p.key} className="t-card t-courier__addr">
                  <b>
                    {line.name} — {p.name}
                  </b>
                  <span>{pointAddress(p)}</span>
                  <span>Paczki odbieramy w godzinach otwarcia salonu {inCity(p.city)}: {hoursLong(p)}.</span>
                  <span>
                    tel.{" "}
                    <a href={telHref(pointPhone(p))} className="t-inline-link" data-t-inline="" data-track="telefon_klik" data-track-miejsce="kurier">
                      {pointPhoneDisplay(p)}
                    </a>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="t-section t-section--tight" id="pytania" data-rail="Pytania">
        <div className="t-container t-faqsplit">
          <div className="t-faqsplit__head">
            <span className="t-eyebrow">Pytania</span>
            <h2 className="t-h2">Naprawa wysyłkowa: pytania</h2>
            <p className="t-lead">
              Status sprawdzisz na <Link href={TRACK_HREF} className="t-inline-link" data-t-inline="">stronie statusu naprawy</Link>.
            </p>
          </div>
          <Faq items={faq} />
        </div>
      </section>

      <CtaBand
        eyebrow="Następny krok"
        title={`Zgłoś naprawę online i wyślij sprzęt kurierem ${courierDestination(points)}.`}
        primary={{ label: "Zgłoś naprawę kurierem", href: SUBMIT_COURIER }}
        secondary={{ label: line.phoneDisplay, href: telHref(line.phone), tel: true, track: "kurier_cta" }}
      />
    </div>
  );
}
