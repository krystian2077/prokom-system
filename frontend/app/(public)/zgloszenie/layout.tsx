import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Zgłoś naprawę",
  description: "Zgłoś naprawę telefonu, laptopa, tabletu albo komputera online — bez logowania, około minuty. Wycena przed naprawą, status naprawy online.",
  alternates: { canonical: "/zgloszenie" },
};

export default function ZgloszenieLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
