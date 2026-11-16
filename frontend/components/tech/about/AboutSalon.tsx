import { pointPhone, telHref } from "@/config/prokom";
import { hoursSummary } from "@/lib/tech/hours";
import { pointAddress, pointPhoneDisplay } from "@/lib/tech/point-format";
import type { VisiblePoint } from "@/lib/tech/points";
import { NavigateButtons } from "../NavigateButtons";
import { OpeningStatus } from "../OpeningStatus";
import { AboutIconSvg } from "./about-icons";

/**
 * Compact salon card for /o-firmie ("Przyjdź i zobacz"): live OpeningStatus,
 * hours, free parking (parkingNote from prokom.ts), navigation and phone.
 */
export function AboutSalon({ point }: { point: VisiblePoint }) {
  return (
    <article className={`t-card t-ab-salon${point.draft ? " t-draft" : ""}`} aria-labelledby={`t-ab-salon-${point.key}`} data-spot="">
      <span className="t-ab-salon__pin" aria-hidden="true">
        <AboutIconSvg icon="pin" size={22} />
      </span>
      <div className="t-ab-salon__body">
        <div className="t-ab-salon__head">
          <h4 id={`t-ab-salon-${point.key}`} className="t-ab-salon__name">
            {point.name}
            {point.draft ? <span className="t-draft-badge">do uzupełnienia</span> : null}
          </h4>
          <OpeningStatus points={[point]} variant="pill" skeletonCh={9} />
        </div>
        <p className="t-ab-salon__addr">{pointAddress(point)}</p>
        <p className="t-ab-salon__hours">{hoursSummary(point)}</p>
        <div className="t-ab-salon__chips">
          {point.parkingNote ? (
            <span className="t-ab-salon__park">
              <b aria-hidden="true">P</b>
              {point.parkingNote}
            </span>
          ) : null}
          <a href={telHref(pointPhone(point))} className="t-ab-salon__tel" data-track="telefon_klik" data-track-miejsce={`o_firmie_${point.key}`}>
            <AboutIconSvg icon="phone" size={15} />
            {pointPhoneDisplay(point)}
          </a>
        </div>
        <div className="t-ab-salon__nav">
          <NavigateButtons point={{ ...point, parkingNote: null }} />
        </div>
      </div>
    </article>
  );
}
