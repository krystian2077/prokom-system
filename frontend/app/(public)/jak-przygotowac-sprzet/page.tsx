import Link from "next/link";
import { line, telHref } from "@/config/prokom";
import { Breadcrumbs } from "@/components/tech/Breadcrumbs";
import { CtaBand } from "@/components/tech/CtaBand";
import { DataSafety } from "@/components/tech/DataSafety";
import { JsonLd } from "@/components/tech/JsonLd";
import { PrepTabs, PrintButton } from "@/components/tech/prep/PrepTabs";
import { PREP_GUIDE_HREF, SUBMIT_HREF } from "@/lib/tech/nav";
import { PREP_TABS } from "@/lib/tech/prep-guide";
import { breadcrumbJsonLd, pageMetadata, type Crumb } from "@/lib/tech/seo";
import { SITE_URL } from "@/lib/site-config";

const TITLE = "Jak przygotować telefon lub laptop do serwisu";
const DESCRIPTION =
  "Kopia zapasowa, kod odblokowania, konto Google, karta SIM, ładowarka — co zrobić, zanim oddasz telefon, laptop, konsolę albo smartwatch do serwisu.";

export const metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PREP_GUIDE_HREF });

const CRUMBS: Crumb[] = [
  { name: "Start", path: "/" },
  { name: "Jak przygotować sprzęt", path: PREP_GUIDE_HREF },
];

// Article (not HowTo — Google no longer shows HowTo results, SPEC §12.3).
const ARTICLE = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: TITLE,
  description: DESCRIPTION,
  inLanguage: "pl",
  url: `${SITE_URL}${PREP_GUIDE_HREF}`,
  mainEntityOfPage: `${SITE_URL}${PREP_GUIDE_HREF}`,
  author: { "@type": "Organization", name: line.name, url: SITE_URL },
  publisher: { "@id": `${SITE_URL}/#organization` },
  image: `${SITE_URL}/images/og-prokom.jpg`,
  datePublished: "2026-11-15",
  dateModified: "2026-11-15",
};

export default function PrepGuidePage() {
  return (
    <div className="t-ui t-page t-prepguide">
      <JsonLd data={ARTICLE} />
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />

      <section className="t-section--hero" id="poradnik" data-rail="Poradnik">
        <div className="t-container">
          <div className="t-stage t-bhero">
            <Breadcrumbs items={CRUMBS} separator="/" />
            <h1 className="t-bhero__h1">
              Jak przygotować sprzęt do serwisu <span>Kilka minut przed wyjściem z domu oszczędza czas i chroni dane.</span>
            </h1>
            <p className="t-bhero__lead">Wybierz urządzenie. Przy każdym kroku piszemy krótko, dlaczego jest ważny.</p>
            <div className="t-btnrow t-noprint">
              <Link href={SUBMIT_HREF} className="t-pbtn t-pbtn--stage" data-track="zgloszenie_start" data-track-zrodlo="poradnik">
                Zgłoś naprawę
              </Link>
              <PrintButton />
            </div>
          </div>
        </div>
      </section>

      <section className="t-section t-section--tight" id="kroki" data-rail="Kroki">
        <div className="t-container">
          <PrepTabs tabs={PREP_TABS} />
          <p className="t-prepguide__note">
            Masz pytanie przed przyjściem? Zadzwoń:{" "}
            <a href={telHref(line.phone)} className="t-inline-link" data-t-inline="" data-track="telefon_klik" data-track-miejsce="poradnik">
              {line.phoneDisplay}
            </a>
          </p>
        </div>
      </section>

      <DataSafety />

      <div className="t-noprint">
        <CtaBand eyebrow="Gotowe?" title="Sprzęt przygotowany. Zgłoś naprawę online albo przyjdź do punktu." primary={{ label: "Zgłoś naprawę", href: SUBMIT_HREF }} secondary={{ label: "Punkty serwisowe", href: "/punkty-serwisowe" }} />
      </div>
    </div>
  );
}
