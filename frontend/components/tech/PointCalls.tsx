import { Fragment } from "react";
import { GENERAL_PHONE_LABEL, line, telHref } from "@/config/prokom";
import { pointPhoneDisplay } from "@/lib/tech/point-format";
import { callPoints, type VisiblePoint } from "@/lib/tech/points";
import { IconPhoneCall } from "./icons";

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

/** Big numbers for the contact heroes (/kontakt, /punkty-serwisowe): city label above each number. */
export function PointPhonesBig({ track, className = "", points = callPoints() }: { track: string; className?: string; points?: VisiblePoint[] }) {
  return (
    <div className={`t-bigphones ${className}`}>
      {points.map((p) => (
        <a key={p.key} href={telHref(p.phone)} className={`t-bigphones__item${p.draft ? " t-draft" : ""}`} data-track="telefon_klik" data-track-miejsce={track} data-track-punkt={p.key}>
          <span>{p.name}</span>
          <b>{pointPhoneDisplay(p)}</b>
        </a>
      ))}
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
