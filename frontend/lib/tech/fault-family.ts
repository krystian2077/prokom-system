import { deviceById, sceneOf, type EffectFamily } from "./wizard-data";

/** Effect family (E1–E17) of a wizard fault on a wizard device; E14 (generic) when unknown. */
export function faultFamily(device: string, fault: string | null): EffectFamily {
  if (!fault) return "E14";
  return sceneOf(deviceById(device), fault)?.effect ?? "E14";
}
