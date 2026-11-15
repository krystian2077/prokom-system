import Link from "next/link";
import { line } from "@/config/prokom";
import type { RepairPageData } from "@/config/naprawy";
import { CtaBand } from "@/components/tech/CtaBand";
import { DataSafety } from "@/components/tech/DataSafety";
import { Faq } from "@/components/tech/Faq";
import { JsonLd } from "@/components/tech/JsonLd";
import { PrepChecklist } from "@/components/tech/PrepChecklist";
import { IconArrow } from "@/components/tech/icons";
import { courierPageHref } from "@/lib/tech/courier";
import { devicePages } from "@/lib/tech/devices";
import { isLive, repairBySlug, repairPath } from "@/lib/tech/naprawy";
import { PREP_GUIDE_HREF, REPAIRS_HREF } from "@/lib/tech/nav";
import { blogCategoryHref, relatedPosts } from "@/lib/tech/page-links";
import { visiblePoints } from "@/lib/tech/points";
import { breadcrumbJsonLd, faqJsonLd, type Crumb } from "@/lib/tech/seo";
import { serviceJsonLd } from "@/lib/tech/service-jsonld";
import { HERO_SCENES, heroPromises } from "@/lib/tech/subhero";
import { submitHref } from "@/lib/tech/wizard-data";
import { CardGrid, CheckList, LinkTiles, Prose, Section, Timeline } from "../content/Blocks";
import { FaultGlyph, faultFamily } from "../content/FaultGlyph";
import { SalonCards } from "../content/SalonCards";
import { FaultVisual } from "../subhero/FaultVisual";
import { SubHero } from "../subhero/SubHero";

/** Placeholder shown only on staging for pages without confirmed content. */
function Missing({ what }: { what: string }) {
  return <p className="t-draft t-repair__missing">[{what} — do uzupełnienia po potwierdzeniu przez serwis]</p>;
}

/**
 * Repair page template (SPEC §12.4, extended 2026-11): hero with the fault effect,
 * symptoms, causes, step by step, original or replacement part, time and warranty (only
 * confirmed), where to hand over (both points in one block — never a page per city),
 * preparation, after the repair and how to avoid it, FAQ, related pages, CTA. No prices.
 */
