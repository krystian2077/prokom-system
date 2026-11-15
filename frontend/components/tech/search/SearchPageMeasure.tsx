"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/tech/track-event";

/** `/szukaj` measurement (SPEC §12.5): phrase length and result count — never the phrase. */
export function SearchPageMeasure({ length, results }: { length: number; results: number }) {
  useEffect(() => {
    trackEvent("szukaj", { dlugosc: length, wyniki: results, zrodlo: "strona" });
  }, [length, results]);
  return null;
}
