"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { typesetTree } from "@/lib/tech/typo";

/**
 * Polish typesetting for the public site (lib/tech/typo.ts): runs after hydration, again on
 * every route and whenever client components render new text. Idempotent, so its own
 * writes settle after one extra pass.
 */
export function Typeset() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.querySelector(".tech");
    if (!root) return;
    let frame = 0;
    const run = () => {
      frame = 0;
      typesetTree(root);
    };
    run();
    const mo = new MutationObserver(() => {
      if (!frame) frame = requestAnimationFrame(run);
    });
    mo.observe(root, { childList: true, subtree: true, characterData: true });
    return () => {
      mo.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);
  return null;
}
