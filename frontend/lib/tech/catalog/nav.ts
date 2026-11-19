/**
 * Sales navigation (runda 18.11 v2 §2 „Nawigacja”): departments of both salons for the capsule's
 * „Sprzedaż” mega menu and the menu sheet. Reads only rodziny.json — the full catalogue stays out of
 * the client bundle.
 */
import families from "@/content/katalog/rodziny.json";
import type { Brand, Family } from "./types";

export const SALES_HREF = "/sprzedaz";
export const ENQUIRY_HREF = "/zapytanie";
export const SALON_HREF: Record<Brand, string> = { apple: "/apple", samsung: "/samsung" };

export type SalesLink = { label: string; href: string };

/** One column per brand: its departments (families) linking to the salon anchors. */
export function salesColumns(): { brand: Brand; title: string; salon: string; links: SalesLink[] }[] {
  const all = (families as Family[]).slice().sort((a, b) => b.order - a.order);
  return (["apple", "samsung"] as Brand[]).map((brand) => ({
    brand,
    title: brand === "apple" ? "Apple" : "Samsung",
    salon: SALON_HREF[brand],
    links: all.filter((f) => f.brand === brand).map((f) => ({ label: f.name, href: `${SALON_HREF[brand]}#${f.key}` })),
  }));
}

/** Data for the „Sprzedaż” menu and the home page section, built on the server (no catalogue in the client bundle). */
export type SalesTeaser = { name: string; href: string; img: string | null; transparent: boolean; bg: string | null; brand: Brand };
export type SalesNav = {
  count: number;
  /** Salon tiles: one hero product each. */
  salons: { brand: Brand; title: string; href: string; img: string | null; transparent: boolean; bg: string | null; departments: SalesLink[] }[];
  /** Newest models (one per family), newest first. */
  newest: SalesTeaser[];
};
