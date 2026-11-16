import Image from "next/image";
import Link from "next/link";
import { line, servicePoints, telHref } from "@/config/prokom";
import { CtaBand } from "@/components/tech/CtaBand";
import { Faq } from "@/components/tech/Faq";
import { JsonLd } from "@/components/tech/JsonLd";
import { hubExtra } from "@/config/tresci/uslugi";
import { CardGrid, Section } from "@/components/tech/content/Blocks";
import { DeviceIntake, DeviceIntro, DeviceWarranty } from "@/components/tech/content/DeviceSections";
import { RepairSteps } from "@/components/tech/device/RepairSteps";
import { RepairLinks } from "@/components/tech/repair/RepairLinks";
import { DeviceGlyph, IconArrow, IconPath } from "@/components/tech/icons";
import { citiesTitle, hubCards } from "@/lib/tech/devices";
import { REPAIRS_HREF, SUBMIT_HREF } from "@/lib/tech/nav";
import { publishedPoints, visiblePoints } from "@/lib/tech/points";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata, type Crumb, type FaqItem } from "@/lib/tech/seo";
import { submitHref, type ArtKind } from "@/lib/tech/wizard-data";
import { HubCollage } from "@/components/tech/subhero/HubCollage";
import { StaticArt } from "@/components/tech/wizard/art/StaticArt";
import { SubHero } from "@/components/tech/subhero/SubHero";
import { heroPromises } from "@/lib/tech/subhero";

const published = publishedPoints(servicePoints);
const cities = citiesTitle(published);


/** Devices without a photo use the same illustrations as the home page device grid (DeviceGrid). */
const HUB_ART: Partial<Record<string, { kind: ArtKind; crop: [number, number, number, number] }>> = {
  watch: { kind: "watch", crop: [88, 0, 236, 480] },
  data: { kind: "data", crop: [34, 32, 430, 320] },
};
export const metadata = pageMetadata({
  title: "Naprawy — serwis telefonów i komputerów",
  description: `Serwis PRO-KOM Tech: ${cities}. Naprawa telefonów, laptopów, tabletów, komputerów, konsol, drukarek i smartwatchy. Wycena przed naprawą.`,
  path: REPAIRS_HREF,
});

const CRUMBS: Crumb[] = [
  { name: "Start", path: "/" },
  { name: "Naprawy", path: REPAIRS_HREF },
];

// FAQ answers accepted by Krystian on 15.11.2026.
const FAQ: FaqItem[] = [
  {
    q: "Ile kosztuje naprawa?",
    a: "Kwota zależy od urządzenia, usterki i części, dlatego podajemy ją po diagnozie. Zanim zaczniemy naprawę, znasz wycenę. Jeśli się nie zdecydujesz, odbierasz sprzęt.",
  },
  {
    q: "Czy muszę się umawiać?",
    a: "Nie. Możesz przyjść z urządzeniem w godzinach otwarcia punktu. Zgłoszenie online przyspiesza przyjęcie, bo dane i opis usterki mamy już w systemie.",
  },
  {
    q: "Jaką gwarancję dostanę?",
    a: "Na wykonaną usługę i na wymienione części. Szczegóły gwarancji dostajesz razem z naprawionym sprzętem.",
  },
  {
    q: "Jak sprawdzę, co się dzieje z moim sprzętem?",
    a: "Status naprawy sprawdzisz online po numerze zgłoszenia i 4 ostatnich cyfrach telefonu podanego w zgłoszeniu.",
  },
  {
    q: "Ile trwa naprawa?",
    a: "Zależy od usterki i dostępności części. Po diagnozie powiemy, ile to potrwa w Twoim przypadku.",
  },
];

const ALL_FAQ: FaqItem[] = [...FAQ, ...hubExtra.faq];

