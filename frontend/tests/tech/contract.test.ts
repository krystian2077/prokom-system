/**
 * Contract test (docs/tech/KONTRAKT-BACKEND.md §6): request builders and DRF error
 * mapping against the real responses recorded in T0 (tests/tech/fixtures, repo root).
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DEVICE_CATEGORIES } from "@/types/repair";
import { servicePoints, type ServicePoint } from "@/config/prokom";
import {
  BRAND_REQUIRED,
  DELIVERY_OPTIONS,
  FIELD_STEP,
  INQUIRY_TOPICS,
  RETURN_OPTIONS,
  buildInquiryPayload,
  buildSubmitPayload,
  emptyRepairForm,
  firstErrorField,
  isValidPolishPhone,
  mapSubmitErrors,
  parseWizardParams,
  phoneLast4,
  trackHref,
  validateRepairForm,
  validateStep,
  type RepairFormState,
  type SubmitResponse,
  type TrackResponse,
} from "@/lib/tech/contract";

const FIXTURES = path.resolve(__dirname, "../../../tests/tech/fixtures");
type Fixture = { request: { method: string; path: string; body: unknown }; response: { status: number; body: unknown } };
const fx = (name: string): Fixture => JSON.parse(fs.readFileSync(path.join(FIXTURES, `${name}.json`), "utf8"));

/** Form state that produces the T0 phone fixture request. */
function phoneForm(over: Partial<RepairFormState> = {}): RepairFormState {
  return {
    ...emptyRepairForm(),
    category: "phone",
    brand: "Samsung",
    model: "Galaxy S23",
    problem: "Pęknięty ekran po upadku.",
    turnsOn: "yes",
    dropoff: "rabka",
    returnMethod: "in_person",
    firstName: "Jan",
    lastName: "Testowy",
    email: "jan.testowy@example.com",
    phone: "+48 500 100 234",
    preferredContact: "phone",
    notes: "Proszę o kontakt po 16.",
    consent: true,
    ...over,
  };
}

describe("fixtures are present", () => {
  it("has every response shape from KONTRAKT §1.3, §3, §4", () => {
    const names = fs.readdirSync(FIXTURES).map((f) => f.replace(/\.json$/, ""));
    expect(names).toEqual(
      expect.arrayContaining([
        "submit-201-phone-rabka",
        "submit-201-laptop-courier",
        "submit-400-missing-required",
        "submit-400-invalid-phone",
        "submit-400-invalid-email",
        "submit-400-brand-required",
        "submit-400-model-required-phone",
        "submit-400-model-required-laptop",
        "submit-400-courier-no-address",
        "submit-400-invalid-category",
        "submit-400-invalid-hammer-glass",
        "track-200-received",
        "track-400-missing-params",
        "track-404-unknown-ref",
        "track-404-wrong-phone",
        "inquiry-200",
        "inquiry-400-missing-email",
      ]),
    );
  });
});

