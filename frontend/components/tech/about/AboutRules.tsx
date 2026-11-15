import { AboutIconSvg, type AboutIcon } from "./about-icons";
import { Spotlight } from "./Spotlight";

export type AboutRule = { key: string; icon: AboutIcon; t: string; s: string; draft: boolean };

/**
 * "Czego możesz od nas oczekiwać" as a bento grid: the first rule (quote before repair) is the
 * featured card with a small quote-flow illustration, the rest are equal cards with an icon
 * that draws in and a quiet index number. Layout per count (4–6 rules) lives in tech-about.css.
 */
export function AboutRules({ rules }: { rules: AboutRule[] }) {
  const [lead, ...rest] = rules;
  if (!lead) return null;
  return (
    <Spotlight className={`t-ab-rules t-ab-rules--${rules.length}`} data-t-stagger="">
      <article className={`t-card t-ab-rule t-ab-rule--lead${lead.draft ? " t-draft" : ""}`} data-spot="">
        <div className="t-ab-rule__top">
          <span className="t-ab-rule__ico">
            <AboutIconSvg icon={lead.icon} size={24} />
          </span>
          <span className="t-ab-rule__no" aria-hidden="true">
            <i />
            01
          </span>
        </div>
        <QuoteFlow />
        <div className="t-ab-rule__text">
          <h3>{lead.t}</h3>
          <p>{lead.s}</p>
        </div>
      </article>
      {rest.map((r, i) => (
        <article key={r.key} className={`t-card t-ab-rule${r.draft ? " t-draft" : ""}`} data-spot="">
          <div className="t-ab-rule__top">
            <span className="t-ab-rule__ico">
              <AboutIconSvg icon={r.icon} size={22} />
            </span>
            <span className="t-ab-rule__no" aria-hidden="true">
              <i />
              {String(i + 2).padStart(2, "0")}
            </span>
          </div>
          <div className="t-ab-rule__text">
            <h3>{r.t}</h3>
            <p>{r.s}</p>
          </div>
        </article>
      ))}
    </Spotlight>
  );
}

/** Diagnosis → quote → your decision. Bars instead of amounts (no prices on the site, SPEC §8). */
function QuoteFlow() {
  return (
    <div className="t-ab-flow" aria-hidden="true">
      <ol className="t-ab-flow__steps">
        <li>
          <i />
          Diagnoza
        </li>
        <li>
          <i />
          Wycena
        </li>
        <li className="is-you">
          <i />
          Twoja decyzja
        </li>
      </ol>
      <div className="t-ab-flow__ticket">
        <span className="t-ab-flow__scan" />
        <div className="t-ab-flow__row">
          <b style={{ width: "58%" }} />
          <b style={{ width: "16%" }} />
        </div>
        <div className="t-ab-flow__row">
          <b style={{ width: "44%" }} />
          <b style={{ width: "14%" }} />
        </div>
        <div className="t-ab-flow__row">
          <b style={{ width: "50%" }} />
          <b style={{ width: "18%" }} />
        </div>
        <div className="t-ab-flow__sum">
          <b style={{ width: "26%" }} />
          <b className="is-strong" style={{ width: "22%" }} />
        </div>
        <div className="t-ab-flow__actions">
          <span className="t-ab-flow__ok">
            <AboutIconSvg icon="check" size={16} strokeWidth={2.8} />
          </span>
          <span className="t-ab-flow__no">
            <AboutIconSvg icon="close" size={15} strokeWidth={2.6} />
          </span>
        </div>
      </div>
    </div>
  );
}
