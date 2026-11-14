/**
 * "Moje naprawy" — repairs remembered on this device (SPEC §12.6).
 * Opt-in only (the checkbox is off by default), at most 5 entries, newest first.
 * An entry is dropped 90 days after the repair ended (is_finished / is_interrupted in
 * /track — the backend has no "Wydane" status). Every read and write is wrapped in
 * try/catch (private mode, blocked storage). Nothing goes to the backend or Umami.
 */
import type { TrackResponse } from "./contract";

export const STORAGE_KEY = "pk-tech-naprawy";
export const MAX_REPAIRS = 5;
export const KEEP_AFTER_END_DAYS = 90;
export const MY_REPAIRS_EVENT = "pk-tech-naprawy";

export type SavedRepair = {
  ref: string;
  /** Last 4 phone digits — needed to ask /track again. */
  last4: string;
  device: string;
  savedAt: string; // ISO
  status: string; // last known label from the backend
  checkedAt: string; // ISO, when the status was last read
  /** ISO, set when the repair ended (finished or interrupted). */
  endedAt: string | null;
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function storage(s?: StorageLike | null): StorageLike | null {
  if (s !== undefined) return s;
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

const DAY = 86_400_000;
const isEntry = (x: unknown): x is SavedRepair =>
  !!x && typeof x === "object" && typeof (x as SavedRepair).ref === "string" && /^\d{4}$/.test((x as SavedRepair).last4 ?? "");

function expired(r: SavedRepair, now: Date): boolean {
  if (!r.endedAt) return false;
  const t = Date.parse(r.endedAt);
  return Number.isFinite(t) && now.getTime() - t > KEEP_AFTER_END_DAYS * DAY;
}

function write(list: SavedRepair[], s: StorageLike | null): boolean {
  if (!s) return false;
  try {
    if (list.length) s.setItem(STORAGE_KEY, JSON.stringify(list));
    else s.removeItem(STORAGE_KEY);
  } catch {
    return false;
  }
  try {
    if (typeof window !== "undefined") window.dispatchEvent(new Event(MY_REPAIRS_EVENT));
  } catch {
    /* no window in tests */
  }
  return true;
}

/** Reads the list, dropping broken and expired entries (and saving the cleaned list). */
export function loadRepairs(now: Date = new Date(), s?: StorageLike | null): SavedRepair[] {
  const st = storage(s);
  if (!st) return [];
  let raw: string | null = null;
  try {
    raw = st.getItem(STORAGE_KEY);
  } catch {
    return [];
  }
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    write([], st);
    return [];
  }
  const all = Array.isArray(parsed) ? parsed.filter(isEntry) : [];
  const kept = all.filter((r) => !expired(r, now)).slice(0, MAX_REPAIRS);
  if (kept.length !== (Array.isArray(parsed) ? parsed.length : 0)) write(kept, st);
  return kept;
}

/** Adds or replaces (by number) at the top; keeps at most 5. Returns false when storage is unavailable. */
export function saveRepair(entry: Omit<SavedRepair, "savedAt" | "checkedAt" | "endedAt"> & Partial<Pick<SavedRepair, "endedAt">>, now: Date = new Date(), s?: StorageLike | null): boolean {
  const st = storage(s);
  if (!st) return false;
  const iso = now.toISOString();
  const prev = loadRepairs(now, st).filter((r) => r.ref !== entry.ref);
  const item: SavedRepair = { ...entry, last4: entry.last4.slice(-4), savedAt: iso, checkedAt: iso, endedAt: entry.endedAt ?? null };
  return write([item, ...prev].slice(0, MAX_REPAIRS), st);
}

export function isSaved(ref: string, now: Date = new Date(), s?: StorageLike | null): boolean {
  return loadRepairs(now, s).some((r) => r.ref === ref);
}

export function removeRepair(ref: string, now: Date = new Date(), s?: StorageLike | null): boolean {
  const st = storage(s);
  return write(loadRepairs(now, st).filter((r) => r.ref !== ref), st);
}

export function clearRepairs(s?: StorageLike | null): boolean {
  return write([], storage(s));
}

/** When the repair ended according to /track (null while it is still in progress). */
export function endedAtFrom(res: Pick<TrackResponse, "is_finished" | "is_interrupted" | "picked_up_at" | "completed_at">, now: Date): string | null {
  if (!res.is_finished && !res.is_interrupted) return null;
  return res.picked_up_at ?? res.completed_at ?? now.toISOString();
}

/** Updates a remembered repair after a fresh /track answer (no-op when not remembered). */
export function updateFromTrack(res: TrackResponse, now: Date = new Date(), s?: StorageLike | null): boolean {
  const st = storage(s);
  const list = loadRepairs(now, st);
  const i = list.findIndex((r) => r.ref === res.repair_number);
  if (i < 0) return false;
  const cur = list[i];
  list[i] = { ...cur, status: res.status, checkedAt: now.toISOString(), endedAt: cur.endedAt ?? endedAtFrom(res, now) };
  return write(list, st);
}

export function deviceName(res: Pick<TrackResponse, "device">): string {
  return [res.device.brand, res.device.name].filter(Boolean).join(" ") || res.device.category || "Urządzenie";
}
