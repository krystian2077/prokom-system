/**
 * Typy zgłoszenia naprawy — zgodne z API backendu (public submit).
 */

export const DEVICE_CATEGORIES = [
  { value: "phone", label: "Telefon" },
  { value: "tablet", label: "Tablet" },
  { value: "smartwatch", label: "Smartwatch" },
  { value: "laptop", label: "Laptop" },
  { value: "desktop", label: "Komputer stacjonarny" },
  { value: "printer", label: "Drukarka" },
  { value: "console", label: "Konsola" },
  { value: "data_recovery", label: "Odzyskiwanie danych" },
  { value: "other", label: "Inne" },
] as const;

export const DELIVERY_METHODS = [
  { value: "in_person", label: "Osobiście w serwisie" },
  { value: "courier", label: "Kurier" },
  { value: "parcel_locker", label: "Paczkomat" },
] as const;

export const RETURN_METHODS = [
  { value: "in_person", label: "Odbiór osobisty" },
  { value: "courier", label: "Kurier" },
  { value: "parcel_locker", label: "Paczkomat" },
] as const;

export const CONTACT_PREFERENCES = [
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefon" },
  { value: "sms", label: "SMS" },
] as const;

export const HAMMER_GLASS_INTEREST = [
  { value: "yes", label: "Tak, jestem zainteresowany" },
  { value: "no", label: "Nie" },
  { value: "ask_later", label: "Zapytaj po wycenie" },
  { value: "free_with_quote", label: "Gratis przy akceptacji wyceny" },
] as const;

export interface PublicSubmitClient {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  preferred_contact?: string;
  street?: string;
  city?: string;
  postal_code?: string;
  country?: string;
}

export interface PublicSubmitDevice {
  category: string;
  brand_id?: string | null;
  brand_name?: string;
  device_model_id?: string | null;
  model_name?: string;
  serial_number?: string;
  imei?: string;
  problem_description: string;
}

export interface PublicSubmitPayload {
  client: PublicSubmitClient;
  device: PublicSubmitDevice;
  delivery_method?: string;
  return_method?: string;
  delivery_street?: string;
  delivery_house_number?: string;
  delivery_city?: string;
  delivery_postal_code?: string;
  delivery_country?: string;
  hammer_glass_interest?: string | null;
  accessory_interest?: string[];
  accessory_choose_for_me?: boolean;
}

export interface PublicSubmitResponse {
  repair_number: string;
  message: string;
  tracking_url?: string;
}
