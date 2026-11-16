/** Network layer (KONTRAKT §1.2–§1.3, §3): statuses, timeout without resend, 429, network errors. */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { buildSubmitPayload, emptyRepairForm } from "@/lib/tech/contract";
import { SUBMIT_MESSAGES, TRACK_MESSAGES, fetchTrack, submitRepair } from "@/lib/tech/requests";
import { line } from "@/config/prokom";

const FIXTURES = path.resolve(__dirname, "../../../tests/tech/fixtures");
const fx = (name: string) => JSON.parse(fs.readFileSync(path.join(FIXTURES, `${name}.json`), "utf8"));
const reply = (status: number, body: unknown) => vi.fn(async () => new Response(typeof body === "string" ? body : JSON.stringify(body), { status })) as unknown as typeof fetch;
const payload = buildSubmitPayload({ ...emptyRepairForm(), category: "phone" });

describe("submitRepair", () => {
  it("201 → data", async () => {
    const f = fx("submit-201-phone-rabka");
    const r = await submitRepair(payload, { fetchImpl: reply(201, f.response.body) });
    expect(r).toEqual({ ok: true, data: f.response.body });
  });

  it("sends JSON to /repairs/submit/ with the client token when logged in", async () => {
    const impl = reply(201, fx("submit-201-phone-rabka").response.body);
    await submitRepair(payload, { fetchImpl: impl, token: "abc" });
    const [url, init] = (impl as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toMatch(/\/api\/v1\/repairs\/submit\/$/);
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Token abc");
    expect(JSON.parse(init.body)).toEqual(payload);
  });

  it("400 → mapped field errors", async () => {
    const r = await submitRepair(payload, { fetchImpl: reply(400, fx("submit-400-invalid-phone").response.body) });
    expect(r.ok).toBe(false);
    if (!r.ok && r.kind === "validation") expect(r.errors.fields.phone?.[0]).toMatch(/Nieprawidłowy numer/);
    else throw new Error("expected validation");
  });

  it("429 → message with the service phone from config", async () => {
    const r = await submitRepair(payload, { fetchImpl: reply(429, { detail: "Request was throttled." }) });
    expect(r).toMatchObject({ ok: false, kind: "throttled" });
    expect(SUBMIT_MESSAGES.throttled).toContain(line.phoneDisplay);
  });

  it("5xx and HTML errors → server", async () => {
    expect(await submitRepair(payload, { fetchImpl: reply(502, "<html>Bad gateway</html>") })).toMatchObject({ ok: false, kind: "server" });
    expect(await submitRepair(payload, { fetchImpl: reply(500, { detail: "x" }) })).toMatchObject({ ok: false, kind: "server" });
  });

  it("network error → network", async () => {
    const impl = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;
    expect(await submitRepair(payload, { fetchImpl: impl })).toMatchObject({ ok: false, kind: "network" });
  });

  it("no answer (broker down) → timeout after the limit, exactly one request, no resend", async () => {
    const impl = vi.fn((_url: string, init: RequestInit) => new Promise<Response>((_, reject) => {
      init.signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
    })) as unknown as typeof fetch;
    const r = await submitRepair(payload, { fetchImpl: impl, timeoutMs: 30 });
    expect(r).toMatchObject({ ok: false, kind: "timeout" });
    expect((impl as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
    expect(SUBMIT_MESSAGES.timeout).toMatch(/nie wysyłaj go ponownie/);
  });
});

describe("fetchTrack", () => {
  it("200 → data, ref encoded in the URL", async () => {
    const f = fx("track-200-received");
    const impl = reply(200, f.response.body);
    const r = await fetchTrack(" PROKOM/RMA/2/2026 ", "0234", { fetchImpl: impl });
    expect(r).toEqual({ ok: true, data: f.response.body });
    const url = String((impl as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(url).toMatch(/\/repairs\/track\/\?ref=PROKOM%2FRMA%2F2%2F2026&phone_last4=0234$/);
  });

  it("404 (unknown number or wrong phone) → one message that reveals nothing", async () => {
    for (const name of ["track-404-unknown-ref", "track-404-wrong-phone"]) {
      const r = await fetchTrack("X", "1234", { fetchImpl: reply(404, fx(name).response.body) });
      expect(r).toEqual({ ok: false, kind: "not_found", message: TRACK_MESSAGES.not_found });
    }
  });

  it("400 → invalid, 429 → throttled, 500 → server", async () => {
    expect(await fetchTrack("", "", { fetchImpl: reply(400, fx("track-400-missing-params").response.body) })).toMatchObject({ kind: "invalid" });
    expect(await fetchTrack("a", "1234", { fetchImpl: reply(429, {}) })).toMatchObject({ kind: "throttled" });
    expect(await fetchTrack("a", "1234", { fetchImpl: reply(500, {}) })).toMatchObject({ kind: "server" });
  });
});
