import Link from "next/link";
import { GENERAL_EMAIL_LABEL, line, servicePoints, telHref } from "@/config/prokom";
import { GeneralLineNote, PointPhonesBig } from "@/components/tech/PointCalls";
import { AboutHeroArt } from "@/components/tech/about/AboutHeroArt";
import { AboutIconSvg } from "@/components/tech/about/about-icons";
import { Breadcrumbs } from "@/components/tech/Breadcrumbs";
import { CtaBand } from "@/components/tech/CtaBand";
import { CourierTeaser } from "@/components/tech/device/CourierTeaser";
import { Faq } from "@/components/tech/Faq";
import { NearestPoint } from "@/components/tech/home/NearestPoint";
import { PodhaleMap } from "@/components/tech/home/PodhaleMap";
import { IconCheck } from "@/components/tech/icons";
import { IntentCards } from "@/components/tech/IntentCards";
import { JsonLd } from "@/components/tech/JsonLd";
import { OpeningStatus } from "@/components/tech/OpeningStatus";
import { PointCard } from "@/components/tech/PointCard";
import { claim } from "@/lib/tech/claims";
import { inCity, joinCities, saturdayHours } from "@/lib/tech/point-format";
import { publishedPoints, visiblePoints } from "@/lib/tech/points";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata, type Crumb } from "@/lib/tech/seo";
import { visitFaq, visitLead } from "@/lib/tech/visit-faq";
import { polishText } from "@/lib/tech/typo";

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

/** Accepted copy shared with the home points band and the device pages (no new claims). */
const TICKS = ["Jedno zgłoszenie online", "Jeden status naprawy", "Oddajesz w jednym punkcie, odbierasz w drugim"];
const PLOTTER = "Ploter w obu salonach dopasowuje folię do Twojego modelu na miejscu, także po naprawie.";

export default function PointsPage() {
  const points = visiblePoints();
  const faq = visitFaq(published);
  const saturday = saturdayHours(main);
  const courier = claim("courierWholeCountry");
  return (
    <div className="t-ui t-page t-visit">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <JsonLd data={faqJsonLd(faq)} />

      <section className="t-section--hero" id="punkty" data-rail="Punkty serwisowe">
        <div className="t-container">
          <div className="t-ab-hero t-pts2-hero">
            <div className="t-ab-hero__text">
              <Breadcrumbs items={CRUMBS} />
              <OpeningStatus points={published} withName variant="pill" className="t-status--stage t-pts2-hero__status" skeletonCh={26} />
              <h1 className="t-ab-hero__h1 t-pts2-hero__h1">
                {two ? (
                  <>
                    Dwa punkty serwisowe: <span>{polishText(published[0].city, true)} i&nbsp;{polishText(published[1].city, true)}</span>
                  </>
                ) : (
                  <>Punkt serwisowy {inCity(main.city)}</>
                )}
              </h1>
              <p className="t-ab-hero__lead">
                {two
                  ? "Przynieś sprzęt bez umawiania albo zgłoś naprawę online. W obu punktach pracujemy w jednym systemie, więc status sprawdzisz z telefonu."
                  : // Single-point fallback, used only while a point is unpublished (SPEC §5).
                    "Przynieś sprzęt bez umawiania albo zgłoś naprawę online. Status naprawy sprawdzisz potem z telefonu."}
              </p>
              {/* boss 22.11: the points' own numbers are the main ones; the general line only as a note */}
              <PointPhonesBig track="punkty_hero" className="t-pts2-hero__phone" />
              <GeneralLineNote track="punkty_hero" />
              <div className="t-ab-hero__actions">
                <Link href="/kontakt#formularz" className="t-hbtn t-hbtn--acc t-shine t-ab-hero__submit">
                  Napisz do nas
                </Link>
              </div>
              <dl className="t-facts t-pts2-hero__facts">
                <div>
                  <dt>Wycena</dt>
                  <dd>przed naprawą</dd>
                </div>
                {saturday ? (
                  <div>
                    <dt>Soboty</dt>
                    <dd>
                      {main.city} {saturday}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt>{GENERAL_EMAIL_LABEL}</dt>
                  <dd>
                    <a href={`mailto:${line.email}`} data-t-inline="">{line.email}</a>
                  </dd>
                </div>
              </dl>
            </div>
            <div className="t-ab-hero__visual">
              <AboutHeroArt year={null} points={published.map((p) => ({ key: p.key, city: p.city, draft: false }))} />
            </div>
          </div>
        </div>
      </section>

      <section className="t-section t-section--tight t-pts2-salons" id="salony" data-rail="Salony">
        <div className="t-container">
          <div className={`t-pts2-cards${points.length === 1 ? " is-single" : ""}`}>
            {points.map((p) => (
              <PointCard key={p.key} id={p.key} point={p} layout="feature" trackFrom="punkty" className="t-card" />
            ))}
          </div>
        </div>
      </section>

      {points.length > 1 ? (
        <section className="t-section t-section--tight t-pts2-net-sec" id="gdzie-blizej" data-rail="Gdzie bliżej">
          <div className="t-container">
            <div className="t-pts2-net">
              <div className="t-pts2-net__text">
                <span className="t-eyebrow t-eyebrow--stage">Punkty serwisowe</span>
                <h2 className="t-h2 t-pts2-net__h">
                  Dwa punkty.
                  <br />
                  Jeden serwis.
                </h2>
                <p className="t-pts2-net__lead">
                  {points.map((p) => p.name).join(" i ")} pracują w jednym systemie. Te same naprawy, te same części, ta sama gwarancja. Wybierasz punkt, do którego masz bliżej.
                </p>
                <NearestPoint visible={points.map((p) => p.key)} />
                <ul className="t-pts2-net__ticks">
                  {TICKS.map((t) => (
                    <li key={t}>
                      <IconCheck size={16} />
                      {t}
                    </li>
                  ))}
                  {courier ? (
                    <li className={courier.draft ? "t-draft" : undefined}>
                      <IconCheck size={16} />
                      Kurier {courier.text}
                    </li>
                  ) : null}
                </ul>
                <p className="t-pts2-net__hg">
                  <span className="t-pts2-net__hgico" aria-hidden="true">
                    <AboutIconSvg icon="layers" size={18} />
                  </span>
                  <span>
                    <b>Hammer Glass</b> {PLOTTER}
                  </span>
                </p>
              </div>
              <div className="t-pts2-net__map">
                <PodhaleMap points={points.map((p) => ({ key: p.key, name: p.name, draft: p.draft }))} />
              </div>
            </div>
            <CourierTeaser className="t-pts2-courier" />
          </div>
        </section>
      ) : null}

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
            <p className="t-lead">{visitLead(published)}</p>
          </div>
          <Faq items={faq} />
        </div>
      </section>
    </div>
  );
}