describe("buildSubmitPayload (KONTRAKT §1.1, §2)", () => {
  it("phone in Rabka = the T0 request (fixture submit-201-phone-rabka)", () => {
    const payload = buildSubmitPayload(phoneForm());
    expect(payload).toMatchObject(fx("submit-201-phone-rabka").request.body as object);
  });

  it("laptop by courier with an address = the T0 request (fixture submit-201-laptop-courier)", () => {
    const payload = buildSubmitPayload(
      phoneForm({
        category: "laptop",
        brand: "Lenovo",
        model: "ThinkPad T14",
        problem: "Nie ładuje się bateria.",
        turnsOn: "unknown",
        dropoff: "courier",
        returnMethod: "courier",
        street: "ul. Przykładowa",
        houseNumber: "1",
        city: "Nowy Targ",
        postalCode: "34-400",
        notes: "",
      }),
    );
    // the fixture predates the audit fix: a laptop gets no screen film question → null (KONTRAKT §1.1 allows null)
    expect(payload).toMatchObject({ ...(fx("submit-201-laptop-courier").request.body as object), hammer_glass_interest: null });
    expect(payload.additional_notes).toBe("");
  });

  it.each(DEVICE_CATEGORIES.map((c) => c.value))("builds a valid request for category %s", (category) => {
    const form = phoneForm({ category, brand: BRAND_REQUIRED.has(category) ? "Marka" : "", model: "Model X" });
    expect(validateRepairForm(form)).toEqual({});
    const p = buildSubmitPayload(form);
    expect(p.device.category).toBe(category);
    expect(p.device.model_name).toBe("Model X");
    expect(p.client).toMatchObject({ first_name: "Jan", last_name: "Testowy", email: "jan.testowy@example.com", phone: "+48 500 100 234" });
    expect(p.device.problem_description).toBeTruthy();
  });

  it("puts Zakopane as the drop-off point in additional_notes, then a blank line and the notes", () => {
    const p = buildSubmitPayload(phoneForm({ dropoff: "zakopane", pickupPoint: "zakopane" }));
    expect(p.delivery_method).toBe("in_person");
    expect(p.additional_notes).toBe("Punkt przyjęcia: Zakopane\n\nProszę o kontakt po 16.");
  });

  it("adds a pick-up point line only when it differs from the drop-off point", () => {
    const p = buildSubmitPayload(phoneForm({ dropoff: "zakopane", pickupPoint: "rabka" }));
    expect(p.additional_notes).toBe("Punkt przyjęcia: Zakopane\nPunkt odbioru: Rabka-Zdrój\n\nProszę o kontakt po 16.");
    const same = buildSubmitPayload(phoneForm({ dropoff: "rabka", pickupPoint: "rabka" }));
    expect(same.additional_notes).not.toContain("Punkt odbioru");
  });

  it("courier in, personal pick-up: tells which point the client collects from", () => {
    const p = buildSubmitPayload(phoneForm({ dropoff: "courier", returnMethod: "in_person", pickupPoint: "rabka", street: "ul. A", city: "B", notes: "" }));
    expect(p.delivery_method).toBe("courier");
    expect(p.additional_notes).toBe("Punkt odbioru: Rabka-Zdrój");
  });

  it("courier with a chosen salon: same request shape as the T0 fixture, salon only in additional_notes (15.11)", () => {
    const base = phoneForm({ category: "laptop", brand: "Lenovo", model: "ThinkPad T14", problem: "Nie ładuje się bateria.", turnsOn: "unknown", dropoff: "courier", returnMethod: "courier", street: "ul. Przykładowa", houseNumber: "1", city: "Nowy Targ", postalCode: "34-400", notes: "Proszę o telefon." });
    const withSalon = buildSubmitPayload({ ...base, courierPoint: "zakopane" });
    const fixture = fx("submit-201-laptop-courier").request.body as Record<string, unknown>;
    const keys = (o: object): string[] => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? keys(v).map((x) => `${k}.${x}`) : [k])).sort();
    // exactly the keys of today's courier request (no new fields), and still the T0 fixture
    expect(keys(withSalon)).toEqual(keys(buildSubmitPayload(base)));
    expect(withSalon).toMatchObject({ ...fixture, additional_notes: withSalon.additional_notes, hammer_glass_interest: null });
    expect(withSalon).toMatchObject({ delivery_method: "courier", return_method: "courier", delivery_street: "ul. Przykładowa", delivery_city: "Nowy Targ" });
    expect(withSalon.additional_notes).toBe("Wysyłka na adres: Zakopane\n\nProszę o telefon.");
    expect(validateRepairForm({ ...base, courierPoint: "zakopane" })).toEqual({});
    // drop-off in a salon never adds the courier line, even if a stale courierPoint is left in the state
    expect(buildSubmitPayload(phoneForm({ dropoff: "rabka", courierPoint: "zakopane", notes: "" })).additional_notes).toBe("Punkt przyjęcia: Rabka-Zdrój");
  });

  it("courier pickup in the salon the parcel went to adds no second point line", () => {
    const p = buildSubmitPayload(phoneForm({ dropoff: "courier", courierPoint: "rabka", returnMethod: "in_person", pickupPoint: "rabka", street: "ul. A", city: "B", notes: "" }));
    expect(p.additional_notes).toBe("Wysyłka na adres: Rabka-Zdrój");
  });

  it("no point lines and no notes = empty additional_notes", () => {
    const p = buildSubmitPayload(phoneForm({ dropoff: "courier", returnMethod: "courier", street: "ul. A", city: "B", notes: "  " }));
    expect(p.additional_notes).toBe("");
  });

  it("keeps additional_notes within 2000 characters including the point lines", () => {
    const p = buildSubmitPayload(phoneForm({ dropoff: "zakopane", pickupPoint: "rabka", notes: "x".repeat(5000) }));
    expect(p.additional_notes.length).toBe(2000);
    expect(p.additional_notes.startsWith("Punkt przyjęcia: Zakopane\nPunkt odbioru: Rabka-Zdrój\n\n")).toBe(true);
  });

  it("sends the courier address only when a courier is involved", () => {
    const inPerson = buildSubmitPayload(phoneForm({ street: "ul. A", city: "B" }));
    expect(inPerson.delivery_street).toBe("");
    expect(inPerson.delivery_city).toBe("");
    const back = buildSubmitPayload(phoneForm({ returnMethod: "courier", street: "ul. A", houseNumber: "2", city: "B", postalCode: "34-700" }));
    expect(back).toMatchObject({ delivery_method: "in_person", return_method: "courier", delivery_street: "ul. A", delivery_house_number: "2", delivery_city: "B", delivery_postal_code: "34-700", delivery_country: "Polska" });
  });

  it("never offers parcel_locker", () => {
    expect(DELIVERY_OPTIONS.map((o) => o.value)).not.toContain("parcel_locker");
    expect(RETURN_OPTIONS.map((o) => o.value)).not.toContain("parcel_locker");
    const all = [phoneForm(), phoneForm({ dropoff: "courier", returnMethod: "courier", street: "a", city: "b" })].map(buildSubmitPayload);
    for (const p of all) {
      expect(JSON.stringify(p)).not.toMatch(/parcel_locker/);
    }
  });

  it("accessory fields are always empty (shop removed)", () => {
    const p = buildSubmitPayload(phoneForm());
    expect(p.accessory_interest).toEqual([]);
    expect(p.accessory_choose_for_me).toBe(false);
    expect(p.accessory_wishlist).toBe("");
  });

  it("maps device_turns_on yes/no/unknown to true/false/null", () => {
    expect(buildSubmitPayload(phoneForm({ turnsOn: "yes" })).device.device_turns_on).toBe(true);
    expect(buildSubmitPayload(phoneForm({ turnsOn: "no" })).device.device_turns_on).toBe(false);
    expect(buildSubmitPayload(phoneForm({ turnsOn: "unknown" })).device.device_turns_on).toBeNull();
    expect(buildSubmitPayload(phoneForm({ turnsOn: null })).device.device_turns_on).toBeNull();
  });

  it("passes hammer glass, backup, contact preference, IMEI and visual condition", () => {
    const p = buildSubmitPayload(phoneForm({ hammerGlass: "yes", backup: true, preferredContact: "sms", imei: " 356938035643809 ", visualCondition: "Rysa na ramce" }));
    expect(p.hammer_glass_interest).toBe("yes");
    expect(p.requires_data_backup).toBe(true);
    expect(p.client.preferred_contact).toBe("sms");
    expect(p.device.imei).toBe("356938035643809");
    expect(p.device.visual_condition_description).toBe("Rysa na ramce");
  });

  it("trims text fields", () => {
    const p = buildSubmitPayload(phoneForm({ firstName: "  Jan ", model: " S23 ", problem: "  ekran  " }));
    expect(p.client.first_name).toBe("Jan");
    expect(p.device.model_name).toBe("S23");
    expect(p.device.problem_description).toBe("ekran");
  });
});

