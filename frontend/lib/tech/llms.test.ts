import { describe, expect, it } from "vitest";
import { line, servicePoints, type ServicePoint } from "@/config/prokom";
import { STATIC_ROUTES } from "./sitemap";
import { techLlmsTxt } from "./llms";

const text = techLlmsTxt(servicePoints, "https://prokomserwis.pl");

describe("llms.txt (SEO for AI assistants 23.11)", () => {
  it("starts with the line name and a summary", () => {
    expect(text.startsWith(`# ${line.name}\n\n> `)).toBe(true);
    expect(text).toContain("Rabka-Zdrój i Zakopane");
  });

  it("gives each published point its own phone and hours, then the general number", () => {
    for (const p of servicePoints.filter((x) => x.published)) {
      expect(text).toContain(`${line.name} ${p.name}: `);
      expect(text).toContain(`Telefon: ${p.phone}.`);
    }
    expect(text).toContain(`- Infolinia (wszystkie punkty): ${line.phoneDisplay}`);
    expect(text).toContain(`- E-mail: ${line.email}`);
  });

  it("leaves out an unpublished point", () => {
    const draft: ServicePoint[] = servicePoints.map((p) => (p.key === "zakopane" ? { ...p, published: false } : p));
    const only = techLlmsTxt(draft, "https://prokomserwis.pl");
    expect(only).not.toContain(`${line.name} Zakopane:`);
    expect(only).toContain("drukarek: Rabka-Zdrój (");
  });

  it("links only pages that exist in the sitemap (or the shop pages)", () => {
    const known = new Set([...STATIC_ROUTES.map((r) => r.path), "/sprzedaz"]);
    const links = Array.from(text.matchAll(/\]\(https:\/\/prokomserwis\.pl(\/[^)]*)\)/g)).map((m) => m[1]);
    expect(links.length).toBeGreaterThan(10);
    expect(links.filter((l) => !known.has(l))).toEqual([]);
  });

  it("links the other PRO-KOM lines, not itself", () => {
    expect(text).toContain("- [PRO-KOM](https://pro-kom.eu/): Wszystkie linie PRO-KOM.");
    expect(text).toContain("](https://prokombiznes.pl/)");
    expect(text).not.toContain("](https://prokomserwis.pl/)");
  });
});

describe("IndexNow key file (prokom-web ADR-030)", () => {
  it("public/<key>.txt holds exactly its own name — the key shared by every PRO-KOM domain", async () => {
    const fs = await import("node:fs");
    const files = fs.readdirSync("public").filter((f) => /^[0-9a-f]{32}\.txt$/.test(f));
    expect(files).toEqual(["1a909fcf3fdf8b994d75221027393cf8.txt"]);
    expect(fs.readFileSync(`public/${files[0]}`, "utf8")).toBe(files[0]!.replace(".txt", ""));
  });
});
