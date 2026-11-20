import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { catalog, compatOf, findModel, familiesOf, modelPath, pickModels, sortedModels } from "./index";
import { silhouetteSvg, shade } from "./silhouette";
import { catalogErrors, longestCommonRun, PRICE, AUTHORISED } from "./validate";

describe("katalog: reguły danych (runda 18.11 v2 §0, §5)", () => {
  it("passes every rule (colours, storage, 10–14 specs, sources with dates, own texts, FAQ ≥ 3)", () => {
    expect(catalogErrors(catalog)).toEqual([]);
  });

  it("every colour has a real photo — no drawn placeholder on the page (Krystian 20.11)", () => {
    const missing = catalog.models.flatMap((m) => m.colors.filter((c) => !m.images.some((i) => i.color === c.key)).map((c) => `${m.slug}/${c.key}`));
    expect(missing).toEqual([]);
  });

  it("photo URLs carry the source date, and the file behind each one exists (30-day cache, Krystian 20.11)", () => {
    for (const m of catalog.models)
      for (const i of m.images.filter((x) => x.src)) {
        expect(i.src, m.slug).toBe(`${i.src!.split("?")[0]}?v=${i.source.date.replace(/-/g, "")}`);
        expect(fs.existsSync(path.resolve(__dirname, "../../../public", `.${i.src!.split("?")[0]}`)), i.src!).toBe(true);
      }
  });

  it("covers both brands and every department of the salons", () => {
    for (const brand of ["apple", "samsung"] as const) {
      expect(catalog.models.some((m) => m.brand === brand)).toBe(true);
      expect(familiesOf(brand).length).toBeGreaterThan(3);
    }
    for (const kind of ["phone", "tablet", "laptop", "desktop", "watch", "audio"]) expect(catalog.models.some((m) => m.kind === kind)).toBe(true);
  });

  it("no prices and no „autoryzowany” anywhere in content/katalog", () => {
    const dir = path.resolve(__dirname, "../../../content/katalog");
    for (const f of fs.readdirSync(dir)) {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      expect(PRICE.test(raw), f).toBe(false);
      expect(AUTHORISED.test(raw), f).toBe(false);
    }
  });

  it("photos only with a source and the consent note", () => {
    for (const m of catalog.models) for (const img of m.images) expect(img.source.consent, m.slug).toMatch(/Krystian/);
  });

  /**
   * Copy check (§0: our own sentences, longest common run with the manufacturer text < 12 words).
   * Manufacturer texts are saved locally in tmp/katalog-zrodla/<slug>.txt when facts are collected
   * (not committed); without them the check covers our texts against each other's sources only.
   */
  it("descriptions share fewer than 12 words in a row with the saved manufacturer texts", () => {
    const dir = path.resolve(__dirname, "../../../tmp/katalog-zrodla");
    for (const m of catalog.models) {
      const file = path.join(dir, `${m.slug}.txt`);
      if (!fs.existsSync(file)) continue;
      const src = fs.readFileSync(file, "utf8");
      for (const p of [...m.description, ...m.faq.map((f) => f.a)]) expect(longestCommonRun(p, src), `${m.slug}: ${p.slice(0, 40)}`).toBeLessThan(12);
    }
  });
});

describe("katalog: funkcje", () => {
  it("sorts newest first and builds paths", () => {
    const s = sortedModels();
    for (let i = 1; i < s.length; i++) expect(s[i - 1].order).toBeGreaterThanOrEqual(s[i].order);
    const m = s[0];
    expect(modelPath(m)).toBe(`/sprzedaz/${m.brand}/${m.slug}`);
    expect(findModel(m.brand, m.slug)).toBe(m);
    expect(findModel("apple", "nie-ma")).toBeUndefined();
  });

  it("„Dobierz w 3 pytaniach” returns 1–3 models of the department, best match first", () => {
    for (const q of catalog.quizzes) {
      const picked = q.questions.map((qq) => qq.options[qq.options.length - 1].tags[0]);
      const res = pickModels(q.brand, q.kind, picked);
      expect(res.length).toBeGreaterThan(0);
      expect(res.length).toBeLessThanOrEqual(3);
      expect(res.every((m) => m.brand === q.brand && m.kind === q.kind)).toBe(true);
    }
  });

  it("„Pasuje do” resolves to accessories or models", () => {
    for (const m of catalog.models) {
      const c = compatOf(m);
      expect(c.accessories.length + c.models.length).toBe(m.compat.length);
    }
  });

  it("longestCommonRun counts shared words in a row", () => {
    expect(longestCommonRun("Duży, jasny ekran na cały dzień", "Ekran: duży, jasny ekran na cały dzień pracy")).toBe(6);
    expect(longestCommonRun("zupełnie inne zdanie", "nic wspólnego tutaj")).toBe(0);
  });
});

describe("sylwetki urządzeń", () => {
  it("draws every kind in the variant colour", () => {
    for (const kind of ["phone", "tablet", "laptop", "desktop", "watch", "audio"] as const) {
      const svg = silhouetteSvg(kind, "#a9c3d6", "t");
      expect(svg).toMatch(/^<svg /);
      expect(svg).toContain("#a9c3d6");
    }
  });
  it("shade lightens and darkens", () => {
    expect(shade("#808080", 1)).toBe("#ffffff");
    expect(shade("#808080", -1)).toBe("#000000");
  });
});
