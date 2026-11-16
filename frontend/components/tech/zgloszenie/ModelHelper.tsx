"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import type { DeviceCategory } from "@/lib/tech/contract";
import {
  HELPER_FALLBACK_HREF,
  HELPER_FIELD_LABEL,
  HELPER_TITLE,
  HELPER_TRIGGER,
  currentPlatform,
  guideExample,
  guideSteps,
  helperGuides,
  modelProposal,
  pickHelperTab,
  pickVariant,
  readDeviceModel,
  type HelperField,
  type Scene,
} from "@/lib/tech/model-helper";
import { prefersReducedMotion } from "@/lib/tech/motion";
import { trackEvent } from "@/lib/tech/track-event";
import { DEVICE_CATEGORIES } from "@/types/repair";
import { IconArrowUpRight, IconClose } from "../icons";
import { usePill } from "../usePill";
import { HelperScene } from "./HelperScene";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const PHONE_MQ = "(max-width: 767.98px)";
const EXIT_MS = 220;
const SCENE_MS = 420;
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const HelpIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="9.5" />
    <path d="M9.4 9.3a2.7 2.7 0 0 1 5.2 1c0 1.8-2.6 2.4-2.6 4" />
    <path d="M12 17.6h.01" />
  </svg>
);
const Arrow = ({ back = false }: { back?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {back ? <path d="M19 12H5M11 6l-6 6 6 6" /> : <path d="M5 12h14M13 6l6 6-6 6" />}
  </svg>
);
const Check = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M5 12.5l4.2 4.2L19 7" />
  </svg>
);

/** Lock background scroll without the jump of a disappearing scrollbar (same as MenuSheet). */
function lockScroll(): () => void {
  const body = document.body;
  const prev = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
  const bar = window.innerWidth - document.documentElement.clientWidth;
  body.style.overflow = "hidden";
  if (bar > 0) body.style.paddingRight = `${bar}px`;
  return () => {
    body.style.overflow = prev.overflow;
    body.style.paddingRight = prev.paddingRight;
  };
}

type Props = {
  field: HelperField;
  category: DeviceCategory | null;
  brand: string;
  model: string;
  /** Called with the model read from the browser ("Wpisz do formularza"). */
  onUseModel?: (model: string) => void;
};

/**
 * "Jak sprawdzić model" / "Gdzie znaleźć IMEI": a large modal on tablets and desktops,
 * a bottom sheet on phones. Each device kind (and brand, where the path differs) has
 * its own illustrated steps, an example of what to type and, on Chromium/Android, the
 * model read from the browser as a one-click proposal. Focus trap, Esc, focus back to
 * the trigger, scroll inside. Without JS the trigger is a plain link to the static
 * guide on /jak-przygotowac-sprzet#model.
 */
