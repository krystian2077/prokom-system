import { afterEach, describe, expect, it, vi } from "vitest";
import { onVisible, play, prefersReducedMotion, reveal, staggerDelay } from "./motion";

type Cb = (entries: { target: Element; isIntersecting: boolean }[]) => void;

/** Minimal DOM stand-ins: the test environment is node (vitest.config.mts). */
function fakeEl() {
  const classes = new Set<string>();
  const style: Record<string, string> = {};
  return {
    classList: { add: (c: string) => classes.add(c), has: (c: string) => classes.has(c) },
    style: { setProperty: (k: string, v: string) => (style[k] = v) },
    children: [] as unknown[],
    _classes: classes,
    _style: style,
  };
}

function setup({ reduced = false, io = true }: { reduced?: boolean; io?: boolean } = {}) {
  const observers: { cb: Cb; els: Element[]; opts: unknown }[] = [];
  const listeners: Record<string, () => void> = {};
  class IO {
    cb: Cb;
    els: Element[] = [];
    constructor(cb: Cb, opts: unknown) {
      this.cb = cb;
      observers.push({ cb, els: this.els, opts });
    }
    observe(el: Element) {
      this.els.push(el);
    }
    unobserve(el: Element) {
      this.els.splice(this.els.indexOf(el), 1);
    }
    disconnect() {
      this.els.length = 0;
    }
  }
  vi.stubGlobal("window", {
    matchMedia: (q: string) => ({ matches: reduced && q.includes("reduce") }),
    ...(io ? { IntersectionObserver: IO } : {}),
  });
  vi.stubGlobal("document", {
    documentElement: { hasAttribute: () => false },
    visibilityState: "visible",
    addEventListener: (t: string, f: () => void) => (listeners[t] = f),
    removeEventListener: (t: string) => delete listeners[t],
  });
  return { observers, listeners };
}

afterEach(() => vi.unstubAllGlobals());

describe("prefersReducedMotion", () => {
  it("is false on the server", () => {
    expect(prefersReducedMotion()).toBe(false);
  });
  it("follows the media query", () => {
    setup({ reduced: true });
    expect(prefersReducedMotion()).toBe(true);
    setup({ reduced: false });
    expect(prefersReducedMotion()).toBe(false);
  });
  it("honours the forced flag used by /lab", () => {
    setup();
    vi.stubGlobal("document", { documentElement: { hasAttribute: (a: string) => a === "data-tech-reduced" } });
    expect(prefersReducedMotion()).toBe(true);
  });
});

describe("staggerDelay", () => {
  it("steps by 40 ms and caps at 8 items", () => {
    expect(staggerDelay(0)).toBe(0);
    expect(staggerDelay(2)).toBe(80);
    expect(staggerDelay(50)).toBe(320);
    expect(staggerDelay(-3)).toBe(0);
  });
});

describe("reveal", () => {
  const root = (items: ReturnType<typeof fakeEl>[], groups: ReturnType<typeof fakeEl>[] = []) => ({
    querySelectorAll: (sel: string) => (sel.includes("stagger") ? groups : items),
  });

  it("adds .is-in when an item intersects, once", () => {
    const { observers } = setup();
    const a = fakeEl();
    const b = fakeEl();
    reveal(root([a, b]) as never);
    expect(observers).toHaveLength(1);
    observers[0].cb([{ target: a as never, isIntersecting: true }, { target: b as never, isIntersecting: false }]);
    expect(a._classes.has("is-in")).toBe(true);
    expect(b._classes.has("is-in")).toBe(false);
    expect(observers[0].els).toEqual([b]);
  });

  it("shows everything at once with reduced motion or without IntersectionObserver", () => {
    setup({ reduced: true });
    const a = fakeEl();
    reveal(root([a]) as never);
    expect(a._classes.has("is-in")).toBe(true);
    setup({ io: false });
    const b = fakeEl();
    reveal(root([b]) as never);
    expect(b._classes.has("is-in")).toBe(true);
  });

  it("sets staggered delays on the children of [data-t-stagger]", () => {
    setup();
    const g = fakeEl();
    const kids = [fakeEl(), fakeEl(), fakeEl()];
    g.children = kids;
    reveal(root([fakeEl()], [g]) as never);
    expect(kids.map((k) => k._style["--t-delay"])).toEqual(["0ms", "40ms", "80ms"]);
  });

  it("disconnects on cleanup", () => {
    const { observers } = setup();
    const a = fakeEl();
    const stop = reveal(root([a]) as never);
    stop();
    expect(observers[0].els).toEqual([]);
  });
});

describe("onVisible", () => {
  it("reports visibility from the observer and the tab state", () => {
    const { observers, listeners } = setup();
    const seen: boolean[] = [];
    const stop = onVisible({} as Element, (v) => seen.push(v));
    observers[0].cb([{ target: {} as Element, isIntersecting: true }]);
    observers[0].cb([{ target: {} as Element, isIntersecting: false }]);
    observers[0].cb([{ target: {} as Element, isIntersecting: true }]);
    (document as unknown as { visibilityState: string }).visibilityState = "hidden";
    listeners.visibilitychange();
    expect(seen).toEqual([true, false, true, false]);
    stop();
    expect(listeners.visibilitychange).toBeUndefined();
  });

  it("is a no-op for a missing element", () => {
    setup();
    const cb = vi.fn();
    onVisible(null, cb)();
    expect(cb).not.toHaveBeenCalled();
  });
});

describe("play", () => {
  it("skips the animation with reduced motion", async () => {
    setup({ reduced: true });
    const animate = vi.fn();
    await play({ animate } as never, [{ opacity: 0 }, { opacity: 1 }]);
    expect(animate).not.toHaveBeenCalled();
  });
  it("runs keyframes with the default token otherwise", async () => {
    setup();
    const animate = vi.fn(() => ({ finished: Promise.resolve() }));
    await play({ animate } as never, [{ opacity: 0 }, { opacity: 1 }]);
    expect(animate).toHaveBeenCalledWith([{ opacity: 0 }, { opacity: 1 }], expect.objectContaining({ duration: 200 }));
  });
});
