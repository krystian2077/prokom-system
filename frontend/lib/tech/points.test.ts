import { describe, expect, it } from "vitest";
import { GENERAL_EMAIL_LABEL, GENERAL_PHONE_LABEL, line, pointEmail, pointPhone, servicePoints, type ServicePoint } from "@/config/prokom";
import { activeNotice, isDraftMode, publishedPoints, visiblePoints } from "./points";

/** Test data: the real config with Zakopane switched back to unpublished. */
const zakopaneUnpublished: ServicePoint[] = servicePoints.map((p) =>
  p.key === "zakopane" ? { ...p, published: false } : p,
);

describe("visiblePoints", () => {
  it("real config: both points published (Zakopane pin confirmed 15.11.2026)", () => {
    expect(visiblePoints(false).map((p) => p.key)).toEqual(["rabka", "zakopane"]);
    expect(visiblePoints(false).every((p) => !p.draft)).toBe(true);
    expect(publishedPoints().map((p) => p.key)).toEqual(["rabka", "zakopane"]);
  });
  it("production: an unpublished point is not rendered", () => {
    const keys = visiblePoints(false, zakopaneUnpublished).map((p) => p.key);
    expect(keys).toEqual(["rabka"]);
    expect(publishedPoints(zakopaneUnpublished).map((p) => p.key)).toEqual(["rabka"]);
  });
  it("staging draft: all points, unpublished flagged", () => {
    const pts = visiblePoints(true, zakopaneUnpublished);
    expect(pts.map((p) => p.key)).toEqual(["rabka", "zakopane"]);
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

describe("point contact (runda 18.11 §1.2)", () => {
  const rabka = servicePoints.find((p) => p.key === "rabka")!;
  const zakopane = servicePoints.find((p) => p.key === "zakopane")!;
  it("every point has its own phone, different from the general number and from each other", () => {
    expect(pointPhone(rabka)).toBe("+48 18 541 20 55");
    expect(pointPhone(zakopane)).toBe("+48 18 541 20 15");
    for (const p of servicePoints) expect(pointPhone(p)).not.toBe(line.phone);
  });
  it("no fallback to the general number", () => {
    expect(pointPhone({ phone: "+48 12 345 67 89" })).toBe("+48 12 345 67 89");
  });
  it("a point without its own e-mail falls back to line.email marked general", () => {
    expect(pointEmail({ email: null })).toEqual({ email: line.email, general: true });
    expect(pointEmail({ email: "rabka@prokomserwis.pl" })).toEqual({ email: "rabka@prokomserwis.pl", general: false });
    // until the mailboxes exist (DirectAdmin SH 1), no point shows an own address
    expect(servicePoints.every((p) => p.email === null)).toBe(true);
  });
  it("one label for the general number and the general e-mail", () => {
    expect(GENERAL_PHONE_LABEL).toBe("Infolinia");
    expect(GENERAL_EMAIL_LABEL).toBe("E-mail ogólny");
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
