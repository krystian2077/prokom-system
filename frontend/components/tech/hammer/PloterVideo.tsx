"use client";

import Image from "next/image";
import { useState } from "react";
import { PLOTER_VIDEO } from "@/lib/tech/hammer";

/**
 * Poster with a play button; the mp4 is requested only after the click (SPEC §9:
 * public/ is heavy, the film must not load with the page).
 */
export function PloterVideo() {
  const [play, setPlay] = useState(false);
  return (
    <div className="t-hg-video">
      {play ? (
        <video className="t-hg-video__media" src={PLOTER_VIDEO.src} poster={PLOTER_VIDEO.poster} controls autoPlay playsInline preload="none">
          Twoja przeglądarka nie odtwarza filmów.
        </video>
      ) : (
        <>
          <Image
            src={PLOTER_VIDEO.poster}
            width={PLOTER_VIDEO.width}
            height={PLOTER_VIDEO.height}
            alt="Ploter Hammer Glass VersaBlade X Pro i laminator UV"
            priority
            sizes="(min-width: 1180px) 540px, 100vw"
            className="t-hg-video__media"
          />
          <button type="button" className="t-hg-video__play" onClick={() => setPlay(true)} aria-label="Odtwórz film: prezentacja plotera">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          <span className="t-hg-video__cap">Film: jak pracuje ploter</span>
        </>
      )}
    </div>
  );
}
