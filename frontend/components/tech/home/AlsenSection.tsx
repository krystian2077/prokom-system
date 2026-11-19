import Link from "next/link";
import { partners } from "@/config/prokom";
import { SALES_HREF } from "@/lib/tech/catalog/nav";
import { alsenPoint } from "@/lib/tech/partners";
import { inCity } from "@/lib/tech/point-format";
import { AlsenLogo } from "../AlsenPartner";
import { IconArrow } from "../icons";

// Categories exactly as in the alsen.pl menu (read 19.11.2026; „RTV i AGD” and „Inteligentny dom” from the home page).
export const ALSEN_CATEGORIES = ["Laptopy i komputery", "Podzespoły komputerowe", "Urządzenia peryferyjne", "Smartfony i lifestyle", "RTV i AGD", "Inteligentny dom"] as const;

// Krystian 19.11.2026: customers can order through us everything that is on alsen.pl; the partner point is the Rabka salon.
const partnerPoint = alsenPoint();
const partnerAddress = `${partnerPoint.street}, ${partnerPoint.city}`;

const POINTS = [
  { t: "Wszystko z alsen.pl", s: `Laptopy, komputery, podzespoły, urządzenia peryferyjne, smartfony, RTV i AGD — zamówisz przez nas każdy produkt z oferty sieci i odbierzesz go w punkcie partnerskim: ${partnerAddress}.`, href: "/kontakt", cta: "Zapytaj" },
  { t: "Apple i Samsung w katalogu", s: "iPhone, iPad, Mac, Galaxy i reszta — kolory i wersje na stronie, cenę i dostępność podamy w odpowiedzi.", href: SALES_HREF, cta: "Katalog" },
  { t: "Odbiór i serwis na miejscu", s: "Rabka-Zdrój i Zakopane: sprzęt odbierzesz w salonie, a gdyby coś się zepsuło — serwis z wyceną przed naprawą.", href: "/punkty-serwisowe", cta: "Punkty" },
] as const;

/**
 * Home page section about the ALSEN partnership (Krystian 19.11: a proper section, not a small card).
 * The logo is a red plate — readable on both themes. Link to alsen.pl in a new tab, rel="noopener".
 */
export function AlsenSection() {
  return (
    <section id="alsen" data-rail="Partner ALSEN" className="t-section t-section--tight t-ui" aria-labelledby="t-halsen-h" data-alsen="">
      <div className="t-container">
        <div className="t-halsen">
          <div className="t-halsen__head">
            <div className="t-halsen__logo">
              <AlsenLogo height={64} />
            </div>
            <div className="t-halsen__text">
              <span className="t-eyb">Partnerzy</span>
              <h2 id="t-halsen-h" className="t-h2 t-halsen__h">
                Autoryzowany partner ALSEN
              </h2>
              <p className="t-lead t-halsen__lead">PRO-KOM jest autoryzowanym partnerem ALSEN — sieci sprzedaży komputerów i elektroniki. Przez nas zamówisz wszystko, co jest na alsen.pl, odbierzesz to w salonie {inCity(partnerPoint.city)} i masz serwis pod ręką.</p>
              <ul className="t-halsen__cats" aria-label="Oferta sieci ALSEN">
                {ALSEN_CATEGORIES.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <a href={partners.alsen.url} target="_blank" rel="noopener" className="t-halsen__ext">
                alsen.pl ↗<span className="t-visually-hidden"> (otwiera się w nowej karcie)</span>
              </a>
            </div>
          </div>
          <ul className="t-halsen__points">
            {POINTS.map((p) => (
              <li key={p.t}>
                <Link href={p.href} className="t-halsen__point">
                  <b>{p.t}</b>
                  <span>{p.s}</span>
                  <span className="t-halsen__cta">
                    {p.cta} <IconArrow size={14} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
