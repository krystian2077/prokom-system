import { claim } from "@/lib/tech/claims";
import { Timeline } from "../content/Blocks";

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
        <Timeline steps={steps.map((s, i) => ({ ...s, lead: i === 0 }))} tone="stage" horizontal />
      </div>
    </section>
  );
}
