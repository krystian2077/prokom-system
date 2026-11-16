/**
 * Frontend ↔ backend contract for the public site (docs/tech/KONTRAKT-BACKEND.md, 1:1).
 * Pure types and functions: request builders, client-side validation that mirrors the
 * serializers, and DRF error mapping onto form fields. Network calls live in
 * ./requests.ts. Tested by tests/tech/contract.test.ts on the T0 fixtures.
 *
 * The backend is not changed (CLAUDE.md rule 1). When the design disagrees with this
 * file, this file wins.
 */
import { servicePoints, type PointKey, type ServicePoint } from "@/config/prokom";
import { DEVICE_CATEGORIES, HAMMER_GLASS_INTEREST } from "@/types/repair";
import { visiblePoints } from "./points";

/* ---------- Codes (KONTRAKT §1.1) ---------- */

export type DeviceCategory = (typeof DEVICE_CATEGORIES)[number]["value"];
export type HammerGlassInterest = (typeof HAMMER_GLASS_INTEREST)[number]["value"];
/** parcel_locker exists in the backend but is never offered (SPEC §8, decision 14.11). */
export type DeliveryMethod = "in_person" | "courier";
export type PreferredContact = "email" | "phone" | "sms";

export const CATEGORY_CODES: readonly DeviceCategory[] = DEVICE_CATEGORIES.map((c) => c.value);
export const isDeviceCategory = (v: unknown): v is DeviceCategory => typeof v === "string" && (CATEGORY_CODES as readonly string[]).includes(v);

/** Brand is required by the backend only for these (validate on the whole submission). */
export const BRAND_REQUIRED: ReadonlySet<DeviceCategory> = new Set<DeviceCategory>(["phone", "tablet", "smartwatch"]);

export const DELIVERY_OPTIONS: readonly { value: DeliveryMethod; label: string }[] = [
  { value: "in_person", label: "Osobiście w punkcie" },
  { value: "courier", label: "Kurier" },
];
export const RETURN_OPTIONS: readonly { value: DeliveryMethod; label: string }[] = [
  { value: "in_person", label: "Odbiór osobisty" },
  { value: "courier", label: "Kurier" },
];
/** The form offers phone, SMS and e-mail (KONTRAKT §1.1); `panel` is not offered. */
export const CONTACT_OPTIONS: readonly { value: PreferredContact; label: string }[] = [
  { value: "phone", label: "Telefon" },
  { value: "sms", label: "SMS" },
  { value: "email", label: "E-mail" },
];

export const NOTES_MAX = 2000;
export const VISUAL_MAX = 2000;
export const PROBLEM_FROM_URL_MAX = 500;

/* ---------- Requests and responses ---------- */

export type SubmitPayload = {
  client: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    preferred_contact: PreferredContact;
  };
  device: {
    category: DeviceCategory;
    brand_name: string;
    model_name: string;
    imei: string;
    problem_description: string;
    device_turns_on: boolean | null;
    visual_condition_description: string;
  };
  delivery_method: DeliveryMethod;
  return_method: DeliveryMethod;
  delivery_street: string;
  delivery_house_number: string;
  delivery_city: string;
  delivery_postal_code: string;
  delivery_country: string;
  /** null when the device has no screen film offer (laptop, PC…): the question is not asked. */
  hammer_glass_interest: HammerGlassInterest | null;
  accessory_interest: [];
  accessory_choose_for_me: false;
  accessory_wishlist: "";
  requires_data_backup: boolean;
  additional_notes: string;
};

/** 201 only (KONTRAKT §1.2). Logged-in clients get tracking_url "/client/naprawy". */
export type SubmitResponse = { repair_number: string; message: string; tracking_url?: string };

