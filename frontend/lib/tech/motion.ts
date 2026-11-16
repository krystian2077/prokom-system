/**
 * PRO-KOM Tech motion helper (docs/tech/PREMIUM.md §1). No animation library:
 * CSS (app/(public)/tech-motion.css) does the motion, this file only decides
 * *when* — reveal on scroll, pause loops off screen, respect reduced motion.
 * Every function is safe on the server and in browsers without the APIs (no-op).
 */

export const REDUCED_MQ = "(prefers-reduced-motion: reduce)";

/** Motion tokens mirrored from tech-motion.css (ms) — for the Web Animations API. */
export const DUR = { micro: 120, small: 200, panel: 320, scene: 520, reveal: 700 } as const;
export const EASE = {
  out: "cubic-bezier(0.2, 0.7, 0.2, 1)",
  inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  emph: "cubic-bezier(0.16, 1, 0.3, 1)",
} as const;
export const STAGGER_MS = 40;
export const STAGGER_MAX = 8;

/** True when the user asked for less motion (or the forced-reduced flag is on, see /lab). */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof document !== "undefined" && document.documentElement?.hasAttribute("data-tech-reduced")) return true;
  return typeof window.matchMedia === "function" && window.matchMedia(REDUCED_MQ).matches;
}

/** Delay for the n-th item of a staggered group (capped, so long lists do not crawl). */
export function staggerDelay(index: number, step: number = STAGGER_MS, max: number = STAGGER_MAX): number {
  return Math.max(0, Math.min(index, max)) * step;
}

type IOLike = { observe: (el: Element) => void; unobserve: (el: Element) => void; disconnect: () => void };

/**
 * Reveal on scroll: every `[data-t-reveal]` under `root` gets `.is-in` once it enters the
 * viewport (once only). Items of a `[data-t-stagger]` parent get a `--t-delay`.
 * Without IntersectionObserver or with reduced motion everything is shown at once.
 * Content is never hidden without JS: tech-motion.css hides only under `.t-motion`.
 */
export function reveal(root: ParentNode, opts: { rootMargin?: string; threshold?: number } = {}): () => void {
  const items = Array.from(root.querySelectorAll<HTMLElement>("[data-t-reveal]:not(.is-in)"));
  root.querySelectorAll<HTMLElement>("[data-t-stagger]").forEach((group) => {
    Array.from(group.children).forEach((child, i) => (child as HTMLElement).style.setProperty("--t-delay", `${staggerDelay(i)}ms`));
  });
  const show = (el: Element) => el.classList.add("is-in");
  if (!items.length) return () => {};
  if (prefersReducedMotion() || typeof window === "undefined" || typeof window.IntersectionObserver !== "function") {
    items.forEach(show);
    return () => {};
  }
  const io: IOLike = new window.IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          show(e.target);
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: opts.rootMargin ?? "0px 0px -8% 0px", threshold: opts.threshold ?? 0.12 },
  );
  items.forEach((el) => io.observe(el));
  return () => io.disconnect();
}

/**
 * Calls `cb(true)` when `el` becomes visible and `cb(false)` when it leaves the viewport
 * or the tab is hidden — used to pause marquees, scene loops and pulses off screen.
 */
export function onVisible(el: Element | null, cb: (visible: boolean) => void, opts: { rootMargin?: string } = {}): () => void {
  if (!el || typeof window === "undefined") return () => {};
  let inView = true;
  const emit = () => cb(inView && (typeof document === "undefined" || document.visibilityState !== "hidden"));
  const onVis = () => emit();
  let io: IOLike | null = null;
  if (typeof window.IntersectionObserver === "function") {
    inView = false;
    io = new window.IntersectionObserver(
      (entries) => {
        inView = entries.some((e) => e.isIntersecting);
        emit();
      },
      { rootMargin: opts.rootMargin ?? "0px" },
    );
    io.observe(el);
  } else {
    emit();
  }
  document.addEventListener?.("visibilitychange", onVis);
  return () => {
    io?.disconnect();
    document.removeEventListener?.("visibilitychange", onVis);
  };
}

/**
 * Web Animations API wrapper: runs keyframes unless motion is reduced; then it jumps to
 * the final frame. Resolves when done (or at once). Never throws.
 */
export function play(el: Element | null, keyframes: Keyframe[], options: KeyframeAnimationOptions = {}): Promise<void> {
  if (!el || typeof (el as HTMLElement).animate !== "function" || prefersReducedMotion()) return Promise.resolve();
  try {
    const a = (el as HTMLElement).animate(keyframes, { duration: DUR.small, easing: EASE.out, fill: "none", ...options });
    return a.finished.then(
      () => undefined,
      () => undefined,
    );
  } catch {
    return Promise.resolve();
  }
}
