import Link from "next/link";
import { line, servicePoints, telHref } from "@/config/prokom";
import { CtaBand } from "@/components/tech/CtaBand";
import { Faq } from "@/components/tech/Faq";
import { JsonLd } from "@/components/tech/JsonLd";
import { BrandLogo } from "@/components/tech/BrandLogo";
import { cardBrandLogos, logoSpellsName } from "@/components/tech/brand-logos";
import { deviceSeo, hubCards, type DevicePage as DevicePageData } from "@/lib/tech/devices";
import { REPAIRS_HREF } from "@/lib/tech/nav";
import { publishedPoints, visiblePoints } from "@/lib/tech/points";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata, type Crumb } from "@/lib/tech/seo";
import { serviceJsonLd } from "@/lib/tech/service-jsonld";
import { submitHref } from "@/lib/tech/wizard-data";
import { DeviceGlyph, IconArrow, IconPath } from "../icons";
import { DataSafety } from "../DataSafety";
import { DeviceIntake, DeviceIntro, DevicePosts, DeviceSymptoms, DeviceWarranty, HammerTeaser } from "../content/DeviceSections";
import { RepairSteps } from "./RepairSteps";
import { FaultVisual } from "../subhero/FaultVisual";
import { SubHero } from "../subhero/SubHero";
import { DATA_RECOVERY_PROMISES, HERO_SCENES, heroPromises } from "@/lib/tech/subhero";

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
  const scene = HERO_SCENES[page.category as keyof typeof HERO_SCENES];
  const kindLogos = cardBrandLogos(page.kinds.map((k) => k.n));

  return (
    <div className="t-ui t-page t-dev">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={faqJsonLd(page.faq)} />
      <JsonLd data={serviceJsonLd({ name: `${page.name} — ${line.name}`, serviceType: page.name, path: page.path, description: seo.description })} />

      <SubHero
        crumbs={crumbs}
        eyebrow={`${line.name} · ${page.short.toLocaleLowerCase("pl-PL")}`}
        title={page.name}
        accent={cities}
        lead={page.lead}
        primary={{ label: page.category === "data_recovery" ? "Zgłoś odzysk danych" : `Zgłoś naprawę ${page.genitive}`, href: submit }}
        trackPlace="urzadzenie"
        promises={heroPromises({ category: page.category })}
        visual={<FaultVisual device={scene.device} faults={scene.faults} />}
        statusCard
        points={visible}
        rail={page.short}
      />

      <DeviceIntro paragraphs={page.extra.intro} title={`${page.name}: najczęstsze usterki i jak pracujemy`} />

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

      <DeviceSymptoms extra={page.extra} name={page.name} short={page.short} category={page.category} />

      <section className="t-section" id="marki" data-rail={page.kindsEyebrow}>
        <div className="t-container">
          <div className="t-sechead">
            <div>
              <span className="t-eyebrow">{page.kindsEyebrow}</span>
              <h2 className="t-h2">{page.kindsTitle}</h2>
            </div>
            <p className="t-lead">{page.kindsLead}</p>
          </div>
          <ul className={`t-kinds t-kinds--${Math.min(page.kinds.length, 6)}`} data-t-stagger="">
            {page.kinds.map((k, i) => (
              <li key={k.n} className="t-card t-kinds__item">
                {kindLogos ? (
                  <span className="t-kinds__logo">
                    <BrandLogo brand={kindLogos[i]} hidden />
                  </span>
                ) : null}
                <span className={kindLogos && logoSpellsName(kindLogos[i], k.n) ? "t-h3 t-visually-hidden" : "t-h3"}>{k.n}</span>
                <span>{k.s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <DeviceIntake note={page.extra.intake} points={visible} />
      <RepairSteps title="Cztery kroki do sprawnego sprzętu" />
      <DeviceWarranty text={page.extra.warranty} title={page.category === "data_recovery" ? "Odzysk danych a gwarancja" : undefined} />
      <DataSafety />
      {HAMMER[page.category] ? <HammerTeaser what={HAMMER[page.category]!} /> : null}

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
            <QuickPromise category={page.category} />
          </div>
          <Faq items={page.faq} />
        </div>
      </section>

      <DevicePosts category={page.category} keywords={`${page.name} ${page.card}`} title={`Poradniki: ${page.short.toLocaleLowerCase("pl-PL")}`} />
      <MoreDevices current={page.path} />
      <CtaBand
        eyebrow="Następny krok"
        title={page.category === "data_recovery" ? "Potrzebujesz odzyskać dane? Zgłoś to online albo zadzwoń." : `Zepsuty sprzęt? Zgłoś naprawę ${page.genitive} online albo zadzwoń.`}
        primary={{ label: "Zgłoś naprawę", href: submit }}
        secondary={{ label: line.phoneDisplay, href: telHref(line.phone), tel: true, track: "urzadzenie_cta" }}
      />
    </div>
  );
}

/** Hammer Glass teaser on devices with a screen the plotter cuts foil for. */
const HAMMER: Partial<Record<string, string>> = { tablet: "do Twojego tabletu", smartwatch: "do Twojego zegarka" };

/** Confirmed promises only (SPEC §8): quote before repair, resign, warranty, status online. */
function QuickPromise({ category }: { category: string }) {
  const items =
    category === "data_recovery"
      ? DATA_RECOVERY_PROMISES
      : ["Wycena przed naprawą", "Możesz zrezygnować", "Gwarancja na usługę i części", "Status naprawy online"];
  return (
    <ul className="t-dev-promises">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

function MoreDevices({ current }: { current: string }) {
  return (
    <nav className="t-section t-section--tight t-dev-more" aria-label="Inne naprawy" id="inne-urzadzenia" data-rail="Inne">
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
