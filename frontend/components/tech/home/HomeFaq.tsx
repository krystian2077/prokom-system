import Link from "next/link";
import { line, telHref } from "@/config/prokom";
import { claim } from "@/lib/tech/claims";
import { courierPaysText } from "@/lib/tech/courier";
import type { VisiblePoint } from "@/lib/tech/points";
import { IconArrow, IconPlus } from "../icons";
import { OpeningStatus } from "../OpeningStatus";

/**
 * "Zanim oddasz sprzęt" (design T.Main `#faq`). Answers come from the current site FAQ
 * (sections/FAQ.tsx); answers that depend on unconfirmed promises are hidden (SPEC §10).
 */
export function HomeFaq({ points }: { points: VisiblePoint[] }) {
  const free = claim("freeDiagnosis");
  const pays = courierPaysText();
  const items: { q: string; a: string }[] = [
    {
      q: "Skąd będę wiedzieć, ile kosztuje naprawa?",
      a: "Po diagnostyce dostajesz dokładną wycenę przed rozpoczęciem naprawy, bez ukrytych kosztów. Po wycenie możesz zrezygnować bez żadnych konsekwencji.",
    },
    {
      q: "Jak długo trwa naprawa?",
      a: "Zależy od usterki i dostępności części. Czas realizacji podajemy razem z wyceną, a o każdej zmianie informujemy telefonicznie albo SMS-em.",
    },
    ...(free && !free.draft
      ? [{ q: "Czy diagnoza jest darmowa?", a: "Tak — w większości przypadków diagnoza jest bezpłatna. W bardziej złożonych przypadkach informujemy o ewentualnej opłacie z góry." }]
      : []),
    { q: "Czy używacie oryginalnych części?", a: "Korzystamy z oryginalnych części lub wysokiej jakości zamienników — zawsze informujemy przed naprawą, które." },
    { q: "Czy jest gwarancja na naprawę?", a: "Tak — udzielamy gwarancji na wykonane usługi oraz części." },
    {
      q: "Czy moje dane są bezpieczne?",
      a: "Tak. Nie przeglądamy zawartości urządzeń bez potrzeby. Jeśli naprawa wymaga dostępu do danych albo ich usunięcia, zawsze informujemy wcześniej. Zalecamy zrobienie kopii zapasowej.",
    },
    {
      q: "Czy mogę wysłać urządzenie kurierem?",
      a: `Tak — w zgłoszeniu online wybierz „Kurier”.${pays ? ` ${pays}` : ""}`,
    },
  ];
  return (
    <section id="faq" data-rail="Pytania" className="t-section t-ui" aria-labelledby="t-faq-h">
      <div className="t-container t-faqwrap">
        <div className="t-faqwrap__side">
          <span className="t-eyb">Pytania</span>
          <h2 id="t-faq-h" className="t-h2">
            Zanim oddasz sprzęt
          </h2>
          <p className="t-lead">Najczęstsze pytania o cenę, czas, dane i gwarancję.</p>
          <div className="t-card t-faqwrap__contact">
            <OpeningStatus points={points.filter((p) => !p.draft)} variant="pill" skeletonCh={14} />
            <a href={telHref(line.phone)} className="t-faqwrap__tel" data-track="telefon_klik" data-track-miejsce="glowna-faq">
              {line.phoneDisplay}
            </a>
            <a href={`mailto:${line.email}`} className="t-faqwrap__mail">
              {line.email}
            </a>
          </div>
          <Link href="/faq" className="t-lnk">
            Wszystkie pytania
            <IconArrow size={16} strokeWidth={2.6} />
          </Link>
        </div>
        <div className="t-faq">
          {items.map((it, i) => (
            <details key={it.q} className="t-faq__item" open={i === 0}>
              <summary>
                <span className="t-faq__n">{String(i + 1).padStart(2, "0")}</span>
                <span className="t-faq__q">{it.q}</span>
                <span className="t-faq__ico" aria-hidden="true">
                  <IconPlus size={18} strokeWidth={2.6} />
                </span>
              </summary>
              <p>{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
