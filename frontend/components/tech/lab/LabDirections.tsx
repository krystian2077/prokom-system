"use client";

import { deviceById } from "@/lib/tech/wizard-data";
import { directionA } from "@/lib/tech/wizard-direction-a";
import { Scene } from "../wizard/Scene";

const PAIRS: [string, string][] = [
  ["telefon", "Pęknięty ekran"],
  ["laptop", "Matryca"],
];

/**
 * /lab/kreator: the two directions considered in feat/tech-kreator-wow, side by side.
 * A — the prototype photos in the new studio scene; B — own vector illustrations (chosen).
 */
export function LabDirections() {
  return (
    <div className="t-lab__group" data-testid="lab-directions">
      <h2 className="t-h3">Kierunek A (zdjęcia z prototypu) i B (własne ilustracje — wybrany)</h2>
      <ul className="t-lab__grid" style={{ ["--lab-w" as string]: "420px" }}>
        {PAIRS.flatMap(([id, fault]) => {
          const a = directionA.find((d) => d.id === id)!;
          const b = deviceById(id);
          return [
            <li key={`a${id}`} className="t-lab__item" data-direction="A">
              <Scene device={a} fault={fault} poster interactive={false} />
              <div className="t-lab__meta">
                <b>A · {a.label}</b>
                <small>Zdjęcie 433–640 px: miękkie przy 2×, inny kąt i światło niż reszta, laptop tylko od tyłu (matryca na pokrywie).</small>
              </div>
            </li>,
            <li key={`b${id}`} className="t-lab__item" data-direction="B">
              <Scene device={b} fault={fault} poster interactive={false} />
              <div className="t-lab__meta">
                <b>B · {b.label}</b>
                <small>Wektor: ostry w każdej skali, jeden kąt i materiał dla 9 urządzeń, warianty jasny/ciemny, regiony efektów co do piksela.</small>
              </div>
            </li>,
          ];
        })}
      </ul>
    </div>
  );
}
