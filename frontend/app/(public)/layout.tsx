import type { ReactNode } from "react";
import { ConditionalPublicLayout } from "@/components/layout/ConditionalPublicLayout";

export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ConditionalPublicLayout>{children}</ConditionalPublicLayout>;
}
