import Link from "next/link";
import type { ReactNode } from "react";
import { IconArrow, IconCheck, IconSearch, IconWrench } from "../icons";
import { TrackExample } from "../TrackExample";
import { IconShield } from "./account-icons";

const PERKS = [
  { icon: <IconWrench size={20} strokeWidth={2.1} />, name: "Status naprawy na żywo", desc: "Sprawdź, co dzieje się z Twoim sprzętem." },
  { icon: <IconCheck size={20} strokeWidth={2.4} />, name: "Historia wszystkich zleceń", desc: "Szczegóły napraw w jednym miejscu." },
  { icon: <IconShield size={20} />, name: "Gwarancja pod kontrolą", desc: "Daty ważności i warunki gwarancji." },
] as const;

type Props = {
  /** Small label above the title, e.g. "Konto klienta". */
  eyebrow: string;
  /** Visible page heading (h1) of the card. */
  title: string;
  lead?: ReactNode;
  children: ReactNode;
  /** Link under the card ("Wróć do logowania"). */
  back?: { href: string; label: string };
  /** Narrow single-card layout without the dark side panel (reset, verify). */
  compact?: boolean;
};

/**
 * Frame of the client sign-in screens in the PRO-KOM Tech skin: breadcrumbs, the form card
 * and (on wide screens) the dark stage with what the account gives. On phones the form
 * comes first, the stage follows it.
 */
export function AuthScreen({ eyebrow, title, lead, children, back, compact = false }: Props) {
  return (
    <div className={`t-ui t-container t-ck t-ck-auth${compact ? " t-ck-auth--compact" : ""}`}>
      <nav aria-label="Okruszki" className="t-ck-crumbs">
        <ol>
          <li>
            <Link href="/">Strona główna</Link>
            <span aria-hidden="true">/</span>
          </li>
          <li>
            <span aria-current="page">Konto klienta</span>
          </li>
        </ol>
      </nav>

      <div className="t-ck-auth__grid">
        <section className="t-ck-card t-ck-auth__card" aria-labelledby="t-ck-title">
          <span className="t-eyb">{eyebrow}</span>
          <h1 id="t-ck-title" className="t-ck-auth__title">
            {title}
          </h1>
          {lead ? <p className="t-ck-auth__lead">{lead}</p> : null}
          <div className="t-ck-auth__body">{children}</div>
          {back ? (
            <Link href={back.href} className="t-ck-back">
              <IconArrow size={14} className="t-ck-back__ico" />
              {back.label}
            </Link>
          ) : null}
        </section>

        {compact ? null : (
          <aside className="t-stage t-ck-auth__stage" aria-label="Co daje konto klienta">
            <div className="t-ck-auth__stagein">
              <span className="t-eyb t-eyb--dark">Konto klienta</span>
              <h2 className="t-ck-auth__stagetitle">
                Twoje naprawy <span>w jednym miejscu.</span>
              </h2>
              <p className="t-ck-auth__stagelead">
                Śledź status naprawy na żywo, przeglądaj historię zleceń i zarządzaj profilem klienta.
              </p>
              <ul className="t-ck-perks">
                {PERKS.map((p) => (
                  <li key={p.name}>
                    <span className="t-ck-perks__ico" aria-hidden="true">
                      {p.icon}
                    </span>
                    <span>
                      <strong>{p.name}</strong>
                      <span>{p.desc}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Static example of the status panel (same as on the home page) — wide screens only. */}
            <div className="t-ck-auth__example" aria-hidden="true">
              <TrackExample point={undefined} />
            </div>
            <Link href="/track" className="t-ck-auth__track">
              <span className="t-ck-auth__trackico" aria-hidden="true">
                <IconSearch size={18} />
              </span>
              <span>
                <strong>Bez konta?</strong>
                <span>Status sprawdzisz po numerze zgłoszenia.</span>
              </span>
              <IconArrow size={16} className="t-ck-auth__trackgo" />
            </Link>
          </aside>
        )}
      </div>
    </div>
  );
}
