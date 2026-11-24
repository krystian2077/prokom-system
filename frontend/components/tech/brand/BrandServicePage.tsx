import Link from "next/link";
import { line, servicePoints, telHref } from "@/config/prokom";
import type { BrandPage } from "@/config/serwis-marek";
import { claim } from "@/lib/tech/claims";
import { courierPageHref, courierPoints } from "@/lib/tech/courier";
import { REPAIRS_HREF } from "@/lib/tech/nav";
import { inCity, joinCities } from "@/lib/tech/point-format";
import { publishedPoints, visiblePoints } from "@/lib/tech/points";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata, type Crumb } from "@/lib/tech/seo";
import { serviceJsonLd } from "@/lib/tech/service-jsonld";
import { brandRepairCards, brandSeo, brandSubmitHref, groupModels, modelHref } from "@/lib/tech/serwis-marek";
import { HERO_SCENES, heroPromises } from "@/lib/tech/subhero";
import { CtaBand } from "../CtaBand";
import { DataSafety } from "../DataSafety";
import { Faq } from "../Faq";
import { JsonLd } from "../JsonLd";
import { DeviceIntro } from "../content/DeviceSections";
import { FaultGlyph, faultFamily } from "../content/FaultGlyph";
import { Section } from "../content/Blocks";
import { SalonCards } from "../content/SalonCards";
import { RepairSteps } from "../device/RepairSteps";
import { DeviceGlyph, IconArrow, IconCheck, IconPath } from "../icons";
import { SubHero } from "../subhero/SubHero";
import { BrandArt } from "./BrandArt";

export function brandMetadata(page: BrandPage) {
  return pageMetadata({ ...brandSeo(page, publishedPoints(servicePoints)), path: page.path });
}

/**
 * Brand service page (/serwis-apple, /serwis-samsung — round 18.11, T-R2c): hero, "Wybierz
 * model", "Najczęstsze naprawy", "Części i gwarancja", "Jak oddać sprzęt", steps, FAQ, CTA.
 * Same building blocks as device pages (DevicePage). Server Component.
 * Links to the brand salon (/apple, /samsung — catalogue from T-R2b) under "Wybierz model" (plan §4).
 * Form links carry `category` + `marka` (+ `model` from a chip) — KONTRAKT §1.4.
 */
export function BrandServicePage({ page }: { page: BrandPage }) {
  const published = publishedPoints(servicePoints);
  const visible = visiblePoints();
  const cities = joinCities(published);
  const crumbs: Crumb[] = [
    { name: "Start", path: "/" },
    { name: "Naprawy", path: REPAIRS_HREF },
    { name: page.short, path: page.path },
  ];
  const seo = brandSeo(page, published);
  const submit = brandSubmitHref(page);

  return (
    <div className="t-ui t-page t-dev t-brand">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={faqJsonLd(page.faq)} />
      <JsonLd data={serviceJsonLd({ name: `${page.h1} — ${line.name}`, serviceType: page.short, path: page.path, description: seo.description })} />

      <SubHero
        crumbs={crumbs}
        eyebrow={`${line.name} · sprzęt ${page.brand}`}
        title={page.h1}
        accent={cities}
        lead={page.lead}
        primary={{ label: "Zgłoś naprawę", href: submit }}
        trackPlace={`marka_${page.key}`}
        promises={heroPromises({ category: page.category })}
        visual={<BrandArt brand={page.key} />}
        statusCard
        points={visible}
        rail={page.brand}
      />

      <DeviceIntro paragraphs={page.intro} title={`${page.short}: jak pracujemy`} />
      <BrandModels page={page} />
      <BrandRepairs page={page} />
      <BrandParts page={page} />
      <BrandIntake brand={page.brand} />
      <RepairSteps title="Cztery kroki do sprawnego sprzętu" />
      <DataSafety />

      <section className="t-section" id="pytania" data-rail="Pytania">
        <div className="t-container t-faqsplit">
          <div className="t-faqsplit__head">
            <span className="t-eyebrow">Pytania</span>
            <h2 className="t-h2">{page.short}: najczęstsze pytania</h2>
            <p className="t-lead">Nie ma tu Twojego pytania? Zadzwoń albo opisz problem w zgłoszeniu.</p>
          </div>
          <Faq items={page.faq} />
        </div>
      </section>

      <CtaBand
        eyebrow="Następny krok"
        title={`Zepsuty sprzęt ${page.brand}? Zgłoś naprawę online albo zadzwoń.`}
        primary={{ label: "Zgłoś naprawę", href: submit }}
        secondary={{ label: line.phoneDisplay, href: telHref(line.phone), tel: true, track: `marka_${page.key}_cta` }}
      />
    </div>
  );
}