describe("client-side validation mirrors the backend", () => {
  it("required fields (fixture submit-400-missing-required has the same set)", () => {
    const errors = validateRepairForm({ ...emptyRepairForm(), category: null });
    const backend = mapSubmitErrors(400, fx("submit-400-missing-required").response.body).fields;
    for (const field of Object.keys(backend)) expect(errors).toHaveProperty(field);
    expect(errors).toHaveProperty("model");
    expect(errors).toHaveProperty("consent");
  });

  it("brand is required only for phone, tablet and smartwatch", () => {
    expect(Array.from(BRAND_REQUIRED).sort()).toEqual(["phone", "smartwatch", "tablet"]);
    expect(validateRepairForm(phoneForm({ brand: "" }))).toHaveProperty("brand");
    expect(validateRepairForm(phoneForm({ category: "laptop", brand: "" }))).not.toHaveProperty("brand");
  });

  it("model is required for every category", () => {
    for (const c of DEVICE_CATEGORIES) expect(validateRepairForm(phoneForm({ category: c.value, model: " " }))).toHaveProperty("model");
  });

  it("courier needs street and city", () => {
    const e = validateRepairForm(phoneForm({ dropoff: "courier" }));
    expect(e).toHaveProperty("street");
    expect(e).toHaveProperty("city");
    expect(validateRepairForm(phoneForm({ returnMethod: "courier" }))).toHaveProperty("street");
    expect(validateRepairForm(phoneForm({ dropoff: "courier", street: "ul. A", city: "B" }))).toEqual({});
  });

  it("phone format = validate_polish_phone", () => {
    for (const ok of ["123456789", "+48123456789", "+48 123 456 789", "48123456789", "123-456-789"]) expect(isValidPolishPhone(ok)).toBe(true);
    for (const bad of ["12345", "1234567890", "+49 123 456 789", "12345678a", ""]) expect(isValidPolishPhone(bad)).toBe(false);
  });

  it("e-mail format", () => {
    expect(validateRepairForm(phoneForm({ email: "to-nie-email" }))).toHaveProperty("email");
  });

  it("additional_notes over the limit is caught before sending", () => {
    expect(validateRepairForm(phoneForm({ notes: "x".repeat(2001) }))).toHaveProperty("notes");
  });

  it("validateStep checks only the fields of that step", () => {
    const empty = { ...emptyRepairForm(), category: null };
    const s1 = Object.keys(validateStep(1, empty));
    expect(s1.length).toBeGreaterThan(0);
    for (const f of s1) expect(FIELD_STEP[f as keyof typeof FIELD_STEP]).toBe(1);
    expect(validateStep(1, phoneForm())).toEqual({});
    expect(Object.keys(validateStep(4, empty)).every((f) => FIELD_STEP[f as keyof typeof FIELD_STEP] === 4)).toBe(true);
  });
});

