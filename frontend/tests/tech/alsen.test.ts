/** Runda 18.11 §1.5: ALSEN partner — data in config/prokom.ts, badge only for a confirmed point. */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { partners } from "@/config/prokom";
import { showsAlsenBadge } from "@/lib/tech/partners";

describe("ALSEN", () => {
  it("links to alsen.pl and the logo file exists in public/", () => {
    expect(partners.alsen.url).toBe("https://www.alsen.pl/");
    expect(fs.existsSync(path.resolve(__dirname, "../../public", `.${partners.alsen.logo.src}`))).toBe(true);
  });
  it("no badge until the partner point's address is confirmed", () => {
    expect(partners.alsen.pointConfirmed).toBe(false);
    expect(showsAlsenBadge("rabka")).toBe(false);
    expect(showsAlsenBadge("rabka", { pointKey: "rabka", pointConfirmed: true })).toBe(true);
    expect(showsAlsenBadge("zakopane", { pointKey: "rabka", pointConfirmed: true })).toBe(false);
  });
  it("no shop: nothing copies ALSEN prices or stock", () => {
    const src = fs.readFileSync(path.resolve(__dirname, "../../components/tech/AlsenPartner.tsx"), "utf8");
    expect(src).not.toMatch(/cen[ay]|zł|w magazynie|dostępn/i);
  });
});
