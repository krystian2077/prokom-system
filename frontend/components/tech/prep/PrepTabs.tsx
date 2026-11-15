"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { PrepTab } from "@/lib/tech/prep-guide";
import { trackEvent } from "@/lib/tech/track-event";

/**
 * Device tabs of the preparation guide (SPEC §12.3). All panels are in the HTML (SEO, print);
 * inactive ones are `hidden`. Tab from the URL hash (#laptop) works for links from the form.
 */
export function PrepTabs({ tabs }: { tabs: PrepTab[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    trackEvent("poradnik_otwarty");
    const hash = window.location.hash.slice(1);
    if (tabs.some((t) => t.id === hash)) setActive(hash);
  }, [tabs]);

  const onKey = (e: KeyboardEvent, i: number) => {
    const n = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!n) return;
    e.preventDefault();
    const next = (i + n + tabs.length) % tabs.length;
    setActive(tabs[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div className="t-preptabs">
      <div role="tablist" aria-label="Urządzenie" className="t-preptabs__list">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-controls={`panel-${t.id}`}
            aria-selected={active === t.id}
            tabIndex={active === t.id ? 0 : -1}
            className={`t-preptabs__tab${active === t.id ? " is-on" : ""}`}
            onClick={() => setActive(t.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <section key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={active !== t.id} className="t-preptabs__panel">
          <h2 className="t-preptabs__print">{t.label}</h2>
          <ol className="t-prepsteps">
            {t.steps.map((s, i) => (
              <li key={s.t} className="t-card t-prepsteps__item">
                <span className="t-prepsteps__n" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <h3 className="t-h3 t-h3--sm">{s.t}</h3>
                  <p>{s.why}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

export function PrintButton() {
  return (
    <button type="button" className="t-pbtn t-pbtn--ghost-dark" onClick={() => window.print()}>
      Wydrukuj
    </button>
  );
}
