/**
 * Content waiting for acceptance (SPEC §10). false = hidden in production;
 * with NEXT_PUBLIC_TECH_DRAFT=1 (staging) shown in the "do uzupełnienia" frame.
 */

/** „Twoje dane są bezpieczne” (SPEC §12.9). TODO(krystian): set true after the service/boss accepts the text in DataSafety.tsx. */
export const DATA_SAFETY_APPROVED = false;

/** Whether a flagged block renders: accepted, or a draft preview on staging. */
export function showFlagged(approved: boolean, draft: boolean): boolean {
  return approved || draft;
}