export type TrackStage = { key: "received" | "diagnostics" | "quote" | "repair" | "done" | string; label: string };
export type TrackHistoryEntry = { status: string; status_code: string; at: string | null };
export type TrackCost = { estimated: string | null; final: string | null; currency: string } | null;
export type TrackService = { name: string; address: string; phone: string; email: string; hours: string; website: string };
/** GET /repairs/track/ 200 (KONTRAKT §3, fixture track-200-received). Labels, not codes, in device.category and *_method. */
export type TrackResponse = {
  repair_number: string;
  status: string;
  status_code: string;
  stage_index: number;
  stages: TrackStage[];
  is_interrupted: boolean;
  is_finished: boolean;
  device: { name: string; brand: string; category: string };
  problem_description: string;
  created_at: string | null;
  accepted_at: string | null;
  estimated_completion_date: string | null;
  estimated_duration: string | null;
  ready_for_pickup_at: string | null;
  picked_up_at: string | null;
  completed_at: string | null;
  delivery_method: string;
  return_method: string;
  cost: TrackCost;
  history: TrackHistoryEntry[];
  service: TrackService;
};

export type InquiryPayload = { first_name: string; last_name: string; phone: string; email: string; interest: string; message: string };
export const INQUIRY_TOPICS = ["Pytanie o naprawę", "Folia Hammer Glass", "Reklamacja", "Inna sprawa"] as const;

/* ---------- Form state ---------- */

/** "rabka" | "zakopane" = in person at that point; "courier" = sent by courier. */
export type Dropoff = PointKey | "courier";

export type RepairFormState = {
  // step 1 — device and fault
  category: DeviceCategory | null;
  brand: string;
  model: string;
  imei: string;
  turnsOn: "yes" | "no" | "unknown" | null;
  problem: string;
  visualCondition: string;
  // step 2 — delivery and return
  dropoff: Dropoff | null;
  returnMethod: DeliveryMethod;
  /** Asked only for a personal pick-up with two visible points; null = same as drop-off. */
  pickupPoint: PointKey | null;
  /** Courier drop-off: the salon the parcel goes to (form only — sent as a line in additional_notes, KONTRAKT §2). */
  courierPoint: PointKey | null;
  street: string;
  houseNumber: string;
  city: string;
  postalCode: string;
  // step 3 — extras
  hammerGlass: HammerGlassInterest;
  backup: boolean;
  // step 4 — contact
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredContact: PreferredContact;
  // step 5 — summary
  notes: string;
  consent: boolean;
};

export type FormField = Exclude<keyof RepairFormState, never>;
export type FieldErrors = Partial<Record<FormField, string[]>>;

export function emptyRepairForm(): RepairFormState {
  return {
    category: null,
    brand: "",
    model: "",
    imei: "",
    turnsOn: null,
    problem: "",
    visualCondition: "",
    dropoff: null,
    returnMethod: "in_person",
    pickupPoint: null,
    courierPoint: null,
    street: "",
    houseNumber: "",
    city: "",
    postalCode: "",
    hammerGlass: "ask_later",
    backup: false,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    preferredContact: "phone",
    notes: "",
    consent: false,
  };
}

/** Step of each field (1–5) — used to jump to the step with the first error. Order = form order. */
export const FIELD_STEP: Record<FormField, 1 | 2 | 3 | 4 | 5> = {
  category: 1,
  brand: 1,
  model: 1,
  imei: 1,
  turnsOn: 1,
  problem: 1,
  visualCondition: 1,
  dropoff: 2,
  returnMethod: 2,
  pickupPoint: 2,
  courierPoint: 2,
  street: 2,
  houseNumber: 2,
  city: 2,
  postalCode: 2,
  hammerGlass: 3,
  backup: 3,
  firstName: 4,
  lastName: 4,
  email: 4,
  phone: 4,
  preferredContact: 4,
  notes: 5,
  consent: 5,
};
const FIELD_ORDER = Object.keys(FIELD_STEP) as FormField[];

export function firstErrorField(errors: FieldErrors): FormField | null {
  return FIELD_ORDER.find((f) => errors[f]?.length) ?? null;
}

const pointName = (key: PointKey) => servicePoints.find((p) => p.key === key)?.name ?? key;
const usesCourier = (f: Pick<RepairFormState, "dropoff" | "returnMethod">) => f.dropoff === "courier" || f.returnMethod === "courier";
const t = (s: string) => s.trim();

