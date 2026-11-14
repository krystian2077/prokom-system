"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import { CATEGORY_ICON, DEVICE_HINTS, FORM_STEPS, QUICK_FAULTS, appendFault, chosenPoint, courierLines, type StepNo } from "@/lib/tech/repair-form";
import { submitRepair } from "@/lib/tech/requests";
import { trackEvent } from "@/lib/tech/track-event";
import { DEVICE_CATEGORIES, HAMMER_GLASS_INTEREST } from "@/types/repair";
import { DeviceGlyph, IconArrow, IconCheck, IconChevronDown, IconUser } from "./icons";
import { OpeningStatus } from "./OpeningStatus";
import { PrepChecklist } from "./PrepChecklist";
import { useShell } from "./ShellContext";
import { RememberRepair } from "./RememberRepair";
import { SuccessCard } from "./SuccessCard";

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

const DotsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true" focusable="false">
    <path d="M5 12h.01M12 12h.01M19 12h.01" />
  </svg>
);

const fieldId = (f: FormField) => `zgl-${f}`;

/** Error text under a field + aria wiring. */
function FieldError({ field, errors }: { field: FormField; errors: FieldErrors }) {
  const msgs = errors[field];
  if (!msgs?.length) return null;
  return (
    <span className="t-field__error" id={`${fieldId(field)}-err`} role="alert">
      {msgs.join(" ")}
    </span>
  );
}
const aria = (field: FormField, errors: FieldErrors) =>
  errors[field]?.length ? { "aria-invalid": true as const, "aria-describedby": `${fieldId(field)}-err` } : {};

