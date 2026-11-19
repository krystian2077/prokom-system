import Link from "next/link";
import { Breadcrumbs } from "@/components/tech/Breadcrumbs";
import { CatalogBrowser, type BrowserItem } from "@/components/tech/catalog/CatalogBrowser";
import { CardTilt } from "@/components/tech/catalog/CardTilt";
import { ModelCard } from "@/components/tech/catalog/ModelCard";
import { RecentlyViewed } from "@/components/tech/catalog/RecentlyViewed";
import { JsonLd } from "@/components/tech/JsonLd";
import { BRAND_NAMES, catalog, KIND_NAMES, recentEntries, sortedModels } from "@/lib/tech/catalog";
import { collectionJsonLd } from "@/lib/tech/catalog/seo";
import { normalizeText } from "@/lib/tech/search/normalize";
import { breadcrumbJsonLd, pageMetadata, type Crumb } from "@/lib/tech/seo";

export const metadata = pageMetadata({
  title: "Sprzedaż Apple i Samsung — katalog",
  description: "iPhone, iPad, Mac, Apple Watch, AirPods i Galaxy: wybierz model, kolor i pamięć, wyślij zapytanie. Odpowiemy z ceną i dostępnością w salonie.",
  path: "/sprzedaz",
});

const CRUMBS: Crumb[] = [
  { name: "Start", path: "/" },
  { name: "Sprzedaż", path: "/sprzedaz" },
];

/**
 * /sprzedaz (runda 18.11 v2 §2): every Apple and Samsung device we sell, newest first, with filters
 * (brand, kind), search and family chips. Not a shop — no prices, no cart: „Dodaj do zapytania”.
 */
export default function SalesPage() {
  const models = sortedModels();
  const items: BrowserItem[] = models.map((m) => {
    const fam = catalog.families.find((f) => f.key === m.family);
    return {
      slug: m.slug,
      brand: m.brand,
      kind: m.kind,
      family: m.family,
      familyName: fam?.name ?? m.family,
      order: m.order,
      text: normalizeText([m.name, BRAND_NAMES[m.brand], KIND_NAMES[m.kind], fam?.name, ...m.colors.map((c) => c.name)].join(" ")),
      card: <ModelCard model={m} />,
    };
  });
  return (
    <div className="t-ui t-page t-sales">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <JsonLd data={collectionJsonLd("Sprzedaż Apple i Samsung", "/sprzedaz", models)} />
      <section className="t-section--hero" id="sprzedaz" data-rail="Sprzedaż">
        <div className="t-container">
          <div className="t-sales__hero">
            <div className="t-sales__copy">
              <Breadcrumbs items={CRUMBS} />
              <span className="t-eyb t-eyb--dark">Sprzedaż · Rabka-Zdrój i Zakopane</span>
              <h1 className="t-sales__h1">
                Apple i Samsung
                <span>z salonu na Podhalu.</span>
              </h1>
              <p className="t-sales__lead">Wybierz model, kolor i pamięć, dodaj do zapytania. Odpowiemy z ceną i dostępnością, a sprzęt odbierzesz w salonie — z folią Hammer Glass naklejoną na miejscu, jeśli chcesz.</p>
              <div className="t-sales__salons">
                <Link href="/apple" className="t-sales__salon">
                  <b>Salon Apple</b>
                  <span>iPhone · iPad · Mac · Watch · AirPods</span>
                </Link>
                <Link href="/samsung" className="t-sales__salon">
                  <b>Salon Samsung</b>
                  <span>Galaxy S · Z · A · Tab · Watch · Buds</span>
                </Link>
              </div>
            </div>
            <ol className="t-sales__how" aria-label="Jak to działa">
              <li>
                <b>Wybierz</b>
                <span>model, kolor i wersję</span>
              </li>
              <li>
                <b>Wyślij zapytanie</b>
                <span>bez logowania i bez płatności</span>
              </li>
              <li>
                <b>Odbierz w salonie</b>
                <span>po potwierdzeniu ceny i dostępności</span>
              </li>
            </ol>
          </div>
        </div>
      </section>
      <section className="t-section t-section--flush-top" id="katalog" data-rail="Katalog" aria-label="Katalog">
        <div className="t-container">
          <RecentlyViewed entries={recentEntries()} />
          <CatalogBrowser items={items} />
          <CardTilt />
        </div>
      </section>
    </div>
  );
}