/**
 * Point lines at the start of additional_notes (KONTRAKT §2, variant A). A courier parcel
 * names its salon the same way ("Wysyłka na adres: Zakopane") — no new request fields.
 */
export function pointLines(f: Pick<RepairFormState, "dropoff" | "returnMethod" | "pickupPoint"> & { courierPoint?: PointKey | null }): string[] {
  const out: string[] = [];
  const dropPoint = f.dropoff && f.dropoff !== "courier" ? f.dropoff : null;
  if (dropPoint) out.push(`Punkt przyjęcia: ${pointName(dropPoint)}`);
  if (f.dropoff === "courier" && f.courierPoint) out.push(`Wysyłka na adres: ${pointName(f.courierPoint)}`);
  const arrives = dropPoint ?? (f.dropoff === "courier" ? f.courierPoint ?? null : null);
  if (f.returnMethod === "in_person" && f.pickupPoint && f.pickupPoint !== arrives) out.push(`Punkt odbioru: ${pointName(f.pickupPoint)}`);
  return out;
}

export function buildAdditionalNotes(f: Pick<RepairFormState, "dropoff" | "returnMethod" | "pickupPoint" | "notes"> & { courierPoint?: PointKey | null }): string {
  const head = pointLines(f).join("\n");
  const notes = t(f.notes);
  const full = head && notes ? `${head}\n\n${notes}` : head || notes;
  return full.slice(0, NOTES_MAX);
}

/** Form → POST /repairs/submit/ body (KONTRAKT §1.1). Call after validateRepairForm. */
export function buildSubmitPayload(f: RepairFormState): SubmitPayload {
  const courier = usesCourier(f);
  return {
    client: {
      first_name: t(f.firstName),
      last_name: t(f.lastName),
      email: t(f.email),
      phone: t(f.phone),
      preferred_contact: f.preferredContact,
    },
    device: {
      category: f.category ?? "other",
      brand_name: t(f.brand),
      model_name: t(f.model),
      imei: t(f.imei),
      problem_description: t(f.problem),
      device_turns_on: f.turnsOn === "yes" ? true : f.turnsOn === "no" ? false : null,
      visual_condition_description: t(f.visualCondition).slice(0, VISUAL_MAX),
    },
    delivery_method: f.dropoff === "courier" ? "courier" : "in_person",
    return_method: f.returnMethod,
    delivery_street: courier ? t(f.street) : "",
    delivery_house_number: courier ? t(f.houseNumber) : "",
    delivery_city: courier ? t(f.city) : "",
    delivery_postal_code: courier ? t(f.postalCode) : "",
    delivery_country: "Polska",
    hammer_glass_interest: f.category && BRAND_REQUIRED.has(f.category) ? f.hammerGlass : null,
    accessory_interest: [],
    accessory_choose_for_me: false,
    accessory_wishlist: "",
    requires_data_backup: f.backup,
    additional_notes: buildAdditionalNotes(f),
  };
}

/* ---------- Validation (mirrors serializers/public_submit.py) ---------- */

