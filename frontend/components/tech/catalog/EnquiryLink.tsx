"use client";

import Link from "next/link";
import { countItems } from "@/lib/tech/catalog/enquiry";
import { useEnquiry } from "./useEnquiry";

/** „Zapytanie (N)” — capsule icon / menu item with the live count of the enquiry list. */
export function EnquiryLink({ className = "", label = "Zapytanie", hideEmpty = false, megaNav = false }: { className?: string; label?: string; hideEmpty?: boolean; megaNav?: boolean }) {
  const [list, , ready] = useEnquiry();
  const n = ready ? countItems(list) : 0;
  // In the capsule the icon appears only once something is on the list (room for the other actions).
  if (hideEmpty && !n) return null;
  return (
    <Link href="/zapytanie" className={`t-enqlink ${className}`} data-mega-nav={megaNav ? "" : undefined} aria-label={n ? `${label}: ${n} ${n === 1 ? "pozycja" : "pozycje"}` : label}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M9 5h10M9 12h10M9 19h10M4 5h.01M4 12h.01M4 19h.01" />
      </svg>
      <span className="t-enqlink__t">{label}</span>
      {n ? <b className="t-enqlink__n">{n}</b> : null}
    </Link>
  );
}

/** Count of the enquiry list as a small badge on the capsule's „Sprzedaż” (takes no width). */
export function EnquiryBadge() {
  const [list, , ready] = useEnquiry();
  const n = ready ? countItems(list) : 0;
  if (!n) return null;
  return (
    <span className="t-navbadge">
      <span aria-hidden="true">{n}</span>
      <span className="t-visually-hidden"> (w zapytaniu: {n})</span>
    </span>
  );
}
