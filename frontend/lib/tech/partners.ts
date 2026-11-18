import { partners, type ServicePoint } from "@/config/prokom";

/** Runda 18.11 §1.5: the ALSEN badge shows only on the partner point, and only once its address is confirmed. */
export function showsAlsenBadge(pointKey: ServicePoint["key"], cfg: { pointKey: ServicePoint["key"]; pointConfirmed: boolean } = partners.alsen): boolean {
  return cfg.pointConfirmed && pointKey === cfg.pointKey;
}
