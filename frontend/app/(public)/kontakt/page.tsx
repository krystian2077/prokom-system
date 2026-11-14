import Link from "next/link";
import { company, line, servicePoints, telHref } from "@/config/prokom";
import { Breadcrumbs } from "@/components/tech/Breadcrumbs";
import { Faq } from "@/components/tech/Faq";
import { IconChevronRight } from "@/components/tech/icons";
import { InquiryForm } from "@/components/tech/InquiryForm";
import { IntentCards } from "@/components/tech/IntentCards";
import { JsonLd } from "@/components/tech/JsonLd";
import { LineCards } from "@/components/tech/LineCards";
import { OpeningStatus } from "@/components/tech/OpeningStatus";
import { PageIconSvg } from "@/components/tech/page-icons";
import { hoursLong, inCity, isMainPoint } from "@/lib/tech/point-format";
import { publishedPoints, visiblePoints } from "@/lib/tech/points";
import { POINTS_HREF, SUBMIT_HREF } from "@/lib/tech/nav";
import { breadcrumbJsonLd, pageMetadata, type Crumb } from "@/lib/tech/seo";
import { visitFaq } from "@/lib/tech/visit-faq";

const published = publishedPoints(servicePoints);
const two = published.length > 1;

export const metadata = pageMetadata({
  title: "Kontakt — telefon, e-mail i formularz",
  description: two
    ? "Kontakt z serwisem PRO-KOM Tech w Rabce-Zdroju i Zakopanem: telefon, e-mail i formularz. Odpowiadamy w godzinach pracy punktów."
    : "Kontakt z serwisem PRO-KOM Tech w Rabce-Zdroju: telefon, e-mail i formularz kontaktowy. Odpowiadamy w godzinach pracy punktu.",
  path: "/kontakt",
});

const CRUMBS: Crumb[] = [
  { name: "Start", path: "/" },
  { name: "Kontakt", path: "/kontakt" },
];

const NEXT = [
  { t: "Dostajesz potwierdzenie", s: "Odpowiedź przyjdzie na podany e-mail." },
  { t: two ? "Odpowiada punkt, który wybierzesz" : "Odpowiada serwis", s: "Telefonicznie albo mailowo." },
  { t: "Ustalamy, co dalej", s: "Wizyta w punkcie, wysyłka kurierem albo odpowiedź na pytanie." },
];

export default function ContactPage() {
  const points = visiblePoints();
  return (
    <div className="t-ui t-page">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />

      <section className="t-section--hero" id="kontakt" data-rail="Kontakt">
        <div className="t-container">
          <div className="t-stage t-ct-hero">
            <div className="t-ct-hero__text">
              <Breadcrumbs items={CRUMBS} />
              <h1 className="t-ct-hero__h1">
                Zadzwoń albo napisz.
                <span>{two ? "Odpowiadamy w godzinach pracy punktów." : "Odpowiadamy w godzinach pracy punktu."}</span>
              </h1>
              <a href={telHref(line.phone)} className="t-ct-hero__phone" data-track="telefon_klik" data-track-miejsce="kontakt_hero">
                {line.phoneDisplay}
              </a>
              <OpeningStatus points={published} withName className="t-status--stage-text" skeletonCh={30} />
              <div className="t-btnrow">
                <a href={telHref(line.phone)} className="t-pbtn t-pbtn--stage" data-track="telefon_klik" data-track-miejsce="kontakt_hero_przycisk">
                  Zadzwoń teraz
                </a>
                <a href="#formularz" className="t-pbtn t-pbtn--ghost-dark">
                  Napisz wiadomość
                </a>
              </div>
            </div>
            <div className="t-ct-hero__side">
              <a href={`mailto:${line.email}`} className="t-ct-tile">
                <span className="t-ct-tile__ico">
                  <PageIconSvg icon="mail" />
                </span>
                <span className="t-ct-tile__txt">
                  <span>E-mail</span>
                  <b>{line.email}</b>
                </span>
              </a>
              {points.map((p) => (
                <Link key={p.key} href={POINTS_HREF} className={`t-ct-tile${p.draft ? " t-draft" : ""}`}>
                  <span className="t-ct-tile__ico">
                    <PageIconSvg icon="pin" />
                  </span>
                  <span className="t-ct-tile__txt">
                    <span>
                      {isMainPoint(p) ? "Punkt główny" : `Punkt ${inCity(p.city)}`}
                      {p.draft ? <span className="t-draft-badge">do uzupełnienia</span> : null}
                    </span>
                    <b className="t-ct-tile__city">{p.name}</b>
                    <span className="t-ct-tile__sub">
                      {p.street ? `${p.street} · ` : ""}
                      {hoursLong(p)}
                    </span>
                  </span>
                  <IconChevronRight />
                </Link>
              ))}
              <p className="t-ct-hero__note">
                {company.name} · NIP {company.nip}
                {two ? " · w obu punktach ten sam system zgłoszeń." : "."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <IntentCards title="W jakiej sprawie piszesz?" />

      <section className="t-section t-section--flush-top" id="formularz" data-rail="Formularz">
        <div className="t-container">
          <div className="t-ct-form">
            <div className="t-ct-form__aside">
              <span className="t-eyebrow t-eyebrow--stage">Formularz</span>
              <h2 className="t-h2 t-h2--sm">Napisz. Odpowiemy w godzinach pracy.</h2>
              <span className="t-ct-form__label">Co dalej po wysłaniu</span>
              <ol className="t-ct-form__steps">
                {NEXT.map((n, i) => (
                  <li key={n.t}>
                    <span className={i === 0 ? "is-first" : undefined}>{i + 1}</span>
                    <div>
                      <b>{n.t}</b>
                      <p>{n.s}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="t-ct-form__foot">
                Naprawę zgłosisz szybciej osobnym formularzem: <Link href={SUBMIT_HREF} data-t-inline="">Zgłoś naprawę →</Link>
              </p>
            </div>
            <div className="t-ct-form__main">
              <InquiryForm points={points.map((p) => ({ key: p.key, name: p.name, draft: p.draft }))} />
            </div>
          </div>
        </div>
      </section>

      <LineCards title="Inna sprawa? Każda linia PRO-KOM ma swój zespół." />

      <section className="t-section t-section--alt" id="pytania" data-rail="Pytania o wizytę">
        <div className="t-container t-faqsplit">
          <div className="t-faqsplit__head">
            <span className="t-eyebrow">Zanim przyjedziesz</span>
            <h2 className="t-h2">Pytania o wizytę w punkcie</h2>
            <p className="t-lead">
              Dojazd, parking i to, co warto zabrać ze sobą. Godziny: {published.map((p) => `${p.name} ${hoursLong(p)}`).join("; ")}.
            </p>
          </div>
          <Faq items={visitFaq(published)} />
        </div>
      </section>
    </div>
  );
}
