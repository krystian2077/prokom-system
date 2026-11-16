"use client";

import { useRef, useState } from "react";
import { switchTechTheme } from "@/lib/tech/theme";
import { BrandMarquee } from "../home/BrandMarquee";
import { Faq } from "../Faq";
import { IconCheck } from "../icons";
import { usePill } from "../usePill";

const TABS = ["Telefon", "Laptop", "Konsola", "Drukarka"];
const STAGES = ["Przyjęte", "Diagnoza", "Naprawa", "Gotowe", "Odebrane"];

/** /lab/ruch: every motion pattern from tech-motion.css on one page. */
export function LabMotion() {
  const [tab, setTab] = useState(TABS[0]);
  const [axisKey, setAxisKey] = useState(0);
  const [reduced, setReduced] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  usePill(tabsRef, '[aria-selected="true"]', [tab]);

  const toggleReduced = () => {
    const on = !reduced;
    setReduced(on);
    document.documentElement.toggleAttribute("data-tech-reduced", on);
    document.querySelector(".tech")?.classList.toggle("t-reduced", on);
  };

  return (
    <div className="t-lab__motion">
      <div className="t-lab__row">
        <button type="button" className="t-hbtn t-hbtn--acc" onClick={(e) => switchTechTheme(document.documentElement.getAttribute("data-tech-theme") === "dark" ? "light" : "dark", { x: e.clientX, y: e.clientY })}>
          Przełącz motyw (koło)
        </button>
        <button type="button" className="t-hbtn t-hbtn--ghost" aria-pressed={reduced} onClick={toggleReduced}>
          {reduced ? "Ograniczony ruch: włączony" : "Wymuś ograniczony ruch"}
        </button>
      </div>

      <h2 className="t-h3">Zakładki z pigułką</h2>
      <div ref={tabsRef} className="t-pilltabs" role="tablist" aria-label="Przykład">
        <span className="t-pilltabs__pill" aria-hidden="true" />
        {TABS.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={t === tab} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <h2 className="t-h3">Przyciski i karty</h2>
      <div className="t-lab__row">
        <a href="#przyciski" className="t-hbtn t-hbtn--acc t-shine">
          Główny
        </a>
        <a href="#przyciski" className="t-hbtn t-hbtn--ghost">
          Drugi
        </a>
      </div>
      <div className="t-grid t-grid--3" id="przyciski">
        {["Karta z cieniem dwuwarstwowym", "Najedź — unosi się", "Wciśnij — lekko się zapada"].map((t) => (
          <a key={t} href="#przyciski" className="t-card t-lab__card">
            <b>{t}</b>
            <span>Wzorzec karty z tech-motion.css.</span>
          </a>
        ))}
        <div className="t-card t-lab__card t-edge">
          <b>Krawędź gradientowa</b>
          <span>Karta wyróżniona (.t-edge).</span>
        </div>
      </div>

      <h2 className="t-h3">Oś statusu (rysowana)</h2>
      <button type="button" className="t-lnk" onClick={() => setAxisKey((k) => k + 1)}>
        Narysuj jeszcze raz
      </button>
      <div className="t-trk">
        <ol key={axisKey} className="t-axis" aria-label="Etapy naprawy (przykład)">
          {STAGES.map((s, i) => {
            const state = i < 2 ? "done" : i === 2 ? "current" : "todo";
            return (
              <li key={s} className={`t-axis__item is-${state}`}>
                <span className="t-axis__bar" aria-hidden="true" />
                <div className="t-axis__row">
                  <span className="t-axis__dot" aria-hidden="true">
                    {state === "done" ? <IconCheck size={15} strokeWidth={3.2} /> : i + 1}
                  </span>
                  <div className="t-axis__txt">
                    <b>{s}</b>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <h2 className="t-h3">FAQ (grid-template-rows)</h2>
      <Faq
        items={[
          { q: "Jak to działa bez JavaScriptu?", a: "Natywny <details> — otwiera się zwyczajnie. Z JS wysokość płynnie rośnie przez grid-template-rows." },
          { q: "A przy ograniczonym ruchu?", a: "Otwiera się od razu, bez animacji." },
        ]}
        openFirst={false}
      />

      <h2 className="t-h3">Marquee (pauza przy najechaniu i poza ekranem)</h2>
      <BrandMarquee />

      <h2 className="t-h3">Szkielety</h2>
      <div className="t-lab__skel">
        <span className="t-skel" style={{ width: "60%", height: 18 }} />
        <span className="t-skel" style={{ width: "90%", height: 12 }} />
        <span className="t-skel" style={{ width: "75%", height: 12 }} />
      </div>

      <h2 className="t-h3">Reveal przy przewijaniu</h2>
      <div className="t-grid t-grid--3" data-t-stagger="">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="t-card t-lab__card" data-t-reveal="">
            <b>Blok {i + 1}</b>
            <span>Wchodzi z opóźnieniem {i * 40} ms.</span>
          </div>
        ))}
      </div>
    </div>
  );
}
