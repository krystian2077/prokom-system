"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { DUR, onVisible, prefersReducedMotion, reveal } from "@/lib/tech/motion";

/** Public routes only — never animate into the panels or the client account (SPEC §2). */
/** Rebuilt-page blocks that rise in on scroll (tagged here, so pages need no changes). */
const AUTO_REVEAL = ".t-ui .t-hd, .t-ui .t-grid > *, .t-ui .t-faq__item, .t-ui .t-card, .t-ui .t-podhale, .t-ui .t-wiz";
/** Groups whose children get a staggered delay. */
const AUTO_STAGGER = ".t-ui .t-grid, .t-ui .t-faq";

/** Tags below-the-fold blocks only: what is already on screen never blinks. */
function autoTag(root: HTMLElement) {
  const fold = window.innerHeight;
  // read every position first, then write (one layout, no read/write thrashing)
  const candidates = Array.from(root.querySelectorAll<HTMLElement>(AUTO_REVEAL)).filter(
    (el) => !el.hasAttribute("data-t-reveal") && !el.closest(".t-header, .t-sheet, .t-wizflow"),
  );
  const below = candidates.filter((el) => el.getBoundingClientRect().top >= fold);
  const set = new Set(below);
  // never nest reveals: skip elements inside another tagged block
  for (const el of below) {
    let p = el.parentElement;
    while (p && p !== root && !set.has(p) && !p.hasAttribute("data-t-reveal")) p = p.parentElement;
    if (!p || p === root) el.setAttribute("data-t-reveal", "");
  }
  root.querySelectorAll<HTMLElement>(AUTO_STAGGER).forEach((g) => g.setAttribute("data-t-stagger", ""));
}

const NO_TRANSITION = /^\/(panel|admin-panel|client|api)(\/|$)/;
const PAGE_VT_ID = "t-vt-page";
// Page-to-page View Transition (progressive): short fade + rise, only while html has .t-vt-page.
const PAGE_VT_CSS = `html.t-vt-page::view-transition-old(root){animation:160ms cubic-bezier(.2,.7,.2,1) both t-vt-out}
html.t-vt-page::view-transition-new(root){animation:260ms cubic-bezier(.16,1,.3,1) both t-vt-in}
@keyframes t-vt-out{0%{opacity:1}100%{opacity:0}}
@keyframes t-vt-in{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:none}}`;

type DocWithVT = Document & { startViewTransition?: (cb: () => Promise<void>) => { finished: Promise<void> } };

/**
 * Motion glue for the whole public site (PREMIUM §1, §4): marks the .tech root with
 * `.t-motion` (reveal styles apply only then — no-JS sees everything), reveals
 * `[data-t-reveal]` on scroll, animates native <details> FAQ rows, pauses marquees and
 * map dashes off screen, and wraps internal navigations in a View Transition where
 * the browser supports it.
 */
export function MotionRoot() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const pendingNav = useRef<(() => void) | null>(null);

  // reveal + pausing loops, re-run for every page
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".tech");
    if (!root) return;
    if (!prefersReducedMotion()) autoTag(root);
    root.classList.add("t-motion");
    const stops: (() => void)[] = [reveal(root)];
    root.querySelectorAll<HTMLElement>(".t-brands, .t-podhale").forEach((el) => {
      stops.push(onVisible(el, (v) => el.classList.toggle("is-paused", !v), { rootMargin: "120px" }));
    });
    return () => stops.forEach((s) => s());
  }, [pathname]);

  // finish a pending page transition once the new route rendered
  useEffect(() => {
    pendingNav.current?.();
    pendingNav.current = null;
  }, [pathname]);

  // FAQ rows (native <details>): animate height with grid-template-rows
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const summary = (e.target as Element | null)?.closest?.(".tech .t-faq__item > summary");
      if (!summary || prefersReducedMotion()) return;
      const item = summary.parentElement as HTMLDetailsElement;
      if (!item.querySelector(".t-faq__body")) return;
      e.preventDefault();
      if (item.open) {
        item.classList.remove("is-opening");
        item.classList.add("is-closing");
        window.setTimeout(() => {
          item.open = false;
          item.classList.remove("is-closing");
        }, DUR.panel);
      } else {
        item.classList.remove("is-closing");
        item.open = true;
        item.classList.add("is-opening");
        window.setTimeout(() => item.classList.remove("is-opening"), DUR.panel);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // page transitions (capture phase: runs before next/link, which then sees defaultPrevented)
  useEffect(() => {
    const doc = document as DocWithVT;
    if (typeof doc.startViewTransition !== "function") return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || !a.closest(".tech") || a.target === "_blank" || a.hasAttribute("download") || a.hasAttribute("data-no-vt")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || NO_TRANSITION.test(url.pathname) || /\.[a-z0-9]+$/i.test(url.pathname)) return;
      if (url.pathname === window.location.pathname) return; // same page / hash: native behaviour
      if (prefersReducedMotion()) return;
      e.preventDefault();
      if (!document.getElementById(PAGE_VT_ID)) {
        const s = document.createElement("style");
        s.id = PAGE_VT_ID;
        s.textContent = PAGE_VT_CSS;
        document.head.appendChild(s);
      }
      const html = document.documentElement;
      html.classList.add("t-vt-page");
      const end = () => html.classList.remove("t-vt-page");
      try {
        doc
          .startViewTransition(
            () =>
              new Promise<void>((resolve) => {
                pendingNav.current = resolve;
                router.push(url.pathname + url.search + url.hash);
                window.setTimeout(resolve, 1500); // never hold the page frozen
              }),
          )
          .finished.then(end, end);
      } catch {
        end();
        router.push(url.pathname + url.search + url.hash);
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
