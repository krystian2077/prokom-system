import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PRO-KOM Serwis — Naprawa telefonów i akcesoria GSM | Rabka-Zdrój",
  description:
    "Serwis telefonów, laptopów i tabletów w Rabce-Zdroju. Akcesoria GSM, szkła hartowane, folie Hammer Glass, etui dostępne od ręki. Bezpłatna diagnoza, szybka naprawa. ul. Orkana 16B.",
  alternates: {
    canonical: "https://pro-kom.eu",
  },
  openGraph: {
    title: "PRO-KOM Serwis — Naprawa telefonów i akcesoria GSM | Rabka-Zdrój",
    description:
      "Serwis telefonów, laptopów i tabletów w Rabce-Zdroju. Szkła hartowane, folie Hammer Glass, etui i akcesoria GSM. ul. Orkana 16B.",
    url: "https://pro-kom.eu",
  },
};

import { Hero } from "@/sections/Hero";
import { TrustStats } from "@/sections/TrustStats";
import { DeviceCategories } from "@/sections/DeviceCategories";
import { HowItWorks } from "@/sections/HowItWorks";
import { HammerGlass } from "@/sections/HammerGlass";
import { Accessories } from "@/sections/Accessories";
import { MostCommonRepairs } from "@/sections/MostCommonRepairs";
import { CTA } from "@/sections/CTA";
import { Reviews } from "@/sections/Reviews";
import { FAQ } from "@/sections/FAQ";
import { Contact } from "@/sections/Contact";

export default function HomePage() {
  return (
    <div className="public-home-page">
      <Hero />
      <TrustStats />
      <DeviceCategories />
      <HowItWorks />
      <MostCommonRepairs />
      <Reviews />
      <HammerGlass />
      <Accessories />
      <CTA />
      <FAQ />
      <Contact />
    </div>
  );
}
