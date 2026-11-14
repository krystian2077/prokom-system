import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Syne, DM_Sans, Unbounded, Plus_Jakarta_Sans } from "next/font/google";
import { ClientAuthWrapper } from "@/components/providers/ClientAuthWrapper";
import { SITE_URL } from "@/lib/site-config";
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
const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-unbounded",
});
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
});


export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PRO-KOM Serwis — Naprawa telefonów i akcesoria GSM | Rabka-Zdrój",
    template: "%s | PRO-KOM Rabka-Zdrój",
  },
  description:
    "Serwis telefonów, laptopów i tabletów w Rabce-Zdroju. Akcesoria GSM, szkła hartowane, folie Hammer Glass, etui. Szybka naprawa, bezpłatna diagnoza. ul. Orkana 16B.",
  keywords: [
    "serwis telefonów Rabka-Zdrój",
    "naprawa telefonów Rabka-Zdrój",
    "akcesoria GSM Rabka-Zdrój",
    "szkło hartowane Rabka-Zdrój",
    "Hammer Glass Rabka-Zdrój",
    "serwis laptopów Rabka-Zdrój",
    "PRO-KOM serwis",
  ],
  authors: [{ name: "PRO-KOM Serwis", url: SITE_URL }],
  creator: "PRO-KOM Serwis",
  publisher: "PRO-KOM Serwis",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: SITE_URL,
    siteName: "PRO-KOM Serwis Rabka-Zdrój",
    title: "PRO-KOM Serwis — Naprawa telefonów i akcesoria GSM | Rabka-Zdrój",
    description:
      "Serwis telefonów, laptopów i tabletów w Rabce-Zdroju. Akcesoria GSM, szkła hartowane, folie Hammer Glass, etui. ul. Orkana 16B.",
    images: [
      {
        url: "/images/og-prokom.jpg",
        width: 1200,
        height: 630,
        alt: "PRO-KOM Serwis Rabka-Zdrój — serwis telefonów i akcesoria GSM",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PRO-KOM Serwis — Naprawa telefonów | Rabka-Zdrój",
    description:
      "Serwis telefonów, akcesoria GSM, Hammer Glass. Rabka-Zdrój, ul. Orkana 16B.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="pl"
      suppressHydrationWarning
      className={`${syne.variable} ${dmSans.variable} ${unbounded.variable} ${plusJakarta.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='prokom-theme';var s=localStorage.getItem(k);var m=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',s||m);}catch(e){}})();`,
          }}
        />
        {/* Site JSON-LD moved to app/(public)/layout.tsx (SPEC §9) — panels do not need it. */}
      </head>
      <body
        className={`min-h-screen font-sans antialiased ${dmSans.className}`}
        style={{ backgroundColor: "#fff", color: "#0f0f0f" }}
      >
        <ClientAuthWrapper>{children}</ClientAuthWrapper>
      </body>
    </html>
  );
}
