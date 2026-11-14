import Link from "next/link";
import { pointPhone, telHref, type ServicePoint } from "@/config/prokom";
import { hoursSummary } from "@/lib/tech/hours";
import { directionsUrl, SUBMIT_HREF } from "@/lib/tech/nav";
import { OpeningStatus } from "../OpeningStatus";
import { OsmMap } from "../OsmMap";

/** Service point card on the home page (design T.Main `#punkty`). Full PointCard with navigation apps comes in TD4. */
export function PointTile({ point, draft }: { point: ServicePoint; draft: boolean }) {
  const phone = pointPhone(point);
  return (
    <article className={`t-ptile${draft ? " t-draft" : ""}`} aria-labelledby={`t-ptile-${point.key}`}>
      <div className="t-ptile__map">
        <OsmMap sub={`${point.street ?? ""}, ${point.city}`} label={false} height={214} radius={16} />
      </div>
      <div className="t-ptile__body">
        <div className="t-ptile__head">
          <h3 id={`t-ptile-${point.key}`} className="t-h3 t-ptile__name">
            {point.name}
            {draft ? <span className="t-draft-badge">do uzupełnienia</span> : null}
          </h3>
          <OpeningStatus points={[point]} variant="pill" skeletonCh={12} />
        </div>
        <p className="t-ptile__addr">
          {point.street}, {point.postal} {point.city}
          <br />
          {hoursSummary(point)}
        </p>
        <a href={telHref(phone)} className="t-ptile__tel" data-track="telefon_klik" data-track-miejsce="glowna-punkty">
          {phone.replace(/^\+48\s*/, "")}
        </a>
        <div className="t-ptile__actions">
          <Link href={`${SUBMIT_HREF}?punkt=${point.key}&dostawa=punkt`} className="t-hbtn t-hbtn--acc t-hbtn--sm">
            Zgłoś naprawę tutaj
          </Link>
          {point.geo ? (
            <a href={directionsUrl(point.geo)} className="t-hbtn t-hbtn--ghost t-hbtn--sm" target="_blank" rel="noopener noreferrer">
              Wyznacz trasę ↗
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
