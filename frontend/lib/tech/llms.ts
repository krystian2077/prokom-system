/**
 * llms.txt of prokomserwis.pl (llmstxt.org; SEO for AI assistants 23.11.2026): who we are, the
 * published points with their own phones and hours, the main pages and the other PRO-KOM lines —
 * so ChatGPT, Claude, Perplexity or Copilot can send a reader to the right point. Every contact
 * value comes from config/prokom.ts (tests/tech/literaly.test.ts); no prices (SPEC §8).
 */
import { company, line, lines, partners, pointPhone, servicePoints, type ServicePoint } from "@/config/prokom";
import { SITE_URL } from "@/lib/site-config";
import { hoursLong } from "./point-format";
import { publishedPoints } from "./points";

/** Main pages, in the order of the menu (all listed in the sitemap). */
const PAGES: [label: string, path: string][] = [
  ["Zgłoś naprawę online", "/zgloszenie"],
  ["Status naprawy", "/track"],
  ["Punkty serwisowe", "/punkty-serwisowe"],
  ["Serwis telefonów", "/serwis-telefonow"],
  ["Serwis laptopów", "/serwis-laptopow"],
  ["Serwis tabletów", "/serwis-tabletow"],
  ["Serwis komputerów", "/serwis-komputerow"],
  ["Serwis konsol", "/serwis-konsol"],
  ["Serwis drukarek", "/serwis-drukarek"],
  ["Odzyskiwanie danych", "/odzyskiwanie-danych"],
  ["Serwis Apple", "/serwis-apple"],
  ["Serwis Samsung", "/serwis-samsung"],
  ["Hammer Glass — folie na wymiar", "/hammer-glass"],
  ["Sprzedaż", "/sprzedaz"],
  ["Obsługiwane miejscowości", "/obslugiwane-miejscowosci"],
  ["FAQ", "/faq"],
  ["O firmie", "/o-firmie"],
  ["Kontakt", "/kontakt"],
];

function pointLine(p: ServicePoint): string {
  const address = [p.street, `${p.postal} ${p.city}`].filter(Boolean).join(", ");
  const partner = partners.alsen.pointConfirmed && partners.alsen.pointKey === p.key ? " Autoryzowany partner ALSEN." : "";
  return `- ${line.name} ${p.name}: ${address}. Telefon: ${pointPhone(p)}. Godziny: ${hoursLong(p)}.${partner}`;
}

export function techLlmsTxt(points: ServicePoint[] = servicePoints, origin: string = SITE_URL): string {
  const published = publishedPoints(points);
  const cities = published.map((p) => p.city).join(" i ");
  const others = lines.filter((l) => l.key !== "tech");
  return [
    `# ${line.name}`,
    "",
    `> Serwis telefonów, laptopów, tabletów, komputerów, konsol i drukarek: ${cities} (${company.name}, od ${company.since} roku). Wycena przed naprawą, gwarancja i status naprawy online.`,
    "",
    ...published.map(pointLine),
    `- Infolinia (wszystkie punkty): ${line.phoneDisplay}`,
    `- E-mail: ${line.email}`,
    "",
    "## Strony",
    "",
    ...PAGES.map(([label, path]) => `- [${label}](${origin}${path})`),
    "",
    "## Inne linie PRO-KOM",
    "",
    ...others.map((l) => `- [PRO-KOM${l.label ? ` ${l.name}` : ""}](https://${l.domain}/): ${l.description}.`),
    "",
  ].join("\n");
}
