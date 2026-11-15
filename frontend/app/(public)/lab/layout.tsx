import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isDraftMode } from "@/lib/tech/points";
import "../tech-lab.css";

/**
 * /lab — internal preview of the TP premium layer (docs/tech/PREMIUM.md §6).
 * Only with NEXT_PUBLIC_TECH_DRAFT=1 (staging / local); production builds render 404.
 * Never indexed, never in the sitemap.
 */
export const metadata: Metadata = {
  title: "Lab",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function LabLayout({ children }: { children: ReactNode }) {
  if (!isDraftMode()) notFound();
  return <div className="t-lab t-ui">{children}</div>;
}
