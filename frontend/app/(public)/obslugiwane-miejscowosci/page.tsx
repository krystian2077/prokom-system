import Link from "next/link";
import { servicePoints } from "@/config/prokom";
import { Breadcrumbs } from "@/components/tech/Breadcrumbs";
import { CtaBand } from "@/components/tech/CtaBand";
import { JsonLd } from "@/components/tech/JsonLd";
import { OpeningStatus } from "@/components/tech/OpeningStatus";
import { courierPageHref } from "@/lib/tech/courier";
import { visibleLocalPages } from "@/lib/tech/local-pages";
import { POINTS_HREF, SUBMIT_HREF } from "@/lib/tech/nav";
import { hoursLong, joinCities, pointAddress } from "@/lib/tech/point-format";
import { publishedPoints, visiblePoints } from "@/lib/tech/points";
import { breadcrumbJsonLd, pageMetadata, type Crumb } from "@/lib/tech/seo";
import { pointGenitive, towns } from "@/lib/tech/towns";
import { PointCalls } from "@/components/tech/PointCalls";

const published = publishedPoints(servicePoints);
const two = published.length > 1;

export const metadata = pageMetadata({
  title: "Obsługiwane miejscowości — serwis na Podhalu",
  description: two
    ? "Skąd przyjeżdżają do nas klienci: miejscowości bliżej punktu w Rabce-Zdroju i bliżej Zakopanego. Sprawdź, gdzie masz bliżej, albo wyślij sprzęt kurierem."
    : "Skąd przyjeżdżają do serwisu PRO-KOM Tech w Rabce-Zdroju: Raba Wyżna, Jordanów, Mszana Dolna, Nowy Targ, Czarny Dunajec. Możesz też wysłać sprzęt kurierem.",
  path: "/obslugiwane-miejscowosci",
});

const CRUMBS: Crumb[] = [
  { name: "Start", path: "/" },
  { name: "Obsługiwane miejscowości", path: "/obslugiwane-miejscowosci" },
];

export default function TownsPage() {
  const points = visiblePoints();
  const locals = new Map(visibleLocalPages().map((p) => [p.city, p]));
  const courier = courierPageHref();
  return (
    <div className="t-ui t-page">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />

      <section className="t-section--hero" id="miejscowosci" data-rail="Miejscowości">
        <div className="t-container">
          <div className="t-stage t-towns-hero">
            <Breadcrumbs items={CRUMBS} />
            <h1 className="t-towns-hero__h1">Obsługiwane miejscowości</h1>
            <p className="t-lead t-lead--stage">
              {two
                ? `Dwa punkty na Podhalu: ${joinCities(published)}. Sprawdź, do którego masz bliżej — w obu działa ten sam system zgłoszeń, a status naprawy sprawdzisz online.`
                : "Serwis PRO-KOM Tech działa w Rabce-Zdroju. Przyjeżdżają do nas klienci z całej okolicy, a jeśli nie możesz przyjechać, zgłoś naprawę online i wyślij sprzęt kurierem."}
            </p>
            <div className="t-btnrow">
              <Link href={SUBMIT_HREF} className="t-pbtn t-pbtn--stage">
                Zgłoś naprawę
              </Link>
              <Link href={POINTS_HREF} className="t-pbtn t-pbtn--ghost-dark">
                {two ? "Punkty serwisowe" : "Dojazd i godziny"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {points.map((p) => {
        const list = towns.filter((t) => t.point === p.key);
        return (
          <section key={p.key} className="t-section t-section--tight" id={`blizej-${p.key}`} data-rail={`Bliżej ${pointGenitive[p.key]}`}>
            <div className={`t-container t-towngroup${p.draft ? " t-draft" : ""}`}>
              <div className="t-towngroup__head">
                <span className="t-eyebrow">
                  Punkt {p.name} {p.draft ? <span className="t-draft-badge">do uzupełnienia</span> : null}
                </span>
                <h2 className="t-h2 t-h2--sm">{points.length > 1 ? `Bliżej ${pointGenitive[p.key]}` : "Skąd do nas przyjeżdżają"}</h2>
                <p className="t-towngroup__point">
                  {pointAddress(p)} · {hoursLong(p)}
                </p>
                <OpeningStatus points={[p]} variant="pill" skeletonCh={20} />
              </div>
              <ul className="t-towncards">
                {list.map((t) => {
                  const local = locals.get(t.name);
                  return (
                    <li key={t.slug} id={t.slug} className="t-towncard">
                      <h3>{t.name}</h3>
                      <p>{t.name === p.city ? "Tu jest punkt serwisowy." : `Najbliższy punkt: ${p.name}.`}</p>
                      {local ? (
                        <Link href={`/${local.slug}`} className="t-towncard__more">
                          Serwis telefonów {t.name} →
                        </Link>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        );
      })}

      <section className="t-section t-section--alt" id="jak" data-rail="Jak skorzystać">
        <div className="t-container">
          <h2 className="t-h2 t-h2--sm">Jak skorzystać z serwisu</h2>
          <div className="t-howto">
            <div className="t-card t-howto__card">
              <h3>Osobiście</h3>
              <p>Przyjdź bez umawiania w godzinach otwarcia{two ? " do punktu, który masz bliżej" : ""}. Zgłoszenie online przed wizytą skraca przyjęcie.</p>
              <Link href={POINTS_HREF} className="t-towncard__more">
                Adres i godziny →
              </Link>
            </div>
            <div className="t-card t-howto__card">
              <h3>Online i kurierem</h3>
              <p>Zgłoś naprawę w formularzu i wybierz wysyłkę kurierem. Po naprawie odeślemy sprzęt na adres ze zgłoszenia.</p>
              <Link href={courier ?? `${SUBMIT_HREF}?dostawa=kurier`} className="t-towncard__more">
                {courier ? "Dalej? Naprawa wysyłkowa →" : "Zgłoś naprawę kurierem →"}
              </Link>
            </div>
            <div className="t-card t-howto__card">
              <h3>Telefonicznie</h3>
              <p>Zadzwoń, doradzimy i wstępnie ocenimy usterkę.</p>
              <PointCalls track="miejscowosci" size="sm" className="t-pcalls--block" />
            </div>
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="Zgłoszenie naprawy"
        title="Nie ma Twojej miejscowości? Też naprawimy — zgłoś online."
        primary={{ label: "Zgłoś naprawę", href: SUBMIT_HREF }}
        secondary={{ label: "Kontakt", href: "/kontakt" }}
      />
    </div>
  );
}
