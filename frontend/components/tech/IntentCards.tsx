import Link from "next/link";
import { SUBMIT_HREF, TRACK_HREF } from "@/lib/tech/nav";
import { IconArrow } from "./icons";

const CARDS = [
  { t: "Chcę oddać sprzęt do naprawy", s: "Zgłoś online i przynieś do punktu albo wyślij kurierem.", cta: "Zgłoś naprawę", href: SUBMIT_HREF, acc: true },
  { t: "Sprawdzam, co z moją naprawą", s: "Status zobaczysz online po numerze zgłoszenia albo w koncie klienta.", cta: "Status naprawy", href: TRACK_HREF },
  { t: "Chcę folię Hammer Glass", s: "Wycinamy ją na miejscu pod Twój model telefonu, tabletu albo zegarka.", cta: "Zobacz folie", href: "/hammer-glass" },
];

/** "Z czym przychodzisz?" / "W jakiej sprawie piszesz?" — three intent cards (design #punkty-serwisowe, #kontakt). */
export function IntentCards({ title, id }: { title: string; id?: string }) {
  return (
    <section className="t-section t-intents" id={id} data-rail={id ? "Z czym przychodzisz" : undefined}>
      <div className="t-container">
        <h2 className="t-h2">{title}</h2>
        <div className="t-intents__grid">
          {CARDS.map((c) => (
            <Link key={c.href} href={c.href} className={`t-intent${c.acc ? " t-intent--acc" : ""}`}>
              <span className="t-intent__t">{c.t}</span>
              <span className="t-intent__s">{c.s}</span>
              <span className="t-intent__cta">
                {c.cta}
                <span className="t-intent__arrow" aria-hidden="true">
                  <IconArrow size={17} strokeWidth={2.6} />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
