import Link from "next/link";
import { company, line, servicePoints, telHref } from "@/config/prokom";
import { AboutHeroArt } from "@/components/tech/about/AboutHeroArt";
import { AboutIconSvg, type AboutIcon } from "@/components/tech/about/about-icons";
import { AboutRules, type AboutRule } from "@/components/tech/about/AboutRules";
import { AboutSalon } from "@/components/tech/about/AboutSalon";
import { AlsenBlock } from "@/components/tech/AlsenPartner";
import { Spotlight } from "@/components/tech/about/Spotlight";
import { Breadcrumbs } from "@/components/tech/Breadcrumbs";
import { CtaBand } from "@/components/tech/CtaBand";
import { DataSafety } from "@/components/tech/DataSafety";
import { JsonLd } from "@/components/tech/JsonLd";
import { LineCards } from "@/components/tech/LineCards";
import { claim, type VisibleClaim } from "@/lib/tech/claims";
import { CEIDG_URL, hoursLong, inCity, joinCities } from "@/lib/tech/point-format";
import { publishedPoints, type VisiblePoint } from "@/lib/tech/points";
import { POINTS_HREF, SUBMIT_HREF } from "@/lib/tech/nav";
import { breadcrumbJsonLd, pageMetadata, type Crumb } from "@/lib/tech/seo";

const published = publishedPoints(servicePoints);
const two = published.length > 1;
const main = published[0];
/** Only published points reach this page (no draft frame), as cards and hero pins. */
const salons: VisiblePoint[] = published.map((p) => ({ ...p, draft: false }));

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

type Stat = { key: string; icon: AboutIcon; b: string; s: string; c: VisibleClaim | null };