describe("mapSubmitErrors (KONTRAKT §1.3)", () => {
  const map = (name: string) => {
    const f = fx(name);
    return mapSubmitErrors(f.response.status, f.response.body);
  };

  it("missing required fields → each form field", () => {
    const r = map("submit-400-missing-required");
    expect(Object.keys(r.fields).sort()).toEqual(["category", "email", "firstName", "lastName", "phone", "problem"]);
    expect(r.fields.firstName).toEqual(["To pole jest wymagane."]);
    expect(r.general).toEqual([]);
  });

  it("invalid phone and e-mail → phone, email (backend text verbatim)", () => {
    expect(map("submit-400-invalid-phone").fields).toEqual({ phone: ["Nieprawidłowy numer telefonu. Użyj formatu: 123456789 lub +48 123 456 789"] });
    expect(map("submit-400-invalid-email").fields).toEqual({ email: ["Podaj poprawny adres e-mail."] });
  });

  it("brand nested under device → brand", () => {
    expect(map("submit-400-brand-required").fields).toEqual({ brand: ["Dla telefonu/tabletu/smartwatcha podaj markę urządzenia."] });
  });

  it("model for phone (nested) and for other categories (list without a field name) → model", () => {
    expect(map("submit-400-model-required-phone").fields).toEqual({ model: ["Dla telefonu/tabletu/smartwatcha podaj nazwę modelu lub wybierz z listy."] });
    expect(map("submit-400-model-required-laptop").fields).toEqual({ model: ["Podaj nazwę modelu urządzenia lub wybierz model z listy."] });
  });

  it("courier without an address → street, with the parcel-locker wording replaced (SPEC §8)", () => {
    const r = map("submit-400-courier-no-address");
    expect(Object.keys(r.fields)).toEqual(["street"]);
    expect(r.fields.street![0]).not.toMatch(/paczkomat/i);
    expect(r.fields.street![0]).toMatch(/ulica i miasto/);
  });

  it("invalid choice → category, hammerGlass", () => {
    expect(map("submit-400-invalid-category").fields).toEqual({ category: ['"drone" nie jest poprawnym wyborem.'] });
    expect(map("submit-400-invalid-hammer-glass").fields).toEqual({ hammerGlass: ['"maybe" nie jest poprawnym wyborem.'] });
  });

  it("exception in the save service → general message", () => {
    expect(mapSubmitErrors(400, { detail: "Coś poszło nie tak" })).toEqual({ fields: {}, general: ["Coś poszło nie tak"] });
  });

  it("unknown keys and odd shapes never crash and never disappear", () => {
    expect(mapSubmitErrors(400, { nowe_pole: ["Błąd X"] }).general).toEqual(["Błąd X"]);
    expect(mapSubmitErrors(400, { non_field_errors: ["Ogólny"] }).general).toEqual(["Ogólny"]);
    expect(mapSubmitErrors(400, { device: { nieznane: ["Y"] } }).general).toEqual(["Y"]);
    expect(mapSubmitErrors(400, null).general.length).toBe(1);
    expect(mapSubmitErrors(400, "<html>").general.length).toBe(1);
  });

  it("maps the courier address fields and the rest of the payload", () => {
    const r = mapSubmitErrors(400, {
      delivery_city: ["c"],
      delivery_postal_code: ["p"],
      delivery_house_number: ["h"],
      delivery_method: ["d"],
      return_method: ["r"],
      additional_notes: ["n"],
      requires_data_backup: ["b"],
      device: { imei: ["i"], device_turns_on: ["t"], visual_condition_description: ["v"], problem_description: ["pd"] },
      client: { preferred_contact: ["pc"] },
    });
    expect(r.fields).toEqual({
      city: ["c"],
      postalCode: ["p"],
      houseNumber: ["h"],
      dropoff: ["d"],
      returnMethod: ["r"],
      notes: ["n"],
      backup: ["b"],
      imei: ["i"],
      turnsOn: ["t"],
      visualCondition: ["v"],
      problem: ["pd"],
      preferredContact: ["pc"],
    });
  });

  it("first error follows the form order (scroll target)", () => {
    expect(firstErrorField({ phone: ["x"], category: ["y"] })).toBe("category");
    expect(firstErrorField({ street: ["x"], email: ["y"] })).toBe("street");
    expect(firstErrorField({})).toBeNull();
  });
});

