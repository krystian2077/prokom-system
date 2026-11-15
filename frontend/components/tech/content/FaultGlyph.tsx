import { deviceById, sceneOf, type EffectFamily } from "@/lib/tech/wizard-data";
import { HOME_PATHS } from "../icons";

/**
 * Line icon of a wizard effect family (E1–E17, PREMIUM §4) — the same vocabulary as the
 * wizard scene, drawn as a 24 px glyph for symptom cards. Decorative (aria-hidden).
 */
const FAMILY_PATHS: Record<EffectFamily, string> = {
  E1: "M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM13 5.5l-2.5 4.5 3 2.2-2.5 5.3",
  E2: HOME_PATHS.batt,
  E3: HOME_PATHS.plug,
  E4: "M4 8h3l2-3h6l2 3h3v11H4zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
  E5: HOME_PATHS.spk,
  E6: "M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM21 6.5v4.5M21 14v2.5",
  E7: HOME_PATHS.drop,
  E8: "M12 3v8M7.5 6.5a7 7 0 1 0 9 0",
  E9: "M3 4h18v12H3zM8 20h8M12 16v4M7 12l3-3 3 3 4-4",
  E10: "M10 13.5V5a2 2 0 1 1 4 0v8.5a4 4 0 1 1-4 0zM12 9v6",
  E11: "M3.5 17a9 9 0 1 1 17 0M12 14l4-4",
  E12: "M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10",
  E13: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  E14: HOME_PATHS.help,
  E15: "M6 9V3h12v6M6 18H4v-7h16v7h-2M7 14h10v7H7z",
  E16: "M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M2 9a15 15 0 0 1 20 0M12 20h.01",
  E17: "M6 11h4M8 9v4M15 12h.01M18 10h.01M17.3 5H6.7a4 4 0 0 0-4 3.6L2 15a3 3 0 0 0 5.3 2.1L9 15h6l1.7 2.1A3 3 0 0 0 22 15l-.7-6.4A4 4 0 0 0 17.3 5z",
};

/** Effect family of a wizard fault on a wizard device; E14 (generic) when unknown. */
export function faultFamily(device: string, fault: string | null): EffectFamily {
  if (!fault) return "E14";
  try {
    return sceneOf(deviceById(device), fault).effect;
  } catch {
    return "E14";
  }
}

export function FaultGlyph({ family, size = 22 }: { family: EffectFamily; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={FAMILY_PATHS[family]} />
    </svg>
  );
}