/** common/validators.py validate_polish_phone: strip spaces, "-", "+", leading 48 → exactly 9 digits. */
export function isValidPolishPhone(value: string): boolean {
  let cleaned = value.replace(/[\s\-+]/g, "");
  if (cleaned.startsWith("48")) cleaned = cleaned.slice(2);
  return /^\d{9}$/.test(cleaned);
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const MSG = {
  required: "To pole jest wymagane.",
  category: "Wybierz rodzaj urządzenia.",
  brand: "Dla telefonu, tabletu i smartwatcha podaj markę.",
  model: "Podaj model urządzenia (wystarczy, jak jest na pudełku albo w ustawieniach).",
  dropoff: "Wybierz, jak dostarczysz sprzęt.",
  street: "Przy wysyłce kurierem podaj adres (ulica i miasto).",
  city: "Podaj miasto.",
  email: "Podaj poprawny adres e-mail.",
  phone: "Podaj numer telefonu: 9 cyfr, np. 600 100 200.",
  notes: `Uwagi mogą mieć najwyżej ${NOTES_MAX} znaków razem z informacją o punkcie.`,
  consent: "Zaznacz zgodę, żebyśmy mogli przyjąć zgłoszenie.",
  long: (n: number) => `Najwyżej ${n} znaków.`,
} as const;

/** All errors for the whole form. Empty object = ready to send. */
export function validateRepairForm(f: RepairFormState): FieldErrors {
  const e: FieldErrors = {};
  const need = (field: FormField, ok: boolean, msg: string) => {
    if (!ok) e[field] = [msg];
  };
  // step 1
  need("category", f.category !== null, MSG.category);
  if (f.category && BRAND_REQUIRED.has(f.category)) need("brand", t(f.brand) !== "", MSG.brand);
  need("brand", t(f.brand).length <= 100 || !!e.brand, MSG.long(100));
  need("model", t(f.model) !== "", MSG.model);
  if (!e.model) need("model", t(f.model).length <= 200, MSG.long(200));
  need("imei", t(f.imei).length <= 20, MSG.long(20));
  need("problem", t(f.problem) !== "", MSG.required);
  need("visualCondition", t(f.visualCondition).length <= VISUAL_MAX, MSG.long(VISUAL_MAX));
  // step 2
  need("dropoff", f.dropoff !== null, MSG.dropoff);
  if (usesCourier(f)) {
    need("street", t(f.street) !== "", MSG.street);
    need("city", t(f.city) !== "", MSG.city);
  }
  // step 4
  need("firstName", t(f.firstName) !== "", MSG.required);
  need("lastName", t(f.lastName) !== "", MSG.required);
  if (!e.firstName) need("firstName", t(f.firstName).length <= 100, MSG.long(100));
  if (!e.lastName) need("lastName", t(f.lastName).length <= 100, MSG.long(100));
  need("email", t(f.email) !== "", MSG.required);
  if (!e.email) need("email", EMAIL_RE.test(t(f.email)), MSG.email);
  need("phone", t(f.phone) !== "", MSG.required);
  if (!e.phone) need("phone", t(f.phone).length <= 20 && isValidPolishPhone(t(f.phone)), MSG.phone);
  // step 5
  const head = pointLines(f).join("\n");
  const notesLen = head && t(f.notes) ? head.length + 2 + t(f.notes).length : head.length || t(f.notes).length;
  need("notes", notesLen <= NOTES_MAX, MSG.notes);
  need("consent", f.consent, MSG.consent);
  return e;
}

export function validateStep(step: 1 | 2 | 3 | 4 | 5, f: RepairFormState): FieldErrors {
  const all = validateRepairForm(f);
  return Object.fromEntries(Object.entries(all).filter(([k]) => FIELD_STEP[k as FormField] === step)) as FieldErrors;
}

/* ---------- DRF errors → form fields (KONTRAKT §1.3) ---------- */

const CLIENT_KEYS: Record<string, FormField> = {
  first_name: "firstName",
  last_name: "lastName",
  email: "email",
  phone: "phone",
  preferred_contact: "preferredContact",
};
const DEVICE_KEYS: Record<string, FormField> = {
  category: "category",
  brand_name: "brand",
  brand_id: "brand",
  model_name: "model",
  device_model_id: "model",
  imei: "imei",
  serial_number: "imei",
  problem_description: "problem",
  device_turns_on: "turnsOn",
  visual_condition_description: "visualCondition",
};
const TOP_KEYS: Record<string, FormField> = {
  delivery_street: "street",
  delivery_house_number: "houseNumber",
  delivery_city: "city",
  delivery_postal_code: "postalCode",
  delivery_method: "dropoff",
  return_method: "returnMethod",
  hammer_glass_interest: "hammerGlass",
  requires_data_backup: "backup",
  additional_notes: "notes",
};
/** The backend's courier message mentions parcel lockers, which we never offer (SPEC §8) — this one text is replaced. */
const DELIVERY_MSG = MSG.street;

export type MappedErrors = { fields: FieldErrors; general: string[] };

const asMessages = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((m) => (typeof m === "string" ? m : JSON.stringify(m))) : typeof v === "string" ? [v] : [];

export function mapSubmitErrors(status: number, body: unknown): MappedErrors {
  const out: MappedErrors = { fields: {}, general: [] };
  const add = (field: FormField, msgs: string[]) => {
    if (msgs.length) out.fields[field] = [...(out.fields[field] ?? []), ...msgs];
  };
  const general = (msgs: string[]) => out.general.push(...msgs);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    general([status >= 500 ? "Błąd serwera. Spróbuj za chwilę albo zadzwoń." : "Nie udało się wysłać zgłoszenia. Sprawdź dane i spróbuj ponownie."]);
    return out;
  }
  const nested = (obj: unknown, keys: Record<string, FormField>, listField: FormField | null) => {
    if (Array.isArray(obj)) {
      if (listField) add(listField, asMessages(obj));
      else general(asMessages(obj));
      return;
    }
    if (!obj || typeof obj !== "object") return general(asMessages(obj));
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (keys[k]) add(keys[k], asMessages(v));
      else general(asMessages(v));
    }
  };

  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (key === "client") nested(value, CLIENT_KEYS, null);
    // "device": [ … ] = model missing for non-phone categories (list without a field name)
    else if (key === "device") nested(value, DEVICE_KEYS, "model");
    else if (key === "delivery") add("street", asMessages(value).map(() => DELIVERY_MSG).slice(0, 1));
    else if (TOP_KEYS[key]) add(TOP_KEYS[key], asMessages(value));
    else general(asMessages(value));
  }
  return out;
}

