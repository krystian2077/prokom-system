import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/tech/seo";

// TD4: title within 30–60 with the suffix, absolute canonical + Open Graph (SPEC §9).
export const metadata: Metadata = pageMetadata({
  title: "Status naprawy online",
  description: "Sprawdź status naprawy po numerze zgłoszenia i 4 ostatnich cyfrach telefonu: przyjęcie, diagnoza, wycena, naprawa, gotowe do odbioru.",
  path: "/track",
});

export default function TrackLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
