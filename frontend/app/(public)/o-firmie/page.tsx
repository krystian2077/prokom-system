import Link from "next/link";
import { company, line, servicePoints, telHref } from "@/config/prokom";
import { Breadcrumbs } from "@/components/tech/Breadcrumbs";
import { CtaBand } from "@/components/tech/CtaBand";
import { DataSafety } from "@/components/tech/DataSafety";
import { JsonLd } from "@/components/tech/JsonLd";
import { LineCards } from "@/components/tech/LineCards";
import { claim, type VisibleClaim } from "@/lib/tech/claims";
import { CEIDG_URL, hoursLong, inCity, joinCities } from "@/lib/tech/point-format";
import { publishedPoints } from "@/lib/tech/points";
import { POINTS_HREF, SUBMIT_HREF } from "@/lib/tech/nav";
import { breadcrumbJsonLd, pageMetadata, type Crumb } from "@/lib/tech/seo";

const published = publishedPoints(servicePoints);
const two = published.length > 1;
const main = published[0];

export const metadata = pageMetadata({
  title: "O firmie — lokalny serwis z Podhala",
  description: `${line.name} to serwisowa linia ${company.name}. Naprawiamy telefony, laptopy, tablety, komputery, konsole i drukarki: ${joinCities(published)}.`,
  path: "/o-firmie",
});

const CRUMBS: Crumb[] = [
  { name: "Start", path: "/" },
  { name: "O firmie", path: "/o-firmie" },
];

const draftCls = (c: VisibleClaim | null) => (c?.draft ? " t-draft" : "");