function Choice({ on, onClick, children, className = "" }: { on: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" role="radio" aria-checked={on} className={`t-choice${on ? " is-on" : ""} ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}

/**
 * The one repair form /zgloszenie (SPEC §6–§7, KONTRAKT §1–§2, design #zglos-naprawe):
 * 5 steps, one step per screen on phones with a sticky "Dalej", accordion of steps with
 * a summary aside on larger screens.
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
  const [general, setGeneral] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ response: SubmitResponse; form: RepairFormState } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const started = useRef(false);

  const set = useCallback(<K extends keyof RepairFormState>(key: K, value: RepairFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
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

  // Pick-up point: asked only with two visible points; with one it is that point when needed.
  const askPickup = form.returnMethod === "in_person" && points.length > 1;
  // Until the client picks one, the pick-up point follows the drop-off point.
  const [pickupTouched, setPickupTouched] = useState(false);
  useEffect(() => {
    const needs = form.returnMethod === "in_person";
    const fallback: PointKey | null = !needs ? null : form.dropoff && form.dropoff !== "courier" ? form.dropoff : form.dropoff === "courier" ? points[0]?.key ?? null : null;
    const want = askPickup && pickupTouched && form.pickupPoint ? form.pickupPoint : fallback;
    if (form.pickupPoint !== want) setForm((f) => ({ ...f, pickupPoint: want }));
  }, [askPickup, pickupTouched, form.dropoff, form.returnMethod, form.pickupPoint, points]);

  const scrollToField = (field: FormField) => {
    window.setTimeout(() => {
      const el = document.getElementById(fieldId(field)) ?? document.querySelector<HTMLElement>(`[data-field="${field}"]`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusable = el.matches("input, textarea, select, button") ? el : el.querySelector<HTMLElement>("input, textarea, button");
      focusable?.focus({ preventScroll: true });
    }, 60);
  };

  const goTo = (n: StepNo) => {
    setStep(n);
    setMaxStep((m) => (n > m ? n : m));
    trackEvent("zgloszenie_krok", { nr: n });
    window.setTimeout(() => {
      document.getElementById(`zgl-step-${n}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
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
      window.scrollTo({ top: 0, behavior: "smooth" });
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
          point={point}
          courier={f.dropoff === "courier"}
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
  const pointName = (k: PointKey | null) => servicePoints.find((p) => p.key === k)?.name ?? "";
  const dropoffText = form.dropoff === "courier" ? "Kurier" : form.dropoff ? `${pointName(form.dropoff)}, osobiście` : null;
  const returnText = form.returnMethod === "courier" ? "Kurier" : form.pickupPoint ? `Odbiór osobisty · ${pointName(form.pickupPoint)}` : "Odbiór osobisty";
  const notesHead = buildAdditionalNotes({ ...form, notes: "" });
  const notesLeft = NOTES_MAX - (notesHead ? notesHead.length + 2 : 0) - form.notes.trim().length;
  const contactLabel = CONTACT_OPTIONS.find((c) => c.value === form.preferredContact)?.label;

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
          <div className="t-chips" role="radiogroup" aria-labelledby="zgl-cat-label" {...aria("category", errors)}>
            {DEVICE_CATEGORIES.map((c) => {
              const icon = CATEGORY_ICON[c.value];
              return (
                <Choice key={c.value} on={cat === c.value} onClick={() => set("category", c.value)} className="t-chip">
                  {icon ? <DeviceGlyph icon={icon} size={18} /> : <DotsIcon />}
                  {c.label}
                </Choice>
              );
            })}
          </div>
          <FieldError field="category" errors={errors} />
        </div>
        <div className="t-fgrid">
          <label className="t-field" htmlFor={fieldId("brand")}>
            <span className="t-field__label">
              Marka {brandRequired ? "*" : <em>opcjonalnie</em>}
            </span>
            <input id={fieldId("brand")} type="text" value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder={hints.brand} maxLength={100} autoComplete="off" {...aria("brand", errors)} />
            <FieldError field="brand" errors={errors} />
          </label>
          <label className="t-field" htmlFor={fieldId("model")}>
            <span className="t-field__label">Model *</span>
            <input id={fieldId("model")} type="text" value={form.model} onChange={(e) => set("model", e.target.value)} placeholder={hints.model} maxLength={200} autoComplete="off" {...aria("model", errors)} />
            <FieldError field="model" errors={errors} />
          </label>
          <label className="t-field" htmlFor={fieldId("imei")}>
            <span className="t-field__label">
              IMEI albo numer seryjny <em>opcjonalnie</em>
            </span>
            <input id={fieldId("imei")} type="text" value={form.imei} onChange={(e) => set("imei", e.target.value)} placeholder={cat === "phone" ? "Wybierz *#06# na klawiaturze telefonu" : "Z naklejki na spodzie albo z pudełka"} maxLength={20} autoComplete="off" {...aria("imei", errors)} />
            <FieldError field="imei" errors={errors} />
          </label>
          <div className="t-field" data-field="turnsOn">
            <span className="t-field__label" id="zgl-on-label">
              Czy urządzenie się włącza?
            </span>
            <div className="t-seg3" role="radiogroup" aria-labelledby="zgl-on-label">
              {TURNS_ON.map((o) => (
                <Choice key={o.value} on={form.turnsOn === o.value} onClick={() => set("turnsOn", o.value)}>
                  {o.label}
                </Choice>
              ))}
            </div>
          </div>
        </div>
        <label className="t-field" htmlFor={fieldId("problem")}>
          <span className="t-field__label">Co się dzieje? *</span>
          <textarea id={fieldId("problem")} value={form.problem} onChange={(e) => set("problem", e.target.value)} placeholder="Np. pęknięty ekran, dotyk działa tylko w dolnej części" rows={4} {...aria("problem", errors)} />
          <FieldError field="problem" errors={errors} />
        </label>
        <div className="t-quick" aria-label="Dodaj do opisu">
          {QUICK_FAULTS.map((q) => (
            <button key={q} type="button" className="t-quick__chip" onClick={() => set("problem", appendFault(form.problem, q))}>
              + {q}
            </button>
          ))}
        </div>
        <label className="t-field" htmlFor={fieldId("visualCondition")}>
          <span className="t-field__label">
            Stan wizualny <em>opcjonalnie</em>
          </span>
          <input id={fieldId("visualCondition")} type="text" value={form.visualCondition} onChange={(e) => set("visualCondition", e.target.value)} placeholder="Rysy, wgniecenia, pęknięcia obudowy" maxLength={2000} {...aria("visualCondition", errors)} />
          <FieldError field="visualCondition" errors={errors} />
        </label>
      </>
    ),
    2: (
      <>
        <div className="t-field" data-field="dropoff" id={fieldId("dropoff")} tabIndex={-1}>
          <span className="t-field__label" id="zgl-drop-label">
            Jak dostarczysz sprzęt? *
          </span>
          <div className="t-options" role="radiogroup" aria-labelledby="zgl-drop-label" {...aria("dropoff", errors)}>
            {points.map((p) => (
              <Choice key={p.key} on={form.dropoff === p.key} onClick={() => set("dropoff", p.key)} className={`t-option${p.draft ? " t-draft" : ""}`}>
                {p.draft ? <span className="t-draft-badge">do uzupełnienia</span> : null}
                <b>Osobiście · {p.name}</b>
                <span>{[p.street, `${p.postal} ${p.city}`].filter(Boolean).join(", ")}</span>
                <span className="t-option__meta">
                  <OpeningStatus points={[p]} skeletonCh={16} /> <span>{hoursSummary(p)}</span>
                </span>
              </Choice>
            ))}
            <Choice on={form.dropoff === "courier"} onClick={() => set("dropoff", "courier")} className="t-option">
              <b>Kurier</b>
              <span>Wyślesz sprzęt paczką kurierską.</span>
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
        <div className="t-field" data-field="returnMethod">
          <span className="t-field__label" id="zgl-ret-label">
            Zwrot po naprawie
          </span>
          <div className="t-seg2" role="radiogroup" aria-labelledby="zgl-ret-label">
            <Choice on={form.returnMethod === "in_person"} onClick={() => set("returnMethod", "in_person")}>
              Odbiór osobisty
            </Choice>
            <Choice on={form.returnMethod === "courier"} onClick={() => set("returnMethod", "courier")}>
              Kurier
            </Choice>
          </div>
        </div>
        {askPickup ? (
          <div className="t-field" data-field="pickupPoint">
            <span className="t-field__label" id="zgl-pick-label">
              Gdzie odbierzesz?
            </span>
            <div className="t-seg2" role="radiogroup" aria-labelledby="zgl-pick-label">
              {points.map((p) => (
                <Choice key={p.key} on={form.pickupPoint === p.key} onClick={() => {
                    setPickupTouched(true);
                    set("pickupPoint", p.key);
                  }}>
                  {p.name}
                </Choice>
              ))}
            </div>
            <span className="t-field__hint">Możesz oddać sprzęt w jednym punkcie i odebrać w drugim.</span>
          </div>
        ) : null}
        {usesCourier ? (
          <fieldset className="t-fieldset">
            <legend className="t-field__label">Adres do wysyłki</legend>
            <div className="t-fgrid t-fgrid--addr">
              <label className="t-field" htmlFor={fieldId("street")}>
                <span className="t-field__label">Ulica *</span>
                <input id={fieldId("street")} type="text" value={form.street} onChange={(e) => set("street", e.target.value)} autoComplete="address-line1" maxLength={200} {...aria("street", errors)} />
                <FieldError field="street" errors={errors} />
              </label>
              <label className="t-field" htmlFor={fieldId("houseNumber")}>
                <span className="t-field__label">
                  Nr domu / lokalu <em>opcjonalnie</em>
                </span>
                <input id={fieldId("houseNumber")} type="text" value={form.houseNumber} onChange={(e) => set("houseNumber", e.target.value)} autoComplete="address-line2" maxLength={50} {...aria("houseNumber", errors)} />
                <FieldError field="houseNumber" errors={errors} />
              </label>
              <label className="t-field" htmlFor={fieldId("postalCode")}>
                <span className="t-field__label">
                  Kod pocztowy <em>opcjonalnie</em>
                </span>
                <input id={fieldId("postalCode")} type="text" inputMode="numeric" value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} autoComplete="postal-code" placeholder="00-000" maxLength={10} {...aria("postalCode", errors)} />
                <FieldError field="postalCode" errors={errors} />
              </label>
              <label className="t-field" htmlFor={fieldId("city")}>
                <span className="t-field__label">Miasto *</span>
                <input id={fieldId("city")} type="text" value={form.city} onChange={(e) => set("city", e.target.value)} autoComplete="address-level2" maxLength={100} {...aria("city", errors)} />
                <FieldError field="city" errors={errors} />
              </label>
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
            <div className="t-seg3" role="radiogroup" aria-labelledby="zgl-hg-label" {...aria("hammerGlass", errors)}>
              {HAMMER_OFFERED.map((h) => (
                <Choice key={h.value} on={form.hammerGlass === h.value} onClick={() => set("hammerGlass", h.value)}>
                  {h.label}
                </Choice>
              ))}
            </div>
            <FieldError field="hammerGlass" errors={errors} />
          </div>
        ) : null}
        <label className="t-check" data-field="backup">
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
          <label className="t-field" htmlFor={fieldId("firstName")}>
            <span className="t-field__label">Imię *</span>
            <input id={fieldId("firstName")} type="text" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} autoComplete="given-name" maxLength={100} {...aria("firstName", errors)} />
            <FieldError field="firstName" errors={errors} />
          </label>
          <label className="t-field" htmlFor={fieldId("lastName")}>
            <span className="t-field__label">Nazwisko *</span>
            <input id={fieldId("lastName")} type="text" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} autoComplete="family-name" maxLength={100} {...aria("lastName", errors)} />
            <FieldError field="lastName" errors={errors} />
          </label>
          <label className="t-field" htmlFor={fieldId("email")}>
            <span className="t-field__label">E-mail *</span>
            <input id={fieldId("email")} type="email" inputMode="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" {...aria("email", errors)} />
            <FieldError field="email" errors={errors} />
          </label>
          <label className="t-field" htmlFor={fieldId("phone")}>
            <span className="t-field__label">Telefon *</span>
            <input id={fieldId("phone")} type="tel" inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" placeholder="np. 600 100 200" maxLength={20} {...aria("phone", errors)} />
            <FieldError field="phone" errors={errors} />
          </label>
        </div>
        <div className="t-field" data-field="preferredContact">
          <span className="t-field__label" id="zgl-pref-label">
            Wolisz kontakt
          </span>
          <div className="t-seg3" role="radiogroup" aria-labelledby="zgl-pref-label">
            {CONTACT_OPTIONS.map((c) => (
              <Choice key={c.value} on={form.preferredContact === c.value} onClick={() => set("preferredContact", c.value)}>
                {c.label}
              </Choice>
            ))}
          </div>
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
                  {s.v}{" "}
                  <button type="button" className="t-linkbtn" onClick={() => setStep(s.step)} aria-label={`Zmień: ${s.k}`}>
                    Zmień
                  </button>
                </dd>
              </div>
            ))}
        </dl>
        <label className="t-field" htmlFor={fieldId("notes")}>
          <span className="t-field__label">
            Uwagi dla serwisu <em>opcjonalnie</em>
          </span>
          <textarea id={fieldId("notes")} value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} placeholder="Np. kiedy najlepiej dzwonić, kod do odblokowania podasz przy przyjęciu" {...aria("notes", errors)} />
          <span className={`t-field__hint${notesLeft < 0 ? " is-bad" : ""}`}>Zostało znaków: {notesLeft}</span>
          <FieldError field="notes" errors={errors} />
        </label>
        <PrepChecklist category={cat} />
        <label className="t-check" data-field="consent" id={fieldId("consent")}>
          <input type="checkbox" checked={form.consent} onChange={(e) => set("consent", e.target.checked)} {...aria("consent", errors)} />
          <span>
            {/* TODO(krystian): consent wording to accept (lawyer / privacy policy, TD5). */}
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
        <header className="t-zgl__head">
          <nav aria-label="Okruszki" className="t-crumbs">
            <Link href="/">Start</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Zgłoś naprawę</span>
          </nav>
          <h1>Zgłoś naprawę</h1>
          <p className="t-lead">Bez logowania, około minuty. Wycenę dostajesz po diagnozie, przed naprawą.</p>
        </header>

        <ol className="t-steps" aria-label="Kroki zgłoszenia">
          {FORM_STEPS.map((s) => {
            const state = s.n === step ? "is-on" : s.n <= maxStep ? "is-done" : "";
            const can = s.n <= maxStep;
            return (
              <li key={s.n} className={`t-steps__item ${state}${stepHasErrors(s.n as StepNo) ? " has-error" : ""}`} aria-current={s.n === step ? "step" : undefined}>
                <button type="button" disabled={!can} onClick={() => can && setStep(s.n as StepNo)}>
                  <span className="t-steps__n">{s.n !== step && s.n < maxStep ? <IconCheck size={13} /> : s.n}</span>
                  <span className="t-steps__t">{s.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="t-zgl__phonebar" aria-hidden="true">
          <span>
            Zgłoś naprawę · {step} z 5
          </span>
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
          {FORM_STEPS.map((s) => {
            const n = s.n as StepNo;
            if (n === step) {
              return (
                <section key={n} id={`zgl-step-${n}`} className="t-zgl__step t-card is-open" aria-labelledby={`zgl-step-${n}-h`}>
                  <h2 id={`zgl-step-${n}-h`} className="t-zgl__steph">
                    <span className="t-zgl__stepn">{n}</span>
                    {stepMeta.long}
                  </h2>
                  <div className="t-zgl__body">{stepBody[n]}</div>
                  <div className="t-zgl__foot">
                    <span className="t-zgl__note">{n === 1 ? "* pola wymagane · model zawsze, marka dla telefonu, tabletu i smartwatcha" : n === 5 ? "Wycena przed naprawą. Możesz zrezygnować." : "* pola wymagane"}</span>
                    <div className="t-zgl__btns">
                      {n > 1 ? (
                        <button type="button" className="t-btn t-btn--ghost" onClick={() => setStep((n - 1) as StepNo)}>
                          Wstecz
                        </button>
                      ) : null}
                      <button type="submit" className="t-btn t-btn--acc" disabled={sending} data-zgl-next="">
                        <span className="t-zgl__nextlong">{nextLabel}</span>
                        <span className="t-zgl__nextshort">{step < 5 ? "Dalej" : sending ? "Wysyłanie…" : "Wyślij"}</span>
                        <IconArrow />
                      </button>
                    </div>
                  </div>
                </section>
              );
            }
            const reachable = n <= maxStep;
            return (
              <button
                key={n}
                type="button"
                id={`zgl-step-${n}`}
                className={`t-zgl__collapsed t-card${reachable ? " is-reachable" : ""}${stepHasErrors(n) ? " has-error" : ""}`}
                onClick={() => reachable && setStep(n)}
                aria-disabled={!reachable}
                tabIndex={reachable ? 0 : -1}
              >
                <span className="t-zgl__stepn">{n < maxStep ? <IconCheck size={14} /> : n}</span>
                <span className="t-zgl__ctext">
                  <b>{s.long}</b>
                  <span>{s.sub}</span>
                </span>
                <IconChevronDown size={18} />
              </button>
            );
          })}
        </form>
      </div>

      <aside className="t-zgl__aside" aria-label="Twoje zgłoszenie">
        <div className="t-card t-zgl__sum">
          <span className="t-eyebrow">Twoje zgłoszenie</span>
          <dl>
            {summary.map((s) => (
              <div key={s.k}>
                <dt>{s.k}</dt>
                <dd>{s.v ?? <span className="t-muted">{s.step === 2 ? "do wyboru w kroku 2" : "—"}</span>}</dd>
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
            {[
              { t: "Numer zgłoszenia", s: "Dostajesz go od razu po wysłaniu, także e-mailem." },
              { t: "Diagnoza i wycena", s: "Po przyjęciu sprzętu sprawdzamy usterkę i przesyłamy wycenę." },
              { t: "Twoja decyzja", s: "Akceptujesz albo rezygnujesz bez konsekwencji." },
              { t: "Status online", s: "Po numerze zgłoszenia i 4 ostatnich cyfrach telefonu." },
            ].map((x, i) => (
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
