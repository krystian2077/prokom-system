/** Mapowanie kategorii urządzenia → „kubełek” zgodny ze specjalizacją staff (backend). */
export type DeviceSpecBucket = "phone_tablet" | "laptop_printer" | "general";

export function deviceCategoryToBucket(category: string): DeviceSpecBucket {
  if (["phone", "tablet", "smartwatch", "data_recovery"].includes(category)) return "phone_tablet";
  if (["laptop", "desktop", "printer", "console"].includes(category)) return "laptop_printer";
  return "general";
}

/** Czy specjalizacja pracownika pasuje do kategorii urządzenia (sugestia jak w backendzie). */
export function isStaffSuggestedForCategory(
  staffSpecialization: string | null | undefined,
  deviceCategory: string,
): boolean {
  const b = deviceCategoryToBucket(deviceCategory);
  if (!staffSpecialization || staffSpecialization === "general") return true;
  if (staffSpecialization === "phone_tablet") return b === "phone_tablet";
  if (staffSpecialization === "laptop_printer") return b === "laptop_printer";
  return false;
}
