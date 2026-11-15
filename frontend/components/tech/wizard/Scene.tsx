"use client";

import Link from "next/link";
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { onVisible, prefersReducedMotion } from "@/lib/tech/motion";
import { FRAME_BOX, SCENE_ZOOM, faultMeaning, sceneOf, type Box, type WizardDevice, type WizardPhoto } from "@/lib/tech/wizard-data";
import { leader, placeLabel, zoomPt, zoomRect, type LabelSide, type Pt, type Rect } from "@/lib/tech/wizard-layout";
import { DataArt, OtherArt, WatchArt } from "./art/SceneArt";
import { EFFECTS } from "./effects";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Region corner radius → % per axis (radius is % of the shorter side). */
function radii(region: Box, frameAspect: number, radius: number) {
  const ra = (region[2] / region[3]) * frameAspect;
  return ra > 1 ? { rx: radius / ra, ry: radius, ra } : { rx: radius, ry: radius * ra, ra };
}

function frameVars(photo: WizardPhoto): CSSProperties {
  const [, , cw, ch] = photo.crop;
  return { "--ar": `${cw} / ${ch}`, "--arn": cw / ch } as CSSProperties;
}

/** The photo (or illustration) placed in its crop box. */
function Picture({ photo, eager }: { photo: WizardPhoto; eager?: boolean }) {
  const [cx, cy, cw, ch] = photo.crop;
  if (!photo.src) return <div className="t-scene__art">{photo.art === "watch" ? <WatchArt /> : photo.art === "data" ? <DataArt /> : <OtherArt />}</div>;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- pre-sized WebP with alpha, positioned by %, no optimizer needed
    <img
      className="t-scene__img"
      src={photo.src}
      alt=""
      width={photo.width}
      height={photo.height}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      style={{ left: `${(-cx / cw) * 100}%`, top: `${(-cy / ch) * 100}%`, width: `${(photo.width / cw) * 100}%` }}
    />
  );
}

type Geo = { x: number; y: number; side: LabelSide; a: Pt; b: Pt; w: number; h: number };

type Props = {
  device: WizardDevice;
  fault: string;
  /** Fault under the pointer in the list (preview of its effect, no camera move). */
  preview?: string | null;
  onPick?: (fault: string) => void;
  onPreview?: (fault: string | null) => void;
  /** Static poster frame (reduced motion, /lab grid). */
  poster?: boolean;
  /** "phone": no floating label — the card under the photo carries it. */
  layout?: "full" | "phone";
  /** Lab grid: no buttons, no camera. */
  interactive?: boolean;
  /** Changes on every pick → camera moves again even for the same fault. */
  pickNonce?: number;
  /** Link to a published repair page for the chosen fault (TD5b), shown in the card. */
  more?: { href: string; label: string } | null;
};

/**
 * Wizard scene (PREMIUM §4): a stage with the device photo centred with room around it,
 * hotspots (44 px targets), the chosen fault's effect masked to its region, a label
 * outside the device with a straight leader line, camera move to the focus point,
 * "Pokaż całe urządzenie" / Esc, and a card UNDER the stage (it never covers the photo).
 * Changing the device cross-fades the photos.
 */
