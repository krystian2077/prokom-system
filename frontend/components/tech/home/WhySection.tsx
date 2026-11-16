import { company } from "@/config/prokom";
import { claim } from "@/lib/tech/claims";
import { saturdayPromise } from "@/lib/tech/point-format";
import type { VisiblePoint } from "@/lib/tech/points";
import { IconPath } from "../icons";

/** "Dlaczego PRO-KOM Tech" (design T.Main `#dlaczego`). Unconfirmed numbers and the Google rating stay hidden. */
export function WhySection({ points }: { points: VisiblePoint[] }) {
  const since = claim("sinceYear");
  const rating = claim("googleRating");
  const cards: { k: string; t: string; s: string; draft?: boolean }[] = [];
  if (since) cards.push({ k: String(company.since), t: `Na Podhalu od ${company.since} roku`, s: `${company.name}, ${company.hq.city}. Sprawdzisz nas w CEIDG.`, draft: since.draft });
  if (points.length > 1) cards.push({ k: String(points.length), t: "Punkty serwisowe", s: `${points.map((p) => p.name).join(" i ")}.${saturdayPromise(points) ? ` ${saturdayPromise(points)}.` : ""}`, draft: points.some((p) => p.draft) });
  cards.push({ k: "Wycena", t: "Zawsze przed naprawą", s: "Możesz zrezygnować bez konsekwencji. Nie opłaca się? Powiemy to wprost." });
  cards.push({ k: "RODO", t: "Twoje dane są bezpieczne", s: "Nie przeglądamy zawartości urządzeń bez potrzeby." });

  return (
    <section id="dlaczego" data-rail="Dlaczego" className="t-section t-ui" aria-labelledby="t-dlaczego-h">
      <div className="t-container">
        <div className="t-hd">
          <div className="t-hd__text">
            <span className="t-eyb">Dlaczego PRO-KOM Tech</span>
            <h2 id="t-dlaczego-h" className="t-h2">
              Uczciwie, zanim cokolwiek rozkręcimy
            </h2>
          </div>
          {rating ? (
            <div className={`t-rating${rating.draft ? " t-draft" : ""}`}>
              <IconPath icon="star" size={22} />
              <span>Opinie Google: {rating.text}</span>
            </div>
          ) : null}
        </div>
        <div className={`t-why t-why--${cards.length}`}>
          {cards.map((c) => (
            <div key={c.t} className={`t-card t-why__card${c.draft ? " t-draft" : ""}`}>
              <span className="t-why__k">{c.k}</span>
              <span className="t-h3 t-why__t">{c.t}</span>
              <span className="t-why__s">{c.s}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
