"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { onVisible, prefersReducedMotion } from "@/lib/tech/motion";
import { FRAME_BOX, faultMeaning, sceneOf, type Box, type WizardDevice } from "@/lib/tech/wizard-data";
import { DataArt, OtherArt, WatchArt } from "./art/SceneArt";
import { EFFECTS } from "./effects";

type Side = "left" | "right" | "top" | "bottom";

/**
 * Where the label goes: next to the side of the region with the most free room in the
 * frame (horizontal room weighted by the frame aspect), so it never covers the region.
 * Exported for tests. All values in % of the frame.
 */
export function labelPlacement(region: Box, spot: [number, number], frameAspect: number): { side: Side; x: number; y: number } {
  const [x, y, w, h] = region;
  const room: Record<Side, number> = {
    left: x * frameAspect,
    right: (100 - x - w) * frameAspect,
    top: y,
    bottom: 100 - y - h,
  };
  const side = (Object.keys(room) as Side[]).reduce((a, b) => (room[b] > room[a] ? b : a));
  const gap = 3;
  const clamp = (v: number) => Math.max(8, Math.min(92, v));
  switch (side) {
    case "left":
      return { side, x: x - gap, y: clamp(spot[1]) };
    case "right":
      return { side, x: x + w + gap, y: clamp(spot[1]) };
    case "top":
      return { side, x: clamp(spot[0]), y: y - gap };
    default:
      return { side, x: clamp(spot[0]), y: y + h + gap };
  }
}

/** Region corner radius → % per axis (radius is % of the shorter side). */
function radii(region: Box, frameAspect: number, radius: number) {
  const ra = (region[2] / region[3]) * frameAspect;
  return ra > 1 ? { rx: radius / ra, ry: radius, ra } : { rx: radius, ry: radius * ra, ra };
}

type Props = {
  device: WizardDevice;
  fault: string;
  /** Fault under the pointer in the list (preview of its effect, no camera move). */
  preview?: string | null;
  onPick?: (fault: string) => void;
  onPreview?: (fault: string | null) => void;
  /** Static poster frame (reduced motion, /lab grid). */
  poster?: boolean;
  /** "phone": the label becomes a card under the photo. */
  layout?: "full" | "phone";
  /** Lab grid: no buttons, no camera. */
  interactive?: boolean;
  /** Changes on every pick → camera moves again even for the same fault. */
  pickNonce?: number;
  /** Link to a published repair page for the chosen fault (TD5b), shown in the card. */
  more?: { href: string; label: string } | null;
};

/**
 * Wizard scene (PREMIUM §4): photo/illustration in its crop frame, hotspots (44 px
 * targets), effect of the chosen fault masked to its region, label outside the region
 * with a leader line, camera move to the focus point, "Pokaż całe urządzenie" / Esc.
 */
