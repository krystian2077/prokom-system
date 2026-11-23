import Link from "next/link";
import { servicePoints } from "@/config/prokom";
import { GeneralLineNote } from "@/components/tech/PointCalls";
import { AboutIconSvg } from "@/components/tech/about/about-icons";
import { Breadcrumbs } from "@/components/tech/Breadcrumbs";
import { CourierTeaser } from "@/components/tech/device/CourierTeaser";
import { Faq } from "@/components/tech/Faq";
import { NearestPoint } from "@/components/tech/home/NearestPoint";
import { PodhaleMap } from "@/components/tech/home/PodhaleMap";
import { IconArrow, IconCheck } from "@/components/tech/icons";
import { IntentCards } from "@/components/tech/IntentCards";
import { JsonLd } from "@/components/tech/JsonLd";
import { OpeningStatus } from "@/components/tech/OpeningStatus";
import { PointCard } from "@/components/tech/PointCard";
import { claim } from "@/lib/tech/claims";
import { SUBMIT_HREF } from "@/lib/tech/nav";
import { inCity, joinCities } from "@/lib/tech/point-format";
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

/**
 * Points page (Krystian 23.11: „najwyższy poziom, intuicyjnie i z sensem”): one path, no repeats —
 * where (hero: nearest point + Podhale map) → when and how (one card per salon: live status,
 * big number and mailbox, real street map, week hours, route) → what you come with → FAQ.
 */
export default function PointsPage() {
  const points = visiblePoints();
  const faq = visitFaq(published);
  const courier = claim("courierWholeCountry");
  return (
    <div className="t-ui t-page t-visit">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <JsonLd data={faqJsonLd(faq)} />

      <section className="t-section--hero" id="punkty" data-rail="Punkty serwisowe">
        <div className="t-container">
          <div className="t-pts2-net t-pts3-hero">
            <div className="t-pts2-net__text">
              <Breadcrumbs items={CRUMBS} />
              <h1 className="t-pts3-hero__h1">
                {two ? (
                  <>
                    Punkty serwisowe <span>{polishText(published[0].city, true)} i&nbsp;{polishText(published[1].city, true)}</span>
                  </>
                ) : (
                  <>Punkt serwisowy {inCity(main.city)}</>
                )}
              </h1>
              <p className="t-pts2-net__lead">
                {two
                  ? "Przyjdź bez umawiania albo zgłoś naprawę online. Oba salony pracują w jednym systemie: te same naprawy, ta sama gwarancja. Wybierz punkt, do którego masz bliżej."
                  : // Single-point fallback, used only while a point is unpublished (SPEC §5).
                    "Przyjdź bez umawiania albo zgłoś naprawę online. Status naprawy sprawdzisz potem z telefonu."}
              </p>
              {/* live status of every point, one line each (not only the first) */}
              <ul className="t-pts3-hero__status" aria-label="Czy punkty są teraz otwarte">
                {published.map((p) => (
                  <li key={p.key}>
                    <OpeningStatus points={[p]} withName className="t-status--stage-text" skeletonCh={24} />
                  </li>
                ))}
              </ul>
              {points.length > 1 ? <NearestPoint visible={points.map((p) => p.key)} /> : null}
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
              <div className="t-pts3-hero__actions">
                <a href="#salony" className="t-hbtn t-hbtn--acc t-shine">
                  Adresy, godziny i telefony
                  <IconArrow size={16} strokeWidth={2.6} />
                </a>
                <Link href={SUBMIT_HREF} className="t-hbtn t-hbtn--ghost t-pts3-hero__ghost" data-track="zgloszenie_start" data-track-zrodlo="punkty_hero">
                  Zgłoś naprawę online
                </Link>
              </div>
            </div>
            <div className="t-pts2-net__map">
              <PodhaleMap points={points.map((p) => ({ key: p.key, name: p.name, draft: p.draft }))} />
            </div>
          </div>
        </div>
      </section>

      <section className="t-section t-section--tight t-pts2-salons" id="salony" data-rail="Salony" aria-labelledby="t-pts3-salony-h">
        <div className="t-container">
          <div className="t-pts3-head">
            <span className="t-eyebrow">Salony PRO-KOM Tech</span>
            <h2 id="t-pts3-salony-h" className="t-h2">
              {two ? "Adresy, godziny i kontakt" : "Adres, godziny i kontakt"}
            </h2>
          </div>
          <div className={`t-pts2-cards${points.length === 1 ? " is-single" : ""}`}>
            {points.map((p) => (
              <PointCard key={p.key} id={p.key} point={p} layout="feature" trackFrom="punkty" className="t-card" />
            ))}
          </div>
          <div className="t-pts3-below">
            <GeneralLineNote track="punkty" />
            <p className="t-pts3-below__hg">
              <span className="t-pts2-net__hgico" aria-hidden="true">
                <AboutIconSvg icon="layers" size={18} />
              </span>
              <span>
                <b>Hammer Glass</b> {PLOTTER}
              </span>
            </p>
          </div>
          <CourierTeaser className="t-pts2-courier" />
        </div>
      </section>

      <IntentCards title="Z czym przychodzisz?" id="z-czym" />

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
