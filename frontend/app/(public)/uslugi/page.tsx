import Image from "next/image";
import Link from "next/link";
import { line, servicePoints, telHref } from "@/config/prokom";
import { Breadcrumbs } from "@/components/tech/Breadcrumbs";
import { CtaBand } from "@/components/tech/CtaBand";
import { Faq } from "@/components/tech/Faq";
import { JsonLd } from "@/components/tech/JsonLd";
import { CourierTeaser } from "@/components/tech/device/CourierTeaser";
import { RepairSteps } from "@/components/tech/device/RepairSteps";
import { DeviceGlyph, IconArrow, IconPath } from "@/components/tech/icons";
import { citiesTitle, hubCards } from "@/lib/tech/devices";
import { REPAIRS_HREF, SUBMIT_HREF, TRACK_HREF } from "@/lib/tech/nav";
import { publishedPoints } from "@/lib/tech/points";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata, type Crumb, type FaqItem } from "@/lib/tech/seo";
import { submitHref } from "@/lib/tech/wizard-data";

const published = publishedPoints(servicePoints);
const cities = citiesTitle(published);

export const metadata = pageMetadata({
  title: "Naprawy — serwis telefonów i komputerów",
  description: `Serwis PRO-KOM Tech: ${cities}. Naprawa telefonów, laptopów, tabletów, komputerów, konsol, drukarek i smartwatchy. Wycena przed naprawą.`,
  path: REPAIRS_HREF,
});

const CRUMBS: Crumb[] = [
  { name: "Start", path: "/" },
  { name: "Naprawy", path: REPAIRS_HREF },
];

// TODO(krystian): FAQ answers to accept (TD5 PR 1).
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

export default function RepairsHubPage() {
  return (
    <div className="t-ui t-page t-dev">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <JsonLd data={faqJsonLd(FAQ)} />

      <section className="t-section--hero" id="start" data-rail="Naprawy">
        <div className="t-container">
          <div className="t-stage t-dev-hero t-dev-hero--hub">
            <div className="t-dev-hero__text">
              <Breadcrumbs items={CRUMBS} separator="/" />
              <h1 className="t-dev-hero__h1">
                Naprawy
                <span>Serwis telefonów, komputerów i elektroniki · {cities}</span>
              </h1>
              <p className="t-dev-hero__lead">
                Jeden serwis na telefon, laptop i resztę elektroniki w domu albo firmie. Wybierz urządzenie, żeby zobaczyć, co naprawiamy — albo od razu zgłoś
                naprawę online.
              </p>
              <div className="t-btnrow">
                <Link href={SUBMIT_HREF} className="t-pbtn t-pbtn--stage" data-track="zgloszenie_start" data-track-zrodlo="przycisk">
                  Zgłoś naprawę
                </Link>
                <a href={telHref(line.phone)} className="t-pbtn t-pbtn--ghost-dark" data-track="telefon_klik" data-track-miejsce="naprawy">
                  {line.phoneDisplay}
                </a>
              </div>
              <ul className="t-dev-promises t-dev-promises--stage">
                <li>Wycena przed naprawą</li>
                <li>Możesz zrezygnować</li>
                <li>Gwarancja na usługę i części</li>
                <li>
                  <Link href={TRACK_HREF} data-t-inline="">
                    Status naprawy online
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

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
                      <Image src={c.photo.src} width={c.photo.width} height={c.photo.height} alt="" sizes="160px" className="t-hub__img" />
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
          <CourierTeaser className="t-dev-courier" />
        </div>
      </section>

      <RepairSteps title="Cztery kroki do sprawnego sprzętu" />

      <section className="t-section" id="pytania" data-rail="Pytania">
        <div className="t-container t-faqsplit">
          <div className="t-faqsplit__head">
            <span className="t-eyebrow">Pytania</span>
            <h2 className="t-h2">Zanim oddasz sprzęt</h2>
            <p className="t-lead">
              Więcej odpowiedzi znajdziesz w <Link href="/faq" className="t-inline-link" data-t-inline="">najczęstszych pytaniach</Link>.
            </p>
          </div>
          <Faq items={FAQ} />
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
