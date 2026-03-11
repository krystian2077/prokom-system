import type { ReactNode } from "react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <PublicNavbar />
      <main className="min-h-[calc(100vh-8rem)]">{children}</main>
      <PublicFooter />
    </>
  );
}
