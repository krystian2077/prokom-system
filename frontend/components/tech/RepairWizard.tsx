"use client";

import Link from "next/link";
import { repairForFault, repairPath } from "@/lib/tech/naprawy";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { PointKey } from "@/config/prokom";
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

export type WizardPoint = { key: PointKey; name: string; draft: boolean };
export type WizardCourier = {
  /** Subtitle under "Kurier" (claim) — null = neutral text. */
  sub: { text: string; draft: boolean } | null;
  /** Short "kto płaci" sentence from courierService (SPEC §12.10). */
  pays: string | null;
  /** "/naprawa-kurierem" once published, else null (no "Jak to działa?" link). */
  href: string | null;
};

const PHONE_MQ = "(max-width: 767.98px)";
const STEPS = ["Urządzenie", "Usterka", "Dostarczenie", "Podsumowanie"] as const;

function Glyph({ icon, size = 22 }: { icon: WizardIcon; size?: number }) {
  if (icon === "other") return <IconPath icon="dots" size={size} />;
  return <DeviceGlyph icon={icon} size={size} />;
}

function deliveryLabel(d: Delivery, points: WizardPoint[]): string {
  if (d.kind === "courier") return "Kurier";
  return points.find((p) => p.key === d.point)?.name ?? "";
}

/** Device photo with clickable fault hotspots (positions in % of the crop box). */
function PhotoStage({ device, fault, onPick }: { device: WizardDevice; fault: string; onPick: (f: string) => void }) {
  const photo = device.photo;
  return (
    <div className="t-wiz__stage">
      {photo ? (
        <div
          className="t-wiz__frame"
          style={{ "--ar": `${photo.crop[2]} / ${photo.crop[3]}`, "--arn": photo.crop[2] / photo.crop[3] } as CSSProperties}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized WebP, positioned by %, no optimizer needed */}
          <img
            className="t-wiz__img"
            src={photo.src}
            alt={`${device.label} — wybierz usterkę na zdjęciu`}
            width={photo.width}
            height={photo.height}
            loading="lazy"
            decoding="async"
            style={{
              left: `${(-photo.crop[0] / photo.crop[2]) * 100}%`,
              top: `${(-photo.crop[1] / photo.crop[3]) * 100}%`,
              width: `${(photo.width / photo.crop[2]) * 100}%`,
            }}
          />
          {photo.spots.map(([t, x, y]) => {
            const on = t === fault;
            return (
              <span key={t} className="t-wiz__spotwrap" style={{ left: `${x}%`, top: `${y}%` }}>
                <button
                  type="button"
                  className={`t-wiz__spot${on ? " is-on" : ""}`}
                  aria-label={t}
                  aria-pressed={on}
                  onClick={() => onPick(t)}
                >
                  {on ? "✓" : "+"}
                </button>
                {on ? <span className={`t-wiz__hsl${x > 50 ? " is-left" : ""}`}>{t}</span> : null}
              </span>
            );
          })}
        </div>
      ) : (
        <div className="t-wiz__nophoto">
          <span className="t-wiz__bigico">
            <Glyph icon={device.icon} size={78} />
          </span>
          <span>Wybierz obok, co się dzieje. Resztę opiszesz w zgłoszeniu.</span>
        </div>
      )}
      <div className="t-wiz__stagefoot">
        <span className="t-wiz__hint">
          <i aria-hidden="true" />
          {fault}
        </span>
        {photo ? <span className="t-wiz__cap">Zdjęcie poglądowe</span> : null}
      </div>
    </div>
  );
}

/**
 * "Co się zepsuło?" (design T.Main `#kreator`, SPEC §7, RESPONSYWNOSC §2–§3).
 * ≥ 768: all three groups at once (photo beside the choices ≥ 820, above them at 768).
 * < 768: the device grid stays on the page; picking a device opens a full-screen,
 * step-by-step flow (fault → delivery → summary) with a sticky "Dalej".
 * Result: a link to /zgloszenie built by buildWizardHref (KONTRAKT §1.4).
 */
