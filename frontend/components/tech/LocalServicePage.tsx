import Link from "next/link";
import { notFound } from "next/navigation";
import { line, servicePoints, telHref } from "@/config/prokom";
import { localPage, localPageState, nearbyTowns, visibleLocalPages, type LocalSlug } from "@/lib/tech/local-pages";
import { POINTS_HREF, SUBMIT_HREF } from "@/lib/tech/nav";
import { publishedPoints, visiblePoints } from "@/lib/tech/points";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata, serviceJsonLd, type Crumb } from "@/lib/tech/seo";
import { Breadcrumbs } from "./Breadcrumbs";
import { Faq } from "./Faq";
import { JsonLd } from "./JsonLd";
import { PhoneBrandsSection, PhoneRepairsSection, PhoneStepsSection } from "./PhoneSections";
import { PointCard } from "./PointCard";
import { polishText } from "@/lib/tech/typo";

const crumbs = (slug: LocalSlug, city: string): Crumb[] => [
  { name: "Start", path: "/" },
  { name: "Naprawy", path: "/uslugi" },
  { name: "Serwis telefonów", path: "/serwis-telefonow" },
  { name: city, path: `/${slug}` },
];

export function localMetadata(slug: LocalSlug) {
  const p = localPage(slug);
  const meta = pageMetadata({ title: p.title, description: p.description, path: `/${slug}` });
  // Drafts (staging only) must never be indexed.
  return localPageState(p) === "published" ? meta : { ...meta, robots: { index: false, follow: false } };
}

/**
 * Local page template (design #serwis-telefonow-zakopane): hero with the point card,
 * repairs, brands, steps, area + access, local FAQ. 404 when the page may not publish.
 */
export function LocalServicePage({ slug }: { slug: LocalSlug }) {
  const p = localPage(slug);
  const state = localPageState(p);
  if (state === "hidden") notFound();
  const point = visiblePoints().find((x) => x.key === p.point);
  if (!point) notFound();
  const draft = state === "draft";
  const others = visibleLocalPages().filter((x) => x.slug !== slug);
  const nearby = nearbyTowns(p);
  const two = publishedPoints(servicePoints).length > 1;
  const c = crumbs(slug, p.city);

  return (
    <div className="t-ui t-page">
      <JsonLd data={breadcrumbJsonLd(c)} />
      <JsonLd data={faqJsonLd(p.faq)} />
      {draft ? null : (
        <JsonLd
          data={serviceJsonLd({
            name: `Serwis telefonów ${p.city}`,
            serviceType: "Naprawa telefonów",
            path: `/${slug}`,
            providers: [p.point],
            areaServed: [p.city, ...nearby.map((t) => t.name)],
          })}
        />
      )}

      <section className="t-section--hero" id="serwis" data-rail="Serwis">
        <div className="t-container">
          <div className={`t-stage t-loc-hero${draft ? " t-draft" : ""}`}>
            <div className="t-loc-hero__text">
              <Breadcrumbs items={c} separator="/" />
              {draft ? <span className="t-draft-badge">szkic — punkt nieopublikowany</span> : null}
              <h1 className="t-loc-hero__h1">
                Serwis telefonów
                <span>{polishText(p.city, true)}</span>
              </h1>
              <p className="t-lead t-lead--stage">{p.intro}</p>
              <div className="t-btnrow">
                <Link href={`${SUBMIT_HREF}?category=phone&punkt=${p.point}`} className="t-pbtn t-pbtn--stage">
                  Zgłoś naprawę {p.inCity}
                </Link>
                <a href={telHref(line.phone)} className="t-pbtn t-pbtn--ghost-dark" data-track="telefon_klik" data-track-miejsce={`lokalna_${p.point}`}>
                  {line.phoneDisplay}
                </a>
              </div>
              {others.length ? (
                <div className="t-loc-hero__towns">
                  <span>Serwis telefonów także w:</span>
                  <div className="t-townchips">
                    {others.map((o) => (
                      <Link key={o.slug} href={`/${o.slug}`} className="t-townchip t-townchip--stage">
                        {o.city}
                      </Link>
                    ))}
                    <Link href="/obslugiwane-miejscowosci" className="t-townchip t-townchip--stage">
                      Wszystkie miejscowości →
                    </Link>
                  </div>
                </div>
              ) : (
                <Link href="/obslugiwane-miejscowosci" className="t-loc-hero__all" data-t-inline="">
                  Obsługiwane miejscowości →
                </Link>
              )}
            </div>
            <div className="t-loc-hero__card">
              <PointCard
                point={point}
                layout="stack"
                as="h2"
                trackFrom="lokalna"
                secondary={{ label: two ? "Oba punkty serwisowe" : "Punkt serwisowy", href: POINTS_HREF }}
              />
            </div>
          </div>
        </div>
      </section>

      <PhoneRepairsSection punkt={p.point} />
      <PhoneBrandsSection title={`Jakie telefony naprawiamy ${p.inCity}`} />
      <PhoneStepsSection eyebrow={`Jak to działa ${p.inCity}`} cityName={p.city} />

      <section className="t-section" id="okolice" data-rail="Okolice i pytania">
        <div className="t-container t-faqsplit">
          <div className="t-faqsplit__head">
            <span className="t-eyebrow">{p.city} i okolice</span>
            <h2 className="t-h2">Skąd do nas przyjeżdżają</h2>
            <p className="t-lead">{p.area}</p>
            <ul className="t-townchips" aria-label="Okoliczne miejscowości">
              {nearby.map((t) => (
                <li key={t.slug} className="t-townchip">
                  {t.name}
                </li>
              ))}
            </ul>
            <div className="t-loc-access">
              <b>Dojazd</b>
              <p>{p.access}</p>
              {point.parkingNote ? <p>{point.parkingNote}</p> : null}
            </div>
          </div>
          <div>
            <span className="t-eyebrow t-faq-eyebrow">Pytania o serwis {p.inCity}</span>
            <Faq items={p.faq} />
          </div>
        </div>
      </section>
    </div>
  );
}
