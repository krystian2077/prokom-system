import Link from "next/link";
import { line, servicePoints, telHref } from "@/config/prokom";
import { CtaBand } from "@/components/tech/CtaBand";
import { Faq } from "@/components/tech/Faq";
import { JsonLd } from "@/components/tech/JsonLd";
import { PhoneBrandsSection, PhoneRepairsSection, PhoneStepsSection } from "@/components/tech/PhoneSections";
import { RepairLinks } from "@/components/tech/repair/RepairLinks";
import { publishedLocalPages, visibleLocalPages } from "@/lib/tech/local-pages";
import { SUBMIT_HREF } from "@/lib/tech/nav";
import { inCity, joinCities } from "@/lib/tech/point-format";
import { publishedPoints, visiblePoints } from "@/lib/tech/points";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata, serviceJsonLd, type Crumb, type FaqItem } from "@/lib/tech/seo";
import { towns } from "@/lib/tech/towns";
import { mobileDeviceExtra } from "@/config/tresci/urzadzenia-mobilne";
import { DataSafety } from "@/components/tech/DataSafety";
import { DeviceIntake, DeviceIntro, DevicePosts, DeviceSymptoms, DeviceWarranty, HammerTeaser } from "@/components/tech/content/DeviceSections";
import { FaultVisual } from "@/components/tech/subhero/FaultVisual";
import { SubHero } from "@/components/tech/subhero/SubHero";
import { HERO_SCENES, heroPromises } from "@/lib/tech/subhero";
import { submitHref } from "@/lib/tech/wizard-data";

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

// FAQ answers accepted by Krystian on 15.11.2026.
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

/** Extended texts (2026-11, config/tresci/urzadzenia-mobilne.ts) — to be accepted by Krystian. */
const EXTRA = mobileDeviceExtra["serwis-telefonow"];
const ALL_FAQ: FaqItem[] = [...FAQ, ...EXTRA.faq];

export default function PhoneServicePage() {
  const points = visiblePoints();
  const locals = visibleLocalPages();
  const pub = new Set(publishedLocalPages().map((p) => p.slug));
  return (
    <div className="t-ui t-page">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <JsonLd data={faqJsonLd(ALL_FAQ)} />
      <JsonLd
        data={serviceJsonLd({
          name: "Serwis telefonów",
          serviceType: "Naprawa telefonów",
          path: "/serwis-telefonow",
          providers: published.map((p) => p.key),
          areaServed: towns.filter((t) => published.some((p) => p.key === t.point)).map((t) => t.name),
        })}
      />

      <SubHero
        crumbs={CRUMBS}
        eyebrow={`${line.name} · telefony`}
        title="Serwis telefonów"
        accent={where}
        lead="Wymieniamy wyświetlacze, baterie i gniazda ładowania, pomagamy po zalaniu. Najpierw diagnoza i wycena, naprawa dopiero po Twojej zgodzie."
        primary={{ label: "Zgłoś naprawę telefonu", href: submitHref("phone") }}
        trackPlace="serwis_telefonow"
        promises={heroPromises({ phoneScreen: true })}
        visual={<FaultVisual device={HERO_SCENES.phone.device} faults={HERO_SCENES.phone.faults} />}
        statusCard
        points={points}
        rail="Telefony"
      />
      {locals.length ? (
        <nav className="t-section t-section--tight t-phtowns" aria-label="Serwis telefonów w Twojej okolicy" id="okolica" data-rail="Okolica">
          <div className="t-container t-phtowns__in">
            <span>Serwis telefonów w Twojej okolicy:</span>
            <div className="t-townchips">
              {locals.map((o) => (
                <Link key={o.slug} href={`/${o.slug}`} className={`t-townchip${pub.has(o.slug) ? "" : " t-draft"}`}>
                  {o.city}
                </Link>
              ))}
              <Link href="/obslugiwane-miejscowosci" className="t-townchip">
                Wszystkie miejscowości →
              </Link>
            </div>
          </div>
        </nav>
      ) : null}

      <DeviceIntro paragraphs={EXTRA.intro} title="Serwis telefonów: najczęstsze usterki i jak pracujemy" />
      <PhoneRepairsSection />
      <DeviceSymptoms extra={EXTRA} name="Serwis telefonów" short="Telefony" category="phone" />
      <RepairLinks device="phone" title="Konkretne naprawy telefonów" />
      <PhoneBrandsSection title="Jakie telefony naprawiamy" />
      <DeviceIntake note={EXTRA.intake} points={points} what="telefon" />
      <PhoneStepsSection eyebrow="Jak to działa" cityName={null} />
      <DeviceWarranty text={EXTRA.warranty} />
      <DataSafety />
      <HammerTeaser what="do Twojego telefonu" />

      <section className="t-section" id="pytania" data-rail="Pytania">
        <div className="t-container t-faqsplit">
          <div className="t-faqsplit__head">
            <span className="t-eyebrow">Pytania</span>
            <h2 className="t-h2">Najczęstsze pytania o naprawę telefonu</h2>
            <p className="t-lead">Nie ma tu Twojego pytania? Zadzwoń albo napisz — odpowiemy w godzinach pracy.</p>
          </div>
          <Faq items={ALL_FAQ} />
        </div>
      </section>

      <DevicePosts category="phone" keywords="telefon ekran bateria ładowanie zalanie" title="Poradniki: telefony" />
      <CtaBand
        eyebrow="Zgłoszenie naprawy"
        title="Pęknięty ekran albo słaba bateria? Zgłoś naprawę online."
        primary={{ label: "Zgłoś naprawę", href: `${SUBMIT_HREF}?category=phone` }}
        secondary={{ label: line.phoneDisplay, href: telHref(line.phone), tel: true, track: "serwis_telefonow_cta" }}
      />
    </div>
  );
}
