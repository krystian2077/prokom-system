import Link from "next/link";
import { line, servicePoints, telHref } from "@/config/prokom";
import { Breadcrumbs } from "@/components/tech/Breadcrumbs";
import { CtaBand } from "@/components/tech/CtaBand";
import { Faq } from "@/components/tech/Faq";
import { IntentCards } from "@/components/tech/IntentCards";
import { JsonLd } from "@/components/tech/JsonLd";
import { OpeningStatus } from "@/components/tech/OpeningStatus";
import { PointCard } from "@/components/tech/PointCard";
import { inCity, joinCities, saturdayHours } from "@/lib/tech/point-format";
import { publishedPoints, visiblePoints } from "@/lib/tech/points";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata, type Crumb } from "@/lib/tech/seo";
import { visitFaq } from "@/lib/tech/visit-faq";

const published = publishedPoints(servicePoints);
const two = published.length > 1;
const main = published[0];

export const metadata = pageMetadata({
  title: two ? `Punkty serwisowe — ${joinCities(published)}` : `Punkt serwisowy ${inCity(main.city)} i kontakt`,
  description: two
    ? `Punkty serwisowe PRO-KOM Tech: ${joinCities(published)}. Adresy, godziny otwarcia, dojazd i telefon. Przyjdź bez umawiania albo zgłoś naprawę online.`
    : `Punkt serwisowy PRO-KOM Tech ${inCity(main.city)}: adres, godziny otwarcia, dojazd i telefon. Przyjdź bez umawiania albo zgłoś naprawę online.`,
  path: "/punkty-serwisowe",
});

const CRUMBS: Crumb[] = [
  { name: "Start", path: "/" },
  { name: "Punkty serwisowe i kontakt", path: "/punkty-serwisowe" },
];

export default function PointsPage() {
  const points = visiblePoints();
  const faq = visitFaq(published);
  const saturday = saturdayHours(main);
  return (
    <div className="t-ui t-page">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <JsonLd data={faqJsonLd(faq)} />

      <section className="t-pts-hero" id="punkty" data-rail="Punkty serwisowe">
        <svg className="t-pts-hero__rings" viewBox="0 0 1440 792" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
          <g fill="none" stroke="#E2483A" strokeWidth="1.2" opacity="0.13">
            {[130, 230, 340, 460, 590, 730].map((rx, i) => (
              <ellipse key={rx} cx="1090" cy="330" rx={rx} ry={[82, 146, 214, 288, 368, 454][i]} />
            ))}
          </g>
        </svg>
        <div className="t-container t-pts-hero__in">
          <div className="t-pts-hero__text">
            <Breadcrumbs items={CRUMBS} />
            <OpeningStatus points={published} withName variant="pill" className="t-status--stage" skeletonCh={26} />
            <h1 className="t-pts-hero__h1">
              {two ? (
                <>Dwa punkty serwisowe: {published[0].city} i&nbsp;{published[1].city}</>
              ) : (
                <>Punkt serwisowy {inCity(main.city)}</>
              )}
            </h1>
            <p className="t-lead t-lead--stage">
              {two
                ? "Przynieś sprzęt bez umawiania albo zgłoś naprawę online. W obu punktach pracujemy w jednym systemie, więc status sprawdzisz z telefonu."
                : // Single-point fallback, used only while a point is unpublished (SPEC §5).
                  "Przynieś sprzęt bez umawiania albo zgłoś naprawę online. Status naprawy sprawdzisz potem z telefonu."}
            </p>
            <div className="t-bigphone">
              <span className="t-bigphone__label">Najszybciej — zadzwoń</span>
              <a href={telHref(line.phone)} className="t-bigphone__num" data-track="telefon_klik" data-track-miejsce="punkty_hero">
                {line.phoneDisplay}
              </a>
            </div>
            <div className="t-btnrow">
              <a href={telHref(line.phone)} className="t-pbtn t-pbtn--stage" data-track="telefon_klik" data-track-miejsce="punkty_hero_przycisk">
                Zadzwoń teraz
              </a>
              <Link href="/kontakt#formularz" className="t-pbtn t-pbtn--ghost-dark">
                Napisz do nas
              </Link>
            </div>
            <dl className="t-facts">
              <div>
                <dt>Wycena</dt>
                <dd>przed naprawą</dd>
              </div>
              {saturday ? (
                <div>
                  <dt>Soboty</dt>
                  <dd>
                    {main.city.split("-")[0]} {saturday}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt>E-mail</dt>
                <dd>
                  <a href={`mailto:${line.email}`} data-t-inline="">{line.email}</a>
                </dd>
              </div>
            </dl>
          </div>
          <div className={`t-pts-hero__cards${points.length === 1 ? " is-single" : ""}`}>
            {points.map((p) => (
              <PointCard key={p.key} point={p} trackFrom="punkty" />
            ))}
          </div>
        </div>
      </section>

      <IntentCards title="Z czym przychodzisz?" id="z-czym" />

      <CtaBand
        eyebrow="Kontakt"
        title="Masz pytanie przed wizytą? Napisz albo zadzwoń."
        primary={{ label: "Napisz do nas", href: "/kontakt#formularz" }}
        secondary={{ label: line.phoneDisplay, href: telHref(line.phone), tel: true, track: "punkty_cta" }}
      />

      <section className="t-section t-section--alt" id="pytania" data-rail="Pytania o wizytę">
        <div className="t-container t-faqsplit">
          <div className="t-faqsplit__head">
            <span className="t-eyebrow">Zanim przyjedziesz</span>
            <h2 className="t-h2">Pytania o wizytę w punkcie</h2>
            <p className="t-lead">Dojazd, parking i to, co warto zabrać ze sobą.</p>
          </div>
          <Faq items={faq} />
        </div>
      </section>
    </div>
  );
}
