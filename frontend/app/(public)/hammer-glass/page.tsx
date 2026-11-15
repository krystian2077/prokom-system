import Image from "next/image";
import Link from "next/link";
import { line, servicePoints, telHref } from "@/config/prokom";
import { Breadcrumbs } from "@/components/tech/Breadcrumbs";
import { JsonLd } from "@/components/tech/JsonLd";
import { FilmPicker } from "@/components/tech/hammer/FilmPicker";
import { PloterVideo } from "@/components/tech/hammer/PloterVideo";
import { DeviceGlyph, IconArrow } from "@/components/tech/icons";
import { claim, type VisibleClaim } from "@/lib/tech/claims";
import { POINTS_HREF } from "@/lib/tech/nav";
import { joinCities } from "@/lib/tech/point-format";
import { publishedPoints } from "@/lib/tech/points";
import { breadcrumbJsonLd, pageMetadata, type Crumb } from "@/lib/tech/seo";
import { serviceJsonLd } from "@/lib/tech/service-jsonld";
import { lowerFirst } from "@/lib/tech/wizard-data";

const published = publishedPoints(servicePoints);
const DESCRIPTION = `Folie ochronne Hammer Glass wycinane na ploterze pod Twój model telefonu, tabletu albo smartwatcha i zakładane na miejscu: ${joinCities(published)}.`;

export const metadata = pageMetadata({ title: "Hammer Glass — folie na wymiar", description: DESCRIPTION, path: "/hammer-glass" });

const CRUMBS: Crumb[] = [
  { name: "Start", path: "/" },
  { name: "Hammer Glass CUT", path: "/hammer-glass" },
];

/** Asking about a film is not a repair ticket → contact form, not /zgloszenie. */
const ASK_HREF = "/kontakt";
const d = (c: VisibleClaim | null) => (c?.draft ? " t-draft" : "");

