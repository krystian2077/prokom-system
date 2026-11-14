import Image from "next/image";
import Link from "next/link";
import { line, telHref } from "@/config/prokom";
import { POINTS_HREF, SUBMIT_HREF, TRACK_HREF } from "@/lib/tech/nav";
import type { VisiblePoint } from "@/lib/tech/points";
import { IconArrow, IconCheck, IconPhoneCall, IconPin, IconWrench } from "../icons";
import { OpeningStatus } from "../OpeningStatus";

// Promises that already exist in the service (SPEC §8) — verbatim from the design.
const PROMISES = ["Wycena przed naprawą", "Gwarancja na naprawę i części", "Status naprawy online"];

/** Hero scene + points bar (design T.Main `#start`). */
export function Hero({ points, publishedNames }: { points: VisiblePoint[]; publishedNames: string[] }) {
  return (
    <section id="start" data-rail="Start" className="t-hero t-ui" aria-labelledby="t-hero-h1">
      <div className="t-container">
        <div className="t-hero__stage">
          <div className="t-hero__copy">
            <span className="t-hero__eyebrow">
              <i aria-hidden="true" />
              {line.name} · serwis
            </span>
            {/* Phone: live status pill on top (design telefon-6-ekranow, screen 1). */}
            <span className="t-hero__mstatus">
              <OpeningStatus points={points.filter((p) => !p.draft)} variant="pill" skeletonCh={16} />
            </span>
            <h1 id="t-hero-h1" className="t-hero__h1">
              Serwis telefonów <br className="t-hero__br" />i&nbsp;komputerów
              <span className="t-hero__sub">{publishedNames.join(" · ")}</span>
            </h1>
            <p className="t-hero__lead">
              <span className="t-hero__lead--wide">Najpierw diagnoza i wycena. Naprawiamy dopiero wtedy, gdy się zgodzisz.</span>
              <span className="t-hero__lead--phone">Diagnoza i wycena przed naprawą.</span>
            </p>
            <div className="t-hero__actions">
              <Link href={SUBMIT_HREF} className="t-hbtn t-hbtn--acc t-shine t-hero__submit" data-track="zgloszenie_start" data-track-zrodlo="przycisk">
                <IconWrench size={18} />
                Zgłoś naprawę online
              </Link>
              <a href={telHref(line.phone)} className="t-hbtn t-hbtn--ghost" data-track="telefon_klik" data-track-miejsce="hero">
                <IconPhoneCall size={18} />
                <span className="t-hero__tel--wide">{line.phoneDisplay}</span>
                <span className="t-hero__tel--phone">Zadzwoń</span>
              </a>
              <Link href={TRACK_HREF} className="t-hbtn t-hbtn--ghost t-hero__track">
                Status naprawy
              </Link>
            </div>
            <ul className="t-hero__promises">
              {PROMISES.map((p) => (
                <li key={p}>
                  <IconCheck size={16} />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="t-hero__phones" aria-hidden="true">
            <Image className="t-hero__ph t-hero__ph--2" src="/tech/urzadzenia/samsung.webp" alt="" width={454} height={549} unoptimized />
            <Image
              className="t-hero__ph t-hero__ph--1"
              src="/tech/urzadzenia/iphone.webp"
              alt="Smartfony naprawiane w PRO-KOM Tech"
              width={433}
              height={577}
              unoptimized
            />
          </div>
        </div>

        <div className={`t-hero__points${points.length === 1 ? " is-single" : ""}`}>
          {points.map((p, i) => (
            <div key={p.key} className="t-hero__pointwrap">
              {i > 0 ? <span className="t-hero__sep" aria-hidden="true" /> : null}
              <Link href={`${POINTS_HREF}#${p.key}`} className={`t-hero__point${p.draft ? " t-draft" : ""}`}>
                <span className="t-ico t-ico--sm">
                  <IconPin size={20} />
                </span>
                <span className="t-hero__pinfo">
                  <b>
                    {p.name}
                    {p.draft ? <span className="t-draft-badge">do uzupełnienia</span> : null}
                  </b>
                  <span className="t-hero__paddr">
                    {p.street}
                    {" · "}
                    <OpeningStatus points={[p]} className="t-hero__pstatus" skeletonCh={14} />
                  </span>
                </span>
                <span className="t-hero__plink">
                  Dojazd i godziny
                  <IconArrow size={16} strokeWidth={2.6} />
                </span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
