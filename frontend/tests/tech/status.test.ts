/** TD3 PR 3: "Moje naprawy" storage (SPEC §12.6) and the status view model (KONTRAKT §3). */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { TrackResponse } from "@/lib/tech/contract";
import { MAX_REPAIRS, STORAGE_KEY, clearRepairs, endedAtFrom, isSaved, loadRepairs, removeRepair, saveRepair, updateFromTrack } from "@/lib/tech/my-repairs";
import { detailRows, formatMoney, historyRows, routeHref, stageViews } from "@/lib/tech/track";

const FIXTURES = path.resolve(__dirname, "../../../tests/tech/fixtures");
const base: TrackResponse = JSON.parse(fs.readFileSync(path.join(FIXTURES, "track-200-received.json"), "utf8")).response.body;

function memStorage(initial: Record<string, string> = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    raw: m,
  };
}
const throwing = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceeded");
  },
  removeItem: () => {
    throw new Error("SecurityError");
  },
};
const now = new Date("2026-11-14T12:00:00Z");
const entry = (n: number) => ({ ref: `PROKOM/RMA/${n}/2026`, last4: "0234", device: "Samsung Galaxy S23", status: "Zgłoszenie przyjęte" });

describe("my-repairs storage", () => {
  it("empty storage = empty list, no section", () => {
    expect(loadRepairs(now, memStorage())).toEqual([]);
    expect(loadRepairs(now, null)).toEqual([]);
  });

  it("saves with the key from SPEC, newest first, replaces by number", () => {
    const s = memStorage();
    saveRepair(entry(1), now, s);
    saveRepair(entry(2), now, s);
    saveRepair({ ...entry(1), status: "W naprawie" }, now, s);
    const list = loadRepairs(now, s);
    expect(s.raw.has(STORAGE_KEY)).toBe(true);
    expect(list.map((r) => r.ref)).toEqual(["PROKOM/RMA/1/2026", "PROKOM/RMA/2/2026"]);
    expect(list[0].status).toBe("W naprawie");
    expect(isSaved("PROKOM/RMA/2/2026", now, s)).toBe(true);
  });

  it("keeps at most 5", () => {
    const s = memStorage();
    for (let i = 1; i <= 7; i++) saveRepair(entry(i), now, s);
    const list = loadRepairs(now, s);
    expect(list).toHaveLength(MAX_REPAIRS);
    expect(list[0].ref).toBe("PROKOM/RMA/7/2026");
    expect(list.map((r) => r.ref)).not.toContain("PROKOM/RMA/1/2026");
  });

  it("stores only the last 4 phone digits", () => {
    const s = memStorage();
    saveRepair({ ...entry(1), last4: "500100234" }, now, s);
    expect(loadRepairs(now, s)[0].last4).toBe("0234");
    expect(s.raw.get(STORAGE_KEY)).not.toContain("500100");
  });

  it("removes one and all", () => {
    const s = memStorage();
    saveRepair(entry(1), now, s);
    saveRepair(entry(2), now, s);
    removeRepair("PROKOM/RMA/1/2026", now, s);
    expect(loadRepairs(now, s).map((r) => r.ref)).toEqual(["PROKOM/RMA/2/2026"]);
    clearRepairs(s);
    expect(s.raw.has(STORAGE_KEY)).toBe(false);
  });

  it("drops entries 90 days after the repair ended", () => {
    const s = memStorage();
    saveRepair({ ...entry(1), endedAt: "2026-08-01T10:00:00Z" }, now, s); // 105 days
    saveRepair({ ...entry(2), endedAt: "2026-10-01T10:00:00Z" }, now, s); // 44 days
    saveRepair(entry(3), now, s); // in progress
    expect(loadRepairs(now, s).map((r) => r.ref)).toEqual(["PROKOM/RMA/3/2026", "PROKOM/RMA/2/2026"]);
  });

  it("broken JSON or foreign data never crash", () => {
    expect(loadRepairs(now, memStorage({ [STORAGE_KEY]: "{nie json" }))).toEqual([]);
    expect(loadRepairs(now, memStorage({ [STORAGE_KEY]: JSON.stringify([{ ref: 1 }, { ref: "A", last4: "12" }, "x"]) }))).toEqual([]);
  });

  it("blocked storage (private mode) = no data, no exception", () => {
    expect(loadRepairs(now, throwing)).toEqual([]);
    expect(saveRepair(entry(1), now, throwing)).toBe(false);
    expect(removeRepair("x", now, throwing)).toBe(false);
    expect(clearRepairs(throwing)).toBe(false);
  });

  it("updateFromTrack refreshes status and marks the end", () => {
    const s = memStorage();
    saveRepair({ ...entry(2) }, now, s);
    const later = new Date("2026-11-20T09:00:00Z");
    updateFromTrack({ ...base, status: "Odebrane", status_code: "picked_up", is_finished: true, picked_up_at: "2026-11-19T15:00:00+00:00" }, later, s);
    const r = loadRepairs(later, s)[0];
    expect(r.status).toBe("Odebrane");
    expect(r.endedAt).toBe("2026-11-19T15:00:00+00:00");
    expect(r.checkedAt).toBe(later.toISOString());
    expect(updateFromTrack({ ...base, repair_number: "INNY/1" }, later, s)).toBe(false);
  });

  it("endedAt: interrupted counts as ended, in progress does not", () => {
    expect(endedAtFrom({ is_finished: false, is_interrupted: false, picked_up_at: null, completed_at: null }, now)).toBeNull();
    expect(endedAtFrom({ is_finished: false, is_interrupted: true, picked_up_at: null, completed_at: null }, now)).toBe(now.toISOString());
  });
});

