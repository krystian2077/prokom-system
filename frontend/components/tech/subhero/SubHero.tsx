import Link from "next/link";
import type { ReactNode } from "react";
import { PointCalls } from "../PointCalls";
import { claim } from "@/lib/tech/claims";
import { courierPageHref } from "@/lib/tech/courier";
import { POINTS_HREF } from "@/lib/tech/nav";
import type { VisiblePoint } from "@/lib/tech/points";
import type { Crumb } from "@/lib/tech/seo";
import type { HeroPromise } from "@/lib/tech/subhero";
import { Breadcrumbs } from "../Breadcrumbs";
import { IconArrow, IconCheck, IconPath, IconPin, IconWrench } from "../icons";
import { OpeningStatus } from "../OpeningStatus";

export type SubHeroProps = {
  crumbs: Crumb[];
  /** Small line above the H1 ("Naprawa telefonu", "Serwis · laptopy"). */
  eyebrow: string;
  /** H1 with the SEO phrase ("Serwis laptopów", "Wymiana ekranu iPhone"). */
  title: string;
  /** Second H1 line in the accent colour (cities). */
  accent?: string;
  /** 1–2 sentences of benefit. */
  lead: string;
  primary: { label: string; href: string };
  /** data-track-miejsce of the phone button. */
  trackPlace: string;
  promises: HeroPromise[];
  /** Right side of the stage: FaultVisual or the hub collage. */
  visual: ReactNode;
  /** Mini "status naprawy online" card on the stage (≥ 1024). */
  statusCard?: boolean;
  points: VisiblePoint[];
  rail: string;
  /** Extra class on the stage (e.g. the hub variant). */
  variant?: "hub" | "device" | "repair";
};

/**
 * One hero system for every sub-page (hub, device pages, /naprawy/[slug]) — same scene as
 * the home hero: dark stage with glow, grain and orbit lines, H1 with the SEO phrase,
 * benefit, 2 CTAs (form prefilled per KONTRAKT §1.4 + phone from prokom.ts), 3 confirmed
 * promises, then a bar with both points (live OpeningStatus) and the courier repair.
 * Server Component; only the visual and the status are client islands.
 */
export function SubHero({ crumbs, eyebrow, title, accent, lead, primary, trackPlace, promises, visual, statusCard = false, points, rail, variant = "device" }: SubHeroProps) {
  const courierHref = courierPageHref();
  const courierWhere = claim("courierWholeCountry");
  return (
    <section className={`t-shero t-shero--${variant}`} id="start" data-rail={rail} aria-labelledby="t-shero-h1">
      <div className="t-container">
        <div className="t-shero__stage">
          <span className="t-shero__orbit" aria-hidden="true" />
          <div className="t-shero__copy">
            <Breadcrumbs items={crumbs} separator="/" />
            <span className="t-shero__eyebrow">
              <i aria-hidden="true" />
              {eyebrow}
            </span>
            <h1 id="t-shero-h1" className="t-shero__h1">
              {title}
              {accent ? <span>{accent}</span> : null}
            </h1>
            <p className="t-shero__lead">{lead}</p>
            <div className="t-shero__actions">
              <Link href={primary.href} className="t-hbtn t-hbtn--acc t-shine t-shero__submit" data-track="zgloszenie_start" data-track-zrodlo="hero_podstrony">
                <IconWrench size={18} />
                {primary.label}
              </Link>
              <PointCalls track={trackPlace} size="lg" className="t-shero__calls" />
            </div>
            <ul className="t-shero__promises">
              {promises.map((p) => (
                <li key={p.text} className={p.draft ? "t-draft" : undefined}>
                  <IconCheck size={15} />
                  {p.text}
                </li>
              ))}
            </ul>
          </div>
          <div className="t-shero__visual">
            {visual}
            {statusCard ? <StatusCard /> : null}
          </div>
        </div>

        <div className="t-shero__bar">
          {points.map((p) => (
            <Link key={p.key} href={`${POINTS_HREF}#${p.key}`} className={`t-shero__point${p.draft ? " t-draft" : ""}`}>
              <span className="t-ico t-ico--sm" aria-hidden="true">
                <IconPin size={19} />
              </span>
              <span className="t-shero__pinfo">
                <b>Salon {p.city}</b>
                <span>
                  {p.street}
                  {" · "}
                  <OpeningStatus points={[p]} className="t-shero__pstatus" skeletonCh={13} />
                </span>
              </span>
              <IconArrow size={16} strokeWidth={2.6} className="t-shero__parrow" />
            </Link>
          ))}
          {courierHref ? (
            <Link href={courierHref} className="t-shero__point t-shero__point--courier">
              <span className="t-ico t-ico--sm" aria-hidden="true">
                <IconPath icon="truck" size={19} />
              </span>
              <span className="t-shero__pinfo">
                <b>Naprawa kurierem</b>
                <span>{courierWhere ? `Wyślij sprzęt ${courierWhere.text}` : "Wyślij sprzęt do serwisu"}</span>
              </span>
              <IconArrow size={16} strokeWidth={2.6} className="t-shero__parrow" />
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** Decorative "status online" card — the stages of the real tracker (KONTRAKT §3). */
function StatusCard() {
  return (
    <div className="t-shero__status" aria-hidden="true">
      <b>Status naprawy online</b>
      <ol>
        <li className="is-done">
          <i />
          Przyjęte
        </li>
        <li className="is-done">
          <i />
          Diagnoza
        </li>
        <li className="is-now">
          <i />
          Wycena do akceptacji
        </li>
      </ol>
    </div>
  );
}
