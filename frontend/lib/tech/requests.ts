/**
 * Network calls of the public site (KONTRAKT §1, §3). `fetch(`${API_V1}/…`)` as SPEC §3
 * allows — lib/api.ts is not changed; it has a fixed 90 s timeout and turns DRF errors
 * into one string, while the form needs the raw body and its own timeout.
 */
import { line } from "@/config/prokom";
import { API_V1 } from "@/lib/api";
import { mapSubmitErrors, type MappedErrors, type SubmitPayload, type SubmitResponse, type TrackResponse } from "./contract";

/** Without a broker the backend saves the repair and never answers (KONTRAKT §1.3). */
export const SUBMIT_TIMEOUT_MS = 30_000;
export const TRACK_TIMEOUT_MS = 20_000;

export type SubmitResult =
  | { ok: true; data: SubmitResponse }
  | { ok: false; kind: "validation"; errors: MappedErrors }
  | { ok: false; kind: "throttled" | "server" | "network" | "timeout"; message: string };

export const SUBMIT_MESSAGES = {
  throttled: `Zbyt wiele zgłoszeń z tego urządzenia. Zadzwoń: ${line.phoneDisplay}`,
  // The repair may already be saved — never resend automatically (it would create a duplicate).
  timeout: `Nie mamy potwierdzenia. Zgłoszenie mogło zostać zapisane — nie wysyłaj go ponownie, tylko zadzwoń: ${line.phoneDisplay}`,
  network: `Brak połączenia z serwisem. Sprawdź internet i spróbuj ponownie albo zadzwoń: ${line.phoneDisplay}`,
  server: `Coś poszło nie tak po naszej stronie. Spróbuj za chwilę albo zadzwoń: ${line.phoneDisplay}`,
} as const;

type FetchLike = typeof fetch;

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function withTimeout(url: string, init: RequestInit, ms: number, fetchImpl: FetchLike): Promise<Response | "timeout" | "network"> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } catch (err) {
    return err instanceof Error && err.name === "AbortError" ? "timeout" : "network";
  } finally {
    clearTimeout(timer);
  }
}

export async function submitRepair(
  payload: SubmitPayload,
  opts: { token?: string | null; timeoutMs?: number; fetchImpl?: FetchLike } = {},
): Promise<SubmitResult> {
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  if (opts.token) headers.Authorization = `Token ${opts.token}`;
  const res = await withTimeout(
    `${API_V1}/repairs/submit/`,
    { method: "POST", headers, body: JSON.stringify(payload) },
    opts.timeoutMs ?? SUBMIT_TIMEOUT_MS,
    opts.fetchImpl ?? fetch,
  );
  if (res === "timeout") return { ok: false, kind: "timeout", message: SUBMIT_MESSAGES.timeout };
  if (res === "network") return { ok: false, kind: "network", message: SUBMIT_MESSAGES.network };
  const body = await readJson(res);
  if (res.status === 201 && body && typeof body === "object" && typeof (body as SubmitResponse).repair_number === "string") {
    return { ok: true, data: body as SubmitResponse };
  }
  if (res.status === 429) return { ok: false, kind: "throttled", message: SUBMIT_MESSAGES.throttled };
  if (res.status === 400) return { ok: false, kind: "validation", errors: mapSubmitErrors(400, body) };
  return { ok: false, kind: "server", message: SUBMIT_MESSAGES.server };
}

export type TrackResult =
  | { ok: true; data: TrackResponse }
  | { ok: false; kind: "not_found" | "invalid" | "throttled" | "server" | "network" | "timeout"; message: string };

export const TRACK_MESSAGES = {
  not_found: "Nie znaleźliśmy zgłoszenia. Sprawdź numer i 4 ostatnie cyfry telefonu podanego w zgłoszeniu.",
  invalid: "Podaj numer zgłoszenia i 4 ostatnie cyfry telefonu.",
  throttled: `Zbyt wiele sprawdzeń z tego urządzenia. Spróbuj za godzinę albo zadzwoń: ${line.phoneDisplay}`,
  server: `Nie udało się sprawdzić statusu. Spróbuj za chwilę albo zadzwoń: ${line.phoneDisplay}`,
  network: `Brak połączenia z serwisem. Sprawdź internet i spróbuj ponownie.`,
  timeout: `Serwis nie odpowiada. Spróbuj za chwilę albo zadzwoń: ${line.phoneDisplay}`,
} as const;

/** GET /repairs/track/?ref=…&phone_last4=… (KONTRAKT §3). 404 = unknown number OR wrong phone. */
export async function fetchTrack(ref: string, last4: string, opts: { timeoutMs?: number; fetchImpl?: FetchLike } = {}): Promise<TrackResult> {
  const url = `${API_V1}/repairs/track/?ref=${encodeURIComponent(ref.trim())}&phone_last4=${encodeURIComponent(last4.trim())}`;
  const res = await withTimeout(url, { method: "GET", headers: { Accept: "application/json" } }, opts.timeoutMs ?? TRACK_TIMEOUT_MS, opts.fetchImpl ?? fetch);
  if (res === "timeout" || res === "network") return { ok: false, kind: res, message: TRACK_MESSAGES[res] };
  const body = await readJson(res);
  if (res.ok && body && typeof body === "object" && Array.isArray((body as TrackResponse).stages)) return { ok: true, data: body as TrackResponse };
  if (res.status === 404) return { ok: false, kind: "not_found", message: TRACK_MESSAGES.not_found };
  if (res.status === 400) return { ok: false, kind: "invalid", message: TRACK_MESSAGES.invalid };
  if (res.status === 429) return { ok: false, kind: "throttled", message: TRACK_MESSAGES.throttled };
  return { ok: false, kind: "server", message: TRACK_MESSAGES.server };
}
