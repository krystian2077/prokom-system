import { Fragment } from "react";
import { GENERAL_PHONE_LABEL, line, pointEmail, telHref } from "@/config/prokom";
import { hoursLong, pointPhoneDisplay } from "@/lib/tech/point-format";
import { callPoints, type VisiblePoint } from "@/lib/tech/points";
import { IconPhoneCall } from "./icons";
import { PageIconSvg } from "./page-icons";
import { OpeningStatus } from "./OpeningStatus";

/**
 * Boss 22.11: the main numbers are the two points' own (Rabka-Zdrój, Zakopane); the general line
 * is shown only as a quiet „Infolinia” note. One component for every call button.
 */

/**
 * Segmented call buttons: one half per point, city on top, number below.
 * Colours follow `currentColor`, so the group fits dark stages and light cards alike.
 */
export function PointCalls({ track, className = "", points = callPoints(), size = "md" }: { track: string; className?: string; points?: VisiblePoint[]; size?: "sm" | "md" | "lg" }) {
  return (
    <div className={`t-pcalls t-pcalls--${size} ${className}`} role="group" aria-label="Zadzwoń do punktu">
      {points.map((p) => (
        <a key={p.key} href={telHref(p.phone)} className={`t-pcall${p.draft ? " t-draft" : ""}`} data-track="telefon_klik" data-track-miejsce={track} data-track-punkt={p.key}>
          <IconPhoneCall size={size === "sm" ? 15 : 17} className="t-pcall__ico" />
          <span className="t-pcall__txt">
            <small>{p.name}</small>
            <b>{pointPhoneDisplay(p)}</b>
          </span>
        </a>
      ))}
    </div>
  );
}

/**
 * Contact cards for the dark contact heroes (/kontakt, /punkty-serwisowe), one per point (boss 22–23.11):
 * city + live status, a big tappable number, the point's mailbox as a button and its opening hours.
 */
export function PointPhonesBig({ track, className = "", points = callPoints() }: { track: string; className?: string; points?: VisiblePoint[] }) {
  return (
    <div className={`t-bigphones ${className}`}>
      {points.map((p) => {
        const mail = pointEmail(p);
        return (
          <div key={p.key} className={`t-bigphones__item${p.draft ? " t-draft" : ""}`}>
            <div className="t-bigphones__head">
              <span className="t-bigphones__city">{p.name}</span>
              <OpeningStatus points={[p]} className="t-status--stage-text t-bigphones__status" skeletonCh={12} />
            </div>
            <a href={telHref(p.phone)} className="t-bigphones__tel" data-track="telefon_klik" data-track-miejsce={track} data-track-punkt={p.key}>
              <span className="t-bigphones__ico" aria-hidden="true">
                <IconPhoneCall size={20} />
              </span>
              <span className="t-bigphones__num">{pointPhoneDisplay(p)}</span>
            </a>
            {/* until a point has its own mailbox the general one is not repeated in its card */}
            {mail.general ? null : (
              <a href={`mailto:${mail.email}`} className="t-bigphones__mail" data-track="email_klik" data-track-miejsce={track} data-track-punkt={p.key}>
                <PageIconSvg icon="mail" size={17} />
                <span>
                  {mail.email.split("@")[0]}@<wbr />
                  {mail.email.split("@")[1]}
                </span>
              </a>
            )}
            <span className="t-bigphones__hours">
              <PageIconSvg icon="clock" size={15} />
              {hoursLong(p)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Inline form for sentences: „<city> <number> · <city> <number>” (each a tel link). */
export function PointPhonesInline({ track, points = callPoints() }: { track: string; points?: VisiblePoint[] }) {
  return (
    <>
      {points.map((p, i) => (
        <Fragment key={p.key}>
          {i > 0 ? " · " : null}
          <span className="t-nowrap">
            {p.name}{" "}
            <a href={telHref(p.phone)} data-t-inline="" data-track="telefon_klik" data-track-miejsce={track} data-track-punkt={p.key}>
              {pointPhoneDisplay(p)}
            </a>
          </span>
        </Fragment>
      ))}
    </>
  );
}

/** The general line, deliberately quiet: „Infolinia (oba punkty): <general number>”. */
export function GeneralLineNote({ track, className = "" }: { track: string; className?: string }) {
  const many = callPoints().length > 1;
  return (
    <span className={`t-genline ${className}`}>
      {GENERAL_PHONE_LABEL}
      {many ? " (oba punkty)" : ""}:{" "}
      <a href={telHref(line.phone)} data-track="telefon_klik" data-track-miejsce={track}>
        {line.phoneDisplay}
      </a>
    </span>
  );
}
