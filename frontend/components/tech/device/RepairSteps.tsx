import { claim } from "@/lib/tech/claims";

/**
 * "Cztery kroki" on a dark band (design T.Usluga steps). The same-day diagnosis line is
 * an unconfirmed claim (SPEC §10) — shown only when confirmed (or on staging, framed).
 */
export function RepairSteps({ eyebrow = "Jak to działa", title, id = "jak-to-dziala" }: { eyebrow?: string; title: string; id?: string }) {
  const sameDay = claim("sameDayDiagnosis");
  const steps = [
    { t: "Zgłaszasz", s: "Online, z wyborem punktu, albo po prostu przychodzisz w godzinach otwarcia.", draft: false },
    { t: "Diagnoza i wycena", s: `${sameDay ? `${sameDay.text} ` : ""}Kwotę znasz przed naprawą.`, draft: !!sameDay?.draft },
    { t: "Naprawa i testy", s: "Po Twojej zgodzie. Status sprawdzasz online.", draft: false },
    { t: "Odbiór", s: "W punkcie albo kurierem, z gwarancją na usługę i części.", draft: false },
  ];
  return (
    <section className="t-section t-dsteps" id={id} data-rail="Jak to działa">
      <div className="t-container">
        <div className="t-sechead">
          <div>
            <span className="t-eyebrow t-eyebrow--stage">{eyebrow}</span>
            <h2 className="t-h2">{title}</h2>
          </div>
        </div>
        <ol className="t-dsteps__grid">
          {steps.map((s, i) => (
            <li key={s.t} className={`t-dsteps__item${s.draft ? " t-draft" : ""}`}>
              <span className={`t-dsteps__n${i === 0 ? " is-first" : ""}`} aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="t-h3">{s.t}</h3>
              <p>{s.s}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
