import { describe, expect, it } from "vitest";
import { inTriangle } from "./nav";

describe("inTriangle (mega-menu safe triangle)", () => {
  const exit = { x: 300, y: 40 };
  const tl = { x: 260, y: 100 };
  const tr = { x: 1000, y: 100 };
  it("a pointer heading down towards the panel is inside", () => {
    expect(inTriangle({ x: 360, y: 52 }, exit, tl, tr)).toBe(true);
    expect(inTriangle({ x: 600, y: 90 }, exit, tl, tr)).toBe(true);
  });
  it("a sideways move along the menu row is outside (switch at once)", () => {
    expect(inTriangle({ x: 420, y: 38 }, exit, tl, tr)).toBe(false);
    expect(inTriangle({ x: 200, y: 60 }, exit, tl, tr)).toBe(false);
  });
});