export function ModelHelper({ field, category, brand, model, onUseModel }: Props) {
  const panelId = `zgl-help-${field}`;
  const [state, setState] = useState<"closed" | "open" | "closing">("closed");
  const [sheet, setSheet] = useState(false);
  const [tab, setTab] = useState("");
  const [variant, setVariant] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"next" | "prev" | "swap">("swap");
  const [leaving, setLeaving] = useState<{ key: string; scene: Scene } | null>(null);
  const [proposal, setProposal] = useState<string | null>(null);
  const [live, setLive] = useState("");
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const meta = useRef({ used: false, proposal: null as string | null, opened: 0 });

  const guides = useMemo(() => helperGuides(field, category), [field, category]);
  const guide = guides.find((g) => g.id === tab) ?? guides[0];
  const steps = guideSteps(guide, variant);
  const example = guideExample(guide, variant);
  const at = Math.min(step, steps.length - 1);
  const current = steps[at];
  const last = at === steps.length - 1;
  const catLabel = DEVICE_CATEGORIES.find((c) => c.value === category)?.label;
  const open = state !== "closed";
  const stateRef = useRef(state);
  stateRef.current = state;

  usePill(tabsRef, '[aria-selected="true"]', [tab, open, sheet, guides.length]);

  // Cross-fade of the illustration: the previous scene stays for one transition.
  const sceneKey = `${guide.id}|${variant ?? ""}|${at}`;
  const shownRef = useRef<{ key: string; scene: Scene } | null>(null);
  useEffect(() => {
    if (!open) {
      shownRef.current = null;
      return;
    }
    const prev = shownRef.current;
    shownRef.current = { key: sceneKey, scene: current.scene };
    if (!prev || prev.key === sceneKey || prefersReducedMotion()) return;
    setLeaving(prev);
    const t = window.setTimeout(() => setLeaving(null), SCENE_MS);
    return () => window.clearTimeout(t);
  }, [sceneKey, open, current.scene]);

  const show = () => {
    const platform = currentPlatform();
    const pick = pickHelperTab({ field, category, brand, model, platform });
    setTab(pick.tab);
    setVariant(pick.variant);
    setStep(0);
    setDir("swap");
    setLeaving(null);
    setLive("");
    setSheet(typeof window.matchMedia === "function" && window.matchMedia(PHONE_MQ).matches);
    setProposal(null);
    meta.current = { used: false, proposal: null, opened: meta.current.opened + 1 };
    const opened = meta.current.opened;
    setState("open");
    if (field === "model") {
      void readDeviceModel().then((raw) => {
        if (meta.current.opened !== opened) return;
        const p = modelProposal(raw, { category, platform, current: model });
        meta.current.proposal = p;
        setProposal(p);
      });
    }
  };

  const hide = useCallback(
    (restoreFocus: boolean) => {
      if (stateRef.current !== "open") return;
      stateRef.current = "closing";
      setState("closing");
      trackEvent("pomocnik_modelu", {
        kategoria: category ?? "brak",
        pole: field,
        propozycja: meta.current.used ? "uzyta" : meta.current.proposal ? "nie" : "brak",
      });
      if (restoreFocus) triggerRef.current?.focus({ preventScroll: true });
      window.setTimeout(() => setState((s) => (s === "closing" ? "closed" : s)), prefersReducedMotion() ? 0 : EXIT_MS);
    },
    [category, field],
  );

  // Focus into the dialog, Esc, focus trap, scroll lock (a modal in both layouts).
  useIsoLayoutEffect(() => {
    if (state !== "open") return;
    const panel = panelRef.current;
    const raf = requestAnimationFrame(() => panel?.querySelector<HTMLElement>("[data-help-close]")?.focus({ preventScroll: true }));
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        hide(true);
        return;
      }
      if (e.key === "Tab" && panel) {
        const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement);
        if (!items.length) return;
        const first = items[0];
        const lastEl = items[items.length - 1];
        if (!panel.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey, true);
    const unlock = lockScroll();
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey, true);
      unlock();
    };
  }, [state, hide]);

  // A new category closes a stale helper (its tabs would no longer match).
  const lastCat = useRef(category);
  useEffect(() => {
    if (lastCat.current !== category && state === "open") hide(false);
    lastCat.current = category;
  }, [category, state, hide]);

  const announce = (i: number, total: number, title: string) => setLive(`Krok ${i + 1} z ${total}: ${title}`);

  const goStep = (i: number) => {
    if (i < 0 || i >= steps.length || i === at) return;
    setDir(i > at ? "next" : "prev");
    setStep(i);
    announce(i, steps.length, steps[i].title);
  };

  const pickTab = (id: string) => {
    const g = guides.find((x) => x.id === id);
    if (!g || g.id === guide.id) return;
    const v = pickVariant(g, brand, model);
    setTab(g.id);
    setVariant(v);
    setStep(0);
    setDir("swap");
    bodyRef.current?.scrollTo({ top: 0 });
  };

  const pickBrand = (id: string) => {
    if (id === variant) return;
    setVariant(id);
    setStep(0);
    setDir("swap");
  };

  const onTabKeys = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const i = guides.findIndex((g) => g.id === guide.id);
    const n = e.key === "Home" ? 0 : e.key === "End" ? guides.length - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + guides.length) % guides.length;
    pickTab(guides[n].id);
    tabsRef.current?.querySelectorAll<HTMLElement>("[role=tab]")[n]?.focus();
  };

  const onSwipeStart = (e: ReactPointerEvent) => {
    swipe.current = e.pointerType === "mouse" ? null : { x: e.clientX, y: e.clientY };
  };
  const onSwipeEnd = (e: ReactPointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.4) goStep(at + (dx < 0 ? 1 : -1));
  };

  const useProposal = () => {
    if (!proposal) return;
    meta.current.used = true;
    onUseModel?.(proposal);
    hide(false);
    window.setTimeout(() => document.getElementById("zgl-model")?.focus(), 0);
  };

  // Always a modal: portaled to the .tech root, above the tab bar (z-index 950) and
  // any stacking context of the form.
  const dialog = open ? (
    <>
      <div className="t-hm__scrim" data-state={state} onClick={() => hide(true)} aria-hidden="true" />
      <div className={`t-hm__wrap${sheet ? " is-sheet" : ""}`}>
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${panelId}-h`}
          aria-describedby={`${panelId}-d`}
          className={`t-hm ${sheet ? "t-hm--sheet" : "t-hm--modal"}`}
          data-state={state}
          data-help-panel={field}
        >
          {sheet ? <span className="t-hm__grab" aria-hidden="true" /> : null}
          <header className="t-hm__head">
            <span className="t-hm__icon" aria-hidden="true">
              <HelpIcon size={22} />
            </span>
            <div className="t-hm__titles">
              {catLabel ? <span className="t-hm__kicker">{catLabel}</span> : null}
              <h2 id={`${panelId}-h`}>{HELPER_TITLE[field]}</h2>
            </div>
            <button type="button" className="t-hm__close" onClick={() => hide(true)} aria-label="Zamknij pomocnika" data-help-close="">
              <IconClose size={20} />
            </button>
          </header>

          <div className="t-hm__body" ref={bodyRef}>
            {guides.length > 1 ? (
              <div className="t-hm__tabsbar">
                <div ref={tabsRef} className="t-pilltabs t-hm__tabs" role="tablist" aria-label="Rodzaj urządzenia" onKeyDown={onTabKeys}>
                  <span className="t-pilltabs__pill" aria-hidden="true" />
                  {guides.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      role="tab"
                      id={`${panelId}-tab-${g.id}`}
                      aria-selected={g.id === guide.id}
                      aria-controls={`${panelId}-panel`}
                      tabIndex={g.id === guide.id ? 0 : -1}
                      data-help-tab={g.id}
                      onClick={() => pickTab(g.id)}
                    >
                      {g.tab}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div
              className="t-hm__grid"
              id={`${panelId}-panel`}
              role={guides.length > 1 ? "tabpanel" : undefined}
              aria-labelledby={guides.length > 1 ? `${panelId}-tab-${guide.id}` : undefined}
            >
              <div className="t-hm__stage" onPointerDown={onSwipeStart} onPointerUp={onSwipeEnd} onPointerCancel={() => (swipe.current = null)}>
                <div className="t-hm__canvas" data-dir={dir}>
                  {leaving && leaving.key !== sceneKey ? (
                    <div className="t-hm__scene is-out" key={`out-${leaving.key}`}>
                      <HelperScene scene={leaving.scene} />
                    </div>
                  ) : null}
                  <div className="t-hm__scene is-in" key={sceneKey}>
                    <HelperScene scene={current.scene} />
                  </div>
                </div>
                {steps.length > 1 ? (
                  <div className="t-hm__dots" aria-hidden="true">
                    {steps.map((s, i) => (
                      <span key={s.title} className={i === at ? "is-on" : i < at ? "is-done" : ""} />
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="t-hm__side">
                <p className="t-hm__lead" id={`${panelId}-d`}>
                  {guide.lead}
                </p>

                {proposal ? (
                  <div className="t-hm__propose">
                    <span className="t-hm__proposeico" aria-hidden="true">
                      <Check />
                    </span>
                    <span className="t-hm__proposetext">
                      Ta przeglądarka podaje model tego telefonu: <b>{proposal}</b>. Zgłaszasz właśnie to urządzenie?
                    </span>
                    <button type="button" className="t-hm__use" onClick={useProposal} data-help-use="">
                      Wpisz do formularza
                    </button>
                  </div>
                ) : null}

                {guide.variants ? (
                  <div className="t-hm__brands" role="group" aria-label="Marka">
                    {guide.variants.map((v) => (
                      <button key={v.id} type="button" aria-pressed={v.id === (variant ?? guide.variants?.[0].id)} className="t-hm__brand" onClick={() => pickBrand(v.id)} data-help-variant={v.id}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                ) : null}

                <ol className="t-hm__steps" aria-label="Kroki">
                  {steps.map((s, i) => (
                    <li key={`${sceneKey}-${s.title}`} className={i === at ? "is-on" : i < at ? "is-done" : ""} style={{ ["--i" as string]: i }}>
                      <button type="button" className="t-hm__step" aria-current={i === at ? "step" : undefined} onClick={() => goStep(i)} data-help-step={i}>
                        <span className="t-hm__num" aria-hidden="true">
                          {i < at ? <Check /> : i + 1}
                        </span>
                        <span className="t-hm__steptext">
                          <b>{s.title}</b>
                          {s.text ? <span className="t-hm__stepmore">{s.text}</span> : null}
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>

                {example.value ? (
                  <div className="t-hm__example">
                    <span className="t-hm__exlabel">Co wpisać w polu „{HELPER_FIELD_LABEL[field]}”</span>
                    <span className="t-hm__exvalue">
                      <code>{example.value}</code>
                      <span className="t-hm__exhint">przykład</span>
                    </span>
                    {example.note ? <span className="t-hm__exnote">{example.note}</span> : null}
                  </div>
                ) : null}

                {guide.tips?.length ? (
                  <ul className="t-hm__tips">
                    {guide.tips.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>

          <footer className="t-hm__foot">
            <a className="t-hm__more" href={HELPER_FALLBACK_HREF} target="_blank" rel="noopener">
              Wszystkie urządzenia w poradniku <IconArrowUpRight />
              <span className="t-visually-hidden">(otwiera się w nowej karcie)</span>
            </a>
            <div className="t-hm__nav">
              {steps.length > 1 ? (
                <span className="t-hm__count" aria-hidden="true">
                  {`${at + 1} z ${steps.length}`}
                </span>
              ) : null}
              {at > 0 ? (
                <button type="button" className="t-hm__btn t-hm__btn--ghost" onClick={() => goStep(at - 1)} data-help-prev="">
                  <Arrow back />
                  <span>Wstecz</span>
                </button>
              ) : null}
              {last ? (
                <button type="button" className="t-hm__btn" onClick={() => hide(true)} data-help-done="">
                  Gotowe
                </button>
              ) : (
                <button type="button" className="t-hm__btn" onClick={() => goStep(at + 1)} data-help-next="">
                  <span>Dalej</span>
                  <Arrow />
                </button>
              )}
            </div>
          </footer>
          <div className="t-visually-hidden" aria-live="polite">
            {live}
          </div>
        </div>
      </div>
    </>
  ) : null;

  return (
    <>
      <a
        ref={triggerRef}
        href={HELPER_FALLBACK_HREF}
        role="button"
        className="t-help__trigger"
        aria-expanded={state === "open"}
        aria-controls={open ? panelId : undefined}
        aria-haspopup="dialog"
        data-help-trigger={field}
        data-no-vt=""
        onClick={(e) => {
          e.preventDefault();
          if (state === "open") hide(true);
          else show();
        }}
        onKeyDown={(e) => {
          if (e.key === " ") {
            e.preventDefault();
            if (state !== "open") show();
          }
        }}
      >
        <HelpIcon />
        <span>{HELPER_TRIGGER[field]}</span>
      </a>
      {dialog && typeof document !== "undefined" ? createPortal(dialog, document.querySelector(".tech") ?? document.body) : null}
    </>
  );
}