export function RepairPage({ page }: { page: RepairPageData }) {
  const live = isLive(page);
  const device = devicePages.find((d) => d.category === page.device);
  const devicePath = page.device === "phone" ? "/serwis-telefonow" : device?.path ?? REPAIRS_HREF;
  const deviceName = page.device === "phone" ? "Serwis telefonów" : device?.name ?? "Naprawy";
  const genitive = page.device === "phone" ? "telefonu" : device?.genitive ?? "sprzętu";
  const crumbs: Crumb[] = [
    { name: "Start", path: "/" },
    { name: "Naprawy", path: REPAIRS_HREF },
    { name: deviceName, path: devicePath },
    { name: page.h1, path: repairPath(page.slug) },
  ];
  const submit = submitHref(page.device, page.usterka);
  const points = visiblePoints();
  const related = page.powiazane.map((s) => repairBySlug(s)).filter((r): r is RepairPageData => !!r && (isLive(r) || !live));
  const phoneScreen = page.device === "phone" && /ekran/i.test(page.h1);
  const scene = page.device === "other" ? null : HERO_SCENES[page.device];
  const courier = courierPageHref();
  const posts = relatedPosts(page.device, `${page.h1} ${page.title} ${page.usterka}`);

  return (
    <div className={`t-ui t-page t-repair${live ? "" : " t-draft"}`}>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      {page.faq.length ? <JsonLd data={faqJsonLd(page.faq)} /> : null}
      <JsonLd data={serviceJsonLd({ name: `${page.title} — ${line.name}`, serviceType: page.title, path: repairPath(page.slug), description: page.description })} />

      <SubHero
        crumbs={crumbs}
        eyebrow={`${deviceName} · ${line.name}`}
        title={page.h1}
        lead={page.intro[0] ?? ""}
        primary={{ label: "Zgłoś tę naprawę", href: submit }}
        trackPlace="naprawa"
        promises={heroPromises({ category: page.device, phoneScreen })}
        visual={scene ? <FaultVisual device={scene.device} faults={[page.usterka]} /> : null}
        statusCard
        points={points}
        rail="Start"
        variant="repair"
      />
      {page.intro.length ? null : <Missing what="Wstęp" />}

      <section className="t-section t-section--tight" id="objawy" data-rail="Objawy">
        <div className="t-container t-courier__cols">
          <div className="t-repair__sym">
            {scene ? (
              <span className="t-symptoms__ico t-symptoms__ico--lg" aria-hidden="true">
                <FaultGlyph family={faultFamily(scene.device, page.usterka)} size={26} />
              </span>
            ) : null}
            <span className="t-eyebrow">Objawy</span>
            <h2 className="t-h2 t-h2--sm">{page.h1}: kiedy jest potrzebna</h2>
            {page.intro.slice(1).map((p) => (
              <p key={p} className="t-lead">
                {p}
              </p>
            ))}
          </div>
          {page.objawy.length ? (
            <ul className="t-ticklist t-repair__ticks">
              {page.objawy.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          ) : (
            <Missing what="Objawy" />
          )}
        </div>
      </section>

      {page.przyczyny.length ? (
        <Section id="przyczyny" rail="Przyczyny" eyebrow="Przyczyny" title="Skąd bierze się ta usterka" alt>
          <CardGrid items={page.przyczyny} numbered />
        </Section>
      ) : null}

      <section className="t-section t-section--tight" id="przebieg" data-rail="Jak naprawiamy">
        <div className="t-container t-repair__flow">
          <div className="t-cb-head t-repair__flowhead">
            <span className="t-eyebrow">Jak przebiega naprawa</span>
            <h2 className="t-h2 t-h2--sm">Co robimy krok po kroku</h2>
          </div>
          {page.przebieg.length ? (
            <Timeline steps={page.przebieg.map((s, i) => ({ s, lead: i === 0 }))} />
          ) : (
            <Missing what="Przebieg naprawy" />
          )}
          {page.czas || page.gwarancja || page.naMiejscu ? (
            <dl className="t-card t-paytable t-repair__facts">
              {page.czas ? (
                <div>
                  <dt>Ile trwa</dt>
                  <dd>{page.czas}</dd>
                </div>
              ) : null}
              {page.gwarancja ? (
                <div>
                  <dt>Gwarancja</dt>
                  <dd>{page.gwarancja}</dd>
                </div>
              ) : null}
              {page.naMiejscu ? (
                <div>
                  <dt>Gdzie</dt>
                  <dd>Na miejscu w punkcie</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </div>
      </section>

      {page.czesci.length ? (
        <Section id="czesci" rail="Części" eyebrow="Części" title="Oryginał czy zamiennik?" alt>
          <Prose
            paragraphs={page.czesci}
            aside={
              <>
                <b>Wybierasz Ty</b>
                <p>Przed naprawą mówimy, jakie części są dostępne do Twojego modelu i czym się różnią. Naprawiamy dopiero po akceptacji wyceny, a wymienione części obejmuje gwarancja.</p>
              </>
            }
          />
        </Section>
      ) : null}

      <section className="t-section t-section--tight" id="gdzie-oddac" data-rail="Gdzie oddać">
        <div className="t-container">
          <div className="t-cb-head">
            <span className="t-eyebrow">Gdzie oddać</span>
            <h2 className="t-h2 t-h2--sm">{points.length > 1 ? "Oddaj sprzęt w jednym z salonów" : "Oddaj sprzęt w salonie"}</h2>
            <p className="t-lead">
              Nie musisz się umawiać — przyjdź w godzinach otwarcia.
              {courier ? " Z dalszej okolicy wyślesz sprzęt kurierem." : null}
            </p>
          </div>
          <SalonCards points={points} trackFrom="naprawa" />
        </div>
      </section>

      <section className="t-section t-section--alt t-section--tight" id="zanim-przyjdziesz" data-rail="Przygotowanie">
        <div className="t-container">
          <div className="t-cb-head">
            <span className="t-eyebrow">Przygotowanie</span>
            <h2 className="t-h2 t-h2--sm">Jak przygotować sprzęt do tej naprawy</h2>
          </div>
          <div className="t-cb-two">
            {page.przygotowanie.length ? (
              <div className="t-card t-cb-box">
                <h3 className="t-h3 t-cb-sub">Przy tej naprawie</h3>
                <CheckList items={page.przygotowanie} tone="acc" />
              </div>
            ) : null}
            <div className="t-cb-stack">
              <PrepChecklist category={page.device} title="Zawsze przed oddaniem sprzętu" />
              {phoneScreen ? (
                <Link href="/hammer-glass" className="t-card t-courier-tile">
                  <span className="t-courier-tile__txt">
                    <b>Nowy ekran? Zabezpiecz go folią Hammer Glass</b>
                    <span>Wycinamy ją na miejscu pod Twój model.</span>
                  </span>
                  <IconArrow size={18} strokeWidth={2.6} className="t-courier-tile__arrow" />
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {page.poNaprawie.length || page.porady.length ? (
        <Section id="po-naprawie" rail="Po naprawie" eyebrow="Po naprawie" title="Czego się spodziewać i jak uniknąć powtórki">
          <div className="t-cb-after">
            {page.poNaprawie.length ? (
              <div className="t-card t-cb-box">
                <h3 className="t-h3 t-cb-sub">Po odbiorze</h3>
                <CheckList items={page.poNaprawie} />
              </div>
            ) : null}
            {page.porady.length ? (
              <div>
                <h3 className="t-h3 t-cb-sub">Jak uniknąć tej usterki</h3>
                <CardGrid items={page.porady} tone="tip" />
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}
      {page.device === "phone" ? <DataSafety /> : null}

      <section className="t-section t-section--tight" id="pytania" data-rail="Pytania">
        <div className="t-container t-faqsplit">
          <div className="t-faqsplit__head">
            <span className="t-eyebrow">Pytania</span>
            <h2 className="t-h2">{page.h1}: pytania</h2>
            <p className="t-lead">Nie ma tu Twojego pytania? Zadzwoń albo opisz problem w zgłoszeniu.</p>
          </div>
          {page.faq.length ? <Faq items={page.faq} /> : <Missing what="FAQ" />}
        </div>
      </section>

      <nav className="t-section t-section--tight t-cb-more" aria-label="Powiązane strony" id="wiecej" data-rail="Więcej">
        <div className="t-container">
          <h2 className="t-h2 t-h2--sm">Więcej o naprawie {genitive}</h2>
          {related.length ? (
            <ul className="t-dev-more__list">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={repairPath(r.slug)} className="t-chiplink">
                    {r.h1}
                    <IconArrow size={14} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          <LinkTiles
            items={[
              { href: devicePath, t: deviceName, s: "Wszystkie naprawy, marki i najczęstsze pytania" },
              ...(courier ? [{ href: courier, t: "Naprawa kurierem", s: "Jak wysłać sprzęt do serwisu i jak wraca" }] : []),
              { href: PREP_GUIDE_HREF, t: "Jak przygotować sprzęt", s: "Kopia danych, kody i akcesoria krok po kroku" },
              { href: blogCategoryHref(page.device), t: "Poradniki na blogu", s: "Porady z codziennej pracy serwisu" },
            ]}
          />
          {posts.length ? (
            <div className="t-cb-posts">
              <h3 className="t-h3 t-cb-sub">Przeczytaj też</h3>
              <ul>
                {posts.map((p) => (
                  <li key={p.href}>
                    <Link href={p.href} className="t-inline-link" data-t-inline="">
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </nav>

      <CtaBand
        eyebrow="Następny krok"
        title={`${page.h1}? Zgłoś naprawę online — wycenę dostaniesz przed rozpoczęciem pracy.`}
        primary={{ label: "Zgłoś tę naprawę", href: submit }}
        secondary={{ label: deviceName, href: devicePath }}
      />
    </div>
  );
}