export function RepairWizard({ points, courier }: { points: WizardPoint[]; courier: WizardCourier }) {
  const [deviceId, setDeviceId] = useState(wizardDevices[0].id);
  const device = deviceById(deviceId);
  const [faultRaw, setFault] = useState(device.faults[0]);
  const fault = device.faults.includes(faultRaw) ? faultRaw : device.faults[0];
  const [delivery, setDelivery] = useState<Delivery>(points[0] ? { kind: "point", point: points[0].key } : { kind: "courier" });
  const [step, setStep] = useState<number | null>(null); // phone flow: 1..3 (index in STEPS), null = closed

  const href = useMemo(() => buildWizardHref({ device: deviceId, fault, delivery }), [deviceId, fault, delivery]);
  const summary = `${device.label} · ${lowerFirst(fault)} · ${deliveryLabel(delivery, points)}`;

  const pickDevice = (id: string) => {
    setDeviceId(id);
    setFault(deviceById(id).faults[0]);
    if (window.matchMedia(PHONE_MQ).matches) setStep(1);
  };
  const pickFault = (f: string) => {
    setFault(f);
    trackEvent("kreator_usterka", { urzadzenie: device.label, usterka: f });
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
      {delivery.kind === "courier" && (courier.pays || courier.href) ? (
        <p className="t-wiz__courier" aria-live="polite">
          {courier.pays}
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

  // "Dowiedz się więcej" — only when a published, verified repair page exists (SPEC §12.4).
  const learnMore = repairForFault(device.category, fault);
  const faultChips = (
    <div className="t-wiz__faults">
      {device.faults.map((f) => (
        <button key={f} type="button" className={`t-chp t-chp--fault${f === fault ? " is-on" : ""}`} aria-pressed={f === fault} onClick={() => pickFault(f)}>
          {f}
        </button>
      ))}
      {learnMore ? (
        <Link href={repairPath(learnMore.slug)} className="t-lnk t-lnk--sm t-wiz__more">
          Dowiedz się więcej: {learnMore.h1} →
        </Link>
      ) : null}
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
            <PhotoStage device={device} fault={fault} onPick={pickFault} />
            <div className="t-wiz__side">
              <div className="t-wiz__groups">
                <div className="t-wiz__group t-wiz__group--dev" role="group" aria-labelledby="t-wiz-g1">
                  <span id="t-wiz-g1" className="t-eyb t-eyb--muted">
                    1 · Urządzenie
                  </span>
                  <div className="t-wiz__devices">
                    {wizardDevices.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        className={`t-chp t-chp--dev${d.id === deviceId ? " is-on" : ""}`}
                        aria-pressed={d.id === deviceId}
                        onClick={() => pickDevice(d.id)}
                      >
                        <Glyph icon={d.icon} />
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="t-wiz__group t-wiz__group--fault" role="group" aria-labelledby="t-wiz-g2">
                  <span id="t-wiz-g2" className="t-eyb t-eyb--muted">
                    2 · Co się dzieje
                  </span>
                  {faultChips}
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
                  <b data-testid="wizard-summary">{summary}</b>
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
          fault={fault}
          onPickFault={pickFault}
          faultChips={faultChips}
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
  fault: string;
  onPickFault: (f: string) => void;
  faultChips: React.ReactNode;
  deliveryOptions: React.ReactNode;
  summary: [string, string][];
  href: string;
  onSubmit: () => void;
};

/** Phone: full-screen, one step per screen, progress on top, sticky "Dalej" (RESPONSYWNOSC §2). */
function PhoneFlow({ step, setStep, device, fault, onPickFault, faultChips, deliveryOptions, summary, href, onSubmit }: FlowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setStep(null), [setStep]);

  // Focus trap, Esc, background scroll lock; focus returns to the device grid on close.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const panel = ref.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])") ?? []);
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
            <p className="t-wizflow__lead">
              {device.label}: {device.photo ? "dotknij punktu na zdjęciu albo wybierz z listy." : "wybierz z listy. Resztę opiszesz w zgłoszeniu."}
            </p>
            {device.photo ? <PhotoStage device={device} fault={fault} onPick={onPickFault} /> : null}
            {faultChips}
          </>
        ) : null}
        {step === 2 ? deliveryOptions : null}
        {step === 3 ? (
          <dl className="t-wizflow__sum">
            {summary.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
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
