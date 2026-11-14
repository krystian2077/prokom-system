import Link from "next/link";
import type { Metadata } from "next";
import { line, telHref } from "@/config/prokom";
import { DeviceGlyph, IconArrow } from "@/components/tech/icons";
import { repairLinks, SUBMIT_HREF, TRACK_HREF } from "@/lib/tech/nav";

export const metadata: Metadata = { title: "Nie ma takiej strony", robots: { index: false, follow: true } };

/** 404 in the Tech skin (SPEC §6). */
export default function NotFound() {
  return (
    <div className="t-ui t-page t-404">
      <section className="t-section--hero" id="404" data-rail="404">
        <div className="t-container">
          <div className="t-stage t-404__stage">
            <span className="t-404__code" aria-hidden="true">
              404
            </span>
            <div className="t-404__text">
              <span className="t-eyebrow t-eyebrow--stage">Błąd 404</span>
              <h1 className="t-bhero__h1">
                Nie ma takiej strony <span>Może zmienił się adres albo w linku jest literówka.</span>
              </h1>
              <div className="t-btnrow">
                <Link href="/" className="t-pbtn t-pbtn--stage">
                  Strona główna
                </Link>
                <Link href={SUBMIT_HREF} className="t-pbtn t-pbtn--ghost-dark">
                  Zgłoś naprawę
                </Link>
                <Link href={TRACK_HREF} className="t-pbtn t-pbtn--ghost-dark">
                  Status naprawy
                </Link>
              </div>
              <p className="t-bhero__lead">
                Potrzebujesz pomocy? Zadzwoń:{" "}
                <a href={telHref(line.phone)} className="t-bhero__tel" data-t-inline="" data-track="telefon_klik" data-track-miejsce="404">
                  {line.phoneDisplay}
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
      <nav className="t-section t-section--tight" aria-label="Naprawy">
        <div className="t-container">
          <h2 className="t-h2 t-h2--sm">Szukasz naprawy?</h2>
          <ul className="t-dev-more__list">
            {repairLinks.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className="t-chiplink">
                  <DeviceGlyph icon={r.icon} size={18} />
                  {r.label}
                  <IconArrow size={14} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
}
