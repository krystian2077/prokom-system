import { describe, expect, it } from "vitest";
import { servicePoints } from "@/config/prokom";
import { activeNotice, isDraftMode, publishedPoints, visiblePoints } from "./points";

describe("visiblePoints", () => {
  it("production: only published points", () => {
    const keys = visiblePoints(false).map((p) => p.key);
    expect(keys).toEqual(servicePoints.filter((p) => p.published).map((p) => p.key));
    expect(keys).not.toContain("zakopane"); // published: false until the exact pin (SPEC §10)
  });
  it("staging draft: all points, unpublished flagged", () => {
    const pts = visiblePoints(true);
    expect(pts.map((p) => p.key)).toEqual(servicePoints.map((p) => p.key));
    expect(pts.find((p) => p.key === "zakopane")?.draft).toBe(true);
    expect(pts.find((p) => p.key === "rabka")?.draft).toBe(false);
  });
  it("draft flag comes only from NEXT_PUBLIC_TECH_DRAFT=1", () => {
    expect(isDraftMode({ NEXT_PUBLIC_TECH_DRAFT: "1" })).toBe(true);
    expect(isDraftMode({ NEXT_PUBLIC_TECH_DRAFT: "true" })).toBe(false);
    expect(isDraftMode({})).toBe(false);
  });
  it("publishedPoints never includes drafts", () => {
    expect(publishedPoints().every((p) => p.published)).toBe(true);
  });
});

describe("activeNotice", () => {
  const list = [
    { id: "a", text: "Inwentaryzacja", from: "2026-12-01", to: "2026-12-02" },
    { id: "b", text: "Święta", from: "2026-12-20", to: "2026-12-27" },
  ];
  it("inclusive end, Warsaw date", () => {
    expect(activeNotice(new Date("2026-12-02T21:00:00Z"), list)?.id).toBe("a"); // 22:00 on 2.12
    expect(activeNotice(new Date("2026-12-02T23:30:00Z"), list)).toBeNull(); // 00:30 on 3.12
    expect(activeNotice(new Date("2026-12-24T12:00:00Z"), list)?.id).toBe("b");
  });
  it("no notices → null", () => {
    expect(activeNotice(new Date(), [])).toBeNull();
  });
});
