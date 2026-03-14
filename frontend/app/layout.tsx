import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Syne, DM_Sans } from "next/font/google";
import { ClientAuthWrapper } from "@/components/providers/ClientAuthWrapper";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-syne",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "PRO-KOM Serwis",
  description: "Serwis elektroniki — naprawy, Hammer Glass, akcesoria",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pl" className={`${syne.variable} ${dmSans.variable}`}>
      <body
        className={`min-h-screen font-sans antialiased ${dmSans.className}`}
        style={{ backgroundColor: "#fff", color: "#0f0f0f" }}
      >
        <ClientAuthWrapper>{children}</ClientAuthWrapper>
      </body>
    </html>
  );
}
