import Link from "next/link";
import { claim } from "@/lib/tech/claims";
import { ACCOUNT_HREF, TRACK_HREF } from "@/lib/tech/nav";
import type { VisiblePoint } from "@/lib/tech/points";
import { TrackExample } from "../TrackExample";

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
          <TrackExample point={point} />
        </div>
      </div>
    </section>
  );
}
