"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { DeviceCategory } from "@/lib/tech/contract";
import {
  HELPER_FALLBACK_HREF,
  HELPER_TITLE,
  HELPER_TRIGGER,
  currentPlatform,
  helperGuides,
  modelProposal,
  pickHelperTab,
  readDeviceModel,
  type HelperField,
} from "@/lib/tech/model-helper";
import { prefersReducedMotion } from "@/lib/tech/motion";
import { trackEvent } from "@/lib/tech/track-event";
import { IconArrowUpRight, IconClose } from "../icons";
import { usePill } from "../usePill";
import { HelperArt } from "./HelperArt";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const PHONE_MQ = "(max-width: 767.98px)";
const EXIT_MS = 180;
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const HelpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="9.5" />
    <path d="M9.4 9.3a2.7 2.7 0 0 1 5.2 1c0 1.8-2.6 2.4-2.6 4" />
    <path d="M12 17.6h.01" />
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
  /** Called with the proposed model ("Zgłaszasz to urządzenie? Wpisz: …"). */
  onUseModel?: (model: string) => void;
};

/**
 * "Jak sprawdzić model" / "Gdzie znaleźć IMEI": a popover on larger screens, a bottom
 * sheet on phones (focus trap, Esc, focus back to the trigger). Without JS the trigger is
 * a plain link to the static guide on /jak-przygotowac-sprzet#model.
 */
