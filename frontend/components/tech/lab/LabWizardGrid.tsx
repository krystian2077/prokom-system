"use client";

import { useState, type CSSProperties } from "react";
import { EFFECT_FAMILIES, faultMeaning, sceneOf, wizardDevices } from "@/lib/tech/wizard-data";
import { ThemeSegmented } from "../ThemeToggle";
import { Scene } from "../wizard/Scene";

const WIDTHS = [240, 320, 420] as const;

/** /lab/kreator: all 66 pairs as posters, "Odtwórz" per card, theme and card width. */
export function LabWizardGrid() {
  const [width, setWidth] = useState<(typeof WIDTHS)[number]>(320);
  const [playing, setPlaying] = useState<Record<string, number>>({});
  const [device, setDevice] = useState<string>("all");
  const play = (k: string) => setPlaying((p) => ({ ...p, [k]: (p[k] ?? 0) + 1 }));
  const list = wizardDevices.filter((d) => device === "all" || d.id === device);

  return (
    <>
      <div className="t-lab__bar">
        <div className="t-lab__ctl">
          <span className="t-label">Motyw</span>
          <ThemeSegmented />
        </div>
        <div className="t-lab__ctl">
          <span className="t-label">Szerokość karty</span>
          <div className="t-pilltabs" role="radiogroup" aria-label="Szerokość karty">
            {WIDTHS.map((w) => (
              <button key={w} type="button" role="radio" aria-checked={w === width} onClick={() => setWidth(w)} style={w === width ? { background: "var(--card)" } : undefined}>
                {w}px
              </button>
            ))}
          </div>
        </div>
        <div className="t-lab__ctl">
          <span className="t-label">Urządzenie</span>
          <select className="t-lab__select" value={device} onChange={(e) => setDevice(e.target.value)}>
            <option value="all">Wszystkie (66)</option>
            {wizardDevices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label} ({d.faults.length})
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="t-hbtn t-hbtn--ghost t-lab__all" onClick={() => list.forEach((d) => d.faults.forEach((f) => play(`${d.id}:${f}`)))}>
          Odtwórz widoczne
        </button>
      </div>

      {list.map((d) => (
        <div key={d.id} className="t-lab__group">
          <h2 className="t-h3">{d.label}</h2>
          <ul className="t-lab__grid" style={{ "--lab-w": `${width}px` } as CSSProperties}>
            {d.faults.map((f) => {
              const k = `${d.id}:${f}`;
              const sc = sceneOf(d, f);
              const n = playing[k] ?? 0;
              return (
                <li key={k} className="t-lab__item" data-pair={k}>
                  <Scene key={`${k}:${n}`} device={d} fault={f} poster={n === 0} interactive={false} />
                  <div className="t-lab__meta">
                    <b>{f}</b>
                    <span>
                      {sc.effect} · {EFFECT_FAMILIES[sc.effect]}
                      {sc.variant ? ` (${sc.variant})` : ""} · {sc.spot ? "punkt" : "cały"}
                    </span>
                    <small>{faultMeaning(d.id, f)}</small>
                    <button type="button" className="t-lab__play" onClick={() => play(k)}>
                      ▶ Odtwórz
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}
