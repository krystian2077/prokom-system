import type { Metadata } from "next";
import { line, servicePoints } from "@/config/prokom";
import { BrandMarquee } from "@/components/tech/home/BrandMarquee";
import { DeviceGrid } from "@/components/tech/home/DeviceGrid";
import { Hero } from "@/components/tech/home/Hero";
import { RepairWizard } from "@/components/tech/RepairWizard";
import { claim } from "@/lib/tech/claims";
import { courierPageHref, courierPaysText } from "@/lib/tech/courier";
import { publishedPoints, visiblePoints } from "@/lib/tech/points";
import { SITE_URL } from "@/lib/site-config";

const published = publishedPoints(servicePoints);
// SPEC §9: "… — Rabka-Zdrój i Zakopane | PRO-KOM Tech", Rabka only until Zakopane is published.
const title = `Serwis telefonów i komputerów — ${published.map((p) => p.city).join(" i ")}`;
const description =
  published.length > 1
    ? `Serwis telefonów, laptopów, tabletów, komputerów, konsol i drukarek w Rabce-Zdroju i Zakopanem. Najpierw diagnoza i wycena, gwarancja i status naprawy online.`
    : `Serwis telefonów, laptopów, tabletów, komputerów, konsol i drukarek w Rabce-Zdroju. Najpierw diagnoza i wycena, gwarancja i status naprawy online.`;

export const metadata: Metadata = {
  title: { absolute: `${title} | ${line.name}` },
  description,
  alternates: { canonical: SITE_URL },
  openGraph: { title: `${title} | ${line.name}`, description, url: SITE_URL },
};

export default function HomePage() {
  const points = visiblePoints();
  return (
    <>
      <Hero points={points} publishedNames={published.map((p) => p.name)} />
      <BrandMarquee />
      <RepairWizard
        points={points.map((p) => ({ key: p.key, name: p.name, draft: p.draft }))}
        courier={{ sub: claim("courierWholeCountry"), pays: courierPaysText(), href: courierPageHref() }}
      />
      <DeviceGrid />
    </>
  );
}
