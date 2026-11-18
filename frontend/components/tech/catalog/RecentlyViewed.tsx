"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readRecent, rememberModel } from "@/lib/tech/catalog/recent";

export type RecentEntry = { name: string; href: string; hex: string };

/** Records the opened model card (once per visit of the page). */
export function RememberModel({ slug }: { slug: string }) {
  useEffect(() => rememberModel(slug), [slug]);
  return null;
}

/** „Ostatnio oglądane”: chips of the last models opened on this device (none → renders nothing). */
export function RecentlyViewed({ entries, exclude }: { entries: Record<string, RecentEntry>; exclude?: string }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  useEffect(() => setSlugs(readRecent().filter((s) => s !== exclude && entries[s])), [entries, exclude]);
  if (!slugs.length) return null;
  return (
    <nav className="t-recent" aria-label="Ostatnio oglądane">
      <span className="t-recent__t">Ostatnio oglądane</span>
      <ul>
        {slugs.map((s) => (
          <li key={s}>
            <Link href={entries[s].href} className="t-cchip t-cchip--soft t-recent__chip">
              <i aria-hidden="true" style={{ background: entries[s].hex }} />
              {entries[s].name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
