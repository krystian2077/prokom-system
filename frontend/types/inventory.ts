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
  is_active?: boolean;
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

