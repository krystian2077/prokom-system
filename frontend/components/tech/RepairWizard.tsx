"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import type { PointKey } from "@/config/prokom";
import { repairForFault, repairPath } from "@/lib/tech/naprawy";
import { trackEvent } from "@/lib/tech/track-event";
import {
  buildWizardHref,
  deviceById,
  lowerFirst,
  wizardDevices,
  type Delivery,
  type WizardDevice,
  type WizardIcon,
} from "@/lib/tech/wizard-data";
import { DeviceGlyph, IconArrow, IconClose, IconPath } from "./icons";
import { usePill } from "./usePill";
import { preloadArt } from "./wizard/art";
import { Scene } from "./wizard/Scene";

export type WizardPoint = { key: PointKey; name: string; draft: boolean };
export type WizardCourier = {
  /** Subtitle under "Kurier" (claim) — null = neutral text. */
  sub: { text: string; draft: boolean } | null;
  /** Short "kto płaci" sentence from courierService (SPEC §12.10). */
  pays: string | null;
  /** "/naprawa-kurierem" once published, else null (no "Jak to działa?" link). */
  href: string | null;
  /** "Wyślij sprzęt na adres salonu w Rabce-Zdroju." (lib/tech/courier.ts), null = hidden. */
  where?: string | null;
};

const PHONE_MQ = "(max-width: 767.98px)";
const STEPS = ["Urządzenie", "Usterka", "Dostarczenie", "Podsumowanie"] as const;
const SWIPE_PX = 60;

function Glyph({ icon, size = 22 }: { icon: WizardIcon; size?: number }) {
  if (icon === "other") return <IconPath icon="dots" size={size} />;
  return <DeviceGlyph icon={icon} size={size} />;
}

function deliveryLabel(d: Delivery, points: WizardPoint[]): string {
  if (d.kind === "courier") return "Kurier";
  return points.find((p) => p.key === d.point)?.name ?? "";
}

/** Warm the photo cache when a device chip is hovered or focused (PREMIUM §4). */
const preloaded = new Set<string>();
function preload(d: WizardDevice) {
  preloadArt(d.photo?.art);
  const src = d.photo?.src;
  if (!src || preloaded.has(src) || typeof window === "undefined") return;
  preloaded.add(src);
  const img = new Image();
  img.decoding = "async";
  img.src = src;
}

/** Roving focus for a radiogroup: ←/→/↑/↓ move and select, Home/End jump. */
function radioKeys(e: ReactKeyboardEvent<HTMLElement>, values: string[], current: string, select: (v: string) => void) {
  const i = values.indexOf(current);
  let n = -1;
  if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % values.length;
  else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i - 1 + values.length) % values.length;
  else if (e.key === "Home") n = 0;
  else if (e.key === "End") n = values.length - 1;
  if (n < 0) return;
  e.preventDefault();
  select(values[n]);
  const group = e.currentTarget;
  window.requestAnimationFrame(() => group.querySelector<HTMLElement>(`[data-value="${CSS.escape(values[n])}"]`)?.focus());
}

/**
 * The page scene mounts only when it can be seen (≥ 768 px) and is near the viewport, or
 * once the browser is idle — keeps the photo, effects and observers out of the first
 * load (PREMIUM §4 performance). Phones use the scene inside the full-screen flow.
 */
function useLazyStage(ref: React.RefObject<HTMLElement>): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (on) return;
    const mq = window.matchMedia(PHONE_MQ);
    let io: IntersectionObserver | null = null;
    let idle: number | undefined;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const arm = () => {
      if (mq.matches || io) return;
      if (typeof IntersectionObserver === "function" && ref.current) {
        io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && setOn(true), { rootMargin: "300px 0px" });
        io.observe(ref.current);
      }
      idle = w.requestIdleCallback ? w.requestIdleCallback(() => setOn(true), { timeout: 3000 }) : window.setTimeout(() => setOn(true), 1500);
    };
    arm();
    mq.addEventListener("change", arm);
    return () => {
      io?.disconnect();
      if (idle !== undefined) (w.cancelIdleCallback ?? window.clearTimeout)(idle);
      mq.removeEventListener("change", arm);
    };
  }, [on, ref]);
  return on;
}

/** Values that "jump in" when they change (summary). */
function Pop({ children, k }: { children: ReactNode; k: string }) {
  return (
    <span key={k} className="t-pop-in t-wiz__val">
      {children}
    </span>
  );
}

