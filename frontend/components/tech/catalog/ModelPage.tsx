import Link from "next/link";
import { notFound } from "next/navigation";
import { BRAND_NAMES, catalog, compatOf, findModel, modelPath } from "@/lib/tech/catalog";
import { productJsonLd } from "@/lib/tech/catalog/seo";
import { breadcrumbJsonLd, faqJsonLd, type Crumb } from "@/lib/tech/seo";
import { Breadcrumbs } from "../Breadcrumbs";
import { Faq } from "../Faq";
import { JsonLd } from "../JsonLd";
import { ModelCard } from "./ModelCard";
import { ModelConfigurator } from "./ModelConfigurator";

const SERVICE_HREF = { apple: "/serwis-apple", samsung: "/serwis-samsung" } as const;
const SALON_HREF = { apple: "/apple", samsung: "/samsung" } as const;

/**
 * /sprzedaz/[marka]/[model] (runda 18.11 v2 §2): configurator (colour, storage, sticky „Dodaj do
 * zapytania”), „W skrócie”, our description, specs with the source table, box contents, „Pasuje do”,
 * service of the model, FAQ. Product JSON-LD without offers. No prices.
 */
export function ModelPage({ brand, slug }: { brand: string; slug: string }) {
  const m = findModel(brand, slug);
  if (!m) notFound();
  const family = catalog.families.find((f) => f.key === m.family);
  const crumbs: Crumb[] = [
    { name: "Start", path: "/" },
    { name: "Sprzedaż", path: "/sprzedaz" },
    { name: `Salon ${BRAND_NAMES[m.brand]}`, path: SALON_HREF[m.brand] },
    { name: m.name, path: modelPath(m) },
  ];
  const compat = compatOf(m);
  const siblings = catalog.models.filter((x) => x.family === m.family && x.slug !== m.slug).slice(0, 3);

  return (
    <div className="t-ui t-page t-model">
      <JsonLd data={productJsonLd(m)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={faqJsonLd(m.faq)} />

      <section className="t-section--hero" id="model" data-rail={m.name}>
        <div className="t-container">
          <div className="t-model__head">
            <Breadcrumbs items={crumbs} />
            <span className="t-eyb">
              {BRAND_NAMES[m.brand]}
              {family ? ` · ${family.name}` : ""}
              {m.isNew ? " · Nowość" : ""}
            </span>
            <h1 className="t-model__h1">{m.name}</h1>
            {m.availabilityNote ? <p className="t-model__avail">{m.availabilityNote}</p> : null}
          </div>
          <ModelConfigurator model={m} />
        </div>
      </section>

      <section className="t-section t-section--tight" id="w-skrocie" data-rail="W skrócie" aria-labelledby="t-model-short">
        <div className="t-container">
          <h2 id="t-model-short" className="t-h2 t-h2--sm">W skrócie</h2>
          <ul className="t-model__facts">
            {m.keyFacts.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <div className="t-model__desc">
            {m.description.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="t-section t-section--alt" id="parametry" data-rail="Parametry" aria-labelledby="t-model-specs">
        <div className="t-container t-model__specwrap">
          <div>
            <h2 id="t-model-specs" className="t-h2 t-h2--sm">Parametry</h2>
            <dl className="t-model__specs">
              {m.specs.map((s) => (
                <div key={s.label}>
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
            <p className="t-model__sources">
              Dane producenta:{" "}
              {m.sources.map((s, i) => (
                <span key={s.url}>
                  {i ? ", " : ""}
                  <a href={s.url} target="_blank" rel="noopener noreferrer" data-t-inline="">
                    {new URL(s.url).hostname.replace(/^www\./, "")}
                  </a>{" "}
                  ({s.date.split("-").reverse().join(".")})
                </span>
              ))}
              . Szczegóły wersji potwierdzimy w odpowiedzi na zapytanie.
            </p>
          </div>
          {m.inBox.length ? (
          <aside className="t-card t-model__box" aria-labelledby="t-model-box">
            <h2 id="t-model-box" className="t-h3">Co w pudełku</h2>
            <ul>
              {m.inBox.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </aside>
          ) : null}
        </div>
      </section>

      {compat.accessories.length || compat.models.length ? (
        <section className="t-section t-section--tight" id="pasuje" data-rail="Pasuje do" aria-labelledby="t-model-compat">
          <div className="t-container">
            <h2 id="t-model-compat" className="t-h2 t-h2--sm">Pasuje do</h2>
            <ul className="t-model__compat">
              {compat.accessories.map((a) => (
                <li key={a.key} className="t-card">
                  <b>{a.name}</b>
                  <span>{a.note.replace(/^TODO\(krystian\):.*$/, "Zapytaj przy zamówieniu.")}</span>
                  {a.href ? <Link href={a.href}>Zobacz →</Link> : null}
                </li>
              ))}
              {compat.models.map((x) => (
                <li key={x.slug} className="t-card">
                  <b>{x.name}</b>
                  <span>{catalog.families.find((f) => f.key === x.family)?.forWho}</span>
                  <Link href={modelPath(x)}>Zobacz →</Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="t-section t-section--tight" id="serwis-modelu" data-rail="Serwis" aria-labelledby="t-model-service">
        <div className="t-container">
          <div className="t-card t-model__service">
            <div>
              <span className="t-eyb">Serwis PRO-KOM Tech</span>
              <h2 id="t-model-service" className="t-h3">Serwis tego modelu</h2>
              <p>Diagnoza i naprawa w Rabce-Zdroju i Zakopanem. Wycena zawsze przed naprawą — możesz zrezygnować bez konsekwencji.</p>
            </div>
            <Link href={SERVICE_HREF[m.brand]} className="t-pbtn t-pbtn--outline t-pbtn--m">
              Serwis {BRAND_NAMES[m.brand]} →
            </Link>
          </div>
        </div>
      </section>

      <section className="t-section t-section--tight" id="pytania" data-rail="Pytania" aria-labelledby="t-model-faq">
        <div className="t-container t-model__faq">
          <h2 id="t-model-faq" className="t-h2 t-h2--sm">Pytania o {m.name}</h2>
          <Faq items={m.faq} />
        </div>
      </section>

      {siblings.length ? (
        <section className="t-section t-section--alt" id="podobne" data-rail="Podobne" aria-labelledby="t-model-more">
          <div className="t-container">
            <h2 id="t-model-more" className="t-h2 t-h2--sm">Z tej samej rodziny</h2>
            <ul className="t-catb__grid t-catb__grid--3">
              {siblings.map((x) => (
                <li key={x.slug}>
                  <ModelCard model={x} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
