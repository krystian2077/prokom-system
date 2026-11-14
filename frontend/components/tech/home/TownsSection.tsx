import Link from "next/link";
import { claim } from "@/lib/tech/claims";
import { courierPageHref } from "@/lib/tech/courier";
import type { VisiblePoint } from "@/lib/tech/points";
import { pointGenitive, towns } from "@/lib/tech/towns";
import { SUBMIT_HREF } from "@/lib/tech/nav";
import { IconPin } from "../icons";

const TOWNS_HREF = "/obslugiwane-miejscowosci";

/** "Obsługiwane miejscowości" (design T.Main `#okolice`). Columns per visible point; one list while only one point is shown. */
export function TownsSection({ points }: { points: VisiblePoint[] }) {
  const multi = points.length > 1;
  const groups = multi
    ? points.map((p) => ({ key: p.key, title: `Bliżej do ${pointGenitive[p.key]}`, list: towns.filter((t) => t.point === p.key), draft: p.draft }))
    : [{ key: "all", title: "Przyjeżdżają do nas z", list: towns, draft: false }];
  const wide = claim("courierWholeCountry");
  const courierHref = courierPageHref() ?? `${SUBMIT_HREF}?dostawa=kurier`;
  return (
    <section id="okolice" data-rail="Miejscowości" className="t-section t-section--alt t-ui" aria-labelledby="t-okolice-h">
      <div className="t-container">
        <div className="t-hd">
          <div className="t-hd__text">
            <span className="t-eyb">Obsługiwane miejscowości</span>
            <h2 id="t-okolice-h" className="t-h2">
              Serwis telefonów dla całego Podhala
            </h2>
            <p className="t-lead">Każda miejscowość ma swoją stronę: dojazd do bliższego punktu, godziny i najczęstsze naprawy.</p>
          </div>
        </div>
        <div className={`t-towns${multi ? "" : " is-single"}`}>
          {groups.map((g) => (
            <div key={g.key} className={`t-card t-towns__card${g.draft ? " t-draft" : ""}`}>
              <h3 className="t-h3">{g.title}</h3>
              <ul className="t-towns__list">
                {g.list.map((t) => (
                  <li key={t.slug}>
                    <Link href={`${TOWNS_HREF}#${t.slug}`} className="t-tw">
                      <IconPin size={14} strokeWidth={2.2} />
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="t-towns__courier">
            <h3 className="t-h3">Dalej? Wyślij kurierem.</h3>
            <p>
              {wide ? <span className={wide.draft ? "t-draft" : undefined}>Przyjmujemy sprzęt {wide.text}. </span> : null}
              Po zgłoszeniu online dostajesz adres i instrukcję pakowania. Po naprawie odsyłamy.
            </p>
            <Link href={courierHref} className="t-sbtn" data-track="zgloszenie_start" data-track-zrodlo="kurier">
              Zgłoś naprawę wysyłkową
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
