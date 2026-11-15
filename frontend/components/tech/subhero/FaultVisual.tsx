"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { onVisible, prefersReducedMotion } from "@/lib/tech/motion";
import { deviceById, sceneOf } from "@/lib/tech/wizard-data";
import { DataArt, OtherArt, WatchArt } from "../wizard/art/SceneArt";
import { EFFECTS } from "../wizard/effects";

/** One fault on screen: entrance + one effect cycle, then the next fault. */
const STEP_MS = 3400;

type Props = {
  /** Wizard device id (wizard-data `wizardDevices`). */
  device: string;
  /** 1 fault = repair page (effect loops up to 3×); 2–3 = device page (one pass, back to the first). */
  faults: string[];
  /** "live" (hero, default): entrance + cycles; "poster": still frame of the effect; "fixed": the device without the fault (repaired). */
  mode?: "live" | "poster" | "fixed";
  /** Fault name chips under the frame (hero). */
  tags?: boolean;
  /** Below the fold (before/after, related cards): lazy photo, no high priority. */
  lazy?: boolean;
};

/**
 * Hero visual of sub-pages: the wizard photo / illustration in its crop frame with the
 * effect of a fault (E1–E17, components/tech/wizard/effects — reused, not changed)
 * masked to the fault region, like the wizard scene.
 *
 * LCP (PREMIUM §0): the photo is in the server HTML, eager, high priority, never starts
 * at opacity 0; effects are client-only lazy chunks drawn over it after hydration.
 * Reduced motion → poster frame of the first fault, no cycling. Off screen → paused.
 * Decorative: the fault names are in the page text.
 */
export function FaultVisual({ device: deviceId, faults, mode = "live", tags = true, lazy = false }: Props) {
  const device = deviceById(deviceId);
  const photo = device.photo!;
  const [index, setIndex] = useState(0);
  const [poster, setPoster] = useState(false);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cycle = faults.length > 1 && mode === "live";
  const fixed = mode === "fixed";

  useEffect(() => {
    setPoster(mode === "poster" || prefersReducedMotion() || document.documentElement.hasAttribute("data-tech-reduced"));
    setReady(true);
  }, [mode]);

  useEffect(() => onVisible(ref.current, (v) => setPaused(!v)), []);

  // one pass through the faults, then back to the first one and stop (max 3 cycles rule)
  useEffect(() => {
    if (!cycle || poster || paused || index >= faults.length) return;
    const t = window.setTimeout(() => setIndex((i) => i + 1), STEP_MS);
    return () => window.clearTimeout(t);
  }, [cycle, poster, paused, index, faults.length]);

  const shown = faults[index % faults.length] ?? faults[0];
  const scene = sceneOf(device, shown);
  const [cx, cy, cw, ch] = photo.crop;
  const frameAspect = cw / ch;
  const [rx0, ry0, rw, rh] = scene.region;
  const ra = (rw / rh) * frameAspect;
  const radius = ra > 1 ? { rx: scene.radius / ra, ry: scene.radius } : { rx: scene.radius, ry: scene.radius * ra };
  const at: [number, number] | null = scene.spot ? [((scene.spot[0] - rx0) / rw) * 100, ((scene.spot[1] - ry0) / rh) * 100] : null;
  // badge offset from the hotspot towards the device's centre (same rule as the wizard scene)
  let nudge: [number, number] | undefined;
  if (scene.spot) {
    const dx = (50 - scene.spot[0]) * frameAspect;
    const dy = 50 - scene.spot[1];
    const len = Math.hypot(dx, dy);
    nudge = len < 6 ? [-0.7, -0.7] : [dx / len, dy / len];
  }
  const Effect = EFFECTS[scene.effect];
  const vars = { "--ar": `${cw} / ${ch}`, "--arn": frameAspect, "--fx-n": cycle ? 1 : 3 } as CSSProperties;

  return (
    <div
      ref={ref}
      className={`t-fault${poster ? " is-poster" : ""}${fixed ? " is-fixed" : ""}${paused ? " is-paused" : ""}${cycle ? " is-cycle" : ""}`}
      data-device={device.id}
      data-fault={shown}
      style={vars}
      aria-hidden="true"
    >
      <div className="t-fault__frame">
        {photo.src ? (
          // eslint-disable-next-line @next/next/no-img-element -- pre-sized WebP positioned by % of the crop (like the wizard scene)
          <img
            className="t-fault__img"
            src={photo.src}
            alt=""
            width={photo.width}
            height={photo.height}
            fetchPriority={lazy ? "auto" : "high"}
            loading={lazy ? "lazy" : "eager"}
            decoding="async"
            style={{ left: `${(-cx / cw) * 100}%`, top: `${(-cy / ch) * 100}%`, width: `${(photo.width / cw) * 100}%` }}
          />
        ) : (
          <div className="t-fault__art">{photo.art === "watch" ? <WatchArt /> : photo.art === "data" ? <DataArt /> : <OtherArt />}</div>
        )}
        {ready && !fixed ? (
          <div
            key={shown}
            className="t-fault__fx"
            data-testid="hero-effect"
            style={
              {
                left: `${rx0}%`,
                top: `${ry0}%`,
                width: `${rw}%`,
                height: `${rh}%`,
                borderRadius: scene.clip ? undefined : `${radius.rx}% / ${radius.ry}%`,
                ...(scene.clip ? { "--fx-clip": scene.clip } : {}),
              } as CSSProperties
            }
          >
            <Effect variant={scene.variant} at={at} aspect={ra} nudge={nudge} uid={`hero-${device.id}-${index}`} />
          </div>
        ) : null}
        {scene.spot && !fixed ? <span key={`p:${shown}`} className="t-fault__ping" style={{ left: `${scene.spot[0]}%`, top: `${scene.spot[1]}%` }} /> : null}
      </div>
      {tags ? (
        <div className="t-fault__tags">
          {faults.map((f, i) => (
            <span key={f} className={`t-fault__tag${f === shown ? " is-on" : ""}`} style={{ "--i": i } as CSSProperties}>
              <i />
              {f}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
