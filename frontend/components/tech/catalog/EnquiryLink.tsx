"use client";

import Link from "next/link";
import { countItems } from "@/lib/tech/catalog/enquiry";
import { useEnquiry } from "./useEnquiry";

/** „Zapytanie (N)” — capsule icon / menu item with the live count of the enquiry list. */
export function EnquiryLink({ className = "", label = "Zapytanie" }: { className?: string; label?: string }) {
  const [list, , ready] = useEnquiry();
  const n = ready ? countItems(list) : 0;
  return (
    <Link href="/zapytanie" className={`t-enqlink ${className}`} aria-label={n ? `${label}: ${n} ${n === 1 ? "pozycja" : "pozycje"}` : label}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M9 5h10M9 12h10M9 19h10M4 5h.01M4 12h.01M4 19h.01" />
      </svg>
      <span className="t-enqlink__t">{label}</span>
      {n ? <b className="t-enqlink__n">{n}</b> : null}
    </Link>
  );
}
