"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { loadIndex } from "@/lib/tech/search/load-index";
import { onSearchRequest } from "@/lib/tech/search/open";
import { isSearchShortcut, isTypingTarget } from "@/lib/tech/search/shortcut";

const SearchDialog = dynamic(() => import("./SearchDialog").then((m) => m.SearchDialog), { ssr: false });

type IdleWindow = Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };

/**
 * The search window as its own chunk (perf: it is not part of the first load of every page).
 * Mounted when the browser is idle after `load`, so the first opening stays instant; until the
 * window is ready this loader catches Ctrl/⌘ K, „/” and requestSearch() and hands the request on.
 */
export function LazySearchDialog() {
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [request, setRequest] = useState<{ phrase?: string } | null>(null);
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    if (ready) return;
    const ask = (phrase?: string) => {
      // The index downloads in parallel with the window's chunk.
      loadIndex().catch(() => undefined);
      setRequest({ phrase });
      setMounted(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if (!isSearchShortcut({ key: e.key, ctrlKey: e.ctrlKey, metaKey: e.metaKey, altKey: e.altKey, typing: isTypingTarget(e.target) })) return;
      // Same rules as the window: another modal or an open sheet owns the screen.
      if (document.querySelector("dialog[open]") || document.querySelector(".t-sheet.is-open")) return;
      e.preventDefault();
      ask();
    };
    document.addEventListener("keydown", onKey);
    const off = onSearchRequest(ask);
    return () => {
      document.removeEventListener("keydown", onKey);
      off();
    };
  }, [ready]);

  // The index (JSON) comes when the browser is idle, as before the window had its own chunk:
  // an early opening already has the categories with their counts.
  useEffect(() => {
    const w = window as IdleWindow;
    const fetchIndex = () => void loadIndex().catch(() => undefined);
    const idle = w.requestIdleCallback?.(fetchIndex, { timeout: 4000 });
    const timer = idle === undefined ? window.setTimeout(fetchIndex, 1500) : undefined;
    return () => {
      if (idle !== undefined) w.cancelIdleCallback?.(idle);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (mounted) return;
    const w = window as IdleWindow;
    let idle: number | undefined;
    let timer: number | undefined;
    const warm = () => {
      idle = w.requestIdleCallback?.(() => setMounted(true), { timeout: 5000 });
      if (idle === undefined) timer = window.setTimeout(() => setMounted(true), 2000);
    };
    if (document.readyState === "complete") warm();
    else window.addEventListener("load", warm, { once: true });
    return () => {
      window.removeEventListener("load", warm);
      if (idle !== undefined) w.cancelIdleCallback?.(idle);
      window.clearTimeout(timer);
    };
  }, [mounted]);

  return mounted ? <SearchDialog request={request} onReady={onReady} /> : null;
}
