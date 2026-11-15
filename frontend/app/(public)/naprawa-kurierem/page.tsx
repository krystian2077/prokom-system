import Link from "next/link";
import { notFound } from "next/navigation";
import { courierService, line, servicePoints, telHref } from "@/config/prokom";
import { Breadcrumbs } from "@/components/tech/Breadcrumbs";
import { CtaBand } from "@/components/tech/CtaBand";
import { DataSafety } from "@/components/tech/DataSafety";
import { Faq } from "@/components/tech/Faq";
import { JsonLd } from "@/components/tech/JsonLd";
import { PrepChecklist } from "@/components/tech/PrepChecklist";
import { courierPayRows, courierPageVisible, courierPaymentText, courierPoint } from "@/lib/tech/courier-page";
import { PREP_GUIDE_HREF, TRACK_HREF } from "@/lib/tech/nav";
import { hoursLong, pointAddress } from "@/lib/tech/point-format";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata, type Crumb, type FaqItem } from "@/lib/tech/seo";
import { serviceJsonLd } from "@/lib/tech/service-jsonld";

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
function faqItems(): FaqItem[] {
  const payment = courierPaymentText();
  const items: FaqItem[] = [
    { q: "Czy mogę wysłać sprzęt przez paczkomat?", a: "Nie, nie obsługujemy paczkomatów — nie odbieramy z nich i nie nadajemy do nich paczek. Wyślij sprzęt kurierem pod adres serwisu." },
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
  const point = courierPoint(servicePoints);
  const pays = courierPayRows();
  const faq = faqItems();
  const payment = courierPaymentText();
  const steps = [
    { t: "Zgłoś naprawę online", s: "W formularzu wybierz „Kurier” — jako dostarczenie i jako zwrot." },
    { t: "Dostajesz e-mail", s: "Z numerem zgłoszenia i adresem serwisu, na który wysyłasz sprzęt." },
    { t: "Zapakuj sprzęt", s: "Włóż do paczki kartkę z numerem zgłoszenia i swoim telefonem." },
    { t: "Nadaj dowolnym kurierem", s: "Pod adres serwisu, nie do paczkomatu. Numer przesyłki możesz dodać w koncie klienta." },
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
              Mieszkasz daleko od naszego punktu albo nie masz czasu przyjechać? Zgłoś naprawę online i wyślij sprzęt kurierem — po naprawie odeślemy go na
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
          <div className="t-container">
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
                <a href={telHref(line.phone)} className="t-inline-link" data-t-inline="" data-track="telefon_klik" data-track-miejsce="kurier">
                  Zadzwoń
                </a>
                , doradzimy.
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

      {point ? (
        <section className="t-section t-section--tight" id="gdzie-wyslac" data-rail="Gdzie wysłać">
          <div className="t-container">
            <span className="t-eyebrow">Gdzie wysłać</span>
            <h2 className="t-h2 t-h2--sm">Adres serwisu</h2>
            <div className="t-card t-courier__addr">
              <b>
                {line.name} — {point.name}
              </b>
              <span>{pointAddress(point)}</span>
              <span>Paczki odbieramy w godzinach otwarcia punktu: {hoursLong(point)}.</span>
              <span>Nie do paczkomatu — tylko przesyłka kurierska pod ten adres.</span>
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
        title="Zgłoś naprawę kurierem — adres i numer zgłoszenia dostaniesz e-mailem."
        primary={{ label: "Zgłoś naprawę kurierem", href: SUBMIT_COURIER }}
        secondary={{ label: line.phoneDisplay, href: telHref(line.phone), tel: true, track: "kurier_cta" }}
      />
    </div>
  );
}