/** "Wybierz model": one card per family; a chip opens the form with the model in the description. */
function BrandModels({ page }: { page: BrandPage }) {
  return (
    <Section
      id="modele"
      rail="Modele"
      eyebrow="Wybierz model"
      title={`Jaki masz sprzęt ${page.brand}?`}
      lead="Kliknij swój model — formularz zgłoszenia otworzy się z wpisaną marką i modelem. Wystarczy opisać, co się stało."
      alt
    >
      <ul className={`t-bmodels t-bmodels--${page.groups.length}`} data-t-stagger="">
        {page.groups.map((g) => {
          const { current, older } = groupModels(g);
          return (
            <li key={g.key} className="t-card t-bmodel">
              <div className="t-bmodel__head">
                <span className="t-ico" aria-hidden="true">
                  <DeviceGlyph icon={g.icon} size={24} />
                </span>
                <div>
                  <h3 className="t-h3 t-bmodel__t">{g.title}</h3>
                  <p className="t-bmodel__sub">{g.sub}</p>
                </div>
              </div>
              <ModelChips models={current} category={g.category} brand={page.brand} />
              {older.length ? (
                <details className="t-bmodel__older">
                  <summary>
                    Starsze modele <span>({older.length})</span>
                  </summary>
                  <ModelChips models={older} category={g.category} brand={page.brand} />
                </details>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="t-bmodels__none">
        Nie widzisz swojego modelu?{" "}
        <Link href={brandSubmitHref(page)}>
          Zgłoś naprawę
        </Link>{" "}
        i wpisz model w formularzu — przyjmujemy też inne modele {page.brand}.
      </p>
      <p className="t-bmodels__salon">
        Szukasz nowego sprzętu?{" "}
        <Link href={`/${page.key}`}>
          Salon {page.brand} <IconArrow size={14} />
        </Link>{" "}
        — modele, kolory i pamięć, zapytanie o cenę i dostępność.
      </p>
    </Section>
  );
}

function ModelChips({ models, category, brand }: { models: string[]; category: BrandPage["category"]; brand: string }) {
  return (
    <ul className="t-bmodel__chips">
      {models.map((m) => (
        <li key={m}>
          <Link href={modelHref(category, brand, m)} className="t-bchip" aria-label={`Zgłoś naprawę: ${m}`} data-track="zgloszenie_start" data-track-zrodlo="model_marki">
            {m}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** "Najczęstsze naprawy": cards from config/naprawy.ts (repair page only when published && verified). */
function BrandRepairs({ page }: { page: BrandPage }) {
  const cards = brandRepairCards(page);
  return (
    <Section id="naprawy" rail="Naprawy" eyebrow="Najczęstsze naprawy" title={`Co najczęściej naprawiamy w sprzęcie ${page.brand}`} lead="Każda naprawa zaczyna się od diagnozy. Cenę znasz przed naprawą.">
      <ul className={`t-cb-grid t-cb-grid--3 t-brepairs`} data-t-stagger="">
        {cards.map((c) => {
          const scene = c.device === "other" ? null : HERO_SCENES[c.device as keyof typeof HERO_SCENES];
          return (
            <li key={c.key}>
              <Link href={c.href} className="t-card t-brepair">
                <span className="t-symptoms__ico" aria-hidden="true">
                  <FaultGlyph family={scene ? faultFamily(scene.device, c.usterka) : "E14"} />
                </span>
                <b className="t-brepair__t">{c.t}</b>
                <span className="t-brepair__s">{c.s}</span>
                <span className="t-brepair__go">
                  {c.live ? "Zobacz, jak naprawiamy" : "Zgłoś naprawę"} <IconArrow size={14} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/**
 * "Części i gwarancja": confirmed promises (SPEC §8) + brand notes.
 * TODO(krystian): parts policy (original / quality replacement / customer's choice) — boss's
 * decision. Until then the sentence comes from claims.ruleParts (unconfirmed → hidden in
 * production, framed on staging).
 */
function BrandParts({ page }: { page: BrandPage }) {
  const diagnosis = claim("freeDiagnosis");
  const parts = claim("ruleParts");
  const promises: { t: string; s: string; draft?: boolean }[] = [
    { t: "Diagnoza", s: diagnosis ? `${diagnosis.text} Sprawdzamy, co jest uszkodzone, zanim cokolwiek wymienimy.` : "Sprawdzamy, co jest uszkodzone, zanim cokolwiek wymienimy.", draft: diagnosis?.draft },
    { t: "Wycena przed naprawą", s: "Kwotę znasz przed naprawą. Możesz się zgodzić albo zrezygnować." },
    { t: "Gwarancja na usługę i części", s: "Na wykonaną naprawę i wymienione części dostajesz gwarancję." },
    ...(parts ? [{ t: "Jakie części", s: parts.text, draft: parts.draft }] : []),
  ];
  return (
    <Section id="czesci" rail="Części" eyebrow="Części i gwarancja" title="Uczciwie o częściach i gwarancji" lead={`Przed naprawą mówimy, jakiej części użyjemy w Twoim sprzęcie ${page.brand}.`} alt>
      <div className="t-cb-two t-bparts">
        <ul className="t-card t-cb-box t-bparts__list">
          {promises.map((p) => (
            <li key={p.t} className={p.draft ? "t-draft" : undefined}>
              <span className="t-bparts__ok" aria-hidden="true">
                <IconCheck size={14} />
              </span>
              <span>
                <b>{p.t}</b>
                {p.s}
              </span>
            </li>
          ))}
        </ul>
        <ul className="t-cb-stack t-bparts__notes">
          {page.partsNotes.map((n) => (
            <li key={n.t} className="t-card t-cb-card">
              <h3 className="t-h3 t-cb-card__t">{n.t}</h3>
              <p>{n.s}</p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/** "Jak oddać sprzęt": salons (live status, phone of the point) + courier — parcels only to the points in courierService. */
function BrandIntake({ brand }: { brand: string }) {
  const visible = visiblePoints();
  const parcel = courierPoints();
  const courier = courierPageHref();
  const lead =
    courier && parcel.length
      ? `Przyjdź do salonu w godzinach otwarcia — bez umawiania. Kurierem wysyłasz sprzęt tylko na adres salonu ${parcel.map((p) => inCity(p.city)).join(" i ")}.`
      : "Przyjdź do salonu w godzinach otwarcia — bez umawiania.";
  return (
    <Section id="jak-oddac" rail="Jak oddać" eyebrow="Przyjęcie" title={`Jak oddać sprzęt ${brand} do serwisu`} lead={lead}>
      <SalonCards points={visible} trackFrom="marka" />
      <div className="t-intake__note">
        <span className="t-intake__noteico" aria-hidden="true">
          <IconPath icon="list" size={18} />
        </span>
        <div>
          <b>Zanim oddasz sprzęt</b>
          <p>Zrób kopię zapasową, przygotuj kod odblokowania i weź ładowarkę do laptopa lub zegarka. Etui i szkło ochronne zdejmij — pod nimi widać uszkodzenia obudowy.</p>
        </div>
      </div>
    </Section>
  );
}
