import Link from "next/link";
import type { ReactNode } from "react";
import { IconArrow } from "./icons";
import { PointCalls } from "./PointCalls";

type Action = { label: ReactNode; href: string; tel?: boolean; track?: string };

/** Dark stage band with a call to action (design `.stg` CTA on #punkty-serwisowe, #o-firmie). */
export function CtaBand({ eyebrow, title, primary, secondary }: { eyebrow: string; title: string; primary: Action; secondary?: Action }) {
  // a phone action always means the points' own numbers (boss 22.11), never the general line
  const link = (a: Action, cls: string, arrow = false) =>
    a.tel ? (
      <PointCalls track={a.track ?? "cta"} size="lg" className="t-ctaband__calls" />
    ) : (
      <Link href={a.href} className={cls}>
        {a.label}
        {arrow ? <IconArrow size={16} strokeWidth={2.6} /> : null}
      </Link>
    );
  return (
    <section className="t-ctaband-wrap">
      <div className="t-container">
        <div className="t-stage t-ctaband">
          <div className="t-ctaband__text">
            <span className="t-eyebrow t-eyebrow--stage">{eyebrow}</span>
            <p className="t-ctaband__title">{title}</p>
          </div>
          <div className="t-ctaband__actions">
            {link(primary, "t-pbtn t-pbtn--stage", true)}
            {secondary ? link(secondary, "t-pbtn t-pbtn--ghost-dark") : null}
          </div>
        </div>
      </div>
    </section>
  );
}
