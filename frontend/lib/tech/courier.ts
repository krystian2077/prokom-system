/**
 * Short "kto płaci" lines for the courier option (SPEC §12.10) — wizard and form step 2.
 * Built only from `courierService`; a `null` field means the line is not shown.
 */
import { courierService, servicePoints, type ServicePoint } from "@/config/prokom";

type Payer = "client" | "service";
const who = (p: Payer) => (p === "client" ? "na Twój koszt" : "na nasz koszt");

export function courierPaysLines(service: typeof courierService = courierService): string[] {
  const out: string[] = [];
  if (service.inboundPaidBy) out.push(`Wysyłka do serwisu ${who(service.inboundPaidBy)}`);
  if (service.returnPaidBy) out.push(`odesłanie po naprawie ${who(service.returnPaidBy)}`);
  if (service.returnIfDeclined) out.push(`odesłanie po rezygnacji ${who(service.returnIfDeclined)}`);
  return out;
}

/** One sentence, e.g. "Wysyłka do serwisu na Twój koszt, odesłanie po naprawie na nasz koszt." */
export function courierPaysText(service: typeof courierService = courierService): string | null {
  const lines = courierPaysLines(service);
  return lines.length ? `${lines.join(", ")}.` : null;
}

/** The "Jak to działa?" link appears only once the courier page is published. */
export function courierPageHref(service: typeof courierService = courierService): string | null {
  return service.published ? "/naprawa-kurierem" : null;
}

/** Points that accept courier parcels: every published point (Krystian, 15.11.2026). */
export function courierPoints(points: ServicePoint[] = servicePoints): ServicePoint[] {
  return points.filter((p) => p.published);
}

/** "Where to send" sentence for the wizard, the form and the success card; null without a published point. */
export function courierWhereText(points: ServicePoint[] = courierPoints()): string | null {
  if (!points.length) return null;
  if (points.length === 1) return `Wyślij sprzęt na adres naszego salonu: ${points[0].city}.`;
  return `Wyślij sprzęt na adres jednego z naszych salonów: ${points.map((p) => p.city).join(" lub ")}.`;
}
