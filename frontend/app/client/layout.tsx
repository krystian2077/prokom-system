import { AuthProvider } from "@/contexts/AuthContext";
import { ClientGate } from "./ClientGate";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ClientGate>{children}</ClientGate>
    </AuthProvider>
  );
}
