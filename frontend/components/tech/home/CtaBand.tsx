import Link from "next/link";
import { line, telHref } from "@/config/prokom";
import { POINTS_HREF, SUBMIT_HREF } from "@/lib/tech/nav";
import type { VisiblePoint } from "@/lib/tech/points";
import { pointLocative } from "@/lib/tech/towns";
import { OpeningStatus } from "../OpeningStatus";

/** Closing call to action (design T.Main `#kontakt`). */
export function CtaBand({ points }: { points: VisiblePoint[] }) {
  const places = points.map((p) => pointLocative[p.key]).join(", ");
  const lead = places
    ? `Online albo telefonicznie. Wybierasz punkt ${places} albo wysyłkę kurierem.`
    : "Online albo telefonicznie. Możesz też wysłać sprzęt kurierem.";
  return (
    <section className="t-ctasec t-ui" aria-labelledby="t-cta-h">
      <div className="t-container">
        <div className="t-cta-band">
          <span className="t-cta-band__ring t-cta-band__ring--1" aria-hidden="true" />
          <span className="t-cta-band__ring t-cta-band__ring--2" aria-hidden="true" />
          <div className="t-cta-band__text">
            <span className="t-eyb t-eyb--dark">Zgłoszenie naprawy</span>
            <h2 id="t-cta-h" className="t-h2 t-cta-band__h">
              Zepsuło się? Zgłoś naprawę w minutę.
            </h2>
            <p className="t-lead t-cta-band__lead">{lead}</p>
            <div className="t-cta-band__actions">
              <Link href={SUBMIT_HREF} className="t-sbtn t-sbtn--lg" data-track="zgloszenie_start" data-track-zrodlo="przycisk">
                Zgłoś naprawę online
              </Link>
              <a href={telHref(line.phone)} className="t-sbtn t-sbtn--lg t-sbtn--ghost" data-track="telefon_klik" data-track-miejsce="glowna-cta">
                Zadzwoń: {line.phoneDisplay}
              </a>
            </div>
          </div>
          <div className="t-cta-band__points">
            {points.map((p) => (
              <Link key={p.key} href={`${POINTS_HREF}#${p.key}`} className={`t-cta-band__point${p.draft ? " t-draft" : ""}`}>
                <span className="t-cta-band__pinfo">
                  <b>{p.name}</b>
                  <span>{p.street}</span>
                </span>
                <OpeningStatus points={[p]} variant="pill" className="t-status--dark" skeletonCh={10} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
