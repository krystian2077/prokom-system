import type { Metadata } from "next";
import dynamic from "next/dynamic";

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
import { MostCommonRepairs } from "@/sections/MostCommonRepairs";

const Reviews = dynamic(() => import("@/sections/Reviews").then((mod) => mod.Reviews));
const HammerGlass = dynamic(() => import("@/sections/HammerGlass").then((mod) => mod.HammerGlass));
const Accessories = dynamic(() => import("@/sections/Accessories").then((mod) => mod.Accessories));
const CTA = dynamic(() => import("@/sections/CTA").then((mod) => mod.CTA));
const FAQ = dynamic(() => import("@/sections/FAQ").then((mod) => mod.FAQ));
const Contact = dynamic(() => import("@/sections/Contact").then((mod) => mod.Contact));

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
