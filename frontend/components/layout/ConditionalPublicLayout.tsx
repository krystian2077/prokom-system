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
      <main className="min-h-[calc(100vh-8rem)]">{children}</main>
      <PublicFooter />
    </>
  );
}
