import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRO-KOM Serwis",
  description: "Serwis elektroniki — naprawy, Hammer Glass, akcesoria",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
