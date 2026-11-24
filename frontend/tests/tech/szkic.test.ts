/** Draft of /zgloszenie (feat/tech-szkic-formularza): serialization and the draft-vs-URL rule. */
import { describe, expect, it } from "vitest";
import { emptyRepairForm, type RepairFormState } from "@/lib/tech/contract";
import {
  DRAFT_KEY,
  DRAFT_MAX_AGE_MS,
  DRAFT_URL_PRIORITY_MS,
  chooseStart,
  isFormPristine,
  parseDraft,
  serializeDraft,
  type RepairDraft,
} from "@/lib/tech/repair-draft";

const NOW = 1_800_000_000_000;
const MIN = 60 * 1000;
const filled = (patch: Partial<RepairFormState> = {}): RepairFormState => ({
  ...emptyRepairForm(),
  category: "phone",
  brand: "Samsung",
  model: "Galaxy S23",
  problem: "Pęknięty ekran",
  dropoff: "rabka",
  pickupPoint: "rabka",
  firstName: "Jan",
  consent: true,
  ...patch,
});
const draftOf = (form: RepairFormState, savedAt = NOW, step: 1 | 2 | 3 | 4 | 5 = 2): RepairDraft =>
  parseDraft(serializeDraft({ form, step, maxStep: step, pickupTouched: false }, emptyRepairForm(), savedAt), emptyRepairForm(), savedAt)!;

describe("serializeDraft / parseDraft", () => {
  it("uses a versioned key", () => {
    expect(DRAFT_KEY).toMatch(/:v1$/);
  });

  it("round-trips the form, the step and the pick-up flag", () => {
    const json = serializeDraft({ form: filled(), step: 3, maxStep: 4, pickupTouched: true }, emptyRepairForm(), NOW)!;
    const d = parseDraft(json, emptyRepairForm(), NOW + MIN)!;
    expect(d.step).toBe(3);
    expect(d.maxStep).toBe(4);
    expect(d.pickupTouched).toBe(true);
    expect(d.form.model).toBe("Galaxy S23");
    expect(d.form.dropoff).toBe("rabka");
  });

  it("never stores the consent", () => {
    const json = serializeDraft({ form: filled({ consent: true }), step: 5, maxStep: 5, pickupTouched: false }, emptyRepairForm(), NOW)!;
    expect(json).not.toContain("consent");
    expect(parseDraft(json, emptyRepairForm(), NOW)!.form).not.toHaveProperty("consent");
  });

  it("writes nothing for a pristine form (also when only the URL prefilled it)", () => {
    const base = { ...emptyRepairForm(), category: "laptop" as const, problem: "Nie ładuje się" };
    expect(serializeDraft({ form: emptyRepairForm(), step: 1, maxStep: 1, pickupTouched: false }, emptyRepairForm(), NOW)).toBeNull();
    expect(serializeDraft({ form: { ...base, pickupPoint: "rabka" }, step: 1, maxStep: 1, pickupTouched: false }, base, NOW)).toBeNull();
    expect(serializeDraft({ form: base, step: 1, maxStep: 2, pickupTouched: false }, base, NOW)).not.toBeNull();
    expect(isFormPristine({ ...base, brand: "Dell" }, base)).toBe(false);
  });

  it("rejects broken JSON, another version, a future or too old draft", () => {
    const ok = serializeDraft({ form: filled(), step: 2, maxStep: 2, pickupTouched: false }, emptyRepairForm(), NOW)!;
    expect(parseDraft(null, emptyRepairForm(), NOW)).toBeNull();
    expect(parseDraft("{nie json", emptyRepairForm(), NOW)).toBeNull();
    expect(parseDraft(ok.replace('"v":1', '"v":2'), emptyRepairForm(), NOW)).toBeNull();
    expect(parseDraft(ok, emptyRepairForm(), NOW - MIN)).toBeNull();
    expect(parseDraft(ok, emptyRepairForm(), NOW + DRAFT_MAX_AGE_MS + 1)).toBeNull();
  });

  it("drops values of a wrong type and clamps the step", () => {
    const raw = JSON.stringify({ v: 1, savedAt: NOW, step: 5, maxStep: 2, form: { category: "drone", brand: 42, backup: "tak", model: "X1", consent: true } });
    const d = parseDraft(raw, emptyRepairForm(), NOW)!;
    expect(d.form.category).toBeNull();
    expect(d.form.brand).toBe("");
    expect(d.form.backup).toBe(false);
    expect(d.form.model).toBe("X1");
    expect(d.step).toBe(2);
    expect(d.form).not.toHaveProperty("consent");
  });
});

describe("chooseStart (draft vs wizard parameters)", () => {
  it("no draft → URL", () => {
    expect(chooseStart(null, { category: "laptop" }, NOW).use).toBe("url");
  });

  it("no URL parameters → the draft", () => {
    expect(chooseStart(draftOf(filled(), NOW - 5 * 60 * MIN), {}, NOW).use).toBe("draft");
  });

  it("refresh: the URL agrees with the draft → the draft, even when old", () => {
    const d = draftOf(filled({ problem: "Pęknięty ekran po upadku" }), NOW - 3 * 60 * MIN);
    expect(chooseStart(d, { category: "phone", problem: "pęknięty ekran", dropoff: "rabka" }, NOW).use).toBe("draft");
  });

  it("new wizard link, fresh draft (≤ 1 h) → the draft", () => {
    expect(chooseStart(draftOf(filled(), NOW - 30 * MIN), { category: "laptop" }, NOW).use).toBe("draft");
    expect(chooseStart(draftOf(filled(), NOW - DRAFT_URL_PRIORITY_MS), { category: "laptop" }, NOW).use).toBe("draft");
  });

  it("brand page link (marka, model): agrees only with the same brand and model", () => {
    const d = draftOf(filled({ brand: "Apple", model: "iPhone 15 Pro" }), NOW - 3 * 60 * MIN);
    expect(chooseStart(d, { category: "phone", brand: "apple", model: "iPhone 15 Pro" }, NOW).use).toBe("draft");
    expect(chooseStart(d, { category: "phone", brand: "Apple", model: "iPhone 13" }, NOW).use).toBe("url");
    expect(chooseStart(d, { category: "phone", brand: "Samsung" }, NOW).use).toBe("url");
  });

  it("new wizard link, draft older than 1 h → URL", () => {
    expect(chooseStart(draftOf(filled(), NOW - DRAFT_URL_PRIORITY_MS - 1), { category: "laptop" }, NOW).use).toBe("url");
  });
});
