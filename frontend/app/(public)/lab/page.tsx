import Link from "next/link";

const PAGES = [
  { href: "/lab/kreator", title: "Kreator", text: "Wszystkie pary urządzenie × usterka jako plakaty, z „odtwórz”, motywem i szerokością." },
  { href: "/lab/menu", title: "Menu", text: "Kapsuła, mega menu, TabBar i arkusz Menu — do przeglądu i nagrań." },
  { href: "/lab/ruch", title: "Ruch", text: "Wzorce ruchu: reveal, przyciski, karty, FAQ, pigułka, oś statusu, marquee, szkielety, motyw." },
];

export default function LabIndex() {
  return (
    <section className="t-section">
      <div className="t-container t-lab__wrap">
        <span className="t-eyb">Tylko staging · noindex</span>
        <h1 className="t-h2">Lab PRO-KOM Tech</h1>
        <p className="t-lead">Podgląd warstwy premium z sesji TP (docs/tech/PREMIUM.md). Na produkcji ta strona nie istnieje.</p>
        <ul className="t-lab__cards">
          {PAGES.map((p) => (
            <li key={p.href}>
              <Link href={p.href} className="t-card t-lab__card">
                <b>{p.title}</b>
                <span>{p.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
