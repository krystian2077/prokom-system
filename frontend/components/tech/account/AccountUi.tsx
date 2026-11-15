"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { getStatusBadgeProps, type DeviceCategory, type RepairStatus } from "@/types/panel";
import type { DeviceIcon } from "@/lib/tech/nav";
import { DeviceGlyph, IconWrench } from "../icons";

/* Building blocks of the logged-in client account in the Tech skin (styles: app/client/client-tech.css). */

const DEVICE_ICON: Partial<Record<DeviceCategory, DeviceIcon>> = {
  Telefon: "phone",
  Laptop: "laptop",
  Tablet: "tablet",
  Komputer: "pc",
  Drukarka: "printer",
  Konsola: "console",
};

/** Device tile with the public-site device glyph (no emoji). */
export function DeviceBadge({ category, size = "m" }: { category: DeviceCategory | string | null | undefined; size?: "s" | "m" | "l" }) {
  const icon = DEVICE_ICON[(category ?? "") as DeviceCategory];
  const px = size === "l" ? 30 : size === "s" ? 18 : 22;
  return (
    <span className={`t-ck-dev t-ck-dev--${size}`} aria-hidden="true">
      {icon ? <DeviceGlyph icon={icon} size={px} strokeWidth={1.9} /> : <IconWrench size={px - 2} strokeWidth={2} />}
    </span>
  );
}

type Tone = "new" | "wait" | "progress" | "ready" | "done";

/** Repair status as a pill — same labels as before (labelOverride = status from the API). */
export function StatusPill({ status, label, large }: { status: RepairStatus; label?: string | null; large?: boolean }) {
  const { label: fallback, className } = getStatusBadgeProps(status);
  const tone: Tone = status === "cancelled" ? "new" : className;
  const text = (label ?? "").trim() || fallback;
  return (
    <span className={`t-ck-pill t-ck-pill--${tone}${large ? " t-ck-pill--l" : ""}`}>
      <i aria-hidden="true" />
      {text}
    </span>
  );
}

/** Page heading of an account screen. */
export function PageHead({ eyebrow = "Konto klienta", title, lead, actions }: { eyebrow?: string; title: ReactNode; lead?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="t-ck-head">
      <div className="t-ck-head__text">
        <span className="t-eyb">{eyebrow}</span>
        <h1 className="t-ck-head__title">{title}</h1>
        {lead ? <p className="t-ck-head__lead">{lead}</p> : null}
      </div>
      {actions ? <div className="t-ck-head__actions">{actions}</div> : null}
    </header>
  );
}

/** Card section with a header row (icon, title, description, optional action). */
export function Panel({
  title,
  desc,
  icon,
  action,
  children,
  className,
  tone,
  id,
}: {
  title: ReactNode;
  desc?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: "wait" | "ok";
  id?: string;
}) {
  return (
    <section id={id} className={`t-ck-card t-ck-panel2${tone ? ` t-ck-panel2--${tone}` : ""}${className ? ` ${className}` : ""}`}>
      <div className="t-ck-panel2__head">
        {icon ? (
          <span className="t-ck-panel2__ico" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <div className="t-ck-panel2__titles">
          <h2>{title}</h2>
          {desc ? <p>{desc}</p> : null}
        </div>
        {action ? <div className="t-ck-panel2__action">{action}</div> : null}
      </div>
      <div className="t-ck-panel2__body">{children}</div>
    </section>
  );
}

export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: ReactNode; action?: ReactNode }) {
  return (
    <div className="t-ck-empty">
      <span className="t-ck-empty__ico" aria-hidden="true">
        {icon ?? <IconWrench size={24} strokeWidth={2} />}
      </span>
      <p className="t-ck-empty__title">{title}</p>
      {text ? <p className="t-ck-empty__text">{text}</p> : null}
      {action}
    </div>
  );
}

/** Loading placeholder bars. */
export function Skel({ w = "100%", h = 14, r = 8, className }: { w?: string | number; h?: number; r?: number; className?: string }) {
  return <span className={`t-ck-skel${className ? ` ${className}` : ""}`} style={{ width: w, height: h, borderRadius: r }} aria-hidden="true" />;
}

/** Full-width error card with a reload button (message as returned by the API). */
export function ErrorCard({ title = "Nie udało się załadować danych", message, back }: { title?: string; message: string; back?: { href: string; label: string } }) {
  return (
    <div className="t-ck-card t-ck-error" role="alert">
      <p className="t-ck-error__title">{title}</p>
      <p className="t-ck-error__text">{message}</p>
      <div className="t-btnrow">
        <button type="button" className="t-pbtn t-pbtn--acc t-pbtn--m" onClick={() => window.location.reload()}>
          Odśwież
        </button>
        {back ? (
          <Link href={back.href} className="t-pbtn t-pbtn--outline t-pbtn--m">
            {back.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/** Small key–value row used in summaries. */
export function KeyValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="t-ck-kv">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
