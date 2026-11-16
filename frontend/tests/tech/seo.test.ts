/** SEO data (SPEC §9): sitemap from data, local pages guard, metadata norms of data-driven titles. Rendered pages: seo.spec.ts. */
import { describe, expect, it } from "vitest";
import { line, servicePoints, type ServicePoint } from "@/config/prokom";
import { hasUniqueContent, localPages, localPageState, nearbyTowns, publishedLocalPages } from "@/lib/tech/local-pages";
import { breadcrumbJsonLd, pageMetadata, serviceJsonLd } from "@/lib/tech/seo";
import { buildSitemap, STATIC_ROUTES } from "@/lib/tech/sitemap";
import { SITE_URL } from "@/lib/site-config";
import nextConfig from "../../next.config.js";

const withZakopane = (published: boolean): ServicePoint[] => servicePoints.map((p) => (p.key === "zakopane" ? { ...p, published } : p));
const paths = (points: ServicePoint[]) => buildSitemap(new Date("2026-11-15"), points).map((e) => e.url.replace(SITE_URL, "") || "/");

describe("sitemap.ts", () => {
  it("has no removed pages, panels or unpublished local pages", () => {
    const p = paths(servicePoints);
    expect(p).not.toContain("/akcesoria");
    expect(p).not.toContain("/oferta");
    expect(p.filter((x) => /^\/(panel|admin-panel|client|api)\b/.test(x))).toEqual([]);
    expect(p).toContain("/serwis-telefonow");
    expect(p).toContain("/punkty-serwisowe");
    expect(p).toContain("/o-firmie");
    expect(p).toContain("/serwis-telefonow-rabka-zdroj");
    expect(paths(withZakopane(false))).not.toContain("/serwis-telefonow-zakopane");
  });
  it("real config: lists the Zakopane page (point published 15.11.2026)", () => {
    expect(paths(servicePoints)).toContain("/serwis-telefonow-zakopane");
    expect(paths(withZakopane(true))).toContain("/serwis-telefonow-zakopane");
  });
  it("lists every address once", () => {
    const p = paths(servicePoints);
    expect(new Set(p).size).toBe(p.length);
    expect(new Set(STATIC_ROUTES.map((r) => r.path)).size).toBe(STATIC_ROUTES.length);
  });
});

describe("301 redirects (next.config.js)", () => {
  it("/akcesoria → /hammer-glass, /oferta → /, permanent; /serwis-telefonow is a page", async () => {
    const redirects = await nextConfig.redirects();
    expect(redirects).toContainEqual({ source: "/akcesoria", destination: "/hammer-glass", permanent: true });
    expect(redirects).toContainEqual({ source: "/oferta", destination: "/", permanent: true });
    expect(redirects.find((r: { source: string }) => r.source === "/serwis-telefonow")).toBeUndefined();
  });
});

describe("local pages (no doorway pages, SPEC §9)", () => {
  it("each page has its own content: intro, area, access, ≥ 3 questions, nearby towns", () => {
    for (const p of localPages) {
      expect(hasUniqueContent(p), p.slug).toBe(true);
      expect(nearbyTowns(p).every((t) => t.point === p.point && t.name !== p.city)).toBe(true);
    }
  });
  it("texts differ between the pages beyond the template", () => {
    const [a, b] = localPages;
    expect(a.intro).not.toBe(b.intro);
    expect(a.area).not.toBe(b.area);
    expect(a.access).not.toBe(b.access);
    const qa = new Set(a.faq.map((f) => f.q));
    const shared = b.faq.filter((f) => qa.has(f.q)).length;
    expect(shared / b.faq.length).toBeLessThan(0.5);
  });
  it("missing access text → not published", () => {
    const p = { ...localPages[0], access: null };
    expect(hasUniqueContent(p)).toBe(false);
    expect(localPageState(p, false)).toBe("hidden");
    expect(localPageState(p, true)).toBe("draft");
  });
  it("Zakopane unpublished: hidden in production, draft on staging", () => {
    const z = localPages.find((p) => p.point === "zakopane")!;
    expect(localPageState(z, false, withZakopane(false))).toBe("hidden");
    expect(localPageState(z, true, withZakopane(false))).toBe("draft");
    expect(publishedLocalPages(withZakopane(false)).map((p) => p.slug)).toEqual(["serwis-telefonow-rabka-zdroj"]);
  });
  it("real config: both local pages published", () => {
    const z = localPages.find((p) => p.point === "zakopane")!;
    expect(localPageState(z, false)).toBe("published");
    expect(publishedLocalPages().map((p) => p.slug)).toEqual(["serwis-telefonow-rabka-zdroj", "serwis-telefonow-zakopane"]);
  });
  it("titles 30–60 with the suffix, descriptions 120–155", () => {
    for (const p of localPages) {
      const full = `${p.title} | ${line.name}`;
      expect(full.length, full).toBeGreaterThanOrEqual(30);
      expect(full.length, full).toBeLessThanOrEqual(60);
      expect(p.description.length, p.description).toBeGreaterThanOrEqual(120);
      expect(p.description.length, p.description).toBeLessThanOrEqual(155);
    }
  });
});

describe("seo helpers", () => {
  it("pageMetadata: canonical and Open Graph on the same URL", () => {
    const m = pageMetadata({ title: "Kontakt", description: "x", path: "/kontakt" });
    expect(m.alternates?.canonical).toBe(`${SITE_URL}/kontakt`);
    expect((m.openGraph as { url: string }).url).toBe(`${SITE_URL}/kontakt`);
  });
  it("Service points at the LocalBusiness nodes of the layout", () => {
    const s = serviceJsonLd({ name: "Serwis telefonów", serviceType: "Naprawa telefonów", path: "/serwis-telefonow", providers: ["rabka"], areaServed: ["Rabka-Zdrój"] });
    expect(s.provider).toEqual([{ "@id": `${SITE_URL}/#punkt-rabka` }]);
    expect(breadcrumbJsonLd([{ name: "Start", path: "/" }]).itemListElement[0].item).toBe(`${SITE_URL}/`);
  });
});
