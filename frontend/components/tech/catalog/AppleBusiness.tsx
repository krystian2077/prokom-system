import Link from "next/link";
import { APPLE_PROGRAM_NOTE, applePrograms } from "@/lib/tech/certificates";
import { IconArrow } from "../icons";

const ICON: Record<(typeof applePrograms)[number]["key"], string> = {
  dep: "M4 5h11v8H4zM2 16h15M17 9h4v10h-4zM8.5 20.5l2 2 4-4",
  cto: "M7 7h10v10H7zM10 10h4v4h-4zM9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3",
  applecare: "M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6zM9 12l2 2 4-4",
};

/**
 * „Apple dla firm i instytucji” in the /apple salon (boss consent 23.11): DEP, CTO and AppleCare+
 * through the AB iLeader programme. A wordmark, no Apple logo (SPEC decision 18.11); sales and
 * deployments only — nothing suggests an Apple service authorisation.
 */
export function AppleBusiness() {
  return (
    <section className="t-section t-section--tight" id="dla-firm" data-rail="Dla firm" aria-labelledby="t-abiz-h">
      <div className="t-container">
        <div className="t-abiz">
          <span className="t-abiz__glow" aria-hidden="true" />
          <div className="t-abiz__head" data-t-reveal="">
            <span className="t-abiz__kick">
              <i aria-hidden="true" />
              Apple dla firm i instytucji
            </span>
            <h2 id="t-abiz-h" className="t-abiz__h">
              Sprzęt Apple gotowy do pracy <span>od pierwszego dnia.</span>
            </h2>
            <p className="t-abiz__lead">Dla firm, szkół i urzędów: zamówimy sprzęt w potrzebnej konfiguracji, zarejestrujemy go do wdrożenia i dodamy ochronę Apple. Jedno miejsce, od wyceny po odbiór.</p>
            <div className="t-abiz__actions">
              <Link href="/kontakt#formularz" className="t-hbtn t-hbtn--acc t-shine">
                Zapytaj o ofertę dla firmy
                <IconArrow size={16} strokeWidth={2.6} />
              </Link>
            </div>
          </div>
          <ul className="t-abiz__cards" data-t-reveal="">
            {applePrograms.map((p, i) => (
              <li key={p.key} className="t-abiz__card">
                <span className="t-abiz__ico" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d={ICON[p.key]} />
                  </svg>
                </span>
                <span className="t-abiz__num" aria-hidden="true">
                  0{i + 1}
                </span>
                <b className="t-abiz__title">{p.title}</b>
                <span className="t-abiz__sub">{p.lead}</span>
                <p className="t-abiz__text">{p.text}</p>
              </li>
            ))}
          </ul>
          <p className="t-abiz__note">{APPLE_PROGRAM_NOTE}</p>
        </div>
      </div>
    </section>
  );
}
