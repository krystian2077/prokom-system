import Link from "next/link";
import { line, servicePoints, telHref } from "@/config/prokom";
import { Breadcrumbs } from "@/components/tech/Breadcrumbs";
import { CtaBand } from "@/components/tech/CtaBand";
import { Faq } from "@/components/tech/Faq";
import { JsonLd } from "@/components/tech/JsonLd";
import { faqGroups } from "@/lib/tech/faq-data";
import { SUBMIT_HREF } from "@/lib/tech/nav";
import { joinCities } from "@/lib/tech/point-format";
import { publishedPoints } from "@/lib/tech/points";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata, type Crumb } from "@/lib/tech/seo";
import { PointPhonesInline } from "@/components/tech/PointCalls";

const published = publishedPoints(servicePoints);

export const metadata = pageMetadata({
  title: "FAQ — najczęstsze pytania o serwis",
  description: `Odpowiedzi na pytania o serwis PRO-KOM Tech (${joinCities(published)}): wycena, gwarancja, status naprawy, wysyłka kurierem i folie Hammer Glass.`,
  path: "/faq",
});

const CRUMBS: Crumb[] = [
  { name: "Start", path: "/" },
  { name: "FAQ", path: "/faq" },
];

export default function FaqPage() {
  const all = faqGroups();
  return (
    <div className="t-ui t-page t-faqpage">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <JsonLd data={faqJsonLd(all.flatMap((g) => g.items))} />

      <section className="t-section--hero" id="faq" data-rail="FAQ">
        <div className="t-container">
          <div className="t-stage t-bhero">
            <Breadcrumbs items={CRUMBS} separator="/" />
            <h1 className="t-bhero__h1">
              Najczęstsze pytania <span>o serwis PRO-KOM Tech</span>
            </h1>
            <p className="t-bhero__lead">
              Nie ma tu Twojego pytania? Zadzwoń:{" "}
              <PointPhonesInline track="faq" />
            </p>
            <nav aria-label="Tematy" className="t-faqnav">
              {all.map((g) => (
                <a key={g.id} href={`#${g.id}`}>
                  {g.title}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </section>

      {all.map((g, i) => (
        <section key={g.id} className={`t-section t-section--tight${i % 2 ? " t-section--alt" : ""}`} id={g.id} data-rail={g.title}>
          <div className="t-container t-faqsplit">
            <div className="t-faqsplit__head">
              <span className="t-eyebrow">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="t-h2 t-h2--sm">{g.title}</h2>
              {g.links ? (
                <ul className="t-faqpage__links">
                  {g.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="t-lnk t-lnk--sm">
                        {l.label} →
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <Faq items={g.items} openFirst={i === 0} />
          </div>
        </section>
      ))}

      <CtaBand eyebrow="Następny krok" title="Masz zepsuty sprzęt? Zgłoś naprawę online albo zadzwoń." primary={{ label: "Zgłoś naprawę", href: SUBMIT_HREF }} secondary={{ label: line.phoneDisplay, href: telHref(line.phone), tel: true, track: "faq_cta" }} />
    </div>
  );
}
