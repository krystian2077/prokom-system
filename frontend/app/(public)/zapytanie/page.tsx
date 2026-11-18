import { Breadcrumbs } from "@/components/tech/Breadcrumbs";
import { EnquiryPage } from "@/components/tech/catalog/EnquiryPage";
import { pageMetadata, type Crumb } from "@/lib/tech/seo";

export const metadata = {
  ...pageMetadata({
    title: "Zapytanie o sprzęt Apple i Samsung",
    description: "Twoja lista zapytania: model, kolor, pamięć i ilość. Wyślij bez logowania — odpowiemy z ceną i dostępnością, odbiór w Rabce-Zdroju lub Zakopanem.",
    path: "/zapytanie",
  }),
  // A personal list — nothing to index.
  robots: { index: false, follow: true },
};

const CRUMBS: Crumb[] = [
  { name: "Start", path: "/" },
  { name: "Sprzedaż", path: "/sprzedaz" },
  { name: "Zapytanie", path: "/zapytanie" },
];

export default function Page() {
  return (
    <div className="t-ui t-page">
      <section className="t-section--hero" id="zapytanie" data-rail="Zapytanie">
        <div className="t-container">
          <div className="t-model__head">
            <Breadcrumbs items={CRUMBS} />
            <h1 className="t-model__h1">Twoje zapytanie</h1>
            <p className="t-model__avail">Bez cen na stronie: po wysłaniu odpowiemy z ceną i dostępnością. Sprzęt odbierzesz w salonie.</p>
          </div>
          <EnquiryPage />
        </div>
      </section>
    </div>
  );
}
