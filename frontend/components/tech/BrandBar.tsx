import Link from "next/link";
import { GENERAL_PHONE_LABEL, line, lines, telHref } from "@/config/prokom";
import type { VisiblePoint } from "@/lib/tech/points";
import { TRACK_HREF } from "@/lib/tech/nav";
import { BrandLines } from "./BrandLines";
import { IconArrow } from "./icons";
import { OpeningStatus } from "./OpeningStatus";

/**
 * Top strip (design T.Naglowek, MOTYW-PASEK-LINII §4): PRO-KOM lines (the BrandLines island), then
 * opening status, track link and the general number. ≥ 1024 px, 38 px high, scrolls away with the page.
 */
export function BrandBar({ points }: { points: VisiblePoint[] }) {
  return (
    <div className="t-brandbar">
      <div className="t-container t-brandbar__in">
        <BrandLines
          lines={lines.map((l) => ({
            key: l.key,
            name: l.name,
            href: l.key === line.key ? "/" : `https://${l.domain}`,
            current: l.key === line.key,
            dash: l.dash,
            dashDark: l.dashDark,
            description: l.description,
          }))}
        />
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
