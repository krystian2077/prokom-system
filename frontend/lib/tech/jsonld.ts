/**
 * Site-wide JSON-LD for the public layout (docs/tech/SPEC.md §9, §12.1):
 * Organization (PRO-KOM) + one LocalBusiness per PUBLISHED point. Drafts never appear.
 */
import { company, line, servicePoints, social, type ServicePoint } from "@/config/prokom";
import { SITE_URL } from "@/lib/site-config";
import { publishedPoints } from "./points";

const DAYS: Record<string, string[]> = {
  "pn–pt": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  sob: ["Saturday"],
  nd: ["Sunday"],
};

/** Areas served per point (kept from the previous JSON-LD for Rabka). */
const AREAS: Record<ServicePoint["key"], string[]> = {
  rabka: ["Rabka-Zdrój", "Mszana Dolna", "Jordanów", "Raba Wyżna", "Nowy Targ", "Czarny Dunajec"],
  // TODO(krystian): confirm before Zakopane gets published: true (TD4, /obslugiwane-miejscowosci).
  zakopane: ["Zakopane", "Poronin", "Kościelisko", "Bukowina Tatrzańska", "Biały Dunajec"],
};

const phoneE164 = (p: string) => p.replace(/[^\d+]/g, "");

export function localBusiness(p: ServicePoint) {
  return {
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#punkt-${p.key}`,
    name: `${line.name} — ${p.name}`,
    url: SITE_URL,
    telephone: phoneE164(p.phone ?? line.phone),
    email: line.email,
    image: `${SITE_URL}/images/og-prokom.jpg`,
    parentOrganization: { "@id": `${SITE_URL}/#organization` },
    address: {
      "@type": "PostalAddress",
      ...(p.street ? { streetAddress: p.street } : {}),
      addressLocality: p.city,
      postalCode: p.postal,
      addressRegion: "małopolskie",
      addressCountry: "PL",
    },
    ...(p.geo ? { geo: { "@type": "GeoCoordinates", latitude: p.geo.lat, longitude: p.geo.lng } } : {}),
    openingHoursSpecification: p.hours
      .filter((h) => h.open && h.close)
      .map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: DAYS[h.days], opens: h.open, closes: h.close })),
    areaServed: AREAS[p.key].map((name) => ({ "@type": "City", name })),
  };
}

export function siteJsonLd(points: ServicePoint[] = servicePoints) {
  const published = publishedPoints(points);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: line.name,
        legalName: company.name,
        url: SITE_URL,
        logo: `${SITE_URL}/images/logo.png`,
        email: line.email,
        telephone: phoneE164(line.phone),
        foundingDate: String(company.since),
        taxID: company.nip,
        address: {
          "@type": "PostalAddress",
          streetAddress: company.hq.street,
          postalCode: company.hq.postal,
          addressLocality: company.hq.city,
          addressCountry: "PL",
        },
        sameAs: [social.facebook],
      },
      ...published.map(localBusiness),
    ],
  };
}

/** JSON for a <script type="application/ld+json">, safe against "</script>" injection. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
