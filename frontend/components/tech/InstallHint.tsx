"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/**
 * "Dodaj do ekranu głównego" in the Menu sheet (SPEC §12.2): Android → button via
 * beforeinstallprompt, iOS → short instruction, hidden when already installed. No pop-ups.
 */
export function InstallHint() {
  const [mode, setMode] = useState<"none" | "android" | "ios">("none");
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
    if (ios) setMode("ios");
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setMode("android");
    };
    const onInstalled = () => setMode("none");
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (mode === "none") return null;
  return (
    <div className="t-install" data-t-install={mode}>
      <b>Dodaj PRO-KOM Tech do ekranu głównego</b>
      {mode === "android" && prompt ? (
        <button
          type="button"
          className="t-btn t-btn--sm t-btn--ghost"
          onClick={async () => {
            await prompt.prompt();
            await prompt.userChoice.catch(() => undefined);
            setPrompt(null);
            setMode("none");
          }}
        >
          Dodaj
        </button>
      ) : (
        <span>
          Stuknij <em>Udostępnij</em>, a potem <em>Do ekranu początkowego</em>.
        </span>
      )}
    </div>
  );
}
