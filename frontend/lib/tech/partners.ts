import { partners, servicePoints, type ServicePoint } from "@/config/prokom";

/** Runda 18.11 §1.5: the ALSEN badge shows only on the partner point, and only once its address is confirmed. */
export function showsAlsenBadge(pointKey: ServicePoint["key"], cfg: { pointKey: ServicePoint["key"]; pointConfirmed: boolean } = partners.alsen): boolean {
  return cfg.pointConfirmed && pointKey === cfg.pointKey;
}

/** The ALSEN partner point (address and city always from config/prokom.ts). */
export function alsenPoint(): ServicePoint {
  const point = servicePoints.find((p) => p.key === partners.alsen.pointKey);
  if (!point) throw new Error(`ALSEN partner point "${partners.alsen.pointKey}" is missing from servicePoints`);
  return point;
}