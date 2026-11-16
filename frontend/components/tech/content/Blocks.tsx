import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { Titled } from "@/lib/tech/content-types";
import { IconArrow, IconCheck } from "../icons";

/**
 * Content blocks shared by device pages and repair pages (2026-11). Plain Server
 * Components with semantic headings (H2 per section, H3 per card). Styles: tech-pages.css.
 */

type Head = { id: string; rail: string; eyebrow: string; title: string; lead?: ReactNode; alt?: boolean };

export function Section({ id, rail, eyebrow, title, lead, alt, children, className = "" }: Head & { children: ReactNode; className?: string }) {
  return (
    <section className={`t-section t-section--tight${alt ? " t-section--alt" : ""} ${className}`} id={id} data-rail={rail}>
      <div className="t-container">
        <div className="t-cb-head">
          <span className="t-eyebrow">{eyebrow}</span>
          <h2 className="t-h2 t-h2--sm">{title}</h2>
          {lead ? <p className="t-lead">{lead}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

/** Numbered cards (causes, tips). */
export function CardGrid({ items, numbered = false, tone = "plain" }: { items: Titled[]; numbered?: boolean; tone?: "plain" | "tip" }) {
  return (
    <ul className={`t-cb-grid t-cb-grid--${Math.min(items.length, 3)}`} data-t-stagger="">
      {items.map((it, i) => (
        <li key={it.t} className={`t-card t-cb-card t-cb-card--${tone}`}>
          {numbered ? (
            <span className="t-cb-card__n" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
          ) : null}
          <h3 className="t-h3 t-cb-card__t">{it.t}</h3>
          <p>{it.s}</p>
        </li>
      ))}
    </ul>
  );
}

/** Check list (what to expect, what to prepare). */
export function CheckList({ items, tone = "ok" }: { items: string[]; tone?: "ok" | "acc" }) {
  return (
    <ul className={`t-cb-check t-cb-check--${tone}`}>
      {items.map((it) => (
        <li key={it}>
          <span aria-hidden="true">
            <IconCheck size={14} />
          </span>
          {it}
        </li>
      ))}
    </ul>
  );
}

/** Prose paragraphs with a highlighted aside (parts: original or replacement). */
export function Prose({ paragraphs, aside }: { paragraphs: string[]; aside?: ReactNode }) {
  return (
    <div className={`t-cb-prose${aside ? " has-aside" : ""}`}>
      <div className="t-cb-prose__txt">
        {paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      {aside ? <aside className="t-cb-prose__aside">{aside}</aside> : null}
    </div>
  );
}

/** Row of internal links (device page, courier, guide, blog). */
export function LinkTiles({ items }: { items: { href: string; t: string; s: string }[] }) {
  return (
    <ul className="t-cb-links" data-t-stagger="">
      {items.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className="t-card t-cb-link">
            <span>
              <b>{l.t}</b>
              <span>{l.s}</span>
            </span>
            <IconArrow size={16} strokeWidth={2.6} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Steps on a timeline (PREMIUM §1 "oś rysowana"): numbered nodes joined by a line that
 * draws itself (stroke-dashoffset) step after step when the list enters the viewport
 * (MotionRoot reveal → `.is-in`). Without JS or with reduced motion: final state.
 * `horizontal`: on wide screens the steps sit in one row and the line runs sideways.
 */
export function Timeline({
  steps,
  tone = "light",
  horizontal = false,
}: {
  steps: { t?: string; s: string; draft?: boolean; lead?: boolean }[];
  tone?: "light" | "stage";
  horizontal?: boolean;
}) {
  return (
    <div className={`t-tline t-tline--${tone}${horizontal ? " t-tline--h" : ""}`} data-t-reveal="fade">
      <ol>
        {steps.map((st, i) => (
          <li key={st.t ?? st.s} className={`t-tline__step${st.draft ? " t-draft" : ""}`} style={{ "--i": i } as CSSProperties}>
            <span className={`t-tline__n${st.lead ? " is-lead" : ""}`} aria-hidden="true">
              {i + 1}
            </span>
            {i < steps.length - 1 ? (
              <>
                <svg className="t-tline__seg t-tline__seg--v" aria-hidden="true" focusable="false">
                  <line x1="1" y1="0" x2="1" y2="100%" pathLength={1} />
                </svg>
                {horizontal ? (
                  <svg className="t-tline__seg t-tline__seg--h" aria-hidden="true" focusable="false">
                    <line x1="0" y1="1" x2="100%" y2="1" pathLength={1} />
                  </svg>
                ) : null}
              </>
            ) : null}
            <div className="t-tline__body">
              {st.t ? <h3 className="t-h3 t-tline__t">{st.t}</h3> : null}
              <p>{st.s}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
