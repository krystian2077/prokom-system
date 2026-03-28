export type InventoryDeviceCategoryValue =
  | "phone"
  | "tablet"
  | "smartwatch"
  | "laptop"
  | "desktop"
  | "printer"
  | "console"
  | "data_recovery"
  | "other"
  | (string & {});

export type InventorySupplier = {
  id: string;
  name: string;
  nip?: string | null;
  phone?: string | null;
  email?: string | null;
  website_url?: string | null;
  /** Średni czas dostawy w dniach (API: inventory.Supplier) */
  average_delivery_days?: number | null;
  is_active?: boolean;
};

import type { PartUsage } from "./repairs";

/** GET /api/v1/inventory/parts-dashboard-summary/ */
export type PartsDashboardSummary = {
  to_order: { count: number; items: PartUsage[] };
  in_transit: { count: number; items: PartUsage[] };
  arrived: { count: number; items: PartUsage[] };
};

/** GET /api/v1/inventory/parts-queue/ — pozycja kolejki części w naprawach */
export type PartUsageQueueItem = {
  id: string;
  repair: string;
  repair_number?: string | null;
  repair_device_name?: string | null;
  assigned_to_name?: string | null;
  part: { id: string; name: string; code?: string | null } | null;
  custom_part_name?: string | null;
  supplier_detail?: InventorySupplier | null;
  usage_status: string;
  usage_status_display?: string | null;
  notes?: string | null;
  created_at?: string | null;
};

/** Pełny dostawca (PATCH/POST) — SupplierSerializer */
export type InventorySupplierDetail = InventorySupplier & {
  nip?: string | null;
  street?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type InventoryPartListItem = {
  id: string;
  name: string;
  code: string;
  device_category?: InventoryDeviceCategoryValue | null;
  device_category_display?: string | null;
  brand?: string | null;
  device_model_name?: string | null;
  part_type?: string | null;
  quality_variant?: string | null;
  sell_price?: string | number | null;
  quantity_in_stock?: number | string | null;
  min_quantity?: number | string | null;
  unit?: string | null;
  category?: string | null;
  supplier?: string | null;
  supplier_name?: string | null;
  is_active?: boolean;
};

export type InventoryPartCardRecentRepair = {
  usage_id: string;
  repair_id: string;
  repair_number: string | null;
  created_at: string;
  usage_status: string;
  purchase_cost: string | null;
};

export type InventoryPartCard = {
  part: InventoryPartCardPart;
  usage_count: number;
  last_used_at: string | null;
  last_supplier: InventorySupplier | null;
  last_purchase_cost: string | null;
  most_used_supplier: InventorySupplier | null;
  most_used_supplier_id?: string | null;
  avg_purchase_cost: string | null;
  min_purchase_cost: string | null;
  max_purchase_cost: string | null;
  recent_repairs: InventoryPartCardRecentRepair[];
};

export type InventoryPartCardPart = {
  id: string;
  supplier?: InventorySupplier | null;
  supplier_name?: string | null;
  name: string;
  code: string;
  device_category?: InventoryDeviceCategoryValue | null;
  device_category_display?: string | null;
  brand?: string | null;
  device_model_name?: string | null;
  part_type?: string | null;
  quality_variant?: string | null;
  purchase_price?: string | number | null;
  sell_price?: string | number | null;
  quantity_in_stock?: string | number | null;
  min_quantity?: string | number | null;
  unit?: string | null;
  category?: string | null;
  notes?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

