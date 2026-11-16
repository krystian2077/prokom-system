import type { Metadata } from "next";
import { line, servicePoints } from "@/config/prokom";
import { BrandMarquee } from "@/components/tech/home/BrandMarquee";
import { CommonRepairs } from "@/components/tech/home/CommonRepairs";
import { CtaBand } from "@/components/tech/home/CtaBand";
import { DeviceGrid } from "@/components/tech/home/DeviceGrid";
import { HammerBlock } from "@/components/tech/home/HammerBlock";
import { Hero } from "@/components/tech/home/Hero";
import { HomeFaq } from "@/components/tech/home/HomeFaq";
import { PointsSection } from "@/components/tech/home/PointsSection";
import { ProcessSection } from "@/components/tech/home/ProcessSection";
import { TownsSection } from "@/components/tech/home/TownsSection";
import { WhySection } from "@/components/tech/home/WhySection";
import { RepairWizard } from "@/components/tech/RepairWizard";
import { claim } from "@/lib/tech/claims";
import { courierPageHref, courierPaysText, courierWhereText } from "@/lib/tech/courier";
import { publishedPoints, visiblePoints } from "@/lib/tech/points";
import { pageMetadata } from "@/lib/tech/seo";

const published = publishedPoints(servicePoints);
// SPEC §9: "… — Rabka-Zdrój i Zakopane | PRO-KOM Tech"; one city only if a point is unpublished.
const title = `Serwis telefonów i komputerów — ${published.map((p) => p.city).join(" i ")}`;
const description =
  published.length > 1
    ? `Serwis telefonów, laptopów, tabletów, komputerów, konsol i drukarek w Rabce-Zdroju i Zakopanem. Wycena przed naprawą, gwarancja i status naprawy online.`
    : `Serwis telefonów, laptopów, tabletów, komputerów, konsol i drukarek w Rabce-Zdroju. Najpierw diagnoza i wycena, gwarancja i status naprawy online.`;

// pageMetadata: canonical + full Open Graph (image, site name, pl_PL, type) like the other pages;
// the title is absolute because it already ends with the brand.
export const metadata: Metadata = {
  ...pageMetadata({ title, description, path: "/" }),
  title: { absolute: `${title} | ${line.name}` },
};

export default function HomePage() {
  const points = visiblePoints();
  return (
    <>
      <Hero points={points} publishedNames={published.map((p) => p.name)} />
      <BrandMarquee />
      <RepairWizard
        points={points.map((p) => ({ key: p.key, name: p.name, draft: p.draft }))}
        courier={{ sub: claim("courierWholeCountry"), pays: courierPaysText(), href: courierPageHref(), where: courierWhereText() }}
      />
      <DeviceGrid />
      <CommonRepairs />
      <PointsSection points={points} />
      <ProcessSection point={points.find((p) => !p.draft) ?? points[0]} />
      <HammerBlock />
      <WhySection points={points} />
      <TownsSection points={points} />
      <HomeFaq points={points} />
      <CtaBand points={points} />
    </>
  );
}
