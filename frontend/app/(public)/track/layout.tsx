import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Status naprawy",
  description: "Sprawdź status naprawy po numerze zgłoszenia i 4 ostatnich cyfrach telefonu: przyjęcie, diagnoza, wycena, naprawa, gotowe do odbioru.",
  alternates: { canonical: "/track" },
};

export default function TrackLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
