import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/tech/seo";

// TD4: title within 30–60 with the suffix, absolute canonical + Open Graph (SPEC §9).
export const metadata: Metadata = pageMetadata({
  title: "Zgłoś naprawę online",
  description: "Zgłoś naprawę telefonu, laptopa, tabletu albo komputera online — bez logowania, około minuty. Wycena przed naprawą, status naprawy online.",
  path: "/zgloszenie",
});

export default function ZgloszenieLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