export function ModelHelper({ field, category, brand, model, onUseModel }: Props) {
  const panelId = `zgl-help-${field}`;
  const [state, setState] = useState<"closed" | "open" | "closing">("closed");
  const [sheet, setSheet] = useState(false);
  const [tab, setTab] = useState("");
  const [variant, setVariant] = useState<string | null>(null);
  const [proposal, setProposal] = useState<string | null>(null);
  const [pos, setPos] = useState<{ left: number; nub: number } | null>(null);
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const meta = useRef({ used: false, proposal: null as string | null, opened: 0 });

  const guides = useMemo(() => helperGuides(field, category), [field, category]);
  const guide = guides.find((g) => g.id === tab) ?? guides[0];
  const variantObj = guide.variants?.find((v) => v.id === variant) ?? guide.variants?.[0] ?? null;
  const path = variantObj?.path ?? guide.path ?? [];
  const open = state !== "closed";
  const stateRef = useRef(state);
  stateRef.current = state;

  usePill(tabsRef, '[aria-selected="true"]', [tab, open, guides.length]);

  const show = () => {
    const platform = currentPlatform();
    const pick = pickHelperTab({ field, category, brand, model, platform });
    setTab(pick.tab);
    setVariant(pick.variant);
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

  // Focus into the panel, Esc, click outside (popover), focus trap + scroll lock (sheet).
  useIsoLayoutEffect(() => {
    if (state !== "open") return;
    const panel = panelRef.current;
    // Popover: stays inside the viewport (16 px gutter); the nub points at the trigger.
    if (!sheet && panel && triggerRef.current) {
      const host = (panel.offsetParent as HTMLElement | null)?.getBoundingClientRect();
      const trig = triggerRef.current.getBoundingClientRect();
      if (host) {
        const width = panel.offsetWidth;
        const vw = document.documentElement.clientWidth;
        let left = 0;
        if (host.left + width > vw - 16) left = vw - 16 - width - host.left;
        if (host.left + left < 16) left = 16 - host.left;
        setPos({ left, nub: Math.max(16, Math.min(width - 30, trig.left - host.left - left + 10)) });
      }
    }
    const raf = requestAnimationFrame(() => {
      panel?.querySelector<HTMLElement>("[data-help-close]")?.focus({ preventScroll: true });
      if (!sheet) panel?.scrollIntoView({ block: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    });
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        hide(true);
        return;
      }
      if (sheet && e.key === "Tab" && panel) {
        const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panel?.contains(t) || triggerRef.current?.contains(t)) return;
      hide(false);
    };
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as Node;
      if (panel?.contains(t) || triggerRef.current?.contains(t)) return;
      hide(false);
    };
    document.addEventListener("keydown", onKey, true);
    let unlock = () => {};
    if (sheet) unlock = lockScroll();
    else {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("focusin", onFocusIn);
    }
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("focusin", onFocusIn);
      unlock();
    };
  }, [state, sheet, hide]);

  // A new category closes a stale helper (its tabs would no longer match).
  const lastCat = useRef(category);
  useEffect(() => {
    if (lastCat.current !== category && state === "open") hide(false);
    lastCat.current = category;
  }, [category, state, hide]);

  const toggle = () => (state === "open" ? hide(true) : show());

  // The phone sheet goes to the .tech root: above the tab bar (z-index 950) and any
  // stacking context of the page; the desktop popover stays in the field.
  const portal = (node: ReactNode) => (sheet && typeof document !== "undefined" ? createPortal(node, document.querySelector(".tech") ?? document.body) : node);

  const onTabKeys = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const i = guides.findIndex((g) => g.id === guide.id);
    const n = e.key === "Home" ? 0 : e.key === "End" ? guides.length - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + guides.length) % guides.length;
    setTab(guides[n].id);
    setVariant(guides[n].variants?.[0]?.id ?? null);
    tabsRef.current?.querySelectorAll<HTMLElement>("[role=tab]")[n]?.focus();
  };

  const useProposal = () => {
    if (!proposal) return;
    meta.current.used = true;
    onUseModel?.(proposal);
    hide(false);
    window.setTimeout(() => document.getElementById("zgl-model")?.focus(), 0);
  };

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
          toggle();
        }}
        onKeyDown={(e) => {
          if (e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <HelpIcon />
        <span>{HELPER_TRIGGER[field]}</span>
      </a>
      {open ? portal(
        <>
          {sheet ? <div className="t-help__scrim" data-state={state} onClick={() => hide(true)} aria-hidden="true" /> : null}
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal={sheet ? true : undefined}
            aria-labelledby={`${panelId}-h`}
            className={`t-help ${sheet ? "t-help--sheet" : "t-help--pop"}`}
            data-state={state}
            style={!sheet && pos ? { left: pos.left, ["--nub-x" as string]: `${pos.nub}px` } : undefined}
            data-help-panel={field}
          >
            {sheet ? <span className="t-help__grab" aria-hidden="true" /> : null}
            <div className="t-help__head">
              <h3 id={`${panelId}-h`}>{HELPER_TITLE[field]}</h3>
              <button type="button" className="t-help__close" onClick={() => hide(true)} aria-label="Zamknij pomocnika" data-help-close="">
                <IconClose size={18} />
              </button>
            </div>

            {proposal ? (
              <div className="t-help__propose">
                <span>Zgłaszasz to urządzenie?</span>
                <button type="button" className="t-help__use" onClick={useProposal} data-help-use="">
                  Wpisz: <b>{proposal}</b>
                </button>
              </div>
            ) : null}

            {guides.length > 1 ? (
              <div ref={tabsRef} className="t-pilltabs t-help__tabs" role="tablist" aria-label="Rodzaj urządzenia" onKeyDown={onTabKeys}>
                <span className="t-pilltabs__pill" aria-hidden="true" />
                {guides.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    role="tab"
                    id={`${panelId}-tab-${g.id}`}
                    aria-selected={g.id === guide.id}
                    aria-controls={`${panelId}-body`}
                    tabIndex={g.id === guide.id ? 0 : -1}
                    data-help-tab={g.id}
                    onClick={() => {
                      setTab(g.id);
                      setVariant(g.variants?.[0]?.id ?? null);
                    }}
                  >
                    {g.tab}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="t-help__body" id={`${panelId}-body`} role={guides.length > 1 ? "tabpanel" : undefined} aria-labelledby={guides.length > 1 ? `${panelId}-tab-${guide.id}` : undefined} key={`${guide.id}-${variantObj?.id ?? ""}`}>
              <HelperArt art={guide.art} steps={path.length} />
              {guide.variants ? (
                <div className="t-help__variants" role="radiogroup" aria-label="Marka">
                  {guide.variants.map((v) => (
                    <button key={v.id} type="button" role="radio" aria-checked={v.id === variantObj?.id} className="t-help__variant" onClick={() => setVariant(v.id)} data-help-variant={v.id}>
                      {v.label}
                    </button>
                  ))}
                </div>
              ) : null}
              {path.length ? (
                <ol className="t-help__path" aria-label="Ścieżka">
                  {path.map((p, i) => (
                    <li key={p}>
                      <span aria-hidden="true">{i + 1}</span>
                      {p}
                    </li>
                  ))}
                </ol>
              ) : null}
              <div className="t-help__lines">
                {guide.lines.map((l) => (
                  <p key={l}>{l}</p>
                ))}
                {variantObj?.note ? <p>{variantObj.note}</p> : null}
              </div>
            </div>

            <a className="t-help__more" href={HELPER_FALLBACK_HREF} target="_blank" rel="noopener">
              Wszystkie urządzenia w poradniku <IconArrowUpRight />
              <span className="t-visually-hidden">(otwiera się w nowej karcie)</span>
            </a>
          </div>
        </>,
      ) : null}
    </>
  );
}
