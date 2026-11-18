import Link from "next/link";
import { BRAND_NAMES, catalog, familiesOf, KIND_NAMES, modelsOfFamily } from "@/lib/tech/catalog";
import { collectionJsonLd } from "@/lib/tech/catalog/seo";
import type { Brand, Kind } from "@/lib/tech/catalog/types";
import { breadcrumbJsonLd, type Crumb } from "@/lib/tech/seo";
import { Breadcrumbs } from "../Breadcrumbs";
import { JsonLd } from "../JsonLd";
import { ModelCard } from "./ModelCard";
import { SalonCompare } from "./SalonCompare";
import { SalonQuiz } from "./SalonQuiz";

const COPY: Record<Brand, { lead: string; service: string }> = {
  apple: {
    lead: "iPhone, iPad, Mac, Apple Watch i AirPods w jednym miejscu. Wybierz model i wersję, a my odpowiemy z ceną i dostępnością — odbiór w Rabce-Zdroju albo w Zakopanem.",
    service: "/serwis-apple",
  },
  samsung: {
    lead: "Galaxy S, składane Galaxy Z, Galaxy A, tablety Tab, zegarki i słuchawki. Wybierz model i wersję, a my odpowiemy z ceną i dostępnością — odbiór w Rabce-Zdroju albo w Zakopanem.",
    service: "/serwis-samsung",
  },
};

/**
 * Brand salon (/apple, /samsung — runda 18.11 v2 §2): departments by kind → families with „dla kogo”
 * → model cards; „Dobierz w 3 pytaniach”; comparison of up to 3 models. Brand as plain text — no
 * logo with the apple (§0). No prices.
 */
export function SalonPage({ brand }: { brand: Brand }) {
  const name = BRAND_NAMES[brand];
  const path = `/${brand}`;
  const crumbs: Crumb[] = [
    { name: "Start", path: "/" },
    { name: "Sprzedaż", path: "/sprzedaz" },
    { name: `Salon ${name}`, path },
  ];
  const families = familiesOf(brand);
  const kinds = Array.from(new Set(families.map((f) => f.kind))) as Kind[];
  const models = catalog.models.filter((m) => m.brand === brand);
  const quiz = catalog.quizzes.find((q) => q.brand === brand && q.kind === "phone");

  return (
    <div className={`t-ui t-page t-bsalon t-bsalon--${brand}`}>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={collectionJsonLd(`Salon ${name}`, path, models)} />

      <section className="t-section--hero" id="salon" data-rail={`Salon ${name}`}>
        <div className="t-container">
          <div className="t-bsalon__hero">
            <Breadcrumbs items={crumbs} />
            <span className="t-eyb t-eyb--dark">Sprzedaż · PRO-KOM Tech</span>
            <h1 className="t-bsalon__h1">
              Salon <span className="t-bsalon__brand">{name}</span>
            </h1>
            <p className="t-bsalon__lead">{COPY[brand].lead}</p>
            <nav className="t-bsalon__depts" aria-label={`Działy salonu ${name}`}>
              {families.map((f) => (
                <a key={f.key} href={`#${f.key}`} className="t-bsalon__dept">
                  {f.name}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </section>

      {quiz ? (
        <section className="t-section t-section--tight" id="dobor" data-rail="Dobierz" aria-labelledby="t-bsalon-quiz">
          <div className="t-container">
            <div className="t-bsalon__quizwrap">
              <div>
                <span className="t-eyb">Nie wiesz, który wybrać?</span>
                <h2 id="t-bsalon-quiz" className="t-h2 t-h2--sm">{quiz.title}</h2>
                <p className="t-bsalon__quizlead">Trzy pytania, bez cen i bez logowania. Na końcu 1–3 modele z krótkim uzasadnieniem.</p>
              </div>
              <SalonQuiz quiz={quiz} models={models.filter((m) => m.kind === quiz.kind)} />
            </div>
          </div>
        </section>
      ) : null}

      {kinds.map((kind) => (
        <section key={kind} className="t-section t-section--tight t-bsalon__kind" id={`dzial-${kind}`} data-rail={KIND_NAMES[kind]} aria-labelledby={`t-bsalon-${kind}`}>
          <div className="t-container">
            <h2 id={`t-bsalon-${kind}`} className="t-h2">{KIND_NAMES[kind]}</h2>
            {families
              .filter((f) => f.kind === kind)
              .map((f) => (
                <div key={f.key} className="t-bsalon__family" id={f.key}>
                  <div className="t-bsalon__famhead">
                    <h3 className="t-h3">{f.name}</h3>
                    <p>{f.forWho}</p>
                  </div>
                  <ul className="t-catb__grid">
                    {modelsOfFamily(f.key).map((m) => (
                      <li key={m.slug}>
                        <ModelCard model={m} headingLevel={4} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </section>
      ))}

      <section className="t-section t-section--alt" id="porownaj" data-rail="Porównaj" aria-labelledby="t-bsalon-cmp">
        <div className="t-container">
          <h2 id="t-bsalon-cmp" className="t-h2 t-h2--sm">Porównaj modele</h2>
          <SalonCompare
            models={models.map((m) => ({ slug: m.slug, name: m.name, kind: m.kind, specs: m.specs, colors: m.colors, storage: m.storage }))}
            kinds={kinds.filter((k) => models.filter((m) => m.kind === k).length > 1).map((k) => ({ key: k, label: KIND_NAMES[k] }))}
          />
        </div>
      </section>

      <section className="t-section t-section--tight" id="serwis" data-rail="Serwis" aria-labelledby="t-bsalon-service">
        <div className="t-container">
          <div className="t-card t-model__service">
            <div>
              <span className="t-eyb">Po zakupie</span>
              <h2 id="t-bsalon-service" className="t-h3">Serwis {name} na miejscu</h2>
              <p>Kupujesz u nas i serwisujesz u nas: diagnoza i naprawa w Rabce-Zdroju i Zakopanem, wycena zawsze przed naprawą.</p>
            </div>
            <Link href={COPY[brand].service} className="t-pbtn t-pbtn--outline t-pbtn--m">
              Serwis {name} →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
