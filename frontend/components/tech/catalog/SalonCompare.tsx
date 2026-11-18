"use client";

import { useState } from "react";
import type { CatalogModel, Kind } from "@/lib/tech/catalog/types";

type Lite = Pick<CatalogModel, "slug" | "name" | "kind" | "specs" | "colors" | "storage">;

/**
 * Compare up to 3 models of one kind (runda 18.11 v2 §3): rows = spec labels of the picked models,
 * rows where the values differ are marked. No prices.
 */
export function SalonCompare({ models, kinds }: { models: Lite[]; kinds: { key: Kind; label: string }[] }) {
  const [kind, setKind] = useState<Kind>(kinds[0]?.key ?? "phone");
  const pool = models.filter((m) => m.kind === kind);
  const [sel, setSel] = useState<string[]>(pool.slice(0, 2).map((m) => m.slug));
  const picked = sel.map((s) => pool.find((m) => m.slug === s)).filter((m): m is Lite => !!m);
  const labels = Array.from(new Set(picked.flatMap((m) => m.specs.map((s) => s.label))));
  const rows: { label: string; values: string[] }[] = [
    { label: "Kolory", values: picked.map((m) => m.colors.map((c) => c.name).join(", ")) },
    ...(picked.some((m) => m.storage.length) ? [{ label: "Wersje", values: picked.map((m) => m.storage.map((s) => s.label).join(", ") || "—") }] : []),
    ...labels.map((label) => ({ label, values: picked.map((m) => m.specs.find((s) => s.label === label)?.value ?? "—") })),
  ];

  const toggle = (slug: string) => setSel(sel.includes(slug) ? sel.filter((s) => s !== slug) : sel.length >= 3 ? [...sel.slice(1), slug] : [...sel, slug]);

  return (
    <div className="t-cmp">
      {kinds.length > 1 ? (
        <div className="t-catb__group" role="group" aria-label="Co porównać">
          {kinds.map((k) => (
            <button
              key={k.key}
              type="button"
              className="t-cchip"
              aria-pressed={kind === k.key}
              onClick={() => {
                setKind(k.key);
                setSel(models.filter((m) => m.kind === k.key).slice(0, 2).map((m) => m.slug));
              }}
            >
              {k.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="t-catb__group t-cmp__pick" role="group" aria-label="Modele do porównania (do 3)">
        {pool.map((m) => (
          <button key={m.slug} type="button" className="t-cchip t-cchip--soft" aria-pressed={sel.includes(m.slug)} onClick={() => toggle(m.slug)}>
            {m.name}
          </button>
        ))}
      </div>
      {picked.length >= 2 ? (
        <div className="t-cmp__scroll" tabIndex={0} role="region" aria-label="Tabela porównania">
          <table className="t-cmp__table">
            <thead>
              <tr>
                <th scope="col">
                  <span className="t-visually-hidden">Parametr</span>
                </th>
                {picked.map((m) => (
                  <th key={m.slug} scope="col">
                    {m.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const differs = new Set(r.values).size > 1;
                return (
                  <tr key={r.label} className={differs ? "is-diff" : undefined}>
                    <th scope="row">
                      {r.label}
                      {differs ? <span className="t-visually-hidden"> (różni się)</span> : null}
                    </th>
                    {r.values.map((v, i) => (
                      <td key={picked[i].slug}>{v}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="t-cmp__hint">Wybierz co najmniej dwa modele.</p>
      )}
    </div>
  );
}
