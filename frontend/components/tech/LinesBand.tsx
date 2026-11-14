import { line, lines } from "@/config/prokom";
import { IconArrowUpRight } from "./icons";

/** "Jedna firma — linie PRO-KOM" band in the footer (design T.Stopka); Gaming as its own tile. */
export function LinesBand() {
  return (
    <section className="t-lines" aria-labelledby="t-lines-h">
      <div className="t-lines__head">
        <h2 id="t-lines-h" className="t-footer__h">
          Jedna firma — linie PRO-KOM
        </h2>
        <span>Każda linia ma swój zespół i swój numer</span>
      </div>
      <ul className="t-lines__grid">
        {lines.map((l) => {
          const current = l.key === line.key;
          return (
            <li key={l.key}>
              <a
                href={current ? "/" : `https://${l.domain}`}
                aria-current={current ? "page" : undefined}
                className={`t-lines__tile${current ? " is-current" : ""}${l.key === "gaming" ? " is-gaming" : ""}`}
                style={{ "--line": l.dashDark } as React.CSSProperties}
              >
                <span className="t-lines__top">
                  <span className="t-lines__mark">
                    <span className="t-lines__word">
                      PRO<span className="t-lines__dash" aria-hidden="true" />KOM
                    </span>
                    {l.label ? <span className="t-lines__label">{l.label}</span> : null}
                  </span>
                  {current ? <span className="t-lines__here">Jesteś tutaj</span> : <IconArrowUpRight className="t-lines__arrow" />}
                </span>
                <span className="t-lines__desc">{l.description}</span>
                <span className="t-lines__dom">{l.domain}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
