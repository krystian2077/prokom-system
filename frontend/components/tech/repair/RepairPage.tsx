import Link from "next/link";
import { line, telHref } from "@/config/prokom";
import type { RepairPageData } from "@/config/naprawy";
import { DataSafety } from "@/components/tech/DataSafety";
import { Faq } from "@/components/tech/Faq";
import { JsonLd } from "@/components/tech/JsonLd";
import { PrepChecklist } from "@/components/tech/PrepChecklist";
import { IconArrow, IconCheck, IconPhoneCall } from "@/components/tech/icons";
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
import { BeforeAfter } from "./BeforeAfter";

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
        <div className="t-container t-rsym">
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
            <ul className="t-rsym__grid" data-t-stagger="">
              {page.objawy.map((o, i) => (
                <li key={o} className="t-card t-rsym__card">
                  <span className="t-rsym__n" aria-hidden="true">
                    <i />
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p>{o}</p>
                  {scene ? (
                    <span className="t-rsym__mark" aria-hidden="true">
                      <FaultGlyph family={faultFamily(scene.device, page.usterka)} size={64} />
                    </span>
                  ) : null}
                </li>
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

      {scene ? (
        <section className="t-section t-section--tight t-section--alt t-rba" id="przed-i-po" data-rail="Przed i po">
          <div className="t-container t-rba__in">
            <div className="t-cb-head t-rba__head">
              <span className="t-eyebrow">Przed i po</span>
              <h2 className="t-h2 t-h2--sm">{page.usterka}: przed naprawą i po niej</h2>
              <p className="t-lead">Przesuń suwak, żeby porównać.</p>
              <ul className="t-rba__points">
                {["Wycena przed naprawą", "Gwarancja na usługę i części", "Status naprawy online"].map((t) => (
                  <li key={t}>
                    <span aria-hidden="true">
                      <IconCheck size={13} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <BeforeAfter device={scene.device} fault={page.usterka} />
          </div>
        </section>
      ) : null}

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

      <section className="t-section t-section--tight t-rfaq" id="pytania" data-rail="Pytania">
        <div className="t-container t-faqsplit">
          <div className="t-faqsplit__head">
            <span className="t-eyebrow">Pytania</span>
            <h2 className="t-h2">{page.h1}: pytania</h2>
            <div className="t-rfaq__ask">
              <b>Nie ma tu Twojego pytania?</b>
              <p>Zadzwoń albo opisz problem w zgłoszeniu.</p>
              <div className="t-rfaq__btns">
                <a href={telHref(line.phone)} className="t-pbtn t-pbtn--stage t-pbtn--m" data-track="telefon_klik" data-track-miejsce="naprawa_faq">
                  <IconPhoneCall size={16} /> {line.phoneDisplay}
                </a>
                <Link href={submit} className="t-pbtn t-pbtn--ghost-dark t-pbtn--m">
                  Opisz problem
                </Link>
              </div>
            </div>
          </div>
          {page.faq.length ? <Faq items={page.faq} /> : <Missing what="FAQ" />}
        </div>
      </section>

      {related.length ? (
        <nav className="t-section t-section--tight t-section--alt t-rrel" aria-label="Powiązane naprawy" id="powiazane" data-rail="Powiązane">
          <div className="t-container">
            <div className="t-cb-head">
              <span className="t-eyebrow">Powiązane naprawy</span>
              <h2 className="t-h2 t-h2--sm">Inne naprawy, które często idą w parze</h2>
            </div>
            <ul className={`t-rrel__list t-rrel__list--${Math.min(related.length, 3)}`} data-t-stagger="">
              {related.map((r) => {
                const rs = r.device === "other" ? null : HERO_SCENES[r.device];
                return (
                  <li key={r.slug}>
                    <Link href={repairPath(r.slug)} className="t-card t-rrel__card">
                      <span className="t-rrel__art" aria-hidden="true">
                        {rs ? <FaultVisual device={rs.device} faults={[r.usterka]} mode="poster" tags={false} lazy /> : null}
                      </span>
                      <span className="t-rrel__txt">
                        <span className="t-rrel__kicker">{r.usterka}</span>
                        <b>{r.h1}</b>
                        <span className="t-rrel__go">
                          Zobacz naprawę <IconArrow size={14} />
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      ) : null}

      <nav className="t-section t-section--tight t-cb-more" aria-label="Powiązane strony" id="wiecej" data-rail="Więcej">
        <div className="t-container">
          <h2 className="t-h2 t-h2--sm">Więcej o naprawie {genitive}</h2>
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

      <section className="t-rcta-wrap" aria-label="Zgłoś naprawę">
        <div className="t-container">
          <div className="t-rcta">
            <div className="t-rcta__txt">
              <span className="t-eyebrow t-eyebrow--stage">Następny krok</span>
              <p className="t-rcta__title">{`${page.h1}? Zgłoś naprawę online — wycenę dostaniesz przed rozpoczęciem pracy.`}</p>
              <ul className="t-rcta__promises">
                {heroPromises({ category: page.device, phoneScreen }).map((p) => (
                  <li key={p.text} className={p.draft ? "t-draft" : undefined}>
                    <IconCheck size={14} /> {p.text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="t-rcta__actions">
              <Link href={submit} className="t-hbtn t-hbtn--acc t-shine t-rcta__go">
                Zgłoś tę naprawę <IconArrow size={16} strokeWidth={2.6} />
              </Link>
              <a href={telHref(line.phone)} className="t-pbtn t-pbtn--ghost-dark t-rcta__tel" data-track="telefon_klik" data-track-miejsce="naprawa_cta">
                <IconPhoneCall size={17} /> {line.phoneDisplay}
              </a>
              <Link href={devicePath} className="t-rcta__more">
                {deviceName} <IconArrow size={14} />
              </Link>
            </div>
            {scene ? (
              <div className="t-rcta__art" aria-hidden="true">
                <FaultVisual device={scene.device} faults={[page.usterka]} mode="fixed" tags={false} lazy />
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
