"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { addItem, countItems, makeItem } from "@/lib/tech/catalog/enquiry";
import { trackEvent } from "@/lib/tech/track-event";
import type { CatalogModel } from "@/lib/tech/catalog/types";
import { ModelVisual } from "./ModelVisual";
import { useEnquiry } from "./useEnquiry";

export const ENQUIRY_HREF = "/zapytanie";

/**
 * Model card top (runda 18.11 v2 §2): the visual changes with the colour (with a glow in the
 * variant colour), colour swatches and storage chips — a configurator without prices — and the
 * sticky „Dodaj do zapytania” with the picked variant. The colour lives in ?kolor= (canonical stays
 * clean), set with history.replaceState(null, …) so Next 14.2 keeps its router in step.
 */
export function ModelConfigurator({ model }: { model: CatalogModel }) {
  const [color, setColor] = useState(model.colors[0]?.key ?? null);
  const [storage, setStorage] = useState(model.storage[0]?.key ?? null);
  const [added, setAdded] = useState(false);
  const [list, save] = useEnquiry();
  const uid = useId();

  useEffect(() => {
    const k = new URLSearchParams(window.location.search).get("kolor");
    if (k && model.colors.some((c) => c.key === k)) setColor(k);
  }, [model.colors]);

  const pickColor = (key: string) => {
    setColor(key);
    setAdded(false);
    const url = new URL(window.location.href);
    url.searchParams.set("kolor", key);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  const c = model.colors.find((x) => x.key === color) ?? model.colors[0];
  const s = model.storage.find((x) => x.key === storage) ?? null;
  const add = () => {
    save(addItem(list, makeItem(model, color, storage)));
    trackEvent("zapytanie_dodaj", { rodzaj: model.kind });
    setAdded(true);
  };
  const summary = [c?.name, s?.label].filter(Boolean).join(" · ");
  const n = countItems(list);

  return (
    <div className="t-mconf" style={{ "--variant": c?.hex } as React.CSSProperties}>
      <div className="t-mconf__stage">
        <ModelVisual model={model} color={c?.key} size="hero" priority />
      </div>
      <div className="t-mconf__panel">
        <fieldset className="t-mconf__set">
          <legend>
            Kolor: <b>{c?.name}</b>
            {c?.officialStoreOnly ? <span className="t-mconf__hint"> — kolor z Oficjalnych Sklepów Samsung, sprawdzimy dostępność</span> : null}
          </legend>
          <div className="t-mconf__swatches" role="radiogroup" aria-label="Kolor">
            {model.colors.map((x) => (
              <button key={x.key} type="button" role="radio" aria-checked={x.key === c?.key} aria-label={x.name} title={x.name} className="t-swatch" style={{ "--sw": x.hex } as React.CSSProperties} onClick={() => pickColor(x.key)}>
                <i aria-hidden="true" />
              </button>
            ))}
          </div>
        </fieldset>
        {model.storage.length ? (
          <fieldset className="t-mconf__set">
            <legend>{model.kind === "watch" ? "Rozmiar i łączność" : model.kind === "laptop" || model.kind === "desktop" ? "Konfiguracja" : "Pamięć"}</legend>
            <div className="t-mconf__opts" role="radiogroup" aria-label="Wersja">
              {model.storage.map((x) => (
                <button key={x.key} type="button" role="radio" aria-checked={x.key === storage} className="t-mopt" onClick={() => { setStorage(x.key); setAdded(false); }}>
                  {x.label}
                  {x.ram && !x.label.includes(x.ram) ? <small>{x.ram} RAM</small> : null}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}
        <p className="t-mconf__note">Bez cen na stronie: wyślij zapytanie, a odpowiemy z ceną i dostępnością. Odbiór w salonie w Rabce-Zdroju albo w Zakopanem.</p>
      </div>
      <div className="t-mbar" role="region" aria-labelledby={`${uid}-bar`}>
        <div className="t-mbar__in">
          <span className="t-mbar__what" id={`${uid}-bar`}>
            <b>{model.name}</b>
            <span>{summary}</span>
          </span>
          <span className="t-mbar__act" aria-live="polite">
            {added ? (
              <Link href={ENQUIRY_HREF} className="t-pbtn t-pbtn--outline t-pbtn--m t-mbar__see">
                Dodano · Zobacz zapytanie ({n})
              </Link>
            ) : null}
            <button type="button" className="t-pbtn t-pbtn--acc t-pbtn--m t-mbar__add" onClick={add}>
              Dodaj do zapytania
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