describe("status view model", () => {
  it("received: first stage current, rest todo, axis from `stages`", () => {
    const v = stageViews(base);
    expect(v.map((s) => s.label)).toEqual(["Przyjęte", "Diagnoza", "Wycena", "Naprawa", "Gotowe do odbioru"]);
    expect(v.map((s) => s.state)).toEqual(["current", "todo", "todo", "todo", "todo"]);
    expect(v[0].meta).toBe("Zgłoszenie przyjęte");
  });

  it("in repair: earlier stages done", () => {
    const v = stageViews({ ...base, stage_index: 3, status: "W naprawie", status_code: "in_repair" });
    expect(v.map((s) => s.state)).toEqual(["done", "done", "done", "current", "todo"]);
  });

  it("interrupted: axis stops on its stage, marked with the status label", () => {
    const v = stageViews({ ...base, stage_index: 2, is_interrupted: true, status: "Anulowane", status_code: "quote_rejected" });
    expect(v.map((s) => s.state)).toEqual(["done", "done", "interrupted", "todo", "todo"]);
    expect(v[2].meta).toBe("Anulowane");
  });

  it("finished: all done", () => {
    const v = stageViews({ ...base, stage_index: 4, is_finished: true, status: "Odebrane", status_code: "picked_up" });
    expect(v.every((s) => s.state === "done")).toBe(true);
  });

  it("details skip empty rows; cost only when returned", () => {
    const rows = detailRows(base);
    const keys = rows.map((r) => r.k);
    expect(keys).toEqual(["Urządzenie", "Zgłoszony problem", "Zgłoszono", "Dostarczenie", "Zwrot"]);
    expect(rows.every((r) => r.v && r.v !== "—")).toBe(true);
    expect(rows[0].v).toBe("Telefon · Samsung Galaxy S23");
    const withCost = detailRows({ ...base, cost: { estimated: "150.00", final: null, currency: "PLN" } });
    expect(withCost.find((r) => r.k === "Koszt szacunkowy")?.v).toBe("150,00 zł");
    expect(withCost.find((r) => r.k === "Koszt końcowy")).toBeUndefined();
  });

  it("history newest first with backend labels", () => {
    const h = historyRows({
      ...base,
      history: [
        { status: "Zgłoszenie przyjęte", status_code: "new", at: "2026-11-14T09:40:00+00:00" },
        { status: "W Diagnostyce", status_code: "diagnosing", at: "2026-11-14T10:55:00+00:00" },
      ],
    });
    expect(h.map((x) => x.label)).toEqual(["W Diagnostyce", "Zgłoszenie przyjęte"]);
    expect(h[0].current).toBe(true);
  });

  it("money and route helpers", () => {
    expect(formatMoney(null)).toBeNull();
    expect(formatMoney("1200.5")).toBe("1200,50 zł".replace("1200", (1200).toLocaleString("pl-PL")));
    expect(routeHref("34-700 Rabka-Zdrój, ul. Orkana 16B")).toMatch(/^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=/);
    expect(routeHref(" ")).toBeNull();
  });
});