describe("201 response (KONTRAKT §1.2)", () => {
  it("has a repair number with slashes, encoded in the track link", () => {
    const body = fx("submit-201-phone-rabka").response.body as SubmitResponse;
    expect(body.repair_number).toBe("PROKOM/RMA/2/2026");
    expect(trackHref(body.repair_number)).toBe("/track?ref=PROKOM%2FRMA%2F2%2F2026");
    expect(trackHref(body.repair_number, "https://prokomserwis.pl")).toBe("https://prokomserwis.pl/track?ref=PROKOM%2FRMA%2F2%2F2026");
  });
});

describe("track (KONTRAKT §3)", () => {
  it("fixture shape matches TrackResponse", () => {
    const body = fx("track-200-received").response.body as TrackResponse;
    expect(body.stages.map((s) => s.key)).toEqual(["received", "diagnostics", "quote", "repair", "done"]);
    expect(body.stages[body.stage_index].label).toBe("Przyjęte");
    expect(body.cost).toBeNull();
    expect(body.service.address).toBeTruthy();
  });

  it("phoneLast4 keeps the last 4 digits", () => {
    expect(phoneLast4("+48 500 100 234")).toBe("0234");
    expect(phoneLast4("0234")).toBe("0234");
    expect(phoneLast4("12")).toBe("12");
  });
});

