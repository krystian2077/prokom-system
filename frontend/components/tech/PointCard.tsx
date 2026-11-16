import Link from "next/link";
import { company, pointPhone, telHref } from "@/config/prokom";
import type { VisiblePoint } from "@/lib/tech/points";
import { CEIDG_URL, inCity, isMainPoint, pointAddress, pointPhoneDisplay } from "@/lib/tech/point-format";
import { SUBMIT_HREF } from "@/lib/tech/nav";
import { HoursChips } from "./HoursChips";
import { NavigateButtons } from "./NavigateButtons";
import { OpeningStatus } from "./OpeningStatus";
import { OsmMap } from "./OsmMap";

type Props = {
  point: VisiblePoint;
  /** "wide": map on the left; "stack": map on top; "feature": large card of the points page (map on top, parking as a chip). */
  layout?: "wide" | "stack" | "feature";
  /** Heading level of the point name (h2 on the points page, h3 inside sections). */
  as?: "h2" | "h3";
  /** Where the phone click is measured from (telefon_klik.miejsce). */
  trackFrom?: string;
  /** Second action: "submit" → report a repair at this point, or a custom link. */
  secondary?: "submit" | { label: string; href: string } | null;
  className?: string;
  /** Anchor id (e.g. the point key on /punkty-serwisowe, target of `#rabka` links). */
  id?: string;
};

/**
 * Service point card (SPEC §7, §12.1, §12.8): address, live "Otwarte teraz" per point,
 * hours chips, phone, navigation (Google/Apple/Waze) and parking note.
 * Unpublished points reach this only on staging (NEXT_PUBLIC_TECH_DRAFT=1) and get the
 * "do uzupełnienia" frame.
 */
export function PointCard({ point, layout = "wide", as: H = "h2", trackFrom = "punkt", secondary = "submit", className, id }: Props) {
  const main = isMainPoint(point);
  const feature = layout === "feature";
  const second =
    secondary === "submit"
      ? { label: "Zgłoś naprawę tutaj", href: `${SUBMIT_HREF}?punkt=${point.key}` }
      : secondary;
  return (
    <article
      id={id}
      className={`t-pointcard t-pointcard--${layout}${point.draft ? " t-draft" : ""}${className ? ` ${className}` : ""}`}
      aria-label={`Punkt serwisowy ${point.name}`}
    >
      <div className="t-pointcard__map">
        <OsmMap sub={pointAddress(point)} label={false} height={layout === "wide" ? 270 : feature ? 260 : 200} radius={18} />
      </div>
      <div className="t-pointcard__body">
        <div className="t-pointcard__top">
          <span className="t-pointcard__kicker">
            {main ? "Serwis · punkt główny" : `Serwis · punkt ${inCity(point.city)}`}
            {point.draft ? <span className="t-draft-badge">do uzupełnienia</span> : null}
          </span>
          <OpeningStatus points={[point]} variant="pill" skeletonCh={9} />
        </div>
        <H className="t-pointcard__name">{point.name}</H>
        <p className="t-pointcard__addr">
          {point.street ? `${point.street}, ` : null}
          <span className="t-nowrap">
            {point.postal} {point.city}
          </span>
        </p>
        <HoursChips point={point} />
        {feature && point.parkingNote ? (
          <p className="t-pointcard__park">
            <b aria-hidden="true">P</b>
            {point.parkingNote}
          </p>
        ) : null}
        <div className="t-pointcard__actions">
          <NavigateButtons point={feature ? { ...point, parkingNote: null } : point} />
          {second ? (
            <Link href={second.href} className="t-pbtn t-pbtn--outline t-pbtn--m">
              {second.label}
            </Link>
          ) : null}
        </div>
        <p className="t-pointcard__meta">
          Telefon:{" "}
          <a href={telHref(pointPhone(point))} data-track="telefon_klik" data-track-miejsce={`${trackFrom}_${point.key}`}>
            {pointPhoneDisplay(point)}
          </a>
          {main ? (
            <>
              {" "}
              · {company.name} · NIP {company.nip} ·{" "}
              <a href={CEIDG_URL} target="_blank" rel="noopener noreferrer" className="t-pointcard__ceidg">
                Sprawdź w CEIDG ↗
              </a>
            </>
          ) : null}
        </p>
      </div>
    </article>
  );
}
