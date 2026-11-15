import { describe, expect, it } from "vitest";
import { HOME_SECTIONS, activeSection, easeInOutCubic, railIcon, railLineEnd, railProgress, scrollDuration, sectionOffset, sectionsCount } from "./rail";

const tops = (...t: number[]) => t.map((top, i) => ({ id: `s${i}`, top }));

describe("aktywna sekcja", () => {
  it("is the last one past 40% of the screen, the first before any", () => {
    expect(activeSection(tops(100, 900, 1800), 1000, false)).toBe("s0");
    expect(activeSection(tops(-600, 300, 1200), 1000, false)).toBe("s1");
    expect(activeSection(tops(200, 900), 1000, false)).toBe("s0");
  });
  it("is the last one at the bottom of the page", () => {
    expect(activeSection(tops(-2000, -900, 800), 1000, true)).toBe("s2");
  });
  it("none without sections", () => {
    expect(activeSection([], 1000, false)).toBeNull();
  });
});

describe("linia postępu", () => {
  it("runs from 0 to the last index", () => {
    expect(railProgress([500, 1500], 1000, false)).toBe(0);
    expect(railProgress([0, 800], 1000, false)).toBeCloseTo(0.5);
    expect(railProgress([-100, 300, 900], 1000, false)).toBeCloseTo(1 + 100 / 600);
    expect(railProgress([-100, 300], 1000, true)).toBe(1);
  });
  it("maps a position to the filled share between entry centres", () => {
    expect(railLineEnd(0, [22, 68, 114])).toBe(0);
    expect(railLineEnd(1, [22, 68, 114])).toBeCloseTo(0.5);
    expect(railLineEnd(1.5, [22, 68, 114])).toBeCloseTo(0.75);
    expect(railLineEnd(2, [22, 68, 114])).toBe(1);
    expect(railLineEnd(1, [22])).toBe(0);
  });
});

describe("ikony sekcji", () => {
  it("known ids get their icon, new ones a telling part, the rest a document", () => {
    expect(railIcon("start")).toBe("start");
    expect(railIcon("faq")).toBe("help");
    expect(railIcon("pytania-o-baterie")).toBe("help");
    expect(railIcon("blizej-rabka")).toBe("pin");
    expect(railIcon("objawy")).toBe("symptom");
    expect(railIcon("cos-zupelnie-nowego")).toBe("doc");
  });
  it("every home section has its own icon", () => {
    for (const s of HOME_SECTIONS) expect(railIcon(s.id), s.id).not.toBe("doc");
  });
});

describe("płynne przewijanie", () => {
  it("longer way, longer glide, within 520–1100 ms", () => {
    expect(scrollDuration(100)).toBe(520);
    expect(scrollDuration(2000)).toBe(700);
    expect(scrollDuration(-9000)).toBe(1100);
  });
  it("eases in and out", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBe(0.5);
    expect(easeInOutCubic(1)).toBe(1);
  });
  it("uses the section's scroll-margin-top, else the header offset", () => {
    expect(sectionOffset("110px")).toBe(110);
    expect(sectionOffset("0px")).toBe(104);
  });
  it("counts sections in Polish", () => {
    expect([1, 3, 5, 9, 12, 22].map(sectionsCount)).toEqual(["1 sekcja", "3 sekcje", "5 sekcji", "9 sekcji", "12 sekcji", "22 sekcje"]);
  });
});
