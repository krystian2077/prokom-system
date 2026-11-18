"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { normalizeText } from "@/lib/tech/search/normalize";
import type { Brand, Kind } from "@/lib/tech/catalog/types";

export type BrowserItem = { slug: string; brand: Brand; kind: Kind; family: string; familyName: string; text: string; order: number; card: ReactNode };

const KINDS: { key: Kind | "all"; label: string }[] = [
  { key: "all", label: "Wszystko" },
  { key: "phone", label: "Telefony" },
  { key: "tablet", label: "Tablety" },
  { key: "laptop", label: "Laptopy" },
  { key: "desktop", label: "Komputery" },
  { key: "watch", label: "Zegarki" },
  { key: "audio", label: "Słuchawki" },
];
const BRANDS: { key: Brand | "all"; label: string }[] = [
  { key: "all", label: "Apple i Samsung" },
  { key: "apple", label: "Apple" },
  { key: "samsung", label: "Samsung" },
];

/** Reads ?marka=&rodzaj=&q= on the client (the page itself is static). */
function readQuery() {
  const p = new URLSearchParams(window.location.search);
  const brand = p.get("marka");
  const kind = p.get("rodzaj");
  return {
    brand: (BRANDS.some((b) => b.key === brand) ? brand : "all") as Brand | "all",
    kind: (KINDS.some((k) => k.key === kind) ? kind : "all") as Kind | "all",
    q: p.get("q") ?? "",
  };
}

/**
 * /sprzedaz: filters (brand, kind), search and family chips over server-rendered cards. The state
 * goes to the address with history.replaceState(null, …) — Next 14.2 syncs it (see lib/tech/theme.ts)
 * — so a filtered view can be shared. Without JS every card is visible.
 */
export function CatalogBrowser({ items }: { items: BrowserItem[] }) {
  const [brand, setBrand] = useState<Brand | "all">("all");
  const [kind, setKind] = useState<Kind | "all">("all");
  const [family, setFamily] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = readQuery();
    setBrand(s.brand);
    setKind(s.kind);
    setQ(s.q);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const p = new URLSearchParams();
    if (brand !== "all") p.set("marka", brand);
    if (kind !== "all") p.set("rodzaj", kind);
    if (q.trim()) p.set("q", q.trim());
    const next = `${window.location.pathname}${p.size ? `?${p}` : ""}`;
    if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, "", next);
  }, [brand, kind, q, ready]);

  const base = useMemo(() => items.filter((i) => (brand === "all" || i.brand === brand) && (kind === "all" || i.kind === kind)), [items, brand, kind]);
  const families = useMemo(() => {
    const seen = new Map<string, string>();
    for (const i of base) if (!seen.has(i.family)) seen.set(i.family, i.familyName);
    return Array.from(seen, ([key, name]) => ({ key, name }));
  }, [base]);
  const needle = normalizeText(q);
  const shown = base.filter((i) => (!family || i.family === family) && (!needle || i.text.includes(needle)));
  const visible = new Set(shown.map((i) => i.slug));

  return (
    <div className="t-catb">
      <div className="t-catb__bar" role="search">
        <label className="t-catb__search">
          <span className="t-visually-hidden">Szukaj modelu</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj: iPhone 18, Galaxy S26, iPad…" autoComplete="off" />
        </label>
        <div className="t-catb__group" role="group" aria-label="Marka">
          {BRANDS.map((b) => (
            <button key={b.key} type="button" className="t-cchip" aria-pressed={brand === b.key} onClick={() => { setBrand(b.key); setFamily(null); }}>
              {b.label}
            </button>
          ))}
        </div>
        <div className="t-catb__group t-catb__kinds" role="group" aria-label="Rodzaj">
          {KINDS.map((k) => (
            <button key={k.key} type="button" className="t-cchip" aria-pressed={kind === k.key} onClick={() => { setKind(k.key); setFamily(null); }}>
              {k.label}
            </button>
          ))}
        </div>
        {families.length > 1 && (brand !== "all" || kind !== "all") ? (
          <div className="t-catb__group t-catb__families" role="group" aria-label="Rodzina">
            {families.map((f) => (
              <button key={f.key} type="button" className="t-cchip t-cchip--soft" aria-pressed={family === f.key} onClick={() => setFamily(family === f.key ? null : f.key)}>
                {f.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <p className="t-catb__count" aria-live="polite">
        {shown.length === 1 ? "1 model" : `${shown.length} ${shown.length % 10 >= 2 && shown.length % 10 <= 4 && (shown.length % 100 < 12 || shown.length % 100 > 14) ? "modele" : "modeli"}`} · od najnowszych
      </p>
      <ul className="t-catb__grid">
        {items.map((i) => (
          <li key={i.slug} hidden={ready && !visible.has(i.slug)}>
            {i.card}
          </li>
        ))}
      </ul>
      {ready && !shown.length ? <p className="t-catb__empty">Nie mamy takiego modelu w katalogu. Napisz w zapytaniu, czego szukasz — sprawdzimy u dystrybutora.</p> : null}
    </div>
  );
}
