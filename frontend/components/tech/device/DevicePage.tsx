import Image from "next/image";
import Link from "next/link";
import { line, servicePoints, telHref } from "@/config/prokom";
import { Breadcrumbs } from "@/components/tech/Breadcrumbs";
import { CtaBand } from "@/components/tech/CtaBand";
import { Faq } from "@/components/tech/Faq";
import { JsonLd } from "@/components/tech/JsonLd";
import { deviceSeo, hubCards, type DevicePage as DevicePageData } from "@/lib/tech/devices";
import { POINTS_HREF, REPAIRS_HREF } from "@/lib/tech/nav";
import { publishedPoints, visiblePoints } from "@/lib/tech/points";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata, type Crumb } from "@/lib/tech/seo";
import { serviceJsonLd } from "@/lib/tech/service-jsonld";
import { submitHref } from "@/lib/tech/wizard-data";
import { DeviceGlyph, IconArrow, IconPath } from "../icons";
import { CourierTeaser } from "./CourierTeaser";
import { RepairSteps } from "./RepairSteps";

export function deviceMetadata(page: DevicePageData) {
  return pageMetadata({ ...deviceSeo(page, publishedPoints(servicePoints)), path: page.path });
}

/**
 * Device page template (SPEC §6: hero, repairs, brands, 4 steps, FAQ, CTA).
 * Layout follows design T.Usluga (#serwis-telefonow-zakopane) with the device photo
 * instead of the point map. Server Component.
 */
