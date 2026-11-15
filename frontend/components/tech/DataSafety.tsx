import { DATA_SAFETY_APPROVED, showFlagged } from "@/lib/tech/content-flags";
import { isDraftMode } from "@/lib/tech/points";
import { PageIconSvg } from "./page-icons";

/**
 * „Twoje dane są bezpieczne” (SPEC §12.9). The text must match what the service really
 * does with data. The four points below were accepted on 15.11.2026 (DATA_SAFETY_APPROVED in
 * lib/tech/content-flags.ts); if the flag is ever set back to false, the block hides in production.
 */
const ITEMS = [
  { t: "Dostęp tylko do testu", s: "Kod blokady służy wyłącznie do sprawdzenia sprzętu po naprawie." },
  { t: "Nie przeglądamy zawartości", s: "Zdjęcia, wiadomości i pliki zostają Twoje. Nie kopiujemy ich bez Twojej prośby." },
  { t: "Kopia po Twojej stronie", s: "Przed oddaniem sprzętu zrób kopię zapasową — to najlepsza ochrona danych." },
  { t: "Możesz oddać bez kodu", s: "Wtedy test po naprawie jest ograniczony, ale naprawę zrobimy." },
];

export function DataSafety({ approved = DATA_SAFETY_APPROVED, draft = isDraftMode() }: { approved?: boolean; draft?: boolean }) {
  if (!showFlagged(approved, draft)) return null;
  return (
    <section className="t-section t-section--tight" id="dane" data-rail="Twoje dane">
      <div className="t-container">
        <div className={`t-datasafety${approved ? "" : " t-draft"}`}>
          <div className="t-datasafety__head">
            <span className="t-eyebrow">
              Prywatność {approved ? null : <span className="t-draft-badge">do akceptacji</span>}
            </span>
            <h2 className="t-h2 t-h2--sm">Twoje dane są bezpieczne</h2>
          </div>
          <ul className="t-datasafety__list">
            {ITEMS.map((i) => (
              <li key={i.t}>
                <span className="t-datasafety__ico">
                  <PageIconSvg icon="check" size={18} strokeWidth={2.6} />
                </span>
                <div>
                  <b>{i.t}</b>
                  <p>{i.s}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
