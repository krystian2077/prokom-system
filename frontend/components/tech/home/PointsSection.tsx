import { claim } from "@/lib/tech/claims";
import type { VisiblePoint } from "@/lib/tech/points";
import { pointLocative } from "@/lib/tech/towns";
import { IconCheck } from "../icons";
import { NearestPoint } from "./NearestPoint";
import { PodhaleMap } from "./PodhaleMap";
import { PointTile } from "./PointTile";

/**
 * "Dwa punkty. Jeden serwis." (design T.Main `#punkty`). Two points are mentioned only when
 * more than one point may be shown (SPEC §5); otherwise a single-point version (decision 14.11).
 */
export function PointsSection({ points }: { points: VisiblePoint[] }) {
  const multi = points.length > 1;
  const courier = claim("courierWholeCountry");
  const ticks = multi ? ["Jedno zgłoszenie online", "Jeden status naprawy", "Oddajesz w jednym punkcie, odbierasz w drugim"] : ["Zgłoszenie online", "Status naprawy online"];
  return (
    <section id="punkty" data-rail="Punkty serwisowe" className="t-section t-points t-ui" aria-labelledby="t-punkty-h">
      <div className="t-container">
        <div className="t-points__top">
          <div className="t-points__text">
            <span className="t-eyb t-eyb--dark">Punkty serwisowe</span>
            {multi ? (
              <>
                <h2 id="t-punkty-h" className="t-h2 t-points__h">
                  Dwa punkty.
                  <br />
                  Jeden serwis.
                </h2>
                <p className="t-lead t-points__lead">
                  {points.map((p) => p.name).join(" i ")} pracują w jednym systemie. Te same naprawy, te same części, ta sama gwarancja. Wybierasz punkt, do którego masz bliżej.
                </p>
                <NearestPoint visible={points.map((p) => p.key)} />
              </>
            ) : (
              <>
                {/* Single-point fallback: only when a point is unpublished again (SPEC §5). */}
                <h2 id="t-punkty-h" className="t-h2 t-points__h">
                  Punkt serwisowy {pointLocative[points[0]?.key ?? "rabka"]}
                </h2>
                <p className="t-lead t-points__lead">
                  Telefony, laptopy, tablety, konsole i drukarki naprawiamy na miejscu. Przyjeżdżają do nas klienci z całego Podhala.
                </p>
              </>
            )}
            <ul className="t-points__ticks">
              {ticks.map((t) => (
                <li key={t}>
                  <IconCheck size={16} />
                  {t}
                </li>
              ))}
              {courier ? (
                <li className={courier.draft ? "t-draft" : undefined}>
                  <IconCheck size={16} />
                  Kurier {courier.text}
                </li>
              ) : null}
            </ul>
          </div>
          <PodhaleMap points={points.map((p) => ({ key: p.key, name: p.name, draft: p.draft }))} />
        </div>
        <div className={`t-points__cards${multi ? "" : " is-single"}`}>
          {points.map((p) => (
            <PointTile key={p.key} point={p} draft={p.draft} />
          ))}
        </div>
      </div>
    </section>
  );
}
