"use client";

import { useShell } from "../ShellContext";
import { requestSearch } from "@/lib/tech/search/open";

/** /lab/menu: shortcuts that open the real shell pieces (no copies — what you see is production code). */
export function LabMenu() {
  const { openSheet } = useShell();
  const openMega = (name: string) => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    const btn = Array.from(document.querySelectorAll<HTMLButtonElement>(".t-capsule [data-mega]")).find((b) => b.textContent?.includes(name));
    btn?.click();
  };
  return (
    <div className="t-lab__actions">
      <div className="t-card t-lab__card">
        <b>Mega menu (≥ 1024 px)</b>
        <span>Najedź na „Naprawy” lub „Punkty serwisowe” w kapsule. Intencja 80 ms, zamknięcie 250 ms, bezpieczny trójkąt. Klawiatura: ↓ / Enter, ← →, ↑ ↓, Esc.</span>
        <div className="t-lab__row">
          <button type="button" className="t-hbtn t-hbtn--ghost" onClick={() => openMega("Naprawy")}>
            Otwórz „Naprawy”
          </button>
          <button type="button" className="t-hbtn t-hbtn--ghost" onClick={() => openMega("Punkty")}>
            Otwórz „Punkty serwisowe”
          </button>
        </div>
      </div>
      <div className="t-card t-lab__card">
        <b>Arkusz Menu i TabBar (telefon, tablet pionowo)</b>
        <span>Karta iOS: strona pod spodem się pomniejsza. Zamknij przeciągnięciem w dół, szybkim ruchem albo Esc.</span>
        <div className="t-lab__row">
          <button type="button" className="t-hbtn t-hbtn--ghost" onClick={(e) => openSheet("menu", e.currentTarget)}>
            Otwórz Menu
          </button>
          <button type="button" className="t-hbtn t-hbtn--ghost" onClick={(e) => openSheet("naprawy", e.currentTarget)}>
            Otwórz Naprawy
          </button>
          <button type="button" className="t-hbtn t-hbtn--ghost" onClick={() => requestSearch()}>
            Otwórz Szukaj (Ctrl K)
          </button>
        </div>
      </div>
      <div className="t-lab__tall" aria-hidden="true">
        Przewiń w dół, żeby zobaczyć zwężanie kapsuły (≥ 1024) i chowanie (telefon).
      </div>
    </div>
  );
}
