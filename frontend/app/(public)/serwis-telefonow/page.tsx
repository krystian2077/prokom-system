import Link from "next/link";
import { line, servicePoints, telHref } from "@/config/prokom";
import { Breadcrumbs } from "@/components/tech/Breadcrumbs";
import { CtaBand } from "@/components/tech/CtaBand";
import { Faq } from "@/components/tech/Faq";
import { JsonLd } from "@/components/tech/JsonLd";
import { PhoneBrandsSection, PhoneRepairsSection, PhoneStepsSection } from "@/components/tech/PhoneSections";
import { PointCard } from "@/components/tech/PointCard";
import { RepairLinks } from "@/components/tech/repair/RepairLinks";
import { publishedLocalPages, visibleLocalPages } from "@/lib/tech/local-pages";
import { SUBMIT_HREF } from "@/lib/tech/nav";
import { inCity, joinCities } from "@/lib/tech/point-format";
import { publishedPoints, visiblePoints } from "@/lib/tech/points";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata, serviceJsonLd, type Crumb, type FaqItem } from "@/lib/tech/seo";
import { towns } from "@/lib/tech/towns";

const published = publishedPoints(servicePoints);
const two = published.length > 1;
const where = two ? joinCities(published) : published[0].city;

export const metadata = pageMetadata({
  title: `Serwis telefonów — ${where}`,
  description: `Serwis telefonów ${two ? "w Rabce-Zdroju i Zakopanem" : inCity(published[0].city)}: wymiana ekranu, baterii i gniazda ładowania, pomoc po zalaniu. Wycena przed naprawą i gwarancja.`,
  path: "/serwis-telefonow",
});

const CRUMBS: Crumb[] = [
  { name: "Start", path: "/" },
  { name: "Naprawy", path: "/uslugi" },
  { name: "Serwis telefonów", path: "/serwis-telefonow" },
];

// TODO(krystian): accept answers with the service (TD4 PR 2 description).
const FAQ: FaqItem[] = [
  {
    q: "Ile kosztuje naprawa telefonu?",
    a: "Cena zależy od modelu i części. Najpierw robimy diagnozę, potem podajemy kwotę. Naprawiamy dopiero wtedy, gdy się zgodzisz, a jeśli nie — odbierasz telefon bez konsekwencji.",
  },
  {
    q: "Jak długo trwa naprawa?",
    a: "To zależy od usterki i dostępności części do Twojego modelu. Termin podamy po diagnozie, a postęp naprawy sprawdzisz online po numerze zgłoszenia i 4 ostatnich cyfrach telefonu.",
  },
  {
    q: "Czy dostanę gwarancję?",
    a: "Tak. Gwarancja obejmuje wykonaną usługę i wymienione części.",
  },
  {
    q: "Co z danymi w telefonie?",
    a: "Przed oddaniem telefonu zrób kopię zapasową. Kod blokady podajesz przy przyjęciu, żebyśmy mogli sprawdzić telefon po naprawie. Możesz też oddać go bez kodu, ale wtedy test po naprawie jest ograniczony.",
  },
  {
    q: "Czy mogę wysłać telefon kurierem?",
    a: "Tak. Zgłoś naprawę online i wybierz wysyłkę kurierem — adres i dalsze kroki dostaniesz w potwierdzeniu zgłoszenia.",
  },
];

export default function PhoneServicePage() {
  const points = visiblePoints();
  const locals = visibleLocalPages();
  const pub = new Set(publishedLocalPages().map((p) => p.slug));
  return (
    <div className="t-ui t-page">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <JsonLd data={faqJsonLd(FAQ)} />
      <JsonLd
        data={serviceJsonLd({
          name: "Serwis telefonów",
          serviceType: "Naprawa telefonów",
          path: "/serwis-telefonow",
          providers: published.map((p) => p.key),
          areaServed: towns.filter((t) => published.some((p) => p.key === t.point)).map((t) => t.name),
        })}
      />

      <section className="t-section--hero" id="serwis" data-rail="Serwis telefonów">
        <div className="t-container">
          <div className="t-stage t-loc-hero t-loc-hero--hub">
            <div className="t-loc-hero__text">
              <Breadcrumbs items={CRUMBS} separator="/" />
              <h1 className="t-loc-hero__h1">
                Serwis telefonów
                <span>{where}</span>
              </h1>
              <p className="t-lead t-lead--stage">
                Wymieniamy wyświetlacze, baterie i gniazda ładowania, pomagamy po zalaniu. Diagnoza i wycena przed naprawą, gwarancja na usługę i części, status naprawy online.
              </p>
              <div className="t-btnrow">
                <Link href={`${SUBMIT_HREF}?category=phone`} className="t-pbtn t-pbtn--stage" data-track="zgloszenie_start" data-track-zrodlo="przycisk">
                  Zgłoś naprawę telefonu
                </Link>
                <a href={telHref(line.phone)} className="t-pbtn t-pbtn--ghost-dark" data-track="telefon_klik" data-track-miejsce="serwis_telefonow">
                  {line.phoneDisplay}
                </a>
              </div>
              {locals.length ? (
                <div className="t-loc-hero__towns">
                  <span>Serwis telefonów w Twojej okolicy:</span>
                  <div className="t-townchips">
                    {locals.map((o) => (
                      <Link key={o.slug} href={`/${o.slug}`} className={`t-townchip t-townchip--stage${pub.has(o.slug) ? "" : " t-draft"}`}>
                        {o.city}
                      </Link>
                    ))}
                    <Link href="/obslugiwane-miejscowosci" className="t-townchip t-townchip--stage">
                      Wszystkie miejscowości →
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="t-loc-hero__card">
              {points.map((p) => (
                <PointCard key={p.key} point={p} layout="stack" as="h2" trackFrom="serwis_telefonow" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <PhoneRepairsSection />
      <PhoneBrandsSection title="Jakie telefony naprawiamy" />
      <PhoneStepsSection eyebrow="Jak to działa" cityName={null} />

      <section className="t-section" id="pytania" data-rail="Pytania">
        <div className="t-container t-faqsplit">
          <div className="t-faqsplit__head">
            <span className="t-eyebrow">Pytania</span>
            <h2 className="t-h2">Najczęstsze pytania o naprawę telefonu</h2>
            <p className="t-lead">Nie ma tu Twojego pytania? Zadzwoń albo napisz — odpowiemy w godzinach pracy.</p>
          </div>
          <Faq items={FAQ} />
        </div>
      </section>

      <RepairLinks device="phone" title="Konkretne naprawy telefonów" />
      <CtaBand
        eyebrow="Zgłoszenie naprawy"
        title="Pęknięty ekran albo słaba bateria? Zgłoś naprawę online."
        primary={{ label: "Zgłoś naprawę", href: `${SUBMIT_HREF}?category=phone` }}
        secondary={{ label: line.phoneDisplay, href: telHref(line.phone), tel: true, track: "serwis_telefonow_cta" }}
      />
    </div>
  );
}
