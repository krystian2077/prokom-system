/**
 * Unconfirmed numbers and promises (SPEC §10, config/prokom.ts `claims`).
 * Production shows only confirmed claims; staging (NEXT_PUBLIC_TECH_DRAFT=1) also shows
 * unconfirmed ones, flagged `draft` so the UI draws the "do potwierdzenia" frame.
 */
import { claims, type ClaimKey } from "@/config/prokom";
import { isDraftMode } from "./points";

export type VisibleClaim = { text: string; draft: boolean };

export function claim(
  key: ClaimKey,
  draft: boolean = isDraftMode(),
  source: Record<ClaimKey, { text: string; confirmed: boolean }> = claims,
): VisibleClaim | null {
  const c = source[key];
  if (!c || !c.text) return null;
  if (c.confirmed) return { text: c.text, draft: false };
  return draft ? { text: c.text, draft: true } : null;
}
