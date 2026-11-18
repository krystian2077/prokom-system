import Link from "next/link";
import { GENERAL_PHONE_LABEL, line, lines, telHref } from "@/config/prokom";
import type { VisiblePoint } from "@/lib/tech/points";
import { TRACK_HREF } from "@/lib/tech/nav";
import { IconArrow } from "./icons";
import { OpeningStatus } from "./OpeningStatus";

/** Top strip (design T.Naglowek): PRO-KOM lines, opening status, track link, phone. ≥ 1024 px. */
export function BrandBar({ points }: { points: VisiblePoint[] }) {
  return (
    <div className="t-brandbar">
      <div className="t-container t-brandbar__in">
        <nav aria-label="Linie PRO-KOM" className="t-brandbar__lines">
          {lines.map((l) => {
            const current = l.key === line.key;
            return (
              <a
                key={l.key}
                href={current ? "/" : `https://${l.domain}`}
                aria-current={current ? "page" : undefined}
                className={current ? "is-current" : undefined}
              >
                <span className="t-dash" style={{ background: l.dash }} aria-hidden="true" />
                {l.name}
              </a>
            );
          })}
        </nav>
        <div className="t-brandbar__right">
          <OpeningStatus points={points} withName={points.length > 1} skeletonCh={20} />
          <Link href={TRACK_HREF} className="t-brandbar__track">
            Sprawdź status naprawy
            <IconArrow />
          </Link>
          <a href={telHref(line.phone)} className="t-brandbar__phone" data-track="telefon_klik" data-track-miejsce="pasek_marki">
            {GENERAL_PHONE_LABEL}: <strong>{line.phoneDisplay}</strong>
          </a>
        </div>
      </div>
    </div>
  );
}
