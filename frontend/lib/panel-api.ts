/**
 * Adaptery API → typy panelu klienta PRO-KOM.
 * API: /api/v1/clients/me/, /api/v1/repairs/my-summary/, /api/v1/repairs/, /api/v1/repairs/:id/
 */

import type { ClientProfile, DashboardStats, Repair, RepairItem, ServiceInfo, TimelineStep } from "@/types/panel";
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
  assigned_to?: string | null;
  estimated_duration_display?: string | null;
  internal_notes?: string | null;
  quote_sent_at?: string | null;
  ready_for_pickup_at?: string | null;
  picked_up_at?: string | null;
  completed_at?: string | null;
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

function buildDefaultTimeline(api: ApiRepairDetail): TimelineStep[] {
  const steps: TimelineStep[] = [
    { key: "accepted", label: "Zgłoszenie przyjęte", status: "done", date: api.created_at ?? null },
    { key: "diagnosed", label: "Bezpłatna diagnostyka", status: "future", date: null },
    { key: "quoted", label: "Wycena zaakceptowana", status: "future", date: api.quote_sent_at ?? null },
    { key: "in_progress", label: "Naprawa w toku", status: "future", date: null },
    { key: "ready", label: "Gotowe do odbioru", status: "future", date: api.ready_for_pickup_at ?? null },
    { key: "done", label: "Zakończone", status: "future", date: api.picked_up_at ?? api.completed_at ?? null },
  ];
  const statusOrder = [
    "new", "accepted", "in_diagnostics", "diagnostics_done", "quote_pending", "quote_sent", "quote_accepted",
    "waiting_for_parts", "in_repair", "repair_done", "in_testing", "testing_passed", "testing_failed",
    "ready_for_pickup", "picked_up", "shipped", "delivered",
  ];
  const idx = statusOrder.indexOf(api.status);
  for (let i = 0; i < steps.length; i++) {
    if (i < idx) steps[i].status = "done";
    else if (i === idx) steps[i].status = "active";
    else steps[i].status = "future";
  }
  if (api.quote_sent_at) {
    const q = steps.find((s) => s.key === "quoted");
    if (q) q.date = api.quote_sent_at;
  }
  if (api.ready_for_pickup_at) {
    const r = steps.find((s) => s.key === "ready");
    if (r) r.date = api.ready_for_pickup_at;
  }
  return steps;
}

export function apiRepairDetailToPanel(api: ApiRepairDetail): Repair {
  const category = api.device?.category != null ? apiCategoryToPanelCategory(api.device.category) : "Inne";
  const totalPrice = parsePrice(api.final_cost ?? api.estimated_cost ?? null);
  const priceItems: RepairItem[] = [];
  if (api.estimated_cost != null || api.final_cost != null) {
    const p = parsePrice(api.final_cost ?? api.estimated_cost);
    priceItems.push({ name: "Naprawa", price: p });
  }
  const serviceInfo: ServiceInfo = {
    technicianName: api.assigned_to ?? null,
    estimatedTime: api.estimated_duration_display ?? null,
    warrantyMonths: 6,
    notes: api.internal_notes ?? null,
  };
  const timeline = buildDefaultTimeline(api);
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
    statusUpdatedAt: api.updated_at,
    createdAt: api.created_at,
    priceItems: priceItems.length ? priceItems : [{ name: "Wycena", price: totalPrice }],
    totalPrice,
    serviceInfo,
    timeline,
  };
}