export function Scene({ device, fault, preview = null, onPick, onPreview, poster = false, layout = "full", interactive = true, pickNonce = 0, more = null }: Props) {
  const photo = device.photo!;
  const shown = preview && device.scenes[preview] ? preview : fault;
  const scene = sceneOf(device, shown);
  const chosen = sceneOf(device, fault);
  const [, , cw, ch] = photo.crop;
  const frameAspect = cw / ch;
  const [zoom, setZoom] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [intro, setIntro] = useState(false);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [tick, setTick] = useState(0);
  const [ghost, setGhost] = useState<WizardDevice | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const wholeRef = useRef<HTMLButtonElement>(null);
  const introDone = useRef(false);
  const lastDevice = useRef(device);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  useEffect(() => setReduced(prefersReducedMotion()), []);

  // device change → the old photo fades out under the new one
  useEffect(() => {
    const prev = lastDevice.current;
    lastDevice.current = device;
    if (prev.id === device.id || poster || reduced) return;
    setGhost(prev);
    const t = window.setTimeout(() => setGhost(null), 420);
    return () => window.clearTimeout(t);
  }, [device, poster, reduced]);

  // camera: zoom to a local fault when it is picked; never for whole-device faults
  useEffect(() => {
    setZoom(interactive && !!chosen.focus && pickNonce > 0);
  }, [fault, device.id, pickNonce, interactive, chosen.focus]);

  // Esc / "Pokaż całe urządzenie" — capture phase, so it runs before the phone flow's Esc
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      // only the scene the user can see (the page scene is hidden under the phone flow)
      if (e.key !== "Escape" || !rootRef.current?.offsetParent) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      setZoom(false);
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [zoom]);

  // pause loops off screen; one pulse per spot on the first time the scene is seen
  useEffect(() => {
    const el = rootRef.current;
    return onVisible(el, (v) => {
      el?.classList.toggle("is-paused", !v);
      if (v && !introDone.current && interactive) {
        introDone.current = true;
        setIntro(true);
        window.setTimeout(() => setIntro(false), 220 * photo.spots.length + 1000);
      }
    });
  }, [interactive, photo.spots.length]);

  // stage resizes → place the label again
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver !== "function") return;
    const ro = new ResizeObserver(() => setTick((t) => t + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const showLabel = layout === "full" && !!scene.spot;

  // label placement in stage px (after the camera transform), see lib/tech/wizard-layout.ts
  useIsoLayoutEffect(() => {
    const st = stageRef.current;
    const fr = frameRef.current;
    const lb = labelRef.current;
    if (!showLabel || !st || !fr || !lb || !scene.spot) {
      setGeo(null);
      return;
    }
    const W = st.clientWidth;
    const H = st.clientHeight;
    const F: Rect = { x: fr.offsetLeft, y: fr.offsetTop, w: fr.offsetWidth, h: fr.offsetHeight };
    if (!F.w || !W) return;
    const s = zoom ? SCENE_ZOOM : 1;
    const f = chosen.focus ?? [50, 50];
    const origin = { x: F.x + (f[0] / 100) * F.w, y: F.y + (f[1] / 100) * F.h };
    const pt = (p: [number, number]) => zoomPt({ x: F.x + (p[0] / 100) * F.w, y: F.y + (p[1] / 100) * F.h }, origin, s);
    const [rx, ry, rw, rh] = scene.region;
    const region = zoomRect({ x: F.x + (rx / 100) * F.w, y: F.y + (ry / 100) * F.h, w: (rw / 100) * F.w, h: (rh / 100) * F.h }, origin, s);
    const device = zoomRect(F, origin, s);
    const spot = pt(scene.spot);
    const avoid: Rect[] = photo.spots.filter(([t]) => t !== shown).map(([, x, y]) => pt([x, y])).map((p) => ({ x: p.x - 17, y: p.y - 17, w: 34, h: 34 }));
    const wb = wholeRef.current;
    if (wb) avoid.push({ x: wb.offsetLeft, y: wb.offsetTop, w: wb.offsetWidth, h: wb.offsetHeight });
    const label = { w: lb.offsetWidth, h: lb.offsetHeight };
    const place = placeLabel({ stage: { w: W, h: H }, device, region, spot, label, avoid });
    const line = leader(spot, { x: place.x, y: place.y, w: label.w, h: label.h }, 19 * s);
    setGeo({ x: place.x, y: place.y, side: place.side, a: line.a, b: line.b, w: W, h: H });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute on what moves the label
  }, [showLabel, shown, zoom, device.id, tick, scene.region, scene.spot, chosen.focus]);

  const Effect = EFFECTS[scene.effect];
  const [rx0, ry0, rw, rh] = scene.region;
  const r = radii(scene.region, frameAspect, scene.radius);
  const at: [number, number] | null = scene.spot ? [((scene.spot[0] - rx0) / rw) * 100, ((scene.spot[1] - ry0) / rh) * 100] : null;
  // badge offset: from the hotspot towards the device's centre (px-proportional)
  let nudge: [number, number] | undefined;
  if (scene.spot) {
    const dx = (50 - scene.spot[0]) * frameAspect;
    const dy = 50 - scene.spot[1];
    const len = Math.hypot(dx, dy);
    nudge = len < 6 ? [-0.7, -0.7] : [dx / len, dy / len];
  }
  const isPoster = poster || reduced;
  const meaning = faultMeaning(device.id, shown);
  const focus = chosen.focus ?? [50, 50];
  const labelKey = `${device.id}:${shown}:${zoom ? 1 : 0}`;

  const vars = {
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
      ref={rootRef}
      className={`t-scene t-scene--${layout}${zoom ? " is-zoom" : ""}${isPoster ? " is-poster" : ""}${intro ? " is-intro" : ""}${interactive ? "" : " is-static"}`}
      data-device={device.id}
      data-effect={scene.effect}
      style={vars}
    >
      <div ref={stageRef} className="t-scene__stage">
        {ghost && ghost.photo ? (
          <div className="t-scene__frame is-ghost" style={frameVars(ghost.photo)} aria-hidden="true">
            <Picture photo={ghost.photo} eager />
          </div>
        ) : null}
        <div ref={frameRef} className="t-scene__frame" key={device.id} style={frameVars(photo)} role="img" aria-label={`${device.label} — ${photo.art ? "ilustracja" : "zdjęcie"}`}>
          <div className="t-scene__cam" style={{ transformOrigin: `${focus[0]}% ${focus[1]}%` }}>
            <Picture photo={photo} eager={interactive} />

            <div
              key={`${device.id}:${shown}`}
              className={`t-scene__fx${preview && preview !== fault ? " is-preview" : ""}`}
              data-testid="scene-effect"
              style={{
                left: `${rx0}%`,
                top: `${ry0}%`,
                width: `${rw}%`,
                height: `${rh}%`,
                borderRadius: scene.clip ? undefined : `${r.rx}% / ${r.ry}%`,
                ...(scene.clip ? { "--fx-clip": scene.clip } : {}),
              }}
            >
              <Effect variant={scene.variant} at={at} aspect={r.ra} nudge={nudge} uid={`${uid}${scene.effect}`} />
            </div>

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

        {showLabel ? (
          <>
            {geo ? (
              <svg key={`l:${labelKey}`} className="t-scene__leader" viewBox={`0 0 ${geo.w} ${geo.h}`} aria-hidden="true">
                <line x1={geo.a.x} y1={geo.a.y} x2={geo.b.x} y2={geo.b.y} pathLength={1} />
                <circle cx={geo.b.x} cy={geo.b.y} r="2.5" />
              </svg>
            ) : null}
            <span
              ref={labelRef}
              key={labelKey}
              className={`t-scene__label${geo ? ` is-${geo.side}` : " is-measuring"}`}
              style={geo ? { left: geo.x, top: geo.y } : undefined}
              aria-hidden="true"
            >
              {shown}
            </span>
          </>
        ) : null}

        {layout === "full" && interactive && zoom ? (
          <button ref={wholeRef} type="button" className="t-scene__whole" onClick={() => setZoom(false)} data-testid="scene-whole">
            Pokaż całe urządzenie
            <kbd aria-hidden="true">Esc</kbd>
          </button>
        ) : null}
      </div>

      {interactive ? (
        <div className="t-scene__card" data-testid="scene-card">
          {layout === "phone" && interactive && zoom ? (
            <button type="button" className="t-scene__whole" onClick={() => setZoom(false)} data-testid="scene-whole">
              Pokaż całe urządzenie
            </button>
          ) : null}
          <b key={shown} className="t-scene__cardtitle">
            <i aria-hidden="true" />
            {shown}
          </b>
          <span key={`m:${shown}`} className="t-scene__cardtext">
            {meaning}
          </span>
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