export default function AboutPage() {
  const since = claim("aboutSince");
  const linesClaim = claim("aboutLines");
  const foils = claim("hgFoils");
  const rating = claim("googleRating");
  const profiles = claim("googleProfiles");
  const ruleParts = claim("ruleParts");
  const ruleData = claim("ruleData");

  const stats = [
    since ? { key: "since", icon: "clock", b: since.text, s: `Rok założenia firmy ${inCity(company.hq.city)}`, c: since } : null,
    two ? { key: "points", icon: "pin", b: String(published.length), s: `Punkty serwisowe: ${joinCities(published)}`, c: null } : null,
    foils ? { key: "foils", icon: "layers", b: foils.text, s: "rodzajów folii Hammer Glass wycinanych na miejscu", c: foils } : null,
    linesClaim ? { key: "lines", icon: "grid", b: linesClaim.text, s: "Linie PRO-KOM i marka PRO-KOM Gaming", c: linesClaim } : null,
  ].filter((x): x is Stat => x !== null);

  const rules = [
    { key: "quote", icon: "quote", t: "Wycena przed naprawą", s: "Najpierw diagnoza, potem kwota. Naprawiamy dopiero wtedy, gdy się zgodzisz.", draft: false },
    { key: "resign", icon: "undo", t: "Możesz zrezygnować", s: "Wycena Ci nie odpowiada? Odbierasz sprzęt bez konsekwencji.", draft: false },
    ruleParts ? { key: "parts", icon: "chip", t: "Mówimy, jakie części", s: ruleParts.text, draft: ruleParts.draft } : null,
    { key: "warranty", icon: "shield", t: "Gwarancja", s: "Na wykonaną usługę i na wymienione części.", draft: false },
    { key: "status", icon: "pulse", t: "Status online", s: "Sprawdzasz go sam po numerze zgłoszenia i 4 ostatnich cyfrach telefonu.", draft: false },
    ruleData ? { key: "data", icon: "lock", t: "Twoje dane", s: ruleData.text, draft: ruleData.draft } : null,
  ].filter((x): x is AboutRule => x !== null);

  return (
    <div className="t-ui t-page t-about">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />

      <section className="t-section--hero" id="o-firmie" data-rail="O firmie">
        <div className="t-container">
          <div className="t-ab-hero">
            <div className="t-ab-hero__text">
              <Breadcrumbs items={CRUMBS} />
              <span className="t-ab-hero__eyebrow">
                <i aria-hidden="true" />
                <span>
                  {company.name} · {company.hq.city}
                </span>
              </span>
              <h1 className="t-ab-hero__h1">
                Lokalny serwis.
                <br />
                <span className={draftCls(since)}>{since ? `Na Podhalu od ${since.text} roku.` : "Prosto z Podhala."}</span>
              </h1>
              <p className="t-ab-hero__lead">
                {line.name} to serwisowa linia firmy PRO-KOM. Naprawiamy telefony, laptopy, tablety, komputery, konsole i drukarki{" "}
                {two ? `w dwóch punktach: ${published.map((p) => inCity(p.city)).join(" i ")}` : inCity(main.city)}.
              </p>
              <div className="t-ab-hero__actions">
                <Link href={SUBMIT_HREF} className="t-hbtn t-hbtn--acc t-shine t-ab-hero__submit">
                  Zgłoś naprawę
                </Link>
                <Link href={POINTS_HREF} className="t-hbtn t-hbtn--ghost t-ab-hero__ghost">
                  {two ? "Punkty serwisowe" : "Punkt serwisowy"}
                </Link>
              </div>
            </div>
            <div className="t-ab-hero__visual">
              <AboutHeroArt year={since?.text ?? null} yearDraft={since?.draft} points={salons} />
            </div>
          </div>
        </div>
      </section>

      <section className="t-section t-section--tight" id="wizytowka" data-rail="Wizytówka">
        <div className={`t-container t-ab-intro${stats.length ? "" : " is-solo"}`}>
          <div className="t-card t-ab-vcard">
            <div className="t-ab-vcard__head">
              <span className="t-eyebrow">Wizytówka</span>
              <span className="t-ab-vcard__seal" aria-hidden="true">
                <AboutIconSvg icon="registry" size={20} />
              </span>
            </div>
            <h2 className="t-ab-vcard__name">{company.name}</h2>
            <dl className="t-ab-vkv">
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
                <dd>
                  {two
                    ? published.map((p) => (
                        <span key={p.key} className="t-ab-vcard__hours">
                          {p.name}: {hoursLong(p)}
                        </span>
                      ))
                    : hoursLong(main)}
                </dd>
              </div>
            </dl>
            <a href={CEIDG_URL} target="_blank" rel="noopener noreferrer" className="t-ab-vcard__ceidg">
              Dane sprawdzisz w CEIDG po numerze NIP ↗
            </a>
          </div>
          {stats.length ? (
            <Spotlight className={`t-ab-stats t-ab-stats--${stats.length}`} data-t-stagger="">
              {stats.map((s) => (
                <div key={s.key} className={`t-card t-ab-stat t-ab-stat--${s.key}${draftCls(s.c)}`} data-spot="">
                  <span className="t-ab-stat__ico" aria-hidden="true">
                    <AboutIconSvg icon={s.icon} size={20} />
                  </span>
                  <b>{s.b}</b>
                  <span className="t-ab-stat__label">{s.s}</span>
                  {s.key === "since" ? <span className="t-ab-stat__ticks" aria-hidden="true" /> : null}
                </div>
              ))}
            </Spotlight>
          ) : null}
        </div>
      </section>

      <section className="t-section t-section--alt t-ab-rules-sec" id="zasady" data-rail="Zasady">
        <div className="t-container">
          <div className="t-sechead t-ab-sechead">
            <div>
              <span className="t-eyebrow">Zasady</span>
              <h2 className="t-h2">Czego możesz od nas oczekiwać</h2>
            </div>
            <p className="t-lead">
              {rules.length === 6 ? "Sześć rzeczy" : "Zasady"}, które obowiązują {two ? "w obu punktach" : "w punkcie"}, przy każdej naprawie.
            </p>
          </div>
          <AboutRules rules={rules} />
        </div>
      </section>

      <DataSafety />

      <LineCards title={linesClaim ? "Jedna firma. Cztery linie i marka Gaming." : "Jedna firma, kilka linii PRO-KOM."} />

      <section className="t-section t-section--tight" id="sprawdz" data-rail="Sprawdź nas">
        <div className="t-container">
          <h2 className="t-h2 t-h2--sm">Nie musisz wierzyć nam na słowo</h2>
          <Spotlight className={`t-ab-proof${rating && profiles ? " has-rating" : ""}`}>
            <div className="t-ab-proof__side">
              <a href={CEIDG_URL} target="_blank" rel="noopener noreferrer" className="t-card t-ab-proof__card" data-spot="">
                <span className="t-ab-proof__ico" aria-hidden="true">
                  <AboutIconSvg icon="registry" size={22} />
                </span>
                <h3>Rejestr CEIDG</h3>
                <p>Firmę sprawdzisz po numerze NIP {company.nip}.</p>
                <span className="t-ab-doc" aria-hidden="true">
                  <span className="t-ab-doc__sheet">
                    <b />
                    <b style={{ width: "88%" }} />
                    <b style={{ width: "72%" }} />
                    <span className="t-ab-doc__nip">NIP {company.nip}</span>
                    <span className="t-ab-doc__seal">
                      <AboutIconSvg icon="check" size={22} strokeWidth={2.8} />
                    </span>
                  </span>
                </span>
                <span className="t-ab-proof__more">Otwórz CEIDG ↗</span>
              </a>
              {rating && profiles ? (
                <a href={profiles.text} target="_blank" rel="noopener noreferrer" className={`t-card t-ab-proof__card${draftCls(rating)}`} data-spot="">
                  <span className="t-ab-proof__ico" aria-hidden="true">
                    <AboutIconSvg icon="star" size={22} />
                  </span>
                  <h3>Opinie Google</h3>
                  <p>{rating.text}</p>
                  <span className="t-ab-proof__more">{two ? "Wizytówki obu punktów ↗" : "Wizytówka punktu ↗"}</span>
                </a>
              ) : null}
            </div>
            <div className="t-ab-visit">
              <div className="t-ab-visit__head">
                <h3>Przyjdź i zobacz</h3>
                <p>{two ? "Dwa punkty na Podhalu. Bez umawiania, w godzinach otwarcia." : `Punkt ${inCity(main.city)}. Bez umawiania, w godzinach otwarcia.`}</p>
                <Link href={POINTS_HREF} className="t-ab-proof__more t-ab-visit__more">
                  Dojazd i godziny →
                </Link>
              </div>
              <div className={`t-ab-visit__grid${two ? "" : " is-solo"}`}>
                {salons.map((p) => (
                  <AboutSalon key={p.key} point={p} />
                ))}
              </div>
            </div>
          </Spotlight>
        </div>
      </section>

      <AlsenBlock />

      <CtaBand
        eyebrow="Następny krok"
        title="Masz zepsuty sprzęt? Zgłoś naprawę albo napisz."
        primary={{ label: "Zgłoś naprawę", href: SUBMIT_HREF }}
        secondary={{ label: "Kontakt", href: "/kontakt" }}
      />
    </div>
  );
}
