"use client";

import Link from "next/link";
import { useState } from "react";
import { addItem, makeItem, type EnquiryItem } from "@/lib/tech/catalog/enquiry";
import type { CatalogModel } from "@/lib/tech/catalog/types";
import { useEnquiry } from "./useEnquiry";

export type BundleAccessory = { key: string; name: string };

/**
 * „Zapytaj o całość” (runda 18.11 v2 §3): the model and what fits it — other catalogue models
 * (AirPods, Watch…) in their first variant and accessories (Hammer Glass, case, charger) as lines
 * of the enquiry — added with one click. Prices come in the answer.
 */
export function BundleButton({ model, models, accessories }: { model: CatalogModel; models: CatalogModel[]; accessories: BundleAccessory[] }) {
  const [list, save] = useEnquiry();
  const [done, setDone] = useState(false);
  const add = () => {
    let next = addItem(list, makeItem(model, model.colors[0]?.key ?? null, model.storage[0]?.key ?? null));
    for (const m of models) next = addItem(next, makeItem(m, m.colors[0]?.key ?? null, m.storage[0]?.key ?? null));
    for (const a of accessories) {
      const item: EnquiryItem = { brand: "akcesoria", slug: a.key, name: `${a.name} — do: ${model.name}`, color: null, colorName: null, storage: null, storageLabel: null, qty: 1 };
      next = addItem(next, item);
    }
    save(next);
    setDone(true);
  };
  return (
    <div className="t-bundle" aria-live="polite">
      <div>
        <b>Zapytaj o całość</b>
        <span>
          {model.name}
          {[...models.map((m) => m.name), ...accessories.map((a) => a.name)].map((n) => ` + ${n}`).join("")} — jednym kliknięciem do zapytania.
        </span>
      </div>
      {done ? (
        <Link href="/zapytanie" className="t-pbtn t-pbtn--outline t-pbtn--m">
          Dodano · Zobacz zapytanie
        </Link>
      ) : (
        <button type="button" className="t-pbtn t-pbtn--acc t-pbtn--m" onClick={add}>
          Dodaj zestaw do zapytania
        </button>
      )}
    </div>
  );
}
