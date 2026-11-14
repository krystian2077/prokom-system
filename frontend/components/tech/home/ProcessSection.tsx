import Link from "next/link";
import { claim } from "@/lib/tech/claims";
import { ACCOUNT_HREF, TRACK_HREF } from "@/lib/tech/nav";
import type { VisiblePoint } from "@/lib/tech/points";
import { IconCheck, IconPin } from "../icons";

/** Stage keys and labels of the repair timeline (KONTRAKT §3). The panel is a static example. */
const STAGES: { key: string; label: string; meta: string; state: "done" | "now" | "next" }[] = [
  { key: "received", label: "Przyjęte", meta: "pon. 9:40", state: "done" },
  { key: "diagnostics", label: "Diagnoza", meta: "pon. 11:15", state: "done" },
  { key: "quote", label: "Wycena", meta: "zaakceptowana 11:32", state: "done" },
  { key: "repair", label: "Naprawa", meta: "trwa teraz", state: "now" },
  { key: "done", label: "Gotowe do odbioru", meta: "powiadomimy Cię", state: "next" },
];

/** "Od zgłoszenia do odbioru" + status panel (design T.Main `#proces`). */
export function ProcessSection({ point }: { point: VisiblePoint | undefined }) {
  const sameDay = claim("sameDayDiagnosis");
  const free = claim("freeDiagnosis");
  const diag = [sameDay, free].filter(Boolean) as { text: string; draft: boolean }[];
  const steps: { t: string; s: React.ReactNode }[] = [
    { t: "Zgłoszenie", s: "Online albo telefonicznie. Wybierasz punkt albo kuriera." },
    {
      t: "Diagnoza i wycena",
      s: diag.length ? (
        <>
          {diag.map((c) => (
            <span key={c.text} className={c.draft ? "t-draft" : undefined}>
              {c.text}{" "}
            </span>
          ))}
        </>
      ) : (
        "Sprawdzamy sprzęt i podajemy cenę przed naprawą."
      ),
    },
    { t: "Twoja decyzja", s: "Akceptujesz wycenę albo rezygnujesz bez konsekwencji." },
    { t: "Naprawa i testy", s: "Części oryginalne albo sprawdzone zamienniki. Zawsze mówimy, które." },
    { t: "Odbiór", s: "W punkcie albo kurierem. Z gwarancją na usługę i części." },
  ];
  return (
    <section id="proces" data-rail="Jak to działa" className="t-section t-ui" aria-labelledby="t-proces-h">
      <div className="t-container">
        <div className="t-hd">
          <div className="t-hd__text">
            <span className="t-eyb">Jak to działa</span>
            <h2 id="t-proces-h" className="t-h2">
              Od zgłoszenia do odbioru
            </h2>
          </div>
          <p className="t-lead t-proc__lead">Pięć kroków. Na każdym wiesz, co dzieje się z Twoim sprzętem.</p>
        </div>

        <ol className="t-proc">
          {steps.map((s, i) => (
            <li key={s.t} className="t-proc__step">
              <span className={`t-proc__n${i === 0 ? " is-first" : ""}`}>{i + 1}</span>
              <span className="t-h3 t-proc__t">{s.t}</span>
              <span className="t-proc__s">{s.s}</span>
            </li>
          ))}
        </ol>

        <div className="t-track">
          <div className="t-track__text">
            <span className="t-eyb t-eyb--dark">Status naprawy online</span>
            <span className="t-track__title">Sprawdzasz sam, kiedy chcesz</span>
            <span className="t-track__desc">Po numerze zgłoszenia i 4 ostatnich cyfrach telefonu. O statusie informujemy też telefonicznie albo SMS-em.</span>
            <div className="t-track__actions">
              <Link href={TRACK_HREF} className="t-sbtn">
                Sprawdź status naprawy
              </Link>
              <Link href={ACCOUNT_HREF} className="t-sbtn t-sbtn--ghost">
                Konto klienta
              </Link>
            </div>
          </div>
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
        </div>
      </div>
    </section>
  );
}
