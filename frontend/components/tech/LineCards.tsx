import { line as current, lines, type LineKey } from "@/config/prokom";

/** Longer descriptions from the design (#kontakt, #o-firmie "others"); the short ones in prokom.ts serve the footer band. */
const ABOUT: Partial<Record<LineKey, string>> = {
  prokom: "Strona główna firmy. Wszystkie linie w jednym miejscu.",
  biznes: "Kasy fiskalne, komputery i opieka IT dla firm.",
  instalacje: "Monitoring, sieci, smart home, nagłośnienie.",
  software: "Strony, systemy i aplikacje dla firm.",
  gaming: "Komputery gamingowe. Marka PRO-KOM.",
};

/** Other PRO-KOM lines as cards (Tech itself is left out — the visitor is already here). */
export function LineCards({ title }: { title: string }) {
  const others = lines.filter((l) => l.key !== current.key);
  return (
    <section className="t-section t-section--tight t-linecards">
      <div className="t-container">
        <h2 className="t-h2 t-h2--sm">{title}</h2>
        <ul className="t-linecards__grid">
          {others.map((l) => (
            <li key={l.key}>
              <a
                href={`https://${l.domain}`}
                className={`t-linecard${l.key === "gaming" ? " t-linecard--gaming" : ""}`}
                style={{ ["--line" as string]: l.key === "gaming" ? l.dashDark : l.dash }}
                target="_blank"
                rel="noopener"
              >
                <span className="t-linecard__name">{l.name}</span>
                <span className="t-linecard__desc">{ABOUT[l.key] ?? l.description}</span>
                <span className="t-linecard__dom">{l.domain} ↗</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