export function Scene({ device, fault, preview = null, onPick, onPreview, poster = false, layout = "full", interactive = true, pickNonce = 0, more = null }: Props) {
  const photo = device.photo!;
  const shown = preview && device.scenes[preview] ? preview : fault;
  const scene = sceneOf(device, shown);
  const chosen = sceneOf(device, fault);
  const [cx, cy, cw, ch] = photo.crop;
  const frameAspect = cw / ch;
  const [zoom, setZoom] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [intro, setIntro] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const introDone = useRef(false);

  useEffect(() => setReduced(prefersReducedMotion()), []);

  // camera: zoom to a local fault when it is picked; never for whole-device faults
  useEffect(() => {
    setZoom(interactive && !!chosen.focus && pickNonce > 0);
  }, [fault, device.id, pickNonce, interactive, chosen.focus]);

  // Esc / "Pokaż całe urządzenie" — capture phase, so it runs before the phone flow's Esc
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      // only the scene the user can see (the page scene is hidden under the phone flow)
      if (e.key !== "Escape" || !stageRef.current?.offsetParent) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      setZoom(false);
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [zoom]);

  // pause loops off screen; one pulse per spot on the first time the scene is seen
  useEffect(() => {
    const el = stageRef.current;
    return onVisible(el, (v) => {
      el?.classList.toggle("is-paused", !v);
      if (v && !introDone.current && interactive) {
        introDone.current = true;
        setIntro(true);
        window.setTimeout(() => setIntro(false), 260 * photo.spots.length + 900);
      }
    });
  }, [interactive, photo.spots.length]);

  const Effect = EFFECTS[scene.effect];
  const [rx0, ry0, rw, rh] = scene.region;
  const r = radii(scene.region, frameAspect, scene.radius);
  const at: [number, number] | null = scene.spot ? [((scene.spot[0] - rx0) / rw) * 100, ((scene.spot[1] - ry0) / rh) * 100] : null;
  const label = scene.spot ? labelPlacement(scene.region, scene.spot, frameAspect) : null;
  const isPoster = poster || reduced;
  const meaning = faultMeaning(device.id, shown);
  const focus = chosen.focus ?? [50, 50];

  const vars = {
    "--ar": `${cw} / ${ch}`,
    "--arn": frameAspect,
    "--fw-d": `${FRAME_BOX.desktop[0]}px`,
    "--fh-d": `${FRAME_BOX.desktop[1]}px`,
    "--fw-t": `${FRAME_BOX.tablet[0]}px`,
    "--fh-t": `${FRAME_BOX.tablet[1]}px`,
    "--fw-p": `${FRAME_BOX.phone[0]}px`,
    "--fh-p": `${FRAME_BOX.phone[1]}px`,
  } as CSSProperties;

  return (
    <div
      ref={stageRef}
      className={`t-scene t-scene--${layout}${zoom ? " is-zoom" : ""}${isPoster ? " is-poster" : ""}${intro ? " is-intro" : ""}`}
      data-device={device.id}
      data-effect={scene.effect}
      style={vars}
    >
      <div className="t-scene__frame" key={device.id} role="img" aria-label={`${device.label} — ${photo.art ? "ilustracja" : "zdjęcie"}`}>
        <div className="t-scene__cam" style={{ transformOrigin: `${focus[0]}% ${focus[1]}%` }}>
          {photo.src ? (
            // eslint-disable-next-line @next/next/no-img-element -- pre-sized WebP, positioned by %, no optimizer needed
            <img
              className="t-scene__img"
              src={photo.src}
              alt=""
              width={photo.width}
              height={photo.height}
              loading="lazy"
              decoding="async"
              style={{ left: `${(-cx / cw) * 100}%`, top: `${(-cy / ch) * 100}%`, width: `${(photo.width / cw) * 100}%` }}
            />
          ) : (
            <div className="t-scene__art">{photo.art === "watch" ? <WatchArt /> : photo.art === "data" ? <DataArt /> : <OtherArt />}</div>
          )}

          <div
            key={`${device.id}:${shown}`}
            className={`t-scene__fx${preview && preview !== fault ? " is-preview" : ""}`}
            data-testid="scene-effect"
            style={{ left: `${rx0}%`, top: `${ry0}%`, width: `${rw}%`, height: `${rh}%`, borderRadius: `${r.rx}% / ${r.ry}%` }}
          >
            <Effect variant={scene.variant} at={at} aspect={r.ra} />
          </div>

          {label && scene.spot && layout === "full" ? (
            <>
              <svg className="t-scene__leader" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <line x1={scene.spot[0]} y1={scene.spot[1]} x2={label.x} y2={label.y} pathLength={1} />
              </svg>
              <span key={shown} className={`t-scene__label is-${label.side}`} style={{ left: `${label.x}%`, top: `${label.y}%` }} aria-hidden="true">
                {shown}
              </span>
            </>
          ) : null}

          {photo.spots.map(([t, x, y], i) => {
            const on = t === fault;
            if (!interactive) return <span key={t} className={`t-scene__dot${on ? " is-on" : ""}`} style={{ left: `${x}%`, top: `${y}%` }} />;
            return (
              <button
                key={t}
                type="button"
                className={`t-scene__spot${on ? " is-on" : ""}${t === preview ? " is-hot" : ""}`}
                style={{ left: `${x}%`, top: `${y}%`, "--i": i } as CSSProperties}
                aria-label={t}
                aria-pressed={on}
                data-spot={t}
                onClick={() => onPick?.(t)}
                onMouseEnter={() => onPreview?.(t)}
                onMouseLeave={() => onPreview?.(null)}
                onFocus={() => onPreview?.(t)}
                onBlur={() => onPreview?.(null)}
              >
                <span className="t-scene__spotdot" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path className="t-scene__plus" d="M12 7 L12 17 M7 12 L17 12" />
                    <path className="t-scene__check" d="M6.5 12.5 L10.5 16.5 L17.5 8.5" pathLength={1} />
                  </svg>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {interactive && zoom ? (
        <button type="button" className="t-scene__whole" onClick={() => setZoom(false)} data-testid="scene-whole">
          Pokaż całe urządzenie
          <kbd aria-hidden="true">Esc</kbd>
        </button>
      ) : null}

      {interactive ? (
        <div className="t-scene__card" data-testid="scene-card">
          <b>
            <i aria-hidden="true" />
            {shown}
          </b>
          <span>{meaning}</span>
          {more && !(preview && preview !== fault) ? (
            <Link href={more.href} className="t-lnk t-lnk--sm t-wiz__more">
              {more.label} →
            </Link>
          ) : null}
        </div>
      ) : null}
      {interactive ? (
        <p className="t-visually-hidden" aria-live="polite">
          {`${fault}. ${faultMeaning(device.id, fault)}`}
        </p>
      ) : null}
    </div>
  );
}
