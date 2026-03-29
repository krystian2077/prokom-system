/**
 * Adaptery API → typy panelu klienta PRO-KOM.
 * API: /api/v1/clients/me/, /api/v1/repairs/my-summary/, /api/v1/repairs/, /api/v1/repairs/:id/
 */

import type {
  ClientProfile,
  ClientVisibleQuote,
  ClientVisibleQuoteItem,
  DashboardStats,
  Repair,
  RepairItem,
  ServiceInfo,
  TimelineStep,
} from "@/types/panel";
import { apiCategoryToPanelCategory, apiStatusToPanelStatus } from "@/types/panel";
import type { PreferredContact } from "@/types/panel";

// ─── API response shapes (snake_case) ───
export interface ApiClientProfile {
  id: string;
  client_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  street?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  preferred_contact?: string;
  accepts_marketing?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ApiMySummary {
  count: number;
  by_status: Record<string, number>;
  latest_repairs: ApiRepairListItem[];
}

export interface ApiRepairListItem {
  id: string;
  repair_number: string;
  device_name: string;
  device?: { id: string; category?: string };
  status: string;
  status_display?: string;
  public_status?: string | null;
  created_at: string;
  updated_at?: string;
  delivery_method?: string;
  return_method?: string;
  estimated_cost?: number | string | null;
  final_cost?: number | string | null;
}

export interface ApiRepairDetail {
  id: string;
  repair_number: string;
  client?: string;
  device?: { id: string; category?: string; device_name?: string };
  device_name?: string;
  problem_description?: string | null;
  status: string;
  status_display?: string;
  public_status?: string | null;
  created_at: string;
  updated_at: string;
  delivery_method?: string;
  return_method?: string;
  hammer_glass_interest?: string | null;
  accessory_choose_for_me?: boolean;
  accessory_wishlist?: string | null;
  client_notes?: string | null;
  device_turns_on?: boolean | null;
  visual_condition_description?: string | null;
  client_tracking_number?: string | null;
  estimated_cost?: number | string | null;
  final_cost?: number | string | null;
  /** Szczegóły: obiekt pracownika; starsze odpowiedzi mogły zwracać sam UUID jako string. */
  assigned_to?:
    | string
    | { id: string; email?: string; first_name?: string; last_name?: string }
    | null;
  /** Termin komunikowany klientowi (widoczny w panelu klienta). */
  estimated_completion_date?: string | null;
  estimated_duration_display?: string | null;
  internal_notes?: string | null;
  quote_sent_at?: string | null;
  ready_for_pickup_at?: string | null;
  picked_up_at?: string | null;
  completed_at?: string | null;
  /** Tylko dla roli client — ostatnia wycena wysłana / rozstrzygnięta. */
  client_visible_quote?: ApiClientVisibleQuote | null;
}

export interface ApiClientVisibleQuoteItem {
  id: number | string;
  item_type: string;
  item_type_display?: string;
  description?: string;
  part_origin?: string;
  part_origin_display?: string;
  quantity?: string | number;
  parts_price?: string | number;
  labour_price?: string | number;
  unit_price?: string | number;
  total?: string | number;
}

export interface ApiClientVisibleQuote {
  id: string;
  version: number;
  status: string;
  status_display?: string;
  total_amount: string | number;
  sent_at?: string | null;
  valid_until?: string | null;
  items?: ApiClientVisibleQuoteItem[];
}

// ─── Adapters ───
function normPreferredContact(v: string | undefined): PreferredContact {
  if (v === "phone" || v === "telefon") return "telefon";
  if (v === "sms") return "sms";
  return "email";
}

export function apiClientProfileToPanel(api: ApiClientProfile): ClientProfile {
  return {
    id: api.client_number ?? api.id,
    firstName: api.first_name ?? "",
    lastName: api.last_name ?? "",
    email: api.email ?? "",
    phone: api.phone ?? "",
    preferredContact: normPreferredContact(api.preferred_contact),
    address: {
      street: api.street ?? "",
      city: api.city ?? "",
      zip: api.postal_code ?? "",
      country: api.country ?? "Polska",
    },
    marketingConsent: api.accepts_marketing ?? false,
    createdAt: api.created_at ?? new Date().toISOString(),
    lastRepairAt: null,
  };
}

export function apiMySummaryToDashboardStats(api: ApiMySummary): DashboardStats {
  const by = api.by_status ?? {};
  const total = api.count ?? 0;
  const ready = (by["ready_for_pickup"] ?? 0) as number;
  const waitingDecision = (by["quote_sent"] ?? 0) as number;
  const doneCount =
    (by["picked_up"] ?? 0) + (by["shipped"] ?? 0) + (by["delivered"] ?? 0) +
    (by["cancelled"] ?? 0) + (by["unrepairable"] ?? 0) + (by["abandoned"] ?? 0);
  const active = Math.max(0, total - doneCount);
  return {
    active,
    ready,
    waitingDecision,
    total,
  };
}

function parsePrice(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  const n = parseFloat(String(v).replace(/\s/g, ""));
  return Number.isFinite(n) ? n : null;
}

const DELIVERY_MAP_LIST: Record<string, "osobiscie" | "kurier"> = {
  in_person: "osobiscie",
  osobiscie: "osobiscie",
  courier: "kurier",
  parcel_locker: "kurier",
};

export function apiRepairListItemToPanel(api: ApiRepairListItem): Repair {
  const category = api.device?.category != null ? apiCategoryToPanelCategory(api.device.category) : "Inne";
  const totalPrice = parsePrice(api.final_cost ?? api.estimated_cost ?? null);
  return {
    id: api.id,
    repairNumber: api.repair_number ?? api.id,
    clientId: "",
    deviceCategory: category,
    deviceModel: api.device_name ?? "",
    problemDescription: "",
    imei: null,
    deliveryMethod: DELIVERY_MAP_LIST[api.delivery_method ?? ""] ?? "osobiscie",
    pickupMethod: DELIVERY_MAP_LIST[api.return_method ?? ""] ?? "osobiscie",
    hammerGlass: null,
    wantsAccessories: false,
    accessoryWishlist: null,
    clientNotes: null,
    deviceTurnsOn: null,
    visualConditionDescription: null,
    clientTrackingNumber: null,
    status: apiStatusToPanelStatus(api.status),
    statusDisplay: (api.public_status ?? api.status_display ?? "").trim() || null,
    statusUpdatedAt: api.updated_at ?? api.created_at,
    createdAt: api.created_at,
    priceItems: [],
    totalPrice,
    serviceInfo: {
      technicianName: null,
      estimatedTime: null,
      warrantyMonths: 6,
      notes: null,
    },
    timeline: [],
    clientVisibleQuote: null,
  };
}

const DELIVERY_MAP: Record<string, "osobiscie" | "kurier"> = {
  in_person: "osobiscie",
  osobiscie: "osobiscie",
  courier: "kurier",
  parcel_locker: "kurier",
};
const HAMMER_MAP: Record<string, "tak" | "nie" | null> = {
  yes: "tak",
  no: "nie",
  ask_later: null,
  free_with_quote: "tak",
};

function assignedStaffDisplayName(
  assigned: ApiRepairDetail["assigned_to"]
): string | null {
  if (assigned == null) return null;
  if (typeof assigned === "string") return null;
  const fn = (assigned.first_name ?? "").trim();
  const ln = (assigned.last_name ?? "").trim();
  const full = `${fn} ${ln}`.trim();
  return full || (assigned.email ?? "").trim() || null;
}

/** Etykieta „szacowany czas” dla klienta: data + ewentualnie zakres dni z wyceny. */
function formatServiceEstimatedTime(api: ApiRepairDetail): string | null {
  const rawDate = api.estimated_completion_date;
  const duration = (api.estimated_duration_display ?? "").trim() || null;
  let datePart: string | null = null;
  if (rawDate) {
    const d = new Date(rawDate);
    if (!Number.isNaN(d.getTime())) {
      datePart = d.toLocaleDateString("pl-PL");
    } else {
      datePart = String(rawDate).slice(0, 10);
    }
  }
  if (datePart && duration) return `${datePart} · ${duration}`;
  if (datePart) return datePart;
  if (duration) return duration;
  return null;
}

function mapClientVisibleQuote(api: ApiClientVisibleQuote | null | undefined): ClientVisibleQuote | null {
  if (!api || api.id == null) return null;
  const raw = api.items ?? [];
  const items: ClientVisibleQuoteItem[] = raw.map((it) => ({
    id: it.id,
    description: String(it.description ?? "").trim() || String(it.item_type_display ?? "Pozycja"),
    item_type: String(it.item_type ?? "other"),
    item_type_display: String(it.item_type_display ?? ""),
    part_origin: it.part_origin,
    part_origin_display: it.part_origin_display,
    quantity: it.quantity ?? 1,
    parts_price: it.parts_price ?? 0,
    labour_price: it.labour_price ?? 0,
    unit_price: it.unit_price ?? 0,
    total: it.total ?? 0,
  }));
  return {
    id: String(api.id),
    version: Number(api.version) || 1,
    status: api.status,
    status_display: String(api.status_display ?? api.status),
    total_amount: api.total_amount,
    sent_at: api.sent_at ?? null,
    valid_until: api.valid_until ?? null,
    items,
  };
}

export function apiRepairDetailToPanel(api: ApiRepairDetail): Repair {
  const category = api.device?.category != null ? apiCategoryToPanelCategory(api.device.category) : "Inne";
  const clientVisibleQuote = mapClientVisibleQuote(api.client_visible_quote ?? null);

  let totalPrice = parsePrice(api.final_cost ?? api.estimated_cost ?? null);
  const priceItems: RepairItem[] = [];

  if (clientVisibleQuote?.items?.length) {
    for (const it of clientVisibleQuote.items) {
      priceItems.push({
        name: it.description || it.item_type_display || "Pozycja",
        price: parsePrice(it.total as string | number | null),
      });
    }
    totalPrice = parsePrice(clientVisibleQuote.total_amount as string | number | null);
  } else if (api.estimated_cost != null || api.final_cost != null) {
    const p = parsePrice(api.final_cost ?? api.estimated_cost);
    priceItems.push({ name: "Naprawa", price: p });
  }
  const serviceInfo: ServiceInfo = {
    technicianName: assignedStaffDisplayName(api.assigned_to),
    estimatedTime: formatServiceEstimatedTime(api),
    warrantyMonths: 6,
    notes: api.internal_notes ?? null,
  };
  /** Oś czasu ze zmian statusu — w szczegółach naprawy ładowana z GET /repairs/:id/timeline/ (jak w panelu pracownika). */
  const timeline: TimelineStep[] = [];
  return {
    id: api.id,
    repairNumber: api.repair_number ?? api.id,
    clientId: api.client ?? "",
    deviceCategory: category,
    deviceModel: api.device_name ?? api.device?.device_name ?? "",
    problemDescription: api.problem_description ?? "",
    imei: null,
    deliveryMethod: DELIVERY_MAP[api.delivery_method ?? ""] ?? "osobiscie",
    pickupMethod: DELIVERY_MAP[api.return_method ?? ""] ?? "osobiscie",
    hammerGlass: HAMMER_MAP[api.hammer_glass_interest ?? ""] ?? null,
    wantsAccessories: api.accessory_choose_for_me ?? false,
    accessoryWishlist: (api.accessory_wishlist ?? "").trim() || null,
    clientNotes: (api.client_notes ?? "").trim() || null,
    deviceTurnsOn: api.device_turns_on ?? null,
    visualConditionDescription: (api.visual_condition_description ?? "").trim() || null,
    clientTrackingNumber: (api.client_tracking_number ?? "").trim() || null,
    status: apiStatusToPanelStatus(api.status),
    statusDisplay: (api.public_status ?? api.status_display ?? "").trim() || null,
    statusUpdatedAt: api.updated_at,
    createdAt: api.created_at,
    priceItems: priceItems.length ? priceItems : [{ name: "Wycena", price: totalPrice }],
    totalPrice,
    serviceInfo,
    timeline,
    clientVisibleQuote,
  };
}
