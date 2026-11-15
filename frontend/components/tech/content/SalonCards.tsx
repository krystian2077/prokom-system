import Link from "next/link";
import { pointPhone, telHref } from "@/config/prokom";
import { claim } from "@/lib/tech/claims";
import { courierPageHref, courierPaysText } from "@/lib/tech/courier";
import { POINTS_HREF } from "@/lib/tech/nav";
import { pointPhoneDisplay } from "@/lib/tech/point-format";
import type { VisiblePoint } from "@/lib/tech/points";
import { IconArrow, IconPath, IconPhoneCall, IconPin } from "../icons";
import { NavigateButtons } from "../NavigateButtons";
import { OpeningStatus } from "../OpeningStatus";

/**
 * "Gdzie oddać" cards: every visible salon with the live opening status, navigation,
 * phone and the parking note (all from config/prokom.ts), then the courier tile when the
 * courier page is published. Shared by device pages, the hub and repair pages.
 */
export function SalonCards({ points, trackFrom }: { points: VisiblePoint[]; trackFrom: string }) {
  const courier = courierPageHref();
  const pays = courierPaysText();
  const where = claim("courierWholeCountry");
  return (
    <ul className={`t-salons t-salons--${points.length + (courier ? 1 : 0)}`} data-t-stagger="">
      {points.map((p) => (
        <li key={p.key} className={`t-card t-salon${p.draft ? " t-draft" : ""}`}>
          <div className="t-salon__top">
            <span className="t-salon__kicker">
              <IconPin size={15} /> Salon
            </span>
            <OpeningStatus points={[p]} variant="pill" skeletonCh={9} />
          </div>
          <h3 className="t-salon__name">{p.city}</h3>
          <p className="t-salon__addr">{p.street}</p>
          {p.parkingNote ? (
            <p className="t-salon__park">
              <span aria-hidden="true">P</span>
              {p.parkingNote}
            </p>
          ) : null}
          <div className="t-salon__actions">
            <NavigateButtons point={{ ...p, parkingNote: null }} />
            <a href={telHref(pointPhone(p))} className="t-btn t-btn--sm t-btn--ghost t-salon__tel" data-track="telefon_klik" data-track-miejsce={`${trackFrom}_${p.key}`}>
              <IconPhoneCall size={16} /> {pointPhoneDisplay(p)}
            </a>
          </div>
          <Link href={`${POINTS_HREF}#${p.key}`} className="t-lnk t-lnk--sm t-salon__more">
            Godziny i dojazd <IconArrow size={14} />
          </Link>
        </li>
      ))}
      {courier ? (
        <li className="t-card t-salon t-salon--courier">
          <span className="t-salon__kicker">
            <IconPath icon="truck" size={16} /> Kurier
          </span>
          <h3 className="t-salon__name">Kurierem{where ? ` ${where.text}` : ""}</h3>
          <p className="t-salon__addr">{pays ?? "Wyślij sprzęt do serwisu kurierem."} Płacisz przelewem po diagnozie i akceptacji wyceny.</p>
          <Link href={courier} className="t-lnk t-lnk--sm t-salon__more">
            Jak wysłać sprzęt <IconArrow size={14} />
          </Link>
        </li>
      ) : null}
    </ul>
  );
}
