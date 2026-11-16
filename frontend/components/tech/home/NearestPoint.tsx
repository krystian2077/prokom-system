"use client";

import { useId, useState, type FormEvent } from "react";
import type { PointKey } from "@/config/prokom";
import { nearestPoint, pointLocative, towns } from "@/lib/tech/towns";
import { IconCheck } from "../icons";

/** "Sprawdź, gdzie masz bliżej" — typed town → nearer visible point (no distances, SPEC §10). */
export function NearestPoint({ visible }: { visible: PointKey[] }) {
  const id = useId();
  const [value, setValue] = useState("Nowy Targ");
  const [result, setResult] = useState<string | null>(() => describe("Nowy Targ", visible));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setResult(describe(value, visible));
  }

  return (
    <form className="t-near" onSubmit={onSubmit}>
      <label htmlFor={`${id}-msc`} className="t-near__label">
        Sprawdź, gdzie masz bliżej
      </label>
      <div className="t-near__row">
        <input
          id={`${id}-msc`}
          className="t-near__input"
          type="text"
          list={`${id}-towns`}
          autoComplete="address-level2"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <datalist id={`${id}-towns`}>
          {towns.map((t) => (
            <option key={t.slug} value={t.name} />
          ))}
        </datalist>
        <button type="submit" className="t-hbtn t-hbtn--dark">
          Sprawdź
        </button>
      </div>
      <p className="t-near__result" aria-live="polite">
        {result ? (
          <>
            <IconCheck size={16} />
            {result}
          </>
        ) : (
          "Nie mamy tej miejscowości na liście — zadzwoń, podpowiemy."
        )}
      </p>
    </form>
  );
}

function describe(input: string, visible: PointKey[]): string | null {
  const r = nearestPoint(input, visible);
  return r ? `${r.town.name} · bliżej do punktu ${pointLocative[r.point]}` : null;
}
