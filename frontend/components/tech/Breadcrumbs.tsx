import Link from "next/link";
import type { Crumb } from "@/lib/tech/seo";

/** Breadcrumbs on dark stage heroes ("Start · Kontakt"); the last item is the current page. */
export function Breadcrumbs({ items, separator = "·" }: { items: Crumb[]; separator?: string }) {
  return (
    <nav aria-label="Okruszki" className="t-crumbs">
      <ol>
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={c.path}>
              {last ? <span aria-current="page">{c.name}</span> : <Link href={c.path} data-t-inline="">{c.name}</Link>}
              {last ? null : (
                <span className="t-crumbs__sep" aria-hidden="true">
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
