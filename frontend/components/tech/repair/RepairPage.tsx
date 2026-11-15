import Link from "next/link";
import { line, telHref } from "@/config/prokom";
import type { RepairPageData } from "@/config/naprawy";
import { Breadcrumbs } from "@/components/tech/Breadcrumbs";
import { CtaBand } from "@/components/tech/CtaBand";
import { DataSafety } from "@/components/tech/DataSafety";
import { Faq } from "@/components/tech/Faq";
import { JsonLd } from "@/components/tech/JsonLd";
import { PointCard } from "@/components/tech/PointCard";
import { PrepChecklist } from "@/components/tech/PrepChecklist";
import { IconArrow } from "@/components/tech/icons";
import { devicePages } from "@/lib/tech/devices";
import { isLive, repairBySlug, repairPath } from "@/lib/tech/naprawy";
import { REPAIRS_HREF } from "@/lib/tech/nav";
import { visiblePoints } from "@/lib/tech/points";
import { breadcrumbJsonLd, faqJsonLd, type Crumb } from "@/lib/tech/seo";
import { serviceJsonLd } from "@/lib/tech/service-jsonld";
import { submitHref } from "@/lib/tech/wizard-data";

/** Placeholder shown only on staging for pages without confirmed content. */
function Missing({ what }: { what: string }) {
  return <p className="t-draft t-repair__missing">[{what} — do uzupełnienia po potwierdzeniu przez serwis]</p>;
}

/**
 * Repair page template (SPEC §12.4): hero, symptoms, how it goes, time and warranty (only
 * confirmed), where to hand over (both points in one block — never a page per city),
 * "Zanim przyjdziesz", Hammer Glass for phone screens, FAQ, related, CTA. No prices.
 */
export function RepairPage({ page }: { page: RepairPageData }) {
  const live = isLive(page);
  const device = devicePages.find((d) => d.category === page.device);
  const devicePath = page.device === "phone" ? "/serwis-telefonow" : device?.path ?? REPAIRS_HREF;
  const deviceName = page.device === "phone" ? "Serwis telefonów" : device?.name ?? "Naprawy";
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

  return (
    <div className={`t-ui t-page t-repair${live ? "" : " t-draft"}`}>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      {page.faq.length ? <JsonLd data={faqJsonLd(page.faq)} /> : null}
      <JsonLd data={serviceJsonLd({ name: `${page.title} — ${line.name}`, serviceType: page.title, path: repairPath(page.slug), description: page.description })} />

      <section className="t-section--hero" id="start" data-rail={page.h1}>
        <div className="t-container">
          <div className="t-stage t-bhero">
            <Breadcrumbs items={crumbs} separator="/" />
            <h1 className="t-bhero__h1">{page.h1}</h1>
            {page.intro.length ? <p className="t-bhero__lead t-bhero__lead--wide">{page.intro[0]}</p> : <Missing what="Wstęp" />}
            <div className="t-btnrow">
              <Link href={submit} className="t-pbtn t-pbtn--stage" data-track="zgloszenie_start" data-track-zrodlo="strona_naprawy">
                Zgłoś tę naprawę
              </Link>
              <a href={telHref(line.phone)} className="t-pbtn t-pbtn--ghost-dark" data-track="telefon_klik" data-track-miejsce="naprawa">
                {line.phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="t-section t-section--tight" id="objawy" data-rail="Objawy">
        <div className="t-container t-courier__cols">
          <div>
            <span className="t-eyebrow">Objawy</span>
            <h2 className="t-h2 t-h2--sm">Kiedy ta naprawa jest potrzebna</h2>
            {page.intro.slice(1).map((p) => (
              <p key={p} className="t-lead">
                {p}
              </p>
            ))}
          </div>
          {page.objawy.length ? (
            <ul className="t-ticklist">
              {page.objawy.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          ) : (
            <Missing what="Objawy" />
          )}
        </div>
      </section>

      <section className="t-section t-section--alt t-section--tight" id="przebieg" data-rail="Przebieg">
        <div className="t-container">
          <span className="t-eyebrow">Jak przebiega naprawa</span>
          <h2 className="t-h2 t-h2--sm">Krok po kroku</h2>
          {page.przebieg.length ? (
            <ol className="t-prepsteps t-prepsteps--grid t-repair__steps">
              {page.przebieg.map((s, i) => (
                <li key={s} className="t-card t-prepsteps__item">
                  <span className="t-prepsteps__n" aria-hidden="true">
                    {i + 1}
                  </span>
                  <p>{s}</p>
                </li>
              ))}
            </ol>
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

      <section className="t-section t-section--tight" id="gdzie-oddac" data-rail="Gdzie oddać">
        <div className="t-container">
          <span className="t-eyebrow">Gdzie oddać</span>
          <h2 className="t-h2 t-h2--sm">{points.length > 1 ? "Punkty serwisowe" : "Punkt serwisowy"}</h2>
          <div className="t-repair__points">
            {points.map((p) => (
              <PointCard key={p.key} point={p} layout="stack" as="h3" trackFrom="naprawa" />
            ))}
          </div>
        </div>
      </section>

      <section className="t-section t-section--alt t-section--tight" id="zanim-przyjdziesz" data-rail="Zanim przyjdziesz">
        <div className="t-container t-courier__cols">
          <PrepChecklist category={page.device} title="Zanim przyjdziesz" />
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
      </section>
      {page.device === "phone" ? <DataSafety /> : null}

      <section className="t-section t-section--tight" id="pytania" data-rail="Pytania">
        <div className="t-container t-faqsplit">
          <div className="t-faqsplit__head">
            <span className="t-eyebrow">Pytania</span>
            <h2 className="t-h2">{page.h1}: pytania</h2>
          </div>
          {page.faq.length ? <Faq items={page.faq} /> : <Missing what="FAQ (3–5 pytań)" />}
        </div>
      </section>

      {related.length ? (
        <nav className="t-section t-section--tight t-dev-more" aria-label="Powiązane naprawy">
          <div className="t-container">
            <h2 className="t-h2 t-h2--sm">Powiązane naprawy</h2>
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
          </div>
        </nav>
      ) : null}

      <CtaBand eyebrow="Następny krok" title={`${page.h1}? Zgłoś naprawę online — wycenę dostaniesz przed rozpoczęciem pracy.`} primary={{ label: "Zgłoś tę naprawę", href: submit }} secondary={{ label: deviceName, href: devicePath }} />
    </div>
  );
}
