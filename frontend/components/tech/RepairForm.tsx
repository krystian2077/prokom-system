"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { courierService, line, servicePoints, telHref, type PointKey } from "@/config/prokom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import {
  BRAND_REQUIRED,
  CONTACT_OPTIONS,
  FIELD_STEP,
  NOTES_MAX,
  buildAdditionalNotes,
  buildSubmitPayload,
  emptyRepairForm,
  firstErrorField,
  parseWizardParams,
  phoneLast4,
  validateRepairForm,
  validateStep,
  type FieldErrors,
  type FormField,
  type RepairFormState,
  type SubmitResponse,
} from "@/lib/tech/contract";
import { hoursSummary } from "@/lib/tech/hours";
import { ACCOUNT_HREF } from "@/lib/tech/nav";
import { isDraftMode } from "@/lib/tech/points";
import { courierWhereText } from "@/lib/tech/courier";
import { RepairFormHead } from "./PageHeads";
import { polishText } from "@/lib/tech/typo";
import { CATEGORY_ICON, DEVICE_HINTS, FORM_STEPS, appendFault, chosenPoint, courierLines, faultSuggestions, hasFault, type StepNo } from "@/lib/tech/repair-form";
import { EASE, prefersReducedMotion } from "@/lib/tech/motion";
import { submitRepair } from "@/lib/tech/requests";
import { trackEvent } from "@/lib/tech/track-event";
import { DEVICE_CATEGORIES, HAMMER_GLASS_INTEREST } from "@/types/repair";
import { DeviceGlyph, IconArrow, IconCheck, IconPlus, IconUser } from "./icons";
import { OpeningStatus } from "./OpeningStatus";
import { PrepChecklist } from "./PrepChecklist";
import { useShell } from "./ShellContext";
import { RememberRepair } from "./RememberRepair";
import { SuccessCard } from "./SuccessCard";
import { Choice, DotsIcon, FieldError, Segmented, TextField, aria, fieldId, radioKeys } from "./zgloszenie/FormParts";
import { ModelHelper } from "./zgloszenie/ModelHelper";
import { usePill } from "./usePill";

/** Hammer Glass films exist for these devices (SPEC §6 /hammer-glass). */
const FILM_DEVICES = BRAND_REQUIRED;
/** Offered Hammer Glass answers; free_with_quote is a promotion not confirmed by the boss (SPEC §10). */
const HAMMER_OFFERED = HAMMER_GLASS_INTEREST.filter((h) => h.value !== "free_with_quote").map((h) => ({
  value: h.value,
  label: h.value === "yes" ? "Tak, chcę folię" : h.value === "no" ? "Nie, dziękuję" : "Zapytajcie po wycenie",
}));
const TURNS_ON = [
  { value: "yes", label: "Tak" },
  { value: "no", label: "Nie" },
  { value: "unknown", label: "Nie wiem" },
] as const;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const RETURN_OPTIONS = [
  { value: "in_person", label: "Odbiór osobisty" },
  { value: "courier", label: "Kurier" },
] as const;

/** "Co dalej" in the aside (design T.Zgloszenie, no unconfirmed time promises — SPEC §8, §10). */
const NEXT_STEPS = [
  { t: "Numer zgłoszenia", s: "Dostajesz go od razu po wysłaniu, także e-mailem." },
  { t: "Diagnoza i wycena", s: "Po przyjęciu sprzętu sprawdzamy usterkę i przesyłamy wycenę." },
  { t: "Twoja decyzja", s: "Akceptujesz albo rezygnujesz bez konsekwencji." },
  { t: "Status online", s: "Po numerze zgłoszenia i 4 ostatnich cyfrach telefonu." },
];

/** Polish plural of "znak". */
function charWord(n: number): string {
  if (n === 1) return "znak";
  const d = n % 10;
  const t = n % 100;
  return d >= 2 && d <= 4 && (t < 12 || t > 14) ? "znaki" : "znaków";
}

const SHAKE: Keyframe[] = [
  { transform: "translateX(0)" },
  { transform: "translateX(-6px)" },
  { transform: "translateX(5px)" },
  { transform: "translateX(-3px)" },
  { transform: "translateX(0)" },
];

/** Live hint under the description: more detail = a better diagnosis (no limit in the contract). */
function problemHint(len: number): string {
  if (len === 0) return "Napisz własnymi słowami albo wybierz podpowiedź poniżej.";
  if (len < 25) return "Dopisz, kiedy to się dzieje i od kiedy.";
  return "Dziękujemy, to pomoże w diagnozie.";
}

/**
 * The one repair form /zgloszenie (SPEC §6–§7, KONTRAKT §1–§2, design #zglos-naprawe):
 * 5 steps in one card (the content slides and fades, the height follows), a stepper with
 * a sliding pill, a sticky summary aside on larger screens; one step per screen on phones
 * with a sticky "Dalej". The request is built only by buildSubmitPayload (unchanged).
 */
