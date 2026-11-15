/**
 * Content waiting for acceptance (SPEC §10). false = hidden in production;
 * with NEXT_PUBLIC_TECH_DRAFT=1 (staging) shown in the "do uzupełnienia" frame.
 */

/** „Twoje dane są bezpieczne” (SPEC §12.9). Text in DataSafety.tsx accepted by Krystian on 15.11.2026. */
export const DATA_SAFETY_APPROVED = true;

/** Whether a flagged block renders: accepted, or a draft preview on staging. */
export function showFlagged(approved: boolean, draft: boolean): boolean {
  return approved || draft;
}
