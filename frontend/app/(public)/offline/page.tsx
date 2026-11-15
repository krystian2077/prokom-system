import type { Metadata } from "next";
import { line, pointPhone, servicePoints, telHref } from "@/config/prokom";
import { hoursRows, pointAddress, pointPhoneDisplay } from "@/lib/tech/point-format";
import { publishedPoints } from "@/lib/tech/points";

export const metadata: Metadata = { title: "Brak połączenia", robots: { index: false, follow: false } };

/**
 * Offline fallback (SPEC §12.2). The service worker keeps one self-contained copy of this
 * page (styles inlined, scripts removed), so everything here must work without JavaScript.
 * Hours come from config/prokom.ts as of the last deploy the browser saw.
 */
export default function OfflinePage() {
  const points = publishedPoints(servicePoints);
  return (
    <div className="t-ui t-page t-offline">
      <section className="t-section--hero" id="offline" data-rail="Offline">
        <div className="t-container">
          <div className="t-stage t-bhero t-offline__stage">
            <span className="t-eyebrow t-eyebrow--stage">Tryb offline</span>
            <h1 className="t-bhero__h1">
              Brak połączenia <span>Sprawdź internet i spróbuj ponownie.</span>
            </h1>
            <p className="t-bhero__lead">Gdy połączenie wróci, strona zadziała jak zwykle. Pilna sprawa? Zadzwoń do serwisu.</p>
            <div className="t-btnrow">
              <a href={telHref(line.phone)} className="t-pbtn t-pbtn--stage">
                Zadzwoń: {line.phoneDisplay}
              </a>
              <a href="/" className="t-pbtn t-pbtn--ghost-dark">
                Spróbuj ponownie
              </a>
            </div>
          </div>
        </div>
      </section>
      <section className="t-section t-section--tight" id="godziny" data-rail="Godziny">
        <div className="t-container t-offline__points">
          {points.map((p) => (
            <div key={p.key} className="t-card t-offline__point">
              <h2 className="t-h3">{p.name}</h2>
              <p>{pointAddress(p)}</p>
              <p>
                <a href={telHref(pointPhone(p))} className="t-offline__tel">
                  {pointPhoneDisplay(p)}
                </a>
              </p>
              <dl className="t-vkv">
                {hoursRows(p).map((h) => (
                  <div key={h.days}>
                    <dt>{h.label}</dt>
                    <dd>{h.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="t-offline__note">Godziny z ostatniego wczytania strony.</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
