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
    <div>
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
