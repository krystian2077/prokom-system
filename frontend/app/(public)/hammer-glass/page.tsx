import HammerHero from "@/components/hammer-glass/HammerHero";
import HammerHowItWorks from "@/components/hammer-glass/HammerHowItWorks";
import HammerFilms from "@/components/hammer-glass/HammerFilms";
import HammerSpecs from "@/components/hammer-glass/HammerSpecs";
import HammerCompare from "@/components/hammer-glass/HammerCompare";
import HammerDevices from "@/components/hammer-glass/HammerDevices";
import HammerCta from "@/components/hammer-glass/HammerCta";

export const metadata = {
  title: "Hammer Glass CUT — Folia ochronna wycinana na miejscu | PRO-KOM",
  description:
    "Folia ochronna Hammer Glass CUT precyzyjnie wycinana w serwisie PRO-KOM w Rabce-Zdroju. 10 000+ modeli, 9 rodzajów folii, montaż w ~5 minut.",
};

export default function HammerGlassPage() {
  return (
    <main className="bg-white">
      <HammerHero />
      <HammerHowItWorks />
      <HammerFilms />
      <HammerSpecs />
      <HammerCompare />
      <HammerDevices />
      <HammerCta />
    </main>
  );
}