export default function RepairsHubPage() {
  return (
    <div className="t-ui t-page t-dev">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <JsonLd data={faqJsonLd(ALL_FAQ)} />

      <SubHero
        crumbs={CRUMBS}
        eyebrow={`${line.name} · naprawy`}
        title="Serwis telefonów, komputerów i elektroniki"
        accent={cities}
        lead="Telefon, laptop, konsola czy drukarka: jeden serwis na całą elektronikę w domu i w firmie. Wybierz urządzenie albo od razu zgłoś naprawę online."
        primary={{ label: "Zgłoś naprawę", href: SUBMIT_HREF }}
        trackPlace="naprawy"
        promises={heroPromises()}
        visual={<HubCollage />}
        points={visiblePoints()}
        rail="Naprawy"
        variant="hub"
      />

      <DeviceIntro paragraphs={hubExtra.intro} title="Serwis elektroniki: jeden adres na telefon, laptop i konsolę" />

      <section className="t-section t-section--alt" id="urzadzenia" data-rail="Urządzenia">
        <div className="t-container">
          <div className="t-sechead">
            <div>
              <span className="t-eyebrow">Urządzenia</span>
              <h2 className="t-h2">Co naprawiamy</h2>
            </div>
            <p className="t-lead">Każde urządzenie ma swoją stronę z listą napraw, markami i najczęstszymi pytaniami.</p>
          </div>
          <ul className="t-hub">
            {hubCards.map((c) => (
              <li key={c.href}>
                <Link href={c.href} className="t-card t-hub__card">
                  <span className="t-hub__art" aria-hidden="true">
                    {c.photo ? (
                      <Image src={c.photo.src} width={c.photo.width} height={c.photo.height} alt="" sizes="(max-width: 767px) 340px, 160px" className="t-hub__img" />
                    ) : HUB_ART[c.icon] ? (
                      <StaticArt kind={HUB_ART[c.icon]!.kind} crop={HUB_ART[c.icon]!.crop} uid={`hub${c.icon}`} className="t-hub__sart" />
                    ) : (
                      <span className="t-ico">
                        <DeviceGlyph icon={c.icon} size={24} />
                      </span>
                    )}
                  </span>
                  <span className="t-hub__txt">
                    <b className="t-h3">{c.t}</b>
                    <span>{c.s}</span>
                  </span>
                  <span className="t-hub__more">
                    Zobacz naprawy <IconArrow size={14} />
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <Link href={submitHref("other")} className="t-card t-hub__card t-hub__card--soft">
                <span className="t-hub__art" aria-hidden="true">
                  <span className="t-ico">
                    <IconPath icon="help" size={24} />
                  </span>
                </span>
                <span className="t-hub__txt">
                  <b className="t-h3">Nie ma na liście?</b>
                  <span>Zadzwoń albo opisz sprzęt w zgłoszeniu. Powiemy, czy go naprawimy.</span>
                </span>
                <span className="t-hub__more">
                  Opisz sprzęt <IconArrow size={14} />
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </section>

      <Section id="od-czego-zaczac" rail="Od czego zacząć" eyebrow="Od czego zacząć" title="Trzy sposoby na zgłoszenie naprawy">
        <CardGrid items={hubExtra.start} numbered />
      </Section>
      <RepairLinks />
      <DeviceIntake note={hubExtra.intake} points={visiblePoints()} />

      <RepairSteps title="Cztery kroki do sprawnego sprzętu" />
      <DeviceWarranty text={hubExtra.warranty} />

      <section className="t-section" id="pytania" data-rail="Pytania">
        <div className="t-container t-faqsplit">
          <div className="t-faqsplit__head">
            <span className="t-eyebrow">Pytania</span>
            <h2 className="t-h2">Zanim oddasz sprzęt</h2>
            <p className="t-lead">
              Więcej odpowiedzi znajdziesz w <Link href="/faq" className="t-inline-link" data-t-inline="">najczęstszych pytaniach</Link>.
            </p>
          </div>
          <Faq items={ALL_FAQ} />
        </div>
      </section>

      <CtaBand
        eyebrow="Następny krok"
        title="Zepsuty sprzęt? Zgłoś naprawę online albo zadzwoń."
        primary={{ label: "Zgłoś naprawę", href: SUBMIT_HREF }}
        secondary={{ label: line.phoneDisplay, href: telHref(line.phone), tel: true, track: "naprawy_cta" }}
      />
    </div>
  );
}
