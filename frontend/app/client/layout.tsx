import { ClientGate } from "./ClientGate";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientGate>{children}</ClientGate>;
}
