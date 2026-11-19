import Link from "next/link";
import { partners } from "@/config/prokom";
import { alsenPoint } from "@/lib/tech/partners";
import { inCity } from "@/lib/tech/point-format";
import { AlsenLogo } from "../AlsenPartner";
import { IconArrow, IconArrowUpRight } from "../icons";

// Categories exactly as in the alsen.pl menu (read 19.11.2026; „RTV i AGD” and „Inteligentny dom” from the home page).
export const ALSEN_CATEGORIES = ["Laptopy i komputery", "Podzespoły komputerowe", "Urządzenia peryferyjne", "Smartfony i lifestyle", "RTV i AGD", "Inteligentny dom"] as const;

const CATEGORY_ICON: Record<(typeof ALSEN_CATEGORIES)[number], string> = {
  "Laptopy i komputery": "M5 5h14a1 1 0 0 1 1 1v9H4V6a1 1 0 0 1 1-1zM2 18h20",
  "Podzespoły komputerowe": "M7 7h10v10H7zM10 10h4v4h-4zM9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3",
  "Urządzenia peryferyjne": "M3 7h18a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM6 10.5h.01M10 10.5h.01M14 10.5h.01M18 10.5h.01M7 14h10",
  "Smartfony i lifestyle": "M9 2h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2",
  "RTV i AGD": "M3 5h18v12H3zM8 21h8M12 17v4",
  "Inteligentny dom": "M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-5h4v5",
};

// Krystian 19.11.2026: customers can order through us everything that is on alsen.pl; the partner point is the Rabka salon.
const partnerPoint = alsenPoint();
const partnerAddress = `${partnerPoint.street}, ${partnerPoint.city}`;

const STEPS = [
  { t: "Wybierz na alsen.pl", s: "Laptop, podzespoły, telewizor, AGD — cokolwiek jest w ofercie sieci." },
  { t: "Daj nam znać", s: "Zadzwoń, napisz albo wpadnij do salonu. Zamówimy to dla Ciebie." },
  { t: `Odbierz ${inCity(partnerPoint.city)}`, s: `Punkt partnerski: ${partnerAddress}. Serwis masz na miejscu.` },
] as const;

/**
 * Home page section about the ALSEN partnership (Krystian 19.11: „mega premium, mega wyróżniająca”).
 * A red stage in ALSEN's colour — the one loud block on the page — with the logo on a white plate,
 * the network's categories and three steps. Link to alsen.pl in a new tab, rel="noopener". No prices.
 */
export function AlsenSection() {
  return (
    <section id="alsen" data-rail="Partner ALSEN" className="t-section t-section--tight t-ui" aria-labelledby="t-halsen-h" data-alsen="">
      <div className="t-container">
        <div className="t-xal">
          <span className="t-xal__deco" aria-hidden="true" />
          <div className="t-xal__top">
            <div className="t-xal__intro">
              <span className="t-xal__kick">
                <span className="t-xal__dot" aria-hidden="true" />
                Autoryzowany partner ALSEN
              </span>
              <h2 id="t-halsen-h" className="t-xal__h">
                Wszystko z alsen.pl <span>zamówisz u nas.</span>
              </h2>
              <p className="t-xal__lead">
                PRO-KOM jest autoryzowanym partnerem ALSEN — sieci sprzedaży komputerów i elektroniki. Przez nas zamówisz wszystko, co jest na alsen.pl, odbierzesz to w salonie {inCity(partnerPoint.city)} i masz serwis pod ręką.
              </p>
              <div className="t-xal__actions">
                <Link href="/kontakt" className="t-xal__btn">
                  Zapytaj o produkt
                  <IconArrow size={17} strokeWidth={2.6} />
                </Link>
                <a href={partners.alsen.url} target="_blank" rel="noopener" className="t-xal__btn t-xal__btn--ghost">
                  alsen.pl
                  <IconArrowUpRight size={16} strokeWidth={2.4} />
                  <span className="t-visually-hidden"> (otwiera się w nowej karcie)</span>
                </a>
              </div>
            </div>
            <div className="t-xal__brand">
              <div className="t-xal__plate">
                <AlsenLogo height={84} className="t-xal__logo" />
                <span className="t-xal__where">
                  <b>Punkt partnerski</b>
                  {partnerAddress}
                </span>
              </div>
            </div>
          </div>
          <ul className="t-xal__cats" aria-label="Oferta sieci ALSEN">
            {ALSEN_CATEGORIES.map((c) => (
              <li key={c} className="t-xal__cat">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={CATEGORY_ICON[c]} />
                </svg>
                {c}
              </li>
            ))}
          </ul>
          <ol className="t-xal__steps" aria-label="Jak zamówić przez PRO-KOM">
            {STEPS.map((s, i) => (
              <li key={s.t} className="t-xal__step">
                <span className="t-xal__num" aria-hidden="true">
                  {i + 1}
                </span>
                <b>{s.t}</b>
                <span>{s.s}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
