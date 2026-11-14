"use client";

import Link from "next/link";
import { useState } from "react";
import { FILMS, filmLayer } from "@/lib/tech/hammer";

/** "Wybierz folię i zobacz różnicę" (design T.HammerGlass #folie): 9 films + phone preview. */
export function FilmPicker({ askHref }: { askHref: string }) {
  const [sel, setSel] = useState(FILMS.find((f) => f.star)?.n ?? FILMS[0].n);
  const cur = FILMS.find((f) => f.n === sel) ?? FILMS[0];
  return (
    <div className="t-films">
      <div className="t-films__grid" role="group" aria-label="Rodzaje folii">
        {FILMS.map((f) => (
          <button key={f.n} type="button" aria-pressed={f.n === sel} onClick={() => setSel(f.n)} className={`t-film${f.n === sel ? " is-on" : ""}`}>
            <span className="t-film__top">
              <span className="t-film__tier">{f.tier}</span>
              {f.star ? <span className="t-film__star">Polecana</span> : null}
            </span>
            <span className="t-film__name">{f.n}</span>
            <span className="t-film__desc">{f.d}</span>
            <span className="t-film__tags">
              {f.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </span>
          </button>
        ))}
      </div>
      <div className="t-films__preview" aria-live="polite">
        <span className="t-films__glow" aria-hidden="true" />
        <span className="t-eyebrow t-eyebrow--stage">Podgląd · {cur.n}</span>
        <div className="t-films__phone" aria-hidden="true">
          <span className="t-films__body" />
          <span className="t-films__screen" />
          <span className="t-films__time">9:41</span>
          <span className="t-films__date">sobota, 14 listopada</span>
          <span className="t-films__notch" />
          <span className="t-films__layer" style={{ background: filmLayer(cur.layer) }} />
          <span className="t-films__cut" />
        </div>
        <dl className="t-films__props">
          <div>
            <dt>Linia</dt>
            <dd>{cur.tier}</dd>
          </div>
          <div>
            <dt>Wykończenie</dt>
            <dd>{cur.fin}</dd>
          </div>
          <div>
            <dt>Cechy</dt>
            <dd>{cur.tags.join(", ")}</dd>
          </div>
        </dl>
        <Link href={askHref} className="t-pbtn t-pbtn--stage t-films__ask">
          Zapytaj o tę folię
        </Link>
      </div>
    </div>
  );
}
