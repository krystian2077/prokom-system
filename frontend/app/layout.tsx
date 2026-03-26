import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Syne, DM_Sans, Unbounded, Plus_Jakarta_Sans } from "next/font/google";
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

const SITE_URL = "https://pro-kom.eu";

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["LocalBusiness", "ElectronicsStore", "RepairBusiness"],
              "@id": "https://pro-kom.eu/#business",
              name: "PRO-KOM Serwis",
              alternateName: "Prokom Serwis Rabka-Zdrój",
              description:
                "Serwis telefonów, laptopów, tabletów i akcesoriów GSM w Rabce-Zdroju. Naprawa smartfonów, wymiana ekranów i baterii, folie Hammer Glass, szkła hartowane, etui i ładowarki GaN.",
              url: "https://pro-kom.eu",
              logo: "https://pro-kom.eu/images/logo.png",
              image: "https://pro-kom.eu/images/og-prokom.jpg",
              telephone: "+48883200151",
              email: "sklep@pro-kom.eu",
              priceRange: "$$",
              address: {
                "@type": "PostalAddress",
                streetAddress: "ul. Orkana 16B",
                addressLocality: "Rabka-Zdrój",
                postalCode: "34-700",
                addressRegion: "małopolskie",
                addressCountry: "PL",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: 49.6130,
                longitude: 19.9629,
              },
              openingHoursSpecification: [
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                  opens: "09:00",
                  closes: "17:00",
                },
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: ["Saturday"],
                  opens: "09:00",
                  closes: "14:00",
                },
              ],
              areaServed: [
                {
                  "@type": "City",
                  name: "Rabka-Zdrój",
                  "@id": "https://www.wikidata.org/wiki/Q985891",
                },
                { "@type": "City", name: "Mszana Dolna" },
                { "@type": "City", name: "Jordanów" },
                { "@type": "City", name: "Raba Wyżna" },
                { "@type": "City", name: "Nowy Targ" },
                { "@type": "City", name: "Czarny Dunajec" },
              ],
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "Usługi serwisowe i sklep GSM",
                itemListElement: [
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Naprawa telefonów",
                      description:
                        "Naprawa smartfonów wszystkich marek: wymiana ekranu, baterii, gniazda ładowania, naprawa po zalaniu.",
                    },
                  },
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Serwis laptopów",
                      description:
                        "Naprawa laptopów: wymiana matrycy, klawiatury, czyszczenie, diagnostyka.",
                    },
                  },
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Hammer Glass CUT",
                      description:
                        "Folia ochronna wycinana laserowo na ploterze dla ponad 10 000 modeli telefonów. Montaż w 5 minut.",
                    },
                  },
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Product",
                      name: "Akcesoria GSM",
                      description:
                        "Ładowarki GaN, kable, powerbanki, etui, szkła hartowane, folie ochronne dostępne od ręki.",
                    },
                  },
                ],
              },
              sameAs: [
                "https://www.google.com/maps/place/Orkana+16B,+34-700+Rabka-Zdr%C3%B3j",
              ],
            }),
          }}
        />
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