export default function HammerGlassPage() {
  const models = claim("hgModels");
  const foils = claim("hgFoils");
  const precision = claim("hgPrecision");
  const minutes = claim("hgMinutes");
  const cut = claim("hgCutTime");

  const stats = [
    models && { b: models.text, s: "modeli w bazie", c: models },
    foils && { b: foils.text, s: "rodzajów folii", c: foils },
    minutes && { b: "ok. 5 min", s: "montaż", c: minutes },
    precision && { b: precision.text, s: "precyzja", c: precision },
  ].filter(Boolean) as { b: string; s: string; c: VisibleClaim }[];

  const cutLine = [cut?.text, precision ? `precyzja ${precision.text}` : null].filter(Boolean).join(", ");
  const how = [
    { t: "Wybierz folię", s: "Przezroczyste, matowe, z filtrem prywatności, na tablet i zegarek.", img: "/tech/hammer/hg-folie.webp", c: null },
    { t: "Podaj model", s: models ? `W bazie jest ponad ${models.text.replace("+", "")} telefonów, tabletów i smartwatchy.` : "Wycinamy folie na telefony, tablety i smartwatche.", img: null, c: models },
    { t: "Ploter wycina", s: cutLine ? `${cutLine}. Dokładnie pod Twój ekran.` : "Dokładnie pod Twój ekran.", img: "/tech/hammer/hg-ciecie.webp", c: cut ?? precision },
    { t: "Zakładamy", s: minutes ? `${minutes.text.replace(/\.$/, "")}, na sucho i bez bąbelków, do samej krawędzi.` : "Na sucho i bez bąbelków, do samej krawędzi.", img: "/tech/hammer/hg-ploter.webp", c: minutes },
  ];

  const specs = [
    models ? { t: `Baza ${models.text} modeli`, s: "Telefony, tablety i smartwatche.", c: models } : { t: "Baza modeli", s: "Telefony, tablety i smartwatche.", c: null },
    precision ? { t: `Precyzja ${precision.text}`, s: "Dopasowanie do krawędzi ekranu.", c: precision } : null,
    minutes ? { t: "Montaż około 5 minut", s: "Cięcie i aplikacja na miejscu.", c: minutes } : { t: "Montaż na miejscu", s: "Cięcie i aplikacja przy Tobie.", c: null },
    { t: "PZH i RoHS", s: "Każda folia ma certyfikaty.", c: null },
    { t: "Powłoka oleofobowa", s: "Mniej odcisków palców i smug.", c: null },
    { t: "Samoregeneracja", s: "Drobne rysy znikają same (Entry i Premium).", c: null },
    { t: "Powłoka antymikrobowa", s: "W linii Prime Protector.", c: null },
    { t: "Zaokrąglone ekrany", s: "Folia przylega do krawędzi.", c: null },
  ].filter(Boolean) as { t: string; s: string; c: VisibleClaim | null }[];

  return (
    <div className="t-ui t-page t-hg">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <JsonLd data={serviceJsonLd({ name: `Hammer Glass — folie na wymiar · ${line.name}`, serviceType: "Folia ochronna na ekran wycinana na wymiar", path: "/hammer-glass", description: DESCRIPTION })} />

      <section className="t-section--hero" id="start" data-rail="Hammer Glass">
        <div className="t-container">
          <div className="t-stage t-hg-hero">
            <svg className="t-hg-hero__rings" viewBox="0 0 900 900" aria-hidden="true">
              <g fill="none" stroke="#E2483A" strokeWidth="1.2">
                <circle cx="450" cy="450" r="170" opacity="0.35" strokeDasharray="2 10" />
                <circle cx="450" cy="450" r="270" opacity="0.25" />
                <circle cx="450" cy="450" r="370" opacity="0.18" strokeDasharray="60 18" />
              </g>
            </svg>
            <div className="t-hg-hero__text">
              <Breadcrumbs items={CRUMBS} separator="/" />
              <span className="t-eyebrow t-eyebrow--stage">Folie ochronne wycinane na miejscu</span>
              <h1 className="t-hg-hero__h1">
                Folia wycięta dokładnie pod <span>Twój model.</span>
              </h1>
              <p className="t-hg-hero__lead">
                Telefon, tablet albo smartwatch. Wybierasz rodzaj folii, podajesz model, a ploter Hammer Glass VersaBlade X Pro wycina ją przy Tobie.
                {minutes ? <span className={d(minutes)}> Zakładamy {lowerFirst(minutes.text)}</span> : null}
              </p>
              <div className="t-btnrow">
                <a href="#folie" className="t-pbtn t-pbtn--stage">
                  Dobierz folię <IconArrow size={17} strokeWidth={2.6} />
                </a>
                <Link href={POINTS_HREF} className="t-pbtn t-pbtn--ghost-dark">
                  Gdzie założysz folię
                </Link>
              </div>
              {stats.length ? (
                <div className="t-hg-stats">
                  {stats.map((s) => (
                    <span key={s.s} className={`t-hg-stat${d(s.c)}`}>
                      <b>{s.b}</b>
                      {s.s}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="t-hg-hero__media">
              <PloterVideo />
              <Image src="/tech/hammer/hg-ciecie.webp" width={1280} height={650} alt="Głowica plotera wycina folię" sizes="250px" className="t-hg-hero__float" />
            </div>
          </div>
        </div>
      </section>

      <section className="t-section t-section--tight" id="folie" data-rail="Folie">
        <div className="t-container">
          <div className="t-sechead">
            <div>
              <span className={`t-eyebrow${d(foils)}`}>{foils ? `${foils.text} rodzajów folii` : "Rodzaje folii"}</span>
              <h2 className="t-h2">Wybierz folię i zobacz różnicę</h2>
            </div>
            <p className="t-lead">Kliknij folię. Podgląd pokazuje, jak zmienia ekran.</p>
          </div>
          <FilmPicker askHref={ASK_HREF} />
        </div>
      </section>

      <section className="t-section t-section--alt" id="jak-wycinamy" data-rail="Jak to działa">
        <div className="t-container">
          <div className="t-sechead">
            <div>
              <span className="t-eyebrow">Jak to działa</span>
              <h2 className="t-h2">Od wyboru do gotowej folii w kilka minut</h2>
            </div>
          </div>
          <ol className="t-hg-how">
            {how.map((s, i) => (
              <li key={s.t} className={`t-card t-hg-how__item${d(s.c)}`}>
                <div className="t-hg-how__img">
                  {s.img ? (
                    <Image src={s.img} width={640} height={340} alt="" sizes="(min-width: 1180px) 300px, (min-width: 768px) 50vw, 100vw" />
                  ) : (
                    <span className="t-hg-how__glyph" aria-hidden="true">
                      <DeviceGlyph icon="phone" size={64} strokeWidth={1.4} />
                    </span>
                  )}
                  <span className="t-hg-how__n" aria-hidden="true">
                    {i + 1}
                  </span>
                </div>
                <div className="t-hg-how__txt">
                  <h3 className="t-h3">{s.t}</h3>
                  <p>{s.s}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="t-section" id="co-dostajesz" data-rail="Co dostajesz">
        <div className="t-container">
          <div className="t-sechead">
            <div>
              <span className="t-eyebrow">Co dostajesz</span>
              <h2 className="t-h2">Każda folia, każdy model</h2>
            </div>
            <span className="t-hg-cert">Certyfikaty PZH i RoHS</span>
          </div>
          <ul className="t-hg-specs">
            {specs.map((x) => (
              <li key={x.t} className={`t-card t-hg-specs__item${d(x.c)}`}>
                <b className="t-h3 t-h3--sm">{x.t}</b>
                <span>{x.s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="t-section t-section--flush-top" id="urzadzenia" data-rail="Urządzenia">
        <div className="t-container">
          <ul className="t-hg-devs">
            <li id="telefon" className="t-card t-hg-dev">
              <span className="t-eyebrow">Telefony</span>
              <span className="t-h3 t-hg-dev__t">Apple, Samsung, Xiaomi i inne</span>
              <span className="t-hg-dev__s">Każdy model wycinany na wymiar.</span>
              <Image src="/tech/urzadzenia/iphone.webp" width={433} height={577} alt="" sizes="230px" className="t-hg-dev__img" />
              <Link href={POINTS_HREF} className="t-hg-dev__cta">
                Folie na telefon →
              </Link>
            </li>
            <li id="tablet" className="t-card t-hg-dev">
              <span className="t-eyebrow">Tablety</span>
              <span className="t-h3 t-hg-dev__t">iPad, Galaxy Tab i inne</span>
              <span className="t-hg-dev__s">Tablet Armour w dużym formacie.</span>
              <Image src="/tech/urzadzenia/tablet.webp" width={577} height={640} alt="" sizes="230px" className="t-hg-dev__img" />
              <Link href={POINTS_HREF} className="t-hg-dev__cta">
                Folie na tablet →
              </Link>
            </li>
            <li id="smartwatch" className="t-card t-hg-dev">
              <span className="t-eyebrow">Smartwatche</span>
              <span className="t-h3 t-hg-dev__t">Apple Watch, Galaxy Watch</span>
              <span className="t-hg-dev__s">Watch Armour, wodoodporna.</span>
              <span className="t-hg-dev__watch" aria-hidden="true">
                9:41<span>Watch Armour</span>
              </span>
              <Link href={POINTS_HREF} className="t-hg-dev__cta">
                Folie na zegarek →
              </Link>
            </li>
          </ul>
        </div>
      </section>

      <section className="t-section t-section--flush-top" id="bez-umawiania" data-rail="Bez umawiania">
        <div className="t-container">
          <div className="t-hg-cta">
            <div className="t-hg-cta__text">
              <span className="t-eyebrow t-eyebrow--stage">Bez umawiania</span>
              <h2 className="t-h2">Wpadnij z telefonem. Wyjdziesz z folią.</h2>
              <p className="t-lead t-lead--stage">Oddajesz sprzęt do naprawy? W zgłoszeniu zaznacz, że chcesz folię. Założymy ją przy odbiorze.</p>
              <div className="t-btnrow">
                <Link href={POINTS_HREF} className="t-pbtn t-pbtn--stage">
                  Punkty i godziny otwarcia
                </Link>
                <a href={telHref(line.phone)} className="t-pbtn t-pbtn--ghost-dark" data-track="telefon_klik" data-track-miejsce="hammer_glass">
                  {line.phoneDisplay}
                </a>
              </div>
            </div>
            <div className="t-hg-cta__img">
              <Image src="/tech/hammer/hg-folie.webp" width={840} height={650} alt="Opakowania folii Hammer Glass" sizes="(min-width: 1024px) 600px, 100vw" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