export function DevicePage({ page }: { page: DevicePageData }) {
  const published = publishedPoints(servicePoints);
  const visible = visiblePoints();
  const cities = published.map((p) => p.city).join(" i ");
  const crumbs: Crumb[] = [
    { name: "Start", path: "/" },
    { name: "Naprawy", path: REPAIRS_HREF },
    { name: page.name, path: page.path },
  ];
  const seo = deviceSeo(page, published);
  const submit = submitHref(page.category);

  return (
    <div className="t-ui t-page t-dev">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={faqJsonLd(page.faq)} />
      <JsonLd data={serviceJsonLd({ name: `${page.name} — ${line.name}`, serviceType: page.name, path: page.path, description: seo.description })} />

      <section className="t-section--hero" id="start" data-rail={page.short}>
        <div className="t-container">
          <div className="t-stage t-dev-hero">
            <div className="t-dev-hero__text">
              <Breadcrumbs items={crumbs} separator="/" />
              <h1 className="t-dev-hero__h1">
                {page.name}
                <span>{cities}</span>
              </h1>
              <p className="t-dev-hero__lead">{page.lead}</p>
              <div className="t-btnrow">
                <Link href={submit} className="t-pbtn t-pbtn--stage" data-track="zgloszenie_start" data-track-zrodlo="przycisk">
                  Zgłoś naprawę {page.genitive}
                </Link>
                <a href={telHref(line.phone)} className="t-pbtn t-pbtn--ghost-dark" data-track="telefon_klik" data-track-miejsce="urzadzenie">
                  {line.phoneDisplay}
                </a>
              </div>
              <div className="t-dev-hero__points">
                <span>{visible.length > 1 ? "Oddasz w punktach:" : "Oddasz w punkcie:"}</span>
                <div>
                  {visible.map((p) => (
                    <Link key={p.key} href={POINTS_HREF} className={`t-dev-tw${p.draft ? " t-draft" : ""}`}>
                      {p.city}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div className="t-dev-hero__art" aria-hidden={page.photo ? undefined : true}>
              <span className="t-dev-hero__glow" />
              {page.photo ? (
                <Image
                  src={page.photo.src}
                  width={page.photo.width}
                  height={page.photo.height}
                  alt={page.photo.alt}
                  priority
                  sizes="(min-width: 1180px) 440px, (min-width: 768px) 40vw, 70vw"
                  className="t-dev-hero__img"
                />
              ) : (
                <span className="t-dev-hero__glyph">
                  <DeviceGlyph icon={page.icon} size={140} strokeWidth={1.4} />
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="t-section t-section--alt" id="naprawy" data-rail="Naprawy">
        <div className="t-container t-dev-repairs">
          <div className="t-dev-repairs__head">
            <span className="t-eyebrow">{page.short}</span>
            <h2 className="t-h2">{page.repairsTitle}</h2>
            <p className="t-lead">{page.repairsLead}</p>
          </div>
          <div className="t-card t-rtable">
            <div className="t-rtable__head" aria-hidden="true">
              <span />
              <span>Naprawa</span>
              <span>Czas</span>
              <span />
            </div>
            <ul>
              {page.repairs.map((r) => (
                <li key={r.t} className="t-rtable__row">
                  <span className="t-ico t-ico--sm" aria-hidden="true">
                    <IconPath icon={r.icon} size={22} />
                  </span>
                  <span className="t-rtable__txt">
                    <b className="t-h3 t-h3--sm">{r.t}</b>
                    <span>{r.s}</span>
                  </span>
                  <span className={`t-rtable__time${r.urgent ? " is-urgent" : ""}`}>{r.urgent ? "pilne" : "po diagnozie"}</span>
                  <Link
                    href={submitHref(page.category, r.fault ?? undefined)}
                    className="t-pbtn t-pbtn--outline t-pbtn--m t-rtable__go"
                    aria-label={`Zgłoś: ${r.t}`}
                  >
                    Zgłoś
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="t-section" id="marki" data-rail={page.kindsEyebrow}>
        <div className="t-container">
          <div className="t-sechead">
            <div>
              <span className="t-eyebrow">{page.kindsEyebrow}</span>
              <h2 className="t-h2">{page.kindsTitle}</h2>
            </div>
            <p className="t-lead">{page.kindsLead}</p>
          </div>
          <ul className={`t-kinds t-kinds--${Math.min(page.kinds.length, 6)}`}>
            {page.kinds.map((k) => (
              <li key={k.n} className="t-card t-kinds__item">
                <span className="t-h3">{k.n}</span>
                <span>{k.s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <RepairSteps title="Cztery kroki do sprawnego sprzętu" />

      <section className="t-section" id="pytania" data-rail="Pytania">
        <div className="t-container t-faqsplit">
          <div className="t-faqsplit__head">
            <span className="t-eyebrow">Pytania</span>
            <h2 className="t-h2">{page.short}: najczęstsze pytania</h2>
            <p className="t-lead">Nie ma tu Twojego pytania? Zadzwoń albo opisz problem w zgłoszeniu.</p>
            {page.note ? (
              <div className="t-dev-note">
                <b>{page.note.title}</b>
                <p>{page.note.text}</p>
              </div>
            ) : null}
            <QuickPromise />
          </div>
          <Faq items={page.faq} />
        </div>
        <div className="t-container">
          <CourierTeaser className="t-dev-courier" />
        </div>
      </section>

      <MoreDevices current={page.path} />
      <CtaBand
        eyebrow="Następny krok"
        title={`Zepsuty sprzęt? Zgłoś naprawę ${page.genitive} online albo zadzwoń.`}
        primary={{ label: "Zgłoś naprawę", href: submit }}
        secondary={{ label: line.phoneDisplay, href: telHref(line.phone), tel: true, track: "urzadzenie_cta" }}
      />
    </div>
  );
}

/** Confirmed promises only (SPEC §8): quote before repair, resign, warranty, status online. */
function QuickPromise() {
  return (
    <ul className="t-dev-promises">
      <li>Wycena przed naprawą</li>
      <li>Możesz zrezygnować</li>
      <li>Gwarancja na usługę i części</li>
      <li>Status naprawy online</li>
    </ul>
  );
}

function MoreDevices({ current }: { current: string }) {
  return (
    <nav className="t-section t-section--tight t-dev-more" aria-label="Inne naprawy">
      <div className="t-container">
        <h2 className="t-h2 t-h2--sm">Inne naprawy</h2>
        <MoreDevicesList current={current} />
      </div>
    </nav>
  );
}

function MoreDevicesList({ current }: { current: string }) {
  return (
    <ul className="t-dev-more__list">
      {hubCards
        .filter((c) => c.href !== current)
        .map((c) => (
          <li key={c.href}>
            <Link href={c.href} className="t-chiplink">
              <DeviceGlyph icon={c.icon} size={18} />
              {c.t}
              <IconArrow size={14} />
            </Link>
          </li>
        ))}
    </ul>
  );
}
