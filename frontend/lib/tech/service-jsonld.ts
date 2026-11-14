/**
 * `Service` JSON-LD for device and repair pages (SPEC §9, §12.4, §12.10).
 * Provider = published service points only (their LocalBusiness @id from jsonld.ts).
 */
import { line, servicePoints, type ServicePoint } from "@/config/prokom";
import { SITE_URL } from "@/lib/site-config";
import { publishedPoints } from "./points";

export function serviceJsonLd({
  name,
  serviceType,
  path,
  description,
  points = servicePoints,
  areaServed,
}: {
  name: string;
  serviceType: string;
  path: string;
  description: string;
  points?: ServicePoint[];
  /** e.g. "Polska" for the courier service; default = cities of published points. */
  areaServed?: string[];
}) {
  const published = publishedPoints(points);
  const area = areaServed ?? published.map((p) => p.city);
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    serviceType,
    description,
    url: `${SITE_URL}${path}`,
    brand: { "@type": "Brand", name: line.name },
    provider: published.map((p) => ({ "@id": `${SITE_URL}/#punkt-${p.key}` })),
    areaServed: area.map((n) => (n === "Polska" ? { "@type": "Country", name: n } : { "@type": "City", name: n })),
  };
}