/* ---------- Links and small helpers ---------- */

/** /track?ref=… with the number encoded (it contains slashes, KONTRAKT §1.2). Never the phone digits. */
export function trackHref(repairNumber: string, origin = ""): string {
  return `${origin}/track?ref=${encodeURIComponent(repairNumber)}`;
}

/** Last 4 digits of a phone number (the backend also trims, KONTRAKT §3). */
export function phoneLast4(phone: string): string {
  return phone.replace(/\D/g, "").slice(-4);
}

/* ---------- Wizard parameters (KONTRAKT §1.4) ---------- */

export type WizardPrefill = { category?: DeviceCategory; problem?: string; dropoff?: Dropoff };

/**
 * /zgloszenie?category=<kod>&usterka=<tekst>&punkt=rabka|zakopane&dostawa=punkt|kurier
 * Unknown values are ignored; a point is accepted only if it is visible (published, or draft mode).
 */
export function parseWizardParams(
  sp: URLSearchParams,
  opts: { draft?: boolean; points?: ServicePoint[] } = {},
): WizardPrefill {
  const out: WizardPrefill = {};
  const category = sp.get("category");
  if (isDeviceCategory(category)) out.category = category;
  const usterka = sp.get("usterka")?.trim();
  if (usterka) out.problem = usterka.slice(0, PROBLEM_FROM_URL_MAX);
  const dostawa = sp.get("dostawa");
  if (dostawa === "kurier") out.dropoff = "courier";
  else if (dostawa === null || dostawa === "punkt") {
    const punkt = sp.get("punkt");
    const visible = visiblePoints(opts.draft, opts.points);
    if (punkt && visible.some((p) => p.key === punkt)) out.dropoff = punkt as PointKey;
  }
  return out;
}

/* ---------- Inquiry (KONTRAKT §4) ---------- */

export type InquiryForm = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  topic: string;
  point: PointKey | null;
  message: string;
};

/** interest = topic and point in one text, e.g. "Pytanie o naprawę · punkt: Zakopane". */
export function buildInquiryPayload(f: InquiryForm): InquiryPayload {
  return {
    first_name: t(f.firstName),
    last_name: t(f.lastName),
    phone: t(f.phone),
    email: t(f.email),
    interest: f.point ? `${f.topic} · punkt: ${pointName(f.point)}` : f.topic,
    message: t(f.message),
  };
}
