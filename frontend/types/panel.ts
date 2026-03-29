/**
 * Typy panelu klienta PRO-KOM (dark) — zgodne ze specyfikacją.
 * Dane z API mapowane przez adaptery (apiRepairToPanel itd.).
 */

// ─── KLIENT ───
export type PreferredContact = "email" | "telefon" | "sms";

export interface ClientProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredContact: PreferredContact;
  address: {
    street: string;
    city: string;
    zip: string;
    country: string;
  };
  marketingConsent: boolean;
  createdAt: string;
  lastRepairAt: string | null;
}

// ─── NAPRAWA (panel) ───
export type RepairStatus =
  | "new"
  | "diagnosed"
  | "wait_decision"
  | "in_progress"
  | "ready"
  | "done"
  | "cancelled";

export type DeliveryMethod = "osobiscie" | "kurier";
export type PickupMethod = "osobiscie" | "kurier";

export type DeviceCategory =
  | "Telefon"
  | "Laptop"
  | "Tablet"
  | "Komputer"
  | "Drukarka"
  | "Konsola"
  | "Inne";

export interface RepairItem {
  name: string;
  price: number | null;
}

/** Wycena wysłana do klienta (z API client_visible_quote). */
export interface ClientVisibleQuoteItem {
  id: number | string;
  description: string;
  item_type: string;
  item_type_display: string;
  part_origin?: string;
  part_origin_display?: string;
  quantity: string | number;
  parts_price: string | number;
  labour_price: string | number;
  unit_price: string | number;
  total: string | number;
}

export interface ClientVisibleQuote {
  id: string;
  version: number;
  status: string;
  status_display: string;
  total_amount: string | number;
  sent_at: string | null;
  valid_until: string | null;
  items: ClientVisibleQuoteItem[];
}

export interface ServiceInfo {
  technicianName: string | null;
  estimatedTime: string | null;
  warrantyMonths: number;
  notes: string | null;
}

export interface Repair {
  id: string;
  /** Numer zgłoszenia do wyświetlania (np. PROKOM/RMA/1/2025) */
  repairNumber: string;
  clientId: string;
  deviceCategory: DeviceCategory;
  deviceModel: string;
  problemDescription: string;
  imei: string | null;
  deliveryMethod: DeliveryMethod;
  pickupMethod: PickupMethod;
  hammerGlass: "tak" | "nie" | null;
  wantsAccessories: boolean;
  /** Tekst od klienta: co dobrać (z formularza zgłoszenia). */
  accessoryWishlist: string | null;
  clientNotes: string | null;
  deviceTurnsOn: boolean | null;
  visualConditionDescription: string | null;
  /** Numer listu przewozowego (wysyłka do serwisu) — klient może dodać w panelu. */
  clientTrackingNumber: string | null;
  status: RepairStatus;
  /** Etykieta z API (status_display / public_status) — ta sama co w panelu pracownika. */
  statusDisplay?: string | null;
  statusUpdatedAt: string;
  createdAt: string;
  priceItems: RepairItem[];
  totalPrice: number | null;
  serviceInfo: ServiceInfo;
  timeline: TimelineStep[];
  /** Ostatnia wycena widoczna dla klienta (po wysłaniu z serwisu). */
  clientVisibleQuote: ClientVisibleQuote | null;
}

export interface TimelineStep {
  key: "accepted" | "diagnosed" | "quoted" | "in_progress" | "ready" | "done";
  label: string;
  status: "done" | "active" | "future";
  date: string | null;
}

// ─── DASHBOARD ───
export interface DashboardStats {
  active: number;
  ready: number;
  waitingDecision: number;
  total: number;
}

// ─── Mapowanie statusu API → panel ───
const API_STATUS_TO_PANEL: Record<string, RepairStatus> = {
  new: "new",
  accepted: "diagnosed",
  in_diagnostics: "in_progress",
  diagnostics_done: "diagnosed",
  quote_pending: "in_progress",
  quote_sent: "wait_decision",
  quote_accepted: "in_progress",
  quote_rejected: "cancelled",
  waiting_for_parts: "in_progress",
  in_repair: "in_progress",
  repair_done: "in_progress",
  in_testing: "in_progress",
  testing_passed: "in_progress",
  testing_failed: "in_progress",
  ready_for_pickup: "ready",
  picked_up: "done",
  shipped: "done",
  delivered: "done",
  cancelled: "cancelled",
  unrepairable: "cancelled",
  abandoned: "cancelled",
};

export function apiStatusToPanelStatus(apiStatus: string): RepairStatus {
  return API_STATUS_TO_PANEL[apiStatus] ?? "new";
}

// ─── Status badge ───
export function getStatusBadgeProps(status: RepairStatus): {
  label: string;
  className: "progress" | "ready" | "done" | "wait" | "new";
} {
  switch (status) {
    case "new":
      return { label: "Zgłoszenie przyjęte", className: "new" };
    case "diagnosed":
      return { label: "W Diagnostyce", className: "wait" };
    case "wait_decision":
      return { label: "Wycena Wysłana", className: "wait" };
    case "in_progress":
      return { label: "W naprawie", className: "progress" };
    case "ready":
      return { label: "Gotowe Do Odbioru", className: "ready" };
    case "done":
      return { label: "Odebrane", className: "done" };
    case "cancelled":
      return { label: "Anulowane", className: "new" };
  }
}

// ─── Device emoji ───
const DEVICE_EMOJI: Record<DeviceCategory, string> = {
  Telefon: "📱",
  Laptop: "💻",
  Tablet: "📟",
  Komputer: "🖥",
  Drukarka: "🖨",
  Konsola: "🎮",
  Inne: "⚙️",
};

export function getDeviceEmoji(category: DeviceCategory): string {
  return DEVICE_EMOJI[category] ?? "⚙️";
}

// API device category (backend) → panel DeviceCategory
const API_CATEGORY_TO_PANEL: Record<string, DeviceCategory> = {
  phone: "Telefon",
  tablet: "Tablet",
  smartwatch: "Inne",
  laptop: "Laptop",
  desktop: "Komputer",
  printer: "Drukarka",
  console: "Konsola",
  data_recovery: "Inne",
  other: "Inne",
};

export function apiCategoryToPanelCategory(apiCategory: string | undefined): DeviceCategory {
  if (!apiCategory) return "Inne";
  return API_CATEGORY_TO_PANEL[apiCategory] ?? "Inne";
}

// ─── Ceny ───
export function formatPrice(price: number | null): string {
  if (price === null) return "do ustalenia";
  return `${price.toLocaleString("pl-PL")} zł`;
}

export function formatTotalPrice(items: RepairItem[]): string {
  const known = items.filter((i) => i.price !== null);
  if (known.length === 0) return "do ustalenia";
  const sum = known.reduce((acc, i) => acc + (i.price ?? 0), 0);
  const hasUnknown = items.some((i) => i.price === null);
  return hasUnknown ? `od ${sum.toLocaleString("pl-PL")} zł` : `${sum.toLocaleString("pl-PL")} zł`;
}
