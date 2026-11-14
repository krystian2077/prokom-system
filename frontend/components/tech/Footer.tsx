import Link from "next/link";
import { line, telHref } from "@/config/prokom";
import { hoursSummary } from "@/lib/tech/hours";
import { directionsUrl, footerColumns } from "@/lib/tech/nav";
import type { VisiblePoint } from "@/lib/tech/points";
import { IconCheck } from "./icons";
import { LegalBar } from "./LegalBar";
import { LinesBand } from "./LinesBand";
import { Logo } from "./Logo";
import { OsmMap } from "./OsmMap";

const PROMISES = ["Diagnoza i wycena przed naprawą", "Status naprawy online", "Otwarte także w soboty"];

/** Footer (design T.Stopka) — always dark, both themes. */
export function Footer({ points, publishedCount }: { points: VisiblePoint[]; publishedCount: number }) {
  // Two points are mentioned only once Zakopane is published (SPEC §5).
  const twoPoints = publishedCount > 1;
  const intro = twoPoints
    ? "Serwis telefonów, laptopów, tabletów, konsol i drukarek. Dwa punkty na Podhalu: Rabka-Zdrój i Zakopane. Folie Hammer Glass wycinane na miejscu."
    : "Serwis telefonów, laptopów, tabletów, konsol i drukarek w Rabce-Zdroju na Podhalu. Folie Hammer Glass wycinane na miejscu.";
  return (
    <footer className="t-footer t-ui" data-t-region="footer">
      <div className="t-container">
        <div className="t-footer__grid">
          <div className="t-footer__brand">
            <Logo size={28} dark />
            <p>{intro}</p>
            <ul className="t-footer__promises">
              {PROMISES.map((p) => (
                <li key={p}>
                  <IconCheck />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {footerColumns.map((c) => (
            <nav key={c.title} aria-label={c.title} className="t-footer__col">
              <span className="t-footer__h">{c.title}</span>
              {c.items.map((i) => (
                <Link key={i.href + i.label} href={i.href}>
                  {i.label}
                </Link>
              ))}
            </nav>
          ))}

          <div className="t-footer__points">
            <span className="t-footer__h">Punkty serwisowe</span>
            <div className="t-footer__contact">
              <a href={telHref(line.phone)} className="t-footer__phone" data-track="telefon_klik" data-track-miejsce="stopka">
                {line.phoneDisplay}
              </a>
              <a href={`mailto:${line.email}`} className="t-footer__mail">
                {line.email}
              </a>
            </div>
            <div className={`t-footer__cards${points.length === 1 ? " is-single" : ""}`}>
              {points.map((p) => (
                <div key={p.key} className={`t-footer__card${p.draft ? " t-draft" : ""}`}>
                  {p.geo ? (
                    <a href={directionsUrl(p.geo)} className="t-footer__map" aria-label={`Wyznacz trasę do punktu: ${p.name}`} target="_blank" rel="noopener noreferrer">
                      <OsmMap sub={`${p.street ?? ""}, ${p.city}`} label={false} height={84} radius={10} dark />
                      <span className="t-footer__route">Wyznacz trasę ↗</span>
                    </a>
                  ) : null}
                  <span className="t-footer__pname">
                    {p.name}
                    {p.draft ? <span className="t-draft-badge">do uzupełnienia</span> : null}
                  </span>
                  <span className="t-footer__addr">
                    {p.street}
                    <br />
                    {p.postal} {p.city}
                  </span>
                  <span className="t-footer__hours">
                    <i aria-hidden="true" />
                    {hoursSummary(p)}
                  </span>
                </div>
              ))}
            </div>
            <span className="t-footer__note">{twoPoints ? "Wycena przed naprawą · ten sam cennik i gwarancja w obu punktach" : "Wycena przed naprawą · gwarancja na usługę i części"}</span>
          </div>
        </div>
        <LinesBand />
        <LegalBar />
      </div>
    </footer>
  );
}
