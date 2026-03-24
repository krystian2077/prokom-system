"use client";

import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";

export function ConditionalPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicNavbar />
      <div className="overflow-x-hidden">
        <main className="min-h-[calc(100vh-8rem)] pt-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:pt-[calc(4rem+env(safe-area-inset-top,0px))] lg:pt-[calc(5rem+env(safe-area-inset-top,0px))]">
          {children}
        </main>
        <PublicFooter />
      </div>
    </>
  );
}