/**
 * "Co się zepsuło?" (design T.Main `#kreator`, SPEC §7, RESPONSYWNOSC §2–§3, PREMIUM §4).
 * ≥ 768: scene beside the choices (≥ 960) or above them (768–959); the scene shows the
 * chosen fault's effect, hovering a fault previews its effect, picking moves the camera.
 * < 768: the device grid stays on the page; picking a device opens a full-screen,
 * step-by-step flow (fault → delivery → summary) with a sticky "Dalej"; swiping the
 * scene changes the device. Result: a link to /zgloszenie built by buildWizardHref
 * (KONTRAKT §1.4).
 */
export function RepairWizard({ points, courier }: { points: WizardPoint[]; courier: WizardCourier }) {
  const [deviceId, setDeviceId] = useState(wizardDevices[0].id);
  const device = deviceById(deviceId);
  const [faultRaw, setFault] = useState(device.faults[0]);
  const fault = device.faults.includes(faultRaw) ? faultRaw : device.faults[0];
  const [preview, setPreview] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [delivery, setDelivery] = useState<Delivery>(points[0] ? { kind: "point", point: points[0].key } : { kind: "courier" });
  const [step, setStep] = useState<number | null>(null); // phone flow: 1..3 (index in STEPS), null = closed
  const devRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stageOn = useLazyStage(stageRef);
  usePill(devRef, `[data-value="${deviceId}"]`, [deviceId]);

  const href = useMemo(() => buildWizardHref({ device: deviceId, fault, delivery }), [deviceId, fault, delivery]);
  // "Dowiedz się więcej" — only when a published, verified repair page exists (SPEC §12.4, TD5b).
  const learnMore = repairForFault(device.category, fault);
  const more = learnMore ? { href: repairPath(learnMore.slug), label: `Dowiedz się więcej: ${learnMore.h1}` } : null;

  const selectDevice = useCallback((id: string) => {
    setDeviceId(id);
    setFault(deviceById(id).faults[0]);
    setPreview(null);
    setNonce(0);
  }, []);
  const pickDevice = (id: string) => {
    selectDevice(id);
    if (window.matchMedia(PHONE_MQ).matches) setStep(1);
  };
  const pickFault = (f: string) => {
    setFault(f);
    setPreview(null);
    setNonce((n) => n + 1);
    trackEvent("kreator_usterka", { urzadzenie: device.label, usterka: f });
  };
  const swipeDevice = (dir: 1 | -1) => {
    const i = wizardDevices.findIndex((d) => d.id === deviceId);
    const next = wizardDevices[(i + dir + wizardDevices.length) % wizardDevices.length];
    preload(next);
    selectDevice(next.id);
  };
  const onSubmit = () => trackEvent("zgloszenie_start", { zrodlo: "kreator" });

  const deliveryOptions = (
    <>
      <div className="t-wiz__delivery">
        {points.map((p) => {
          const on = delivery.kind === "point" && delivery.point === p.key;
          return (
            <button
              key={p.key}
              type="button"
              className={`t-chp t-chp--opt${on ? " is-on" : ""}${p.draft ? " t-draft" : ""}`}
              aria-pressed={on}
              onClick={() => setDelivery({ kind: "point", point: p.key })}
            >
              <span className="t-chp__t">{p.name}</span>
              <span className="t-chp__s">{p.draft ? "do uzupełnienia" : "osobiście w punkcie"}</span>
            </button>
          );
        })}
        <button
          type="button"
          className={`t-chp t-chp--opt${delivery.kind === "courier" ? " is-on" : ""}`}
          aria-pressed={delivery.kind === "courier"}
          onClick={() => setDelivery({ kind: "courier" })}
        >
          <span className="t-chp__t">Kurier</span>
          <span className={`t-chp__s${courier.sub?.draft ? " t-draft" : ""}`}>{courier.sub ? courier.sub.text : "wysyłka do serwisu"}</span>
        </button>
      </div>
      {delivery.kind === "courier" && (courier.pays || courier.href || courier.where) ? (
        <p className="t-wiz__courier" aria-live="polite">
          {[courier.where, courier.pays].filter(Boolean).join(" ")}
          {courier.href ? (
            <>
              {" "}
              <Link href={courier.href} className="t-lnk t-lnk--sm">
                Jak to działa?
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
    </>
  );

  const faultChips = (labelId: string) => (
    <div key={device.id} className="t-wiz__faults" role="radiogroup" aria-labelledby={labelId} onKeyDown={(e) => radioKeys(e, device.faults, fault, pickFault)}>
      {device.faults.map((f, i) => {
        const on = f === fault;
        return (
          <button
            key={f}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            data-value={f}
            className={`t-chp t-chp--fault${on ? " is-on" : ""}${f === preview ? " is-hot" : ""}${device.scenes[f]?.spot ? " has-spot" : ""}`}
            style={{ "--i": i } as React.CSSProperties}
            onClick={() => pickFault(f)}
            onMouseEnter={() => setPreview(f)}
            onMouseLeave={() => setPreview(null)}
          >
            {f}
          </button>
        );
      })}
    </div>
  );

  return (
    <section id="kreator" className="t-wizsec t-ui" aria-labelledby="t-wiz-h">
      <div className="t-container">
        <div className="t-wiz">
          <div className="t-wiz__head">
            <div className="t-wiz__titles">
              <span className="t-eyb">Szybkie zgłoszenie</span>
              <h2 id="t-wiz-h" className="t-h2 t-wiz__h">
                Co się zepsuło?
              </h2>
            </div>
            <span className="t-wiz__tip">
              <span className="t-wiz__tip--wide">Kliknij punkt na zdjęciu albo wybierz z listy · bez logowania</span>
              <span className="t-wiz__tip--phone">Wybierz urządzenie · bez logowania</span>
            </span>
          </div>

          <div className="t-wiz__body">
            <div ref={stageRef} className="t-wiz__stagewrap">
              {stageOn ? <Scene device={device} fault={fault} preview={preview} onPick={pickFault} onPreview={setPreview} pickNonce={nonce} more={more} /> : null}
            </div>
            <div className="t-wiz__side">
              <div className="t-wiz__groups">
                <div className="t-wiz__group t-wiz__group--dev">
                  <span id="t-wiz-g1" className="t-eyb t-eyb--muted">
                    1 · Urządzenie
                  </span>
                  <div
                    ref={devRef}
                    className="t-wiz__devices"
                    role="radiogroup"
                    aria-labelledby="t-wiz-g1"
                    onKeyDown={(e) =>
                      radioKeys(
                        e,
                        wizardDevices.map((d) => d.id),
                        deviceId,
                        (id) => selectDevice(id),
                      )
                    }
                  >
                    <span className="t-wiz__devpill" aria-hidden="true" />
                    {wizardDevices.map((d) => {
                      const on = d.id === deviceId;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          tabIndex={on ? 0 : -1}
                          data-value={d.id}
                          className={`t-chp t-chp--dev${on ? " is-on" : ""}`}
                          onClick={() => pickDevice(d.id)}
                          onMouseEnter={() => preload(d)}
                          onFocus={() => preload(d)}
                        >
                          <Glyph icon={d.icon} />
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="t-wiz__group t-wiz__group--fault">
                  <span id="t-wiz-g2" className="t-eyb t-eyb--muted t-wiz__glabel">
                    2 · Co się dzieje
                    <span key={device.id} className="t-wiz__count t-pop-in" aria-hidden="true">
                      {device.faults.length}
                    </span>
                  </span>
                  {faultChips("t-wiz-g2")}
                </div>
              </div>
              <div className="t-wiz__group t-wiz__group--del" role="group" aria-labelledby="t-wiz-g3">
                <span id="t-wiz-g3" className="t-eyb t-eyb--muted">
                  3 · Jak oddasz sprzęt
                </span>
                {deliveryOptions}
              </div>
              <div className="t-wiz__bar">
                <span className="t-wiz__sum">
                  <span>Twoje zgłoszenie</span>
                  <b data-testid="wizard-summary">
                    <Pop k={device.label}>{device.label}</Pop>
                    {" · "}
                    <Pop k={fault}>{lowerFirst(fault)}</Pop>
                    {" · "}
                    <Pop k={deliveryLabel(delivery, points)}>{deliveryLabel(delivery, points)}</Pop>
                  </b>
                </span>
                <Link href={href} className="t-hbtn t-hbtn--acc t-hbtn--wiz t-shine" onClick={onSubmit} data-testid="wizard-next">
                  Dalej — zgłoś naprawę
                  <IconArrow size={17} strokeWidth={2.6} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {step !== null ? (
        <PhoneFlow
          step={step}
          setStep={setStep}
          device={device}
          scene={
            <Scene
              device={device}
              fault={fault}
              onPick={pickFault}
              pickNonce={nonce}
              layout="phone"
              more={more}
            />
          }
          onSwipe={swipeDevice}
          faultChips={faultChips("t-wizflow-h")}
          deliveryOptions={deliveryOptions}
          summary={[
            ["Urządzenie", device.label],
            ["Usterka", fault],
            ["Jak oddasz sprzęt", deliveryLabel(delivery, points)],
          ]}
          href={href}
          onSubmit={onSubmit}
        />
      ) : null}
    </section>
  );
}

type FlowProps = {
  step: number;
  setStep: (s: number | null) => void;
  device: WizardDevice;
  scene: ReactNode;
  onSwipe: (dir: 1 | -1) => void;
  faultChips: ReactNode;
  deliveryOptions: ReactNode;
  summary: [string, string][];
  href: string;
  onSubmit: () => void;
};

/** Phone: full-screen, one step per screen, progress on top, sticky "Dalej" (RESPONSYWNOSC §2). */
function PhoneFlow({ step, setStep, device, scene, onSwipe, faultChips, deliveryOptions, summary, href, onSubmit }: FlowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setStep(null), [setStep]);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  // Focus trap, Esc, background scroll lock; focus returns to the device grid on close.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const panel = ref.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>("a[href], button:not([disabled]):not([tabindex='-1']), [tabindex]:not([tabindex='-1'])") ?? []);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const f = focusables();
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const mq = window.matchMedia(PHONE_MQ);
    const onMq = () => {
      if (!mq.matches) close();
    };
    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
      opener?.focus?.();
    };
  }, [close]);

  // Move focus to the step heading on every step change.
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("[data-step-title]")?.focus();
  }, [step]);

  const titles: Record<number, string> = { 1: "Co się dzieje?", 2: "Jak oddasz sprzęt?", 3: "Sprawdź i przejdź dalej" };

  return (
    <div className="t-wizflow t-ui" role="dialog" aria-modal="true" aria-labelledby="t-wizflow-h" ref={ref} data-testid="wizard-flow">
      <div className="t-wizflow__top">
        <button type="button" className="t-iconbtn" aria-label="Wstecz" onClick={() => setStep(step > 1 ? step - 1 : null)}>
          <IconPath icon="back2" size={20} strokeWidth={2.4} />
        </button>
        <span className="t-wizflow__count">
          Zgłoś naprawę · {step + 1} z {STEPS.length}
        </span>
        <button type="button" className="t-iconbtn" aria-label="Zamknij" onClick={close}>
          <IconClose />
        </button>
      </div>
      <ol className="t-wizflow__progress" aria-label="Postęp">
        {STEPS.map((s, i) => (
          <li key={s} className={i <= step ? "is-done" : undefined} aria-current={i === step ? "step" : undefined}>
            <span className="t-visually-hidden">{s}</span>
          </li>
        ))}
      </ol>

      <div className="t-wizflow__body">
        <h2 id="t-wizflow-h" className="t-h2 t-wizflow__h" tabIndex={-1} data-step-title="">
          {titles[step]}
        </h2>
        {step === 1 ? (
          <>
            <p className="t-wizflow__lead">{device.label}: dotknij punktu na zdjęciu albo wybierz z listy. Przesuń zdjęcie w bok, żeby zmienić urządzenie.</p>
            <div
              className="t-wizflow__scene"
              onPointerDown={(e) => (swipe.current = { x: e.clientX, y: e.clientY })}
              onPointerUp={(e) => {
                const s = swipe.current;
                swipe.current = null;
                if (!s) return;
                const dx = e.clientX - s.x;
                if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.5) onSwipe(dx < 0 ? 1 : -1);
              }}
              onPointerCancel={() => (swipe.current = null)}
            >
              {scene}
            </div>
            {faultChips}
          </>
        ) : null}
        {step === 2 ? deliveryOptions : null}
        {step === 3 ? (
          <dl className="t-wizflow__sum">
            {summary.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>
                  <Pop k={v}>{v}</Pop>
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      <div className="t-wizflow__foot">
        {step < 3 ? (
          <>
            <span className="t-wizflow__next">{step === 1 ? "Dalej: jak oddasz sprzęt" : "Dalej: podsumowanie"}</span>
            <button type="button" className="t-hbtn t-hbtn--acc" onClick={() => setStep(step + 1)}>
              Dalej
              <IconArrow size={17} strokeWidth={2.6} />
            </button>
          </>
        ) : (
          <Link href={href} className="t-hbtn t-hbtn--acc t-hbtn--block" onClick={onSubmit} data-testid="wizard-flow-next">
            Dalej — zgłoś naprawę
            <IconArrow size={17} strokeWidth={2.6} />
          </Link>
        )}
      </div>
    </div>
  );
}
