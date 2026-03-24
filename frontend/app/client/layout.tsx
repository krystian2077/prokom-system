import { ClientPanelThemeProvider } from "@/contexts/ClientPanelThemeContext";
import { ClientGate } from "./ClientGate";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientPanelThemeProvider>
      <ClientGate>{children}</ClientGate>
    </ClientPanelThemeProvider>
  );
}
