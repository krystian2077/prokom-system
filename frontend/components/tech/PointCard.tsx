import Image from "next/image";
import Link from "next/link";
import { GENERAL_EMAIL_LABEL, company, pointEmail, pointPhone, telHref } from "@/config/prokom";
import { POINT_MAPS } from "@/lib/tech/point-maps";
import { IconPhoneCall } from "./icons";
import { PageIconSvg } from "./page-icons";
import type { VisiblePoint } from "@/lib/tech/points";
import { AlsenBadge } from "./AlsenPartner";
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
  const photoMap = POINT_MAPS[point.key];
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
        {feature && photoMap ? (
          // real street map of the point (static OSM image) with the pin and a route shortcut
          <div className="t-pcmap" role="img" aria-label={`Mapa okolicy: ${pointAddress(point)}`}>
            <Image src={photoMap.src} alt="" fill sizes="(min-width: 1024px) 620px, 100vw" className="t-pcmap__img" />
            <span className="t-pcmap__pin" aria-hidden="true" />
            <span className="t-pcmap__attr">© OpenStreetMap</span>
          </div>
        ) : (
          <OsmMap sub={pointAddress(point)} label={false} height={layout === "wide" ? 270 : feature ? 260 : 200} radius={18} />
        )}
      </div>
      <div className="t-pointcard__body">
        <div className="t-pointcard__top">
          <span className="t-pointcard__kicker">
            {main ? "Serwis · punkt główny" : `Serwis · punkt ${inCity(point.city)}`}
            {point.draft ? <span className="t-draft-badge">do uzupełnienia</span> : null}
          </span>
          <OpeningStatus points={[point]} variant="pill" skeletonCh={9} />
        </div>
        {feature ? (
          // the ALSEN badge sits beside the name, so both salon cards keep their rows aligned
          <div className="t-pointcard__namerow">
            <H className="t-pointcard__name">{point.name}</H>
            <AlsenBadge point={point} />
          </div>
        ) : (
          <>
            <H className="t-pointcard__name">{point.name}</H>
            <AlsenBadge point={point} />
          </>
        )}
        <p className="t-pointcard__addr">
          {point.street ? `${point.street}, ` : null}
          <span className="t-nowrap">
            {point.postal} {point.city}
          </span>
        </p>
        {feature ? (
          // boss 22–23.11: the point's own number and mailbox, big and tappable
          <div className="t-pccontact">
            <a href={telHref(pointPhone(point))} className="t-pccontact__tel" data-track="telefon_klik" data-track-miejsce={`${trackFrom}_${point.key}`}>
              <span className="t-pccontact__ico" aria-hidden="true">
                <IconPhoneCall size={20} />
              </span>
              <span className="t-pccontact__num">{pointPhoneDisplay(point)}</span>
            </a>
            <a href={`mailto:${pointEmail(point).email}`} className="t-pccontact__mail" data-track="email_klik" data-track-miejsce={`${trackFrom}_${point.key}`}>
              <PageIconSvg icon="mail" size={17} />
              <span>
                {pointEmail(point).email.split("@")[0]}@<wbr />
                {pointEmail(point).email.split("@")[1]}
              </span>
            </a>
          </div>
        ) : null}
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
        {feature ? (
          main ? (
            <p className="t-pointcard__meta">
              {company.name} · NIP {company.nip} ·{" "}
              <a href={CEIDG_URL} target="_blank" rel="noopener noreferrer" className="t-pointcard__ceidg">
                Sprawdź w CEIDG ↗
              </a>
            </p>
          ) : null
        ) : (
          <p className="t-pointcard__meta">
            Telefon:{" "}
            <a href={telHref(pointPhone(point))} data-track="telefon_klik" data-track-miejsce={`${trackFrom}_${point.key}`}>
              {pointPhoneDisplay(point)}
            </a>
            {" · "}
            {pointEmail(point).general ? `${GENERAL_EMAIL_LABEL}: ` : "E-mail: "}
            <a href={`mailto:${pointEmail(point).email}`} className="t-pointcard__mail">
              {pointEmail(point).email}
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
        )}
      </div>
    </article>
  );
}