export default function AboutPage() {
  const since = claim("aboutSince");
  const linesClaim = claim("aboutLines");
  const foils = claim("hgFoils");
  const rating = claim("googleRating");
  const profiles = claim("googleProfiles");
  const ruleParts = claim("ruleParts");
  const ruleData = claim("ruleData");

  const stats = [
    since ? { b: since.text, s: `Rok założenia firmy ${inCity(company.hq.city)}`, c: since } : null,
    two ? { b: String(published.length), s: `Punkty serwisowe: ${joinCities(published)}`, c: null } : null,
    foils ? { b: foils.text, s: "Rodzajów folii Hammer Glass wycinanych na miejscu", c: foils } : null,
    linesClaim ? { b: linesClaim.text, s: "Linie PRO-KOM i marka PRO-KOM Gaming", c: linesClaim } : null,
  ].filter((x): x is { b: string; s: string; c: VisibleClaim | null } => x !== null);

  const rules = [
    { t: "Wycena przed naprawą", s: "Najpierw diagnoza, potem kwota. Naprawiamy dopiero wtedy, gdy się zgodzisz.", c: null },
    { t: "Możesz zrezygnować", s: "Wycena Ci nie odpowiada? Odbierasz sprzęt bez konsekwencji.", c: null },
    ruleParts ? { t: "Mówimy, jakie części", s: ruleParts.text, c: ruleParts } : null,
    { t: "Gwarancja", s: "Na wykonaną usługę i na wymienione części.", c: null },
    { t: "Status online", s: "Sprawdzasz go sam po numerze zgłoszenia i 4 ostatnich cyfrach telefonu.", c: null },
    ruleData ? { t: "Twoje dane", s: ruleData.text, c: ruleData } : null,
  ].filter((x): x is { t: string; s: string; c: VisibleClaim | null } => x !== null);

  return (
    <div className="t-ui t-page">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />

      <section className="t-section--hero" id="o-firmie" data-rail="O firmie">
        <div className="t-container">
          <div className="t-stage t-about-hero">
            {since ? (
              <span className={`t-about-hero__year${draftCls(since)}`} aria-hidden="true">
                {since.text}
              </span>
            ) : null}
            <div className="t-about-hero__text">
              <Breadcrumbs items={CRUMBS} />
              <span className="t-pill-stage">
                <i aria-hidden="true" />
                {company.name} · {company.hq.city}
                {since ? <span className={draftCls(since)}>, od {since.text}</span> : null}
              </span>
              <h1 className="t-about-hero__h1">
                Lokalny serwis.
                <br />
                <span className={draftCls(since)}>{since ? `Na Podhalu od ${since.text} roku.` : "Prosto z Podhala."}</span>
              </h1>
              <p className="t-about-hero__lead">
                {line.name} to serwisowa linia firmy PRO-KOM. Naprawiamy telefony, laptopy, tablety, komputery, konsole i drukarki{" "}
                {two ? `w dwóch punktach: ${published.map((p) => inCity(p.city)).join(" i ")}` : inCity(main.city)}.
              </p>
              <div className="t-btnrow">
                <Link href={SUBMIT_HREF} className="t-pbtn t-pbtn--stage">
                  Zgłoś naprawę
                </Link>
                <Link href={POINTS_HREF} className="t-pbtn t-pbtn--ghost-dark">
                  {two ? "Punkty serwisowe" : "Punkt serwisowy"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="t-section t-section--tight" id="wizytowka" data-rail="Wizytówka">
        <div className={`t-container t-about-card${stats.length ? "" : " is-solo"}`}>
          <div className="t-card t-about-card__vcard">
            <span className="t-eyebrow">Wizytówka</span>
            <h2 className="t-about-card__name">{company.name}</h2>
            <dl className="t-vkv">
              <div>
                <dt>Adres</dt>
                <dd>
                  {company.hq.street}, {company.hq.postal} {company.hq.city}
                </dd>
              </div>
              <div>
                <dt>NIP</dt>
                <dd>{company.nip}</dd>
              </div>
              <div>
                <dt>Serwis</dt>
                <dd>
                  <a href={telHref(line.phone)} data-track="telefon_klik" data-track-miejsce="o_firmie" data-t-inline="">
                    {line.phoneDisplay}
                  </a>{" "}
                  · <a href={`mailto:${line.email}`} data-t-inline="">{line.email}</a>
                </dd>
              </div>
              <div>
                <dt>Godziny</dt>
                <dd>{hoursLong(main)}</dd>
              </div>
            </dl>
            <a href={CEIDG_URL} target="_blank" rel="noopener noreferrer" className="t-about-card__ceidg">
              Dane sprawdzisz w CEIDG po numerze NIP ↗
            </a>
          </div>
          {stats.length ? (
            <div className="t-about-card__stats">
              {stats.map((s) => (
                <div key={s.s} className={`t-stat${draftCls(s.c)}`}>
                  <b>{s.b}</b>
                  <span>{s.s}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="t-section t-section--alt" id="zasady" data-rail="Zasady">
        <div className="t-container">
          <div className="t-sechead">
            <div>
              <span className="t-eyebrow">Zasady</span>
              <h2 className="t-h2">Czego możesz od nas oczekiwać</h2>
            </div>
            <p className="t-lead">
              {rules.length === 6 ? "Sześć rzeczy" : "Zasady"}, które obowiązują {two ? "w obu punktach" : "w punkcie"}, przy każdej naprawie.
            </p>
          </div>
          <div className={`t-rules${rules.length === 4 ? " t-rules--4" : ""}`}>
            {rules.map((r, i) => (
              <div key={r.t} className={`t-rule${draftCls(r.c)}`}>
                <i aria-hidden="true">{String(i + 1).padStart(2, "0")}</i>
                <h3>{r.t}</h3>
                <p>{r.s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <DataSafety />

      <LineCards title={linesClaim ? "Jedna firma. Cztery linie i marka Gaming." : "Jedna firma, kilka linii PRO-KOM."} />

      <section className="t-section t-section--tight" id="sprawdz" data-rail="Sprawdź nas">
        <div className="t-container">
          <h2 className="t-h2 t-h2--sm">Nie musisz wierzyć nam na słowo</h2>
          <div className="t-proof">
            <a href={CEIDG_URL} target="_blank" rel="noopener noreferrer" className="t-card t-proof__card">
              <h3>Rejestr CEIDG</h3>
              <p>Firmę sprawdzisz po numerze NIP {company.nip}.</p>
              <span className="t-proof__more">Otwórz CEIDG ↗</span>
            </a>
            {rating && profiles ? (
              <a href={profiles.text} target="_blank" rel="noopener noreferrer" className={`t-card t-proof__card${draftCls(rating)}`}>
                <h3>Opinie Google</h3>
                <p>{rating.text}</p>
                <span className="t-proof__more">{two ? "Wizytówki obu punktów ↗" : "Wizytówka punktu ↗"}</span>
              </a>
            ) : null}
            <Link href={POINTS_HREF} className="t-card t-proof__card">
              <h3>Przyjdź i zobacz</h3>
              <p>{two ? "Dwa punkty na Podhalu. Bez umawiania, w godzinach otwarcia." : `Punkt ${inCity(main.city)}. Bez umawiania, w godzinach otwarcia.`}</p>
              <span className="t-proof__more">Dojazd i godziny →</span>
            </Link>
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="Następny krok"
        title="Masz zepsuty sprzęt? Zgłoś naprawę albo napisz."
        primary={{ label: "Zgłoś naprawę", href: SUBMIT_HREF }}
        secondary={{ label: "Kontakt", href: "/kontakt" }}
      />
    </div>
  );
}
