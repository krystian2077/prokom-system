import { Hero } from "@/sections/Hero";
import { TrustStats } from "@/sections/TrustStats";
import { DeviceCategories } from "@/sections/DeviceCategories";
import { Services } from "@/sections/Services";
import { HowItWorks } from "@/sections/HowItWorks";
import { HammerGlass } from "@/sections/HammerGlass";
import { Accessories } from "@/sections/Accessories";
import { CommonPhoneIssues } from "@/sections/CommonPhoneIssues";
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
      <Services />
      <HammerGlass />
      <Accessories />
      <CommonPhoneIssues />
      <CTA />
      <Reviews />
      <FAQ />
      <Contact />
    </div>
  );
}