export function RepairForm() {
  const sp = useSearchParams();
  const { points } = useShell();
  const { token, user, loading: authLoading } = useAuth();
  const isClient = !!token && user?.role === "client";

  const [form, setForm] = useState<RepairFormState>(emptyRepairForm);
  const [step, setStep] = useState<StepNo>(1);
  const [maxStep, setMaxStep] = useState<StepNo>(1);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<ReadonlySet<FormField>>(() => new Set());
  const [general, setGeneral] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ response: SubmitResponse; form: RepairFormState } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const latest = useRef(form);
  latest.current = form;

  // Live validation: a field with an error is re-checked on every change (the message
  // disappears as soon as the value is right, or changes to the next problem).
  const set = useCallback(<K extends keyof RepairFormState>(key: K, value: RepairFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      if (!e[key]) return e;
      const next = validateRepairForm({ ...latest.current, [key]: value })[key];
      return { ...e, [key]: next };
    });
  }, []);

  /** Leaving a filled field checks its format (e-mail, phone, lengths) right away. */
  const blurField = useCallback((field: FormField) => {
    const v = latest.current[field];
    if (typeof v !== "string" || !v.trim()) return;
    setTouched((t) => (t.has(field) ? t : new Set(t).add(field)));
    const msg = validateRepairForm(latest.current)[field];
    setErrors((e) => (msg ? { ...e, [field]: msg } : e[field] ? { ...e, [field]: undefined } : e));
  }, []);

  // Wizard parameters (KONTRAKT §1.4) and the start event.
  useEffect(() => {
    const prefill = parseWizardParams(new URLSearchParams(sp.toString()), { draft: isDraftMode() });
    if (Object.keys(prefill).length) setForm((f) => ({ ...f, ...prefill }));
    if (!started.current) {
      started.current = true;
      trackEvent("zgloszenie_start", { zrodlo: sp.has("category") || sp.has("usterka") ? "kreator" : "przycisk" });
    }
  }, [sp]);

  // Logged-in client: contact data from /clients/me/ (KONTRAKT §1.5), never overwriting what was typed.
  useEffect(() => {
    if (authLoading || !isClient || !token) return;
    let cancelled = false;
    const fill = (p: { first_name?: string; last_name?: string; email?: string; phone?: string; preferred_contact?: string }) =>
      setForm((f) => ({
        ...f,
        firstName: f.firstName || p.first_name || "",
        lastName: f.lastName || p.last_name || "",
        email: f.email || p.email || "",
        phone: f.phone || p.phone || "",
        preferredContact: p.preferred_contact === "sms" || p.preferred_contact === "email" || p.preferred_contact === "phone" ? p.preferred_contact : f.preferredContact,
      }));
    if (user) fill(user);
    api
      .get<{ first_name?: string; last_name?: string; email?: string; phone?: string; preferred_contact?: string }>("/clients/me/", token)
      .then((p) => {
        if (!cancelled && p) fill(p);
      })
      .catch(() => {
        /* the user data from AuthContext is enough */
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, isClient, token, user]);

  // Only visible points (published, or drafts on staging) can be chosen.
  const pointKeys = useMemo(() => points.map((p) => p.key), [points]);
  useEffect(() => {
    if (form.dropoff && form.dropoff !== "courier" && !pointKeys.includes(form.dropoff)) set("dropoff", null);
  }, [form.dropoff, pointKeys, set]);

  // Courier drop-off: the salon the parcel goes to — only points in courierService.parcelPoints
  // (audit 16.11, variant (a): Rabka). Default = the first one; asked only when there are two.
  const courierChoices = useMemo(() => points.filter((p) => courierService.parcelPoints.includes(p.key)), [points]);
  useEffect(() => {
    const keys = courierChoices.map((p) => p.key);
    const want = form.dropoff !== "courier" ? null : form.courierPoint && keys.includes(form.courierPoint) ? form.courierPoint : keys[0] ?? null;
    if (form.courierPoint !== want) setForm((f) => ({ ...f, courierPoint: want }));
  }, [form.dropoff, form.courierPoint, courierChoices]);

  // Pick-up point: asked only with two visible points; with one it is that point when needed.
  const askPickup = form.returnMethod === "in_person" && points.length > 1;
  // Until the client picks one, the pick-up point follows the drop-off point.
  const [pickupTouched, setPickupTouched] = useState(false);
  useEffect(() => {
    const needs = form.returnMethod === "in_person";
    const fallback: PointKey | null = !needs ? null : form.dropoff && form.dropoff !== "courier" ? form.dropoff : form.dropoff === "courier" ? form.courierPoint ?? points[0]?.key ?? null : null;
    const want = askPickup && pickupTouched && form.pickupPoint ? form.pickupPoint : fallback;
    if (form.pickupPoint !== want) setForm((f) => ({ ...f, pickupPoint: want }));
  }, [askPickup, pickupTouched, form.dropoff, form.returnMethod, form.pickupPoint, form.courierPoint, points]);

  /* ---------- Motion: step change (height follows, content slides + fades) ---------- */
  const prevStep = useRef<StepNo>(step);
  const lastHeight = useRef<number | null>(null);
  const animating = useRef(false);
  useIsoLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const from = prevStep.current;
    prevStep.current = step;
    const to = stage.offsetHeight;
    const fromH = lastHeight.current;
    lastHeight.current = to;
    if (from === step || fromH === null || prefersReducedMotion() || typeof stage.animate !== "function") return;
    const dir = step > from ? 1 : -1;
    animating.current = true;
    stage.style.overflow = "clip";
    const h = stage.animate([{ height: `${fromH}px` }, { height: `${to}px` }], { duration: 440, easing: EASE.emph });
    const end = () => {
      animating.current = false;
      stage.style.overflow = "";
      lastHeight.current = stage.offsetHeight;
    };
    h.onfinish = end;
    h.oncancel = end;
    const pane = stage.firstElementChild as HTMLElement | null;
    pane?.animate(
      [
        { opacity: 0, transform: `translateX(${dir * 36}px)` },
        { opacity: 1, transform: "none" },
      ],
      { duration: 380, easing: EASE.emph },
    );
  }, [step, done]);
  // Height changes inside a step (courier address, errors) only update the reference.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver !== "function") return;
    const ro = new ResizeObserver(() => {
      if (!animating.current) lastHeight.current = stage.offsetHeight;
    });
    ro.observe(stage);
    return () => ro.disconnect();
  }, [done]);

  usePill(stepsRef, ".is-on > button", [step, maxStep, done]);

  const shakeInvalid = () => {
    if (prefersReducedMotion()) return;
    formRef.current?.querySelectorAll<HTMLElement>('[aria-invalid="true"]').forEach((el) => {
      if (typeof el.animate === "function") el.animate(SHAKE, { duration: 380, easing: EASE.out });
    });
  };

  const scrollToField = (field: FormField) => {
    window.setTimeout(() => {
      shakeInvalid();
      const el = document.getElementById(fieldId(field)) ?? document.querySelector<HTMLElement>(`[data-field="${field}"]`);
      if (!el) return;
      el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
      const focusable = el.matches("input, textarea, select, button") ? el : el.querySelector<HTMLElement>("input, textarea, button");
      focusable?.focus({ preventScroll: true });
    }, 60);
  };

  /** Brings the top of the card into view when it scrolled away (long steps, phones). */
  const revealCard = () => {
    window.setTimeout(() => {
      const card = cardRef.current;
      if (!card) return;
      const phone = window.matchMedia("(max-width: 767.98px)").matches;
      const target = phone ? document.querySelector<HTMLElement>(".t-zgl__phonebar") ?? card : card;
      if (target.getBoundingClientRect().top < 72 || phone) target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    }, 40);
  };

  const showStep = (n: StepNo) => {
    setStep(n);
    revealCard();
  };

  const goTo = (n: StepNo) => {
    setStep(n);
    setMaxStep((m) => (n > m ? n : m));
    trackEvent("zgloszenie_krok", { nr: n });
    revealCard();
  };

  const next = () => {
    const e = validateStep(step, form);
    if (Object.keys(e).length) {
      setErrors((prev) => ({ ...prev, ...e }));
      trackEvent("zgloszenie_blad", { typ: "walidacja" });
      const first = firstErrorField(e);
      if (first) scrollToField(first);
      return;
    }
    if (step < 5) goTo((step + 1) as StepNo);
  };

  const showErrors = (e: FieldErrors) => {
    setErrors(e);
    const first = firstErrorField(e);
    if (first) {
      const s = FIELD_STEP[first];
      setStep(s);
      scrollToField(first);
    }
  };

  const submit = async () => {
    setGeneral([]);
    const e = validateRepairForm(form);
    if (Object.keys(e).length) {
      trackEvent("zgloszenie_blad", { typ: "walidacja" });
      showErrors(e);
      return;
    }
    setSending(true);
    const result = await submitRepair(buildSubmitPayload(form), { token: isClient ? token : null });
    setSending(false);
    if (result.ok) {
      const point = chosenPoint(form);
      trackEvent("zgloszenie_wyslane", { kategoria: form.category ?? "other", dostawa: form.dropoff === "courier" ? "kurier" : "punkt", ...(point ? { punkt: point } : {}) });
      setDone({ response: result.data, form });
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      return;
    }
    if (result.kind === "validation") {
      trackEvent("zgloszenie_blad", { typ: "walidacja" });
      setGeneral(result.errors.general);
      if (Object.keys(result.errors.fields).length) showErrors(result.errors.fields);
      return;
    }
    trackEvent("zgloszenie_blad", { typ: result.kind === "throttled" ? "429" : result.kind === "server" ? "5xx" : result.kind === "network" ? "siec" : "timeout" });
    setGeneral([result.message]);
  };

  if (done) {
    const f = done.form;
    const key = chosenPoint(f);
    const point = key ? points.find((p) => p.key === key) ?? null : null;
    const label = DEVICE_CATEGORIES.find((c) => c.value === f.category)?.label ?? "";
    return (
      <div className="t-ui t-container t-zgl t-zgl--done">
        <SuccessCard
          response={done.response}
          deviceLabel={[label, [f.brand.trim(), f.model.trim()].filter(Boolean).join(" ")].filter(Boolean).join(" · ")}
          category={f.category}
          point={f.dropoff === "courier" ? null : point}
          courier={f.dropoff === "courier"}
          courierPoint={f.dropoff === "courier" && f.courierPoint ? points.find((p) => p.key === f.courierPoint) ?? null : null}
          loggedIn={isClient}
        >
          <RememberRepair
            repairNumber={done.response.repair_number}
            last4={phoneLast4(f.phone)}
            device={[f.brand.trim(), f.model.trim()].filter(Boolean).join(" ") || label || "Urządzenie"}
            status="Zgłoszenie przyjęte"
          />
        </SuccessCard>
      </div>
    );
  }

  const cat = form.category;
  const hints = (cat && DEVICE_HINTS[cat]) || { brand: "np. producent", model: "np. nazwa z naklejki albo pudełka" };
  const brandRequired = !!cat && BRAND_REQUIRED.has(cat);
  const usesCourier = form.dropoff === "courier" || form.returnMethod === "courier";
  const catLabel = DEVICE_CATEGORIES.find((c) => c.value === cat)?.label;
  const catIcon = cat ? CATEGORY_ICON[cat] : null;
  const pointName = (k: PointKey | null) => servicePoints.find((p) => p.key === k)?.name ?? "";
  const dropoffText = form.dropoff === "courier" ? (form.courierPoint ? `Kurier · na adres: ${pointName(form.courierPoint)}` : "Kurier") : form.dropoff ? `${pointName(form.dropoff)}, osobiście` : null;
  const returnText = form.returnMethod === "courier" ? "Kurier" : form.pickupPoint ? `Odbiór osobisty · ${pointName(form.pickupPoint)}` : "Odbiór osobisty";
  const notesHead = buildAdditionalNotes({ ...form, notes: "" });
  const notesLeft = NOTES_MAX - (notesHead ? notesHead.length + 2 : 0) - form.notes.trim().length;
  const contactLabel = CONTACT_OPTIONS.find((c) => c.value === form.preferredContact)?.label;
  const live = validateRepairForm(form);
  const isValid = (f: FormField) => {
    const v = form[f];
    return touched.has(f) && typeof v === "string" && v.trim() !== "" && !live[f] && !errors[f]?.length;
  };
  const suggestions = faultSuggestions(cat);
  const problemLen = form.problem.trim().length;

  const summary: { k: string; v: string | null; step: StepNo }[] = [
    { k: "Urządzenie", v: catLabel ?? null, step: 1 },
    { k: "Marka i model", v: [form.brand.trim(), form.model.trim()].filter(Boolean).join(" ") || null, step: 1 },
    { k: "Usterka", v: form.problem.trim() ? (form.problem.trim().length > 60 ? `${form.problem.trim().slice(0, 60)}…` : form.problem.trim()) : null, step: 1 },
    { k: "Dostarczenie", v: dropoffText, step: 2 },
    { k: "Zwrot", v: maxStep > 2 || form.dropoff ? returnText : null, step: 2 },
  ];

  const stepBody: Record<StepNo, ReactNode> = {
    1: (
      <>
        <div className="t-field" data-field="category" id={fieldId("category")} tabIndex={-1}>
          <span className="t-field__label" id="zgl-cat-label">
            Rodzaj urządzenia *
          </span>
          <div className="t-dtiles" role="radiogroup" aria-labelledby="zgl-cat-label" onKeyDown={radioKeys} {...aria("category", errors)}>
            {DEVICE_CATEGORIES.map((c) => {
              const icon = CATEGORY_ICON[c.value];
              return (
                <Choice key={c.value} on={cat === c.value} onClick={() => set("category", c.value)} className="t-dtile">
                  <span className="t-dtile__ico">{icon ? <DeviceGlyph icon={icon} size={22} /> : <DotsIcon size={22} />}</span>
                  <span className="t-dtile__t">{c.label}</span>
                  <span className="t-dtile__ok" aria-hidden="true">
                    <IconCheck size={12} strokeWidth={3.4} />
                  </span>
                </Choice>
              );
            })}
          </div>
          <FieldError field="category" errors={errors} />
        </div>
        <div className="t-fgrid">
          <TextField
            field="brand"
            label={<>Marka {brandRequired ? "*" : <em>opcjonalnie</em>}</>}
            value={form.brand}
            onValue={(v) => set("brand", v)}
            onBlurField={blurField}
            errors={errors}
            valid={isValid("brand")}
            placeholder={hints.brand}
            maxLength={100}
            autoComplete="off"
          />
          <TextField
            field="model"
            label="Model *"
            value={form.model}
            onValue={(v) => set("model", v)}
            onBlurField={blurField}
            errors={errors}
            valid={isValid("model")}
            placeholder={hints.model}
            maxLength={200}
            autoComplete="off"
            aside={<ModelHelper field="model" category={cat} brand={form.brand} model={form.model} onUseModel={(m) => set("model", m)} />}
          />
          <TextField
            field="imei"
            label={<>IMEI albo numer seryjny <em>opcjonalnie</em></>}
            value={form.imei}
            onValue={(v) => set("imei", v)}
            onBlurField={blurField}
            errors={errors}
            valid={isValid("imei")}
            placeholder={cat === "phone" ? "Wybierz *#06# na klawiaturze telefonu" : "Z naklejki na spodzie albo z pudełka"}
            maxLength={20}
            autoComplete="off"
            aside={<ModelHelper field="imei" category={cat} brand={form.brand} model={form.model} />}
          />
          <div className="t-field" data-field="turnsOn">
            <div className="t-field__top">
              <span className="t-field__label" id="zgl-on-label">
                Czy urządzenie się włącza?
              </span>
            </div>
            <Segmented labelId="zgl-on-label" options={TURNS_ON} value={form.turnsOn} onChange={(v) => set("turnsOn", v)} />
          </div>
        </div>
        <div className={`t-field t-area${problemLen ? " has-text" : ""}`}>
          <div className="t-field__top">
            <label className="t-field__label" htmlFor={fieldId("problem")}>
              Co się dzieje? *
            </label>
            <span className="t-area__count" aria-hidden="true">
              {problemLen} {charWord(problemLen)}
            </span>
          </div>
          <div className="t-input t-input--area">
            <textarea
              id={fieldId("problem")}
              value={form.problem}
              onChange={(e) => set("problem", e.target.value)}
              placeholder="Np. pęknięty ekran, dotyk działa tylko w dolnej części"
              rows={4}
              aria-describedby={errors.problem?.length ? `${fieldId("problem")}-err` : "zgl-problem-hint"}
              aria-invalid={errors.problem?.length ? true : undefined}
            />
            <span className="t-area__meter" aria-hidden="true" style={{ ["--fill" as string]: Math.min(1, problemLen / 60) }} />
          </div>
          <FieldError field="problem" errors={errors} />
          {!errors.problem?.length ? (
            <span className="t-field__hint" id="zgl-problem-hint">
              {problemHint(problemLen)}
            </span>
          ) : null}
          <div className="t-quick" role="group" aria-label={catLabel ? `Częste usterki: ${catLabel.toLocaleLowerCase("pl")}` : "Częste usterki"} key={cat ?? "none"}>
            {suggestions.map((q) => {
              const on = hasFault(form.problem, q);
              return (
                <button key={q} type="button" className={`t-quick__chip${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => !on && set("problem", appendFault(form.problem, q))}>
                  <span className="t-quick__ico" aria-hidden="true">
                    {on ? <IconCheck size={12} strokeWidth={3.2} /> : <IconPlus size={12} strokeWidth={3} />}
                  </span>
                  {q}
                </button>
              );
            })}
          </div>
        </div>
        <TextField
          field="visualCondition"
          label={<>Stan wizualny <em>opcjonalnie</em></>}
          value={form.visualCondition}
          onValue={(v) => set("visualCondition", v)}
          onBlurField={blurField}
          errors={errors}
          placeholder="Rysy, wgniecenia, pęknięcia obudowy"
          maxLength={2000}
        />
      </>
    ),
    2: (
      <>
        <div className="t-field" data-field="dropoff" id={fieldId("dropoff")} tabIndex={-1}>
          <span className="t-field__label" id="zgl-drop-label">
            Jak dostarczysz sprzęt? *
          </span>
          <div className="t-options" role="radiogroup" aria-labelledby="zgl-drop-label" onKeyDown={radioKeys} {...aria("dropoff", errors)}>
            {points.map((p) => (
              <Choice key={p.key} on={form.dropoff === p.key} onClick={() => set("dropoff", p.key)} className={`t-option${p.draft ? " t-draft" : ""}`}>
                {p.draft ? <span className="t-draft-badge">do uzupełnienia</span> : null}
                <span className="t-option__ok" aria-hidden="true">
                  <IconCheck size={12} strokeWidth={3.4} />
                </span>
                <b>Osobiście · {p.name}</b>
                <span>{[p.street, `${p.postal} ${p.city}`].filter(Boolean).join(", ")}</span>
                <span className="t-option__meta">
                  <OpeningStatus points={[p]} skeletonCh={16} /> <span>{hoursSummary(p)}</span>
                </span>
              </Choice>
            ))}
            <Choice on={form.dropoff === "courier"} onClick={() => set("dropoff", "courier")} className="t-option">
              <span className="t-option__ok" aria-hidden="true">
                <IconCheck size={12} strokeWidth={3.4} />
              </span>
              <b>Kurier</b>
              {/* noBreakHyphens: "Rabce-Zdroju" stays on one line in the narrow card */}
              <span>{polishText(courierWhereText() ?? "Wyślesz sprzęt paczką kurierską.", true)}</span>
              {courierLines().map((l) => (
                <span key={l} className="t-option__meta">
                  {l}
                </span>
              ))}
              {/* "Jak to działa?" → /naprawa-kurierem only once courierService.published (SPEC §12.10). */}
              {courierService.published ? (
                <Link href="/naprawa-kurierem" className="t-option__link" onClick={(e) => e.stopPropagation()}>
                  Jak to działa?
                </Link>
              ) : null}
            </Choice>
          </div>
          <FieldError field="dropoff" errors={errors} />
        </div>
        {form.dropoff === "courier" && courierChoices.length > 1 ? (
          <div className="t-field t-reveal-in" data-field="courierPoint">
            <span className="t-field__label" id="zgl-cpoint-label">
              Na adres którego salonu wyślesz?
            </span>
            <Segmented labelId="zgl-cpoint-label" options={courierChoices.map((p) => ({ value: p.key, label: p.name }))} value={form.courierPoint} onChange={(v) => set("courierPoint", v)} />
            <span className="t-field__hint">Adres i godziny salonu pokażemy po wysłaniu zgłoszenia.</span>
          </div>
        ) : null}
        <div className="t-field" data-field="returnMethod">
          <span className="t-field__label" id="zgl-ret-label">
            Zwrot po naprawie
          </span>
          <Segmented labelId="zgl-ret-label" options={RETURN_OPTIONS} value={form.returnMethod} onChange={(v) => set("returnMethod", v)} />
        </div>
        {askPickup ? (
          <div className="t-field t-reveal-in" data-field="pickupPoint">
            <span className="t-field__label" id="zgl-pick-label">
              Gdzie odbierzesz?
            </span>
            <Segmented
              labelId="zgl-pick-label"
              options={points.map((p) => ({ value: p.key, label: p.name }))}
              value={form.pickupPoint}
              onChange={(v) => {
                setPickupTouched(true);
                set("pickupPoint", v);
              }}
            />
            <span className="t-field__hint">Możesz oddać sprzęt w jednym punkcie i odebrać w drugim.</span>
          </div>
        ) : null}
        {usesCourier ? (
          <fieldset className="t-fieldset t-reveal-in">
            <legend className="t-field__label">Adres do wysyłki</legend>
            <div className="t-fgrid t-fgrid--addr">
              <TextField field="street" label="Ulica *" value={form.street} onValue={(v) => set("street", v)} onBlurField={blurField} errors={errors} valid={isValid("street")} autoComplete="address-line1" maxLength={200} />
              <TextField field="houseNumber" label={<>Nr domu / lokalu <em>opcjonalnie</em></>} value={form.houseNumber} onValue={(v) => set("houseNumber", v)} onBlurField={blurField} errors={errors} autoComplete="address-line2" maxLength={50} />
              <TextField field="postalCode" label={<>Kod pocztowy <em>opcjonalnie</em></>} value={form.postalCode} onValue={(v) => set("postalCode", v)} onBlurField={blurField} errors={errors} inputMode="numeric" autoComplete="postal-code" placeholder="00-000" maxLength={10} />
              <TextField field="city" label="Miasto *" value={form.city} onValue={(v) => set("city", v)} onBlurField={blurField} errors={errors} valid={isValid("city")} autoComplete="address-level2" maxLength={100} />
            </div>
          </fieldset>
        ) : null}
      </>
    ),
    3: (
      <>
        {cat && FILM_DEVICES.has(cat) ? (
          <div className="t-field" data-field="hammerGlass">
            <span className="t-field__label" id="zgl-hg-label">
              Folia Hammer Glass
            </span>
            <span className="t-field__hint">Folia ochronna wycięta pod Twój model, założona przy odbiorze. Opcjonalnie.</span>
            <Segmented labelId="zgl-hg-label" options={HAMMER_OFFERED} value={form.hammerGlass} onChange={(v) => set("hammerGlass", v)} invalid={aria("hammerGlass", errors)} />
            <FieldError field="hammerGlass" errors={errors} />
          </div>
        ) : null}
        <label className={`t-check t-check--card${form.backup ? " is-on" : ""}`} data-field="backup">
          <input type="checkbox" checked={form.backup} onChange={(e) => set("backup", e.target.checked)} />
          <span>
            <b>Potrzebuję kopii zapasowej danych przed naprawą</b>
            <br />
            <span className="t-field__hint">Zapiszemy zdjęcia i pliki, zanim zaczniemy naprawę.</span>
          </span>
        </label>
      </>
    ),
    4: (
      <>
        {!isClient ? (
          <Link href={`${ACCOUNT_HREF}?returnUrl=${encodeURIComponent("/zgloszenie")}`} className="t-account t-account--inline">
            <span className="t-ico">
              <IconUser size={20} />
            </span>
            <span>
              <b>Masz konto klienta?</b> Zaloguj się, a dane uzupełnimy za Ciebie.
            </span>
          </Link>
        ) : null}
        <div className="t-fgrid">
          <TextField field="firstName" label="Imię *" value={form.firstName} onValue={(v) => set("firstName", v)} onBlurField={blurField} errors={errors} valid={isValid("firstName")} autoComplete="given-name" maxLength={100} />
          <TextField field="lastName" label="Nazwisko *" value={form.lastName} onValue={(v) => set("lastName", v)} onBlurField={blurField} errors={errors} valid={isValid("lastName")} autoComplete="family-name" maxLength={100} />
          <TextField field="email" label="E-mail *" type="email" inputMode="email" value={form.email} onValue={(v) => set("email", v)} onBlurField={blurField} errors={errors} valid={isValid("email")} autoComplete="email" />
          <TextField field="phone" label="Telefon *" type="tel" inputMode="tel" value={form.phone} onValue={(v) => set("phone", v)} onBlurField={blurField} errors={errors} valid={isValid("phone")} autoComplete="tel" placeholder="np. 600 100 200" maxLength={20} />
        </div>
        <div className="t-field" data-field="preferredContact">
          <span className="t-field__label" id="zgl-pref-label">
            Wolisz kontakt
          </span>
          <Segmented labelId="zgl-pref-label" options={CONTACT_OPTIONS} value={form.preferredContact} onChange={(v) => set("preferredContact", v)} />
        </div>
      </>
    ),
    5: (
      <>
        <dl className="t-review">
          {[
            ...summary.filter((s) => s.v),
            { k: "Folia Hammer Glass", v: cat && FILM_DEVICES.has(cat) ? HAMMER_OFFERED.find((h) => h.value === form.hammerGlass)?.label ?? null : null, step: 3 as StepNo },
            { k: "Kopia danych", v: form.backup ? "Tak" : null, step: 3 as StepNo },
            { k: "Kontakt", v: [`${form.firstName} ${form.lastName}`.trim(), form.email.trim(), form.phone.trim()].filter(Boolean).join(" · ") || null, step: 4 as StepNo },
            { k: "Wolisz kontakt", v: contactLabel ?? null, step: 4 as StepNo },
          ]
            .filter((s) => s.v)
            .map((s) => (
              <div key={s.k}>
                <dt>{s.k}</dt>
                <dd>
                  <span>{s.v}</span>{" "}
                  <button type="button" className="t-linkbtn" onClick={() => showStep(s.step)} aria-label={`Zmień: ${s.k}`}>
                    Zmień
                  </button>
                </dd>
              </div>
            ))}
        </dl>
        <div className="t-field t-area">
          <div className="t-field__top">
            <label className="t-field__label" htmlFor={fieldId("notes")}>
              Uwagi dla serwisu <em>opcjonalnie</em>
            </label>
            <span className={`t-area__count${notesLeft < 0 ? " is-bad" : ""}`} id="zgl-notes-left">
              Zostało znaków: {notesLeft}
            </span>
          </div>
          <div className="t-input t-input--area">
            <textarea
              id={fieldId("notes")}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              placeholder="Np. kiedy najlepiej dzwonić, kod do odblokowania podasz przy przyjęciu"
              aria-describedby={errors.notes?.length ? `${fieldId("notes")}-err zgl-notes-left` : "zgl-notes-left"}
              aria-invalid={errors.notes?.length ? true : undefined}
            />
          </div>
          <FieldError field="notes" errors={errors} />
        </div>
        <PrepChecklist category={cat} />
        <label className={`t-check t-check--card${form.consent ? " is-on" : ""}`} data-field="consent" id={fieldId("consent")}>
          <input type="checkbox" checked={form.consent} onChange={(e) => set("consent", e.target.checked)} {...aria("consent", errors)} />
          <span>
            Akceptuję <Link href="/regulamin">regulamin</Link> i <Link href="/polityka-prywatnosci">politykę prywatności</Link>. Dane podaję, żeby serwis mógł przyjąć i obsłużyć zgłoszenie. *
          </span>
        </label>
        <FieldError field="consent" errors={errors} />
        {general.length ? (
          <div className="t-alert" role="alert">
            {general.map((g) => (
              <p key={g}>{g}</p>
            ))}
          </div>
        ) : null}
      </>
    ),
  };

  const stepMeta = FORM_STEPS[step - 1];
  const nextLabel = step < 5 ? `Dalej: ${(FORM_STEPS[step as 1 | 2 | 3 | 4]?.long ?? "").toLocaleLowerCase("pl")}` : sending ? "Wysyłanie…" : "Wyślij zgłoszenie";
  const stepHasErrors = (n: StepNo) => Object.entries(errors).some(([k, v]) => v?.length && FIELD_STEP[k as FormField] === n);

  return (
    <div className="t-ui t-container t-zgl">
      <div className="t-zgl__main">
        <RepairFormHead />

        <div className="t-stepper" ref={stepsRef} style={{ ["--zgl-progress" as string]: (step - 1) / 4 }}>
          <span className="t-stepper__pill" aria-hidden="true" />
          <ol className="t-steps" aria-label="Kroki zgłoszenia">
            {FORM_STEPS.map((s) => {
              const n = s.n as StepNo;
              const state = n === step ? "is-on" : n <= maxStep ? "is-done" : "";
              const can = n <= maxStep;
              return (
                <li key={n} className={`t-steps__item ${state}${stepHasErrors(n) ? " has-error" : ""}`} aria-current={n === step ? "step" : undefined}>
                  <button type="button" disabled={!can} onClick={() => can && showStep(n)}>
                    <span className="t-steps__n">{n !== step && n < maxStep ? <IconCheck size={13} strokeWidth={3} /> : n}</span>
                    <span className="t-steps__t">{s.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <span className="t-stepper__bar" aria-hidden="true" />
        </div>
        <div className="t-zgl__phonebar" aria-hidden="true">
          <span>{`Zgłoś naprawę · ${step} z 5`}</span>
          <span className="t-zgl__progress">
            {FORM_STEPS.map((s) => (
              <i key={s.n} className={s.n <= step ? "is-on" : ""} />
            ))}
          </span>
        </div>

        <form
          ref={formRef}
          className="t-zgl__form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (step < 5) next();
            else void submit();
          }}
        >
          <section ref={cardRef} id={`zgl-step-${step}`} className="t-zgl__step t-card is-open" aria-labelledby={`zgl-step-${step}-h`}>
            <div className="t-zgl__stage" ref={stageRef}>
              <div className="t-zgl__pane" key={step}>
                <div className="t-zgl__stephead">
                  <h2 id={`zgl-step-${step}-h`} className="t-zgl__steph">
                    <span className="t-zgl__stepn">{step}</span>
                    {stepMeta.long}
                  </h2>
                  <p className="t-zgl__stepsub">{stepMeta.sub}</p>
                </div>
                <div className="t-zgl__body">{stepBody[step]}</div>
              </div>
            </div>
            <div className="t-zgl__foot">
              <span className="t-zgl__note">{step === 1 ? "* pola wymagane · model zawsze, marka dla telefonu, tabletu i smartwatcha" : step === 5 ? "Wycena przed naprawą. Możesz zrezygnować." : "* pola wymagane"}</span>
              <div className="t-zgl__btns">
                {step > 1 ? (
                  <button type="button" className="t-btn t-btn--ghost" onClick={() => showStep((step - 1) as StepNo)}>
                    Wstecz
                  </button>
                ) : null}
                <button type="submit" className={`t-btn t-btn--acc t-btn--shine${sending ? " is-busy" : ""}`} disabled={sending} data-zgl-next="">
                  <span className="t-zgl__nextlong">{nextLabel}</span>
                  <span className="t-zgl__nextshort">{step < 5 ? "Dalej" : sending ? "Wysyłanie…" : "Wyślij"}</span>
                  {sending ? <span className="t-spin" aria-hidden="true" /> : <IconArrow />}
                </button>
              </div>
            </div>
          </section>
        </form>
      </div>

      <aside className="t-zgl__aside" aria-label="Twoje zgłoszenie">
        <div className="t-card t-zgl__sum">
          <div className="t-zgl__sumhead">
            <span className="t-eyebrow">Twoje zgłoszenie</span>
            <span className="t-zgl__sumstep">{`Krok ${step} z 5`}</span>
          </div>
          <span className="t-zgl__sumbar" aria-hidden="true" style={{ ["--zgl-progress" as string]: step / 5 }} />
          <dl>
            {summary.map((s) => (
              <div key={s.k} className={s.v ? "has-v" : undefined}>
                <dt>{s.k}</dt>
                <dd key={s.v ?? "empty"}>
                  {s.v ? (
                    <span className="t-zgl__val">
                      {s.k === "Urządzenie" ? <span className="t-zgl__vico">{catIcon ? <DeviceGlyph icon={catIcon} size={15} /> : <DotsIcon size={15} />}</span> : null}
                      {s.v}
                    </span>
                  ) : (
                    <span className="t-muted">{s.step === 2 ? "do wyboru w kroku 2" : "—"}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <span className="t-zgl__promise">
            <IconCheck size={16} /> Wycena przed naprawą. Możesz zrezygnować.
          </span>
        </div>
        <div className="t-dark t-zgl__next">
          <span className="t-eyebrow t-eyebrow--dark">Co dalej</span>
          <ol>
            {NEXT_STEPS.map((x, i) => (
              <li key={x.t}>
                <span>{i + 1}</span>
                <p>
                  <b>{x.t}</b>
                  <br />
                  {x.s}
                </p>
              </li>
            ))}
          </ol>
        </div>
        {!isClient ? (
          <Link href={`${ACCOUNT_HREF}?returnUrl=${encodeURIComponent("/zgloszenie")}`} className="t-card t-account">
            <span className="t-ico">
              <IconUser size={22} />
            </span>
            <span>
              <b>Masz konto klienta?</b>
              <br />
              <span className="t-muted">Zaloguj się, a dane uzupełnimy za Ciebie.</span>
            </span>
          </Link>
        ) : null}
        <p className="t-zgl__call">
          Wolisz zadzwonić? <a href={telHref(line.phone)} data-track="telefon_klik" data-track-miejsce="zgloszenie">{line.phoneDisplay}</a>
        </p>
      </aside>
    </div>
  );
}
