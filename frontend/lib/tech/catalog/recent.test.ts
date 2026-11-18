import { describe, expect, it } from "vitest";
import { addRecent, RECENT_MAX } from "./recent";

describe("ostatnio oglądane", () => {
  it("newest first, no duplicates, at most RECENT_MAX", () => {
    let l: string[] = [];
    for (const s of ["a", "b", "c", "a"]) l = addRecent(l, s);
    expect(l).toEqual(["a", "c", "b"]);
    for (let i = 0; i < 10; i++) l = addRecent(l, `m${i}`);
    expect(l).toHaveLength(RECENT_MAX);
    expect(l[0]).toBe("m9");
  });
});
