import HammerHero from "@/components/hammer-glass/HammerHero";
import HammerHowItWorks from "@/components/hammer-glass/HammerHowItWorks";
import HammerFilms from "@/components/hammer-glass/HammerFilms";
import HammerSpecs from "@/components/hammer-glass/HammerSpecs";
import HammerCompare from "@/components/hammer-glass/HammerCompare";
import HammerDevices from "@/components/hammer-glass/HammerDevices";
import HammerCta from "@/components/hammer-glass/HammerCta";

export const metadata = {
  title: "Hammer Glass CUT — folia ochronna na telefon | PRO-KOM Rabka-Zdrój",
  description:
    "Folia ochronna Hammer Glass CUT wycinana laserowo w serwisie PRO-KOM w Rabce-Zdroju. Ponad 10 000 modeli telefonów, 9 rodzajów folii, montaż w ~5 minut. Ochrona ekranu lepsza niż szkło hartowane.",
  alternates: {
    canonical: "https://pro-kom.eu/hammer-glass",
  },
  openGraph: {
    title: "Hammer Glass CUT — folia ochronna na telefon | PRO-KOM Rabka-Zdrój",
    description:
      "Folia ochronna precyzyjnie wycinana dla Twojego modelu telefonu. 10 000+ modeli, montaż w 5 minut. ul. Orkana 16B, Rabka-Zdrój.",
    url: "https://pro-kom.eu/hammer-glass",
  },
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