describe("wizard parameters (KONTRAKT §1.4)", () => {
  const draftOff = { draft: false };
  it("reads category, usterka, punkt, dostawa", () => {
    expect(parseWizardParams(new URLSearchParams("category=laptop&usterka=Nie%20%C5%82aduje&punkt=rabka&dostawa=punkt"), draftOff)).toEqual({
      category: "laptop",
      problem: "Nie ładuje",
      dropoff: "rabka",
    });
  });
  it("dostawa=kurier sets courier and ignores punkt", () => {
    expect(parseWizardParams(new URLSearchParams("category=phone&dostawa=kurier&punkt=rabka"), draftOff)).toEqual({ category: "phone", dropoff: "courier" });
  });
  it("ignores unknown values and unpublished points (without draft)", () => {
    expect(parseWizardParams(new URLSearchParams("category=drone&punkt=krakow&dostawa=paczkomat&x=1"), draftOff)).toEqual({});
    const unpublished: ServicePoint[] = servicePoints.map((p) => (p.key === "zakopane" ? { ...p, published: false } : p));
    expect(parseWizardParams(new URLSearchParams("punkt=zakopane"), { draft: false, points: unpublished })).toEqual({});
    expect(parseWizardParams(new URLSearchParams("punkt=zakopane"), { draft: true, points: unpublished })).toEqual({ dropoff: "zakopane" });
  });
  it("real config: both published points are accepted (Zakopane published 15.11.2026)", () => {
    expect(parseWizardParams(new URLSearchParams("punkt=zakopane"), draftOff)).toEqual({ dropoff: "zakopane" });
    expect(parseWizardParams(new URLSearchParams("punkt=rabka"), draftOff)).toEqual({ dropoff: "rabka" });
  });
  it("caps a long usterka and ignores an empty one", () => {
    expect(parseWizardParams(new URLSearchParams(`usterka=${"a".repeat(3000)}`), draftOff).problem?.length).toBe(500);
    expect(parseWizardParams(new URLSearchParams("usterka=%20%20"), draftOff)).toEqual({});
  });
});

describe("buildInquiryPayload (KONTRAKT §4)", () => {
  it("= the T0 request (fixture inquiry-200)", () => {
    const p = buildInquiryPayload({ firstName: "Anna", lastName: "Przykładowa", phone: "", email: "anna@example.com", topic: "Pytanie o naprawę", point: "rabka", message: "Ile trwa wymiana baterii w iPhone 12?" });
    expect(p).toEqual(fx("inquiry-200").request.body);
  });
  it("topic without a point", () => {
    expect(buildInquiryPayload({ firstName: "", lastName: "", phone: "", email: "a@b.pl", topic: "Reklamacja", point: null, message: "x" }).interest).toBe("Reklamacja");
  });
  it("topics from the design", () => {
    expect(INQUIRY_TOPICS).toEqual(["Pytanie o naprawę", "Folia Hammer Glass", "Reklamacja", "Inna sprawa"]);
  });
});
