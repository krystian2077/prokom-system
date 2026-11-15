import type { VisiblePoint } from "@/lib/tech/points";
import { IconCheck, IconPin } from "./icons";

/** Stage keys and labels of the repair timeline (KONTRAKT §3). The panel is a static example. */
const STAGES: { key: string; label: string; meta: string; state: "done" | "now" | "next" }[] = [
  { key: "received", label: "Przyjęte", meta: "pon. 9:40", state: "done" },
  { key: "diagnostics", label: "Diagnoza", meta: "pon. 11:15", state: "done" },
  { key: "quote", label: "Wycena", meta: "zaakceptowana 11:32", state: "done" },
  { key: "repair", label: "Naprawa", meta: "trwa teraz", state: "now" },
  { key: "done", label: "Gotowe do odbioru", meta: "powiadomimy Cię", state: "next" },
];

/** Static example of the status panel ("Przykład zgłoszenia"): home "Jak to działa" and the empty /track. */
export function TrackExample({ point }: { point: VisiblePoint | undefined }) {
  return (
    <div className="t-track__card" aria-label="Przykład zgłoszenia">
      <div className="t-track__head">
        <span className="t-track__ex">
          <span>Przykład zgłoszenia</span>
          <b>iPhone 13 · wymiana wyświetlacza</b>
        </span>
        <span className="t-track__pill">
          <i aria-hidden="true" />W naprawie
        </span>
      </div>
      <ol className="t-track__stages">
        {STAGES.map((s) => (
          <li key={s.key} className={`is-${s.state}`} aria-current={s.state === "now" ? "step" : undefined}>
            <span className="t-track__bar" aria-hidden="true" />
            <span className="t-track__lbl">
              <span className="t-track__dot" aria-hidden="true">
                {s.state === "done" ? <IconCheck size={11} strokeWidth={3.6} /> : null}
              </span>
              {s.label}
            </span>
            <span className="t-track__meta">{s.meta}</span>
          </li>
        ))}
      </ol>
      {point ? (
        <div className="t-track__foot">
          <IconPin size={17} />
          Punkt: {point.name}, {point.street}
        </div>
      ) : null}
    </div>
  );
}
