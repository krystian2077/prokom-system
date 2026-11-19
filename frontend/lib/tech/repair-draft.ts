/**
 * Draft of the repair form /zgloszenie (feat/tech-szkic-formularza): a refresh in the middle
 * of the form no longer loses what was typed.
 *
 * Storage: sessionStorage only (this tab, gone when it is closed) — less risk for personal
 * data than localStorage. The consent is never stored (it must be given again, on purpose).
 * The form has no file fields; nothing else is worth skipping.
 *
 * Priority between the draft and wizard parameters in the URL (`?category=…&usterka=…`):
 *   1. No draft → the URL prefill (as before).
 *   2. A draft that agrees with the URL (every URL value is already in it — the usual case
 *      after a refresh, the URL keeps its query) → the draft, whatever its age.
 *   3. A draft that disagrees with the URL (a new trip from the wizard) → the draft while it
 *      is fresh (≤ 1 h: the client is still on the same request), the URL when it is older
 *      (the client most likely starts something new; the old draft is dropped).
 *   4. No URL parameters → the draft, up to DRAFT_MAX_AGE_MS.
 * An "empty" draft (nothing beyond what the URL prefilled, step 1) is never written, so it
 * can never win over the URL.
 */
import { isDeviceCategory, type RepairFormState, type WizardPrefill } from "./contract";
import type { StepNo } from "./repair-form";

export const DRAFT_VERSION = 1;
export const DRAFT_KEY = `pk-tech-zgloszenie-szkic:v${DRAFT_VERSION}`;
/** Debounce of the autosave. */
export const DRAFT_SAVE_DELAY_MS = 400;
/** A draft that disagrees with the URL wins only while it is this fresh. */
export const DRAFT_URL_PRIORITY_MS = 60 * 60 * 1000;
/** Hard limit of any draft (sessionStorage usually dies earlier, with the tab). */
export const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type DraftForm = Omit<RepairFormState, "consent">;
export type RepairDraft = {
  v: typeof DRAFT_VERSION;
  savedAt: number;
  step: StepNo;
  maxStep: StepNo;
  /** The client picked the pick-up point by hand (otherwise it follows the drop-off). */
  pickupTouched: boolean;
  form: DraftForm;
};

/** Fields recomputed by the form itself from other fields — they never make a draft "non-empty". */
const DERIVED: ReadonlySet<keyof RepairFormState> = new Set<keyof RepairFormState>(["consent", "pickupPoint", "courierPoint"]);

const isStep = (v: unknown): v is StepNo => v === 1 || v === 2 || v === 3 || v === 4 || v === 5;

export function toDraftForm(f: RepairFormState): DraftForm {
  const rest: Partial<RepairFormState> = { ...f };
  delete rest.consent;
  return rest as DraftForm;
}

/** The form holds nothing beyond `base` (empty form + URL prefill), ignoring derived fields. */
export function isFormPristine(f: RepairFormState, base: RepairFormState): boolean {
  return (Object.keys(base) as (keyof RepairFormState)[]).every((k) => DERIVED.has(k) || f[k] === base[k]);
}

/** JSON for the storage, or null when there is nothing worth keeping (remove the key). */
export function serializeDraft(
  s: { form: RepairFormState; step: StepNo; maxStep: StepNo; pickupTouched: boolean },
  base: RepairFormState,
  now: number,
): string | null {
  if (s.maxStep === 1 && isFormPristine(s.form, base)) return null;
  const draft: RepairDraft = { v: DRAFT_VERSION, savedAt: now, step: s.step, maxStep: s.maxStep, pickupTouched: s.pickupTouched, form: toDraftForm(s.form) };
  return JSON.stringify(draft);
}

/**
 * Reads a stored draft defensively: every field is checked against the type of the empty
 * form (`template`); a wrong or unknown value falls back to the template. Returns null for
 * another version, broken JSON, a draft from the future or one older than DRAFT_MAX_AGE_MS.
 */
export function parseDraft(raw: string | null, template: RepairFormState, now: number): RepairDraft | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (d.v !== DRAFT_VERSION || typeof d.savedAt !== "number" || !d.form || typeof d.form !== "object") return null;
  const age = now - d.savedAt;
  if (age < 0 || age > DRAFT_MAX_AGE_MS) return null;
  const src = d.form as Record<string, unknown>;
  const form = toDraftForm(template) as Record<string, unknown>;
  for (const k of Object.keys(form)) {
    const want = form[k];
    const got = src[k];
    if (k === "category") form[k] = got === null || isDeviceCategory(got) ? got : null;
    else if (want === null) form[k] = typeof got === "string" || got === null ? got : null;
    else if (typeof got === typeof want) form[k] = got;
  }
  const maxStep = isStep(d.maxStep) ? d.maxStep : 1;
  const step = isStep(d.step) && d.step <= maxStep ? d.step : maxStep;
  return { v: DRAFT_VERSION, savedAt: d.savedAt, step, maxStep, pickupTouched: d.pickupTouched === true, form: form as DraftForm };
}

/** Every value from the URL is already in the draft (the description may have been extended). */
export function draftAgreesWithPrefill(form: DraftForm, prefill: WizardPrefill): boolean {
  if (prefill.category !== undefined && form.category !== prefill.category) return false;
  if (prefill.dropoff !== undefined && form.dropoff !== prefill.dropoff) return false;
  if (prefill.problem !== undefined && !form.problem.toLocaleLowerCase("pl").includes(prefill.problem.toLocaleLowerCase("pl"))) return false;
  return true;
}

export type DraftDecision = { use: "draft"; draft: RepairDraft } | { use: "url" };

/** The rule from the header: which start wins — the stored draft or the URL prefill. */
export function chooseStart(draft: RepairDraft | null, prefill: WizardPrefill, now: number): DraftDecision {
  if (!draft) return { use: "url" };
  const hasUrl = Object.keys(prefill).length > 0;
  if (!hasUrl || draftAgreesWithPrefill(draft.form, prefill)) return { use: "draft", draft };
  return now - draft.savedAt <= DRAFT_URL_PRIORITY_MS ? { use: "draft", draft } : { use: "url" };
}

/* ---------- Storage (try/catch: private mode, blocked storage, quota) ---------- */

export function readDraftRaw(): string | null {
  try {
    return window.sessionStorage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
}

export function writeDraftRaw(json: string | null): void {
  try {
    if (json === null) window.sessionStorage.removeItem(DRAFT_KEY);
    else window.sessionStorage.setItem(DRAFT_KEY, json);
  } catch {
    /* no storage — the form simply works without a draft */
  }
}

export function clearDraft(): void {
  writeDraftRaw(null);
}
