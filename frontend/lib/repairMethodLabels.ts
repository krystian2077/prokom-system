/** Zgodne z backend/apps/common/enums.py — DeliveryMethod / ReturnMethod */

export const DELIVERY_METHOD_LABELS: Record<string, string> = {
  in_person: "Osobiście w serwisie",
  courier: "Kurier",
  parcel_locker: "Paczkomat",
};

export const RETURN_METHOD_LABELS: Record<string, string> = {
  in_person: "Odbiór osobisty",
  courier: "Kurier",
  parcel_locker: "Paczkomat",
};

export function deliveryMethodLabel(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  if (!v) return "—";
  return DELIVERY_METHOD_LABELS[v] ?? v;
}

export function returnMethodLabel(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  if (!v) return "—";
  return RETURN_METHOD_LABELS[v] ?? v;
}
