import Link from "next/link";
import type { Brand } from "@/lib/tech/catalog/types";
import { APPLE_PROGRAM_NOTE, SAMSUNG_PROGRAM_NOTE, applePrograms, samsungPrograms } from "@/lib/tech/certificates";
import { IconArrow } from "../icons";

const ICON: Record<string, string> = {
  dep: "M4 5h11v8H4zM2 16h15M17 9h4v10h-4zM8.5 20.5l2 2 4-4",
  cto: "M7 7h10v10H7zM10 10h4v4h-4zM9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3",
  applecare: "M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6zM9 12l2 2 4-4",
  team: "M7 3h6a1.5 1.5 0 0 1 1.5 1.5v15A1.5 1.5 0 0 1 13 21H7a1.5 1.5 0 0 1-1.5-1.5v-15A1.5 1.5 0 0 1 7 3zM9 18h2M17 7h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-3",
  knox: "M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6zM9.5 11V9.5a2.5 2.5 0 0 1 5 0V11M9 11h6v5H9z",
  service: "M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z",
};

const COPY: Record<Brand, { kick: string; h: string; accent: string; lead: string; items: readonly { key: string; title: string; lead: string; text: string }[]; note: string; second?: { label: string; href: string } }> = {
  apple: {
    kick: "Apple dla firm i instytucji",
    h: "Sprzęt Apple gotowy do pracy",
    accent: "od pierwszego dnia.",
    lead: "Dla firm, szkół i urzędów: zamówimy sprzęt w potrzebnej konfiguracji, zarejestrujemy go do wdrożenia i dodamy ochronę Apple. Jedno miejsce, od wyceny po odbiór.",
    items: applePrograms,
    note: APPLE_PROGRAM_NOTE,
  },
  samsung: {
    kick: "Samsung dla firm i instytucji",
    h: "Galaxy dla całego zespołu",
    accent: "z ochroną Samsung Knox.",
    lead: "Telefony, tablety i zegarki Galaxy dla firm, szkół i urzędów: dobierzemy modele, przygotujemy ofertę i pomożemy wdrożyć zabezpieczenia. Serwis masz na miejscu, w Rabce-Zdroju i Zakopanem.",
    items: samsungPrograms,
    note: SAMSUNG_PROGRAM_NOTE,
    second: { label: "Serwis Samsung", href: "/serwis-samsung" },
  },
};

/**
 * „… dla firm i instytucji” band in the brand salons (Apple: boss consent 23.11; Samsung: Krystian 24.11).
 * Wordmarks only, no brand logos (SPEC decision 18.11). Apple: sales and deployments, nothing suggests
 * an Apple service authorisation. Samsung: no current partner status — the KNOX partnership is past tense.
 */
export function BrandBusiness({ brand }: { brand: Brand }) {
  const c = COPY[brand];
  return (
    <section className="t-section t-section--tight" id="dla-firm" data-rail="Dla firm" aria-labelledby="t-abiz-h">
      <div className="t-container">
        <div className={`t-abiz t-abiz--${brand}`}>
          <span className="t-abiz__glow" aria-hidden="true" />
          <div className="t-abiz__head" data-t-reveal="">
            <span className="t-abiz__kick">
              <i aria-hidden="true" />
              {c.kick}
            </span>
            <h2 id="t-abiz-h" className="t-abiz__h">
              {c.h} <span>{c.accent}</span>
            </h2>
            <p className="t-abiz__lead">{c.lead}</p>
            <div className="t-abiz__actions">
              <Link href="/kontakt#formularz" className="t-hbtn t-hbtn--acc t-shine">
                Zapytaj o ofertę dla firmy
                <IconArrow size={16} strokeWidth={2.6} />
              </Link>
              {c.second ? (
                <Link href={c.second.href} className="t-hbtn t-hbtn--ghost t-abiz__ghost">
                  {c.second.label}
                </Link>
              ) : null}
            </div>
          </div>
          <ul className="t-abiz__cards" data-t-reveal="">
            {c.items.map((p, i) => (
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
          <p className="t-abiz__note">{c.note}</p>
        </div>
      </div>
    </section>
  );
}

