"use client";

import { useMemo, useState, type ReactNode } from "react";

export type SearchItem = { slug: string; haystack: string };

/**
 * Search by title and tags (in the browser, SPEC §12.11). The cards are rendered on the
 * server and passed as children keyed by slug; without JS every card stays visible.
 */
export function BlogSearch({ items, cards }: { items: SearchItem[]; cards: Record<string, ReactNode> }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLocaleLowerCase("pl-PL");
  const visible = useMemo(() => (query ? items.filter((i) => i.haystack.includes(query)) : items), [items, query]);
  return (
    <div className="t-bsearch">
      <label className="t-bsearch__field">
        <span className="t-visually-hidden">Szukaj w blogu</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj po tytule albo temacie, np. bateria" autoComplete="off" />
      </label>
      <p className="t-bsearch__count" aria-live="polite">
        {query ? `Znalezione wpisy: ${visible.length}` : `Wszystkie wpisy: ${items.length}`}
      </p>
      {visible.length ? (
        <ul className="t-bgrid">
          {visible.map((i) => (
            <li key={i.slug}>{cards[i.slug]}</li>
          ))}
        </ul>
      ) : (
        <p className="t-bsearch__empty">Nic nie znaleźliśmy. Spróbuj innego słowa albo wybierz kategorię.</p>
      )}
    </div>
  );
}
